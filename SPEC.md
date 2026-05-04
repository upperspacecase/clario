# GetHours.org — Technical Specification

Version 0.1 · Author: Tay · For: dev team

A voice-agent-driven AI opportunity assessment product. Prospects visit gethours.org, have a 12-minute conversation with an AI agent (Iris), and receive a personalized report at a private share link identifying tools that will save them time, plus upsell opportunities for deeper engagements.

## 1. Product overview

The user journey:

1. Prospect lands on gethours.org and clicks "Start your assessment"
2. Quick form captures name, email, business name, industry
3. Browser opens a voice session with Iris (Gemini Flash Live)
4. ~12-minute conversation surfaces pain points and current workflows
5. Transcript is streamed live to Firestore
6. After the call, Tay's local skill pipeline processes the transcript into a structured report
7. Client receives an email with a private link (`gethours.org/r/{shareId}`) showing their tailored report
8. Report includes a Cal.com embed for booking the follow-up upsell call

Pricing: $1,000 per assessment (some free pilots early on).

## 2. Tech stack

| Layer | Choice |
|---|---|
| Hosting | Firebase Hosting |
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend | Next.js API routes (deployed as Firebase Functions) |
| Database | Firestore |
| Auth | Firebase Auth (Google provider, single-email allowlist) |
| File storage | Firebase Storage (audio recordings, generated docx) |
| Voice agent | Gemini Flash Live API (`gemini-3.1-flash-live-preview` initially; migrate to `gemini-2.5-flash-live-native-audio` once GA) |
| Transactional email | Resend |
| Booking | Cal.com (embed) |
| Intelligence layer | Claude Code skills run locally on Tay's Mac |
| CLI bridge | `assess-cli` (custom TypeScript CLI) |

## 3. Domain & routing

All on `gethours.org`:

| Path | Purpose | Auth |
|---|---|---|
| `/` | Marketing landing page | Public |
| `/start` | Pre-call form + Iris voice widget | Public |
| `/r/{shareId}` | Client's report (private via unguessable shareId) | Public, shareId-gated |
| `/sample` | Pre-rendered demo report | Public |
| `/admin` | Tay's operations dashboard | Auth-gated (single email) |
| `/admin/queue` | Incoming + processing + completed assessments | Auth-gated |
| `/admin/live/{id}` | Real-time transcript view of in-progress calls | Auth-gated |
| `/admin/r/{id}` | Internal view of any assessment with edit + re-run controls | Auth-gated |
| `/admin/prompts` | Iris system prompt management (versioned) | Auth-gated |
| `/admin/allowlist` | Curated tool database | Auth-gated |
| `/admin/analytics` | Cross-assessment insights | Auth-gated |
| `/api/voice/start` | Initialize voice session (creates assessment doc) | Public, rate-limited |
| `/api/voice/socket` | WebSocket proxy to Gemini Live | Public, session-gated |
| `/api/voice/finalize` | Mark call complete, trigger downstream | Public, session-gated |
| `/api/admin/*` | Admin actions (re-run pipeline, edit, etc.) | Admin auth required |

`shareId` is a 10-character nanoid (e.g., `k3n2pq8f4j`) — unguessable, no enumeration risk.

## 4. System architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ gethours.org (Next.js on Firebase Hosting)                       │
│                                                                  │
│   /start ──▶ /api/voice/start ──▶ creates assessments/{id}       │
│      │                                                           │
│      ▼ WebSocket                                                 │
│   /api/voice/socket ◀───────▶ Gemini Flash Live (Google)         │
│      │                                                           │
│      ├──▶ Firestore: assessments/{id}/transcript/{turnId}        │
│      └──▶ Firebase Storage: audio/{id}.opus                      │
│                                                                  │
│   On end: /api/voice/finalize                                    │
│      ├──▶ status: pending_processing                             │
│      ├──▶ Resend → client: "your report is being prepared"       │
│      └──▶ Resend → tay@life-time.co (optional notification)      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Tay's Mac (Claude Code, local)                                   │
│                                                                  │
│   $ claude run assessment-pipeline --id abc123                   │
│                                                                  │
│   orchestrator skill                                             │
│     ├──▶ assess-cli fetch     → transcript + metadata            │
│     ├──▶ 01-transcript-normalize                                 │
│     ├──▶ 02-pain-points                                          │
│     ├──▶ 03-tool-research     (TAAFT + Futuretools + verify)     │
│     ├──▶ 04-effort-impact                                        │
│     ├──▶ 05-quick-win-plan                                       │
│     ├──▶ 06-upsells                                              │
│     ├──▶ 07-financial                                            │
│     └──▶ assess-cli write     → status: complete                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Firestore trigger
┌──────────────────────────────────────────────────────────────────┐
│ deliverReport (API route invoked by Firestore trigger)           │
│   └──▶ Resend → client: "report ready → /r/{shareId}"            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Client opens gethours.org/r/{shareId}                            │
│   ├── Next.js renders from publicReports/{shareId}               │
│   ├── /views append-only log for analytics                       │
│   └── Cal.com embed for follow-up call booking                   │
└──────────────────────────────────────────────────────────────────┘
```

## 5. The voice agent (Iris)

### 5.1 Model & session

- **Model**: `gemini-3.1-flash-live-preview` (configurable)
- **Modality**: audio in/out
- **Transcription**: native, both directions enabled (`input_audio_transcription`, `output_audio_transcription`)
- **Voice**: select one of the 30 HD voices; default to a warm, mid-pitched feminine voice (test with users)
- **Session length**: Live API caps audio sessions at 15 min and underlying connections at ~10 min. Strategy: target a 12-minute conversation. Implement session resumption (handle-based) for safety, but design Iris's prompt to wrap before the limit is reached.

### 5.2 Prompt principles

The system prompt is product IP — versioned in Firestore (`prompts/` collection), A/B testable across calls, editable from `/admin/prompts`. Starter structure:

- **Identity** — "You are Iris, an AI assistant for GetHours. You help business owners identify where AI can give them their time back."
- **Tone** — warm, curious, not salesy. Comfortable with silence. Asks one question at a time. Never recommends tools or solutions during the call (that's the report's job).
- **Opening (30 sec)** — greet by name, frame the call ("I'll spend about 10 minutes learning about your day-to-day so we can spot the best AI opportunities for you. Sound good?"), confirm consent.
- **Business context (2 min)** — industry, team size, role, current SaaS stack, decision-making setup.
- **Pain point excavation (7 min)** — open with "what's the most frustrating part of your week?" Follow up with: how often, how much time, who does it, what's the current process. Aim for 4–6 well-explored pain points.
- **Wrap (1 min)** — recap what was heard, set expectations ("you'll get your report at the email you provided within 30 minutes"), close warmly.
- **Time-awareness instruction** — at minute 10, start steering toward wrap. At minute 12, deliver the wrap regardless of state.
- **Hard rules** — never claim to be human if asked directly; never make commitments on Tay's behalf; never quote prices.

### 5.3 Transcript handling

- Both `input_audio_transcription` and `output_audio_transcription` events are written to Firestore as they arrive: `assessments/{id}/transcript/{turnId}` with `{role: 'user' | 'agent', text, timestamp, sessionHandle}`.
- Audio chunks accumulate to a single Opus file in Firebase Storage at `audio/{assessmentId}.opus` for debugging and quality review (90-day retention).

### 5.4 Function calling (deferred to v2)

Flash Live supports function calling. Tempting to have Iris call `log_pain_point()` live during the conversation for cleaner structured data. Defer this to v2. v1 captures raw transcript only and extracts in the skills layer — keeps the voice and intelligence layers cleanly separated for debugging.

## 6. Firestore data model

### 6.1 Collections

```
/assessments/{assessmentId}                  — internal, admin-only
  /transcript/{turnId}                       — live conversation turns
  /pipelineRuns/{runId}                      — skill pipeline execution log

/publicReports/{shareId}                     — denormalized public-safe view
  /views/{viewId}                            — analytics: who opened, when

/prompts/{promptId}                          — versioned Iris system prompts
/allowlistTools/{toolId}                     — curated tool database
/config/global                               — site singleton (price, etc.)
/users/{uid}                                 — admin user record
```

### 6.2 `assessments/{assessmentId}`

```typescript
{
  // Identity
  id: string;                          // Firestore-generated
  shareId: string;                     // 10-char nanoid, indexed unique

  // Client info
  clientName: string;
  clientEmail: string;
  businessName: string;
  industry: string;
  callerRole?: string;                 // captured during call

  // Status
  status: 'in_call'
        | 'pending_processing'
        | 'processing'
        | 'complete'
        | 'failed'
        | 'manual_review';

  // Voice session
  voiceSessionId: string;
  voiceSessionHandles: string[];       // for resumed segments
  audioStoragePath: string;            // 'audio/{id}.opus'
  callStartedAt: Timestamp;
  callEndedAt: Timestamp;
  callDurationSec: number;

  // Pipeline output (populated post-skills-run)
  headline: {
    hoursPerWeek: number;
    monthlyValue: number;
    monthlyToolCost: number;
    netMonthly: number;
    annualized: number;
    hourlyRateUsed: number;
  };
  executiveSummary: string;
  fourDayPlan: Array<{day: number, action: string, toolName: string}>;

  // Tracking
  promptVersionId: string;             // which Iris prompt was used
  pipelineVersionId: string;           // which skill chain version processed it
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  emailedAt: Timestamp | null;

  // Internal notes
  tayNotes?: string;                   // free-form admin notes
}
```

### 6.3 `assessments/{id}/transcript/{turnId}`

Append-only as the conversation streams.

```typescript
{
  turnId: string;                      // sequence id
  role: 'user' | 'agent';
  text: string;
  timestamp: Timestamp;
  sessionHandle: string;
  isFinal: boolean;                    // false for partial, true for committed
}
```

### 6.4 `assessments/{id}/pipelineRuns/{runId}`

```typescript
{
  runId: string;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  status: 'running' | 'success' | 'failed';
  triggeredBy: 'auto' | 'manual_admin' | 'cli';
  skillOutputs: {
    [skillName: string]: {
      durationMs: number;
      success: boolean;
      outputPath: string;              // path in Firebase Storage to JSON
      errorMessage?: string;
    }
  };
  finalReportPath?: string;            // path to docx if generated
}
```

### 6.5 `publicReports/{shareId}`

Denormalized snapshot, written by the deliverReport function. Contains only fields safe for public display.

```typescript
{
  shareId: string;
  assessmentId: string;                // internal ref

  clientName: string;                  // for "Hi {name}" personalization
  businessName: string;
  generatedAt: Timestamp;

  headline: { /* same as assessment */ };
  executiveSummary: string;

  painPoints: Array<{
    id: string;
    description: string;
    verbatimQuote: string;
    frequency: string;
    hoursPerWeek: number;
    category: string;
    effortScore: 1 | 2 | 3;
    impactScore: 1 | 2 | 3;
    isQuickWin: boolean;
  }>;

  recommendations: Array<{
    id: string;
    painPointId: string;
    toolName: string;
    toolUrl: string;
    pricing: string;
    hasFreeTier: boolean;
    monthlyPrice: number | null;
    whyItFits: string;
    installSteps: string[];
    timeSavedHoursPerWeek: number;
    source: 'allowlist' | 'taaft' | 'futuretools' | 'web';
    confidence: number;                // 0–1
  }>;

  fourDayPlan: Array<{day: number, action: string, toolName: string}>;

  upsells: Array<{
    id: string;
    title: string;
    type: 'process_redesign' | 'automation_build' | 'knowledge_system'
        | 'agent_build' | 'full_implementation';
    problem: string;
    proposedSolution: string;
    valueRangeMin: number;             // USD
    valueRangeMax: number;
    relatedPainPointIds: string[];
  }>;

  bookingUrl: string;                  // Cal.com link
  expiresAt: Timestamp | null;         // optional report expiry
}
```

### 6.6 `publicReports/{shareId}/views/{viewId}`

```typescript
{
  viewId: string;
  timestamp: Timestamp;
  userAgent: string;
  referrer: string | null;
  ipHash: string;                      // hashed for privacy
}
```

### 6.7 `prompts/{promptId}`

```typescript
{
  promptId: string;
  version: string;                     // semver
  systemPrompt: string;                // the actual prompt
  voiceConfig: {
    voiceName: string;
    speakingRate: number;
  };
  isActive: boolean;                   // only one active at a time
  createdAt: Timestamp;
  createdBy: string;                   // admin uid
  notes: string;                       // why this version was created
  metricsSnapshot?: {                  // populated periodically
    callsRun: number;
    avgPainPointsExtracted: number;
    avgCallDuration: number;
  };
}
```

### 6.8 `allowlistTools/{toolId}`

```typescript
{
  toolId: string;                      // slug, e.g., 'fathom'
  name: string;                        // 'Fathom'
  url: string;
  category: string;                    // 'meeting_notes', 'crm', etc.
  painPointKeywords: string[];         // for matching
  pricing: {
    hasFreeTier: boolean;
    freeTierDescription: string;
    paidTierStartsAt: number;          // USD/month
    pricingPageUrl: string;
  };
  integrations: string[];              // ['google_calendar', 'zoom', ...]
  whyItFits: string;                   // template fragment
  installSteps: string[];              // ordered
  lastVerifiedAt: Timestamp;
  verifiedBy: string;
  isActive: boolean;
  notes: string;                       // private gotchas
}
```

### 6.9 `config/global`

```typescript
{
  assessmentPriceUsd: number;          // default 1000
  freePilotMode: boolean;              // toggle for free assessments
  maxCallDurationSec: number;          // default 720 (12 min)
  bookingUrlBase: string;              // Cal.com URL
  notificationEmail: string;           // tay@life-time.co
  activePromptId: string;
  updatedAt: Timestamp;
}
```

## 7. Firebase Auth & security rules

### 7.1 Auth setup

- Firebase Auth with Google provider only
- Allowlist enforcement: only `tay@life-time.co` can sign in to admin
- Enforced both client-side (UI gates) and server-side (Firestore rules + API route checks)

### 7.2 Firestore security rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'tay@life-time.co'
        && request.auth.token.email_verified == true;
    }

    // Assessments — admin only, all writes via server
    match /assessments/{assessmentId} {
      allow read: if isAdmin();
      allow write: if false;  // server-only (admin SDK bypasses rules)

      match /transcript/{turnId} {
        allow read: if isAdmin();
        allow write: if false;
      }

      match /pipelineRuns/{runId} {
        allow read: if isAdmin();
        allow write: if false;
      }
    }

    // Public reports — read by anyone with the shareId in path
    // No enumeration possible because shareId is unguessable nanoid
    match /publicReports/{shareId} {
      allow read: if true;
      allow write: if false;  // server-only

      match /views/{viewId} {
        allow read: if isAdmin();
        allow create: if request.resource.data.keys().hasAll(
          ['timestamp', 'userAgent', 'ipHash']
        );
        allow update, delete: if false;
      }
    }

    // Prompts, allowlist, config — admin only
    match /prompts/{promptId} {
      allow read, write: if isAdmin();
    }
    match /allowlistTools/{toolId} {
      allow read, write: if isAdmin();
    }
    match /config/{configId} {
      allow read: if true;             // public can read price etc.
      allow write: if isAdmin();
    }
    match /users/{uid} {
      allow read, write: if isAdmin();
    }
  }
}
```

### 7.3 Storage security rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'tay@life-time.co';
    }

    match /audio/{file} {
      allow read: if isAdmin();
      allow write: if false;
    }
    match /reports/{file} {
      allow read: if isAdmin();
      allow write: if false;
    }
  }
}
```

### 7.4 Admin route protection

Every `/admin/*` page and `/api/admin/*` route validates the auth token server-side and confirms email match. Use Next.js middleware:

```typescript
// middleware.ts (pseudocode)
import { auth } from '@/lib/firebase-admin';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = req.cookies.get('idToken')?.value;
    if (!token) return redirectToLogin(req);

    const decoded = await auth.verifyIdToken(token);
    if (decoded.email !== 'tay@life-time.co' || !decoded.email_verified) {
      return new Response('Forbidden', { status: 403 });
    }
  }
  return NextResponse.next();
}
```

## 8. API routes / Cloud Functions

All deployed as Next.js API routes which become Firebase Functions when hosted via Firebase.

### 8.1 Public

| Route | Method | Purpose |
|---|---|---|
| `/api/voice/start` | POST | Body: `{name, email, businessName, industry}`. Creates `assessments/{id}` with `status: in_call`. Returns `{assessmentId, shareId, voiceSessionToken}`. Rate-limited to 5/IP/hour. |
| `/api/voice/socket` | WebSocket | Proxies between browser and Gemini Live. Uses `voiceSessionToken` for session verification. Streams transcripts to Firestore as they arrive. Saves audio chunks to Storage. |
| `/api/voice/finalize` | POST | Body: `{assessmentId, voiceSessionToken}`. Closes the session, updates status to `pending_processing`, sends client expectation-setting email, sends Tay notification email. |
| `/api/track-view` | POST | Body: `{shareId}`. Appends to `publicReports/{shareId}/views/`. |

### 8.2 Admin

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/run-pipeline` | POST | Body: `{assessmentId}`. Manually triggers downstream notification that pipeline should be re-run on Tay's machine. |
| `/api/admin/edit-report` | POST | Body: `{shareId, patch}`. Allows Tay to edit `publicReports/{shareId}` before sending. |
| `/api/admin/send-report` | POST | Body: `{assessmentId}`. Sends the report email to client (manual gate, not auto). |
| `/api/admin/prompts/activate` | POST | Body: `{promptId}`. Sets that prompt as active, deactivates others. |
| `/api/admin/allowlist/upsert` | POST | Body: tool object. Upserts to `allowlistTools/{toolId}`. |

### 8.3 CLI-facing (token-authed)

These are how the local Claude Code skills talk to Firebase. Auth is via a long-lived service-account token stored in Tay's `.env`.

| Route | Method | Purpose |
|---|---|---|
| `/api/cli/fetch-assessment` | GET | Query: `?id={assessmentId}`. Returns transcript + metadata. Header: `Authorization: Bearer {SERVICE_TOKEN}`. |
| `/api/cli/write-output` | POST | Body: `{assessmentId, painPoints, recommendations, upsells, headline, fourDayPlan, executiveSummary}`. Writes both `assessments/{id}` (admin view) and `publicReports/{shareId}` (public view). Sets `status` to `complete`, which triggers the email. |
| `/api/cli/log-pipeline-run` | POST | Logs to `assessments/{id}/pipelineRuns/{runId}`. |

## 9. Public Next.js routes

### 9.1 `/` (marketing landing)

Hero, value prop, sample report link, "Start your assessment" CTA → `/start`. Show price from `config/global`. Standard marketing page.

### 9.2 `/start` (the voice agent)

- Form: name, email, business name, industry dropdown
- On submit → POST `/api/voice/start` → receives `{assessmentId, shareId, voiceSessionToken}`
- UI swaps to voice agent: animated indicator (talking / listening / thinking), live transcript display (optional), "End call" button, mute button, elapsed timer
- WebSocket established via `/api/voice/socket` proxy
- After Iris's wrap or user-clicked end → POST `/api/voice/finalize` → swap to "Thanks, your report is on the way" screen with expected delivery time

### 9.3 `/r/{shareId}` (the client report)

Server-renders from `publicReports/{shareId}`. Sections in order:

1. **Headline number** — "$X net monthly value" — big, hero-style
2. **Executive summary** — pain points reflected back with verbatim quotes
3. **Effort × Impact matrix** — interactive 2×2 chart, quick wins highlighted
4. **Quick win recommendations** — card per recommendation with tool name, link, pricing, why it fits, install steps, time saved
5. **4-day quick win plan** — Day 1–4 checklist
6. **What comes next (upsells)** — soft-pitched bigger plays
7. **Financial impact summary** — table view
8. **Book your follow-up call** — Cal.com embed

Track open via `/api/track-view`. Optional: report expiry, watermark with client name.

### 9.4 `/sample`

Pre-rendered fictional report. Used in marketing and outbound. Same template, hardcoded data.

## 10. Admin backend

This replaces Slack notifications. Single user, single email, full operational control.

### 10.1 `/admin` (dashboard home)

- Metrics row: assessments today / this week / this month, conversion to upsell, avg headline number
- "Needs attention" panel: anything stuck in `pending_processing` > 1 hour, or failed runs
- Recent activity stream
- Quick links

### 10.2 `/admin/queue`

Table of all assessments. Columns: business name, status, created at, duration, headline number, actions. Filter by status, sort by anything. Click row → `/admin/r/{id}`.

### 10.3 `/admin/live/{id}`

For in-progress calls. Streams `assessments/{id}/transcript/` in real-time. Lets Tay watch Iris work. Crucial in the first 20–50 calls for prompt iteration.

### 10.4 `/admin/r/{id}`

Full assessment view with:

- All metadata
- Full transcript (collapsible)
- All pipeline run logs
- Generated report preview
- Edit panel — edit recommendations, upsells, headline number before sending
- Actions: re-run pipeline, manually send email, copy share link, mark as failed/complete, add internal notes

This is where Tay quality-controls each report before it goes to the client. v1 ships with manual send (status flips to `manual_review` after pipeline, Tay reviews, clicks "Send"). Auto-send can be enabled per-prompt-version once trust is established.

### 10.5 `/admin/prompts`

List of all Iris prompt versions. Active one is highlighted. Editor to create new version. "Activate" button. Per-version metrics (call count, avg pain points extracted, avg duration).

### 10.6 `/admin/allowlist`

CRUD for the tool database. Search, filter by category. Form to add/edit a tool with all fields from §6.8. "Verify now" button hits the tool's URL and pricing page to confirm it's still alive (uses a server function).

### 10.7 `/admin/analytics`

- Most-recommended tools (across all assessments)
- Most common pain point categories by industry
- Avg headline number by industry
- Upsell type → conversion rate (manual tracking field needed)
- Prompt version → quality metrics

### 10.8 Notification email (replaces Slack)

When an assessment finishes its call (`pending_processing`), a Resend email goes to `tay@life-time.co` with subject `[GetHours] New assessment: {businessName}` and a deep link to `/admin/r/{id}`. This is the primary surface for "you have work to do." Admin dashboard is the secondary one for browsing.

## 11. Claude Code skill pipeline

Lives in Tay's local repo. Each skill is its own folder with a `SKILL.md` and any helper scripts.

### 11.1 Repository layout

```
gethours-skills/
├── README.md
├── SKILL.md                          ← orchestrator
├── package.json                       ← assess-cli build config
├── lib/
│   ├── allowlist-cache.json           ← snapshot of /allowlistTools for fast lookup
│   ├── upsell-menu.json               ← templated upsell catalog
│   └── prompts/
│       ├── pain-points.txt
│       ├── tool-research.txt
│       └── ...
├── sub-skills/
│   ├── 01-transcript-normalize/SKILL.md
│   ├── 02-pain-points/SKILL.md
│   ├── 03-tool-research/SKILL.md
│   ├── 04-effort-impact/SKILL.md
│   ├── 05-quick-win-plan/SKILL.md
│   ├── 06-upsells/SKILL.md
│   ├── 07-financial/SKILL.md
│   └── 08-write-output/SKILL.md
├── runs/                              ← session folder, gitignored
│   └── {assessmentId}/
│       ├── transcript.txt
│       ├── 01-normalize.json
│       ├── 02-pain-points.json
│       └── ...
└── cli/                               ← assess-cli source
    └── src/
        ├── index.ts
        ├── fetch.ts
        ├── write.ts
        └── log.ts
```

### 11.2 Orchestrator skill contract

Reads `--id {assessmentId}`, executes sub-skills in order, halts on failure. Each sub-skill reads previous output JSON from `runs/{id}/`, writes its own JSON output. Re-running a single sub-skill is supported via `--start-from {skillNumber}`.

### 11.3 Sub-skills

| # | Name | Input | Output |
|---|---|---|---|
| 01 | transcript-normalize | raw transcript | cleaned transcript + extracted metadata (caller role, mentioned tools, team size hints) |
| 02 | pain-points | normalized transcript | array of pain points (description, verbatim quote, frequency, hours/wk, category, person affected) |
| 03 | tool-research | pain points | for each, 2–5 verified candidate tools with pricing, integrations, fit reasoning |
| 04 | effort-impact | pain points + recommendations | each scored 1–3 on effort and impact, quick-win flag set |
| 05 | quick-win-plan | quick-win recommendations | 4-day install checklist |
| 06 | upsells | non-quick-win pain points | 3–5 upsell opportunities with type, scope, value range |
| 07 | financial | hours saved + tool costs + industry hourly rate | headline numbers |
| 08 | write-output | all of the above | calls `assess-cli write` to push to Firestore |

Each sub-skill's `SKILL.md` includes: purpose, input contract (JSON schema), output contract (JSON schema), the actual prompt(s) used, edge cases, examples.

### 11.4 Prompt versioning

Each sub-skill prompt has a version string in its frontmatter. When `08-write-output` runs, it stamps `pipelineVersionId` on the assessment doc — a hash of all sub-skill prompt versions. Lets us correlate output quality with prompt changes.

## 12. CLI: `assess-cli`

Small TypeScript CLI Tay runs locally. Bridges Claude Code skills and Firebase. Handles auth so skills don't have to.

### 12.1 Auth

Reads `GETHOURS_SERVICE_TOKEN` from env. This is a long-lived JWT signed with a Firebase service account, presented as a Bearer token to `/api/cli/*` routes. Routes verify via Firebase Admin SDK.

### 12.2 Commands

```bash
# Fetch transcript + metadata for a specific assessment
assess-cli fetch --id {assessmentId} --out runs/{id}/

# List recent assessments by status
assess-cli list --status pending_processing

# Write final output to Firestore (called by sub-skill 08)
assess-cli write --id {assessmentId} --from runs/{id}/

# Log a pipeline run start/end (called by orchestrator)
assess-cli log-run --id {assessmentId} --status running
assess-cli log-run --id {assessmentId} --status success --report-path runs/{id}/

# Refresh local allowlist cache from Firestore
assess-cli sync-allowlist --out lib/allowlist-cache.json
```

### 12.3 Build

Single binary via `bun build` or `pkg`. Installable as `npm install -g @gethours/assess-cli` once published.

## 13. Tool recommendation quality

The make-or-break problem: LLMs hallucinate tool names, prices, and features constantly. Anti-fabrication is non-negotiable.

### 13.1 Layered approach

**Layer 1 — Allowlist first.** Sub-skill 03 starts by querying `lib/allowlist-cache.json` for tools matching the pain point's category and `painPointKeywords`. High-confidence match → use it, skip discovery. Aim to have allowlist cover ~80% of common pain points. Maintain via `/admin/allowlist`.

**Layer 2 — TAAFT task search.** For pain points without allowlist match:

- Translate pain point → 2–3 TAAFT-style task queries (e.g., "answering same buyer questions repeatedly" → `customer+support`, `faq+chatbot`, `email+autoresponder`)
- `web_fetch` each `https://theresanaiforthat.com/s/{task}/`
- Parse top ~5 tools, extract URLs to detail pages
- `web_fetch` detail pages for description, pricing, user count

**Layer 3 — Futuretools.io filtered search.** `web_search` with `site:futuretools.io {keywords}`. Tools appearing in both TAAFT and Futuretools get a confidence boost.

**Layer 4 — Verification (mandatory).** Before any tool enters the report:

- `web_fetch` the homepage. If 404 or parking → drop.
- Pull pricing page; confirm any specific price claim. If not verifiable → say "pricing varies, see [link]" rather than fabricate.
- If integration claim is made (e.g., "integrates with Asana") → verify on integrations page. If not verifiable → drop the integration claim.

**Layer 5 — Confidence floor.** No tool below ~70% confidence makes the final report. Pain points with no qualifying tool route to the upsells section as "candidate for custom build."

### 13.2 Allowlist seeding

Build the initial allowlist of 60–80 tools manually before launching. Categories to cover: meeting notes, scheduling, CRM, email automation, customer support, social scheduling, content generation, transcription, document automation, accounting, project management, lead capture, knowledge management. For each: name, URL, current pricing (verified by Tay), integrations, "why it works" template, install steps.

This is a one-time ~8-hour project that pays off forever. Refresh quarterly.

### 13.3 The moat

After 30–50 real assessments, the allowlist is materially better than what a competitor could assemble cold — it's filtered through actual client needs and Tay's hands-on validation. Over time, this becomes IP.

## 14. Email & booking integrations

### 14.1 Resend

Three transactional templates:

1. **Call confirmation** — sent immediately after `/api/voice/finalize`. "Thanks {name}, your report is being prepared. You'll receive it within 30 minutes at this email address."
2. **Report ready** — sent when status flips to `complete` and Tay has clicked "Send." "Your GetHours report is ready: `gethours.org/r/{shareId}`. Book a 30-min follow-up: {Cal.com link}."
3. **Admin notification** — sent to `tay@life-time.co` when assessment finishes call. "[GetHours] New assessment: {businessName} → {admin link}."

Optional later: 24-hour follow-up nudge if report viewed but no booking; 7-day re-engagement if no view.

### 14.2 Cal.com

- Single 30-min event type: "GetHours follow-up call"
- Embed in `/r/{shareId}` and in the report-ready email
- Pass `assessmentId` as URL param so Tay sees context on his Cal.com dashboard
- Webhook from Cal.com → mark assessment as `follow_up_booked` for analytics

## 15. Environment variables

### 15.1 Production (Firebase Functions config)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

GEMINI_API_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=hi@gethours.org
RESEND_ADMIN_EMAIL=tay@life-time.co

CAL_COM_BOOKING_URL=https://cal.com/tay/gethours-followup
CAL_COM_WEBHOOK_SECRET=

GETHOURS_CLI_SERVICE_TOKEN=
ADMIN_EMAIL_ALLOWLIST=tay@life-time.co
```

### 15.2 Local (Tay's Mac, for `assess-cli` and skills)

```
GETHOURS_API_BASE=https://gethours.org
GETHOURS_SERVICE_TOKEN=
```

## 16. Build phases

### Phase 1 — Voice + storage skeleton (week 1)

- [ ] Firebase project setup (Hosting, Firestore, Auth, Storage, Functions)
- [ ] Next.js scaffold deployed to gethours.org
- [ ] Firebase Auth with Google provider, single-email gate
- [ ] Marketing landing page at `/`
- [ ] `/start` form + minimal voice agent UI (button, status, end-call)
- [ ] Gemini Flash Live WebSocket proxy via `/api/voice/socket`
- [ ] Live transcript streaming to Firestore
- [ ] Audio recording to Firebase Storage
- [ ] `/api/voice/start` and `/api/voice/finalize`
- [ ] Resend integration: client confirmation + admin notification emails
- [ ] **Goal:** Tay can complete a 12-min call end-to-end. Transcript persists.

### Phase 2 — Skills pipeline (week 2)

- [ ] `assess-cli` — fetch, write, log-run, sync-allowlist
- [ ] `/api/cli/*` routes with service-token auth
- [ ] Orchestrator skill + 8 sub-skills, each with prompts + JSON contracts
- [ ] Initial allowlist of 60–80 tools (manual build)
- [ ] Tool research with TAAFT + Futuretools fetch + verification
- [ ] First report written to `publicReports/{shareId}`
- [ ] **Goal:** Run 3 free pilot assessments end-to-end.

### Phase 3 — Admin backend (week 3)

- [ ] `/admin` dashboard with metrics + needs-attention panel
- [ ] `/admin/queue` listing
- [ ] `/admin/r/{id}` with full view + edit + actions
- [ ] `/admin/live/{id}` for real-time call viewing
- [ ] Manual send gate (status: `manual_review` → admin clicks "Send")
- [ ] **Goal:** Tay runs the entire ops loop from gethours.org without touching code.

### Phase 4 — Public report polish (week 4)

- [ ] `/r/{shareId}` styled report with all sections
- [ ] Effort × Impact matrix interactive viz
- [ ] Cal.com embed for follow-up booking
- [ ] `/sample` pre-rendered demo report
- [ ] View tracking
- [ ] **Goal:** First paid assessment delivered.

### Phase 5 — Iteration tools (week 5+)

- [ ] `/admin/prompts` — Iris prompt versioning
- [ ] `/admin/allowlist` — CRUD UI
- [ ] `/admin/analytics` — cross-assessment insights
- [ ] Auto-send toggle per prompt version (once trust is established)
- [ ] A/B testing of prompts
- [ ] Cal.com booking webhook → mark `follow_up_booked`

### Phase 6 (deferred) — Multi-user

- [ ] Replace single-email allowlist with role-based access
- [ ] River and contractors can access admin
- [ ] Per-user assessment ownership

### Phase 7 (deferred) — Server-side pipeline

- [ ] Port skill orchestration to server (Cloud Run with headless Claude Code, or Anthropic API system prompts in Cloud Functions)
- [ ] Enable fully unattended end-to-end flow
- [ ] Trigger: when manual local pipeline becomes the bottleneck (10+ assessments/week)

## 17. Open decisions

- **Voice model selection** — `gemini-3.1-flash-live-preview` (newer features, preview status) vs `gemini-2.5-flash-live-native-audio` (more mature). Recommend starting with 3.1 preview, keep model name in `config/global` so swappable without code change.
- **Auto-send vs manual review** — v1 ships manual gate. Decide trigger to enable auto-send: probably "after 20 successful manual sends with no edits required, auto-send for that prompt version."
- **Free vs paid mode** — `config/global.freePilotMode` toggles whether `/start` requires Stripe checkout first. v1 launches with `freePilotMode: true`. First 5–10 assessments free for testimonials; flip to paid after.
- **Audio retention** — defaulting to 90 days. Re-evaluate based on storage costs and value of historical recordings.
- **Report expiry** — should reports auto-expire (e.g., 90 days) or persist forever? Argue for forever in v1; reports are a portfolio artifact for Tay too.
- **Multi-language** — Live API supports 24 languages natively. v1 is English-only. Consider Portuguese for EU expansion in Phase 5+.
- **Orchestrator local vs server** — staying local for v1 (Phase 1–4). Phase 7 ports to server when volume demands it.

---

End of spec. Questions or changes go to Tay directly.
