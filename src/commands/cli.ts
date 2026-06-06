import { runMise } from "../core/mise";
import { formatToolVersion, resolveInstalledToolVersion, resolveRemoteToolVersion } from "../core/tool-version";

function parseToolArgs(args: string[]): { toolSpec?: string; extraArgs: string[]; global: boolean } {
  const globalFlags = new Set(["-g", "--global"]);
  const argsWithoutGlobal = args.filter((arg) => !globalFlags.has(arg));
  const toolSpecIndex = argsWithoutGlobal.findIndex((arg) => !arg.startsWith("-"));

  return {
    toolSpec: toolSpecIndex === -1 ? undefined : argsWithoutGlobal[toolSpecIndex],
    extraArgs: argsWithoutGlobal.filter((_, index) => index !== toolSpecIndex),
    global: args.some((arg) => globalFlags.has(arg)),
  };
}

async function runInstallCommand(args: string[]): Promise<void> {
  const parsed = parseToolArgs(args);

  if (!parsed.toolSpec) {
    const command = parsed.global ? "use" : "install";
    const globalArgs = parsed.global ? ["--global"] : [];
    await runMise([command, ...globalArgs, ...parsed.extraArgs]);
    return;
  }

  const toolVersion = await resolveRemoteToolVersion(parsed.toolSpec);
  const command = parsed.global ? "use" : "install";
  const commandArgs = parsed.global
    ? ["--global", ...parsed.extraArgs, formatToolVersion(toolVersion)]
    : [...parsed.extraArgs, formatToolVersion(toolVersion)];

  await runMise([command, ...commandArgs]);
}

async function runUseCommand(args: string[]): Promise<void> {
  const parsed = parseToolArgs(args);

  if (!parsed.toolSpec) {
    const globalArgs = parsed.global ? ["--global"] : [];
    await runMise(["use", ...globalArgs, ...parsed.extraArgs]);
    return;
  }

  const toolVersion = await resolveInstalledToolVersion(parsed.toolSpec);
  const globalArgs = parsed.global ? ["--global"] : [];

  await runMise(["use", ...globalArgs, ...parsed.extraArgs, formatToolVersion(toolVersion)]);
}

export async function runCliCommand(args: string[]): Promise<void> {
  const [command, ...commandArgs] = args;

  switch (command) {
    case "i":
    case "install":
      await runInstallCommand(commandArgs);
      return;
    case "u":
    case "use":
      await runUseCommand(commandArgs);
      return;
    default:
      await runMise(args);
  }
}
