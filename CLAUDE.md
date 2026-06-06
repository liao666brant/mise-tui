# CLAUDE.md

## 给 Claude 的项目说明

本项目是 `mise` 的 TUI 薄包装，运行时使用 Bun。

核心约束：

- 不要改成 Node.js、Rust、Go 或 Python 启动器。
- 不要重新实现 `mise` 的业务逻辑。
- 所有真实操作都应调用本机 `mise`。
- 保持命令输出透明，优先使用 `stdio: "inherit"`。
- 修改后使用 `bun run check` 验证。

## 项目命令

```bash
bun install
bun start
bun run check
```

## 文件结构

```text
src/index.ts                  入口和 CLI/TUI 分流
src/commands/cli.ts           命令行模式
src/core/mise.ts              mise 命令调用封装
src/core/tool-version.ts      工具版本解析和选择
src/ui/tui.ts                 中文 TUI 主菜单
src/ui/version-selector.ts    版本选择器
package.json                  Bun 脚本与依赖声明
bun.lock                      Bun 依赖锁文件
README.md                     中文使用说明
```
