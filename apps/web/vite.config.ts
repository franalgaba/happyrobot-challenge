import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const apiBaseUrl = env.API_BASE_URL ?? "http://localhost:3000";
  const apiKey = env.API_KEY ?? "";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api/reports": {
          target: apiBaseUrl,
          changeOrigin: true,
          headers: apiKey ? { "X-API-Key": apiKey } : undefined,
        },
      },
    },
  };
});
