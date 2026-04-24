// WebSocket relay: browser <-> Node <-> Gemini Live API.
// One browser WS = one Gemini Live session. In-memory session state.

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
import { SYSTEM_INSTRUCTION } from "./system-instruction.js";
import { TOOL_DECLARATIONS } from "./tools.js";
import { sessionStore } from "./session-store.js";
import { generateReport } from "./report.js";

const PORT = Number(process.env.LIVE_WS_PORT ?? 3043);
const MODEL = process.env.LIVE_MODEL ?? "gemini-3.1-flash-live-preview";
const VOICE = process.env.LIVE_VOICE ?? "Aoede";

if (!process.env.GEMINI_API_KEY) {
  console.error("[SERVER] GEMINI_API_KEY missing — aborting");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ------- HTTP server (CORS + report fetch) -------

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

  const sessionMatch = url.pathname.match(/^\/api\/session\/([\w-]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const s = sessionStore.get(sessionMatch[1]);
    if (!s) return sendJson(res, 404, { error: "not_found" });
    sendJson(res, 200, {
      id: s.id,
      language: s.language,
      transcript: s.transcript,
      endedAt: s.endedAt,
      reportStatus: s.reportStatus,
      reportError: s.reportError ?? null,
    });
    return;
  }

  const reportMatch = url.pathname.match(/^\/api\/report\/([\w-]+)$/);
  if (req.method === "GET" && reportMatch) {
    const s = sessionStore.get(reportMatch[1]);
    if (!s) return sendJson(res, 404, { error: "not_found" });
    sendJson(res, 200, {
      id: s.id,
      language: s.language,
      reportStatus: s.reportStatus,
      reportError: s.reportError ?? null,
      report: s.report,
      transcript: s.transcript,
    });
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
  | { type: "report_status"; status: string; error?: string }
  | { type: "error"; message: string };

function send(ws: WebSocket, msg: ServerToClient) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

wss.on("connection", async (ws) => {
  const sessionId = nanoid(12);
  const session = sessionStore.create(sessionId);
  let liveSession: Session | null = null;
  let endTriggered = false;

  console.log(`[SERVER] WS connected session=${sessionId}`);
  send(ws, { type: "session", id: sessionId });

  const finalizeReport = async (reason: string) => {
    if (endTriggered) return;
    endTriggered = true;

    sessionStore.markEnded(sessionId);
    send(ws, { type: "end_signal", reason });
    send(ws, { type: "report_status", status: "generating" });
    sessionStore.setReportStatus(sessionId, "generating");

    try {
      const report = await generateReport(session);
      sessionStore.setReport(sessionId, report);
      send(ws, { type: "report_status", status: "ready" });
      console.log(`[GEMINI-REPORT] session=${sessionId} ready`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      sessionStore.setReportStatus(sessionId, "failed", msg);
      send(ws, { type: "report_status", status: "failed", error: msg });
      console.error(`[GEMINI-REPORT] session=${sessionId} failed:`, msg);
    }

    try {
      liveSession?.close();
    } catch {
      /* ignore */
    }
  };

  const openLive = async () => {
    try {
      console.log(
        `[GEMINI-LIVE] open session=${sessionId} model=${MODEL} voice=${VOICE}`
      );
      liveSession = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          contextWindowCompression: {
            triggerTokens: "25600",
            slidingWindow: {},
          },
          sessionResumption: {},
        },
        callbacks: {
          onopen: () => {
            console.log(`[GEMINI-LIVE] open session=${sessionId}`);
            send(ws, { type: "ready" });
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio out (PCM16 24k LE base64)
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  send(ws, { type: "audio", data: part.inlineData.data });
                }
              }
            }

            // Transcriptions
            const inputT = msg.serverContent?.inputTranscription?.text;
            if (inputT) {
              sessionStore.appendTranscript(sessionId, {
                who: "user",
                text: inputT,
                ts: Date.now(),
              });
              send(ws, { type: "transcript", who: "user", text: inputT });
            }

            const outputT = msg.serverContent?.outputTranscription?.text;
            if (outputT) {
              sessionStore.appendTranscript(sessionId, {
                who: "agent",
                text: outputT,
                ts: Date.now(),
              });
              send(ws, { type: "transcript", who: "agent", text: outputT });
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
                  // Finalize after the current model turn finishes playing
                  // out to the client. The client will also ACK end.
                  queueMicrotask(() => finalizeReport(reason));
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

    if (msg.type === "start") {
      if (msg.language) sessionStore.setLanguage(sessionId, msg.language);
      if (!liveSession) await openLive();
      return;
    }

    if (msg.type === "audio" && liveSession) {
      try {
        liveSession.sendRealtimeInput({
          audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
        });
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
      await finalizeReport("user_ended");
      return;
    }
  });

  ws.on("close", async () => {
    console.log(`[SERVER] WS closed session=${sessionId}`);
    if (!endTriggered) {
      // If user just closed the tab mid-call and we have some transcript,
      // still try to generate a report.
      if (session.transcript.length >= 2) {
        await finalizeReport("client_disconnect");
      } else {
        sessionStore.markEnded(sessionId);
      }
    }
    try {
      liveSession?.close();
    } catch {
      /* ignore */
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `[SERVER] listening http+ws on :${PORT} (model=${MODEL} voice=${VOICE})`
  );
});
