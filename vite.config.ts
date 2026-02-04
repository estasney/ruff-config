import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from "node:url";
import { viteSingleFile } from "vite-plugin-singlefile";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  assetsInclude: ["./src/assets/**"],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    }
  },
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 10_000_000, // inline assets (bytes); tune as needed
    rolldownOptions: {
      output: {
        inlineDynamicImports: true, // single JS chunk (requires single input)
      },
    },
  },
})
