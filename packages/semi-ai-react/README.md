# @fibrae/semi-ai-react

Semi Design Next 的 React AI 组件库，包含 `AIChatInput`、`AIChatDialogue`、`Chat` 和 `Sidebar`，面向在 React 19 应用中构建对话界面的使用方。组件基于 `@fibrae/semi-ui-react`，逻辑来自 `@fibrae/semi-ai-foundation`，与其他框架的 AI 包行为对齐。

## 安装

```sh
pnpm add @fibrae/semi-ai-react @fibrae/semi-ui-react
```

peer 依赖：`react`、`react-dom`（React 19）。`@fibrae/semi-ui-react` 是本包的依赖。

## 使用

```tsx
import { AIChatInput, AIChatDialogue, Chat, Sidebar } from '@fibrae/semi-ai-react';

export default function App() {
    return <AIChatInput />;
}
```

- 样式随组件加载，不需要手动引入。使用整包样式时，开启 Semi 构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`）的 `omitCss`，否则组件自带的样式导入会被再打包一份；Next.js 用 `@fibrae/semi-next` 的 `omitCss: true`（默认不开启）。此时先引入 `@fibrae/semi-ui-react/styles.css`，再引入 `@fibrae/semi-ai-react/styles.css`；后者只含 AI 组件样式，不含 UI 组件样式。
- 包只发布 ESM。`@fibrae/semi-ai-react/<目录>/<文件>` 可以深度导入任一源文件，对应的样式随产物按同名 `.css` 加载。
- 代码块高亮不内置任何语言，用 `@fibrae/semi-ui-react` 的 `CodeHighlight.register({ languages: [...] })` 注册所需的 shiki 语法。
- 全局默认值经 `semiGlobal` 配置，`AIChatDialogue`、`AIChatInput`、`Annotation`、`Chat`、`MCPConfigure`、`Sidebar` 都可以按组件名设置。

组件文档与示例见 [website/content/ai](../../website/content/ai)：

- [AIChatInput](../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../website/content/ai/sidebar)
- [AI 组件概览](../../website/content/ai/ai-component)

已知问题见 [docs/component-issues.md](../../docs/component-issues.md) 的 AIChatInput 章节。

## 与其他包的关系

- 依赖 `@fibrae/semi-ai-foundation`（逻辑与样式）、`@fibrae/semi-foundation`、`@fibrae/semi-ui-react`、`@fibrae/semi-icons-react`、`@fibrae/semi-illustrations-react`。
- 输入框基于 tiptap；富文本扩展的框架无关部分在 foundation，本包用 `addNodeView` 接入 React。
- Vue 对应包为 `@fibrae/semi-ai-vue`。

## 开发

`pnpm build` 在本包目录运行 `vp pack`，产出 `dist`（逐文件 ESM、类型声明和 `styles.css`）。其余测试、lint、类型检查命令见根目录 [README.md](../../README.md) 的「常用命令」。
