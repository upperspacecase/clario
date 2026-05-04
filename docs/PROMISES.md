# Customer-facing promises

Every claim made to a customer (call duration, report turnaround, what's
included, follow-up offer) is canonicalized in **`lib/promises.ts`**. Any
surface that talks to a customer must source from there.

## Canonical values

| Key | Value |
|---|---|
| `callDurationLabel` | "30-minute conversation" |
| `reportSlaLabel` | "within 24 hours" |
| `followUpLabel` | "free 30-minute implementation walkthrough + Q&A" |
| `priceLabel` | "$1,000 one-time" |

## Touchpoint registry

Any code below that makes a duration / SLA / follow-up claim must match
`lib/promises.ts`. If you change a promise, update this list at the same time.

| Surface | File | Claim type |
|---|---|---|
| Page title + meta description (incl. OG) | `app/layout.tsx` | duration + SLA |
| Hero subhead | `components/HomeHero.tsx` | duration + SLA |
| Pricing card includes list | `components/site/PricingSection.tsx` | duration + SLA + follow-up |
| iPhone mockup idle screen | `components/CallScreen.tsx` | duration |
| Annie's mid-call checkpoint (Phase 5) | `server/system-instruction.ts` | SLA |
| Annie's wrap (Phase 7, step 4) | `server/system-instruction.ts` | SLA + follow-up |
| Confirmation email | `lib/email.ts` (`sendCallConfirmation`) | SLA |

## Surfaces that intentionally stay vague

Some marketing copy makes no concrete duration/SLA claim by design (kept
poetic / brand-led). Don't add specifics to these unless the entire promise
set is changing:

- `components/site/FinalCta.tsx` — "Short call. Clear report."
- `components/site/HowItWorks.tsx` — three numbered steps, no times
- `components/site/SampleReport.tsx` — example report fixtures only

## "Audit" vs "assessment" — known divergence

Marketing brands the offering "the Hours Audit" (CTA buttons, pricing card).
Annie's prompt explicitly forbids the word "audit" on the call ("Say
'assessment,' 'report,' or 'conversation.'"). This is intentional: the
written brand can be punchy while the spoken word can feel softer. Don't
collapse them.

## Why the server prompt inlines instead of imports

`server/system-instruction.ts` runs in a separate Node process on Fly with
its own module graph — it doesn't have access to the Next.js `@/lib/*`
alias. So Annie's promise strings are inlined verbatim. **If you change a
value in `lib/promises.ts`, also update the matching string in
`server/system-instruction.ts` Phase 7.** Grep confirms alignment.

## Future: move to Firestore `config/global`

When W3 (admin Send UI) or W4 (booking embed) need server-side reads of
these strings, add a `promises` block to `config/global` via
`scripts/seed-config.ts` and have both `lib/promises.ts` and the server
prompt source from there. Not done yet — nothing reads it server-side.

## Verification

Before shipping a change to any promise:

1. `grep -r "ten minutes\|twelve-minute\|few minutes" app components server lib` returns zero hits.
2. Manual walkthrough: homepage → pre-call form → Annie's opening → hang up → confirmation email → report page. Every duration / SLA mention matches `lib/promises.ts`.
