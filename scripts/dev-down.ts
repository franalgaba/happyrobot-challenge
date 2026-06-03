import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PID_FILES = ["tmp/api.pid"];

function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopPidFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  const pid = Number(readFileSync(path, "utf8"));
  if (Number.isInteger(pid) && isProcessRunning(pid)) {
    process.kill(pid, "SIGTERM");
    console.log(`Stopped ${pid} from ${path}`);
  }

  rmSync(path, { force: true });
}

for (const pidFile of PID_FILES) {
  stopPidFile(pidFile);
}

spawnSync("docker", ["compose", "stop", "postgres"], { stdio: "inherit" });
