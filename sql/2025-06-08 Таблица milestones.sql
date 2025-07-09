CREATE TABLE milestones (
  primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Planned',
  assignee_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_milestones_project
    FOREIGN KEY (project_id)
    REFERENCES projects(primarykey)
    ON DELETE CASCADE,
  CONSTRAINT fk_milestones_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES accounts(primarykey)
    ON DELETE SET NULL
);

-- Индексы для ускорения выборок
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_date    ON milestones(date);