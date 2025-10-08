import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true, // Allow external connections
    port: 5174,
  },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
