
-- 1) Создаём тип для прав шаринга
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_permission') THEN
     CREATE TYPE share_permission AS ENUM ('VIEW', 'COMMENT', 'EDIT');
   END IF;
END$$;

-- 2) Создаём таблицу file_shares
CREATE TABLE IF NOT EXISTS file_shares (
  primarykey                 UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_hierarchy_id  UUID               NOT NULL,
  account_id         UUID               NOT NULL,
  permission         share_permission   NOT NULL DEFAULT 'VIEW',
  created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  -- Уникальное ограничение: один и тот же файл одному юзеру не дублируется
  CONSTRAINT uniq_file_share UNIQUE (file_hierarchy_id, account_id),

  -- Внешние ключи
  CONSTRAINT fk_file_hierarchy
    FOREIGN KEY (file_hierarchy_id)
    REFERENCES file_hierarchy (primarykey)
    ON DELETE CASCADE,

  CONSTRAINT fk_account
    FOREIGN KEY (account_id)
    REFERENCES accounts (primarykey)
    ON DELETE CASCADE
);

-- 3) Добавляем индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_file_shares_account
  ON file_shares (account_id);

CREATE INDEX IF NOT EXISTS idx_file_shares_file
  ON file_shares (file_hierarchy_id);
