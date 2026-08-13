import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "shared/**/*.test.ts",
      "shared/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
      "mobile/**/*.test.ts",
      "mobile/**/*.spec.ts",
      "mobile/**/*.test.tsx",
      "mobile/**/*.spec.tsx",
    ],
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
  },
});
