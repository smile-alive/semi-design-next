# Semi Design Next

Semi Design Next 是 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，提供 React、Vue、Solid 三套组件库，独立演进，不合并回上游，也不保留与上游的向后兼容。包名（`@fibrae/semi-*`）、类名前缀（`semi-`）与 CSS 变量（`--semi-*`）沿用 Semi 的标识。

> 本项目是非官方的社区项目，与字节跳动、DouyinFE 及 Semi Design 官方团队没有关联，也未获得其认可。「Semi Design」名称归其权利人所有。

文档站：https://semi-design-next.pages.dev

## 支持环境

- 各框架包的版本范围以其 `package.json` 的 `peerDependencies` 为准
- 浏览器、模块格式、Node.js 与构建插件的版本要求见[快速开始的环境要求](website/content/start/getting-started/index.zh-CN.mdx#环境要求)
- React、Vue、Solid 支持服务端渲染与 hydration，React 另支持 RSC 客户端边界；宿主配置见各插件 README
- 开发本仓库：Node 26.10.0 与 pnpm 12.9.1，由 [mise](https://mise.jdx.dev) 按 `mise.toml` 安装

## 目录结构

| 路径 | 说明 |
| --- | --- |
| [`packages/semi-ui-react`](packages/semi-ui-react/README.md) | React 组件库 `@fibrae/semi-ui-react` |
| [`packages/semi-ui-vue`](packages/semi-ui-vue/README.md) | Vue 组件库 `@fibrae/semi-ui-vue` |
| [`packages/semi-ui-solid`](packages/semi-ui-solid/README.md) | Solid 组件库 `@fibrae/semi-ui-solid` |
| [`packages/semi-foundation`](packages/semi-foundation/README.md) | 与框架无关的组件逻辑和 SCSS；唯一的主题（全局 token、色板、mixin）在 `src/theme/` |
| [`packages/semi-ai-react`](packages/semi-ai-react/README.md) | AI 组件 `@fibrae/semi-ai-react`（AIChatInput、AIChatDialogue、Chat、Sidebar），基于 semi-ui-react |
| [`packages/semi-ai-vue`](packages/semi-ai-vue/README.md) | Vue 版 AI 组件 `@fibrae/semi-ai-vue`（AIChatInput、AIChatDialogue、Chat、Sidebar），基于 semi-ui-vue |
| [`packages/semi-ai-solid`](packages/semi-ai-solid/README.md) | Solid 版 AI 组件 `@fibrae/semi-ai-solid`，基于 semi-ui-solid |
| [`packages/semi-ai-foundation`](packages/semi-ai-foundation/README.md) | AI 组件与框架无关的逻辑、SCSS 和编辑器插件，基于 semi-foundation |
| [`packages/semi-icons-core`](packages/semi-icons-core/README.md) | 图标的唯一源 `svgs/icons`（保留原色的彩色图标在 `svgs/lab`，插画在 `svgs/illustrations`）与由它生成的框架无关图标与插画数据 `@fibrae/semi-icons-core` |
| [`packages/semi-icons-react`](packages/semi-icons-react/README.md) | React 图标组件 `@fibrae/semi-icons-react`，每个图标由 core 的数据经 `createIcon` 生成；彩色图标在子路径 `@fibrae/semi-icons-react/lab` |
| [`packages/semi-icons-vue`](packages/semi-icons-vue/README.md) | Vue 图标组件 `@fibrae/semi-icons-vue`，与 React 共享 core 数据与样式；彩色图标在子路径 `/lab` |
| [`packages/semi-icons-solid`](packages/semi-icons-solid/README.md) | Solid 图标组件 `@fibrae/semi-icons-solid`，读同一份 core 数据 |
| [`packages/semi-animation`](packages/semi-animation/README.md) | 给 Motion 用的 Semi 预设（缓动、弹簧）与 View Transition 预设类 `@fibrae/semi-animation` |
| [`packages/semi-polyfill`](packages/semi-polyfill/README.md) | 可选 polyfill `@fibrae/semi-polyfill`（`AbortSignal.any`、`Element.prototype.checkVisibility`），供 Safari 17.2 与 17.3 在入口最先导入 |
| [`packages/semi-illustrations-react`](packages/semi-illustrations-react/README.md) | React 插画组件，由 `semi-icons-core` 的插画数据生成，实例隔离渐变、滤镜与 mask ID |
| [`packages/semi-illustrations-vue`](packages/semi-illustrations-vue/README.md) | Vue 插画组件，由 `semi-icons-core` 的插画数据生成，实例隔离渐变、滤镜与 mask ID |
| [`packages/semi-illustrations-solid`](packages/semi-illustrations-solid/README.md) | Solid 插画组件，由同一份插画数据生成 |
| [`packages/semi-json-viewer-core`](packages/semi-json-viewer-core/README.md) | JsonViewer 的编辑器内核 |
| [`packages/semi-scss-compile`](packages/semi-scss-compile/README.md) | 把 Semi SCSS 编译为 CSS 的工具 |
| [`packages/semi-theme-shared`](packages/semi-theme-shared/README.md) | 插件与 `semi-scss-compile` 共用的 `semi:` Sass importer 与编译管线，不发布 |
| [`packages/semi-vite`](packages/semi-vite/README.md)、[`semi-webpack`](packages/semi-webpack/README.md)、[`semi-rspack`](packages/semi-rspack/README.md)、[`semi-next`](packages/semi-next/README.md) | 类名前缀替换、`@layer semi` 开关与 `omitCss` 的构建插件 |
| [`packages/semi-nuxt`](packages/semi-nuxt/README.md) | Nuxt 4 模块 `@fibrae/semi-nuxt`，把 semi-vite 插件注册进 Nuxt 的 Vite 构建，并在应用未设置时关闭 `features.inlineStyles` |
| `scripts/svg-to-icon-data.ts` | 图标与插画共用的 SVG 转数据脚本，各框架的图标与插画组件都由这份数据生成 |
| `vitest/` | 测试项目注册与 setup（`vitest/<框架>/` 放该框架的 setup、tsconfig 与工具）、测试工具（`@test/utils/<框架>` 与框架无关的模块）与打包产物测试 `vitest/packed` |
| `.agents/references/<框架>/` | 各框架的组件、测试、lint 与 website 写法，框架无关的写法见 `.agents/references/` 下的共享文件 |
| [`website/`](website/README.md) | Astro 文档站，正文在 `website/content/<分类>/<页面>/index.<语言>.mdx` |

各包的源码在 `src/`，`vp pack` 的产物在 `dist/`，含逐文件的 ESM、类型声明和组件 CSS，UI 包另有整包样式 `styles.css` 与 `tailwind.css`；发布的子路径与 `src/` 下的目录一一对应。

## 样式定制

仓库只有一份主题，位于 `packages/semi-foundation/src/theme/`，组件 SCSS 经 `semi:theme` 加载它；没有主题包，也没有编译期的 Sass 变量覆写。使用方只通过 `--semi-*` CSS 变量（全局 token，Tailwind 映射见 `@fibrae/semi-ui-react/tailwind.css`）和 `@layer semi` 之外的 CSS 规则定制样式。Sass 变量是内部实现。

## 常用命令

```sh
mise install                 # 安装 Node 与 pnpm
pnpm install                 # 安装依赖

pnpm site:dev                # 后台启动文档站 dev server（http://127.0.0.1:4321）
pnpm site:build              # 文档站生产构建，产物在 website/dist
pnpm site:preview            # 后台预览生产构建（http://127.0.0.1:4322），需先 site:build
pnpm site:serve              # 生产构建后直接后台预览，等于 site:build 加 site:preview
pnpm site:stop               # 停止后台的 dev server 与 preview

pnpm test                    # 单元测试（jsdom）
pnpm test:browser            # 浏览器测试（Playwright Chromium）
pnpm test:coverage           # 先单元后浏览器测试，合并覆盖率低于 vitest/ 中登记的阈值即失败；不含 SSR 与 hydration 项目
pnpm test:ssr                # SSR 与 hydration 项目（*-ssr、*-hydration-browser），不统计覆盖率

pnpm lint                    # 文件的框架归属、oxlint、stylelint、私有成员、类成员与组件内语句顺序、SCSS 变量、MDX 表格列数与各框架的专属检查，warning 也算失败
vp run --cache lint          # 反复重跑 lint 时用：每一步按读取的文件缓存，没变的步骤直接回放结果；lint:style 每次都执行（stylelint 加载 TS 配置时会写临时文件）
pnpm lint:scopes             # 按命名列出各区域属于各框架与通用范围的文件数；带文件参数时逐个列出归属
pnpm lint:react              # 用 React Compiler 编译 semi-ui-react 全部组件与 hook，列出被放弃的函数
pnpm lint:fix                # 自动修复 lint 问题
pnpm format                  # oxfmt 格式化
pnpm format:check            # 检查格式
pnpm typecheck               # 逐个检查 tsconfig.node.json、各包、website 与 vitest 的配置（Vue 配置用 vue-tsc，其余用 tsc），输出每个配置的结果与耗时；semi-ui-react 读取 semi-foundation 已构建的类型，需先 build

pnpm build                   # 构建所有包到各自的 dist/，UI 包同时产出整包样式 styles.css 与 tailwind.css
pnpm build:icon              # 由 SVG 重新生成 core 数据及各框架的图标和插画组件
pnpm test:packed             # 在临时 Vite + React 19 应用中安装并构建打包产物，需先运行 build
pnpm test:plugins            # 各插件包的冒烟测试

pnpm check                   # 提交前：lint、格式、单元与浏览器测试
pnpm check:full              # 完整校验：构建、类型检查、lint、格式、带覆盖率的测试、SSR 与 hydration 测试、打包产物与插件测试
```

文档站页面检查（加载错误、空 demo、a11y 基线）：

```sh
pnpm site:build
pnpm site:dev
pnpm --filter semi-website check:pages http://127.0.0.1:4321
pnpm site:stop
```

`check:pages` 可追加路径过滤参数，例如 `/show/table`；全量运行时加 `--update-a11y-baseline` 会重写 `website/scripts/a11y-baseline.json`。

## 文档

| 文件                                                         | 内容                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [docs/decisions.md](docs/decisions.md)                       | 已定决策与未完成事项                                          |
| [docs/release-notes.md](docs/release-notes.md)               | 相对原 Semi 的破坏性变化与行为变化                            |
| [docs/component-issues.md](docs/component-issues.md)         | 未结问题、已知限制与保持原样的决定                            |
| [.agents/references/styles.md](.agents/references/styles.md) | 组件 SCSS 写法、Sass 模块与 `semi:` importer、主题 token 协议 |

## 提交

- Conventional Commits，`type(scope)` 用英文，标题与正文用中文；标题不超过 72 个字符，正文每段一行，由 commitlint 检查。
- pre-commit 对暂存文件运行 `vp lint --fix`、`vp fmt` 与 stylelint，warning 也会阻止提交。

发布流程（包名、registry、版本）尚未确定。
