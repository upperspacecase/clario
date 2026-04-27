# Audit — Clario (pre-deploy)

## 6a. CMO Copy Audit
- **Headline:** "Five minutes on the phone. Three AI tools that fit your restaurant." — ✅ visualizable, verifiable (five minutes, three tools), passes Dry's "could a competitor sign this?" test (no one else is shipping voice-first AI advisory for non-English-speaking restaurants).
- **Spanish subhead:** "Cinco minutos al teléfono. Tres herramientas de IA que se adaptan a tu restaurante." — ✅ present, italic, audience-language.
- **Sub-headline paragraph:** names specific losses ("reservations, reviews, waste, staff") and promises a concrete deliverable ("plain-language report you can try this week"). ✅
- **CTA label:** "Get my call back" — ✅ action-in-user-voice, not "Sign up" or "Join waitlist." Anchored to existing mental model (callback).
- **Commitment line:** "We call within 24 hours, or we don't ask for your number again." — ✅ removes the cost of giving up a phone number.
- **Honesty caveat (logo strip):** "Not affiliated. Tools Clario may recommend." — ✅ present, per skill rule on external brand marks.
- **Pre-launch badge:** "Pre-launch · Early-access waitlist" — ✅ present, top of hero in olive caps.
- **AI-slop audit:** No banned filler words ("simply," "just," "truly," "actually," "every"). ✅
- **CMO override log:** bilingual hero + specific transcript dialogue taken from mockup; CTA label taken from CMO (mockup had placeholder "Call-accent-action"). Logged in `_design_ref/notes.md`.

## 6b. Visual QA
**Method:** Production build served on `localhost:3041`. Headless Chrome captured three screenshots at 1440×900 (hero), 1440×2000 (full), 390×1600 (mobile). Compared side-by-side with `_design_ref/mockup_v1.jpeg`.

### Hero — `qa_screenshots/hero_final.png`
- Asymmetric two-column grid: left hero copy, right waveform + transcript card. ✅
- Headline in heavy serif (Playfair Black), 4 lines, ink-black. ✅
- Italic Spanish subhead below in olive-soft. ✅
- Form row: language dropdown → phone field → terracotta CTA button. All three visible on one row on desktop. ✅
- Olive-gold waveform rendering via Remotion Player at top-right. ✅ (not a blank box — `WaveformStill` fallback renders before hydration so the region is never empty.)
- Transcript card: mic badge on olive circle top-left, three dialogue lines fully visible (CLARIO → USUARIO → CLARIO), olive progress bar + "0:05 / 5:00" at bottom. ✅
- Pre-launch badge in olive caps at the very top of hero. ✅

### Full page — `qa_screenshots/full_final.png`
- All three recommendation cards visible below the transcript: RESERVATIONS / REVIEWS / SOCIAL. ✅
- Each card has olive icon circle, uppercase tracked label, body copy, "AI Tools: …" line. ✅
- Paragraph under the form describing callback + language coverage. ✅
- Logo strip renders as real `simple-icons` SVG paths (not text inside SVG): Instagram, Square, Canva, WhatsApp, Google. ✅
- "Not affiliated. Tools Clario may recommend." caveat centered above logos. ✅
- Footer: 4 dot-separated text links. ✅
- No drop shadows, no gradients, no glassmorphism, no feature grid. ✅ (stays within the 4-region spec)

### Mobile — `qa_screenshots/mobile_final.png`
- Hero stacks single-column at 390px width. ✅
- Form fields stack vertically; CTA button is full-width terracotta. ✅
- Demo section (waveform + transcript + cards) moves below hero copy. ✅
- Type scales down via `clamp()` — no horizontal overflow. ✅

### Mockup parity check
- Palette: cream `#F8F2E6`, ink `#1E1A14`, olive `#A28A43`, terracotta `#C05A3E`. Matches mockup within perceptual tolerance. ✅
- Type: Playfair Display Black headline + Karla body — consistent with mockup's editorial serif + clean sans pairing. ✅
- Composition anchor: olive waveform + speech-bubble transcript = the single visual focal point. ✅

### Issues fixed during audit
- **Pinchtab** daemon wouldn't start cleanly. Fell back to headless Chrome for screenshotting. (Tool fallback, not a page bug.)
- **First screenshot pass** had delayed-reveal animations keeping transcript lines and cards at opacity 0 past the virtual-time-budget. Fixed by shortening delays to <1s and using `animation-fill-mode: both` so stale paints still show final state.
- **Headline font-size** was clamping too large (104px max) causing 5–7 wrapping lines in the left hero column. Tuned clamp to 84px max for a 4-line hero that matches the mockup's rhythm.
- **CTA button** was wrapping its label on narrow desktops. Added `whitespace-nowrap` + `shrink-0`.
- **simple-icons**: OpenTable has no entry in SimpleIcons. Swapped to Instagram (equally relevant for restaurant social presence). Recommendation card *text* still references OpenTable/Resy/SevenRooms as a concrete tool list.
- **Next.js** bumped from 14.2.15 (vulnerable) → 16.2.4 (latest patched).

## Ship readiness: ✅
Build compiles clean, visual QA matches mockup composition, no blank Remotion boxes, real brand marks, honesty caveats in place, copy passes Godin/Dry lens.
