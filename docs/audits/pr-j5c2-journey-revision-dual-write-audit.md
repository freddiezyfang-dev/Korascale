# PR-J5C2 — Journey Revision Dual-Write Audit

**Date:** 2026-07-01
**Scope:** Code + tests only — no Production writes, no Revision history changes.

---

## 1. Executive summary

Production Journey Revision publish previously routed through the legacy Admin mutation builder (`buildJourneyUpdateMutation` / `buildJourneyCreateMutation`), which only writes normalized columns when `JOURNEY_NORMALIZATION_COLUMNS=1`.

**First publish** (`1f53d729-974e-4e8e-89d2-522c80643d1b`) updated JSONB only.
**Corrective publish** (`6b9d0b18-5dcb-4579-9ca6-4baa89157d3a`) succeeded only because the operator set `JOURNEY_NORMALIZATION_COLUMNS=1` on the CLI.

PR-J5C2 removes that dependency for the Revision publish path and adds post-write integrity verification inside the publish transaction.

---

## 2. Where the environment variable blocked column writes

| Layer | File | Behavior (pre-J5C2) |
|-------|------|---------------------|
| Flag gate | `src/lib/journeyNormalization/write.ts` | `getExpandedColumnEntries()` returns `[]` when `JOURNEY_NORMALIZATION_COLUMNS !== '1'` |
| SQL merge | `mergeExpandedColumnSql()` | Skips `page_title`, `meta_description`, etc. when flag off |
| Admin update | `journeyAdminMutation.server.ts` → `buildJourneyUpdateMutation()` | Always writes JSONB compatibility keys; column SET clauses only via `mergeExpandedColumnSql` |
| Revision publish | `publish.server.ts` | Called Admin mutation with default `env-flag` policy |

**Root cause:** Revision publish reused the Admin writer without overriding the flag policy. JSONB keys (`data.metaDescription`, etc.) were written in the same UPDATE, but normalized columns were omitted.

---

## 3. Why the first Revision only updated JSONB

1. `snapshotToMutationBody()` maps `meta_description` → `metaDescription`.
2. `buildJourneyUpdateMutation()` assigns `jsonbUpdates.metaDescription` unconditionally.
3. `mergeExpandedColumnSql()` only adds `meta_description = $n` when `JOURNEY_NORMALIZATION_COLUMNS=1`.
4. Publish marked the revision `published` before J5C2 post-write verification existed.
5. J3A public runtime reads **`meta_description` column only** (`publicNormalizedFields.ts`), so the live page unchanged.

---

## 4. Why the corrective Revision succeeded

Corrective revision `6b9d0b18-…` was created and published with `JOURNEY_NORMALIZATION_COLUMNS=1` on the CLI.

With the flag on, `getExpandedColumnEntries()` included `meta_description`, and the same UPDATE wrote both column and JSONB. Production data is now consistent (J3A `metaDescriptionMismatchIds = []`).

---

## 5. Affected normalized fields

| Normalized column | Compatibility JSONB |
|-------------------|---------------------|
| `page_title` | `data.pageTitle` |
| `meta_description` | `data.metaDescription` |
| `hero_image_url` | `data.heroImage` |
| `hero_image_alt` | `data.heroAlt`, `data.heroImageAlt` |
| `journey_type_slug` | derived from `data.journeyType` / label |
| `display_order` | column only |
| `seo_complete` | server-computed; not from client snapshot |

Core scalar columns: `title`, `slug`, `status`, `short_description`.

---

## 6. Legacy Admin path vs Revision path

| Path | `JOURNEY_NORMALIZATION_COLUMNS` |
|------|----------------------------------|
| Admin API `POST/PUT /api/journeys` | Still used (unchanged) |
| Journey Revision publish | Not used (J5C2 `always` policy) |

---

## 7. J5C2 implementation

- `revisionPublishMutation.server.ts` — `normalizedColumnWritePolicy: 'always'`
- `postWriteIntegrity.server.ts` — verify columns + JSONB + prices before `markJourneyRevisionPublished`
- Error: `JOURNEY_REVISION_POST_WRITE_INTEGRITY_FAILED` (HTTP 500, transaction rollback)

---

## 8. Corrective Revision history (unchanged)

| Revision | Status | Role |
|----------|--------|------|
| `1f53d729-…` | published | Compatibility-only JSONB write |
| `6b9d0b18-…` | published | Normalized column correction |

Current Production data is consistent. No revision patches required.

---

## 9. Known pre-existing J3A baseline (2026-07-01 staged review)

### Mismatch Journey

| Field | Value |
|-------|-------|
| ID | `3468ea14-5f5e-40f6-9234-0fedf137189e` |
| Slug | `beijing-city-imperial-grandeur-urban-chic-1-day-tour` |

### origin/main baseline (`f67a082`)

| Metric | Value |
|--------|-------|
| `ready` | **false** |
| `visibleExcerptMismatchIds` | `["3468ea14-5f5e-40f6-9234-0fedf137189e"]` |
| `metaDescriptionMismatchIds` | `[]` |
| `active` | 24 |

### Current J5C2 branch (same Production DB)

| Metric | Value |
|--------|-------|
| `ready` | **false** |
| `visibleExcerptMismatchIds` | `["3468ea14-5f5e-40f6-9234-0fedf137189e"]` (identical) |
| `metaDescriptionMismatchIds` | `[]` |
| `active` | 24 |

### Field values (Production read-only, both baselines identical)

| Source | Value |
|--------|-------|
| `short_description` column | Navigating the Monumental Scale of Dynastic History and the Avant-Garde Ambition of a Modern Metropolis. |
| `meta_description` column | Explore Beijing in one day from Tiananmen Square and the Forbidden City to Jingshan Park, Hutong alleys, and Sanlitun's contemporary edge. |
| `data.metaDescription` | Same as `meta_description` column |
| `resolveVisibleExcerpt` | `short_description` tagline (unchanged) |
| Public meta resolver | `meta_description` column only |

### Mismatch reason

J3A preflight flags a row when `resolveVisibleExcerpt(row) !== (meta_description column || visible excerpt)`. After corrective Revision `6b9d0b18-…` updated **only** `meta_description` (meta-only publish), the visible excerpt (`short_description`) and SEO meta column diverged. This is **orthogonal** to J5C2 dual-write code.

### J5C2 impact on J3A

- J5C2 **did not** modify `pr-j3a-public-source-preflight.ts` (byte-identical to `origin/main`).
- J5C2 **did not** modify `publicSourcePreflight.ts` or `publicNormalizedFields.ts`.
- J5C2 **did not** write Production Journey data.
- **No new** mismatch IDs; mismatch set **unchanged** vs `origin/main`.
- `metaDescriptionMismatchIds` remains `[]` (J5C2 target field aligned).

### PR acceptance framing

- J3A public normalized source remains operational (`metaDescriptionMismatchIds = []`, `active = 24`).
- Normalized/compatibility mismatches **introduced by J5C2** = **0**.
- Pre-existing visible excerpt mismatch remains unchanged; **not fixed in J5C2**.
