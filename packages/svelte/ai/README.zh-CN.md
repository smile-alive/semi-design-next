# @fibrae/semi-ai-svelte

[English](README.md)

Semi Design Next 的 Svelte AI 组件库，包含 `AIChatInput`、`AIChatDialogue`、`Chat` 和 `Sidebar`，面向 Svelte 5.57+ 应用。组件基于 `@fibrae/semi-ui-svelte`，逻辑来自 `@fibrae/semi-ai-foundation`，与其他框架的 AI 包行为对齐。

## 安装

```sh
pnpm add svelte @fibrae/semi-ai-svelte @fibrae/semi-ui-svelte
```

peer 依赖：`svelte` ^5.57.0。`@fibrae/semi-ui-svelte` 是本包的依赖。

## 使用

```svelte
<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
</script>

<AIChatInput />
```

- 样式随组件加载，不需要手动引入。使用整包样式时，开启 `@fibrae/semi-vite-plugin` 的 `omitCss`，否则组件自带的样式导入会被再打包一份；此时先引入 `@fibrae/semi-ui-svelte/styles.css`，再引入 `@fibrae/semi-ai-svelte/styles.css`，后者只含 AI 组件样式。
- 包里发布的是 `.svelte` 源码与 `.d.ts`，由 `@sveltejs/vite-plugin-svelte` 按应用目标编译，说明见 [@fibrae/semi-ui-svelte](../ui/README.zh-CN.md#入口)。`@fibrae/semi-ai-svelte/<目录>/<文件>` 可以深度导入任一源文件。
- 全局默认值经 `semiGlobal` 配置，可以按组件名设置。

组件文档与示例见 [website/content](../../../website/content)：

- [AIChatInput](../../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../../website/content/ai/sidebar)
- [Chat](../../../website/content/plus/chat)
- [AI 组件概览](../../../website/content/ai/ai-component)

## 与其他包的关系

- 依赖 `@fibrae/semi-ai-foundation`（逻辑与样式）、`@fibrae/semi-foundation`、`@fibrae/semi-ui-svelte`、`@fibrae/semi-icons-svelte`、`@fibrae/semi-illustrations-svelte`。
- 输入框与 Sidebar 的文件编辑器基于 tiptap（`@tiptap/core`）；扩展的框架无关部分在 foundation，本包接入 Svelte。
- 各框架的对应包是 `@fibrae/semi-ai-<框架>`。

## 开发

`pnpm --filter @fibrae/semi-ai-svelte build` 执行 `scripts/svelte-package.ts --bundles ai`，产出 `dist`（`.svelte` 原样、`.ts` 编译为 `.js` 与 `.d.ts`、整包 `styles.css`）。其余测试、lint、类型检查命令见根目录 [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令)。
