import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";

// P2002 = a unique constraint was violated (e.g. duplicate email). Laravel: QueryException 23505.
export function isUniqueViolation(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

// Ids are UUID columns, so Postgres rejects anything else with an error. Services check first and
// treat a malformed id as "not found" — the same 404 the client would get for an unknown id.
export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}
