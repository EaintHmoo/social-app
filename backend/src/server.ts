import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./modules/auth/auth.routes.js";
import taskRoutes from "./modules/task/task.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import reactionRoutes from "./modules/reaction/reaction.routes.js";
import errorHandler, { notFoundHandler } from "./shared/middleware/errorHandler.js";
import { requireEnv } from "./shared/config/env.js";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes); // now requires a valid JWT — see src/modules/auth/auth.middleware.ts
app.use("/posts/:postId/reactions", reactionRoutes);
app.use("/posts", postRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
// only when you really are behind a load balancer
app.set("trust proxy", 1);

// DB ချိတ်ပြီးမှ server စတင်ပါ
async function start() {
  await mongoose.connect(requireEnv("MONGO_URI"));
  await mongoose.connection.syncIndexes();
  console.log("MongoDB connected");
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

start().catch((err: Error) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
