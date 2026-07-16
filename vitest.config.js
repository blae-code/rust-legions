import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Standalone Vitest config — deliberately does NOT load the base44 Vite plugin
// (dev-server proxy/HMR machinery is irrelevant to unit tests). It only needs
// the "@/" → src alias so the frontend rules mirrors import cleanly.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.js"],
    environment: "node",
  },
});
