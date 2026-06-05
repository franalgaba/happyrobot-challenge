import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { getRequestListener } from "@hono/node-server";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Connect, Plugin } from "vite";
import { createDashboardBffApp } from "./bff/app.mjs";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, "../..");

type NextMiddleware = (error?: unknown) => void;
type DashboardBffEnv = Record<string, string | undefined>;

function parseEnvFile(filePath: string): DashboardBffEnv {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) return [];

        return [[match[1], match[2].replace(/^['"]|['"]$/g, "")]];
      }),
  );
}

function loadDashboardBffEnv(root: string, mode: string): DashboardBffEnv {
  return {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
    ...parseEnvFile(path.join(root, `.env.${mode}`)),
    ...parseEnvFile(path.join(root, `.env.${mode}.local`)),
  };
}

type BffMiddlewareHost = {
  middlewares: Connect.Server;
};

function installDashboardBff(server: BffMiddlewareHost, bffRequestListener: ReturnType<typeof getRequestListener>) {
  server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: NextMiddleware) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    void bffRequestListener(req, res).catch(next);
  });
}

function dashboardBffPlugin(bffRequestListener: ReturnType<typeof getRequestListener>): Plugin {
  return {
    name: "dashboard-hono-bff",
    configureServer(server) {
      installDashboardBff(server, bffRequestListener);
    },
    configurePreviewServer(server) {
      installDashboardBff(server, bffRequestListener);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = {
    ...process.env,
    ...loadDashboardBffEnv(repoRoot, mode),
    ...loadDashboardBffEnv(webRoot, mode),
  };
  const bffApp = createDashboardBffApp({ env, serveStaticAssets: false });
  const bffRequestListener = getRequestListener(bffApp.fetch);

  return {
    plugins: [dashboardBffPlugin(bffRequestListener), react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("react-simple-maps") || id.includes("node_modules/d3-")) {
              return "maps";
            }
            if (id.includes("@happyrobot-ai/sdk") || id.includes("livekit-client")) {
              return "voice";
            }
          },
        },
      },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
    preview: {
      port: Number(env.PORT) || 4173,
    },
  };
});
