import * as readline from "node:readline";
import { styleText } from "node:util";

const VERSION_PAGE_SIZE = 15;

export type VersionStatus = {
  installed: boolean;
  activeScope?: "project" | "global";
};

function getVersionPage(versions: string[], page: number): string[] {
  const start = page * VERSION_PAGE_SIZE;
  return versions.slice(start, start + VERSION_PAGE_SIZE);
}

function getStatusLabel(status: VersionStatus | undefined): string {
  if (status?.activeScope === "project") {
    return styleText("yellow", " [项目使用中]");
  }

  if (status?.activeScope === "global") {
    return styleText("magenta", " [全局使用中]");
  }

  if (status?.installed) {
    return styleText("cyan", " [已安装]");
  }

  return "";
}

function getVersionColor(version: string, status: VersionStatus | undefined, selected: boolean): string {
  if (status?.activeScope === "project") {
    return styleText("yellow", version);
  }

  if (status?.activeScope === "global") {
    return styleText("magenta", version);
  }

  if (status?.installed) {
    return styleText("cyan", version);
  }

  return selected ? styleText("green", version) : version;
}

function renderVersionSelector(
  tool: string,
  action: string,
  versions: string[],
  versionStatuses: Map<string, VersionStatus>,
  searchTerm: string,
  page: number,
  activeIndex: number,
): void {
  const totalPages = Math.max(1, Math.ceil(versions.length / VERSION_PAGE_SIZE));
  const visibleVersions = getVersionPage(versions, page);

  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);

  console.log(`请选择要${action}的 ${tool} 版本 [输入可搜索]: ${searchTerm}`);

  if (visibleVersions.length === 0) {
    console.log("没有匹配的版本");
  } else {
    visibleVersions.forEach((version, index) => {
      const cursor = index === activeIndex ? "->" : "  ";
      const status = versionStatuses.get(version);
      const versionText = getVersionColor(version, status, index === activeIndex);
      console.log(`${cursor} ${versionText}${getStatusLabel(status)}`);
    });
  }

  console.log("");
  console.log(`${styleText("yellow", "[项目使用中]")} ${styleText("magenta", "[全局使用中]")} ${styleText("cyan", "[已安装]")}`);
  console.log(`第 ${page + 1}/${totalPages} 页，↑/↓ 选择，←/→ 翻页，Enter 确认，Ctrl+C 退出`);
}

export function selectVersionFromTerminal(
  tool: string,
  versions: string[],
  versionStatuses = new Map<string, VersionStatus>(),
  action = "安装",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    let searchTerm = "";
    let filteredVersions = versions;
    let page = 0;
    let activeIndex = 0;

    const cleanup = (): void => {
      stdin.off("keypress", onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(wasRaw);
      }
      stdin.pause();
      process.stdout.write("\x1b[?25h");
    };

    const rerender = (): void => {
      const maxPage = Math.max(0, Math.ceil(filteredVersions.length / VERSION_PAGE_SIZE) - 1);
      page = Math.min(page, maxPage);
      activeIndex = Math.min(activeIndex, Math.max(0, getVersionPage(filteredVersions, page).length - 1));
      renderVersionSelector(tool, action, filteredVersions, versionStatuses, searchTerm, page, activeIndex);
    };

    const updateSearch = (nextSearchTerm: string): void => {
      searchTerm = nextSearchTerm;
      filteredVersions = searchTerm ? versions.filter((version) => version.includes(searchTerm)) : versions;
      page = 0;
      activeIndex = 0;
      rerender();
    };

    const onKeypress = (character: string | undefined, key: readline.Key): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("已取消"));
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        const selectedVersion = getVersionPage(filteredVersions, page)[activeIndex];

        if (selectedVersion) {
          cleanup();
          readline.cursorTo(process.stdout, 0, 0);
          readline.clearScreenDown(process.stdout);
          resolve(selectedVersion);
        }

        return;
      }

      if (key.name === "up") {
        activeIndex = Math.max(0, activeIndex - 1);
        rerender();
        return;
      }

      if (key.name === "down") {
        activeIndex = Math.min(getVersionPage(filteredVersions, page).length - 1, activeIndex + 1);
        rerender();
        return;
      }

      if (key.name === "left") {
        page = Math.max(0, page - 1);
        activeIndex = 0;
        rerender();
        return;
      }

      if (key.name === "right") {
        page = Math.min(Math.max(0, Math.ceil(filteredVersions.length / VERSION_PAGE_SIZE) - 1), page + 1);
        activeIndex = 0;
        rerender();
        return;
      }

      if (key.name === "backspace") {
        updateSearch(searchTerm.slice(0, -1));
        return;
      }

      if (character && !key.ctrl && !key.meta && character >= " ") {
        updateSearch(`${searchTerm}${character}`);
      }
    };

    readline.emitKeypressEvents(stdin);

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    process.stdout.write("\x1b[?25l");
    stdin.on("keypress", onKeypress);
    rerender();
  });
}
