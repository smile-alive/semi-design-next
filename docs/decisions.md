# 决策与已知问题

本文记录 Semi Design Next 已定的设计决策和组件的已知问题。写法规则见 `.agents/references/`，相对原 Semi 的变化见 `docs/release-notes.md`。

- 已定决策不重新讨论。要改动时先找维护者，确认后直接改写对应条目。
- 问题修复后删掉对应条目，修复历史用 git log 查。
- 条目开头的状态：
    - **待处理**：问题成立，等着排进后续工作。
    - **待核实**：还没确认，括号内写影响和确认办法。
    - **已知限制**：当前实现的限制，括号内写什么情况下再改。
    - **保持原样**：原行为如此，重写时没改。
    - **不做**：评估后决定不处理，括号内写原因。

## 待办与待核实

- **待处理** 测试，React：`hydrateFromServer` 只移走 `document`，按 `typeof window` 分支的依赖在服务端也走浏览器分支，这类 hydration 不一致只有 check-pages 能发现（改为读取 `react-ssr` 项目在 Node 中产出的 HTML）。
- **待核实** ScrollList：cycled wheel 按整段副本跳转 `scrollTop`，触控板与 iOS Safari 的惯性滚动可能被打断（真机验证；受影响时改为滚动停止后再跳转）。
- **待核实** Toast：播报区在真实读屏器中没验证过，相同文本 1 秒内连播可能不播报（VoiceOver、NVDA 实机核对）。
- **待核实** Navigation：RTL 下折叠态悬停弹出的子菜单与横向模式的 Dropdown 子菜单没核对位置（展开、折叠、横向的主体布局已确认镜像正确；补这两处的 RTL 截图比对）。
- **待核实** Typography：复制成功后的读屏播报因读屏而异（实机核对）。
- **待核实** Input：输入法组合中失焦时 Input 是否要像 TextArea 一样按 `maxLength` 截断；Vue TextArea 同设 `maxlength` 与 `composition` 时，受控或 `v-model.lazy` 下截断结果可能与显示不一致（真实输入法复现后补用例）。
- **待核实** Tree：键盘用 `aria-activedescendant` 而不是 roving tabindex，读屏效果没验证（VoiceOver、NVDA 实机）。
- **待核实** AIChatInput：macOS Chrome 从 Finder 复制文件后粘贴，剪贴板是否同时带文件名和文件（只带文件名时只插入文字、不上传）。

## 全局决策

### 运行环境与产品边界

**支持的浏览器与兼容写法**（2026-10-27）

支持 Chrome 120、Firefox 125、Safari 17.2 及以上；Firefox 取 125 是因为它原生支持 Popover。兼容写法分三种：

- es-toolkit 等已有依赖能替代的 JS 能力，组件直接调用该函数。
- 只能从全局补齐的 API（`AbortSignal.any`、`checkVisibility`）放进可选包 `@fibrae/semi-polyfill`，使用方在入口最先导入，组件包不自动导入。
- 参数级差异与 CSS 新特性（`scrollIntoView({ container })`、`focus({ focusVisible })`、`field-sizing` 等）在 foundation 挂载后做特性检测，集中在 `semi-foundation/src/utils/supports.ts`，每项注释写明可删除的浏览器版本。

视觉效果不降级：滚动条、固定列阴影、自适应尺寸、焦点环与动画都有兼容写法。兼容路径在 Firefox、Safari 上就是主路径，测试覆盖 Playwright Firefox 与 WebKit。`requestIdleCallback` 在所有 Safari 都没有，回退写在 JsonViewer 里，不进 polyfill。

**部署在 HTTPS**

`navigator.clipboard`、`crypto.randomUUID` 只在安全上下文可用，直接使用，不留回退。

**项目名与标识符**（2026-10-22）

只改显示名为 Semi Design Next。npm 包名 `@fibrae/semi-*`、目录名、类名前缀 `semi-`、CSS 变量 `--semi-*`、`@layer semi`、`semi:` importer、`semiGlobal` 都沿用 semi：改标识会破坏使用方的样式覆盖、主题和导入，类名前缀已能由构建插件的 `prefixCls` 替换。

**主题包**（2026-10-13）

公司内没有外部主题包。`semi-theme-default` 并入 `semi-foundation/theme/`，插件不接受主题包，定制只走 `--semi-*` CSS 变量与普通 CSS 规则。

**发布形态**

发布物只有 ESM。webpack、rspack、vite、next 四个构建插件保留。

### 仓库与工程

**目录与文件命名**

全仓目录和文件名用 kebab-case，含生成的图标与插画模块，由 `unicorn/filename-case` 检查。例外：语言包文件名 `zh_CN`、文档站 `.astro` 组件、图标 SVG 源文件。文档站 slug 与组件目录同名。

**`packages/` 目录布局**（2026-11-08）

第一层只放发布给使用方的组件包 `semi-{ui,ai,icons}-<框架>`。框架无关的运行时依赖放 `packages/shared/`，构建插件与 `semi-scss-compile` 放 `packages/plugins/`。目录名等于 npm 包名去掉 `@fibrae/`。插画并入图标包，入口为 `@fibrae/semi-icons-<框架>/illustrations`；主题编译核心并入 `@fibrae/semi-scss-compile/core`。理由：按框架分组让目录名与包名脱节，全平铺又让组件包与工具包混在一起；插画与图标共用数据和渲染组件，分包只增加成本。

**组件目录平铺**（2026-11-10）

组件目录平铺，入口组件、子组件、hook 与工具函数放同一层，不建 `widgets/`。多个文件合起来组成一个有名字的部分时，用这个名字建子目录（Table 的 `body/`、Image 的 `preview/`、Form 的 `schema-form/`）。入口组件和子目录主组件都与所在目录同名（`select/select.tsx`），`index` 只做导出。一个组件有两个以上 hook 时放进本框架的 hook 目录（React、Svelte 为 `hooks/`，Vue 为 `composables/`，Solid 为 `primitives/`）。理由：Ant Design、Arco、MUI、Radix 等主流库多数平铺，组件逻辑已在 foundation，框架包的组件目录文件不多。

**基础目录的导入入口**（2026-11-10）

foundation 的 `base/`、`utils/`、`locale/`，ai-foundation 的 `base/`、`utils/`，以及 UI 包的 `base/`、`utils/`、`internal/` 与 hook 目录各有一个 `index` 汇总导出。组件、测试、文档站与 `vitest/` 从入口导入，每个入口一条 import；基础目录内部只用深路径，否则会循环依赖（`pnpm lint:private` 检查）。`utils` 入口不含日期模块，`base` 入口不含 `base/env`：前者体积大，后者是构建插件改写前缀的目标。

**按前端框架隔离规则、lint 与测试**（2026-10-23）

规则文档在 `.agents/references/<框架>/`，lint 在 `lint/<框架>/`，测试在 `vitest/<框架>/`。共享文件不写框架名，新增框架只加目录与注册项。`.vue` 模板由 ESLint 检查，这是「不引入第二套同类工具」的例外：oxlint 不检查模板，按后缀豁免又会漏掉 Vue 包 `.ts` 里的误报。

**TypeScript 严格模式**（2026-11-10）

Vue、Solid、Svelte 的 UI、AI、图标包，以及 `semi-icons-core`、`semi-icons-react`、`semi-animation`、`semi-polyfill`、全部构建插件，以及 `tsconfig.node.json` 覆盖的 Node 脚本（lint 规则、`scripts/`、插件测试、打包与宿主测试）开启 `strictNullChecks`。存量包 `semi-foundation`、`semi-ai-foundation`、`semi-json-viewer-core`、`semi-ui-react`、`semi-ai-react` 不开启：实测全量开启后，为过类型加的判空、兜底与类型拼装远多于发现的真实缺陷。TS 只用于开发期发现隐形 bug，不为类型写防御代码。`noImplicitOverride`、`noUnusedLocals` 对全仓开启。不用 `isolatedDeclarations`（2026-10-08）：它要求所有导出函数显式标注返回类型，而本仓库可推导的返回类型不手写。

**分支与历史**（2026-11-04）

历史保持一条直线。`release` 是唯一集成分支，PR 只用 Rebase and merge；`main` 只是最后一次发版的指针，由 Release 工作流在发布后 fast-forward，不接收 PR。理由：两个分支互相 merge 会让历史图无法阅读，互相 rebase 又必然冲突。正式文档站只随发版更新，发版之间上线文档要手动 fast-forward `main`（见 CONTRIBUTING「发布」）。

**React lint**

`react/rule-suppression`、`react/invariant` 全局设为 error（`lint/react/index.ts`）。

### 依赖选型

**虚拟列表**（2026-10-13）

React 用 `@tanstack/react-virtual` 3，Vue、Solid、Svelte 用对应的 TanStack Virtual。Select、Cascader、Tree、TreeSelect、Transfer、Pagination、Table 统一经内部组件 `internal/virtual-list` 渲染。不用 `react-window` 2：它没有 `innerElementType`，表达不了 Table 的 tbody 内层。

**动画**

删除 `semi-animation-react`、`semi-animation-styled`。动画交给 Motion（Vue 用 motion-v），`semi-animation` 只提供给 Motion 用的缓动、弹簧预设与 View Transition 预设类；组件内部的补间用 `semi-foundation/utils/tween.ts`。

**AI 组件拆包**

AIChatInput、AIChatDialogue、Chat、Sidebar 拆成 `semi-ai-foundation` 与四个框架的 `semi-ai-*` 包，`@tiptap/*` 随之移出核心包，AI 包另发 `styles.css`。Plus 组件留在 UI 包。

**图标与插画**

各框架的图标与插画组件读同一份 `semi-icons-core` 数据，插画经图标包的 `/illustrations` 入口导出。

**Anchor 滚动**

保留 `scroll-into-view-if-needed`，Anchor 新增 `scrollIntoViewOptions`。

**内置语言包**（2026-11-10）

只内置并维护 zh_CN、en_US。原来的 55 个其他语言包多为机器翻译，新增可访问名称时无人能核对。ConfigProvider、LocaleProvider 的 `locale` 接受 `LocaleInput`（`code` 必填，其余键可缺），缺的键回退 en_US。四个 UI 包经独立入口 `@fibrae/semi-ui-<框架>/locale` 导出 `zh_CN`、`en_US` 与类型，组件入口不导出它们；React 的这个入口不带 `'use client'`，Server Component 可直接导入。

**日期组件的 date-fns 语言**（2026-11-10）

语言包不含 `dateFnsLocale`。DatePicker、TimePicker、Calendar 先读 ConfigProvider 的 `dateFnsLocale`，再按语言包的 `code` 查内置表（只有 zh-CN、en-US），都没有时用 enUS（`semi-foundation/src/utils/date-fns-locale.ts`）。查表同步、返回单例，服务端与客户端首帧一致。理由：原来每个语言包都带 date-fns 数据，默认语言的日期数据会打进所有读语言包的组件；MUI X、Element Plus、Arco、Ant Design 都把文案与日期库语言分开配置。

### 组件协议

**原组件只作参考实现**（2026-10-09）

可以与原组件不一致。a11y 按 WAI-ARIA 与 APG 的推荐做法；原有 bug 默认修复；文档与代码不一致时，先用 git 历史判断哪边是原意，再改另一边。

**属性透传**（2026-10-08）

组件根 DOM 透传未声明的属性，先解构已知的非 DOM 属性。触发器注入属性用 `cloneElement`，只透传 props。

**Props 类型**（2026-10-12）

Props 类型等于原 Semi 的声明加上属性落点元素的原生属性（`ElementProps<E, 冲突名>`），同名时原 Semi 签名优先；落点是内部输入框的组件取该元素的属性。`src/__tests__/element-props*.test.tsx` 同时校验类型与落点。维护者批准过以下例外，变化本身见 release-notes：

- 回调的事件参数改为运行时实际收到的类型（Tooltip、Popover、Dropdown、Popconfirm、DatePicker、TimePicker、Modal、SideSheet、Feedback、Navigation、Tabs、Anchor、Tag、Cascader、TreeSelect、Tree）。
- 每次都会传入的回调参数由可选改为必填（Table 等）。
- 逐个组件的调整：Dropdown.Item 的 `onKeyDown` 沿用 `li` 的签名；Toast 静态方法选项补 `motion`；Tree 的 `expandIcon` 放宽、删除 `preventScroll`；Cascader 的 `virtualizeInSearch.height` 收窄为 `number`；Upload 的 `transformFile` 改为 `(file: File) => File`；Resizable 的事件改为 `PointerEvent`；Slider 新增 `id`、`title`、`onFocus` 并放宽 `marks`；Link 删除 `level`、`direction`；Form 字段删除 `validate`，放宽 `CommonFieldProps` 与 `validator` 返回值。
- Vue 把 `onChangeWithObject`、`onSelectWithObject` 改名为 `changeWithObject`、`selectWithObject`：Vue 把 `on` 加大写字母开头的键当监听器，简写的布尔属性会在服务端渲染和透传 attrs 时丢失。

**全局默认值**（2026-10-08）

对外导出的顶层组件都读 `semiGlobal.config.overrideDefaultProps`（React、Solid、Svelte 经 `useDefaultProps`，Vue 经 `semiDefault`），并在 `semi-global.ts` 的类型中补上组件名。静态挂载的子组件（如 `Timeline.Item`）不读。不读的例外：ConfigProvider、LocaleProvider 本身就是配置入口；Icon 不依赖 UI 包的全局配置；ConfigConsumer、LocaleConsumer 没有可设默认值的展示属性。组件在其他组件内部渲染时照常读；会破坏复合组件结构的属性，由复合组件显式传值挡住（见 Input、Select）。

`semiGlobal` 只在应用启动时设置，按请求变化的配置用 ConfigProvider，不做按请求隔离。React、Solid 的 `semiGlobal` 是模块级单例，请求间共享；Vue 经 `app.provide` 按应用隔离；Svelte 默认是单例，可经根 context 的 `semiGlobalKey` 按应用隔离。

**无根 DOM 的包装组件**（2026-10-09）

Popover、Popconfirm、Dropdown、UserGuide 收到的未声明属性丢弃，与原 Semi 一致；需要自定义属性时写在触发元素上。

**对话框属性落点**（2026-10-09）

Modal、SideSheet 的 `data-*` 等落在最外层根元素；`aria-label`、`aria-labelledby`、`aria-describedby` 落在 `role="dialog"` 元素上。使用方传的 `role`：Modal 落在 `role="dialog"` 元素，SideSheet 落在外层容器；要统一时 React 与 Vue 同批修改。

**RTL 方向**（2026-10-21）

方向由 `dir` 属性决定，样式用 `:dir(rtl)` 写在组件自己的类上，不写 `.semi-rtl` 等祖先类。ConfigProvider 显式传入的 `direction` 与外层不同时，输出带 `dir` 的包裹 div；Portal 根元素、Tooltip 弹层、Toast、Notification、Table、ModalContent 输出 `dir`，方向为 undefined 时不输出。有 ConfigProvider 而没传 `direction` 时 context 解析为 `ltr`，与 Ant Design、Mantine、Arco 一致。依赖方向的 JS 逻辑读组件的 `direction` 属性或 ConfigProvider，不读 DOM 上的 `dir`。

**Shadow DOM**（2026-10-21）

支持 open ShadowRoot。弹层 Portal 到所在根节点；焦点查询经 `FocusTrapHandle.getActiveElement`、`getDeepActiveElement`；id 查询在组件容器或所在根节点内进行。不提供 Web Component 构建，组件样式由应用加入 ShadowRoot。

**宿主契约**（2026-10-23）

四个框架沿用 foundation 加 adapter，实现同一份契约（`base/foundation.ts`），都要通过 `vitest/utils/host-contract.ts` 的夹具：

- prop 变化由宿主驱动：foundation 声明静态 `propKeys`，宿主比较快照后调 `handlePropsChange(prev)`。
- 一次性副作用放 `initOnce()`。
- 隐藏时（StrictMode 重放、Activity、KeepAlive）`destroy()` 只撤销 `init()` 建立的内容、不写 state，重新显示后原样出现。
- `destroy()` 时 DOM 不一定还挂载：Svelte 先移 DOM 再 teardown，夹具用 `detachedOnDestroy` 区分。
- Checkbox、Radio 事件的 `target` 由 foundation 构造为 `{ checked, value, name, disabled }`。

**Vue 受控值**（2026-10-16）

prop 加 `emit('update:x')`，不用 `defineModel` 与 VueUse `useVModel`：它们按有没有传属性键判断受控，单向绑定时组件会自己翻转。主值一律叫 `modelValue`，使用方写 `v-model`；`visible`、`open` 等写成 `v-model:x`。

**Vue 内容型属性**（2026-10-15）

只用 slots。数据数组里的节点（Table `columns[].render`、Select `optionList[].label` 等）改为组件级作用域插槽。Props 类型同样包含落点元素的原生属性，写在 `defineProps` 里 `/* @vue-ignore */` 之后的交叉类型中，只作用于类型；API 表只列组件自身属性，内容型属性列在 Slots 表。

**React 子组件收集**（2026-10-21）

展开 Fragment，与 Vue 的 `slotNodes` 一致；子组件用静态 `elementType` 识别，经 `elementTypeOf` 读取。

### Solid

**版本**（2026-10-25）

solid-js 1.9 稳定版，peer `^1.9.17`：dom 产物导入的 `setStyleProperty` 从 1.9.8 才有，测试只在 1.9.17 上运行。Kobalte、Ark UI、TanStack Solid Virtual、`@astrojs/solid-js` 都只支持 1.x。Solid 2 正式发布后另立任务整体迁移宿主层，不保留兼容。

**范围**（2026-10-27）

semi-ui-solid 全部组件、semi-ai-solid（编辑器基于 `@tiptap/core` 自写宿主）和图标插画，与 React、Vue 各包一起发布。

**子组件数据收集**

收集型父组件用 token：子组件返回以公开访问路径（`Tabs.TabPane`）为标签的数据 token（`base/token.ts`）。Solid 的 `children()` 返回 DOM，读不到子组件函数与静态属性。只按子项身份识别，不是子项的内容不渲染并告警。

**触发器属性注入**

函数 children 加 `getTriggerProps(own)`，与 Kobalte、Ark UI 一致；Solid 不能 clone 子元素。

**数据数组只放数据**（2026-10-26）

Table `columns`、Select `optionList`、Tree `treeData`、Tabs `tabList` 等数据项只收 `string`、`number` 等值，节点交给 `renderXxx` 或列的 `render`。JSX 在读取处立即创建 DOM，放在数据里的节点在服务端与客户端的创建时机无法一致。

**服务端执行**（2026-10-25）

Solid 与其他框架一样支持服务端渲染与 hydration。组件体不碰 DOM，写法见 `.agents/references/solid/components.md` 的「服务端执行模型」「JSX 只在插入处创建」「不检查子节点 DOM 类型」三节。服务端不能检查子节点的 DOM 类型，只能用首帧可确定的输入决定结构。

**其他**

lint 经 oxlint jsPlugins 接 eslint-plugin-solid 的 TypeScript 预设。受控 `visible` 双向拦截。宿主不统一做失活，因为 Solid 没有保活原语。

### 服务端渲染

**范围**（2026-10-25）

React、Vue、Solid、Svelte 支持服务端渲染与 hydration，React 另支持 RSC 客户端边界。`semi-ui-react`、`semi-ai-react`、`semi-icons-react` 的 `dist` 里除入口以外的模块首行加 `'use client'`。只给导入 react 的模块加不够：有些模块在顶层调用 client 模块的函数，在服务端求值就会抛错。图标也要加：组件按 `elementType` 识别图标，不加时 Server Component 里的图标在服务端渲染成普通 `span`，组件认不出（与 lucide-react、MUI、Ant Design 的图标包相同）。

**默认打开的弹层**（2026-10-25）

不进服务端 HTML，hydration 后打开，与 Radix、React Aria、Reka UI、Kobalte 相同。

**命令式 API**（2026-10-25）

Toast、Notification、Modal 的静态方法在服务端抛出说明性错误，提示在事件或 effect 中调用，或改用 hook。

**React 子组件命名导出**（2026-10-25）

只为 Server Component 中实测失败的点语法补命名导出，即 Typography 的 `TypographyTitle`、`TypographyText`、`TypographyParagraph`、`TypographyNumeral`，点语法保留。其他复合组件需要在 Server Component 中直接用时再补。

**文档站 demo 的注水**（2026-10-25）

按框架整体切换：框架达标后把 demo 默认改为 `client:visible`，没达标的页面列为例外。不做单个 demo 的退出机制，有问题的 demo 改 demo 本身。

**宿主夹具**（2026-10-25）

运行器在 `vitest/hosts/`，每个宿主一个描述文件 `vitest/<框架>/hosts/<宿主>/host.ts`，由它把宿主应用写进临时目录，仓库不放宿主源文件。命令 `pnpm test:hosts`，需要网络，不进 `check`。

### 构建、样式与文档站

**CSS 交付**（2026-10-25）

组件 JS 继续导入 `.css`，默认不导入 `styles.css`。整包样式是可选路线：插件开 `omitCss`，再导入一次 `styles.css`。两条路线不混用，混用时 CSS 体积约翻倍。宿主插件负责把导入 CSS 的包打进服务端产物：Vite 系用 `@fibrae/semi-vite-plugin`，Nuxt 用 `@fibrae/semi-nuxt`，Next.js 用 `@fibrae/semi-next`。

**Next.js 插件**（2026-10-25）

`omitCss` 默认 `false`，同时输出 `transpilePackages`、`turbopack.rules` 与 `webpack()`。Turbopack 不能重编译 SCSS，其下 `prefixCls` 必须配 `omitCss: true` 并导入 `semi-build-scss` 生成的样式表；`cssLayer`、`extractCssOptions`、`overrideStylesheetLoaders` 只对 `--webpack` 有效，Turbopack 下传入即抛错。

**Nuxt 模块**（2026-10-25）

`@fibrae/semi-nuxt` 是薄模块：读取 `semi` 配置键，注册 `@fibrae/semi-vite-plugin` 并透传选项，不重复实现 noExternal 与 omitCss，不做组件自动导入。

**Solid 发布形态**（2026-10-25）

四个 Solid 包额外产出保留 JSX 的 `.jsx`，`exports` 加 `solid` 条件指向它，dom 产物留在 `default` 条件，与 Kobalte、corvu 相同。没有它 SolidStart 无法服务端渲染。

**React Compiler**

库产物不预编译，库构建不开启；文档站开启（`website/astro.config.ts`），用 Oxc 原生版。

**Sass 模块**

用 `@use` 与 `@forward`，样式经 `semi:` importer 注入，协议见 `.agents/references/styles.md`。

**文档 demo**

每个框架一份 demo 代码（`demos/<id>.react.tsx`、`.vue`、`.solid.tsx`、`.svelte`），界面文案统一中文，中英文档共用；文档正文与 API 说明中英各一份。

**API 表**（2026-10-24）

API 表从组件类型生成，说明写在各页的 `api.<框架>.json`，生成双语片段 `api/<组件>.<框架>.<语言>.mdx`；缺说明或说明过时时 `check:full` 报错。Vue 用 vue-component-meta，其余框架用 TS compiler API（`website/scripts/ts-api.ts`）。表格不设版本列：本仓库不跟上游发版。细则见各框架的 `website.md`。

## 跨组件的已知限制

- **已知限制** 依赖测量的内容首帧缺失：下列内容要测量或挂载后才写入，服务端 HTML 与 hydration 前没有。需要首帧即正确时，按 props 推算初值。
    - Solid：DragMove、Cropper 的尺寸与定位；文字头像的缩放；Tabs 折叠；Calendar 月视图折叠与周、日视图的今天列；Image 的预览入口属性；JsonViewer、AIChatInput 的编辑器内容；mdx 与异步插件的 MarkdownRender 正文。
    - Solid、Vue：Resizable 分隔条的 `aria-value*` 与各项尺寸；Table 的 `--semi-table-section-width`。
    - 所有框架：OverflowList 测量完成前整个列表 `visibility: hidden`。
- **已知限制** Svelte 读不到 snippet 的输出：snippet 是否渲染出内容、渲染出什么文本都读不到，所以空 snippet 的容器仍然渲染，或者文本要从 DOM 读。涉及 Timeline、HotKeys、Collapse、Dropdown、Navigation、Tree、List、Tag、Typography、Carousel、Avatar。Svelte 提供判断办法后再改。
- **已知限制** 默认打开的弹层在服务端 HTML 里没有打开，触发器的 `aria-expanded`、`aria-controls`、`aria-describedby` 挂载后才与弹层一致（Tooltip 家族、Select、TreeSelect、AutoComplete；见全局决策「默认打开的弹层」）。
- **已知限制** Svelte：prefix、suffix 是文本还是图标要挂载后才知道，服务端首帧不带对应类名（Input、Select、TagInput）。
- **已知限制** Solid：在图标槽位之外预先创建的图标元素（数据对象里的 JSX，如 `Modal.confirm({ icon })`）读不到槽位 context，类名与尺寸挂载后才补上；图标尺寸适配也分不清 `size="default"` 与未写尺寸（Navigation、Input、Breadcrumb、Toast、Notification、确认框）。
- **已知限制** 原地修改检测不到：宿主只比较引用，原地修改的数组或对象要整体替换（Vue Cascader 的 `modelValue`，Svelte Cascader 的 `value`、`keyMaps`，Select 的 `options`，AutoComplete 的 `data`）。

## 组件

### 基础

#### Button、IconButton、ButtonGroup、SplitButtonGroup

- **已知限制** Svelte：ButtonGroup 分隔线服务端首帧缺失（改为 CSS 隐藏末项分隔线时可解决，要改 foundation SCSS）。
- **保持原样** React：非元素的 `icon` 不渲染。

#### Divider

- **保持原样** Vue：render 期两次调用默认插槽。

#### FloatButton、FloatButtonGroup

- **保持原样** 子项 key 用下标。

#### Grid

- **决策** Col 不在 Row 内（2026-10-09）：gutter 为 0，正常渲染，不再抛错。Form 字段只设字段级 `labelCol`、`wrapperCol` 时，由字段自己包一层 Row。

#### Layout、Header、Footer、Content、Sider

- **决策** `has-sider` 首帧：维持下面登记的限制，React、Vue 不改；Solid 若能在组件体内登记、首帧就得到该 class 则修。
- **保持原样** Sider `breakpoint` 只在挂载时读取；`hasSider={false}` 去不掉 has-sider；根元素为 `section`；React、Vue、Svelte 的深层 Sider 在服务端首帧缺 `has-sider`；Vue 渲染期读默认插槽最多两次。

#### Resizable、ResizeGroup、ResizeItem、ResizeHandler

- **已知限制** Svelte：ResizeItem 的 `style` 变化会丢掉 ResizeGroup 写入的宽高，`style` 要保持不变。
- **保持原样** React Handler 的 `direction`、`onResizeStart`、`disabled` 声明了但不生效；动态增删子项不重新分配比例；ResizeGroup 直写子项的 `style.width`、`style.height`。

#### Typography（Text、Title、Paragraph、Numeral、Copyable）

- **决策** Solid（2026-10-25）：去掉 `LateNodes` 时包裹层不变，只切换属性；`copyable`、Numeral 只认字符串内容。
- **已知限制** Solid：`ellipsis` 截断后插入字符串，children 仍被创建但不插入（截断只在客户端发生，不影响 hydration）。
- **已知限制** Svelte：挂载后才渲染的图标保持自身尺寸，不随文字 size 变小。
- **已知限制** Svelte：Numeral 服务端首屏是未格式化文本，hydration 后格式化。
- **保持原样** 省略加 `showTooltip` 且有复制按钮时，Tooltip 包住整个根元素（Ant Design、Arco 相同）。
- **保持原样** 只设 `expandText` 不设 `expandable` 时，按钮只触发 `onExpand`、不展开，也不带 `aria-expanded`（`collapseText` 同）。
- **保持原样** Solid：`link`、`delete`、`strong` 等修饰与 `ellipsis` 在运行时增减时，包裹元素与 children 重建，与 React 一致。
- **保持原样** Numeral `bytes-*` 有浮点误差；Vue Numeral 整段格式化。

### 输入类

#### AutoComplete

- **已知限制** 只用 `<label for>` 命名时 listbox 没有名称（传 `aria-label` 或 `aria-labelledby`）。
- **保持原样** `onChangeWithObject` 声明了但不读取；`loading` 时方向键、Enter 仍打开面板。
- **保持原样** Svelte：传了 `renderSelectedItem` 时，`value` 要用它的返回值（Vue 的 `modelValue` 相同）。

#### Cascader

- **已知限制** Svelte：就地修改 `$state` 的 `treeData` 时每次都快照整棵树比较，大树应整体替换；节点上放函数或 DOM 节点时 dev 下可能告警。
- **保持原样** 不用 `aria-owns`；点击标签后焦点落 body；多选搜索没有当前项时 Enter 仍建新标签；受控 `value` 里不在 `treeData` 中的路径没有占位标签。

#### Checkbox、CheckboxGroup

- **保持原样** Form 重置时输出 "value should be an Array" 警告。

#### ColorPicker

- **保持原样** AlphaSlider 忽略 `className`；两个 SliderWrapper 没有样式；`children` 只在 `usePopover` 时生效；`width`、`height` 为 null 时回退 280。
- **保持原样** Svelte：不提供 `defaultValue`，受控 `null` 显示内置默认色。

#### DatePicker

- **已知限制** 设了 `timeZone` 后，系统时区夏令时跳过的时刻在时间列表里选不到，只能输入（时间列表改为按 `timeZone` 取值时可解决）。
- **已知限制** Svelte：自定义 `trigger` 内有没有焦点目标只在挂载时测量一次；没有 KeepAlive，停用时关闭面板的行为没移植。
- **保持原样** `autoSwitchDate` 对范围无效；`onFocus` 打开时键盘选择或 Esc 后会重新打开；左面板键盘移出本月时焦点不跨到右面板。
- **保持原样** 实例方法 `open()`、`close()` 不调用 `onOpenChange`，只有用户操作时通知。
- **保持原样** Svelte：自定义 trigger 的 `inputValue` 在合法日期提交后变回 null，显示不受影响。

#### Form

- **决策** 校验模型（2026-11-05）：
    - 错误一律是 `string[]`。
    - 自带规则引擎替换 async-validator，默认文案来自语言包 `Form`。
    - 字段的 `rules` 与 `validator` 互斥，同传时 `validator` 生效并警告；`validator` 接受函数或 Standard Schema。
    - 有 Form `schema` 时不用字段的 `rules`、`validator` 与 Form 的 `validator`，必填星号只看 `label.required`；`schemaDebounce` 只作用于值变化触发的校验。
    - `keepState` 默认 true，ArrayField 保留整组。
    - 值类型区分输入与输出，`onSubmit` 与不带字段的 `validate()` 用输出类型。
    - SchemaField 按 JSON Schema 渲染某个路径，SchemaForm 是 Form 加根 SchemaField；定制只用 `widgets` 与 `renderField`，不做 uiSchema 与 `x-` 扩展。
- **决策** 导出方式（2026-11-06）：四个框架只有具名导出，`Form` 不挂静态成员，字段、部件、`ArrayField`、`SchemaField`、`SchemaForm`、`useForm` 各自导出。理由：用到 Form 时不再带上全部字段；Server Component 中点语法得到 `undefined`；具名导出可摇树。字段自身的子组件保留点语法（`FormSelect.Option`）。
- **已知限制** React：表单状态每次变化都重渲染全部字段，只影响大表单的性能（出现可测的性能问题时，字段改为从实例读初值）。
- **已知限制** `onSubmitFail` 的 `errors` 类型是错误树，Form `validator` 抛出或返回非对象时实际收到原值。
- **已知限制** keepState 卸载的 ArrayField 重新挂载后，`reset()` 恢复最初的 `initValue`，而不是最后一次挂载时的。
- **已知限制** 字段没有初值时 `onChange` 抛错后，子组件仍显示被拒绝的输入；`reset(fields)` 作废进行中的校验时，submit 会用未校验的初值调用 `onSubmit`。
- **已知限制** ArrayField 的 `keepState` 为 false 时，卸载或改 `field` 会删除旧路径的数据，即使旧路径已被另一个 ArrayField 的行占用（有人遇到时在 `#unRegisterArrayField` 里跳过）。
- **已知限制** `form-api-proxy` 的 `bind`、`unbind` 留在框架层：放进 foundation 会丢掉 Solid、Svelte 对 formApi 的包装。
- **已知限制** Svelte：用 `setValue` 删除 keyed 数组中间行时，先注销被移除行的字段，再创建接管该路径的新字段。
- **已知限制** Svelte：设了 `labelCol`、`wrapperCol` 时，InputGroup 的标签落在 wrapper 列。
- **保持原样** 挂载 Field 不触发 `onChange`；`CommonexcludeType` 的命名。
- **保持原样** `schema` 只保证 Zod：Valibot、ArkType、yup 只核对过错误路径格式，没跑用例（维护者决定）。

#### Input、TextArea、InputGroup

- **已知限制** Svelte：prefix、suffix、addon 的内容类型靠挂载后观察 DOM 判定，首帧先按其他节点渲染。
- **保持原样** 未声明属性落在原生 input；内部 Input 的全局默认值由宿主显式挡掉；TextArea 的清除按钮在 `click` 时清除。
- **保持原样** TextArea 读任意深度 InputGroup 的 `disabled`、不读 size（Ant Design 相同）。

#### InputNumber

- **保持原样** `pressInterval` 默认 250ms；小写 `autofocus` 落 DOM；挂载后 `localeCode`、`currency` 变化不重新格式化。

#### PinCode

- **已知限制** 输入法输入多个字符时只取最后一个。
- **保持原样** 输入框为空时 Backspace 仍调用 onChange；Backspace、Delete 不判断受控；其他 format 不限制字符；Form 注入的 `name` 被丢弃。
- **不做** 点击空格子不重定向焦点。

#### Radio、RadioGroup

- **已知限制** Solid：不在 RadioGroup 中的同名受控 Radio，选中一个后其余的原生选中状态不回写（React、Vue 相近）。
- **保持原样** onChange 事件对象没有 `nativeEvent`；受控 `checked` 为非布尔值时被忽略。

#### Select、Option、OptGroup

- **已知限制** `allowCreate` 不支持异步创建；读屏虚拟光标激活触发器内的控件不开合弹层；`virtualize` 时回落的高亮可能在渲染窗口外。
- **已知限制** `ellipsisTrigger` 加 `expandRestTagsOnClick` 时，展开期间选项变化、收起后恰好放得下，`+N` 会偏多。
- **已知限制** Svelte：`optionList` 里同一分组的条目必须相邻；虚拟列表下不显示分组标题。
- **保持原样** 分组标题使 `:nth-child` 偏移；自定义创建项不可聚焦；重开下拉保留上次高亮；`prefix` 与 `insetLabelId` 同传时 prefix 不作名称来源。
- **不做** 没选值时 placeholder 成为 combobox 的 AX value（2026-10-11，与 React Aria、Radix 一致）。

#### Slider

- **保持原样** 不输出 `aria-required`；受控时每次变化都触发 `onAfterChange`；min、max 变化不重新 clamp；touchmove 是被动监听；外层 Tooltip 注入的鼠标事件被覆盖。
- **不做** Firefox、Safari 的方向键验证。

#### TagInput

- **已知限制** 上次放下的动画没结束（约 1 秒内）时开始键盘拖拽，方向键不移动项：@dnd-kit/dom 的 KeyboardSensor 在状态回到 idle 前忽略按键（React、Vue、Solid）。
- **已知限制** Svelte：拖拽排序（Transfer 共用）变序时会移动持有焦点的手柄节点，手柄失焦；`@dnd-kit/svelte` 没有 `OptimisticSortingPlugin`，拖动中的顺序由组件自己的预览列表驱动。
- **保持原样** `setFocusing` 与 `toggleFocusing` 职责重叠；React、Solid 的 `restTagsPopoverProps.content` 会替换 +N 浮层里的剩余标签。

#### TimePicker、TimeInput、Combobox

- **已知限制** 自定义触发器内有没有可聚焦元素只在挂载时测量，之后内容变化不跟着切换 button 语义。
- **保持原样** `invalid` 恒为 false；`onBlur` 只在点击外部关闭时触发。

#### Transfer

- **已知限制** 点击 Transfer 内不可聚焦的区域时焦点落到 body，也会触发一次 blur（窗口失焦同样触发，与 TreeSelect 一致）。
- **保持原样** `draggable` 时忽略 `virtualize`。

#### TreeSelect

- **已知限制** 窗口失焦时下拉保持打开，只有 Tab 到外部或点击外部才关闭。
- **已知限制** Svelte：不绑定也不传 `value` 的 TreeSelect、Tree 放在展开 props 的包装组件里时，父级 props 变化会把 `value` 重置为 `undefined`。这是 Svelte 5 的行为（https://github.com/sveltejs/svelte/issues/15379），单独传 `value` 或用 `bind:value` 可避免。
- **已知限制** Svelte：`expandedKeys`、`loadedKeys` 被父级改回 `undefined` 时不同步清空。
- **保持原样** `prevProps` 存在 foundation state（见 Tree）；`isRenderInTag: false` 时没有 key 告警；点击标签后焦点落 body。

#### Upload、FileCard

- **决策** Solid（2026-10-25）：不加新 prop，按 Button 在组件体内的登记决定 `.semi-upload-add` 的角色。
- **已知限制** 添加区里有没有可聚焦控件要挂载后才判定，服务端 HTML 中触发区带 `role="button"` 并包着内部按钮。Solid 里 Semi 的 Button、IconButton 与 AIChatInput 上传按钮首帧即登记，其他控件仍在挂载后判定；Vue、Svelte 全部挂载后判定。
- **已知限制** FileCard 的 Props 带内部标志 `_sizeInvalid`，受控 `fileList` 要原样往返这个标志。
- **已知限制** FormUpload 必填且添加区自带可聚焦控件时，必填说明挂在根元素上，读屏聚焦使用方控件时读不到。
- **已知限制** 卸载时不 revoke 裁剪预览的 blob URL：`destroy()` 分不清卸载与隐藏。
- **已知限制** Vue：每个进度事件都重渲染全部 FileCard，因为插槽内的 `v-memo` 在服务端渲染时报错。
- **已知限制** Svelte：没接入 Tooltip 的特殊触发器协议，外包 Tooltip 时 `tabindex` 落在上传区域。
- **保持原样** React、Solid 的 `timeout` 与 React 的 `FileCardProps.className` 没有使用。

### 导航类

#### Anchor、Anchor.Link

- **已知限制** React、Vue：`autoCollapse` 下，`defaultAnchor` 指向折叠的 Link 里经其他组件渲染的子链接时，父项不展开。
- **保持原样** 只滚动最近的可纵向滚动容器；原生平滑滚动在卸载时无法取消。

#### BackTop

- **保持原样** 改 `visibilityHeight` 后等下次滚动才判断；`prefers-reduced-motion` 下仍平滑滚动；Vue 开发期警告每次更新重复；Svelte 开发期的交互元素警告只在 `children` 或按钮元素变化时重查。
- **不做** `description`。

#### Breadcrumb

- **保持原样** `moreType="popover"` 时点击 Popover 内的链接会冒泡并展开所有项。

#### Navigation（Nav、Item、Sub、Header、Footer）

- **已知限制** 包装 Nav.Item 的组件内部写死 `itemKey` 时 Nav 读不到。
- **已知限制** Vue：包装 Nav.Sub 的组件只作为一项收集，其子项不参与默认选中项的祖先展开。
- **已知限制** Solid：用 `items` 渲染时新数组会重建所有行，持有焦点的行失焦；Nav.Sub 里 Item、Sub 以外的内容放进 Dropdown 后读不到该 Dropdown 的 context。
- **已知限制** Svelte：children 写法没有祖先自动展开和顶层 Sub 选中标记。
- **保持原样** children 写法重渲染时重建菜单；受控 `openKeys` 不驱动水平或折叠弹层；禁用的链接项仍跳转。
- **不做** context 字段保持可选（存量包不开启 `strictNullChecks`）。

#### Pagination

- **保持原样** 受控页码超过总页数时列表为空；total、pageSize 变化时回到第 1 页；small 模式 `total` 为 0 显示「1/0」。

#### Steps

- **保持原样** Step 在 Steps 外使用会抛错；React、Solid、Svelte 的 Step 传入的 `tabIndex` 被可点击状态覆盖；可点击 Step 的 `role="button"` 包住整个步骤（Ant Design、MUI 相同）。

#### Tabs、TabBar、TabPane、TabItem

- **已知限制** Solid：TabPane 的内容按 Tabs 中的渲染位置查找 context，夹在中间的 Provider 不生效。
- **已知限制** Solid：数据 token 在收集方之外以数组插入时显示为 "[object Object]"；`tabBarExtraContent` 的 `float` 只读一次；折叠宽度只在页签增删或换序时重置。
- **已知限制** Svelte：没有 axe 测试，只有 Chromium 下的 AX 树测试。
- **保持原样** `handleArrowClick` 改写传入的数组；TabPane 脱离 Tabs 或 `more` 非法时抛错。

#### Tree

- **已知限制** `loadData` reject 的分支没有单测覆盖：未处理的 rejection 会让 vitest 失败。
- **已知限制** Solid：Tooltip 包 Tree 只能用元素 children，`aria-describedby` 落不到 `role="tree"` 上；`expandIcon` 为元素时，类名与点击监听挂载后才加上。
- **保持原样** 拖拽时向 body 临时追加拖拽图元素（`setDragImage` 要求元素已在文档里）；`prevProps` 存在 foundation state，与 rc-tree 相同。
- **保持原样** 动画中 treeData 变化时 NodeList 停在旧节点；不支持 children 写法；行内按钮的 click 冒泡触发 `onSelect`；Enter、Space 不随 `expandAction` 展开。

### 展示类

#### Avatar、AvatarGroup

- **已知限制** Solid：AvatarGroup 首帧不知道子节点位置，按创建顺序计数 `maxCount`；子节点外有包装元素（`<Tooltip><Avatar /></Tooltip>`）时，首帧可能显示错，挂载后恢复（包装元素也向组登记后可解决）。
- **保持原样** topSlot、bottomSlot 只在 6 个预设尺寸渲染；包装元素内的多个 Avatar 共用一个重叠序号。
- **保持原样** Solid：默认 `+N` 的名称只列被隐藏头像的 `alt`，需要名称时给头像传 `alt`。

#### Badge、Space、Skeleton

- **保持原样** 字符串 `count='5'` 不受 `overflowCount` 截断；Vue Skeleton `loading` 为 false 时 ref 的 `$el` 是 Fragment 锚点。

#### Calendar

- **决策** 「今天」与时区（2026-10-25）：「今天」标记只在挂载后出现，foundation 的 `today` 参数接受 `null`。服务端渲染时给 Calendar 传 `displayValue`；服务端与浏览器的时区要一致，或给 DatePicker、TimePicker 传 `timeZone`。Calendar 不加 `timeZone`。
- **保持原样** 时间槽与日期格的点击没有键盘方式：每格加 button 会多出几十到几百个 Tab 停靠点（需要时改为 ARIA grid，复用 DatePicker 的网格模式）。

#### Carousel

- **已知限制** Svelte：幻灯片的 `id`、`aria-label` 由 Carousel 生成，使用方不能指定。
- **保持原样** `autoPlay`、interval 变化等到下次切换生效；不经 onChange 改 `activeIndex` 没有动画；`arrowProps.*.props` 替换内置 `onClick`；`goTo` 不重置计时。

#### Collapse、Collapse.Panel

- **已知限制** Solid：`keepDOM` 加 `lazyRender` 下，`children` 为 `null`、`false` 时仍视为有内容，`aria-controls` 不复位（已有 `it.fails` 用例）。
- **保持原样** Panel 脱离 Collapse 抛错；溢出滚动的内容区不可聚焦；Vue `everOpened` 在渲染期写入。

#### Collapsible

- **保持原样** 收起态的预览区不设 `inert`。

#### Cropper

- **保持原样** 切换 src 后 zoom、rotate 不重置。

#### Dropdown

- **已知限制** Svelte：`visible` 没绑定时，首次打开关闭后 foundation 走受控路径（继承自 Tooltip）；触发子元素禁用时外层没有 `cursor: not-allowed`。
- **保持原样** Item 自己的 `showTick` 不生效；Vue Item 的 `@click.once`、`@click.capture` 不走顶层分流；DropdownDivider 不读全局默认值。

#### Empty

- **保持原样** Vue、Solid 每个实例各挂一个 MutationObserver。

#### Highlight

- **保持原样** Vue 的数字样式不补 `px`。

#### Image、ImagePreview

- **已知限制** Svelte：分组列表里有重复 src 时，点击任一张都打开第一个出现的位置。
- **保持原样** 点击缩略图打开预览会触发 `onChange`；不支持 `preview.defaultVisible`。

#### List、List.Item

- **已知限制** Solid、Svelte：List.Item 在可点击与不可点击之间切换时，children 重建，其中的状态丢失。
- **保持原样** 有 dataSource 没有 renderItem 时既不渲染也没有空状态；grid 模式的 li 没有 ul 父元素；Item 的 `onContextMenu` 被覆盖；`grid` 的 className、style、ref 传给每个 Col。

#### Modal、ModalContent、ConfirmModal、useModal

- **已知限制** Vue：离场动画时长为 0 时，约 3 帧内连续关、开、关，对话框保持显示，焦点陷阱与滚动锁不释放。原因在 Vue 3.5 Transition，默认 120ms 不触发（上游 https://github.com/vuejs/core/pull/16134 发布后升级）。
- **已知限制** Svelte：`keepDOM` 加 `lazyRender={false}` 且一开始隐藏时，autofocus 失败，默认按钮获得焦点。
- **保持原样** onOk、onCancel 返回被拒绝的 Promise 时 foundation 再次抛出；React、Solid 组件版 Modal 的 Props 含命令式方法用的 `content`，组件版不渲染。

#### OverflowList

- **保持原样** 切换 renderMode 不重置派生的 visible。

#### Popover、Popconfirm

- **已知限制** Solid：Popconfirm 卡片内的点击不再到达外层，`clickToHide` 在卡片内不生效。
- **保持原样** Popconfirm 的 `onConfirm`、`onCancel` 实际收到 `e.nativeEvent`。

#### ScrollList、ScrollItem

- **保持原样** 首项 offsetTop 为 0 时被当作未知；`scrollToIndex` 的 `selectedIndex` 参数没有使用。

#### SideSheet

- **保持原样** Vue、Svelte：遮罩离场比内容长时被截断。

#### Table

- **已知限制** `virtualized` 且有列没声明数值 `width` 时，服务端 HTML 与首帧没有表体行。
- **已知限制** 固定表头或虚拟化时，可聚焦的滚动容器在 `role="table"` 内，axe 报 `aria-required-children`；加 `role="group"` 会把表格与行隔开，所以不加。
- **已知限制** 列既无 `key` 也无 `dataIndex` 时，拖拽列宽按位置存，列顺序变化后跟着位置走。
- **已知限制** Solid：`expandIcon` 的显示、隐藏类挂载后才加到使用方的节点上。
- **已知限制** Svelte：行高只取自 `itemSize`，不测量；`table.svelte` 不是泛型组件，行类型为 `Record<string, any>`；`components` 只接受标签名；`onScroll` 没有方向。
- **保持原样** 根类名 `semi-table-wrapper-undefined`；只应用第一个排序器；受控 currentPage 不调用 onChange；`rowSelection.disabled` 阻止 `clickRow`；`handlerClassName` 默认 `'resizing'`；`OnHeaderCell<R>` 使 `ColumnProps` 对 R 不变。
- **保持原样** Vue 选择列的 `originNode` 用 `h` 拼成，因为要作为 VNode 传给插槽。
- **不做** 列宽拖动手柄的键盘操作：APG 没有对应模式。

#### Tag、TagGroup、SplitTagGroup

- **已知限制** TagGroup 中文字相同的标签移除前一个时，后一个错位到前一个实例上（调用方要提供 `tagKey`）。
- **已知限制** Solid：TagGroup 折叠后，标签在可见区与 +N 弹层之间移动时重新挂载，关闭状态不保留。
- **已知限制** Svelte：可点击 Tag 的 `aria-label` 在服务端首帧缺失（名称首帧仍来自内容）。

#### Tooltip（及 Popover、Dropdown）

- **决策** 定位（2026-10-26）：用 `popover="manual"` 进入 top layer，位置由 foundation 的 JS 计算，打开期间随滚动、resize 和尺寸变化重算，触发器移出可见区域时隐藏。不用 CSS anchor positioning：箭头随翻转改方向要靠 `@container anchored()`，Lightning CSS 解析不了。
- **决策** 固定顶栏由页面在 `:root` 设 `--semi-tooltip-viewport-inset-top` 声明：顶栏属于页面，Select 等内部弹层无法逐个传参。
- **决策** 弹层 Portal 到触发器的根节点（`document.body` 或所在 ShadowRoot）。所有 trigger 都用 `manual`，点击外部与 Esc 由 Semi 处理。没有 `getPopupContainer`、`zIndex`、`margin` 等属性；下拉与触发器同宽读 `--semi-tooltip-trigger-width`。
- **决策** 嵌套与触发器（2026-10-08）：点在嵌套弹层内算点在外层 trigger 内，按组件树判断；trigger 有多个子节点时取第一个元素（2026-10-14）；禁用按钮只在 click、contextMenu 时包裹，hover、focus 直接监听；枚举子节点用 `ResizeObserver`。
- **决策** Modal、SideSheet 不用 `<dialog>.showModal()`：它会让挂在 body 的弹层、Toast、Notification 全部 inert。保持 Portal 加手写焦点陷阱。
- **已知限制** 触发器被滚动祖先裁掉一部分时，只让它露出更多的移动不触发重新定位。
- **已知限制** 受控请求被拒后，使用方之后自行设为该值时 hover、focus 触发跳过延时。
- **已知限制** Vue：hover、focus 弹层内打开 Modal 或图片预览后，指针移入该层会关闭外层。
- **已知限制** Solid：触发器内部没登记到 `TooltipPopupsContext` 的弹层算作外部，在其中按下鼠标会关闭 Tooltip（Modal、SideSheet、图片预览已登记）。
- **已知限制** Solid：原生 `<button disabled>` 和没调用 `useSpecialTrigger` 的禁用组件不被识别为特殊触发器；非函数 children 的特殊触发器在服务端认不出，包裹 span 的样式挂载后才补。
- **已知限制** Solid：触发元素的字符串 `style` 在两次打开之间被重写时，会冲掉 `pointer-events`。
- **已知限制** Svelte：`child` snippet 里的禁用、loading Button 不包裹，原生 `<button disabled>` 不识别；受控关闭的出场动画要在 `tick()` 之后才能读到。
- **保持原样** Vue 内层 click 加 `stopPropagation` 时焦点仍转发到外层；Slider、Rating 传 `closeOnEsc={false}`；React 直接嵌套 Tooltip 家族时不转交外层注入值。

#### UserGuide

- **保持原样** Vue 受控 `current` 的 watch 用 `flush: 'post'`，一次 flush 渲染两次。

### 反馈类

#### Feedback

- **已知限制** radio、checkbox 选项组没有默认可访问名称（用 `radioGroupProps`、`checkboxGroupProps` 的 `aria-label`）。
- **保持原样** popup 的 onOk、onCancel 返回被拒绝的 Promise 时再抛。

#### Notification、Notice

- **保持原样** React、Solid 直接渲染 `<Notice>` 不传 `type` 时带 `-undefined` class；`useNotification` 不支持传 `id` 原地更新；根元素 `onClick` 没有键盘方式。
- **保持原样** Svelte：进场离场是手写的 CSS 动画，CSS 取消动画时靠 `getAnimations()` 判断并立即结束。

#### Spin

- **保持原样** 挂载时已在加载就立即显示，`delay` 不生效。

#### Toast

- **已知限制** 指针悬停在 hook 列表上时把 `contextHolder` 移出文档再放回，列表仍按悬停暂停：浏览器移除节点时不补发 `mouseleave`（Notification 同）。
- **已知限制** Solid：`useToast`、`useNotification` 的 `contextHolder` 只读调用处的 context，放置处外层的 Provider 不生效。
- **保持原样** `close(id)`、`destroyAll` 不调用 `onClose`；`destroyAll` 没有离场动画；`getPopupContainer` 返回 null 时抛错；useToast 的 `defaultOpts` 忽略 `Toast.config()`；没有 `type` 时带 `-undefined` class；Vue 多个 app 共用时只继承最后安装的上下文。
- **保持原样** Svelte：动画模型同 Notification。

### Plus 组件

#### AudioPlayer、VideoPlayer

- **保持原样** 语言包键 `AudioPlayer.loop` 没有使用方；文档的 `playbackRateList` 说明与实际不符；VideoPlayer 没有 markers 时悬浮提示里有一个空的标题 div。

#### Chat

- **已知限制** Solid：`uploadTipProps` 与自定义 `uploadProps.children` 同用时，自定义节点内的可聚焦元素拿不到 `aria-describedby`（AIChatInput 相同）。
- **已知限制** `escapeHtmlInMarkdown` 不识别 4 空格缩进的代码块（AIChatDialogue 相同；改为 remark 插件时可解决）。
- **保持原样** markdown 异步编译使跟随底部落后一块；定时器卸载时不清理；`resetMessage` 在空列表时造一条 loading 消息；`uploadProps.renderFileItem` 被丢弃。

#### CodeHighlight

- **决策** 语言与主题由调用方提供（2026-10-09）：不内置语言。`CodeHighlight.register({ languages, themes })` 全局注册，`languages`、`themes` prop 作用于单个代码块，默认主题 `github-light`、`github-dark`。语法从使用方自己安装的 `shiki` 导入，产物只含注册过的部分；不接受按名称注册，那会把全部语法带回产物。
- **保持原样** 加载失败的 rejection 没有处理；github-light 的 `#E36209` 对比度 3.48:1，check-pages 不计入 `.shiki` 内的对比度。

#### DragMove

- **已知限制** Solid：只绑定顶层 HTMLElement，SVG 根元素不可拖动。
- **已知限制** Svelte：被拖元素上的响应式 `style` 会覆盖拖动写入的位置，其他样式要用 `style:` 指令；传入新的 options 对象会中断进行中的拖动。
- **保持原样** destroy 不还原 `cursor: move`；`allowMove` 只识别 input、textarea；没有键盘移动方式。

#### HotKeys

- **已知限制** Solid：`render` 返回 `undefined` 与不传 `render` 无法区分。
- **保持原样** 根 div 带 `onClick` 但没有 role 与键盘处理；Vue 默认插槽可能执行两次。

#### JsonViewer

- **已知限制** Svelte：`customRender` 只在首次渲染时检查是否有输出；函数绑定 `bind:value` 的 setter 拒绝或改写文本时，编辑器重建，光标位置丢失。
- **保持原样** `options` 含内联 `customRenderRule` 时每次父级渲染都重建编辑器；`staticCompletions` 只在推断出候选项时追加。

#### Lottie

- **已知限制** 开发环境的表达式告警只检查 `params.animationData`，不检查 `params.path` 加载的数据。
- **保持原样** `params` 显式传 `container: undefined` 会覆盖包裹节点。

#### MarkdownRender

- **决策** 服务端正文（2026-10-25）：foundation 为 `format: 'md'` 提供同步编译，各框架在初始状态里调用；`mdx` 仍在挂载后异步编译。
- **已知限制** Solid：按顶层块复用 DOM，流式输出时正在变化的整段连同其中的图片、CodeHighlight 一起重建。
- **已知限制** Svelte：不带 `node` 直接用 `defaultComponents` 时，`p` 不检测图片、`code` 不高亮、`table` 为空；自定义 `td`、`th` 不渲染（Vue 相同）；`runtime.ts` 靠函数名 `_createMdxContent` 识别 wrapper 内容。

### 其他

#### ConfigProvider、LocaleProvider、LocaleConsumer

- **已知限制** Svelte：父级传入内容相同的新对象时，`useConfig()` 的消费者 effect 多跑一次。
- **保持原样** `ContextValue.children` 从未赋值；LocaleConsumer 没有 `children` 时抛错。
- **不做** `screens` 跨断点时所有读 ConfigContext 的组件重渲染（实测低于 16ms，超过时拆独立 context）。

#### 内部组件：Portal、CSSAnimation、ResizeObserver

- **已知限制** Solid：ResizeObserver 的 `observeParent` 只取挂载时的父元素。
- **保持原样** Portal 的 `didUpdate` 没有使用方；ResizeObserver 的 `delayTick` 从未读取，observeParent 只观察 HTMLElement 父元素。
- **保持原样** CSSAnimation 的 animationend 每次都重复调用 `onAnimationEnd(false)`；`onAnimationStart` 调用两次；SubNav、Table 展开图标的 `isAnimating` 恒为 true。

### AI 组件

#### AIChatInput、Configure

- **决策** React 的 `immediatelyRender`（2026-10-25）：使用方没传时传 `false`，消除 tiptap 的服务端告警，两端首帧一致。
- **已知限制** Solid：父组件在挂载期间把 `generating` 设为 true 时，不清空内容与附件（React 会清空）。
- **保持原样** inputSlot 空槽的 placeholder 宽度晚一帧；Configure 的 `value`、`field` 只在挂载时读；`skillHotKey` 没有默认值。
- **保持原样** 四个框架各自调用 `setOptions` 同步 `editorProps`，与 tiptap 官方包一致。

#### AIChatDialogue

- **保持原样** 组件自己写回 chats 时 `onChatsChange` 只报一次（原来两次）；`resetMessage` 忽略传入的 message；`continueSend` 写死 false；Action 的 className、role、messageEditRender 没有消费。

#### Sidebar、Container、Annotation、MCPConfigure

- **已知限制** Solid：父组件在 `onMount` 里切换 `mode` 时不移动焦点。
- **保持原样** 没有 `url` 的 Annotation 条目不可聚焦；文件编辑器的 MenuBar 不是 `role="toolbar"`；Sidebar 忽略 `containerRef`、`renderHeader`、`children`。

## 类型、工具链与测试

- **已知限制** Vue、Svelte 的公开 Props 仍含内部属性：TextArea 的 `disabledEnterStartNewLine`，Input 的 `showClearIgnoreDisabled`，OverflowList 的 `overflowRenderDirection`，FormErrorMessage 的 `errorMessageId` 等，Vue 另有 Breadcrumb.Item 的 `active`、`route` 等。API 表如实列出并注明内部用途；React、Solid 已拆出 `XxxInternalProps`。
- **已知限制** React API 表生成器读不到 `useDefaultProps` 之后在函数体内解构的默认值，默认值列显示 `-`，由说明写出实际值（Button、Grid、Steps、Navigation 等）。
- **已知限制** `vp pack` 的 d.ts 打包会丢失经组件模块再导出的类型（semi-ai-react、semi-ai-vue），等打包工具修复。
- **已知限制** Solid：SolidStart 2.1.0 中，root 用 `ErrorBoundary` 包 `Suspense` 时，导入阶段就抛错的路由返回 200 且响应永不结束。与 Semi 无关，上游 https://github.com/solidjs/solid-start/issues/2260 修复后升级。
- **已知限制** Vue：渲染函数用 `{ ...slots }` 转交插槽时，SFC 模板里的条件插槽在服务端渲染中丢失输出（上游 https://github.com/vuejs/core/issues/16159）。withField、AIChatDialogue、Chat 经 `utils/hand-on.ts` 绕开；ModalContent、Feedback、AIChatInput 实测不受影响。上游修复后删除 `hand-on.ts`。
- **已知限制** `@vue/language-core` 3.3.12 起，URL 属性在作用域插槽内报 TS6133、TS2304（上游 https://github.com/vuejs/language-tools/pull/6241 发布后升级 vue-tsc）。
- **保持原样** React TabItem 的 `selected`、`deleteTabItem`、`handleKeyDown` 留在公开类型，自定义 TabItem 时可覆盖。
- **保持原样** 浏览器测试输出 `ResizeObserver loop completed with undelivered notifications`（Select、OverflowList、TextArea autosize、AIChatInput）：通知只推迟到下一帧，结果不变。出现在别的组件或伴随断言失败时再查。
- **保持原样** Sidebar 文件编辑器用例的 `fireEvent.keyDown` 带 `keyCode`：prosemirror-keymap 带修饰键时按 `keyCode` 回退。
- **保持原样** Svelte：`drag-move.ts` 的 `options` 在 attachment 闭包内解构，移到形参会改变响应式追踪。

## 主题与站点

- **已知限制** Table 页「固定表头」的示意图只有 React 实现，其他框架页没有。
- **保持原样** 主题 token 对比度低于 4.5:1（2026-10-13）。评估过 `@semi-bot/semi-theme-a11y` 色板：color-contrast 问题从 73 个 demo 增到 237 个，warning 与黄色系仍不达标，不采用。

## 附录：Solid 1.9 原语实测

2026-10-23 在 jsdom 与 solid-js 1.9.17 下测得，宿主与组件规则据此制定。

| 实测结果                                                                                                  | 影响                                                      |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| batch 外写入立即可读、DOM 同步更新；委托事件不自动 batch；batch 内写后读到新值、DOM 仍旧、effect 只跑一次 | 宿主把每次 foundation 调用包进 `batch`                    |
| 组件体内写 signal 不报错、不告警                                                                          | 渲染期不调用 foundation 的写方法，只能靠写法约束          |
| 没有默认值的 context 在 Provider 外读到 `undefined`；有默认值的收到 `value={undefined}` 时回落到默认值    | 带默认值的 context 不能被重置为 `undefined`               |
| `children()` 返回 DOM，读不到子组件函数与静态属性                                                         | 不移植 `elementType`，收集子组件数据用 token              |
| Portal 内的委托事件沿逻辑树冒泡，逻辑父元素上的原生监听收不到                                             | 点击外部要分别检查触发器与弹层                            |
| ref 回调时元素没接入文档；`onMount` 时已接入；`onCleanup` 在 DOM 移除前执行                               | 测量、聚焦、`init` 放 `onMount`，`destroy` 放 `onCleanup` |
| `mergeProps({ a: 1 }, { a: undefined }).a` 为 1                                                           | 默认值合并直接用 `mergeProps`                             |
