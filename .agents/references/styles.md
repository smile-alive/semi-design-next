# 样式

组件样式是 `packages/semi-foundation/src/<组件>/` 下的 SCSS，各框架包的组件在 JS 里直接导入（`import '@fibrae/semi-foundation/tag/tag.scss'`）。唯一的主题在 `packages/semi-foundation/src/theme/`，经 `semi:theme` 加载；没有主题包和编译期覆写，使用方只通过 `--semi-*` CSS 变量和不分层的 CSS 规则定制。importer 与构建协议见本文「Sass 模块与 semi: importer」，主题 token 见「主题 token 协议」。lint 用 stylelint，配置在 `stylelint.config.ts`，warning 也算失败。

## 组件 SCSS

- 文件按职责拆分：`<组件>.scss` 写样式，`variables.scss` 写组件 token，`animation.scss` 写动画 token，`mixin.scss` 写 mixin，`rtl.scss` 写 RTL 专属规则。
- 样式文件开头用 `@use 'semi:theme' as *;`，同目录的 `variables`、`mixin` 以 `as *` 加载；不用 `@import`。选择器写 `$module: #{$prefix}-tag;` 再用 `.#{$module}`，不写死 `.semi-` 前缀：前缀可以通过 prefixCls 配置，stylelint 会检查。
- 组件与图标的变量（以及 `theme/variables.scss` 的变量）是内部实现，不是使用方的定制面：
    - 不写 `!default`：没有覆写来源，它只会让重名声明静默失效。变量不能与 `semi:theme` 中的名字重名，否则会改写主题模块的值并影响所有组件（见 [Sass 模块与 semi: importer](#sass-模块与-semi-importer)）；需要主题值时直接读主题变量。
    - 行尾的 `// 注释` 仍会显示在文档站 DesignToken 表格的说明列里，写成给读者看的说明。
    - 每个变量都要被某个样式表读到，`pnpm lint:scss-variables`（`scripts/lint-scss-variables.ts`，在 `pnpm lint` 中运行）检查，未读取的变量是死代码，直接删除；注意 Sass 把标识符里的 `-` 和 `_` 视为同一个字符。
    - 需要给使用方定制的值，做成 `--semi-*` CSS 变量。
- 组件级 CSS 变量只读：组件不在自己的类上声明变量，默认值写在 `var(--semi-x, 默认值)` 的回退里，同一默认值多处使用时由 Sass 变量提供；需要随主题变化的值做成声明在 body 的全局 token。理由：元素自身的声明总是压过继承值（与选择器权重无关，`:where` 也不能解决），组件类上声明的变量会让使用方在 body 或祖先上的覆盖失效；只读写法在 body、子树、组件类三处覆盖都生效。例：Button 的 `--semi-button-colorful-*`，默认值在 `icon-button/index.tsx` 的回退里。
- 值优先用主题的 CSS 变量（`var(--semi-color-*)`）和已有 token，不写死颜色。颜色不用颜色名，十六进制用小写、能短写则短写；字重用数字。无回退值的 `var(--semi-*)` 引用必须在 foundation（含 `theme/`）或图标包的样式表里有声明，`pnpm lint:scss-variables` 检查；带回退值的引用视为刻意只读。调色板 token（`--semi-blue-5` 等）是完整颜色：不透明直接写 `var(--semi-x)`，带透明度写 `rgb(from var(--semi-x) r g b / 0.5)`，混色用 `color-mix()`；不写 `rgba(var(--semi-x), a)`，它对完整颜色无效。
- Sass 的弃用写法（`@import`、全局内置函数、`if()` 函数等）会让编译直接失败：`compileSemiScss` 把当前 Sass 全部 active 弃用项设为 fatal。升级 sass 带来的新弃用项同样生效，先改源码再升级。`theme/` 经 importer 加载时弃用写法只告警，由 `semi-theme-shared` 的测试把它的入口直接编译来拦截。
- 盒模型：带 `semi-` 前缀类名的元素及其伪元素统一是 `border-box`（`base/base.scss` 的 `@layer semi-base`；`cssLayer: true` 时嵌套层名是 `semi.semi-base`，`cssLayer: false` 时是顶层 `semi-base`，不用 `base` 以免并入 Tailwind 的 base 层），不依赖宿主页面。尺寸变量写外框尺寸（含 padding 与 border）；能由内容决定的高度不写死，由 padding 和内容撑开。组件里不再重复写 `box-sizing: border-box`。

## Sass 模块与 semi: importer

全部 SCSS 使用 Sass 模块系统（`@use` / `@forward`），主题与前缀经 `semi:` importer 注入。主题只有一份，位于 `packages/semi-foundation/src/theme/`：`index.scss` 转发 `variables`、`mixin`、`font`；`global.scss`（经 `@use 'palette'` 带上 `_palette.scss`）和 `animation.scss` 输出 CSS 变量。主题随 semi-foundation 以 SCSS 发布在 `dist/theme/`，不单独编译成 CSS。没有主题包和覆写入口：插件与 `semi-scss-compile` 的样式选项只有 `prefixCls`（须匹配 `/^[a-zA-Z][\w-]*$/`，否则抛错）与 `cssLayer`。

| URL | 内容 | 使用方 |
| --- | --- | --- |
| `semi:theme` | 生成的模块：`@forward` 与 `@use ... as *` 同一个 `theme/index.scss`，再写 `$prefix: '<prefixCls>';`。经 `as *` 的赋值改写主题模块自己的 `$prefix`，所以组件和主题的 `global.scss`、`_palette.scss` 读到的都是配置值 | 每个组件 SCSS、主题的 `global.scss`、`_palette.scss`、semi-icons-core 的 `styles/icons.scss` |
| `semi:theme/global`、`semi:theme/animation` | `theme/global.scss`、`theme/animation.scss` 本身 | `semi-foundation/base/tokens.scss`、`semi-scss-compile` 的入口 |
| `semi:foundation/<subpath>` | 任一 semi-foundation 样式表 | semi-foundation 以外的样式表，如 semi-ai-foundation 的 `@use 'semi:foundation/base/mixin' as *` |

- 解析：`semiImporters({ prefixCls, resolveFoundation })`（`packages/semi-theme-shared/src/theme.ts`）把 `<subpath>` 交给 `resolveFoundation(subpath, fromDir)`。`semi:theme/*` 与 `semi:foundation/*` 由 FileImporter 处理，`fromDir` 是请求它的样式表所在目录；`semi:theme` 是生成模块，没有所在文件，`fromDir` 为 `undefined`。
- 仓库内（`vite.semi.ts`、`semi-scss-compile`）直接映射到源码目录或 `foundationPath`。插件用 `resolveFoundationFromNode(subpath, fromDir, rootDir)`：依次从样式表目录、应用根目录（Vite 的 `root`、webpack/rspack 的 `rootContext`）解析 `@fibrae/semi-foundation/<subpath>.scss`，每个目录先直接解析，再经它能看到的各框架 UI 包（`@fibrae/semi-ui-<框架>`）解析。原因：semi-icons-core 不依赖 semi-foundation，只安装 UI 包的应用在 pnpm isolated 下从根目录也看不到 semi-foundation。
- 跨包读取 semi-foundation 的样式表用 `semi:foundation/<path>`，不用 `pkg:`：foundation 的 `exports` 把 `./*.scss` 指向 `dist/`，仓库内源码模式（文档站、Vitest）没有 `dist/`。由各编译路径决定从源码还是从安装包解析，安装包按请求文件所在目录解析，兼容 pnpm isolated。
- `@layer semi`：Vite 预处理路径（文档站、Vitest browser）无法在编译前包裹模块化的样式表，由 PostCSS 插件 `semiCssLayer`（`vite.semi.ts`）在编译后包裹，只作用于 `vite.semi.ts` 的 `themedPackages` 所列包内的样式表（实际生效的是 semi-foundation、semi-ai-foundation、semi-icons-core，各框架包自身不含样式表）；其余路径（插件、`semi-scss-compile`、发布构建）由 `wrapInSemiLayer` 包裹，`@charset` 保持在最前。
- 弃用项：`compileSemiScss` 默认把全部 active 弃用项设为 fatal，并保留 `quietDeps`（经 importer 加载的主题属于依赖）；`semi-theme-shared` 的 `compile.test.ts` 把 `theme/index.scss`、`global.scss`、`animation.scss` 作为入口直接编译，守护它们的弃用项。
- 发布的 SCSS 只能经 Semi 插件或 `@fibrae/semi-scss-compile` 编译：缺少 `semi:` importer 时 Sass 报错并指出 URL。

## 主题 token 协议

主题的 `global.scss`、`_palette.scss`、`animation.scss` 按下表输出 CSS 变量；调色板值与引用的写法见「组件 SCSS」。

| 项                                                                                              | 协议                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 与模式无关、不含 `var()` 的 token（尺寸、圆角、蒙层色、`--semi-white`、`--semi-black`、动效）   | 只声明在 `:root`，`.{prefix}-always-*` 子树继承使用方在根上的覆盖                                                                                                               |
| 浅色 token                                                                                      | `:root, :root .{prefix}-always-light`；`color-scheme: light` 只设在 `.{prefix}-always-light` 上，根元素保持 `normal`（根的 color-scheme 决定画布与视口滚动条，留给页面的 meta） |
| 暗色 token                                                                                      | `[theme-mode='dark'], :root .{prefix}-always-dark`，同时声明 `color-scheme: dark`                                                                                               |
| 两种模式公式相同、含 `var()` 的 token（如 `--semi-color-primary: var(--semi-blue-5)`、AI 渐变） | 只写一次，选择器为浅色与暗色两组的并集：`var()` 在声明它的元素上解析，每个切换调色板的元素都要重新声明                                                                          |
| `theme-mode` 属性                                                                               | 写在 `body`（或任意祖先）上                                                                                                                                                     |

`semi-scss-compile` 的 `compileTailwindTheme` 编译 `semi:theme/global` 与 `semi:theme/animation`，扫描全部 `--semi-*` 声明生成 `@theme inline` 映射（值写 `var(--semi-*)`，随覆盖和子树解析）：

| `--semi-` 前缀                 | Tailwind 命名空间                                                             |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `color-*`                      | `--color-semi-color-*`；值不是 `#`、`var(--semi-`、`rgb(`、`rgba(` 开头时抛错 |
| `border-radius-*`              | `--radius-semi-*`                                                             |
| `shadow-*`                     | `--shadow-semi-*`                                                             |
| `transition_function-*`        | `--ease-semi-*`                                                               |
| `spacing-*`                    | `--spacing-semi-*`                                                            |
| `font-size-*`                  | `--text-semi-*`                                                               |
| `line-height-*`                | `--text-semi-*--line-height`                                                  |
| `font-weight-*`                | `--font-weight-semi-*`                                                        |
| `font-family-*`                | `--font-semi-family-*`（加 `family-` 以免与字重同名）                         |
| 值为十六进制颜色的调色板 token | `--color-semi-<色名>-<色阶>`                                                  |

线性渐变和 AI 渐变跳过；z-index、控件高度、边框宽度没有 Tailwind 命名空间，用 `z-(--semi-z-modal)` 这类写法直接引用。

## 方向与 RTL

- 样式用 CSS 逻辑属性（`margin-inline-start`、`inset-inline-end`、`padding-block` 等）跟随 `direction`。stylelint 在这些组件里禁止 `left`、`right` 物理写法，以及会把左右分开设置的四值简写和多值 `border-radius`。
- 例外：[decisions](../../docs/decisions.md) 第 2.1 节 L3 列出的 11 个组件（cropper、sidebar、video-player、ai-chat-input、ai-chat-dialogue、chat、code-highlight、resizable、markdown-render、audio-player、float-button）还没定 RTL 方案，保持物理写法。`stylelint.config.ts` 的物理值检查只覆盖 semi-foundation，其中排除 cropper、video-player、code-highlight、resizable、markdown-render、audio-player、float-button；semi-ai-foundation 整体不在检查内。
- 必须用物理值的地方（由 transform 驱动的偏移、物理方位的定位）写 `stylelint-disable` 注释，并用 `-- 原因` 写明原因，stylelint 会检查。
- 属性顺序按 Recess 分组（定位、盒模型、排版、视觉），块内依次是 `$` 变量、自定义属性、`@mixin`、无块的 `@include`、声明；嵌套规则和 `@media` 不参与排序。`@use` 列表和其后的第一个 `$` 变量之间空一行。顺序不用手排，`pnpm lint:fix` 和提交时的 lint-staged 会自动修正；`@if` 分支里的声明 autofix 不处理，需要手动调整。

## 层与优先级

- Semi 的 CSS 默认放在 `@layer semi` 里（构建时由 `semiCssLayer` PostCSS 插件包裹，使用方可以用插件选项 `cssLayer: false` 关闭）。未分层的规则总会胜过 Semi，所以覆盖 Semi 样式不需要提高选择器优先级。
- 与使用分层的库（如 Tailwind v4）共存时，使用方必须声明层序（`@layer theme, base, semi, components, utilities;`）。没有声明时只有两种结果：Semi 压过工具类，或被 Preflight 覆盖。写文档和集成测试时把层声明当作前提。
- 不写 `!important`，不写带类型限定的选择器（`div.x`），两者都由 stylelint 禁止。需要覆盖时，用更具体的类名组合。
- 按目标浏览器（Chrome 120 / Firefox 125 / Safari 17.2）保留仍然需要的厂商前缀（如 `-webkit-backdrop-filter`、`::-webkit-scrollbar` 系列），stylelint 中有允许列表。新能力用标准写法，目标下限不支持时用 `@supports not (...)` 补兼容规则；隐藏滚动条用 `hide-scrollbar` mixin，不直接写 `scrollbar-width: none`。

## 文档站样式

- 站点全局的元素规则放进 `website/src/styles/reset.css` 的 `@layer semi.reset`。不写未分层的元素规则（会胜过 Semi，例如 `button { line-height }` 曾弄坏 Input），也不另声明 `@layer reset, semi`：Astro 先输出组件样式，`semi` 会先被声明，顺序就反了。
- 文档站使用 modern-normalize（`html { line-height: 1.15 }` 等），与空白页和 Tailwind Preflight 页面的元素默认值不同；在文档站量到的尺寸不能直接当作空白页的结果，核对尺寸时换空白页。
- 站点自己的类样式不分层。页头、侧栏、目录、搜索等外壳组件（`website/src/components/*.astro`）的样式写在组件自己的 `<style>` 里，由 Astro 加作用域；脚本生成的节点和图标组件输出的元素没有作用域标记，选择器用 `:global()`。`website/src/styles/site.css` 只放全局变量、多个组件共用的类（如 `.site-icon-button`）、页面布局和正文排版。文章排版只作用于 `.doc > ...` 的直接子元素，demo 由 `.demo-preview` 隔离（14px / 20px）。
- stylelint 经 `postcss-html` 一并检查 `.astro` 里的 `<style>`。
- 多个页面共用的 demo 样式放在 `website/src/styles/docDemo.scss`；只有一个页面用的放到该页面目录。
- 测量盒模型影响时用 `box-sizing: revert-layer`，不用 `content-box`：原生 button 在 UA 样式表里是 border-box。
