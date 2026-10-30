# @fibrae/semi-ui-svelte

Semi Design Next 的 Svelte 组件库，面向 Svelte 5.57+ 应用。它是上游 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，与字节跳动及 Semi Design 官方团队无关，与各框架的 UI 包共用同一份 foundation 的逻辑和样式。

## 安装

```sh
pnpm add svelte @fibrae/semi-ui-svelte @fibrae/semi-icons-svelte
```

peer 依赖：`svelte` ^5.57.0。浏览器、模块格式、Node.js 与构建插件的版本要求见[快速开始的环境要求](../../website/content/start/getting-started/index.zh-CN.mdx#环境要求)。

## 使用

```svelte
<script lang="ts">
    import { Button, Switch } from '@fibrae/semi-ui-svelte';

    let checked = $state(false);
</script>

<Button theme="solid" type="primary">Hello Semi</Button>
<Switch bind:checked aria-label="开关" />
```

样式与主题 token 随组件一起加载，不需要手动引入基础样式，也不需要 reset.css。

### 入口

| 入口                                          | 说明                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@fibrae/semi-ui-svelte`                      | 全部组件、类型、`ConfigProvider`、`LocaleProvider`、`LocaleConsumer`、`useLocale`、`semiGlobal` |
| `@fibrae/semi-ui-svelte/<目录>/index`         | 逐文件深路径，与 `src/` 下的目录一一对应；组件文件是 `<目录>/<名>.svelte`                       |
| `@fibrae/semi-ui-svelte/hooks`                | `useLocale`、`useClickOutside`、`useCopied`，以及 attachment `observeResize`                    |
| `@fibrae/semi-ui-svelte/tokens`               | 主题 token 与 base 规则，在应用入口文件最先导入，首个组件懒加载时 token 仍随入口加载            |
| `@fibrae/semi-ui-svelte/styles.css`           | 整包样式，需要一次性加载全部组件样式时使用                                                      |
| `@fibrae/semi-ui-svelte/tailwind.css`         | Tailwind v4 的 `@theme inline` 映射                                                             |
| `@fibrae/semi-ui-svelte/locale/source/<语言>` | 内置语言包，重导出 `@fibrae/semi-foundation/locale/source/<语言>`                               |

包里发布的是 `.svelte` 源码与 `.d.ts`，不是编译产物：`exports` 带 `svelte` 条件，由 `@sveltejs/vite-plugin-svelte`（SvelteKit 已内置）按应用的目标（DOM 或服务端）编译。不认 `svelte` 条件、也不编译 `.svelte` 的工具无法使用本包。

使用整包 `styles.css` 时，需要开启 `@fibrae/semi-vite-plugin` 的 `omitCss`，否则组件自带的样式导入会被再打包一份。整包样式已含 token，`omitCss` 下 `tokens` 入口和组件样式一起被移除。

与 `@fibrae/semi-ai-svelte` 同用并加载整包样式时，在 `styles.css` 之后引入 `@fibrae/semi-ai-svelte/styles.css`。

### 样式定制

覆写 `--semi-*` CSS 变量即可改变全局颜色、圆角、字号和间距；Semi 的样式位于 `@layer semi`，应用中不分层的 CSS 规则总是优先。没有主题包，也没有编译期的 Sass 覆写。发布的 `.scss` 含有 `semi:` 地址，需要通过构建插件（`@fibrae/semi-vite-plugin` 等）或 `@fibrae/semi-scss-compile` 使用。

### 多语言

默认语言为 `zh_CN`。用 `LocaleProvider` 传入语言包；`useLocale(组件名)` 在组件初始化时调用，返回一个函数，读作 `locale().locale.xxx`，语言切换后随之更新：

```svelte
<script lang="ts">
    import { LocaleProvider } from '@fibrae/semi-ui-svelte';
    import en_GB from '@fibrae/semi-ui-svelte/locale/source/en_GB';
</script>

<LocaleProvider locale={en_GB}>
    <App />
</LocaleProvider>
```

语言包的结构见 [@fibrae/semi-foundation](../semi-foundation/README.md#语言包)。

### 服务端渲染

组件可在 `svelte/server` 的 `render` 与 SvelteKit 中输出服务端 HTML，浏览器用 `hydrate` 注水。注意：

- 组件内的 id 来自 `$props.id()`，服务端与浏览器一致。
- `onMount` 与 `$effect` 不在服务端执行，依赖它们的状态（如测量尺寸）在注水后才出现。
- `semiGlobal.config` 只在应用启动时设置，服务端与浏览器使用同一份配置。

### 文档

组件文档在 [website/content](../../website/content)，入门见 [快速开始](../../website/content/start/getting-started/index.zh-CN.mdx)。

## 与其他包的关系

- 依赖 `@fibrae/semi-foundation`（逻辑与样式）、`@fibrae/semi-icons-svelte`。
- 被 `@fibrae/semi-ai-svelte` 和文档站 `website` 使用。
- 各框架的 UI 包（`semi-ui-<框架>`）共用同一份 foundation，Vue 版见 [@fibrae/semi-ui-vue](../semi-ui-vue/README.md)，它是 Svelte 版能力对齐的参照。

## 开发

`pnpm --filter @fibrae/semi-ui-svelte build` 执行 `scripts/svelte-package.ts`：用 `svelte-package` 把 `src` 输出到 `dist`（`.svelte` 原样、`.ts` 编译为 `.js` 与 `.d.ts`），把样式导入改为 foundation 的 `.css`，去掉 `__tests__`，并写出整包 `styles.css`、`tailwind.css` 与 `locale/source/` 的重导出。

通用命令见根目录 [README.md](../../README.md#常用命令)。组件写法见 [components](../../.agents/references/svelte/components.md)，相对上游的变化见 [release-notes](../../docs/release-notes.md)。
