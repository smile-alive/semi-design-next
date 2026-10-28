# @fibrae/semi-ai-solid

Semi Design Next 的 Solid AI 组件库，包含 `AIChatInput`、`AIChatDialogue`、`Chat` 和 `Sidebar`，面向 Solid 1.9+ 应用。组件基于 `@fibrae/semi-ui-solid`，逻辑来自 `@fibrae/semi-ai-foundation`，与其他框架的 AI 包行为对齐。

## 安装

```sh
pnpm add @fibrae/semi-ai-solid @fibrae/semi-ui-solid
```

peer 依赖：`solid-js`（1.9+）。`@fibrae/semi-ui-solid` 是本包的依赖。

## 使用

```tsx
import { AIChatInput } from '@fibrae/semi-ai-solid';

export default function App() {
    return <AIChatInput />;
}
```

- 样式随组件加载，不需要手动引入。使用整包样式时，开启 Semi 构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`）的 `omitCss`，否则组件自带的样式导入会被再打包一份。此时先引入 `@fibrae/semi-ui-solid/styles.css`，再引入 `@fibrae/semi-ai-solid/styles.css`；后者只含 AI 组件样式，不含 UI 组件样式。
- 包只发布 ESM，每个入口有 DOM 版与 `solid` 条件下保留 JSX 的版本，说明见 [@fibrae/semi-ui-solid](../semi-ui-solid/README.md#入口)。`@fibrae/semi-ai-solid/<目录>/<文件>` 可以深度导入任一源文件。
- 全局默认值经 `semiGlobal` 配置，可以按组件名设置。

组件文档与示例见 [website/content/ai](../../website/content/ai)：

- [AIChatInput](../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../website/content/ai/sidebar)
- [AI 组件概览](../../website/content/ai/ai-component)

## 与其他包的关系

- 依赖 `@fibrae/semi-ai-foundation`（逻辑与样式）、`@fibrae/semi-foundation`、`@fibrae/semi-ui-solid`、`@fibrae/semi-icons-solid`、`@fibrae/semi-illustrations-solid`。
- 输入框基于 tiptap（`@tiptap/core`）；扩展的框架无关部分在 foundation，本包接入 Solid。
- React 对应包为 `@fibrae/semi-ai-react`，Vue 对应包为 `@fibrae/semi-ai-vue`。

## 开发

`pnpm build` 在本包目录运行 `vp pack`，产出 `dist`（DOM 版逐文件 ESM、`solid` 条件的 `.jsx`、类型声明和 `styles.css`）。其余测试、lint、类型检查命令见根目录 [README.md](../../README.md) 的「常用命令」。
