-- Generated with `prisma migrate diff`, then hand-edited so it runs on a database that already
-- has rows: existing users get a placeholder username, and old refresh tokens are deleted
-- (they belong to the old one-table session design, so everyone simply logs in again).

-- citext = case-insensitive text, used for email, username and new_email.
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "SessionRevokeReason" AS ENUM ('logout', 'logout_all', 'reuse', 'password_changed', 'admin_revoked');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('email_verify', 'password_reset', 'email_change');

-- AlterTable: username starts nullable so existing rows can be backfilled before NOT NULL applies.
-- Timestamps were stored as UTC without a zone, hence AT TIME ZONE 'UTC'.
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "email_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "password_changed_at" TIMESTAMPTZ(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "username" CITEXT,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "email" SET DATA TYPE CITEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- Placeholder usernames for existing accounts: unique (from the id) and valid for the register
-- validator (letters, digits, underscore). Users can change them once profile editing exists.
UPDATE "users" SET "username" = 'user_' || left(replace("id"::text, '-', ''), 12) WHERE "username" IS NULL;
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" VARCHAR(512),
    "ip" INET,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_reason" "SessionRevokeReason",
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Old-design tokens have no sessions row to point at, so they can't satisfy the new foreign key.
-- Deleting them signs everyone out once; that's the whole cost.
DELETE FROM "refresh_tokens";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropIndex
DROP INDEX "refresh_tokens_user_id_idx";

-- AlterTable (the table is empty now, so dropping and re-adding session_id loses nothing)
ALTER TABLE "refresh_tokens" DROP COLUMN "ip",
DROP COLUMN "revoked_at",
DROP COLUMN "revoked_reason",
DROP COLUMN "session_started_at",
DROP COLUMN "updated_at",
DROP COLUMN "user_agent",
DROP COLUMN "user_id",
ADD COLUMN     "used_at" TIMESTAMPTZ(3),
DROP COLUMN "session_id",
ADD COLUMN     "session_id" UUID NOT NULL,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropEnum
DROP TYPE "RevokeReason";

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "VerificationType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "new_email" CITEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "ip" INET,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_type_used_at_idx" ON "verification_tokens"("user_id", "type", "used_at");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
