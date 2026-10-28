# @fibrae/semi-ui-react

Semi Design Next 的 React 组件库，面向 React 19 应用。它是上游 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，与字节跳动及 Semi Design 官方团队无关，不与上游同步，也不保留向后兼容。

## 安装

```sh
pnpm add @fibrae/semi-ui-react
```

peer 依赖：`react`、`react-dom` ^19.3.0。浏览器、模块格式、Node.js 与构建插件的版本要求见[快速开始的环境要求](../../website/content/start/getting-started/index.zh-CN.mdx#环境要求)。

## 使用

```tsx
import { Button, Toast } from '@fibrae/semi-ui-react';

export function App() {
    return <Button onClick={() => Toast.warning({ content: 'welcome' })}>Hello Semi</Button>;
}
```

样式与主题 token 随组件一起加载，根入口和深路径都自带，不需要手动引入基础样式，也不需要 reset.css。

### 入口

| 入口                                 | 说明                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `@fibrae/semi-ui-react`              | 全部组件、类型、`LocaleProvider`、`LocaleConsumer`、`BaseFoundation`                 |
| `@fibrae/semi-ui-react/<目录>/index` | 逐文件深路径，与 `src/` 下的目录一一对应，例如 `button/index`                        |
| `@fibrae/semi-ui-react/tokens`       | 主题 token 与 base 规则，在应用入口文件最先导入，首个组件懒加载时 token 仍随入口加载 |
| `@fibrae/semi-ui-react/styles.css`   | 整包样式，需要一次性加载全部组件样式时使用                                           |
| `@fibrae/semi-ui-react/tailwind.css` | Tailwind v4 的 `@theme inline` 映射                                                  |

使用整包 `styles.css` 时，需要开启 Semi 构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`）的 `omitCss`，否则组件自带的样式导入会被再打包一份；Next.js 用 `@fibrae/semi-next` 的 `omitCss: true`（默认不开启）。整包样式已含 token，`omitCss` 下 `tokens` 入口和组件样式一起被移除。

与 Tailwind 同用时，先声明 `@layer theme, base, semi, components, utilities;`，并保持构建插件的 `cssLayer` 为默认值 `true`。

### 样式定制

覆写 `--semi-*` CSS 变量即可改变全局颜色、圆角、字号和间距；Semi 的样式位于 `@layer semi`，应用中不分层的 CSS 规则总是优先。没有主题包，也没有编译期的 Sass 覆写。

发布的 `.scss` 含有 `semi:` 地址，不能直接用 Sass 编译，需要通过构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`、`@fibrae/semi-next`）或 `@fibrae/semi-scss-compile` 使用。

### 多语言

默认语言为 `zh_CN`。用 `LocaleProvider` 传入语言包：

```tsx
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { LocaleProvider } from '@fibrae/semi-ui-react';

<LocaleProvider locale={en_GB}>
    <App />
</LocaleProvider>;
```

不传 `locale` 时继承外层。语言包的结构见 [@fibrae/semi-foundation](../semi-foundation/README.md#语言包)。

### 服务端渲染

组件支持 `renderToString`、`prerender` 等服务端渲染与 `hydrateRoot`：

- `Toast`、`Notification`、`Modal.confirm` 等命令式 API 只在客户端调用（事件处理、effect），在服务端调用会抛错；需要随渲染输出时使用 `Toast.useToast()`、`Notification.useNotification()`、`Modal.useModal()` 返回的 holder。
- `semiGlobal.config` 只在应用启动时设置，服务端与客户端使用同一份配置，渲染过程中不修改。
- 弹层在 hydration 之后打开，服务端 HTML 不含弹层内容；Calendar 与 DatePicker 面板的「今天」标记只在 hydration 后出现，Calendar 在服务端渲染时传 `displayValue` 固定显示的日期。
- 日期按运行环境的时区格式化：服务端与浏览器时区不同时，用 `ConfigProvider` 的 `timeZone` 统一，否则服务端 HTML 与 hydration 的日期文字不一致。
- Server Component 中直接导入扁平导出（如 `Button`）和 `TypographyTitle` 等命名导出；点语法子组件（如 `Typography.Title`、`Form.Input`）在 Server Component 中为 `undefined`，只在 `'use client'` 文件中使用。

### 文档

组件文档在 [website/content](../../website/content)，入门见 [快速开始](../../website/content/start/getting-started/index.zh-CN.mdx)。

## 与其他包的关系

- 依赖 `@fibrae/semi-foundation`（逻辑与样式）、`@fibrae/semi-icons-react`、`@fibrae/semi-illustrations-react`。
- 被 `@fibrae/semi-ai-react` 和文档站 `website` 使用。
- 各框架的 UI 包（`semi-ui-<框架>`）共用同一份 foundation，Vue 版见 [@fibrae/semi-ui-vue](../semi-ui-vue/README.md)。

## 开发

`pnpm --filter @fibrae/semi-ui-react build` 执行 `vp pack`：`src` 下的 TS/TSX 逐文件输出 ESM 与类型声明到 `dist`，并产出组件 CSS 与整包 `styles.css`、`tailwind.css`。本包的类型检查读取 foundation 已构建的类型，需先构建。

通用命令见根目录 [README.md](../../README.md#常用命令)。组件写法见 [components](../../.agents/references/react/components.md)，修组件缺陷的流程见 [fix-component-bug](../../.agents/skills/fix-component-bug/SKILL.md)，相对上游的变化见 [release-notes](../../docs/release-notes.md)。DatePicker 的时区设计见 [contributing.md](src/date-picker/contributing.md)。
