CREATE TABLE projectroles (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL DEFAULT 0,
    createat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    editat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);