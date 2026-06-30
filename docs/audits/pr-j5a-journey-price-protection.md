# PR-J5A Journey Price Protection Audit

Read-only audit of price-bearing fields across the Journey schema. No Production price data was modified.

## Protected paths (fixed list)

### Relational columns (`journeys` table)

| Path | Type | Notes |
|------|------|-------|
| `price` | numeric | Primary list price |
| `original_price` | numeric | Strikethrough / was price |
| `currency` | varchar | ISO currency code |
| `price_from` | numeric | From-price display |
| `price_basis` | varchar | e.g. per person |
| `price_on_request` | boolean | POR flag |
| `price_note` | text | Free-form price note |
| `price_valid_until` | timestamptz | Offer expiry |

### Root JSONB (`journeys.data`)

| Path | Notes |
|------|-------|
| `data.price` | Legacy mirror of column price |
| `data.originalPrice` | Legacy mirror |
| `data.priceDetails` | Structured price breakdown object |
| `data.priceCurrency` | Legacy currency in JSONB |
| `data.currency` | Alternate currency key |
| `data.priceBasis` | camelCase basis |
| `data.price_from` / `data.priceFrom` | snake/camel from-price |
| `data.price_on_request` / `data.priceOnRequest` | POR in JSONB |
| `data.price_note` / `data.priceNote` | Note in JSONB |
| `data.price_valid_until` / `data.priceValidUntil` | Expiry in JSONB |
| `data.pricing` | Nested pricing object when present |

### Nested arrays

| Path | Notes |
|------|-------|
| `data.availableDates[].price` | Per-date price |
| `data.availableDates[].originalPrice` | Per-date original |

## Enforcement (J5A)

1. **Create operation:** all protected paths must be null / absent in proposed snapshot.
2. **Update / archive / restore:** `compareProtectedPriceValues(source, proposed)` must return equal maps at dry-run and publish.
3. **Client changes:** `detectProtectedPricePathsInChanges` rejects any attempt to set protected paths (including full `data` replacement).
4. **Error code:** `JOURNEY_REVISION_PRICE_FIELDS_LOCKED` — never silent restore.

## Out of scope

- Automated price normalization (PR-025C2).
- Modifying live Journey prices in Production during J5A.
