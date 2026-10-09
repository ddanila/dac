import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.DAC_BASE || "/",
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
