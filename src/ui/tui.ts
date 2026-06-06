import { input, select } from "@inquirer/prompts";
import { readMise, runMise } from "../core/mise";

const SELECT_THEME = {
  style: {
    keysHelpTip: () => "↑/↓ 选择，Enter 确认",
  },
};

type MiseAction =
  | "ls"
  | "current"
  | "tasks"
  | "run-task"
  | "install"
  | "use"
  | "custom"
  | "exit";

async function promptToolVersion(message: string): Promise<[string, string]> {
  const value = await input({
    message,
    validate: (text) => {
      const trimmed = text.trim();
      return trimmed.includes("@") || "请使用 <工具>@<版本> 格式，例如 node@24";
    },
  });

  const [tool, ...versionParts] = value.trim().split("@");
  return [tool, versionParts.join("@")];
}

async function runTask(): Promise<void> {
  const taskOutput = readMise(["tasks", "--no-header"]);
  const taskNames = taskOutput
    .split("\n")
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);

  if (taskNames.length === 0) {
    console.log("没有找到 mise task。");
    return;
  }

  const taskName = await select({
    message: "选择要运行的 task",
    choices: taskNames.map((name) => ({ name, value: name })),
    theme: SELECT_THEME,
  });

  await runMise(["run", taskName]);
}

async function runCustomCommand(): Promise<void> {
  const command = await input({
    message: "mise 参数",
    default: "--help",
    validate: (text) => Boolean(text.trim()) || "请输入 mise 参数",
  });

  const args = command.trim().split(/\s+/);
  await runMise(args);
}

export async function runTui(): Promise<void> {
  let shouldContinue = true;

  while (shouldContinue) {
    const action = await select<MiseAction>({
      message: "mise-tui",
      choices: [
        { name: "查看已安装工具", value: "ls" },
        { name: "查看当前配置工具", value: "current" },
        { name: "查看 tasks", value: "tasks" },
        { name: "运行 task", value: "run-task" },
        { name: "安装工具版本", value: "install" },
        { name: "写入工具版本", value: "use" },
        { name: "自定义 mise 命令", value: "custom" },
        { name: "退出", value: "exit" },
      ],
      theme: SELECT_THEME,
    });

    switch (action) {
      case "ls":
        await runMise(["ls"]);
        break;
      case "current":
        await runMise(["current"]);
        break;
      case "tasks":
        await runMise(["tasks"]);
        break;
      case "run-task":
        await runTask();
        break;
      case "install": {
        const [tool, version] = await promptToolVersion("要安装的工具版本");
        await runMise(["install", `${tool}@${version}`]);
        break;
      }
      case "use": {
        const [tool, version] = await promptToolVersion("要写入配置的工具版本");
        await runMise(["use", `${tool}@${version}`]);
        break;
      }
      case "custom":
        await runCustomCommand();
        break;
      case "exit":
        shouldContinue = false;
        break;
    }
  }
}
