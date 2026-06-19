import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

const isElectronDev = process.argv.includes("--electron");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: "electron/main.ts",
        vite: { build: { outDir: "dist-electron", watch: isElectronDev ? {} : null } },
      },
      {
        entry: "electron/preload.ts",
        vite: { build: { outDir: "dist-electron" } },
      },
    ]),
    electronRenderer(),
  ],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  server: {
    open: !isElectronDev,
  },
});
