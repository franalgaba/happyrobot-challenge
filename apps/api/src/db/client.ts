import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createSqlClient(databaseUrl: string) {
  return postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export function createDb(databaseUrl: string) {
  const sql = createSqlClient(databaseUrl);
  return {
    sql,
    db: drizzle(sql, { schema }),
  };
}

export type Db = ReturnType<typeof createDb>["db"];
export type SqlClient = ReturnType<typeof createSqlClient>;
