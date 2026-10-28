# @fibrae/semi-json-viewer-core

Semi Design Next 中 JsonViewer 的框架无关编辑器内核，源自 VS Code 的 JSON 查看与编辑实现。给定容器 DOM 和 JSON 文本，提供渲染、编辑、搜索替换、补全和格式化。一般使用方通过各框架 UI 包的 JsonViewer 使用，本包由 `@fibrae/semi-foundation` 的 JsonViewer foundation 依赖。

## 安装

```sh
pnpm add @fibrae/semi-json-viewer-core
```

无 peer 依赖，也无运行时依赖（`jsonc-parser` 已打进 `dist`）。包不含样式，样式由 JsonViewer 组件提供。

## 使用

```ts
import { JsonViewer } from '@fibrae/semi-json-viewer-core';

const viewer = new JsonViewer(container, '{"name": "semi"}', { readOnly: true });
viewer.layout();
// 不再使用时释放
viewer.dispose();
```

构造函数：`new JsonViewer(container: HTMLElement, value: string, options?: JsonViewerOptions)`。

| 选项                | 说明                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `lineHeight`        | 行高                                                                                                               |
| `autoWrap`          | 是否自动换行                                                                                                       |
| `readOnly`          | 是否只读                                                                                                           |
| `formatOptions`     | 格式化，含 `tabSize`、`insertSpaces`、`eol`                                                                        |
| `completionOptions` | 补全，含 `staticCompletions`                                                                                       |
| `customRenderRule`  | 自定义渲染规则数组 `{ match, render }`，`match` 可为字符串、`RegExp` 或 `(value, pathChain, tokenType) => boolean` |
| `prefixCls`         | 类名前缀                                                                                                           |
| `ariaLabel`         | 只读时是滚动区域的名称，可编辑时是 textbox 的名称                                                                  |

实例方法：`layout()`、`resetMeasuredHeights()`、`getModel()`、`getSearchWidget()`、`format()`、`dispose()`，另有公开属性 `emitter`。每个实例用独立的命名空间隔离事件与 worker，用完必须调用 `dispose()`。

导出的类型：`JsonViewerOptions`、`CompletionOptions`、`FormattingOptions`、`TokenRenderType`、`CustomRenderRule`。组件文档见 [website/content/plus/json-viewer](../../website/content/plus/json-viewer)。

## 内部结构

`src/tokens` 负责 JSON 文本的词法分析与高亮：

- `tokenize.ts` 识别分隔符、关键字、字符串、数字和注释，并记录括号嵌套深度。
- `tokenizationJsonModelPart.ts` 保存整份文档的 token 状态，内容变化时标记受影响的行。
- `jsonModelToken.ts` 做增量分析，只重算变化的部分，借 `IdleDeadline` 在空闲时间后台完成。
- `offsetRange.ts` 提供偏移范围的合并、相交、平移和包含运算，用来圈定需要重算的范围。

语言服务运行在 Web Worker 中，构建时由 `vite.semi.ts` 的插件把 worker 源码内联，运行时从 blob URL 启动。

## 与其他包的关系

被 `@fibrae/semi-foundation` 依赖，不依赖其他 Semi 包。

## 开发

`pnpm build` 在本包目录运行 `vp pack`，输出单入口 ESM 与类型声明。测试、lint 与类型检查见根目录 [README.md](../../README.md) 的「常用命令」。
