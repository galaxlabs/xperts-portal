import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const FRAPPE_URL = process.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/frappe": {
        target: FRAPPE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api\/frappe/, "/api"),
      },
    },
  },
});
