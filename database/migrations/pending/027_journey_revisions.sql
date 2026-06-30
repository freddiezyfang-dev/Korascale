-- PR-J5A: Journey revisions table (PREPARED — do not execute in J5A)
-- Codex/admin proposed Journey changes awaiting review; does not modify journeys until publish.

CREATE TABLE IF NOT EXISTS journey_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NULL REFERENCES journeys(id) ON DELETE RESTRICT,
  operation VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_review',
  schema_version INTEGER NOT NULL DEFAULT 1,

  source_updated_at TIMESTAMPTZ NULL,
  source_snapshot JSONB NULL,
  proposed_snapshot JSONB NOT NULL,

  change_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by VARCHAR(255) NOT NULL,
  published_by VARCHAR(255) NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NULL,
  rejected_at TIMESTAMPTZ NULL,

  CONSTRAINT journey_revisions_operation_check
    CHECK (operation IN ('create', 'update', 'archive', 'restore')),

  CONSTRAINT journey_revisions_status_check
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'superseded')),

  CONSTRAINT journey_revisions_journey_id_check
    CHECK (
      (operation IN ('update', 'archive', 'restore') AND journey_id IS NOT NULL)
      OR (operation = 'create' AND status = 'published' AND journey_id IS NOT NULL)
      OR (operation = 'create' AND status <> 'published')
    ),

  CONSTRAINT journey_revisions_create_source_null_check
    CHECK (
      (operation = 'create' AND source_updated_at IS NULL AND source_snapshot IS NULL)
      OR (operation <> 'create')
    ),

  CONSTRAINT journey_revisions_mutate_source_required_check
    CHECK (
      (operation IN ('update', 'archive', 'restore') AND source_updated_at IS NOT NULL AND source_snapshot IS NOT NULL)
      OR (operation IN ('create'))
    ),

  CONSTRAINT journey_revisions_published_at_check
    CHECK (
      (status = 'published' AND published_at IS NOT NULL)
      OR (status <> 'published' AND published_at IS NULL)
    ),

  CONSTRAINT journey_revisions_rejected_at_check
    CHECK (
      (status = 'rejected' AND rejected_at IS NOT NULL)
      OR (status <> 'rejected' AND rejected_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS journey_revisions_status_idx
  ON journey_revisions(status);

CREATE INDEX IF NOT EXISTS journey_revisions_journey_id_idx
  ON journey_revisions(journey_id)
  WHERE journey_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS journey_revisions_created_at_idx
  ON journey_revisions(created_at DESC);

CREATE INDEX IF NOT EXISTS journey_revisions_journey_pending_review_idx
  ON journey_revisions(journey_id)
  WHERE status = 'pending_review';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_journey_revisions_updated_at'
      AND tgrelid = 'journey_revisions'::regclass
  ) THEN
    CREATE TRIGGER update_journey_revisions_updated_at
      BEFORE UPDATE ON journey_revisions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

COMMENT ON TABLE journey_revisions IS 'Admin/Codex proposed Journey revisions; publish applies to journeys';
COMMENT ON COLUMN journey_revisions.source_snapshot IS 'Full Journey snapshot at revision creation (NULL for create)';
COMMENT ON COLUMN journey_revisions.proposed_snapshot IS 'Full merged Journey state to apply on publish';
COMMENT ON COLUMN journey_revisions.source_updated_at IS 'journeys.updated_at at revision creation; publish conflict detection';
