import type { Hono } from "hono";

type DashboardBffEnv = Record<string, string | undefined>;

type DashboardBffOptions = {
  env?: DashboardBffEnv;
  staticRoot?: string;
  indexFile?: string;
  serveStaticAssets?: boolean;
};

export function createDashboardBffApp(options?: DashboardBffOptions): Hono;
