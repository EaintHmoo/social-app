import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./modules/auth/auth.routes.js";
import taskRoutes from "./modules/task/task.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import reactionRoutes from "./modules/reaction/reaction.routes.js";
import errorHandler from "./shared/middleware/errorHandler.js";
import { requireEnv } from "./shared/config/env.js";

const app = express();
app.use(express.json());

// Laravel: this is routes/api.php wiring up route groups/prefixes.
// Route::prefix('auth')->group(...); Route::prefix('tasks')->group(...);
// Each module owns its own router (src/modules/<name>/<name>.routes.ts); this is the only place
// that knows they exist, so adding a feature = one new folder + one line here.
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes); // now requires a valid JWT — see src/modules/auth/auth.middleware.ts
app.use("/posts/:postId/reactions", reactionRoutes);
app.use("/posts", postRoutes);

// Laravel: this is your app/Exceptions/Handler.php `render()` fallback. Must be registered last.
app.use(errorHandler);

// DB ချိတ်ပြီးမှ server စတင်ပါ
async function start() {
  await mongoose.connect(requireEnv("MONGO_URI"));
  console.log("MongoDB connected");
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

start().catch((err: Error) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
