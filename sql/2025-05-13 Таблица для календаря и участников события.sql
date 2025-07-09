
CREATE TABLE calendar (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    start TIMESTAMP,
    "end" TIMESTAMP,
    type VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    description VARCHAR,
    duedate TIMESTAMP,
    priority VARCHAR
);

CREATE TABLE attendeescalendar (
    primarykey UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendarId UUID NOT NULL REFERENCES calendar(primarykey) ON DELETE CASCADE,
    accountId UUID NOT NULL REFERENCES accounts(primarykey) ON DELETE CASCADE,
    UNIQUE (calendarId, accountId)
);