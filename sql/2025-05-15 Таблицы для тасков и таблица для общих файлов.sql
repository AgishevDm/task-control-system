-- Создание таблицы задач
CREATE TABLE tasks (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    color VARCHAR(50),
    projectid UUID NOT NULL REFERENCES projects(primarykey),
    createdby UUID NOT NULL REFERENCES accounts(primarykey),
    assignedto UUID REFERENCES accounts(primarykey),
    status VARCHAR(50),
    priority VARCHAR(50),
    startdate TIMESTAMP,
    enddate TIMESTAMP,
    duedate TIMESTAMP,
    stage VARCHAR(50),
    createdat TIMESTAMP DEFAULT NOW(),
    updatedat TIMESTAMP DEFAULT NOW(),
    UNIQUE (projectid, number)
);

-- Индексы для tasks
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_project ON tasks(projectid);

-- Таблица комментариев
CREATE TABLE taskcomments (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taskid UUID NOT NULL REFERENCES tasks(primarykey),
    accountid UUID NOT NULL REFERENCES accounts(primarykey),
    comment TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW(),
    updatedat TIMESTAMP DEFAULT NOW()
);

-- Таблица прикрепленных файлов к задачам
CREATE TABLE taskattachments (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taskid UUID NOT NULL REFERENCES tasks(primarykey) ON DELETE CASCADE,
    fileid UUID NOT NULL REFERENCES files(primarykey),
    uploadedby UUID NOT NULL REFERENCES accounts(primarykey),
    uploadedat TIMESTAMP DEFAULT NOW()
);

-- Таблица прикрепленных файлов к комментариям
CREATE TABLE commentattachments (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commentid UUID NOT NULL REFERENCES task_comments(primarykey) ON DELETE CASCADE,
    fileid UUID NOT NULL REFERENCES files(primarykey),
    uploadedby UUID NOT NULL REFERENCES accounts(primarykey),
    uploadedat TIMESTAMP DEFAULT NOW()
);

-- Таблица тегов
CREATE TABLE tags (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7) NOT NULL
);

-- Связь задач с тегами
CREATE TABLE tasktags (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(iprimarykeyd) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(primarykey) ON DELETE CASCADE,
    UNIQUE (task_id, tag_id)
);

-- Таблица файлов
CREATE TABLE files (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(512) NOT NULL,
    size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES accounts(primarykey),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);