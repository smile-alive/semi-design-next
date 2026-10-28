# @fibrae/semi-ai-vue

Semi Design Next 的 Vue AI 组件库，包含 `AIChatInput`、`AIChatDialogue`、`Chat` 和 `Sidebar`，面向 Vue 3.5+ 应用。组件基于 `@fibrae/semi-ui-vue`，逻辑来自 `@fibrae/semi-ai-foundation`，与其他框架的 AI 包行为对齐。

## 安装

```sh
pnpm add @fibrae/semi-ai-vue @fibrae/semi-ui-vue
```

peer 依赖：`vue`（3.5+）。`@fibrae/semi-ui-vue` 是本包的依赖。

## 使用

```vue
<script setup lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-vue';
</script>

<template>
    <AIChatInput />
</template>
```

- 样式随组件加载，不需要手动引入。使用整包样式时，开启 Semi 构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`）的 `omitCss`，否则组件自带的样式导入会被再打包一份。此时先引入 `@fibrae/semi-ui-vue/styles.css`，再引入 `@fibrae/semi-ai-vue/styles.css`；后者只含 AI 组件样式，不含 UI 组件样式。
- 包只发布 ESM。`@fibrae/semi-ai-vue/<目录>/<文件>` 可以深度导入任一源文件，包括 `.vue` 的编译产物。
- Props 只承载数据，自定义 DOM 通过作用域插槽提供；类型以 `*Props`、`*Emits`、`*Slots`、`*SlotProps` 导出，例如 `ChatSlots`、`AIChatDialogueSlots`。
- 全局默认值经 `semiGlobal` 配置，可以按组件名设置。

组件文档与示例见 [website/content/ai](../../website/content/ai)：

- [AIChatInput](../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../website/content/ai/sidebar)
- [AI 组件概览](../../website/content/ai/ai-component)

## 与其他包的关系

- 依赖 `@fibrae/semi-ai-foundation`（逻辑与样式）、`@fibrae/semi-foundation`、`@fibrae/semi-ui-vue`、`@fibrae/semi-icons-vue`、`@fibrae/semi-illustrations-vue`。
- 输入框基于 tiptap（`@tiptap/vue-3`）；扩展的框架无关部分在 foundation，本包接入 Vue。
- React 对应包为 `@fibrae/semi-ai-react`。

## 开发

`pnpm build` 在本包目录运行 `vp pack`，产出 `dist`（逐文件 ESM、类型声明和 `styles.css`）。构建时出现 `CONFIGURATION_FIELD_CONFLICT` 警告属预期。其余测试、lint、类型检查命令见根目录 [README.md](../../README.md) 的「常用命令」。
