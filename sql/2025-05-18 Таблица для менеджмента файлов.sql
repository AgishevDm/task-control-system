CREATE TABLE "file_hierarchy" (
    "primarykey" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "type" "FileType" NOT NULL DEFAULT 'FILE',
    "s3_key" VARCHAR UNIQUE NOT NULL,
    "parent_id" UUID,
    "file_id" UUID,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
);

CREATE INDEX idx_parent ON "file_hierarchy" ("parent_id");
CREATE INDEX idx_s3_key ON "file_hierarchy" ("s3_key");
CREATE INDEX idx_owner ON "file_hierarchy" ("owner_id");