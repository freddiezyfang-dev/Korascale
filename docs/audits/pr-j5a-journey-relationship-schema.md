# PR-J5A Journey Relationship Schema

Read-only audit of how active Journeys reference other entities. No relationship data was modified.

## Storage model

Journey relationships live primarily in **`journeys.data` JSONB** plus normalized columns on `journeys`. There is no separate join table for related Journeys or Articles.

### Related Journeys

| Field | Location | Shape | ID vs slug |
|-------|----------|-------|------------|
| `relatedTrips` | `data.relatedTrips` | `{ title, duration, price, image, slug }[]` | **Slug-based** card refs; not UUID FK |
| `relatedJourneyIds` | `data.relatedJourneyIds` (optional) | `string[]` UUID | ID when present |
| `relatedJourneys` | `data.relatedJourneys` (legacy) | varies | treat as ID list if UUID-shaped |

**Public rendering:** `getRelatedTripsForJourney` filters `relatedTrips` by non-empty `slug` + `title` (`src/lib/journeySeo.server.ts`).

**Revision rule (J5A):** relationships are validated separately:

| Input | Validation | Storage |
|-------|------------|---------|
| `data.relatedTrips[].slug` | Resolve via `normalizeJourneySlugForComparison`; must exist in `journeys`; no self-link; no normalized duplicates | **Kept as slug** in `data.relatedTrips` — never rewritten to UUID |
| `relationships.relatedJourneyIds` | UUID must exist in `journeys`; no self-link; no duplicates | Synced to `data.relatedJourneyIds` only when `relationships` block is in changes |
| `relationships.relatedArticleIds` | UUID must exist in `articles.id` (UUID PK); no duplicates | Synced to `data.relatedArticles` only when `relationships` block is in changes |

Client must not supply invented UUIDs for `relatedTrips`; slug is the canonical public reference.

### Related Articles (Inspiration)

| Field | Location | Shape |
|-------|----------|-------|
| `relatedArticles` | `data.relatedArticles` | UUID[] (when used) |
| `related_articles` | `data.related_articles` | legacy alias |

Articles also link **to** Journeys via `articles.related_journey_ids` JSONB (inverse relation; not stored on Journey row).

### Destinations / media

| Field | Location | Notes |
|-------|----------|-------|
| `city`, `region`, `place` | columns + `data` | Geographic coverage |
| `destinations` | `data.destinations` | Optional structured refs |
| `images`, `gallery` | `data.images`, `data.gallery` | Media URLs/paths — validate existence only as warnings |
| `experiences`, `hotels`, `extensions` | `data.*` | ID arrays referencing admin catalogs |
| `overview.routeGeojson` | `data.overview` | Route map — preserve on merge |

## Validation rules (J5A dry-run)

1. **relatedTrips slugs** must match an existing Journey (`LOWER(BTRIM(slug))` comparison).
2. **Related Journey IDs** (`relationships.relatedJourneyIds`) must be valid UUIDs existing in `journeys`.
3. **Related Article IDs** must be valid UUIDs existing in `articles` (`articles.id` UUID PK per `005_create_articles_table.sql`).
4. **No self-link:** proposed Journey slug/ID cannot appear in related lists.
5. **No duplicate** slugs (normalized) or IDs in either list.
6. **Slug is not rewritten to ID** for `relatedTrips` — public cards keep slug references.
7. **Archived related Journeys:** allowed with **warning** `ARCHIVED_RELATED_JOURNEY`.
8. **Unknown JSONB keys** preserved when relationships are not in `changes`.

## Active corpus snapshot (PR-J4A baseline)

- 24/24 active Journeys: **0** DB `relatedArticles` arrays populated.
- 4/24 have non-empty `relatedTrips` (Explore Together SKUs).
- 14/24 have zero related Journey + zero related Article IDs.

## Future revision merge behavior

Partial `changes` merge:

1. Deep-merge `data` — **preserve unknown keys**.
2. Merge `relationships` into snapshot; sync `data.relatedTrips` from resolved IDs when explicit ID list provided.
3. Never drop `itinerary`, `gallery`, `FAQ`, `overview` on partial update.

## Out of scope (J5A)

- Creating Inspiration ↔ Journey links in Production.
- Redirect rules for archived Journeys.
- Resolving experience/hotel/extension catalog IDs (warn only if obviously invalid UUID format).
