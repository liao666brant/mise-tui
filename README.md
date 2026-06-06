# mise-tui

`mise-tui` 是一个基于 Bun 的 `mise` TUI 薄包装工具。

它不重新实现 `mise` 的行为，只负责提供交互式菜单，并调用本机的 `mise` 可执行文件。命令执行结果保持原生输出，便于排查问题。

## 环境要求

- Bun 1.0+
- mise

## 安装依赖

```bash
bun install
```

## 全局安装

发布到 npm 后可以全局安装：

```bash
npm install -g mise-tui
```

安装后可直接使用：

```bash
mt
mt i node
mt use node
```

运行环境需要提前安装 Bun 和 mise。

Windows 上请确认 `bun`、`mise` 和 npm 全局 bin 目录都在 `PATH` 中：

```powershell
where.exe bun
where.exe mise
where.exe mt
```

## 启动

```bash
bun start
```

也可以直接执行入口文件：

```bash
./src/index.ts
```

## 命令行模式

缺少版本时会进入可搜索版本选择：

```bash
mt i node -g
```

版本选择器每页显示 15 个版本，支持输入过滤、`←/→` 翻页、`↑/↓` 选择；已安装版本显示青色，项目使用中的版本显示黄色，全局使用中的版本显示紫色。

该命令会选择版本后执行：

```bash
mise use --global node@<version>
```

`mt use node` 会只列出本机已安装的 node 版本，选择后执行：

```bash
mise use node@<version>
```

## 检查

```bash
bun run check
```

## 发布

项目已配置 GitHub Actions + npm Trusted Publishing。npm 包设置中 Trusted Publisher 应填写：

```text
Organization or user: liao666brant
Repository: mise-tui
Workflow filename: publish.yml
Allowed actions: npm publish
```

发版时创建并推送 `v*` tag：

```bash
npm version patch
git push
git push --tags
```

## 当前功能

- 查看已安装工具
- 查看当前配置工具
- 查看 mise tasks
- 选择并运行 task
- 安装指定工具版本
- 写入 `.mise.toml` 中的工具版本
- 执行自定义 mise 参数

## 设计原则

- 保持薄包装：所有真实操作交给 `mise`
- 保持输出透明：不吞掉 `mise` 的原始输出
- 保持实现简单：优先使用 Bun 标准能力和少量交互依赖
