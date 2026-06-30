# PR-J5C Inspiration Codex Workflow Reuse Audit

Audited against `main` post PR-J5B. Article/Inspiration Codex revision is the reference for Journey Editor Skill and controlled CLI.

## Reuse matrix

| Existing component | Article purpose | Reuse for Journey | Adaptation needed | Security notes |
|--------------------|-----------------|-------------------|-------------------|----------------|
| `.agents/skills/korascale-seo-revise/SKILL.md` | Codex workflow: export → edit → dry-run → submit pending | Pattern reuse | Journey-specific intents (archive/restore), no file workspace | Never auto-publish; explicit publish phrase + revision UUID |
| `.agents/skills/korascale-seo-shared/references/revision-schema.md` | Revision JSON shape, `changeSummary`, `factCheckItems` | Structure reuse | Journey uses `changes` partial snapshot, not full article export | `sourceUpdatedAt` from live Journey read |
| `scripts/seo/loadEnv.ts` | Load `.env.local`, `requireDatabaseEnv`, `parseArgs` | Pattern reuse | `scripts/codex/loadEnv.ts` with subcommand parsing | Never log `POSTGRES_URL` / tokens |
| `scripts/seo/submit-revision.ts` | CLI entry: dry-run / submit | Pattern reuse | `scripts/codex/journey-revision-cli.ts` subcommands | Journey create/publish blocked in prep mode |
| `src/lib/seo/revisionSubmit.ts` | Direct DB insert pending article revision | **Do not reuse** | Journey uses `src/lib/journeyRevisions/dryRun.server.ts` domain service | Article bypasses API; Journey must not write `journeys` |
| `src/lib/auth/requireAdmin.server.ts` | `enforceAdminRead` / `enforceAdminWrite` | Reuse for HTTP path | CLI uses domain service with same validation | Never trust client `role` / `isAdmin` headers |
| `src/app/api/admin/journey-revisions/**` | — | Primary HTTP transport | Codex CLI calls domain service locally; remote agents may use Admin API | CSRF + session on mutating routes |
| `SEO_REVISION_CREATED_BY` / actor | `created_by` on article revisions | Reuse env pattern | `JOURNEY_REVISION_CREATED_BY` (fallback `SEO_REVISION_CREATED_BY`) | Actor written to `created_by` / `published_by` |
| Dry-run before write | `submitSeoRevision({ dryRun: true })` | Reuse | `codexDryRunJourneyRevision` → `dryRunJourneyRevision` | Dry-run creates no revision row |
| Preview URL | Admin article revision panel | Reuse path pattern | `/admin/journey-revisions/{id}/preview` | Pending revisions excluded from sitemap |
| Publish guard | Human-only; no Codex publish in SEO skill | Stricter for Journey | `--revision` + `--confirm` same UUID; production needs `--confirm-production` | Reject vague approval (“looks good”) |
| Production environment guard | Implicit via local `.env.local` | Explicit | `CODEX_JOURNEY_ENVIRONMENT`, `CODEX_JOURNEY_REVISION_WRITE_ENABLED` | Default: writes blocked unless `WRITE_ENABLED=true` |
| `docs/workflows/codex-journey-editor-contract.md` | J5A contract draft | Extend in J5C | Skill + usage doc reference this contract | Price fields locked; no direct SQL |

## Transport decision (J5C)

| Path | When | Auth |
|------|------|------|
| **Domain service** (`operator.server.ts` → `dryRun.server.ts` / `publish.server.ts`) | Local CLI (`npm run journey:revision`) | DB env + prep guard; same validation as Admin API |
| **Admin Revision API** | Remote/browser automation with admin session | `enforceAdminWrite` + CSRF |

**Forbidden:** direct `INSERT`/`UPDATE`/`DELETE` on `journeys`; repository bypass without revision state machine; new public unauthenticated endpoints.

## Secrets handling

- Load credentials only from environment (`.env.local`), never from Skill or docs.
- CLI output passes through `redactSecrets()` for connection strings and Bearer tokens.
- Skill and usage doc reference command names only, not connection strings.

## Divergence from Article Codex (intentional)

| Concern | Article | Journey J5C |
|---------|---------|-------------|
| Write path | `revisionSubmit.ts` → `article_revisions` | Domain service → `journey_revisions` only |
| Publish | Not in Codex skill | Explicit instruction + dual UUID confirm |
| Operations | Update-only SEO | create / update / archive / restore |
| Price | N/A | Frozen — `JOURNEY_REVISION_PRICE_FIELDS_LOCKED` |
| Images | Not in revise skill scope | URL validation only; upload deferred to J5D |
