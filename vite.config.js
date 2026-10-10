import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.DAC_BASE || "/",
  define: {
    "import.meta.env.VITE_ROBOTRON_MODEL_REVISION": JSON.stringify(
      createHash("sha256")
        .update(
          readFileSync(
            new URL(
              "./public/models/robotron-1715m/model.json",
              import.meta.url,
            ),
          ),
        )
        .digest("hex")
        .slice(0, 16),
    ),
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: "three", test: /node_modules\/three/ }],
        },
      },
    },
  },
});
