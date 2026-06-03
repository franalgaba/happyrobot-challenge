import { spawn, spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_API_URL = "http://127.0.0.1:3000";
const HEALTH_PATH = "/health";
const POSTGRES_SERVICE = "postgres";
const POSTGRES_DATABASE = "happyrobot_challenge";
const POSTGRES_USER = "postgres";
const API_LOG_PATH = "tmp/api.log";
const API_PID_PATH = "tmp/api.pid";

type Options = {
  apiUrl: string;
};

function flagValue(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseOptions(args: string[]): Options {
  return {
    apiUrl: flagValue(args, "--api-url") ?? DEFAULT_API_URL,
  };
}

function runStep(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function ensureParentDirectory(path: string) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
}

async function waitForDockerPostgres() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = spawnSync(
      "docker",
      ["compose", "exec", "-T", POSTGRES_SERVICE, "pg_isready", "-U", POSTGRES_USER, "-d", POSTGRES_DATABASE],
      { stdio: "ignore" },
    );

    if (result.status === 0) {
      return;
    }

    await Bun.sleep(1_000);
  }

  throw new Error("Postgres did not become ready within 30 seconds.");
}

async function isBackendHealthy(apiUrl: string) {
  try {
    const response = await fetch(new URL(HEALTH_PATH, apiUrl));
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(apiUrl: string) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    if (await isBackendHealthy(apiUrl)) {
      return;
    }

    await Bun.sleep(1_000);
  }

  throw new Error(`Backend did not become healthy at ${new URL(HEALTH_PATH, apiUrl).toString()}`);
}

async function ensureBackend(apiUrl: string) {
  if (await isBackendHealthy(apiUrl)) {
    console.log(`Backend already healthy at ${apiUrl}`);
    return;
  }

  console.log("Starting backend in the background...");
  ensureParentDirectory(API_LOG_PATH);
  writeFileSync(API_LOG_PATH, "");

  const output = openSync(API_LOG_PATH, "a");
  const backend = spawn("bun", ["run", "dev"], {
    detached: true,
    env: process.env,
    stdio: ["ignore", output, output],
  });

  backend.unref();
  closeSync(output);

  if (!backend.pid) {
    throw new Error("Backend process did not return a process id.");
  }

  writeFileSync(API_PID_PATH, String(backend.pid));
  await waitForBackend(apiUrl);
  console.log(`Backend is healthy at ${apiUrl}`);
  console.log(`Backend PID: ${backend.pid}`);
  console.log(`Backend log: ${API_LOG_PATH}`);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));

  runStep("docker", ["compose", "up", "-d", POSTGRES_SERVICE]);
  await waitForDockerPostgres();
  runStep("bun", ["run", "db:migrate"]);
  runStep("bun", ["run", "db:seed"]);
  await ensureBackend(options.apiUrl);
  console.log("Local backend is ready. Use the Railway URL for HappyRobot sync.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
