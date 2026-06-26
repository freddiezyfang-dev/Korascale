# PR-J2 Journey Write-Path Audit

Generated: 2026-06-26 (Stage A Hardening)

## Summary

| Writer | File | Status | Type | SEO | Price | JSONB | Column | Required change |
|--------|------|--------|------|-----|-------|-------|--------|-----------------|
| Admin create | `src/app/admin/journeys/add/page.tsx` | `archived` option | display label | form → save payload | `price` column | full `data` via API | title, slug, image, etc. | ✅ status options → archived; dual-write via API |
| Admin edit | `src/app/admin/journeys/edit/[id]/page.tsx` | toggle → `archived` | display label | JSONB fields in save | `price` | merged via PUT | same | ✅ archived write; display maps inactive→archived |
| Admin list toggle | `src/app/admin/journeys/page.tsx` | `archived` / `active` | — | — | — | via Context API | — | ✅ filter uses archived (includes legacy inactive) |
| API POST | `src/app/api/journeys/route.ts` | `normalizeJourneyStatusForWrite` | `journey_type` label | dual-write JSONB | `price` column | `data` JSONB | structured cols | ✅ inactive→archived; dual-write helper |
| API PUT | `src/app/api/journeys/[id]/route.ts` | normalized on write | `journey_type` label | pageTitle, metaDescription, heroAlt JSONB | `price` | merge `data` | structured cols | ✅ status + metaDescription dual-write |
| API GET (public) | `src/app/api/journeys/route.ts` | compat read | label | from row mapper | `price` | yes | yes | read-only |
| API slug GET | `src/app/api/journeys/slug/[slug]/route.ts` | compat read | label | JSONB | `price` | yes | — | read-only |
| Context client | `src/context/JourneyManagementContext.tsx` | via API | label | client state | `price` | — | — | delegates to API |
| DB client | `src/lib/databaseClient.ts` | via API | — | — | — | — | — | no direct SQL |
| Admin cleanup | `src/app/api/admin/cleanup-db/route.ts` | UPDATE journeys | — | — | — | possible | — | out of PR-J2 scope; admin-only |
| Bulk import HTML | `scripts/import-journeys-to-vercel.html` | unknown | — | — | — | — | — | **MANUAL_REVIEW** — not in CI |
| SEO export | `src/lib/seo/exportCatalog.ts` | read-only | label | — | — | — | — | no writes |
| SEO revision | `scripts/seo/*` | articles only | — | — | — | — | — | not Journey |
| Test fixtures | `src/lib/inquiries/journeyRequestEnrichment.test.ts` | mock | label | — | — | — | — | update types only |
| Dry-run scripts | `scripts/migrations/pr-j2-*` | read-only | — | — | — | — | — | no writes |

## Answers

1. **仍写 `inactive` 的路径（迁移前已修复）**
   - ~~Admin add/edit/list toggle~~ → 现写 `archived`
   - ~~API POST/PUT raw status~~ → 现经 `normalizeJourneyStatusForWrite`（`inactive` 输入映射为 `archived`）
   - DB 中 59 条历史 `inactive` 仍可读，直至 025B backfill

2. **只写 JSONB 的字段**
   - `pageTitle`, `metaDescription`, `heroImage`, `heroAlt`, `journeyType`（API POST/PUT JSONB 部分）
   - itinerary, overview, offers, relatedTrips 等仍为 JSONB-only

3. **写 `journey_type` display label 的路径**
   - API POST/PUT `journey_type` 列（Explore Together 等标签）
   - Admin forms `journeyType` 字段

4. **Status validator**
   - `src/lib/journeyNormalization/write.ts` — `normalizeJourneyStatusForWrite`, `validateJourneyStatusForApiWrite`
   - `src/lib/journeyNormalization/status.ts` — `validateJourneyStatus` (read/audit)

5. **新建 Journey 是否写新 columns**
   - 025A 前：否（列不存在）
   - 025A 后 + `JOURNEY_NORMALIZATION_COLUMNS=1`：dual-write helper 启用 column 写入

6. **编辑是否会产生 column/JSONB 分歧**
   - 是（过渡期风险）：JSONB 始终更新；columns 仅在 env flag 启用后同步
   - 读路径：`fields.ts` 优先级矩阵消除 UI 分歧

7. **是否需要 dual-write**
   - **是**（过渡期）：JSONB + column 同步写入；JSONB 不删除直至 legacy 移除阶段

## Source-of-truth matrix

见 `src/lib/journeyNormalization/fields.ts` → `JOURNEY_SOURCE_OF_TRUTH_MATRIX`

| Logical field | Read priority | Write target | Legacy fallback | Future removal |
|---------------|---------------|--------------|-----------------|----------------|
| page title | `page_title` → `data.pageTitle` → `title` | dual-write | `title` | `data.pageTitle` |
| meta description | `meta_description` → `data.metaDescription` → `short_description` | dual-write | `short_description` | `data.metaDescription` |
| hero URL | `hero_image_url` → `data.heroImage` → `image` | dual-write | `image` | `data.heroImage` |
| hero alt | `hero_image_alt` → `data.heroAlt` | dual-write | none | `data.heroAlt` |
| type slug | `journey_type_slug` → `journey_type` label | dual-write slug + label | label | label after route cutover |
| price | structured cols → `price` + JSONB | manual only | `price` | JSONB price fields |
| status | `status` column | `archived` / `active` / `draft` | read `inactive` | `inactive` vocabulary |
| published | `status = active` (or NULL compat) | — | NULL-as-active | strict `active` only |
| seo_complete | `seo_complete` column | admin/computed only | — | never gates publish |

## Status vocabulary (Journey-only)

| Value | DB today | Write (Stage A) | Read (public) | Read (admin) | After 025B | After 025C |
|-------|----------|-----------------|---------------|--------------|------------|------------|
| `active` | 24 | active | published | active | active | active |
| `inactive` | 59 | **mapped → archived** | not published | shown as archived | → archived | blocked |
| `draft` | 0 | draft | not published | draft | draft | draft |
| `archived` | 0 | archived | not published | archived | archived | archived |
| `NULL` | 0 | — | compat published | — | — | blocked |

Non-Journey entities (articles, hotels, experiences, extensions) retain their own `inactive` vocabulary — unchanged.
