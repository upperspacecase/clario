# UX Principles — Clario

Three cognitive principles we design the page around. Each one maps to a specific element on the page.

## 1. Mental Model (Meaning category)
**Why:** Target user has never used an AI product. If we frame Clario as "a voice-first GenAI concierge," we lose them. If we frame it as "a phone call with someone who knows AI," we anchor to an existing mental model they already trust (calling a consultant, calling a friend, leaving a voicemail).

**How it shows up:**
- Headline uses "on the phone," not "voice agent" or "AI assistant."
- The Remotion demo shows a phone/call UI, not an abstract AI interface.
- CTA label is `Get my call back` — language of a callback, not a demo.
- Subhead: "Clario calls you back" — passive voice, human-shaped.
- The word "AI" appears only when describing the *output* (the tools in the report), never the *product* itself.

## 2. Loss Aversion + Spark Effect (Time category)
**Why:** These users are not chasing upside. They're protecting a margin. Framing around loss ("You're already losing reservations on Sundays you don't notice") pulls harder than gains ("Grow bookings!"). The Spark Effect — the emotional prompt at the moment of decision — lives on the CTA itself.

**How it shows up:**
- Subhead names specific losses the owner already feels: "reservations, reviews, waste, staff."
- Remotion demo opens with a restaurant owner saying a specific loss ("Pierdo muchas reservas los domingos…" / "I lose a lot of reservations on Sundays…").
- Right above the CTA, a one-liner: **"Five minutes on the phone beats another week losing bookings you can't see."**
- Commitment device below the CTA: "We call within 24 hours, or we don't ask for your number again." — removes the risk of giving up a number.

## 3. Commitment & Consistency (Time category) via micro-commit
**Why:** Asking for a phone number cold is a hard ask. Making the user pick a language first (tiny decision) then revealing the phone field creates a two-step flow where the user is already consistent with the idea of calling before they commit the number.

**How it shows up:**
- Form order (left-to-right on desktop, top-to-bottom on mobile):
  1. Language dropdown (Español / Português / Italiano / Tiếng Việt / Français / Deutsch / Other)
  2. Country (short list, most common first)
  3. Phone number
  4. Submit button
- Micro-copy under the language picker: *"This is the language we'll call you in."* — reinforces consistency.

## Single accent + Hick's Law (supporting)
- One accent color, used only on the CTA button. Everything else near-black on near-white (palette confirmed after mockup read).
- Footer has 3–4 links maximum. No secondary CTA section.

## What this means for the build
- Hero form is where the three principles converge. It MUST ship exactly as described.
- The Remotion demo MUST show a specific loss being named in a non-English language, resolved by specific tool cards. Abstract waveforms are a failure.
- "Pre-launch — early-access waitlist." badge near the headline (authority + honesty).
