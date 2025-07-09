CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица roles
CREATE TABLE roles (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    level INTEGER,
    createat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица accounts
CREATE TABLE accounts (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    isEmailVerified BOOLEAN DEFAULT FALSE,
    password TEXT NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    role UUID REFERENCES roles(primarykey),
    createat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatarurl TEXT,
    status VARCHAR(255),
    creator UUID REFERENCES roles(primarykey)
);

-- Индексы для accounts
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_login ON accounts(login);

-- Таблица teams
CREATE TABLE teams (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project UUID NOT NULL REFERENCES projects(primarykey)
    createat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createby UUID NOT NULL REFERENCES accounts(primarykey)
);

-- Таблица teammembers
CREATE TABLE teammembers (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team UUID NOT NULL REFERENCES teams(primarykey) ON DELETE CASCADE,
    accountid UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL,
    joinedat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Уникальный индекс для teammembers
CREATE UNIQUE INDEX idx_teammembers_team_account ON teammembers(team, accountid);

-- Таблица projects
CREATE TABLE projects (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createby UUID NOT NULL REFERENCES accounts(primarykey),
    status VARCHAR(255),
    logoUrl TEXT NULL
);

CREATE INDEX idx_projects_team ON projects(team);

-- Таблица tasks
CREATE TABLE tasks (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project UUID NOT NULL REFERENCES projects(primarykey) ON DELETE CASCADE,
    createby UUID NOT NULL REFERENCES accounts(primarykey),
    assignedto UUID REFERENCES accounts(primarykey),
    status VARCHAR(255) NOT NULL,
    priority VARCHAR(255),
    duedate TIMESTAMP,
    createat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_project_status ON tasks(project, status);
CREATE INDEX idx_tasks_assignedto ON tasks(assignedto);

-- Таблица taskcomments
CREATE TABLE taskcomments (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    taskid UUID NOT NULL REFERENCES tasks(primarykey) ON DELETE CASCADE,
    account UUID NOT NULL REFERENCES accounts(primarykey),
    comment TEXT NOT NULL,
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица taskattachments
CREATE TABLE taskattachments (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task UUID NOT NULL REFERENCES tasks(primarykey) ON DELETE CASCADE,
    file TEXT NOT NULL,
    uploadedby UUID NOT NULL REFERENCES accounts(primarykey),
    uploadedtat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица tags
CREATE TABLE tags (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(255) NOT NULL
);

-- Таблица tasktags
CREATE TABLE tasktags (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task UUID NOT NULL REFERENCES tasks(primarykey) ON DELETE CASCADE,
    tag UUID NOT NULL REFERENCES tags(primarykey) ON DELETE CASCADE
);

-- Уникальный индекс для tasktags
CREATE UNIQUE INDEX idx_tasktags_task_tag ON tasktags(task, tag);

-- Таблица usersettings
CREATE TABLE usersettings (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accountid UUID UNIQUE NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    theme VARCHAR(255),
    language VARCHAR(255),
    isnotifications BOOLEAN NOT NULL DEFAULT TRUE
);

-- Таблица file
CREATE TABLE file (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(255),
    userId UUID NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    value TEXT NOT NULL
);

-- Таблица chat
CREATE TABLE chat (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo TEXT,
    account UUID NOT NULL REFERENCES accounts(primarykey)
);

-- Таблица chat_members
CREATE TABLE chat_members (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat UUID NOT NULL REFERENCES chat(primarykey) ON DELETE CASCADE,
    account UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE
);

-- Уникальный индекс для chat_members
CREATE UNIQUE INDEX idx_chat_members_chat_account ON chat_members(chat, account);

-- Таблица chat_messages
CREATE TABLE chat_messages (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat UUID NOT NULL REFERENCES chat(primarykey) ON DELETE CASCADE,
    account UUID NOT NULL REFERENCES accounts(primarykey),
    content TEXT NOT NULL,
    isedited BOOLEAN NOT NULL DEFAULT FALSE,
    createat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица read_message
CREATE TABLE read_message (
    message UUID NOT NULL REFERENCES chat_messages(primarykey) ON DELETE CASCADE,
    account UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    isread BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (message, account)
);

-- Таблица applogs
CREATE TABLE applogs (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    priority INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    machinename VARCHAR(255) NOT NULL,
    appdomainname TEXT NOT NULL,
    processid TEXT NOT NULL,
    message TEXT NOT NULL
);

--новое

CREATE TABLE notifications (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    isread BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity UUID, -- Может ссылаться на задачу, проект и т.д.
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account UUID REFERENCES accounts(primarykey),
    entity_type VARCHAR(255) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_templates (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    structure JSONB NOT NULL, -- Может содержать шаблонные задачи, статусы и т.д.
    createdby UUID REFERENCES accounts(primarykey),
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calendar_events (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    creator UUID NOT NULL REFERENCES accounts(primarykey),
    createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    recurrence_rule TEXT
);

CREATE TABLE event_participants (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event UUID NOT NULL REFERENCES calendar_events(primarykey) ON DELETE CASCADE,
    account UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    UNIQUE(event, account)
);