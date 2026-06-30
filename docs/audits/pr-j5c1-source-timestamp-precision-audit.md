# PR-J5C1 Source Timestamp Precision Audit

**Branch:** `feat/pr-j5c-codex-journey-editor`
**Regression revision:** `c1984a68-3a69-4b1f-ab55-17d12747efc3`
**Audit date:** 2026-06-26

---

## 1. PostgreSQL session timezone

Production preflight records `SHOW TIME ZONE` as **`GMT`** (equivalent to UTC for encoding purposes).

Trigger `update_updated_at_column()` uses `NOW()`, so future `journeys.updated_at` wall-clock values follow the **database session timezone**, not a fixed application locale.

---

## 2. Column types and precision

| Column | Table | Type | Precision | Example |
|--------|-------|------|-----------|---------|
| `updated_at` | `journeys` | `timestamp without time zone` | 6 | `2026-06-29 08:17:01.91939` |
| `source_updated_at` | `journey_revisions` | `timestamp with time zone` | 6 | `2026-06-29 00:17:01.919+00` |

---

## 3. Journey `updated_at` default and trigger

- **Default:** `NOW()` (`001_create_tables.sql`)
- **Trigger:** `update_journeys_updated_at` → `NEW.updated_at = NOW()`

---

## 4. Primary write paths

1. INSERT default `NOW()`
2. UPDATE trigger refresh via `NOW()`
3. Admin / publish transaction updates (trigger always refreshes)

Codex CLI never writes `journeys` directly.

---

## 5. Semantic policy: opaque wall-clock (not Asia/Shanghai)

**Removed assumption:** `journeys.updated_at` represents Asia/Shanghai local time.

**Evidence against Asia/Shanghai hardcoding:**

- Production `SHOW TIME ZONE = GMT`
- Trigger uses `NOW()` in session timezone
- Column is `timestamp without time zone` — no stored zone metadata
- An 8-hour offset between a legacy revision token and journey wall-clock only proves **prior application encoding**, not database column semantics

**Formal policy:**

- `journeys.updated_at` = **opaque wall-clock concurrency value**
- UTC is a **deterministic technical encoding** (`AT TIME ZONE 'UTC'`), not a claim that the original wall-clock was physically UTC
- One-to-one mapping: same wall-clock digits → same timestamptz token

---

## 6. Canonical timezone / encoding policy

| Constant | Value |
|----------|--------|
| `JOURNEY_TIMESTAMP_SEMANTIC` | `opaque_wall_clock` |
| `CANONICAL_ENCODING_ZONE` | `UTC` |

Does **not** depend on `process.env.TZ` or PostgreSQL session timezone for comparison SQL.

---

## 7. Millisecond precision policy

| Constant | Value |
|----------|--------|
| `JOURNEY_CONCURRENCY_TOKEN_PRECISION` | `milliseconds` |

Both sides: `date_trunc('milliseconds', ...)`. No tolerance. No second-level comparison.

---

## 8. Journey canonical SQL

```sql
to_char(
  (date_trunc('milliseconds', j.updated_at) AT TIME ZONE 'UTC') AT TIME ZONE 'UTC',
  'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
)
```

Example: wall-clock `2026-06-29 08:17:01.91939` → token **`2026-06-29T08:17:01.919Z`**

---

## 9. Revision canonical SQL

```sql
to_char(
  date_trunc('milliseconds', jr.source_updated_at) AT TIME ZONE 'UTC',
  'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
)
```

---

## 10. DB boolean match SQL

```sql
date_trunc('milliseconds', j.updated_at) AT TIME ZONE 'UTC'
=
date_trunc('milliseconds', jr.source_updated_at)
```

Publish authority: SQL boolean only — not JavaScript ISO string comparison.

---

## 11. Why not Node local timezone

JavaScript `Date` / `toISOString()` on `timestamp without time zone` values is environment-dependent. All canonical tokens and publish match decisions are computed in PostgreSQL.

---

## 12. Why no tolerance

Optimistic concurrency requires exact token equality. Truncation is deterministic via `date_trunc('milliseconds', ...)`.

---

## 13. Why milliseconds not microseconds

API/CLI expose millisecond ISO tokens; JS loses sub-millisecond precision. Single precision constant avoids dual paths.

---

## 14. Shared semantics: CLI, Admin, publish, create

| Surface | Behavior |
|---------|----------|
| **Dry-run / validate** | Client `sourceUpdatedAt` confirms user read baseline vs SQL canonical token |
| **Create (update/archive/restore)** | `INSERT … SELECT` writes `source_updated_at = date_trunc('milliseconds', j.updated_at) AT TIME ZONE 'UTC'` from locked Journey row — client string is **not** authoritative |
| **Publish** | SQL `source_timestamp_matches` boolean → `JOURNEY_REVISION_SOURCE_CHANGED` when false |
| **Admin detail / list** | SQL `source_timestamp_matches` via `getRevisionSourceTimestampMatch` / list query |
| **Codex CLI get** | Same domain fields |

---

## Regression revision decision

Revision `c1984a68-3a69-4b1f-ab55-17d12747efc3`:

| Field | Value |
|-------|--------|
| Journey wall-clock | `2026-06-29 08:17:01.91939` |
| Legacy revision token | `2026-06-29T00:17:01.919Z` (prior local-time encoding) |
| New journey token | `2026-06-29T08:17:01.919Z` |
| `sourceTimestampMatches` | **false** |

**Decision: `RECREATE_REQUIRED_AFTER_DEPLOYMENT`**

Post-deploy steps (not executed in this PR):

1. Reject revision — reason `LEGACY_SOURCE_TOKEN_ENCODING`
2. Re-read Journey
3. Create new pending revision (DB token → `2026-06-29T08:17:01.919Z`)
4. Preview → publish

**Do not** patch, auto-migrate, or publish the existing revision.
