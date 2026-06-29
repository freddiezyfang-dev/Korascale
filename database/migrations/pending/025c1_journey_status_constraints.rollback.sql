-- Rollback 025C1 — drop status CHECK and NOT NULL only.
-- Does NOT modify any journey row data.

BEGIN;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check;
ALTER TABLE journeys ALTER COLUMN status DROP NOT NULL;

COMMIT;
