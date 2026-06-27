# Database migrations

## Execution model: **manual only**

This project does **not** auto-run SQL migrations on Vercel build, `next start`, or deploy.

| Mechanism | Behavior |
|-----------|----------|
| `npm run db:init` / `scripts/init-database.js` | Runs **only** `001_create_tables.sql` |
| `scripts/run-migration.js` | Requires **explicit filename** argument |
| `vercel.json` | No migration hooks |
| `package.json` `build` | `next build` only |

Approved migrations live in `database/migrations/`.

**Unapproved / stage B migrations** live in `database/migrations/pending/` and must be executed manually via `psql` after human review:

```bash
psql "$POSTGRES_URL" -f database/migrations/025a_journey_normalization_expand.sql
# After preview approval:
psql "$POSTGRES_URL" -f database/migrations/pending/025b_journey_normalization_backfill.sql
psql "$POSTGRES_URL" -f database/migrations/pending/025c_journey_normalization_constraints.sql
```

Never move pending files back into the root migrations folder until approved for execution.

## PR-J2 order

1. `025a_journey_normalization_expand.sql` — nullable columns only
2. Deploy app with `JOURNEY_NORMALIZATION_COLUMNS=1` (Preview only, after 025A)
3. `pending/025b_journey_normalization_backfill.sql` — after preview approval
4. `pending/025c_journey_normalization_constraints.sql` — after strict queries deployed
