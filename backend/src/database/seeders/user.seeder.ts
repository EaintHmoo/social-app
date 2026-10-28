import bcrypt from "bcryptjs";
import { prisma } from "../../shared/config/prisma.js";
import type { UserRole, UserStatus } from "../../generated/prisma/client.js";

// Laravel: database/seeders/UserSeeder.php. Fixed, hand-written accounts (no faker) so you always
// know who to log in as. Every account shares one password (SEED_USER_PASSWORD).

type SeedUser = {
  username: string;
  displayName: string;
  email: string;
  role?: UserRole;
  status?: UserStatus;
  verified?: boolean; // defaults to true
};

const users: SeedUser[] = [
  { username: "admin", displayName: "Admin", email: "admin@example.com", role: "admin" },
  { username: "alice", displayName: "Alice Nguyen", email: "alice@example.com" },
  { username: "bob", displayName: "Bob Tan", email: "bob@example.com" },
  { username: "carol", displayName: "Carol Lim", email: "carol@example.com" },
  { username: "dave", displayName: "Dave Kumar", email: "dave@example.com" },
  // Edge cases worth having around while testing auth and policies:
  { username: "unverified", displayName: "Unverified User", email: "unverified@example.com", verified: false },
  { username: "suspended", displayName: "Suspended User", email: "suspended@example.com", status: "suspended" },
];

export async function seedUsers(): Promise<void> {
  const password = process.env.SEED_USER_PASSWORD ?? "password123";
  // Hash once and reuse it: bcrypt is deliberately slow, so hashing per user adds up.
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  for (const u of users) {
    // Laravel: User::firstOrCreate(['email' => ...], [...]). `update: {}` means re-running the
    // seeder never overwrites an account you've changed by hand — it only fills in missing ones.
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        passwordHash,
        role: u.role ?? "user",
        status: u.status ?? "active",
        emailVerifiedAt: u.verified === false ? null : now,
      },
    });
  }

  console.log(`Seeded ${users.length} users (password: ${password})`);
}
