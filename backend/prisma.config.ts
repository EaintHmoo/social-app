import "dotenv/config";
import { defineConfig } from "prisma/config";

// Read by the Prisma CLI (migrate, generate, studio) — not by the running app, which builds its
// own client in src/shared/config/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  // `seed` is what `prisma db seed` (and `prisma migrate reset`) runs.
  migrations: { path: "prisma/migrations", seed: "tsx src/database/seed.ts" },
  // Plain process.env (not prisma's env() helper, which throws when unset) so `prisma generate`
  // still works where no database is configured, e.g. during `npm ci` in the Docker build.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
