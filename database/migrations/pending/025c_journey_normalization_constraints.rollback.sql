-- Rollback 025C — drops CHECK constraints only.

BEGIN;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_price_basis_check;
ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_currency_check;
ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_journey_type_slug_check;
ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check;

COMMIT;
