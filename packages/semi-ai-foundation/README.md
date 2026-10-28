# @fibrae/semi-ai-foundation

Semi Design Next 中 AI 组件框架无关的部分：foundation 逻辑、SCSS 样式和 tiptap 编辑器插件。各框架的 AI 包（`semi-ai-<框架>`）通过 adapter 接入，应用一般不直接依赖本包。

## 安装

```sh
pnpm add @fibrae/semi-ai-foundation
```

不依赖任何框架和 UI 包。

## 使用

本包没有 `.` 入口，不能裸导入包名，只能按路径导入：

```ts
import ChatFoundation from '@fibrae/semi-ai-foundation/chat/foundation';
```

| 入口                                       | 说明                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `@fibrae/semi-ai-foundation/<目录>/<文件>` | 对应 `dist/<目录>/<文件>.js`                                               |
| `@fibrae/semi-ai-foundation/<路径>.css`    | 编译后的样式                                                               |
| `@fibrae/semi-ai-foundation/<路径>.scss`   | SCSS 源码；`rtl.scss`、`variables.scss`、`animation.scss` 只以源码形式发布 |

目录有 `ai-chat-dialogue`、`ai-chat-input`、`chat`、`sidebar`。tiptap 扩展在 `ai-chat-input/extension/`，各框架包各自 `.extend({ addNodeView })` 提供节点视图。

## 与其他包的关系

- 依赖 `@fibrae/semi-foundation`，以及 `@tiptap/core`、`@tiptap/extensions`、`@tiptap/pm`、`es-toolkit`。
- 被各框架的 AI 包使用，它们再把样式合成各自的 `styles.css`。

## 开发

`pnpm build` 在本包目录运行 `vp pack`：逐文件输出 ESM 与类型声明，并把 SCSS 编译为同目录的 CSS。测试、lint 与类型检查见根目录 [README.md](../../README.md) 的「常用命令」。
