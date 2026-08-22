import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from "node:url";
import { viteSingleFile } from "vite-plugin-singlefile";

import { ruffRules } from "./plugins/ruffRules";

const buildDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [react(), ruffRules(), viteSingleFile()],
  assetsInclude: ["./src/assets/**"],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    }
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 10_000_000,
    rolldownOptions: {
      output: {
        inlineDynamicImports: true, // single JS chunk (requires single input)
      },
    },
  },
})
