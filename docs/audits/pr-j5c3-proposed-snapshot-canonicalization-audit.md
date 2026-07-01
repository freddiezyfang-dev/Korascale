# PR-J5C3 Proposed Snapshot Canonicalization Audit

Date: 2026-07-01

Scope: Journey Revision dry-run / create / preview proposed snapshot canonicalization. This PR does not publish, reject, patch, supersede, or recreate Production revision `f7f7e6a5-6ed6-4fe1-8f0c-791cda138c2d`.

## Root Cause

The revision request changed only the normalized field `meta_description`.

Before PR-J5C3:

1. Raw request contained `changes.meta_description`.
2. `mergeChangesIntoProposedSnapshot()` merged scalar normalized fields into the top-level snapshot.
3. `data` was only updated from `changes.data`.
4. Because the request did not include `changes.data.metaDescription`, the proposed snapshot kept the source JSONB value.
5. For `f7f7e6a5-6ed6-4fe1-8f0c-791cda138c2d`, `proposed_snapshot.meta_description` changed, but `proposed_snapshot.data.metaDescription` was `null`.

Therefore dry-run, stored proposed snapshot, and J5B Preview could show a raw proposed snapshot that was not the final effective publish shape.

## Compatibility Timing

Before J5C3, compatibility JSONB was defensively generated at publish time by the J5C2 mutation path. That protected the final Journey row, but it meant Preview could differ from the eventual write.

After J5C3, compatibility JSONB is generated before validation and before revision creation:

```text
source snapshot
→ allowed user changes
→ canonicalize normalized fields
→ derive compatibility JSONB
→ validate
→ dry-run resolvedSnapshot / stored proposed_snapshot / preview
```

Publish still performs defensive dual-write and post-write integrity. J5C3 does not remove J5C2 safeguards.

## Single Mapping Source

The mapping now lives in:

`src/lib/journeyRevisions/compatibilityMapping.ts`

Canonical mappings:

| Normalized field | Compatibility JSONB |
| --- | --- |
| `page_title` | `data.pageTitle` |
| `meta_description` | `data.metaDescription` |
| `hero_image_url` | `data.heroImage` |
| `hero_image_alt` | `data.heroAlt` and legacy `data.heroImageAlt` |
| `journey_type_slug` / `journey_type` | `data.journeyType` label |

Hero alt policy: `data.heroAlt` is the canonical compatibility key, and `data.heroImageAlt` is preserved as a legacy alias. Both are synchronized from normalized `hero_image_alt`; conflicts are resolved by the normalized authoritative value.

Journey type policy: compatibility JSONB stores the display label, using the real slug-to-label mapping from `JOURNEY_TYPE_LABELS`. The slug is not written into `data.journeyType`.

`display_order` is not synchronized into JSONB because no confirmed compatibility JSONB key is used by the current Journey schema.

`seo_complete` remains server-owned and is not accepted from clients.

## Fields At Risk

This was not limited to `meta_description`. Any normalized field with a compatibility JSONB key had the same risk if a user changed only the normalized field:

- `page_title`
- `meta_description`
- `hero_image_url`
- `hero_image_alt`
- `journey_type_slug` / `journey_type`

## Preview Semantics

J5B Preview reads the stored `proposed_snapshot`. After J5C3, that snapshot is canonicalized before storage, so Preview reads the effective publish snapshot, not a raw partially merged snapshot.

Compatibility synchronization is one technical effect of the same business change. User-facing change summary should still show only the business field, such as `meta_description`, while technical metadata can note that `data.metaDescription` was synchronized.

## Legacy Pending Revision

Revision `f7f7e6a5-6ed6-4fe1-8f0c-791cda138c2d` remains unchanged. It is a read-only regression sample with a known proposed snapshot mismatch.

J5C3 publish behavior for legacy mismatched pending revisions:

- Do not auto-patch.
- Do not publish.
- Return `JOURNEY_REVISION_PROPOSED_SNAPSHOT_INTEGRITY_FAILED`.

After J5C3 deployment, the expected operational path is:

1. Get old revision and confirm proposed snapshot mismatch.
2. Reject it with reason `PROPOSED_SNAPSHOT_COMPATIBILITY_MISMATCH`.
3. Re-read latest Journey.
4. Create a new revision with the same `meta_description`.
5. Confirm new revision has `sourceTimestampMatches=true` and matching top-level/JSONB proposed values.

## Database Identity

The previous CLI output `127....0.0.1/32/neondb` came from `inet_server_addr()` plus `current_database()`. That value identifies the local transport endpoint seen by PostgreSQL and the database name; it does not by itself prove the upstream Production project when a proxy/tunnel is involved.

Production classification must rely on the existing Journey Revision production guard and masked database identity resolver, without printing database URLs or credentials. No unrelated identity-guard refactor is included in PR-J5C3.

## No Production Writes

This preparation PR does not:

- publish current revision
- reject current revision
- patch current revision
- update Production Journey
- create a Production revision
- run migrations
- deploy
- commit
- push
