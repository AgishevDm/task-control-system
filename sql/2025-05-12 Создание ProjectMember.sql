CREATE TABLE projectmembers (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projectId UUID NOT NULL REFERENCES projects(primarykey) ON DELETE CASCADE,
    accountId UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    roleId UUID NOT NULL REFERENCES projectroles(primarykey) ON DELETE RESTRICT,
    assignedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assignedById UUID REFERENCES accounts(primarykey) ON DELETE SET NULL,
    
    CONSTRAINT unique_project_account UNIQUE (projectId, accountId)
);