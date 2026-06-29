# PR-J3C — Slug Database Uniqueness Audit

Last updated: 2026-06-29 (preparation closeout)

## Current `journeys.slug` schema (Production)

| Property | Value |
|----------|--------|
| Data type | `character varying` |
| Nullable | **NO** (`is_nullable = NO`) |
| Default | none |
| Current data | `nullSlugCount = 0`, `emptySlugCount = 0`, `whitespaceOnlySlugCount = 0` |

J3C **does not** modify slug NOT NULL, drop existing constraints, or clean slug data.

## Existing slug uniqueness: `journeys_slug_key`

```text
journeys_slug_key
UNIQUE (slug)
```

**Role:**

- Exact string uniqueness
- Case-sensitive
- Does not ignore leading/trailing whitespace

Identical slug strings cannot coexist today regardless of J3C.

## J3C target: `journeys_slug_normalized_unique_idx`

```sql
CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx
ON journeys (LOWER(BTRIM(slug)))
WHERE slug IS NOT NULL
  AND BTRIM(slug) <> '';
```

**Role:**

- Blocks case variants (`Foo` vs `foo`)
- Blocks trim variants (` slug ` vs `slug`)
- Covers **active / draft / archived** (not limited to public rows)

## Coexistence strategy

| Action | J3C policy |
|--------|------------|
| Drop `journeys_slug_key` | **No** |
| Alter `journeys_slug_key` | **No** |
| Add normalized expression index | **Yes** (026, not executed in prep) |
| Forward migration abort on `journeys_slug_key` present | **No** — allowed existing constraint |
| Rollback drops | **Only** `journeys_slug_normalized_unique_idx` |
| Rollback preserves `journeys_slug_key` | **Yes** — post-check verifies it still exists |

026 forward guards abort only when:

- normalized duplicate groups > 0
- target index already exists with **wrong** definition
- row counts / active slug integrity checks fail

## NULL / empty semantics (documentation vs Production)

**Production today:** slug NOT NULL + `journeys_slug_key` means NULL slugs do not exist; identical empty strings would also be blocked by exact unique if they occurred.

**026 index predicate** (`WHERE slug IS NOT NULL AND BTRIM(slug) <> ''`) is forward-compatible design — it documents how normalized uniqueness would behave if slug became nullable in a **future** schema PR. J3C does **not** implement that schema change.

Draft journeys saving without a slug is an **application-layer / future schema** topic — not modified in J3C.

## Duplicate scan (83 rows)

Equivalence rule:

```sql
LOWER(BTRIM(slug))
```

Preparation baseline:

```text
normalizedDuplicateGroups = []
activeMissingSlugIds = []
activeInvalidCanonicalSlugIds = []
```

## API error contract

| Source | HTTP | error |
|--------|------|-------|
| J3B active publish pre-check (slug conflict) | 422 | `JOURNEY_PUBLISH_INTEGRITY_FAILED` |
| J3C app pre-check (draft/archived non-active flow) | 409 | `JOURNEY_SLUG_CONFLICT` |
| DB race on `journeys_slug_key` | 409 | `JOURNEY_SLUG_CONFLICT` |
| DB race on `journeys_slug_normalized_unique_idx` | 409 | `JOURNEY_SLUG_CONFLICT` |
| Other `23505` unique violations | existing generic handling | not slug-specific |

PostgreSQL may report either uniqueness object first depending on the conflicting value; both map to the same stable 409 contract.

## Concurrency

Load → pre-check → single atomic INSERT/UPDATE is not one serializable transaction. Unique constraints/indexes reject the losing writer; API returns 409 without partial writes.

## Rollback

Drops only `journeys_slug_normalized_unique_idx`. Verifies row fingerprint unchanged and `journeys_slug_key` still present.

## Out of scope (not in J3C)

- slug NOT NULL changes
- canonical-format DB CHECK
- DROP `journeys_slug_key`
- archived slug cleanup / redirects
- Journey content or metadata edits
