# @fibrae/semi-ui-solid

Semi Design Next 的 Solid 组件库，面向 Solid 1.9+ 应用。它是上游 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，与字节跳动及 Semi Design 官方团队无关，与各框架的 UI 包共用同一份 foundation 的逻辑和样式。

## 安装

```sh
pnpm add solid-js @fibrae/semi-ui-solid @fibrae/semi-icons-solid
```

peer 依赖：`solid-js` ^1.9.17。浏览器、模块格式、Node.js 与构建插件的版本要求见[快速开始的环境要求](../../website/content/start/getting-started/index.zh-CN.mdx#环境要求)。

## 使用

```tsx
import { Button, Toast } from '@fibrae/semi-ui-solid';

export default function App() {
    return <Button onClick={() => Toast.warning({ content: 'welcome' })}>Hello Semi</Button>;
}
```

样式与主题 token 随组件一起加载，不需要手动引入基础样式，也不需要 reset.css。

### 入口

| 入口                                 | 说明                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `@fibrae/semi-ui-solid`              | 全部组件、类型、`ConfigProvider`、`LocaleProvider`、`LocaleConsumer`、`useLocale`、`semiGlobal` |
| `@fibrae/semi-ui-solid/<目录>/index` | 逐文件深路径，与 `src/` 下的目录一一对应                                                        |
| `@fibrae/semi-ui-solid/tokens`       | 主题 token 与 base 规则，在应用入口文件最先导入，首个组件懒加载时 token 仍随入口加载            |
| `@fibrae/semi-ui-solid/styles.css`   | 整包样式，需要一次性加载全部组件样式时使用                                                      |
| `@fibrae/semi-ui-solid/tailwind.css` | Tailwind v4 的 `@theme inline` 映射                                                             |

每个入口发布两份：默认条件下是编译好的 DOM 版本，`solid` 条件下是保留 JSX 的版本。`vite-plugin-solid`（SolidStart、Vike、TanStack Start）与 `unplugin-solid` 按 `solid` 条件取后者，按目标（DOM 或服务端）重新编译。

使用整包 `styles.css` 时，需要开启 Semi 构建插件（`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`）的 `omitCss`，否则组件自带的样式导入会被再打包一份。整包样式已含 token，`omitCss` 下 `tokens` 入口和组件样式一起被移除。

与 `@fibrae/semi-ai-solid` 同用并加载整包样式时，在 `styles.css` 之后引入 `@fibrae/semi-ai-solid/styles.css`。

### 样式定制

覆写 `--semi-*` CSS 变量即可改变全局颜色、圆角、字号和间距；Semi 的样式位于 `@layer semi`，应用中不分层的 CSS 规则总是优先。没有主题包，也没有编译期的 Sass 覆写。发布的 `.scss` 含有 `semi:` 地址，需要通过构建插件（`@fibrae/semi-vite-plugin` 等）或 `@fibrae/semi-scss-compile` 使用。

### 多语言

默认语言为 `zh_CN`。用 `LocaleProvider` 传入语言包，`useLocale(组件名)` 返回当前语言下该组件文案的访问器：

```tsx
import { LocaleProvider } from '@fibrae/semi-ui-solid';
import en_GB from '@fibrae/semi-ui-solid/locale/source/en_GB';

<LocaleProvider locale={en_GB}>
    <App />
</LocaleProvider>;
```

语言包的结构见 [@fibrae/semi-foundation](../semi-foundation/README.md#语言包)。

### 服务端渲染

组件可在 `solid-js/web` 的 `renderToString` 等服务端渲染下输出，浏览器用 `hydrate` 注水。注意：

- 默认打开的弹层（`defaultOpen`、`visible` 等）不进服务端 HTML，注水后才打开。
- Calendar 的「今天」标记在挂载后才出现，服务端渲染时传 `displayValue`；服务端与浏览器的时区须一致，或用 `ConfigProvider` 的 `timeZone` 统一。
- `Toast`、`Notification`、`Modal.confirm` 等命令式 API 只能在浏览器调用，在服务端调用会抛出说明调用时机的错误；需要继承 context 时使用 hook 形式返回的 holder。
- `semiGlobal.config` 只在应用启动时设置，服务端与浏览器使用同一份配置。

### 文档

组件文档在 [website/content](../../website/content)，入门见 [快速开始](../../website/content/start/getting-started/index.zh-CN.mdx)。

## 与其他包的关系

- 依赖 `@fibrae/semi-foundation`（逻辑与样式）、`@fibrae/semi-icons-solid`。
- 被 `@fibrae/semi-ai-solid` 和文档站 `website` 使用。
- 各框架的 UI 包（`semi-ui-<框架>`）共用同一份 foundation，React 版见 [@fibrae/semi-ui-react](../semi-ui-react/README.md)，Vue 版见 [@fibrae/semi-ui-vue](../semi-ui-vue/README.md)。

## 开发

`pnpm --filter @fibrae/semi-ui-solid build` 执行 `vp pack`，产出两遍：`src` 下的 TS 与 TSX 逐文件编译为 DOM 版 ESM 与类型声明，再以 `jsx: preserve` 输出 `.jsx` 供 `solid` 条件使用；同时产出组件 CSS 与整包 `styles.css`、`tailwind.css`。

通用命令见根目录 [README.md](../../README.md#常用命令)。组件写法见 [components](../../.agents/references/solid/components.md)，相对上游的变化见 [release-notes](../../docs/release-notes.md)。
