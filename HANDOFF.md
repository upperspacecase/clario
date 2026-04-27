# Hours assessment — data spec

A handoff-ready summary of what gets gathered on the GetHours.org call and what comes out of the pipeline.

## What the call gathers

Annie runs the call in five phases. Every facet listed under "must capture" is required for the report to be writable; the call is otherwise considered low-quality and gets flagged for re-do.

### Phase 1 — Identity (~60 sec)
Captured verbally at the top of the call.

| Field | Required | Notes |
|---|---|---|
| Caller's first name | Yes | Used in addressing during the call |
| Caller's email | Yes | Where the report is sent. Spell-back confirmation if accuracy is in doubt |
| Business name | Yes | Used in the report personalization |

### Phase 2 — Business context (~2–4 min)
Lets the team write a recommendation that fits their actual setup, not generic advice.

| Field | Required | Notes |
|---|---|---|
| What the business does | Yes | One paragraph in their words |
| How long they've been at it | Soft | Useful for tone / maturity assessment |
| Team size + structure | Yes | Solo / small / larger; rough role breakdown |
| Caller's role | Yes | Owner / operator / manager — sets opportunity-cost framing |
| Industry | Yes | Used for hourly-rate default in the financial calc |
| Current SaaS / tooling stack | Yes | What CRM, email, scheduling, accounting, support, etc. they already use. Critical so we don't recommend a tool that duplicates what they have |
| What they sell, who buys, rough scale | Soft | Helps prioritise pain points by revenue impact |

### Phase 3 — Pain point excavation (~7–40 min) — the heart of the call
**Required:** 5–8 distinct pain points captured. Real depth on the top 2–3.

For each pain point:

| Facet | Required | Notes |
|---|---|---|
| Description | Yes | One concrete sentence — what's the problem |
| Verbatim quote | Yes | Caller's own words; used directly in the report so they recognise themselves |
| Frequency | Yes | Daily / weekly / ad-hoc / specific cadence |
| Hours per week it consumes | Yes | If they don't know, estimate from the workflow they describe and flag the estimate |
| Who does it | Yes | Caller, employee, contractor — owner time is the most expensive |
| Current process | Yes | Step-by-step what they do today |
| What they've tried | Top-3 only | Past attempts at fixing; "have you tried…" |
| Cost of breaking | Top-3 only | What happens when this goes wrong — revenue, customers, sleep |
| Specific recent example | If possible | Concrete example > abstract description |
| Category | Yes (post-call) | Tagged into one of: scheduling / support / marketing / sales / ops / finance / knowledge / communication / hiring / data / other |

### Phase 4 — Wrap (~1–2 min)
| Field | Required | Notes |
|---|---|---|
| Recap of 3–4 themes | Yes | Annie reflects what she heard before closing |
| "Anything else?" capture | Yes | Caller often saves the most important thing for the end |
| Expectation set | Yes | "Report goes to {email}. Includes a link to book a follow-up." |

### Phase 5 — Implicit metadata
Captured by the system, not Annie:

| Field | Required |
|---|---|
| Call duration (sec) | Yes |
| Call language(s) | Yes |
| Audio recording (Opus) | No (deferred to v2) |
| Voice session token / handles | Yes — for traceability |
| Prompt version used | Yes — for A/B analysis |

## Hard requirements for a valid call
A call is **shippable** if:
- Phase 1 (all 3 fields) captured
- Phase 2: business description, team size, role, industry, current tools — all present
- Phase 3: at least **5 pain points**, each with description + verbatim quote + frequency + hours/wk + who + current process. At least **2** also have what-they've-tried + cost-of-breaking.

If any of those is missing, the call gets routed to `manual_review` for the team to either re-do or proceed manually.

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
- Call: 20–60 min, Annie wraps when she has enough rather than padding
- Pipeline (transcript → published report): ~15–30 min on Tay's Mac
- Total turnaround (call ended → email with report sent): same business day for v1
