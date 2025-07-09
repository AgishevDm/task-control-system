
CREATE TABLE chat_attachments (
    primarykey UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message UUID NOT NULL REFERENCES chat_messages(primarykey),
    fileId UUID NOT NULL REFERENCES file(primarykey),
    fileName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    fileType TEXT NOT NULL,
    uploadedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);