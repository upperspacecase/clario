# Hours — voice-driven AI opportunity assessment

Voice agent for owners of small and mid-sized businesses. You call, describe
how your business runs, and get a written report of practical tools and
next steps — in your own language.

## Architecture (prototype)

```
┌──────────┐   WSS   ┌─────────────┐   Live API   ┌──────────────────────┐
│ Browser  │◀───────▶│  Node WS    │◀────────────▶│ Gemini 3.1 Flash Live│
│ /        │         │  server     │              │   (audio in/out)     │
│ /report  │  HTTP   │  :3043      │   HTTPS      ┌──────────────────────┐
│          │◀───────▶│             │◀────────────▶│ Gemini 3 Pro         │
└──────────┘         └─────────────┘              │ (report, w/ thinking)│
                                                  └──────────────────────┘
```

- Browser mic → AudioWorklet downsamples to PCM16 16 kHz LE → base64 WS frames.
- Node relays to Gemini Live. Live streams PCM16 24 kHz LE back, plus input/output transcripts.
- User clicks End (or model calls `end_interview`). Node finalises the session, calls Gemini 3 Pro with the full transcript, stores a structured report in memory.
- `/report/[sessionId]` polls the Node server for the finished report and renders it with a Download button (standalone HTML).

No Firestore, no knowledge base JSON, no tool lookup — the Pro model uses its own knowledge of real tools for recommendations.

## Setup

```bash
npm install
# Pull the Gemini key into .env.local (1Password CLI; never echoed to stdout)
op read "op://Dev/VoiceAgentTest-GEMINI_API_KEY/credential" | \
  awk '{ printf "GEMINI_API_KEY=%s\n", $0 }' > .env.local
chmod 600 .env.local
```

`.env.local` should also load in both Next (auto) and the Node server
(via `dotenv` in `server/live.ts`).

### Required env vars

See `.env.example`. Minimum:

```
GEMINI_API_KEY=...
```

Optional overrides:

```
LIVE_WS_PORT=3043
LIVE_MODEL=gemini-3.1-flash-live-preview
REPORT_MODEL=gemini-3-pro
LIVE_VOICE=Kore    # Current default. Audition Aoede / Puck / Charon / Kore / Fenrir to pick the most British-sounding voice.
NEXT_PUBLIC_WS_URL=ws://localhost:3043     # browser connects here
NEXT_PUBLIC_API_BASE=http://localhost:3043 # report route fetches here
```

## Run

Two processes, two terminals:

```bash
# terminal 1 — Next.js on :3041
npm run dev

# terminal 2 — Node WS + HTTP on :3043
npm run server
```

Open `http://localhost:3041`, click **Call now**, allow the mic, talk for a
few minutes, hit End on the phone, watch the report generate.

## File tour

```
app/
  page.tsx                      server wrapper
  report/[sessionId]/
    page.tsx                    server wrapper
    ReportView.tsx              client; polls API; renders; download button

components/
  HomeHero.tsx                  client; owns call state + renders hero
  PhoneStage.tsx                responsive iPhone wrapper
  CallScreen.tsx                inside-phone UI (status, transcript, End btn)
  Waveform.tsx / WaveformPlayer.tsx
                                Remotion waveform visualiser
  use-live-session.ts           client hook: WS + mic + playback
  playback-queue.ts             AudioBufferSourceNode chain + barge-in flush
  ui/iphone-mockup.tsx          the shadcn-style primitive

public/worklets/pcm16-encoder.js
                                AudioWorklet: 16 kHz PCM16 LE + RMS level

server/
  live.ts                       WS relay + HTTP /api/* + lifecycle
  report.ts                     Phase 2 — Gemini 3 Pro w/ thinking + schema
  session-store.ts              in-memory session + transcript + report store
  system-instruction.ts         editable prompt for the interview agent
  tools.ts                      function declarations (end_interview only)
```

## Swap or tune the system instruction

Edit `server/system-instruction.ts` and restart the server. The Live model
re-reads it on the next `ai.live.connect()` call.

## Known limits (prototype)

- Sessions are capped at ~15 min audio by the API. Session resumption is
  wired but a long drop during the interview means the current prototype
  will still generate a report from whatever transcript landed before the drop.
- In-memory session store resets on server restart.
- One Node process = one set of concurrent sessions. Fine for a demo.
- The Pro model is instructed to omit URLs it isn't certain about. You'll
  sometimes see only tool names without links. That's intentional — don't
  let it invent URLs.
