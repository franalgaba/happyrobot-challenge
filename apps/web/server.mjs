import { serve } from "@hono/node-server";
import { createDashboardBffApp } from "./bff/app.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8080);
const app = createDashboardBffApp();

serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  () => {
    console.log(`Dashboard listening on http://${host}:${port}`);
  },
);
