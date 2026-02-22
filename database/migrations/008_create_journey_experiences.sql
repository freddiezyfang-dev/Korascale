-- Journey 与 Experience 多对多关联表（与 prisma/schema.prisma 中 JourneyExperience 对应）
CREATE TABLE IF NOT EXISTS journey_experiences (
  journey_id    UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  sort_order    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (journey_id, experience_id)
);

CREATE INDEX IF NOT EXISTS idx_journey_experiences_journey_id ON journey_experiences(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_experiences_experience_id ON journey_experiences(experience_id);
