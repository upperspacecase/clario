# Hours assessment — data spec

A handoff-ready summary of what gets gathered on the GetHours.org assessment and what comes out of the pipeline.

> This is the data contract for the post-call pipeline (sub-skills 01–08), **not Sam's question list**. Sam's actual prompt lives in `server/system-instruction.ts`. Each field below is tagged with its `source`:
> - **`form`** — collected by the post-call form at `/start/confirm/[id]`. Always present (the form is required to advance to payment / report generation).
> - **`transcript`** — extracted from the call by sub-skills. Best-effort: pain conversation surfaces these naturally, but Sam doesn't interrogate for them. Missing fields get flagged as gaps in the report rather than failing the call.
> - **`system`** — implicit metadata captured automatically by the WS relay or pipeline.

## What gets gathered

### Identity (post-call form)
Collected on the website immediately after Sam hangs up. Sam never asks for these on the call (she may ask the caller's first name only to address them by name; the form is the authoritative source).

| Field | Source | Required | Notes |
|---|---|---|---|
| Caller's first name (`clientName`) | form | Yes | Used in report personalisation. Sam may use the on-call name; form takes precedence |
| Caller's email (`clientEmail`) | form | Yes | Where the report is sent |
| Business name (`businessName`) | form | Yes | Used in report personalisation |
| Caller's role (`callerRole`) | form | Optional | Owner / operator / manager — sets opportunity-cost framing |
| Industry (`industry`) | form | Yes | One of 9 dropdown options. Used for hourly-rate default in the financial calc |

### Business context (transcript, best-effort)
Sub-skills extract whatever the caller mentions in pain conversation. Nothing here is a Sam question — if it doesn't surface, the report flags the gap.

| Field | Source | Required | Notes |
|---|---|---|---|
| What the business does | transcript | Best-effort | One paragraph in their words. Usually surfaces while describing pain context |
| How long they've been at it | transcript | Soft | Useful for tone / maturity assessment |
| Team size + structure | transcript | Best-effort | Solo / small / larger; rough role breakdown. Not on the form — only available if the caller mentions it |
| Current SaaS / tooling stack | transcript | Best-effort | CRM, email, scheduling, accounting, etc. Critical so we don't recommend a tool that duplicates what they have. Surfaces in pain context, not a checklist |
| What they sell, who buys, rough scale | transcript | Soft | Helps prioritise pain points by revenue impact |

### Pain point excavation (transcript) — the heart of the call
**Required:** 5–8 distinct pain points captured. Real depth on the top 2–3.

For each pain point:

| Facet | Source | Required | Notes |
|---|---|---|---|
| Description | transcript | Yes | One concrete sentence — what's the problem |
| Verbatim quote | transcript | Yes | Caller's own words; used directly in the report so they recognise themselves |
| Frequency | transcript | Yes | Daily / weekly / ad-hoc / specific cadence |
| Hours per week it consumes | transcript | Yes | If they don't know, estimate from the workflow they describe and flag the estimate |
| Who does it | transcript | Yes | Caller, employee, contractor — owner time is the most expensive |
| Current process | transcript | Yes | Step-by-step what they do today |
| What they've tried | transcript | Top-3 only | Past attempts at fixing |
| Cost of breaking | transcript | Top-3 only | What happens when this goes wrong — revenue, customers, sleep |
| Specific recent example | transcript | If possible | Concrete example > abstract description |
| Category | pipeline | Yes (post-call) | Tagged into one of: scheduling / support / marketing / sales / ops / finance / knowledge / communication / hiring / data / other |

### Wrap signals (transcript)
| Field | Source | Required | Notes |
|---|---|---|---|
| Recap of 3–4 themes | transcript | Yes | Sam reflects what she heard before closing |
| "Anything else?" capture | transcript | Yes | Caller often saves the most important thing for the end |

### Implicit metadata (system)
Captured automatically.

| Field | Source | Required |
|---|---|---|
| Call duration (sec) | system | Yes |
| Call language(s) | system | Yes |
| Audio recording (Opus) | system | No (deferred to v2) |
| Voice session token / handles | system | Yes — for traceability |
| Prompt version used | system | Yes — for A/B analysis |

## Hard requirements for a valid call

Form-sourced fields (identity + role + industry) are guaranteed present by the post-call form, not by Sam. Shippability hinges on the transcript.

A call is **shippable** if:
- At least **5 pain points** captured, each with description + verbatim quote + frequency + hours/wk + who + current process.
- At least **2** of those pain points also have what-they've-tried + cost-of-breaking.

Transcript-sourced business-context fields (team size, tooling stack, what-the-business-does) are best-effort. If they're missing, the report flags them as gaps and the team fills them in during manual review — the call is not failed for their absence.

If the pain-point bar above is missed, the call gets routed to `manual_review` for the team to either re-do or proceed manually.

## What comes out — the report

Delivered as JSON to Firestore (`publicReports/{shareId}`) and rendered at `gethours.org/r/{shareId}`. Eight sections in order:

### 1. Headline number
```
hoursPerWeek:        14
monthlyValue:        $2,800        (= hoursPerWeek × 4 × hourlyRate)
monthlyToolCost:     $35
netMonthly:          $2,765
annualized:          $33,180
hourlyRateUsed:      $50           (industry default OR caller-stated)
```

### 2. Executive summary
2–4 plain-language sentences reflecting their pain points back. No marketing copy. Uses their own words where possible.

### 3. Pain points (the table)
Per pain point:
- description
- verbatim quote
- frequency
- hours/wk
- category (snake_case slug)
- effort score (1–3) — how hard to fix
- impact score (1–3) — how much it'll matter when fixed
- isQuickWin (boolean) — derived from effort × impact

### 4. Effort × Impact matrix
Visualised as a 2×2 chart on the rendered page. Quick wins highlighted.

### 5. Quick-win recommendations (1–3 tools)
Per recommendation:
- toolName, toolUrl
- pricing (verified — "Free tier; paid from $X" only if confirmed on the pricing page)
- hasFreeTier (bool), monthlyPrice
- whyItFits (one sentence specific to this caller's context)
- installSteps[] — ordered, each ≤1 hour
- timeSavedHoursPerWeek
- source: "allowlist" | "taaft" | "futuretools" | "web"
- confidence (0–1; floor 0.7 to enter the report)

**Critical constraint:** every tool must pass live web verification (homepage reachable, pricing page reachable, integration claims verifiable). A tool that 404s or whose price can't be verified does not enter the report.

### 6. 4-day quick-win plan
Day 1 / 2 / 3 / 4 — each: action + tool. Day 4 must be "go live" (use the tool / send the announcement / change the workflow). Daily effort ≤1 hr.

### 7. Upsells (3–5 bigger plays)
Per upsell:
- title, type (process_redesign | automation_build | knowledge_system | agent_build | full_implementation)
- problem (in caller's words)
- proposedSolution (specific to their setup)
- valueRangeMin / valueRangeMax (USD)
- relatedPainPointIds

These are pain points that didn't fit a quick win — too big, too custom, no off-the-shelf tool.

### 8. Financial summary table + follow-up booking
Per recommendation: hours/wk × hourly rate − tool cost = net monthly. Sums match the headline.
Plus: booking link (`gethours.org/r/{shareId}/book` once the in-house booker ships).

## Anti-fabrication guarantees (non-negotiable)

These are the rules that stop the report from being LLM slop:

1. **Verbatim quotes are findable in the transcript.** No paraphrasing in the quote field.
2. **No tool name appears unless it was found via the allowlist, TAAFT, or Futuretools — AND** its homepage was successfully fetched at report-write time.
3. **No specific price** unless it was visible on the pricing page at fetch time. Otherwise: "Pricing varies — see [link]".
4. **No integration claim** unless verified on the tool's integrations page.
5. **Confidence floor 0.7.** Pain points with no qualifying tool get routed to upsells, not papered over with a weak recommendation.

## Time targets
- Call: 20–60 min, Sam wraps when she has enough rather than padding
- Pipeline (transcript → published report): ~15–30 min on Tay's Mac
- Total turnaround (call ended → email with report sent): same business day for v1
