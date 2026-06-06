# AGENTS.md

## 项目定位

这是一个 Bun 启动的 `mise` TUI 薄包装工具。项目只提供交互入口，不重新实现 `mise` 的解析、安装、任务执行或版本管理逻辑。

## 开发约定

- 始终使用 Bun 作为启动器和包管理器。
- 新增命令时优先通过 `spawn`/`spawnSync` 调用本机 `mise`。
- 保持 `mise` 原始输出可见，避免包装层隐藏错误信息。
- 不引入前端框架、运行时服务或复杂状态管理。
- 不主动执行 `git commit`、`git push`、分支切换等 Git 操作。

## 常用命令

```bash
bun install
bun start
bun run check
```

## 代码原则

- KISS：保持入口逻辑直接、清晰。
- YAGNI：只实现当前明确需要的 TUI 操作。
- DRY：新增重复交互时先复用已有小函数。
- SOLID：命令执行、输入校验、菜单流程应保持职责清晰。
