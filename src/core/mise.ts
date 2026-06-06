import { spawn, spawnSync } from "node:child_process";

export const MISE_BIN = process.env.MISE_BIN || "mise";

type RunOptions = {
  cwd?: string;
};

export function hasMise(): boolean {
  const result = spawnSync(MISE_BIN, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return result.status === 0;
}

export function runMise(args: string[], options: RunOptions = {}): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(MISE_BIN, args, {
      cwd: options.cwd || process.cwd(),
      stdio: "inherit",
      shell: false,
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

export function readMise(args: string[]): string {
  const result = spawnSync(MISE_BIN, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
}
