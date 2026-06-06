#!/usr/bin/env bun

import { runCliCommand } from "./commands/cli";
import { hasMise, MISE_BIN } from "./core/mise";
import { runTui } from "./ui/tui";

function parseRuntimeArgs(args: string[]): { args: string[]; node: boolean } {
  return {
    args: args.filter((arg) => arg !== "--node"),
    node: args.includes("--node"),
  };
}

function ensureRuntime(nodeRequested: boolean): void {
  const isBun = typeof Reflect.get(process.versions, "bun") === "string";

  if (isBun || nodeRequested) {
    return;
  }

  console.error("请使用 Bun 运行，或传入 --node 显式使用 Node.js 运行。");
  process.exit(1);
}

async function main(): Promise<void> {
  const runtime = parseRuntimeArgs(process.argv.slice(2));
  ensureRuntime(runtime.node);

  if (!hasMise()) {
    console.error(`找不到 ${MISE_BIN}。请安装 mise，或通过 MISE_BIN 指定路径。`);
    process.exitCode = 1;
    return;
  }

  const cliArgs = runtime.args;

  if (cliArgs.length > 0) {
    await runCliCommand(cliArgs);
    return;
  }

  await runTui();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
