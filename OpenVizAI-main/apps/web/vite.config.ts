import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { resolve } from "path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@openvizai/shared-types": resolve(
        __dirname,
        "../../packages/shared-types/src",
      ),
      "@openvizai/react": resolve(__dirname, "../../packages/react/src"),
    },
  },
});
