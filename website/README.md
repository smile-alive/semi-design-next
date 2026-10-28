# semi-website

Semi Design Next 的文档站，基于 Astro 7，为各框架的组件库提供中英文文档和 demo。工作区私有包，不发布；同时承载页面扫描和 API 表生成脚本。

## 运行

根目录命令（详见根目录 [README.md](../README.md#常用命令)）：

```sh
pnpm site:dev        # 后台启动 dev server，http://127.0.0.1:4321
pnpm site:build      # 生产构建，产物在 website/dist
pnpm site:preview    # 后台预览生产构建，http://127.0.0.1:4322，需先 site:build
pnpm site:serve      # site:build 加 site:preview
pnpm site:stop       # 停止 dev server 与 preview
```

新 checkout 先在 `website` 下运行 `pnpm exec astro sync` 生成类型（`website/.astro` 不入库）。

## 目录

| 路径              | 内容                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `content/`        | 文档正文，按 `<分类>/<页面>/index.<语言>.mdx` 组织，语言为 `zh-CN` 与 `en-US`                    |
| `src/`            | 页面、布局、组件、样式；`content.config.ts` 校验 frontmatter，`lib/docs.ts` 定义分类顺序         |
| `plugins/`        | Markdown 管线插件：`remark-demo`、`framework-mdx`、`rehype-anchor-ids`、`rehype-table-container` |
| `scripts/`        | 页面检查、API 表生成、MDX 表格检查、React Compiler 检查、布局对比                                |
| `astro.config.ts` | i18n、Markdown 管线、各框架与 `mdx` 的集成，以及直接读取各 UI 包源码的别名                       |

页面路径为 `/{语言}/{框架}/{分类}/{页面}`，框架为框架包名里的框架名（如 `react`），React 以外框架的路由随该页全部 demo 迁移完成而启用。

## 写文档

- 示例写 `<Demo id="types" />`，构建时只导入当前框架的 demo 文件（如 `demos/<id>.react.tsx`，各框架的文件名见 `.agents/references/<框架>/website.md`）；demo 界面文案统一用中文。
- 框架专属正文用 `<Framework only="<框架>">`。
- React 以外框架的 API 表由 `pnpm --filter semi-website gen:<框架>-api` 从组件类型生成，只能由该命令更新；`--check` 用于校验。
- 文档站用 React Compiler 编译，库构建不用。

MDX 写法、分类与 demo 约定见 [website](../.agents/references/website.md)，样式规则见 [styles](../.agents/references/styles.md)。

## 检查

```sh
pnpm lint:mdx-tables                                              # 表格列数与 MDX 编译
pnpm site:build && pnpm site:dev
pnpm --filter semi-website check:pages http://127.0.0.1:4321      # 控制台报错、空 demo、axe 违规
```

`check:pages` 可追加路径过滤，例如 `/show/table`；全量运行时加 `--update-a11y-baseline` 重写 `scripts/a11y-baseline.json`，带路径过滤时会报错。流程见 [check-pages](../.agents/skills/check-pages/SKILL.md)。

`scripts/compare-layout.ts` 对比两份构建的布局，用于不应移动任何元素的 CSS 改动：`node scripts/compare-layout.ts <baselineUrl> <candidateUrl> <path>... [--mode=ltr|rtl|both]`。

## 与其他包的关系

依赖全部 UI 相关包：各框架的 UI 包与 AI 包、`@fibrae/semi-ai-foundation`、`@fibrae/semi-foundation`，以及各框架的图标与插画包。文档站不挂 `@fibrae/semi-vite-plugin`。
