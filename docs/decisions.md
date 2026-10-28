# 已定决策与未完成事项

本文记录 Semi Design Next（上游 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork）已定的设计决策（第 1 节）和仍未完成的事项（第 2 节）。组件写法见 `.agents/references/`，组件问题见 `docs/component-issues.md`，相对原 Semi 的变化见 `docs/release-notes.md`。

- 前提：各框架包支持的框架版本以其 `package.json` 的 `peerDependencies` 为准（如 React 包的 peer 范围为 `^19.3.0`，Tooltip 经 `<Fragment ref>` 读取触发器）；组件支持 Chrome 120、Firefox 125、Safari 17.2 及以上（D15），工具链运行在 Node 26（版本以 `mise.toml` 为准）。
- 依赖现状以各 `package.json` 与 `pnpm-workspace.yaml` 的 `catalog` 为准。
- 未确认事项标 `UNKNOWN` 并写明影响和解决条件。

## 1. 已定决策

| # | 事项 | 决定 | 理由与约束 |
| --- | --- | --- | --- |
| D1 | 内部部署是否全部为 HTTPS | 已定：部署到服务器并配置 HTTPS 域名 | `navigator.clipboard` 与 `crypto.randomUUID` 只在安全上下文可用（HTTPS 与 localhost 均满足），直接使用，不留回退 |
| D2 | 虚拟列表库 | 已定（2026-10-13）：`@tanstack/react-virtual` 3，Vue 版用 `@tanstack/vue-virtual` | Select、Cascader、Tree、TreeSelect、Transfer、Pagination、Table 共 7 个组件统一经内部组件 `_base/virtual-list` 渲染。`react-window` 2 没有 `innerElementType`，表达不了 Table 的 tbody 内层 |
| D3 | 文档 demo 多语言 | 已完成：demo 每个框架一份代码（`demos/<id>.react.tsx`、`demos/<id>.vue`，见 `website/plugins/remark-demo.ts`），界面文案统一中文，中英文档共用；文档正文与 API 说明仍中英各一份 | demo 数为组件 demo 数 × 框架数 |
| D4 | 目录命名 | 已完成：组件包与 foundation 的目录和文件名为 kebab-case（语言包文件名 `zh_CN` 等保留），文档站 slug 与组件目录同名 | 公开深路径变化，见 release-notes「全局」；`DesignToken.astro` 按目录名精确匹配 |
| D5 | Tooltip 定位方案 | 已定（2026-10-26）：`popover="manual"` 进入 top layer，位置由 foundation 的 JS 计算（`adjustPosition` 决定翻转，`calcPosition` 按视口写 `left`、`top`、`x-placement` 与箭头偏移），打开期间随滚动、窗口 resize 与触发器或弹层的尺寸变化重算，触发器移出可见区域时隐藏弹层。固定顶栏由页面在 `:root` 设 `--semi-tooltip-viewport-inset-top` 声明，翻转、夹取与隐藏判断都把视口顶部这一段排除在外；做成页面级变量而不是组件属性，因为顶栏属于页面，而 Select、DatePicker 等内部弹层无法逐个传参。不用 CSS anchor positioning：箭头随翻转改变方向要靠 `@container anchored()`，Lightning CSS 解析不了，宿主构建只能删掉这些规则。弹层统一 Portal 到触发器的根节点（`document.body` 或所在 ShadowRoot），嵌套弹层的点击外部按组件树判断；所有 trigger 都用 `manual`，点击外部与 Esc 由 Semi 处理，`onClickOutSide` 不变 | Tooltip 体系没有 `getPopupContainer`、`zIndex`、`margin`、`rePosKey`、`arrowBounding`、`transformFromCenter`；`x-placement` 是自动调整后的方位；下拉与触发器同宽读 `--semi-tooltip-trigger-width`。Modal、SideSheet 不用 `<dialog>.showModal()`：它让对话框外挂在 body 的弹层、拖拽层、Toast、Notification 全部 inert，保持 Portal + 手写焦点陷阱 |
| D7 | Sass 模块系统 | 已完成：迁移 `@use` + `@forward`，样式经 `semi:` importer 注入 | 协议见 `.agents/references/styles.md` 的「Sass 模块与 semi: importer」 |
| D8 | `semi-animation-react`、`semi-animation-styled` | 已完成：两包删除。动画交给 Motion（Vue 用 motion-v），`semi-animation` 只提供给 Motion 用的 Semi 预设（缓动、弹簧）与 View Transition 预设类；组件库内部的补间用 `semi-foundation/utils/tween.ts` |  |
| D9 | AI 与 Plus 组件拆包 | 已完成：AI 组件（AIChatInput、AIChatDialogue、Chat、Sidebar）拆为 `semi-ai-foundation`（foundation、样式与框架无关的编辑器插件）与 `semi-ai-react`、`semi-ai-vue`；Plus 组件留在 UI 包 | `@tiptap/*` 随 AI 组件移出核心包；UI 包的 `styles.css` 不含 AI 样式，AI 包另发 `styles.css`。依赖去向见 release-notes |
| D10 | Anchor 自定义滚动行为 API | 已完成：保留 `scroll-into-view-if-needed`，Anchor 新增 `scrollIntoViewOptions` | 依赖不删除 |
| D11 | TS 严格模式 | 新组件严格；目前由包级 tsconfig 落实：`semi-ui-vue`、`semi-ai-vue`、`semi-icons-core`、`semi-icons-react`、`semi-icons-vue`、`semi-illustrations-vue`、`semi-animation`、`semi-scss-compile` 单独开启 `strictNullChecks`；存量包（`tsconfig.base.json` 显式 `strictNullChecks: false`）内新增的组件尚无独立严格配置；存量暂不开。不采用 `isolatedDeclarations`（2026-10-08） | 返回值为基本类型（`boolean`、`string`、`number`、`void` 等）且可推导时不手写返回类型，导出函数也一样，而该开关要求所有导出函数显式标注。`noImplicitOverride`、`noUnusedLocals` 已在 `tsconfig.base.json` 对全仓开启 |
| D12 | Vue 版内容型属性（React 中的 `ReactNode` 属性与 render props） | 已定（2026-10-15）：只用 slots；数据数组里的节点（Table `columns[].render`、Select `optionList[].label` 等）改为组件级作用域插槽 | Vue 版的 Props 类型同样按 F6 包含落点元素的原生属性，写在 `defineProps` 里 `/* @vue-ignore */` 之后的交叉类型中（`_base/element-props.ts`），只作用于类型，运行时仍经 attrs 透传；API 表从 Vue 组件类型单独生成，只列组件自身属性，内容型属性列在 Slots 表 |
| D13 | 项目名与标识符 | 已定（2026-10-22）：项目显示名为 Semi Design Next，只改显示名；npm 包名 `@fibrae/semi-*`、目录名 `packages/semi-*`、类名前缀 `semi-`、CSS 变量 `--semi-*`、`@layer semi`、`semi:` importer、`semiGlobal` 等标识沿用 semi，不随名称变化 | 改标识会破坏使用方的样式覆盖、主题与导入，类名前缀已可由构建插件的 `prefixCls` 替换。`@fibrae/semi-next` 是 Next.js 构建插件，与项目名无关 |
| D-1 | Vue 受控值的实现 | 已定（2026-10-16）：prop 加 `emit('update:x')`，不用 `defineModel` 与 VueUse `useVModel`。foundation 组件由 adapter 发出，其余组件走 `useControllable`。主值（React 的 `value` 或 `checked`）一律叫 `modelValue`，使用方写 `v-model`；`visible`、`open` 等写成具名 `v-model:x` | `defineModel` 与 `useVModel` 按是否传了属性键与 `onUpdate:x` 判断受控：单向绑定时（只传 `:model-value` 加 `@change`，或 Form 的 withField 没传 `onUpdate:modelValue`）组件会自己翻转，同值重渲染也不恢复 |
| D-2 | Vue 的 lint | 已定（2026-10-16）：React 与 Vue 的规则按目录隔离；`.vue` 模板由 ESLint 检查，是「不引入第二套同类工具」的例外 | oxlint 不检查模板；按后缀豁免会漏掉 Vue 包 `.ts` 里的 `setup()` 误报 |
| D-3 | Vue 版插画与图标 | 已定（2026-10-16）：新增 `semi-illustrations-vue` 与 `semi-icons-vue`，与 React 包读同一份 `semi-icons-core` 数据 | Empty 与 semi-ai-vue 需要 Vue 版插画 |
| D14 | 规则文档、lint、测试基础设施按前端框架隔离 | 已定（2026-10-23）：规则文档在 `.agents/references/<框架>/`，lint 在 `lint/<框架>/`，测试在 `vitest/<框架>/`；框架配置目录属于通用范围，运行时文件带框架名；新增框架只加目录与注册项 | 推广了 D-2：D-2 只覆盖 Vue 的 lint，按框架隔离同样用于文档与测试；共享文件不写框架名，新增框架不改共享逻辑 |
| D15 | 支持的浏览器与兼容层交付方式 | 已定（2026-10-27）：Chrome 120、Firefox 125、Safari 17.2 及以上（Baseline 2023，Firefox 取 125 以原生支持 Popover，D5 不变）。兼容写法分三种：es-toolkit 等已有依赖能直接替代的 JS 能力，组件代码直接调用该函数；只能从全局补齐的 API（`AbortSignal.any`、`checkVisibility`）由可选包 `@fibrae/semi-polyfill` 提供，使用方在入口最先导入；参数级差异与 CSS 新特性（`scrollIntoView({ container })`、`focus({ focusVisible })`、`scroll-state`、`field-sizing`、`interpolate-size` 等）在 foundation 挂载后做特性检测，支持时走新写法，否则走兼容写法。视觉效果不接受降级：滚动条、固定列阴影、自适应尺寸、焦点环与进出场动画都有兼容写法 | 组件包不自动导入 polyfill，避免污染使用方全局、让新浏览器白白加载；`requestIdleCallback` 在所有 Safari 都没有，回退写在 JsonViewer 代码里而不是 polyfill。特性检测集中在 `semi-foundation/src/utils/supports.ts`，每项注释写明可删除的浏览器版本；兼容路径在 Firefox、Safari 上是主路径，测试覆盖 Playwright Firefox 与 WebKit |

方案与预研提出的待决策项：

| # | 事项 | 决定 |
| --- | --- | --- |
| S2 | 公司内是否有外部主题包 | 已定（2026-10-13）：没有，`@fibrae/semi-theme-default` 并入 `semi-foundation/theme/`，插件不接受主题包，样式定制只走 `--semi-*` CSS 变量与不分层的 CSS 规则 |
| C1 | 库产物是否以 React Compiler 预编译后发布（peer 改为 `react@^19`） | 已定：不预编译 |
| C2 | Compiler 从打样阶段开启，还是全部重写完再开 | 已定：库构建不开启；文档站开启（`website/astro.config.ts` 的 `react({ compiler: true })`） |
| C3 | 用 Oxc 原生 compiler 还是 Babel 版 | 已定：Oxc 原生版 |
| C4 | `react/rule-suppression` 是否全局设为 error | 已定：`react/rule-suppression`、`react/invariant` 全局 error（`lint/react/index.ts`） |
| F1 | Tooltip trigger 有多个子节点时，按并集定位还是只取第一个 | 已定（2026-10-14）：树序第一个元素 |
| F2 | trigger 属性注入用 `cloneElement` 透传还是 `setAttribute` | 已定（2026-10-08）：`cloneElement` 只透传 props；组件根 DOM 透传未知 props（先解构已知的非 DOM 属性） |
| F3 | 在嵌套弹层内点击是否算点在外层 trigger 内 | 已定（2026-10-08）：按组件树判断，操作 trigger 自带的弹层不再关闭外层（会改变 `<Popover><Select/></Popover>` 的现有行为） |
| F4 | 禁用按钮配 click trigger 时继续包裹还是不支持 | 已定（2026-10-08）：只在 click / contextMenu 时继续包裹；hover / focus 直接监听禁用元素 |
| F5 | 枚举子节点用 `ResizeObserver` 还是同步的鸭子类型 observer | 已定（2026-10-08）：`ResizeObserver` |
| F6 | F2 透传后，Props 类型是否统一继承根元素的 HTML 属性类型 | 已定（2026-10-12）：React 版统一；Vue 版 2026-10-22 起在类型层统一，写法见 D12。Props = 原 Semi 声明 + 属性实际落点元素的原生属性（`ElementProps<E, 冲突名>`），同名时原 Semi 签名优先；落点为内部输入框的组件取该元素的属性；F11、F12 组件不变。`_base/__tests__/element-props*.test.tsx` 同时校验类型与落点。例外（维护者已批准，变化本身见 `docs/release-notes.md`）：回调事件参数改为运行时实际收到的类型（Tooltip、Popover、Dropdown、Popconfirm、DatePicker、TimePicker、Modal、SideSheet、Feedback、Navigation、Tabs、Anchor、Tag、Cascader、TreeSelect、Tree）；Table 等组件每次都会传入的回调参数由可选改为必填；Dropdown.Item 的 `onKeyDown` 沿用 `li` 的签名；Toast 静态方法选项补 `motion`；Tree 的 `expandIcon` 放宽、删除 `preventScroll`；Cascader 的 `virtualizeInSearch.height` 收窄为 `number`；Upload 的 `transformFile` 改为 `(file: File) => File`；Resizable 的事件改为 `PointerEvent`；SliderProps 新增 `id`、`title`、`onFocus` 并放宽 `marks`；LinkProps 删除 `level`、`direction`；Form 字段删除 `validate`，`CommonFieldProps` 与 `validator` 返回值放宽。Vue 的属性名例外（A8）：`onChangeWithObject`、`onSelectWithObject` 改名为 `changeWithObject`、`selectWithObject` |
| F7 | 原来不读 `semiGlobal.config.overrideDefaultProps` 的组件，改写后是否支持全局默认值 | 已定（2026-10-08）：对外导出的顶层组件都支持（React 经 `useDefaultProps`，Vue 经 `semiDefault`、`semiGlobalDefault`），并在 `semi-global.ts` 的类型中补上组件名；静态挂载的子组件（如 `Timeline.Item`）不读取。例外（2026-10-09）：ConfigProvider、LocaleProvider 不读取，它们本身就是全局配置入口，再叠一层会出现两个互不可见的配置来源。例外（2026-10-21）：Icon 不读取，图标包不依赖 semi-ui-react 的全局配置；ConfigConsumer、LocaleConsumer 不读取，它们只把 context 交给 children 渲染函数，没有可设默认值的展示属性。内部使用（2026-10-21）：组件在其他组件内部被渲染时照常读全局默认值；会破坏复合组件结构或语义的属性，由复合组件显式传非 undefined 的值挡住，宿主组件清单见 `docs/component-issues.md` 的「Input、TextArea、InputGroup」与「Select、Option、OptGroup」两节 |
| F8 | CodeHighlight 的语言与主题由谁提供 | 已定（2026-10-09）：调用方提供，不内置语言。`CodeHighlight.register({ languages, themes })` 全局注册，`languages`、`themes` prop 作用于单个代码块；默认主题 `github-light`、`github-dark`。语法与主题由调用方从自己安装的 `shiki` 导入，产物只含注册过的部分；注册晚于挂载时已挂载的代码块重新高亮。不接受按名称注册（会把全部语法带回产物） |
| F9 | Col 不在 Row 内时怎么处理 | 已定（2026-10-09）：gutter 为 0 正常渲染，不再抛错；Form 字段只设字段级 `labelCol`、`wrapperCol` 时由字段自己包一层 Row |
| F10 | 原组件行为与标准做法冲突时以哪个为准 | 已定（2026-10-09）：原组件只作参考实现，可以与之不一致。a11y 按 WAI-ARIA 与 APG 的推荐做法（如 RadioGroup 用 `role="radiogroup"`，对话框的 `aria-*` 落在 `role="dialog"` 元素上）；原有 bug 默认修复；文档与代码不一致时先用 git 历史判断哪边是原意，再改另一边 |
| F11 | 没有自己根 DOM 的包装组件（Popover、Popconfirm、Dropdown、UserGuide）收到的未声明属性 | 已定（2026-10-09）：丢弃，与原 Semi 一致；需要自定义属性时由使用方写在触发元素上 |
| F12 | 对话框类组件（Modal、SideSheet）的属性落点 | 已定（2026-10-09）：`data-*` 等落最外层根元素；`aria-label`、`aria-labelledby`、`aria-describedby` 落 `role="dialog"` 元素（APG 标准）。使用方传的 `role` 未规定：Modal 落到 `role="dialog"` 元素，SideSheet 落到外层容器，React 与 Vue 一致；要统一时两个框架同批修改并在此补上 `role` 的落点 |
| F13 | 组件能否在 Shadow DOM 内使用 | 已定（2026-10-21）：支持 open ShadowRoot。弹层 Portal 到所在根节点；焦点查询经 `FocusTrapHandle.getActiveElement`、`getDeepActiveElement`，按所在根节点进行；id 查询在组件容器或所在根节点内进行。不提供 Web Component 构建工具，组件样式由应用加入 ShadowRoot |
| F14 | React 收集子组件时如何处理 Fragment 与子组件识别 | 已定（2026-10-21）：展开 Fragment，与 Vue 的 `slotNodes` 一致；子组件用静态 `elementType` 识别，经 `elementTypeOf` 读取，不设 `isXxx` 标记 |
| F15 | RTL 方向由什么决定 | 已定（2026-10-21）：由 `dir` 属性决定，样式用 `:dir(rtl)`，挂在组件自己的类上，不写 `.semi-rtl`、`.semi-portal-rtl` 等祖先类和组件级 `-rtl` 类。ConfigProvider 在显式传入的 `direction` 与外层不同时（含最外层）输出带 `dir` 的包裹 div；Portal 根元素、Tooltip 弹层 wrapper、Toast、Notification、Table wrapper、ModalContent 根元素输出 `dir`，方向为 undefined 时不输出、继承祖先；Table、Toast、Notification、ModalContent 根元素上，使用方传入的原生 `dir` 优先（F2）。有 ConfigProvider 而未传 `direction` 时 context 的 `direction` 解析为 `ltr`，见 2.1 L8。依赖方向的 JS 逻辑（键盘方向、默认 position、Table 对齐等）读组件自身的 `direction` 属性或 ConfigProvider 的 `direction`，不读 DOM 上的 `dir` |

服务端渲染（SSR）决策，除注明日期的条目外均为 2026-10-25 已定。Solid 的 A9 至 A11 与 A20 见第 3.1 节：

| # | 事项 | 决定 |
| --- | --- | --- |
| A1 | SSR 范围 | 已定：React、Vue、Solid 支持服务端渲染与 hydration；React 另支持 RSC 客户端边界。`semi-ui-react`、`semi-ai-react` 的 `dist` 中除入口 `index.js` 以外的全部模块首行加 `'use client'`，图标与插画包不加。只给导入 react 的模块加不够：`config-provider/context.js` 等模块在顶层调用 client 模块导出的函数，`typography/index.js` 等对 client 引用执行 `Object.assign`，在服务端求值即抛错。复合组件的子组件命名导出见 A18 |
| A2 | CSS 交付 | 已定：组件 JS 继续导入 `.css`，默认不导入 `styles.css`；整包样式是可选路线（插件开 `omitCss`，再导入一次 `styles.css`），两条路线不混用，混用时 CSS 体积约翻倍。由宿主插件把导入 CSS 的包打进服务端产物：Vite 系用 `@fibrae/semi-vite-plugin`（Nuxt 经 `@fibrae/semi-nuxt`），Next.js 用 `@fibrae/semi-next`。不改为发布物不带样式导入，那会失去按需样式，`prefixCls` 仍需插件改 JS |
| A3 | 默认打开的弹层 | 已定：不进服务端 HTML，hydration 后打开，三个框架一致，与 Radix、React Aria、Reka UI、Kobalte 相同 |
| A4 | Calendar 的「今天」与时区 | 已定：「今天」标记（`aria-current`、`-today`、当前时间线、日视图 `aria-label` 中的今天）只在挂载后出现，foundation 的 `today` 参数接受 `null` 表示不标记；SSR 使用方给 Calendar 传 `displayValue`；服务端与浏览器的时区须一致，或给 DatePicker、TimePicker 传 `timeZone`（可经 ConfigProvider）。Calendar 不增加 `timeZone` |
| A5 | 命令式 API 在服务端调用 | 已定：Toast、Notification、Modal 的静态方法在服务端抛说明性错误（英文开发者信息，提示在事件或 effect 中调用，或改用 hook 形态） |
| A6 | MarkdownRender 服务端正文 | 已定：foundation 为 `format: 'md'` 提供同步编译，三个框架在初始状态中调用；`mdx` 仍在挂载后异步编译 |
| A7 | React AIChatInput 的 `immediatelyRender` | 已定：使用方未传时传 `false`，消除 tiptap 的服务端告警，两端首帧一致 |
| A8 | Vue 的 `onChangeWithObject`、`onSelectWithObject` | 已定：这两个布尔属性改名为 `changeWithObject`、`selectWithObject`，作为 F6 的 Vue 例外。Vue 把 `on` 加大写字母开头的键当作监听器，`mergeProps` 丢弃值为空串的这类键，简写 `<Select onChangeWithObject>` 在服务端渲染（单根模板总是经 `mergeProps`）与客户端根组件收到透传 attrs 时都会丢失 |
| A12 | 全局默认值 `semiGlobal` | 已定：只在应用启动时设置，按请求变化的配置用 ConfigProvider；不做按请求隔离（React、Solid 的 `semiGlobal` 是模块级单例，在请求间共享；Vue 经 `app.provide` 按应用隔离） |
| A13 | 文档站 demo 的注水方式 | 已定：按框架整体切换。框架达标后把该框架的 demo 默认改为 `client:visible`，未达标页面列为例外；不做单个 demo 的退出机制，问题 demo 改 demo 本身（固定值、挂载后计算） |
| A15 | `@fibrae/semi-next` 的默认值与 Turbopack | 已定：`omitCss` 默认 `false`（与 A2 一致）；同时输出 `transpilePackages`、`turbopack.rules` 与 `webpack()`。Turbopack 不能重编译 SCSS，其下 `prefixCls` 必须配 `omitCss: true` 并导入 `semi-build-scss` 生成的样式表；`cssLayer`、`extractCssOptions`、`overrideStylesheetLoaders` 只对 `--webpack` 有效，Turbopack 下传入即抛错。loader 由 `@fibrae/semi-webpack-plugin` 的子路径导出提供，复用现有 `semi-omit-css-loader.mjs`、`semi-prefix-loader.mjs` |
| A16 | Nuxt 模块 | 已定：新增 `@fibrae/semi-nuxt`（`packages/semi-nuxt`），薄模块，用 `@nuxt/kit` 的 `defineNuxtModule` 读取 `semi` 配置键，`addVitePlugin` 注册 `@fibrae/semi-vite-plugin` 并透传选项（`omitCss`、`prefixCls`、`cssLayer` 等），自身不重复实现 noExternal 与 omitCss；不做组件自动导入。写法为 `modules: ['@fibrae/semi-nuxt']` |
| A17 | 语言包导入路径 | 已定：三个 UI 包在 pack 时为 foundation 的 57 个语言包生成 `dist/locale/source/<名>.js` 与类型，内容是一行重导出，经现有 `./*` 导出得到 `@fibrae/semi-ui-<框架>/locale/source/en_US`，使用方不必直接安装 foundation；生成的文件不入库 |
| A18 | React 复合组件的子组件命名导出 | 已定：只为 Server Component 中实测失败的点语法补命名导出，即 Typography 的 `TypographyTitle`、`TypographyText`、`TypographyParagraph`、`TypographyNumeral`（`<Typography.Title>` 在 Server Component 中得到 `undefined`），点语法保留；不按 Vue 对齐全部子组件，不加对齐守卫。其他复合组件的点语法只在 `'use client'` 文件中使用，需要在 Server Component 中直接用时再按同样方式补 |
| A19 | 宿主夹具的位置 | 已定：运行器放 `vitest/hosts/`（通用，按目录发现宿主，不写框架名）；每个宿主一个描述文件 `vitest/<框架>/hosts/<宿主>/host.ts`（按命名归属框架），由它把宿主应用的文件写进临时目录，仓库不放宿主源文件（沿用 `vitest/packed/run.ts` 的 `write` 写法）；命令 `pnpm test:hosts`，需要网络或预热的 pnpm store，不进 `check` 与 `check:full` |
| B4 | Layout `has-sider` 首帧 | 已定：维持 `docs/component-issues.md` Layout 节登记的限制，React、Vue 不改；Solid 若能按「组件体内登记」模式在首帧得到该 class 则修，否则保持登记 |

已确定、无需再决策：发布产物只有 ESM；webpack / rspack / vite / next 四个构建插件保留。

## 2. 未完成事项

### 2.1 样式

| # | 事项 | 现状与建议 |
| --- | --- | --- |
| L2 | 各组件 rtl.scss 里挂在 `:dir(rtl)` 上的 `direction: rtl` 是否删除 | ConfigProvider 与弹层根输出 `dir` 后，`direction` 由 `dir` 继承，rtl 的 ConfigProvider 内使用方的内容同样是 RTL，这条声明冗余，可以删除；只含这一条规则的 `rtl.scss`，连同父文件里的 `meta.load-css('rtl')` 一并删除 |
| L3 | 11 个组件（semi-foundation 的 cropper、video-player、code-highlight、resizable、markdown-render、audio-player、float-button，semi-ai-foundation 的 sidebar、ai-chat-input、ai-chat-dialogue、chat）是否一并改逻辑属性 | 这 11 个组件不在 `stylelint.config.ts` 的物理值检查内，仍是物理写法；其中 chat、ai-chat-dialogue 已有 `:dir(rtl)` 规则，float-button 的 `rtl.scss` 没有规则。改写等于新增 RTL 行为，需先定是否支持。ConfigProvider 输出 `dir` 后，这些组件在 rtl 的 ConfigProvider 内会继承 `direction: rtl`，物理写法下布局是否半镜像未核对渲染结果（UNKNOWN） |
| L4 | `$radius-tabs_tab_card_left` 等物理多值主题 token 在 RTL 下不镜像 | 需先定 token 语义 |
| L5 | cascader 多选 checkbox 两侧各 8px（`margin-inline`，旧 rtl.scss 一条规则漏到 LTR 所致） | 为保证 LTR 零差异按现状保留；若只留结束一侧，LTR 会变化 |
| L6 | pincode、colorPicker 没有 rtl.scss，是否新增并声明 direction | 现保持物理写法；ConfigProvider 输出 `dir` 后，它们在 rtl 下继承 `direction: rtl`，行内与 flex 顺序已反转，物理间距未镜像；是否补逻辑属性待定，pincode 方向键（JS 按物理左右处理）不随方向反向 |
| L7 | card header 的 RTL 专属 `align-items: flex-end`（`card/rtl.scss`）是否删除 | 疑似误用，现保留 |
| L8 | ConfigProvider 未传 `direction` 时，context 的 `direction` 解析为 `ltr` 还是保持 undefined | 现状为 A：解析为 `ltr`，弹层与 Table 输出 `dir="ltr"`，页面自设 `dir="rtl"` 时行内组件为 RTL、弹层与 Table 为 LTR。B：保持 undefined，不输出 `dir`、继承祖先，会改变 ContextValue 的公开语义，需改各框架的 ConfigProvider、文档、api.vue.json 和相关用例。建议 A |

### 2.2 依赖

- `async-validator`：4.2.5 起停更，`RuleItem` 类型对外暴露；替换属 Form API 决策，另立。
- `lottie-web`：Lottie 已改为首次使用时动态导入（`semi-foundation/src/lottie/foundation.ts`），渲染器仍是完整版，轻量入口待评估。

### 2.3 体积

| 组件                                         | 问题                                                                                                                                                          | 做法                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Form                                         | React 版 `base-form.tsx` 静态挂载 19 个字段组件，用到 Form 就带上全部字段及其依赖（Vue 版已只提供 `FormInput` 等具名导出）                                    | 字段组件改为独立具名导出，`Form` 只保留容器与无重依赖的子组件；属公开 API 变化（`Form.Input` 写法） |
| Grid                                         | 生成 70 KB CSS，`grid/mixin.scss` 仍保留 float 布局与重复选择器                                                                                               | 只保留 flex 或 CSS grid，列宽用自定义属性                                                           |
| 每个组件的 demo                              | 各框架的 demo 注水方式由 `website/src/lib/frameworks.ts` 的 `demoHydration` 按框架切换（`client:only` 的框架，长页面首屏加载全部 demo 的 JS）                 | 框架达标后改为 `client:visible`，未达标页面列为例外                                                 |
| 图标                                         | 图标包的 `dist` 仍是每个图标一个 `.d.ts`                                                                                                                      | 每个包为全部图标生成单个 `index.d.ts`，单图标模块只发 `.js`                                         |
| DatePicker、TimePicker、Calendar 与 `locale` | `Locale` 接口含 `dateFnsLocale`（`semi-foundation/src/locale/interface.ts`），默认 locale 把 date-fns 语言包带进所有使用 `useLocale`、`LocaleConsumer` 的组件 | `dateFnsLocale` 移到日期组件内部按语言代码查找（自定义 locale 结构变化）                            |

### 2.4 TypeScript 与 API 表

- 存量清零后统一开启 `strictNullChecks` 与 `verbatimModuleSyntax`（`tsconfig.base.json` 目前都未开启）。
- API 表从组件类型生成，说明写在各页的 `api.<框架>.json`，生成双语片段 `api/<组件>.<框架>.<语言>.mdx`，页面在对应框架块里导入片段；缺说明或过时说明在 `check:full` 中报错。Vue 用 vue-component-meta（`gen:vue-api`）。React 用 TS compiler API（`gen:react-api`，2026-10-24 定），与其他用 TS compiler API 的框架共用 `website/scripts/ts-api.ts`；表格不设版本列，本仓库不跟上游发版，原 Semi 的版本号对使用者没有意义。Solid 同样用 TS compiler API（`gen:solid-api`）。

## 3. Solid

### 3.1 已定决策

| # | 事项 | 决定 | 理由与约束 |
| --- | --- | --- | --- |
| X1 | 宿主方案 | 已定（2026-10-23）：沿用 foundation 加 adapter，不改 foundation 的宿主契约 | Solid 宿主通过 `vitest/utils/host-contract.ts` 的契约夹具 |
| X15 | 版本 | 已定（2026-10-23，peer 下限于 2026-10-25 调整）：solid-js 1.9 稳定版（peer `^1.9.17`：dom 产物导入的 `setStyleProperty` 从 1.9.8 才有，测试只在 1.9.17 上运行）；Solid 2 正式发布后另立任务整体迁移宿主层，不保留兼容，迁移中途发布也先在 1.9 上做完 | Kobalte、Ark UI、`@tanstack/solid-virtual`、`@dnd-kit/solid`、`@astrojs/solid-js` 只支持 1.x |
| X19 | 收集型父组件如何拿子组件数据 | 已定：token 模式，子组件返回以公开访问路径（`Tabs.TabPane`）为标签的数据 token（`_base/token.ts`） | Solid 的 `children()` 返回 DOM，读不到子组件函数与静态属性（S-H4），不能按 `elementType` 识别；context 注册在 1.9 同样可行，作为备选 |
| X20 | lint | 已定：`lint/solid` 经 oxlint jsPlugins 接 eslint-plugin-solid 的 TypeScript 预设 | `solid/no-destructure` 在 typeAware 下报错，lint 链路可用 |
| X30 | 触发器属性注入 | 已定：函数 children 加 `getTriggerProps(own)`，与 Kobalte、Ark UI 一致 | Solid 不能 clone 子元素；写法见 `.agents/references/solid/components.md`「触发器」 |
| X34 | 虚拟列表 | 已定：`@tanstack/solid-virtual`，与 Vue 的 `@tanstack/vue-virtual` 对称（D2） |  |
| X36 | 范围与顺序 | 已定（2026-10-23）：semi-illustrations-solid、semi-ui-solid 全部组件、semi-ai-solid（编辑器基于 `@tiptap/core` 自写宿主），之后接入文档站；与 React、Vue 各包一起发布（2026-10-27） | 分阶段支持 SSR（A9）：组件体不碰 DOM，与 React、Vue 一样支持服务端渲染与 hydration |
| A9 | SSR 与 Solid 规则 | 已定（2026-10-25）：Solid 与 React、Vue 一样支持服务端渲染与 hydration。`.agents/references/solid/components.md` 增加「服务端执行模型」「JSX 只在插入处创建」「不检查子节点 DOM 类型」三节，删除 state 代理「只能按 key 读」的限制 | 服务端渲染下组件体只执行一次，JSX 在读取处立即创建 DOM 节点，在服务端没有 DOM 可检查 |
| A10 | Solid 发布形态 | 已定（2026-10-25）：四个 Solid 包的 `vp pack` 追加一遍保留 JSX 的 `.jsx` 产物，`exports` 加 `solid` 条件指向 `.jsx`，dom 产物留在 `default` 条件（Kobalte、corvu 同形态） | 没有 `solid` 条件的 `.jsx` 产物，SolidStart 的 dev 与生产都无法服务端渲染 |
| A11 | Solid 行为取舍 | 已定（2026-10-25）：Typography 去掉 `LateNodes` 时包裹层不变、只切换属性；`copyable`、Numeral 只认字符串内容；Upload 不加新 prop，按 Button 在组件体内的登记决定 `.semi-upload-add` 的角色。变化见 `docs/release-notes.md` | 服务端无法检查子节点的 DOM 类型，以首帧可确定的输入决定结构 |
| A20 | Solid 数据数组里的节点 | 已定（2026-10-26）：数据只放数据。Table `columns`、Select `optionList`、Tree `treeData`、Tabs `tabList` 等数据项只收 `string`、`number` 等值，节点交给组件的 `renderXxx` 或列的 `render`；涉及的组件见 `docs/release-notes.md` 各节的「Solid 破坏性」条目 | JSX 在读取处立即创建 DOM 节点（A9），放在数据里的节点在服务端与客户端的创建时机和插入位置无法一致；与 Vue 的 D12 同向 |

Solid 同样遵守：X2 受控 `visible` 双向拦截；X21 宿主不统一做失活（Solid 没有保活原语）；X28 只按子项身份识别，非子项不渲染并告警；X31 Checkbox 事件载荷按 Vue 的 `CheckboxEventTarget` 构造。

### 3.2 Solid 1.9 原语实测

2026-10-23 在 jsdom 与 solid-js 1.9.17 下测得，宿主与组件规则据此制定：

| #    | 结果                                                                                                              | 对宿主与组件的影响                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S-H1 | batch 外写入立即可读、DOM 同步更新；委托事件处理函数不自动 batch；batch 内写后读到新值、DOM 仍旧、effect 只跑一次 | 宿主把每次 foundation 调用包进 `batch`，一次事件只提交一次                                     |
| S-H2 | 组件体内写 signal 不报错、不告警                                                                                  | 渲染期不调用 foundation 的写方法只能靠写法约束                                                 |
| S-H3 | 无默认值的 context 在 Provider 外读到 `undefined`；有默认值的 context 收到 `value={undefined}` 时回落到默认值     | 带默认值的 context 不能被重置为 `undefined`                                                    |
| S-H4 | `children()` 返回 DOM，读不到子组件函数与静态属性                                                                 | 不移植 `elementType`，收集子组件数据用 token（X19）                                            |
| S-H5 | Portal 内的委托事件沿逻辑树冒泡到逻辑父元素的 JSX 处理函数，逻辑父元素上的原生监听收不到                          | 点击外部要分别检查触发器与弹层                                                                 |
| S-H7 | ref 回调时元素未接入文档；`onMount` 时已接入；`onCleanup` 在 DOM 移除前执行；effect 按创建顺序执行                | 测量与聚焦放 `onMount`，`connect`、`init` 在 `onMount`，`destroy`、`disconnect` 在 `onCleanup` |
| S-H8 | `mergeProps({ a: 1 }, { a: undefined }).a` 为 1                                                                   | 默认值合并直接用 `mergeProps`，与「undefined 视为未传」一致                                    |
