import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { requireEnv } from "./env.js";

// Laravel: the DB facade / Eloquent connection. One client for the whole process — it holds a
// connection pool, so creating one per request would quickly exhaust Postgres connections.
// Prisma 7 talks to Postgres through a "driver adapter" wrapping the regular `pg` driver.
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
  // Laravel: `protected $hidden = ['password']`, but at the QUERY level: the hash is never even
  // loaded unless a query opts back in with `omit: { password: false }` (only login does).
  omit: { user: { password: true } },
});
