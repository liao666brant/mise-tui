import { homedir } from "node:os";
import { normalize } from "node:path";
import { readMise } from "./mise";
import { selectVersionFromTerminal, type VersionStatus } from "../ui/version-selector";

export type ToolVersion = {
  tool: string;
  version?: string;
};

export function parseToolVersion(value: string): ToolVersion {
  const trimmed = value.trim();
  const separatorIndex = trimmed.lastIndexOf("@");

  if (separatorIndex === -1) {
    return { tool: trimmed };
  }

  return {
    tool: trimmed.slice(0, separatorIndex),
    version: trimmed.slice(separatorIndex + 1),
  };
}

export function formatToolVersion({ tool, version }: Required<ToolVersion>): string {
  return `${tool}@${version}`;
}

function getRemoteVersions(tool: string): string[] {
  const output = readMise(["ls-remote", tool]);

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();
}

function getInstalledVersions(tool: string): string[] {
  const output = readMise(["ls", tool, "--installed", "--json"]);

  if (!output) {
    return [];
  }

  try {
    const entries: unknown = JSON.parse(output);

    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .filter((entry): entry is MiseListEntry => {
        return typeof entry === "object" && entry !== null && typeof Reflect.get(entry, "version") === "string";
      })
      .map((entry) => entry.version)
      .reverse();
  } catch {
    return [];
  }
}

function getGlobalConfigPath(): string {
  return normalize(process.env.MISE_GLOBAL_CONFIG_FILE || `${homedir()}/.config/mise/config.toml`);
}

function isGlobalSourcePath(path: string | undefined): boolean {
  return path ? normalize(path) === getGlobalConfigPath() : false;
}

function getActiveScope(entry: MiseListEntry): VersionStatus["activeScope"] {
  if (!entry.active) {
    return undefined;
  }

  if (isGlobalSourcePath(entry.source?.path)) {
    return "global";
  }

  return "project";
}

type MiseListEntry = {
  version: string;
  installed?: boolean;
  active?: boolean;
  source?: {
    path?: string;
  };
};

function getVersionStatuses(tool: string): Map<string, VersionStatus> {
  const output = readMise(["ls", tool, "--json"]);

  if (!output) {
    return new Map();
  }

  try {
    const entries: unknown = JSON.parse(output);

    if (!Array.isArray(entries)) {
      return new Map();
    }

    return new Map(
      entries
        .filter((entry): entry is MiseListEntry => {
          return typeof entry === "object" && entry !== null && typeof Reflect.get(entry, "version") === "string";
        })
        .map((entry) => [
          entry.version,
          {
            installed: entry.installed === true,
            activeScope: getActiveScope(entry),
          },
        ]),
    );
  } catch {
    return new Map();
  }
}

async function selectRemoteVersion(tool: string, action: string): Promise<string> {
  const versions = getRemoteVersions(tool);
  const versionStatuses = getVersionStatuses(tool);

  if (versions.length === 0) {
    throw new Error(`没有找到 ${tool} 的远程版本。`);
  }

  console.log(`未提供 ${tool} 版本，请选择要${action}的版本。`);

  return selectVersionFromTerminal(tool, versions, versionStatuses, action);
}

async function selectInstalledVersion(tool: string): Promise<string> {
  const versions = getInstalledVersions(tool);
  const versionStatuses = getVersionStatuses(tool);

  if (versions.length === 0) {
    throw new Error(`${tool} 没有已安装版本。请先执行 mi i ${tool} 安装版本。`);
  }

  console.log(`未提供 ${tool} 版本，请选择要使用的已安装版本。`);

  return selectVersionFromTerminal(tool, versions, versionStatuses, "使用");
}

function parseRequiredTool(spec: string): ToolVersion {
  const parsed = parseToolVersion(spec);

  if (!parsed.tool) {
    throw new Error("必须提供工具名称。");
  }

  return parsed;
}

export async function resolveRemoteToolVersion(spec: string): Promise<Required<ToolVersion>> {
  const parsed = parseRequiredTool(spec);

  if (parsed.version) {
    return { tool: parsed.tool, version: parsed.version };
  }

  return {
    tool: parsed.tool,
    version: await selectRemoteVersion(parsed.tool, "安装"),
  };
}

export async function resolveInstalledToolVersion(spec: string): Promise<Required<ToolVersion>> {
  const parsed = parseRequiredTool(spec);

  if (parsed.version) {
    return { tool: parsed.tool, version: parsed.version };
  }

  return {
    tool: parsed.tool,
    version: await selectInstalledVersion(parsed.tool),
  };
}
