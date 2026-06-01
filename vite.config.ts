import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
// base "/Priorizacao/" no build → assets corretos no GitHub Pages
// (project page). Em dev/test fica na raiz "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Priorizacao/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
}))
