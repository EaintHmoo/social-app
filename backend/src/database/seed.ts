import "dotenv/config";
import { prisma } from "../shared/config/prisma.js";
import { seedUsers } from "./seeders/user.seeder.js";

// Laravel: database/seeders/DatabaseSeeder.php — calls each seeder in order.
// Run with `npm run db:seed` (or `npx prisma db seed`, which runs this via prisma.config.ts).

// Seed accounts share a known password, so never let this touch a real database.
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed in production.");
  process.exit(1);
}

try {
  await seedUsers();
  // Add later seeders here (posts, follows, ...) — after users, since they reference them.
} finally {
  await prisma.$disconnect();
}
