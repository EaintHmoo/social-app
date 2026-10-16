import "dotenv/config";
import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import reactionRoutes from "./modules/reaction/reaction.routes.js";
import errorHandler, { notFoundHandler } from "./shared/middleware/errorHandler.js";
import { prisma } from "./shared/config/prisma.js";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/posts/:postId/reactions", reactionRoutes);
app.use("/posts", postRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
// only when you really are behind a load balancer
app.set("trust proxy", 1);

// DB ချိတ်ပြီးမှ server စတင်ပါ
async function start() {
  // Fail fast if Postgres is unreachable, instead of on the first request.
  // Tables/indexes come from migrations (`npm run db:migrate`), not from app startup.
  await prisma.$connect();
  console.log("PostgreSQL connected");
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

start().catch((err: Error) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
