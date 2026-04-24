# Testing — Clario voice prototype

Five manual tests. All run locally against `npm run dev` + `npm run server`.
Each includes what to check and how to tell whether it passed.

## Pre-req

- `.env.local` has a valid `GEMINI_API_KEY`.
- `npm run server` is printing `[SERVER] listening http+ws on :3043`.
- `curl http://localhost:3043/health` returns `{"ok":true,...}`.
- `npm run dev` is running on `:3041`.
- You have a working microphone and speakers/headphones.

## Test (a) — English interview end-to-end

1. Open `http://localhost:3041`. Headline should read "Tools that fit your business."
2. Click **Call now**. Browser prompts for mic; allow.
3. Say (in English): *"Hi, I run a small online coaching business. Two coaches. I'm stuck on a lot of admin."*
4. Let the agent ask its questions. Answer naturally for ~5 minutes.
5. When the agent starts summarising, let it finish. It should call `end_interview` on its own, OR tap the red End button on the phone.

**Pass if:**
- Transcript bubbles appeared inside the phone in real time (both agent cream-card and your terracotta bubbles).
- Agent audio was audible and natural.
- After End, the phone status changed to "Writing report…" and the page auto-redirected to `/report/<sessionId>`.
- `/report/<sessionId>` rendered a structured report in English with three problems, 30-day plan, and watch-items.
- Clicking **Download** saved a standalone `clario-report-*.html` file.

## Test (b) — Portuguese interview end-to-end

Same as (a), but open the call and start speaking in Portuguese:

*"Olá, tenho uma padaria pequena em Lisboa. Preciso de ajuda com gestão de stock e comunicação com clientes."*

**Pass if:**
- The agent continues in Portuguese for the whole call.
- The rendered report at `/report/<sessionId>` is entirely in Portuguese (header says `Language · PT`).
- Tool recommendations are real products (e.g. Toast, TOTVS, Jungle, Taguspark, or generic SaaS — not invented names).

## Test (c) — Barge-in mid-turn

1. Start a call. Let the agent begin speaking a longer response.
2. While the agent is still talking, start talking yourself.

**Pass if:**
- The agent's audio stops (or drops volume instantly) within ~300 ms of you starting to talk.
- Your voice is picked up and transcribed.
- The agent's next turn is a response to what YOU just said, not a continuation of its interrupted sentence.

Under the hood: server forwards `server_content.interrupted=true`; client calls `playbackQueue.flush()` which stops all queued `AudioBufferSourceNode`s.

## Test (d) — end_interview tool fires cleanly

1. Start a call. Tell the agent you only have a minute and want to wrap up fast: *"I have only a minute — give me the short version."*
2. Answer briefly. Let the agent wrap and summarise.

**Pass if:**
- The server logs print `[GEMINI-LIVE]` tool call, and the client enters the `ending` phase without you pressing the End button.
- The report is generated just as in (a).
- The server log shows `[GEMINI-REPORT] session=... ready`.

## Test (e) — Report generation in two languages, same schema

1. Run (a) with English input.
2. Immediately after, run (b) with Portuguese input.
3. Open both reports in separate tabs.

**Pass if:**
- Both reports have the same structure (Executive summary, Business snapshot, 3 Problems, 30-day plan, Watch-items).
- Both reports' language matches the interview language.
- Both reports' tool recommendations are real and relevant.
- The **Download** button produces two distinct `.html` files, each standalone.

## Known failure modes to watch for

- **Mic unavailable**: browser blocks or device absent → hero shows `"Mic permission…"` or the CTA flips to an error state with a retry.
- **WS unreachable**: server not running → browser console error, hero shows `connection error`.
- **Live session token expires mid-call**: session resumption is configured; a brief audio gap may occur, transcript continues.
- **Pro model returns invalid JSON**: caught in `report.ts` and surfaced as `reportStatus: "failed"` on the report page.
