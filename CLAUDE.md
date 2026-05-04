# voice-agent / GetHours.org — assistant runbook

Durable notes for any Claude Code session working in this repo. Read `SPEC.md`
for the full product spec, `HANDOFF.md` for the call→report data contract, and
`README.md` for the prototype-server architecture.

## What ships where

| Piece | Host | Where | Deploy |
|---|---|---|---|
| Voice WS server (`server/`) | Fly.io | app `voice-agent-ws`, region `syd`, `voice-agent-ws.fly.dev` | `flyctl deploy -a voice-agent-ws` |
| Frontend (`app/`) | Vercel | `https://src-azure-phi.vercel.app` | `git push origin main` (auto-deploys) |
| Firestore rules | Firebase project `gethours-app` | `firestore.rules` | `firebase deploy --only firestore:rules` |

GitHub remote: `git@github.com:upperspacecase/voice-agent.git`. Note: `deploy.txt`
incorrectly lists `upperspacecase/clario` (the project's old name) — ignore it.

Fly secrets already set: `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`,
`FIREBASE_SERVICE_ACCOUNT_KEY`, `JWT_SECRET`. To inspect deployed env, use
`flyctl ssh console -a voice-agent-ws -C 'sh -c "printenv NAME"'`.

## Local Firebase admin setup (assess-cli + skill pipeline)

The pipeline runs locally on Tay's Mac and needs Firestore admin access.

- Service account JSON lives at `~/.gethours/service-account.json` (chmod 600).
  If it's missing, generate a new one from Firebase Console → Project
  `gethours-app` → Project Settings → Service Accounts → Generate new private
  key, then save to that exact path.
- `.env.local` (gitignored) carries `FIREBASE_PROJECT_ID=gethours-app` and
  `GOOGLE_APPLICATION_CREDENTIALS=/Users/taypattison/.gethours/service-account.json`.
- `lib/firebase-admin.ts` accepts either `FIREBASE_SERVICE_ACCOUNT_KEY` (raw
  JSON, used on Fly) or `GOOGLE_APPLICATION_CREDENTIALS` (path, used locally).

Smoke check the local creds: `npx tsx -e "import('./lib/firebase-admin.js').then(m => m.adminDb().collection('assessments').limit(1).get().then(s => console.log('ok', s.size)))"`.

## The GetHours skill pipeline

After a finished Iris call, run on Tay's Mac:

```
/gethours-pipeline {assessmentId}
/gethours-pipeline {assessmentId} --start-from {N}
```

The orchestrator (`~/.claude/skills/gethours-pipeline`) walks eight sub-skills
(`gethours-skill-01-...` through `gethours-skill-08-...`) in numeric order.
Each writes `runs/{assessmentId}/NN-<name>.json`. Halt on any failure; resume
with `--start-from N`. The orchestrator's bridge to Firestore is `assess-cli`.

### `assess-cli` (this repo, `cli/`)

Already symlinked to `~/.local/bin/assess-cli`. Three subcommands the
orchestrator calls:

- `assess-cli fetch --id ID --out runs/ID/` — pulls `assessments/ID` doc and
  the `transcript` subcollection into `runs/ID/{metadata.json,transcript.json,transcript.txt}`.
- `assess-cli write --id ID --from runs/ID/` — atomic `WriteBatch` of
  `runs/ID/08-write-output.json` to `assessments/ID` (status flips to
  `manual_review`) plus `publicReports/{shareId}`.
- `assess-cli log-run --id ID --status running|success|failed [--error MSG] [--report-path X]`
  — appends to `assessments/ID/pipelineRuns/{runId}`.

Source: `cli/assess-cli.ts` + `cli/{fetch,write,log-run}.ts`. Wrapper:
`bin/assess-cli` (runs via `npx tsx`, no build step).

### One-time seeds

- `npm run seed:config` — writes `config/global` with `bookingUrlBase` and
  defaults from `SPEC.md §6.9`. Sub-skill 08 fails closed without it.

### Known data-quality gotchas

- Allowlist (`/allowlistTools`) is empty. Sub-skill 03 falls back to TAAFT +
  Futuretools + web verification on every pain point; first run is slow.
- Iris's current prompt may not probe deeply enough for `currentProcess`,
  `whatTried`, `costOfBreaking` (per `HANDOFF.md` Phase 3 requirements).
  Sub-skill 02 will produce shallow pain points if the transcript is thin.

## Querying Firestore from a session

For ad-hoc queries (list recent assessments, check status, etc.) without
pulling the service account locally, use the deployed Fly machine:

```
flyctl ssh console -a voice-agent-ws -C 'npx tsx -e "..."'
```

Quoting through three shell layers is awkward. If you find yourself fighting
escapes, write the script to a temp file and `flyctl ssh sftp` it over.

## Firestore data model (cheat sheet)

| Path | Owned by | Purpose |
|---|---|---|
| `assessments/{id}` | API routes + `assess-cli write` | internal admin doc, full call lifecycle |
| `assessments/{id}/transcript/{turnId}` | `server/firestore-writer.ts` | live-streamed turns from the WS relay |
| `assessments/{id}/pipelineRuns/{runId}` | `assess-cli log-run` | each pipeline run's status + errors |
| `publicReports/{shareId}` | `assess-cli write` | public-safe denormalized report rendered at `/r/{shareId}` |
| `config/global` | `npm run seed:config` | site-wide settings (price, bookingUrlBase, etc.) |
| `prompts/{promptId}` | not yet implemented | versioned Iris prompts |
| `allowlistTools/{toolId}` | not yet implemented | curated tool DB |

`shareId` is a 10-char nanoid minted by `app/api/voice/start/route.ts` and
must NEVER be regenerated downstream. Sub-skill 08 reads it from the existing
assessment doc.

## Style for this codebase

- Match the existing terse, comment-light style. The few comments that exist
  explain WHY, not WHAT. Don't add docstrings or section banners.
- Server code under `server/` is a Node WS relay — TypeScript ESM, runs via
  `tsx watch`, no build step. Keep it that way.
- API routes under `app/api/` use Next.js's `runtime = "nodejs"` because they
  use `firebase-admin`.
- Don't add TaskCreate plans for trivial single-file changes.
