import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  server: { host: true },
  build: { outDir: "dist", emptyOutDir: true },
});
