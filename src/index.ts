#!/usr/bin/env bun

import { runCliCommand } from "./commands/cli";
import { hasMise, MISE_BIN } from "./core/mise";
import { runTui } from "./ui/tui";

async function main(): Promise<void> {
  if (!hasMise()) {
    console.error(`找不到 ${MISE_BIN}。请安装 mise，或通过 MISE_BIN 指定路径。`);
    process.exitCode = 1;
    return;
  }

  const cliArgs = process.argv.slice(2);

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
