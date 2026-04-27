"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlaybackQueue } from "./playback-queue";
import { acquireWakeLock, type WakeLockHandle } from "@/lib/wake-lock";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length)))
    );
  }
  return btoa(binary);
}

export type CallPhase =
  | "idle"
  | "requesting_mic"
  | "connecting"
  | "live"
  | "ending"
  | "report_generating"
  | "report_ready"
  | "error";

export type Utterance = { who: "agent" | "user"; text: string };

type Options = {
  wsUrl: string;
};

type StartArgs = {
  wsUrl?: string;
};

export function useLiveSession({ wsUrl: defaultWsUrl }: Options) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const wsOpenRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const playbackRef = useRef<PlaybackQueue | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockHandle | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  const appendUtterance = useCallback((who: "agent" | "user", text: string) => {
    setUtterances((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.who === who) {
        const next = prev.slice(0, -1);
        next.push({ who, text: last.text + text });
        return next;
      }
      return [...prev, { who, text }];
    });
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        /* ignore */
      }
      wakeLockRef.current = null;
    }
    if (visibilityHandlerRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityHandlerRef.current,
      );
      visibilityHandlerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      workletRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    workletRef.current = null;
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (playbackRef.current) {
      await playbackRef.current.close();
      playbackRef.current = null;
    }
    for (const ref of [micCtxRef, playCtxRef]) {
      if (ref.current) {
        try {
          await ref.current.close();
        } catch {
          /* ignore */
        }
        ref.current = null;
      }
    }
    wsOpenRef.current = false;
    await releaseWakeLock();
  }, [releaseWakeLock]);

  const start = useCallback(
    async (args?: StartArgs) => {
      if (phase !== "idle" && phase !== "error") return;
      setError(null);
      setUtterances([]);
      setElapsed(0);
      setPhase("requesting_mic");

      const effectiveWsUrl = args?.wsUrl ?? defaultWsUrl;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        streamRef.current = stream;

        setPhase("connecting");

        const ctx = new AudioContext();
        micCtxRef.current = ctx;
        if (ctx.state !== "running") {
          try {
            await ctx.resume();
          } catch {
            /* ignore */
          }
        }
        console.log(
          `[CLIENT] AudioContext rate=${ctx.sampleRate} state=${ctx.state}`
        );

        await ctx.audioWorklet.addModule(
          `/worklets/pcm16-encoder.js?v=${Date.now()}`
        );
        const source = ctx.createMediaStreamSource(stream);
        const worklet = new AudioWorkletNode(ctx, "pcm16-encoder");
        workletRef.current = worklet;
        source.connect(worklet);

        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        worklet.connect(silentGain).connect(ctx.destination);

        const playback = new PlaybackQueue(ctx);
        playbackRef.current = playback;

        const ws = new WebSocket(effectiveWsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          wsOpenRef.current = true;
          ws.send(JSON.stringify({ type: "start" }));

          const handle = await acquireWakeLock();
          if (handle) {
            wakeLockRef.current = handle;
            const onVisibility = async () => {
              if (
                document.visibilityState === "visible" &&
                wsOpenRef.current &&
                !wakeLockRef.current
              ) {
                const reacquired = await acquireWakeLock();
                if (reacquired) wakeLockRef.current = reacquired;
              }
            };
            visibilityHandlerRef.current = onVisibility;
            document.addEventListener("visibilitychange", onVisibility);
          }
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            switch (msg.type) {
              case "session":
                setSessionId(msg.id);
                break;
              case "ready":
                setPhase("live");
                startTimeRef.current = Date.now();
                timerRef.current = window.setInterval(() => {
                  setElapsed(
                    Math.floor((Date.now() - startTimeRef.current) / 1000)
                  );
                }, 500);
                break;
              case "audio":
                playback.enqueue(msg.data);
                break;
              case "interrupted":
                playback.flush();
                break;
              case "transcript":
                appendUtterance(msg.who, msg.text);
                break;
              case "language":
                break;
              case "end_signal":
                setPhase("ending");
                break;
              case "report_status":
                if (msg.status === "generating") setPhase("report_generating");
                if (msg.status === "ready") setPhase("report_ready");
                if (msg.status === "failed") {
                  setPhase("error");
                  setError(msg.error ?? "report failed");
                }
                break;
              case "error":
                setError(msg.message);
                setPhase("error");
                break;
            }
          } catch (e) {
            console.error("[CLIENT] bad message", e);
          }
        };

        ws.onerror = () => {
          setError("connection error");
          setPhase("error");
        };

        ws.onclose = () => {
          wsOpenRef.current = false;
          void releaseWakeLock();
        };

        let audioFramesSent = 0;
        worklet.port.onmessage = (ev: MessageEvent) => {
          const data = ev.data as {
            type: string;
            buffer?: ArrayBuffer;
            value?: number;
          };
          if (data.type === "audio" && data.buffer) {
            if (ws.readyState === WebSocket.OPEN) {
              const b64 = arrayBufferToBase64(data.buffer);
              ws.send(JSON.stringify({ type: "audio", data: b64 }));
              audioFramesSent++;
              if (audioFramesSent === 1) {
                console.log("[CLIENT] first audio frame sent to WS");
              } else if (audioFramesSent % 50 === 0) {
                console.log(`[CLIENT] audio frames sent: ${audioFramesSent}`);
              }
            }
          } else if (data.type === "level" && typeof data.value === "number") {
            setLevel(data.value);
          }
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setPhase("error");
        await cleanup();
      }
    },
    [appendUtterance, cleanup, defaultWsUrl, phase, releaseWakeLock],
  );

  const end = useCallback(async () => {
    setPhase("ending");
    try {
      wsRef.current?.send(JSON.stringify({ type: "end" }));
    } catch {
      /* ignore */
    }
    await cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      void cleanup();
    };
  }, [cleanup]);

  return {
    phase,
    sessionId,
    utterances,
    level,
    elapsed,
    error,
    start,
    end,
  };
}
