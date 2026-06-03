import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { loadConfig } from "./env/config";
import { createServices } from "./services";

const config = loadConfig();
const { db } = createDb(config.databaseUrl);
const services = createServices(db, config);
const app = createApp(config, services);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Hono API listening on http://localhost:${info.port}`);
  },
);
