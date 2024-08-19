/** @type {import('vite').UserConfig} */
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

import url from "node:url"

export default defineConfig({
  plugins: [vue()],
  server: {
    hmr: false
  },
  resolve: {
    alias: {
      "@": url.fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    manifest: true,
  },
})
