-- Rollback 025C2 — drop optional field CHECK constraints only.
-- Does NOT modify any journey row data.

BEGIN;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_price_basis_check;
ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_currency_check;
ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_journey_type_slug_check;

COMMIT;
