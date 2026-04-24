"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlaybackQueue } from "./playback-queue";

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

export function useLiveSession({ wsUrl }: Options) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const playbackRef = useRef<PlaybackQueue | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

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
    if (audioCtxRef.current) {
      try {
        await audioCtxRef.current.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (phase !== "idle" && phase !== "error") return;
    setError(null);
    setUtterances([]);
    setElapsed(0);
    setPhase("requesting_mic");

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
      audioCtxRef.current = ctx;
      await ctx.audioWorklet.addModule("/worklets/pcm16-encoder.js");
      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "pcm16-encoder");
      workletRef.current = worklet;
      source.connect(worklet);
      // worklet only posts messages — do NOT connect to destination.

      const playback = new PlaybackQueue(ctx);
      playbackRef.current = playback;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "start" }));
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
              // reserved for future use
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
        // No-op; report_status messages drive the next phase.
      };

      worklet.port.onmessage = (ev: MessageEvent) => {
        const data = ev.data as { type: string; data?: string; value?: number };
        if (data.type === "audio" && data.data) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "audio", data: data.data }));
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
  }, [appendUtterance, cleanup, phase, wsUrl]);

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
      // Unmount — clean up.
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
