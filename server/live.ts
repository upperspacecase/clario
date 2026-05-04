// WebSocket relay: browser <-> Node <-> Gemini Live API.
// One browser WS = one Gemini Live session. Transcript turns stream to
// Firestore as they arrive. Report generation lives in the local skill
// pipeline (see CLAUDE.md), NOT here — this server's job ends at flushing
// the transcript and recording call end timestamps.

import { config as loadDotenv } from "dotenv";
// Prefer .env.local (Next convention); fall back to .env.
loadDotenv({ path: ".env.local" });
loadDotenv();

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from "@google/genai";
import { randomUUID } from "crypto";
import { buildSystemInstruction } from "./system-instruction.js";
import { TOOL_DECLARATIONS } from "./tools.js";
import { TranscriptBuffer } from "./firestore-writer.js";
import { verifyVoiceSessionToken } from "../lib/voice-token.js";
import { adminDb } from "../lib/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";

const PORT = Number(process.env.LIVE_WS_PORT ?? 3043);
const MODEL = process.env.LIVE_MODEL ?? "gemini-3.1-flash-live-preview";
const VOICE = process.env.LIVE_VOICE ?? "Kore";
const AGENT_NAME = process.env.LIVE_AGENT_NAME ?? "Iris";

if (!process.env.GEMINI_API_KEY) {
  console.error("[SERVER] GEMINI_API_KEY missing — aborting");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ------- HTTP server (health only) -------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders,
  });
  res.end(JSON.stringify(body));
}

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, model: MODEL, voice: VOICE });
    return;
  }

  sendJson(res, 404, { error: "not_found" });
});

// ------- WebSocket server -------

const wss = new WebSocketServer({ server: httpServer });

type ClientToServer =
  | { type: "start"; language?: string }
  | { type: "audio"; data: string } // base64 PCM16 16k LE
  | { type: "text"; text: string }
  | { type: "end" }; // user hit End-call

type ServerToClient =
  | { type: "session"; id: string }
  | { type: "ready" }
  | { type: "audio"; data: string } // base64 PCM16 24k LE
  | { type: "transcript"; who: "agent" | "user"; text: string }
  | { type: "interrupted" }
  | { type: "turn_complete" }
  | { type: "language"; language: string }
  | { type: "end_signal"; reason: string } // model called end_interview tool
  | { type: "error"; message: string };

function send(ws: WebSocket, msg: ServerToClient) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

wss.on("connection", async (ws, req) => {
  const sessionId = nanoid(12);
  let liveSession: Session | null = null;
  let endTriggered = false;
  let kickoffSent = false;
  let audioFramesFromClient = 0;
  let audioFramesToGemini = 0;
  let audioFramesFromGemini = 0;

  let assessmentId: string | null = null;
  let shareId: string | null = null;
  let voiceSessionUuid: string | null = null;
  let currentSessionHandle = "";
  let transcriptBuffer: TranscriptBuffer | null = null;
  const clientConnectedAtMs = Date.now();

  const reqUrl = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const token = reqUrl.searchParams.get("token");

  console.log(`[SERVER] WS opened session=${sessionId} token=${token ? "yes" : "no"}`);

  // Kick off async setup (token verify + Firestore read) but DO NOT await it
  // here — message and close listeners must be registered synchronously so
  // the client's `start` message isn't lost during the setup window.
  let setupRejected: string | null = null;
  const setupPromise = (async () => {
    if (!token) {
      console.warn(
        `[SERVER] session=${sessionId} no token — Firestore writes disabled`,
      );
      return;
    }
    try {
      const payload = await verifyVoiceSessionToken(token);
      assessmentId = payload.assessmentId;
      shareId = payload.shareId;
      voiceSessionUuid = randomUUID();
      currentSessionHandle = voiceSessionUuid;
      transcriptBuffer = new TranscriptBuffer(assessmentId);
      transcriptBuffer.startAutoFlush(500);
      console.log(
        `[SERVER] session=${sessionId} verified assessment=${assessmentId} share=${shareId}`,
      );
    } catch (e) {
      setupRejected = e instanceof Error ? e.message : String(e);
      console.warn(`[SERVER] session=${sessionId} invalid token: ${setupRejected}`);
      try { ws.close(4401, "invalid_token"); } catch {}
      return;
    }
    try {
      const docRef = adminDb().collection("assessments").doc(assessmentId!);
      await docRef.update({
        voiceSessionId: voiceSessionUuid,
        callStartedAt: FieldValue.serverTimestamp(),
      });
      console.log(
        `[FIRESTORE] assessment marked in_call assessment=${assessmentId} voiceSessionId=${voiceSessionUuid}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[FIRESTORE] connect-time update failed assessment=${assessmentId}:`,
        msg,
      );
    }
  })();

  send(ws, { type: "session", id: sessionId });

  const endCall = (reason: string) => {
    if (endTriggered) return;
    endTriggered = true;
    send(ws, { type: "end_signal", reason });
    try {
      liveSession?.close();
    } catch {
      /* ignore */
    }
  };

  let reconnecting = false;
  const reconnectWithResume = async () => {
    if (reconnecting || endTriggered) return;
    if (!currentSessionHandle) {
      console.warn(
        `[GEMINI-LIVE] goAway but no resume handle yet session=${sessionId} — letting call drop`,
      );
      return;
    }
    reconnecting = true;
    try {
      console.log(
        `[GEMINI-LIVE] reconnecting with resume handle session=${sessionId}`,
      );
      await openLive(currentSessionHandle);
    } finally {
      reconnecting = false;
    }
  };

  const openLive = async (resumeHandle?: string) => {
    try {
      console.log(
        `[GEMINI-LIVE] open session=${sessionId} model=${MODEL} voice=${VOICE} resume=${resumeHandle ? "yes" : "no"}`,
      );
      const systemInstruction = buildSystemInstruction({
        agentName: AGENT_NAME,
      });
      let myReconnectTriggered = false;
      const newSession = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
        },
        callbacks: {
          onopen: () => {
            console.log(
              `[GEMINI-LIVE] open session=${sessionId} resume=${resumeHandle ? "yes" : "no"}`,
            );
            if (!resumeHandle) send(ws, { type: "ready" });
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Debug: surface the shape of every non-audio message.
            const summary = {
              setupComplete: !!msg.setupComplete,
              hasModelTurn: !!msg.serverContent?.modelTurn,
              modelTurnParts: msg.serverContent?.modelTurn?.parts?.length ?? 0,
              input: !!msg.serverContent?.inputTranscription,
              output: !!msg.serverContent?.outputTranscription,
              interrupted: !!msg.serverContent?.interrupted,
              turnComplete: !!msg.serverContent?.turnComplete,
              toolCall: !!msg.toolCall,
              goAway: !!msg.goAway,
            };
            if (
              summary.setupComplete ||
              summary.input ||
              summary.output ||
              summary.turnComplete ||
              summary.toolCall ||
              summary.goAway
            ) {
              console.log(
                `[GEMINI-LIVE] msg session=${sessionId}`,
                JSON.stringify(summary)
              );
            }

            const newHandle = (
              msg as LiveServerMessage & {
                sessionResumptionUpdate?: { newHandle?: string };
              }
            ).sessionResumptionUpdate?.newHandle;
            if (newHandle && assessmentId) {
              currentSessionHandle = newHandle;
              try {
                await adminDb()
                  .collection("assessments")
                  .doc(assessmentId)
                  .update({
                    voiceSessionHandles: FieldValue.arrayUnion(newHandle),
                  });
              } catch (e) {
                const errMsg = e instanceof Error ? e.message : String(e);
                console.error(
                  `[FIRESTORE] failed to append voiceSessionHandle assessment=${assessmentId}:`,
                  errMsg,
                );
              }
            }

            // Gemini is asking us to migrate to a fresh session. Open a new
            // one with the latest resume handle so we keep context across the
            // ~15min hard limit. Quick (~15min) calls won't normally see this.
            if (msg.goAway && !myReconnectTriggered && !endTriggered) {
              myReconnectTriggered = true;
              void reconnectWithResume();
            }

            // Send the kickoff as soon as Gemini acknowledges setup. Skip on
            // resumed sessions — Gemini restores prior context, so a fresh
            // greeting would be jarring.
            if (
              msg.setupComplete &&
              !resumeHandle &&
              !kickoffSent &&
              liveSession
            ) {
              kickoffSent = true;
              try {
                liveSession.sendClientContent({
                  turns: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: "[The user is now connected. Begin Phase 0 of your contract.]",
                        },
                      ],
                    },
                  ],
                  turnComplete: true,
                });
                console.log(
                  `[GEMINI-LIVE] kickoff sent post-setup session=${sessionId}`
                );
              } catch (e) {
                console.error("[GEMINI-LIVE] kickoff failed:", e);
              }
            }

            // Audio out (PCM16 24k LE base64)
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  audioFramesFromGemini++;
                  if (audioFramesFromGemini % 20 === 1) {
                    console.log(
                      `[GEMINI-LIVE] audio from gemini session=${sessionId} frames=${audioFramesFromGemini}`
                    );
                  }
                  send(ws, { type: "audio", data: part.inlineData.data });
                }
              }
            }

            // Transcriptions
            const inputT = msg.serverContent?.inputTranscription?.text;
            if (inputT) {
              send(ws, { type: "transcript", who: "user", text: inputT });
              if (transcriptBuffer) {
                transcriptBuffer.push({
                  role: "user",
                  text: inputT,
                  sessionHandle: currentSessionHandle,
                  isFinal: !!msg.serverContent?.turnComplete,
                });
              }
            }

            const outputT = msg.serverContent?.outputTranscription?.text;
            if (outputT) {
              send(ws, { type: "transcript", who: "agent", text: outputT });
              if (transcriptBuffer) {
                transcriptBuffer.push({
                  role: "agent",
                  text: outputT,
                  sessionHandle: currentSessionHandle,
                  isFinal: !!msg.serverContent?.turnComplete,
                });
              }
            }

            // Barge-in
            if (msg.serverContent?.interrupted) {
              send(ws, { type: "interrupted" });
            }

            if (msg.serverContent?.turnComplete) {
              send(ws, { type: "turn_complete" });
            }

            // Tool calls
            const toolCall = msg.toolCall;
            if (toolCall?.functionCalls && liveSession) {
              const responses = [];
              for (const fc of toolCall.functionCalls) {
                if (fc.name === "end_interview") {
                  const reason =
                    (fc.args as { reason?: string } | undefined)?.reason ??
                    "agent_ended";
                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: "ok" },
                  });
                  queueMicrotask(() => endCall(reason));
                } else {
                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { error: "unknown_tool" },
                  });
                }
              }
              try {
                liveSession.sendToolResponse({ functionResponses: responses });
              } catch (e) {
                console.error("[GEMINI-LIVE] sendToolResponse failed:", e);
              }
            }
          },
          onerror: (e) => {
            console.error(
              `[GEMINI-LIVE] error session=${sessionId}:`,
              e.message
            );
            send(ws, { type: "error", message: e.message });
          },
          onclose: (e) => {
            console.log(
              `[GEMINI-LIVE] close session=${sessionId} reason=${e.reason}`
            );
          },
        },
      });

      // Swap atomically: client audio frames sent during the brief overlap
      // window may be dropped by the closing session, but the new session is
      // ready to receive immediately afterwards.
      const oldSession = liveSession;
      liveSession = newSession;
      if (oldSession) {
        try {
          oldSession.close();
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[GEMINI-LIVE] connect failed session=${sessionId}:`, msg);
      send(ws, { type: "error", message: msg });
    }
  };

  ws.on("message", async (raw) => {
    let msg: ClientToServer;
    try {
      msg = JSON.parse(raw.toString()) as ClientToServer;
    } catch {
      return send(ws, { type: "error", message: "bad_json" });
    }

    // Wait for setup (token verify + Firestore prefetch) before handling any
    // message. The client's `start` arrives within milliseconds of WS open;
    // setup may still be running.
    await setupPromise;
    if (setupRejected) return;

    if (msg.type === "start") {
      if (!liveSession) await openLive();
      return;
    }

    if (msg.type === "audio" && liveSession) {
      audioFramesFromClient++;
      if (audioFramesFromClient === 1) {
        console.log(
          `[CLIENT] first audio frame received session=${sessionId}`
        );
      }
      try {
        liveSession.sendRealtimeInput({
          audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
        });
        audioFramesToGemini++;
        if (audioFramesToGemini % 50 === 1) {
          console.log(
            `[GEMINI-LIVE] audio forwarded session=${sessionId} frames=${audioFramesToGemini}`
          );
        }
      } catch (e) {
        console.error("[GEMINI-LIVE] sendRealtimeInput failed:", e);
      }
      return;
    }

    if (msg.type === "text" && liveSession) {
      try {
        liveSession.sendClientContent({
          turns: [{ role: "user", parts: [{ text: msg.text }] }],
          turnComplete: true,
        });
      } catch (e) {
        console.error("[GEMINI-LIVE] sendClientContent failed:", e);
      }
      return;
    }

    if (msg.type === "end") {
      console.log(`[SERVER] user end session=${sessionId}`);
      endCall("user_ended");
      return;
    }
  });

  ws.on("close", async () => {
    console.log(`[SERVER] WS closed session=${sessionId}`);
    await setupPromise.catch(() => undefined);
    if (!endTriggered) endCall("client_disconnect");

    if (transcriptBuffer) {
      transcriptBuffer.stopAutoFlush();
      try {
        await transcriptBuffer.flush();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(
          `[FIRESTORE] final flush failed assessment=${assessmentId}:`,
          msg,
        );
      }
    }

    if (assessmentId) {
      const callDurationSec = Math.max(
        0,
        Math.round((Date.now() - clientConnectedAtMs) / 1000),
      );
      try {
        await adminDb()
          .collection("assessments")
          .doc(assessmentId)
          .update({
            callEndedAt: FieldValue.serverTimestamp(),
            callDurationSec,
          });
        console.log(
          `[FIRESTORE] assessment call ended assessment=${assessmentId} durationSec=${callDurationSec}`,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(
          `[FIRESTORE] failed to update assessment on close assessment=${assessmentId}:`,
          msg,
        );
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `[SERVER] listening http+ws on :${PORT} (model=${MODEL} voice=${VOICE})`
  );
});
