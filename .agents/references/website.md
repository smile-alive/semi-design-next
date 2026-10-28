# 文档站

`website/` 是 Astro 7 文档站（工作区包 `semi-website`），页面地址为 `/{语言}/{框架}/{分类}/{页面}`，框架名取自框架包名（`semi-ui-<框架>`）。框架专属的路由与 demo 写法见各框架目录的 `website.md`。样式规则见 [styles](styles.md#文档站样式)，页面扫描见 [check-pages](../skills/check-pages/SKILL.md)。

## 内容

- 每个页面一个目录：`website/content/<分类>/<页面>/index.zh-CN.mdx` 和 `index.en-US.mdx`。frontmatter 由 `src/content.config.ts` 校验；没有 demo 的页面必须声明 `frameworks`，两种语言保持一致。
- 侧栏按 `src/lib/docs.ts` 的 `categories` 固定排序，同一分类内按 `order` 排序。新增分类目录时要加进 `categories`，否则构建报错。
- 示例写 `<Demo id="types" />`，构建时由 `plugins/remark-demo.ts` 只导入当前框架的 demo 文件（文件名规则见各框架目录的 `website.md`）。各框架使用独立路由入口，同一份 MDX 正文分别编译，框架专属的 loader 不放进共享布局的依赖图。页面已启用的框架缺少 demo 时构建报错，`pnpm lint:mdx-tables` 不构建也能报出。示例的注水方式按框架在 `src/lib/frameworks.ts` 的 `demoHydration` 配置，`except` 列出取相反方式的页面（页面目录相对 `website/content`，不存在则构建报错）。`client:only` 的 demo 只在客户端渲染；`client:visible` 的页面由 Astro 在服务端渲染 demo，进入视口时 hydration。
    - 某框架的 `mode` 改为 `visible` 前，不在 `except` 中的每个页面都要满足：该页本框架的全部 demo 服务端渲染不抛错（Solid 还要求释放根后无未捕获异常，构建在服务端渲染失败时即失败）；dev 构建下 hydration 无告警（React 的 `onRecoverableError` 与控制台 hydration 告警、Vue 的 `Hydration ... mismatch`、Solid 的 `Hydration Mismatch` 都算失败，生产构建会静默保留差异，不能用它判断）；依赖随机值、当前时间或自带 `Teleport` 的 demo 已改为固定值或挂载后计算，Calendar 的 demo 全部传 `displayValue`；首帧差异只限 component-issues 已登记的项；check-pages 无新增控制台错误和空 demo。不满足的页面放进 `except`。
    - 问题 demo 改 demo 本身（固定值、挂载后计算），不做单个 demo 的退出机制。
    - 每个 demo 每个框架一份，中英文档共用，界面文案统一用中文（D3）。
    - 各框架的 demo 均纳入 `pnpm typecheck`，类型从对应框架包的公开导出取，只标注推断不出的地方，不写 `any`。demo 的文件形式见各框架目录的 `website.md`。
    - 正文里嵌入的非示例组件放在 `figures/` 下，在 mdx 中 import。
- 文档中的 API 表、Methods 与键盘说明要和组件的实际行为一致，zh-CN 和 en-US 同步修改。
- 框架专属正文用 `<Framework only="<框架>">`，`only` 只接受单个框架：几个框架都适用的说明各写一份，改一个框架的正文不影响其他框架。remark 在子节点求值和标题收集前筛选，不使用运行时条件组件。正文链接由 DocLink 在目标页支持当前框架时改写。框架的 API 说明文件与生成方式见各框架目录的 `website.md`。

## MDX 3 的写法

- 加粗标记内侧不留空格；紧邻中文标点时用 `<strong>`。
- Notice 等组件里的多行 JSX 会被拆成段落，要写在一行里。
- GFM 表格的分隔行列数要和表头一致。
- Astro 的 JSX 运行时不会给数值型 style 加 `px`，要写成 `'350px'` 字符串。
- `smartypants` 已关闭，引号保持原样。

## 运行

- 开发：根目录 `pnpm site:dev`（`http://127.0.0.1:4321`）；预览生产构建：`pnpm site:build` 后 `pnpm site:preview`（`http://127.0.0.1:4322`），或用 `pnpm site:serve` 一步完成。Astro 7 的 dev 和 preview 以守护进程运行：已经有一个在跑时命令会直接返回，`pnpm site:stop` 同时停止两者。
- 锁文件或依赖导入方式变化后，先 `trash website/node_modules/.vite` 再启动 dev server，否则运行中才发现的依赖会让模块请求返回 504。改了 `.astro` 组件的 `<style>` 后，如果页面一直是旧样式，重启 dev server。
- 生产构建：`pnpm site:build`，产物在 `website/dist`。批次页面验收用 preview，全量扫描用 dev server 发现开发期警告。类型检查：`pnpm typecheck` 覆盖 website 各框架的配置，依赖 `astro sync` 生成的 `website/.astro` 类型（该目录不入库，新 checkout 先在 `website` 下跑 `pnpm exec astro sync`）。
