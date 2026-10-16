import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // tsconfig "paths" only teach the type checker; Vite needs the same alias to actually bundle.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      // The browser refuses a cross-origin call from :5173 to :3000 unless the server sends CORS
      // headers, and backend/src/server.ts does not register any CORS middleware.
      //
      // This proxy sidesteps that entirely: the app requests a same-origin "/api/auth/login",
      // Vite strips the prefix and forwards "/auth/login" to the backend. No CORS, and no
      // backend change.
      //
      // The "/api" prefix is load-bearing, not decoration. Proxying the backend's own paths
      // ("/tasks", "/auth") directly would shadow the PAGE routes of the same name: a reload of
      // http://localhost:5173/tasks would be proxied to the API and render raw JSON instead of
      // the app. Namespacing every API call keeps the two sets of URLs from ever colliding.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
