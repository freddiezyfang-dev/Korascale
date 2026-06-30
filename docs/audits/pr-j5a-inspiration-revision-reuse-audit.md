# PR-J5A Inspiration Revision Reuse Audit

Audited against Production codebase @ `main` (post PR-J4A). Article/Inspiration revision is the reference workflow for Journey Revision infrastructure.

## Summary

| Area | Article implementation | Journey J5A decision |
|------|---------------------|----------------------|
| Pending model | One pending per article; supersede on new submit | Same: supersede `pending_review` on new revision for same `journey_id` |
| Status vocabulary | `pending`, `published`, `rejected`, `superseded` | Journey adds `draft`, `pending_review` (no `pending` alias) |
| Publish transaction | `FOR UPDATE` + revalidate + single COMMIT | Reuse pattern |
| Source conflict | `source_updated_at` vs `articles.updated_at` | `source_updated_at` vs `journeys.updated_at` |
| Admin auth | `enforceAdminRead` / `enforceAdminWrite` | Reuse directly |

## Reuse matrix

| Existing module | Purpose | Reuse directly | Adapt for Journey | Keep separate | Reason |
|-----------------|---------|----------------|-------------------|---------------|--------|
| `src/lib/auth/requireAdmin.server.ts` | Session + `isAdmin` gate | Yes | — | — | Same trust model; auth before DB reads |
| `src/lib/db.ts` `query` / `withTransaction` | PG access + transactions | Yes | — | — | Publish must be atomic |
| `src/lib/seo/revisionAdmin.server.ts` `RevisionAdminError` pattern | Structured admin errors | Pattern only | Yes (`JourneyRevisionError`) | Yes | Different error codes & HTTP mapping |
| `src/lib/seo/revisionConflict.ts` | Source drift detection | Pattern only | Yes (`detectJourneyRevisionSourceConflict`) | Yes | Journey uses `journeys.updated_at` only |
| `src/lib/seo/revisionAdmin.server.ts` publish transaction | Lock → validate → write → mark published | Pattern only | Yes (`publishJourneyRevision`) | Yes | Writes `journeys`, not `articles` |
| `src/lib/seo/articleRevisionQuery.server.ts` | CRUD queries | — | Adapt | Yes | Separate table & snapshot shape |
| `src/lib/seo/revisionSubmit.ts` | CLI/Codex file submit | — | — | Yes | Journey uses Admin API + future Codex contract |
| `src/lib/seo/schema.ts` | Editable field validation | — | — | Yes | Journey full snapshot + J3B gate |
| `src/lib/seo/reviewMetadata.ts` | `changeSummary`, `factCheckItems` | Structure reuse | Yes | Partial | Same JSON shape in `review_metadata` |
| `src/lib/seo/revisionDiff.ts` | Field diff helpers | Optional later | Optional | Yes | J5A uses `change_summary` array |
| `src/app/api/admin/article-revisions/_lib/responses.ts` | Error JSON helper | Pattern only | Yes | Partial | Same `{ error, message }` shape |
| `database/migrations/019_create_article_revisions_table.sql` | Revision table DDL | Pattern only | Adapt | Yes | Different columns & CHECK constraints |
| `database/migrations/024_add_article_revision_source_updated_at.sql` | Optimistic lock column | Yes | — | — | Same conflict semantics |
| `database/migrations/020_add_article_revision_review_metadata.sql` | Review metadata JSONB | Yes | — | — | Journey `review_metadata` + `change_summary` |
| `src/lib/journeyNormalization/journeyPublishIntegrityGate.server.ts` | J3B active publish gate | Yes | — | — | Required before active publish |
| `src/lib/journeyNormalization/journeySlugUniqueness.server.ts` | J3C slug conflict | Yes | — | — | Dry-run + publish recheck |
| `src/lib/journeyNormalization/journeyAdminMutation.server.ts` | Journey INSERT/UPDATE SQL | Reuse builders | Yes | Partial | Publish applies snapshot via same SQL builders |
| `src/components/admin/ArticleRevisionPanel.tsx` | Admin UI | — | — | Yes | J5A: no Preview UI |
| `scripts/seo/submit-revision.ts` | CLI submit | — | — | Yes | Journey uses `/api/admin/journey-revisions` |

## 1. Direct reuse (no refactor)

- **Admin auth:** `enforceAdminRead`, `enforceAdminWrite`, `requireAdmin` — never trust client role headers.
- **Transaction pattern:** `withTransaction`, row locks (`FOR UPDATE`), rollback on any failure.
- **Source conflict model:** store `source_updated_at` at revision creation; compare to live row at publish; HTTP 409, no auto-rebase.
- **Review metadata shape:** `changeSummary[]`, optional `factCheckItems[]`, rejection reason — stored in `review_metadata`, not merged into publish payload.
- **Supersede pending:** Article `supersedePendingRevisions` → Journey supersede `pending_review` for same `journey_id` on new create.

## 2. Extract shared later (not in J5A)

- Generic revision status helpers (`canPublish`, `canReject`) — duplicated lightly in `stateMachine.ts` for Journey.
- Shared `{ ok, error, message }` response type — copied pattern, no cross-domain package yet.

## 3. Journey-only (must not unify with Article)

| Concern | Why separate |
|---------|--------------|
| Full Journey snapshot (`source_snapshot` / `proposed_snapshot`) | Articles store editable subset only; Journeys need normalized columns + full JSONB `data` |
| Operations `create` / `update` / `archive` / `restore` | Articles are update-only SEO revisions |
| J3B Publish Integrity Gate | Active Journey requires normalized fields + slug/type validation |
| J3C slug uniqueness | Journey slug collisions across active/archived rows |
| Price field lock | Price normalization frozen (025C2 not started) |
| Archive / restore status rules | No Article equivalent |
| Relationship validation (Journey IDs, Article IDs) | Journey `relatedTrips` + `relationships` block |
| `seo_complete` server recompute | Client value stripped; gate sets column on publish |

## Pending revision cardinality

**Article:** index `idx_article_revisions_article_pending` + `supersedePendingRevisions` on submit — effectively one pending revision per article.

**Journey J5A:** mirror with partial index `journey_revisions_journey_pending_review_idx` + supersede on create. Not a hard DB unique constraint (same as Article).

## Status transitions (Article reference)

```
pending → published | rejected | superseded
published → (terminal)
rejected → (terminal)
superseded → (terminal)
```

**Journey J5A** extends with `draft` and `pending_review`; see `src/lib/journeyRevisions/stateMachine.ts`.

## Files audited

- `database/migrations/019_create_article_revisions_table.sql`
- `database/migrations/020_add_article_revision_review_metadata.sql`
- `database/migrations/024_add_article_revision_source_updated_at.sql`
- `src/lib/seo/articleRevisionQuery.server.ts`
- `src/lib/seo/revisionSubmit.ts`
- `src/lib/seo/revisionAdmin.server.ts`
- `src/lib/seo/revisionConflict.ts`
- `src/app/api/admin/article-revisions/**`
- `src/components/admin/ArticleRevisionPanel.tsx`

## Non-goals (J5A)

- Do not rewrite Article revision workflow.
- Do not merge tables or shared revision ORM.
- Do not execute `027` migration in this PR.
