# PR-J3A — JOURNEY_NORMALIZATION_COLUMNS Flag Audit

Last updated: 2026-06-29 (preparation)

## J3A policy

| Concern | Policy |
|---------|--------|
| Public reads | **No longer depend on flag** (PR-J3A) |
| Admin dual-write | **Still gated** by `isJourneyExpandedColumnsEnabled()` in `write.ts` |
| Vercel env var | **Keep** `JOURNEY_NORMALIZATION_COLUMNS=1` on Production — do not delete in J3A |
| Flag deprecation | Documented as **deprecated for public reads** only |

## References by category

| File | Usage | Public impact after J3A |
|------|-------|-------------------------|
| `write.ts` | `isJourneyExpandedColumnsEnabled()` for INSERT/UPDATE dual-write | None — write path only |
| `adminCompatFields.ts` | Column read gated when flag off | None — admin only |
| `publicNormalizedFields.ts` | **No flag reference** | Public independent |
| `journeyListQuery.server.ts` | Public mapper uses `publicNormalizedFields` | Independent |
| Migration preflight scripts | Set flag=1 for expanded column SELECT | HISTORICAL_SCRIPT |
| `safetyGates.test.ts` | Regression for admin compat + write SQL | Test only |
| Docs (`pr-j2-rollout-order.md`, ledger) | Rollout history | Reference |

## Flag independence verification

Public mapper (`mapJourneyRowToPublicJourney`) and public resolvers do not call `isJourneyExpandedColumnsEnabled()`.

Tests assert identical public output when flag is `1`, `0`, or unset.

## Post-J3A recommendation (not in this PR)

After J3A deploy acceptance, consider making dual-write unconditional (always write columns) while keeping the env var until a follow-up removes the gate entirely. **Do not modify Vercel in J3A.**
