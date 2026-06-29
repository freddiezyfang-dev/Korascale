-- PR-J2C2 / 025C2: Optional Journey field CHECK constraints
-- DO NOT EXECUTE until 025C1 is deployed (or in same authorized window).
--
-- SCOPE: journey_type_slug, currency, price_basis — all allow NULL
-- DOES NOT modify any journey row data
-- DOES NOT set NOT NULL or defaults on price / metadata / seo_complete
--
-- ROLLBACK: 025c2_journey_optional_field_constraints.rollback.sql

BEGIN;

DO $$
DECLARE
  illegal_type INTEGER;
  illegal_currency INTEGER;
  illegal_basis INTEGER;
BEGIN
  SELECT COUNT(*) INTO illegal_type
  FROM journeys
  WHERE journey_type_slug IS NOT NULL
    AND journey_type_slug NOT IN (
      'explore-together', 'deep-discovery', 'signature-journeys', 'group-tours'
    );
  IF illegal_type <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C2: % rows with illegal journey_type_slug', illegal_type;
  END IF;

  SELECT COUNT(*) INTO illegal_currency
  FROM journeys
  WHERE currency IS NOT NULL
    AND BTRIM(currency) <> ''
    AND currency NOT IN ('USD', 'CNY', 'EUR');
  IF illegal_currency <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C2: % rows with illegal currency', illegal_currency;
  END IF;

  SELECT COUNT(*) INTO illegal_basis
  FROM journeys
  WHERE price_basis IS NOT NULL
    AND BTRIM(price_basis) <> ''
    AND price_basis NOT IN ('per_person', 'per_group');
  IF illegal_basis <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C2: % rows with illegal price_basis', illegal_basis;
  END IF;
END $$;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_journey_type_slug_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_journey_type_slug_check
  CHECK (
    journey_type_slug IS NULL
    OR journey_type_slug IN (
      'explore-together', 'deep-discovery', 'signature-journeys', 'group-tours'
    )
  );

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_currency_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_currency_check
  CHECK (currency IS NULL OR currency IN ('USD', 'CNY', 'EUR'));

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_price_basis_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_price_basis_check
  CHECK (price_basis IS NULL OR price_basis IN ('per_person', 'per_group'));

COMMIT;
