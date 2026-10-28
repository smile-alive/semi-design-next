# 发布说明

本文记录 Semi Design Next 相对上游 Semi Design 的破坏性变化与使用方需要注意的行为变化；未结的问题见 docs/component-issues.md，决策依据见 docs/decisions.md 第 1 节。

每条只写使用方要改什么或会看到什么，一两句话，不写实现细节与原因；各框架相同的变化只写一次，以框架名开头的条目（如「Vue：」）只列该框架特有的差异。

## 全局

- 支持 Chrome 120、Firefox 125、Safari 17.2 及以上（D15）。支持 Safari 17.4 以下时，在应用入口最先 `import '@fibrae/semi-polyfill'`，它只补齐 `AbortSignal.any` 与 `Element.prototype.checkVisibility`。
- 破坏性：React 包支持 React 19，Vue 包支持 Vue 3.5+。React 组件都是函数组件，ref 不再是类实例：有命令式方法的组件经 `XxxHandle` 暴露（如 `SelectHandle`、`DatePickerHandle`、`FormHandle`），其余指向根 DOM。删除 `BaseComponent` 导出与组件的 `propTypes` 静态属性。
- 破坏性：包名 `@fibrae/semi-ui` 改为 `@fibrae/semi-ui-react`，`@fibrae/semi-ai` 改为 `@fibrae/semi-ai-react`，`@fibrae/semi-illustrations` 改为 `@fibrae/semi-illustrations-react`；`@fibrae/semi-foundation`、`@fibrae/semi-ai-foundation` 不变，类名不变。
- 破坏性：图标包 `@fibrae/semi-icons` 改为 `@fibrae/semi-icons-react`，如 `@fibrae/semi-icons/lab` 改为 `@fibrae/semi-icons-react/lab`，`@fibrae/semi-icons/styles/icons.scss` 改为 `@fibrae/semi-icons-core/styles/icons.scss`。新增 `@fibrae/semi-icons-core`，放图标与插画的框架无关数据（`@fibrae/semi-icons-core/lab`、`@fibrae/semi-icons-core/illustrations`，单个插画的深路径为 `@fibrae/semi-icons-core/illustrations/icons/<Name>`），semi-icons-react 已依赖它。
- 破坏性：AI 组件拆为独立包（D9）：AIChatInput、AIChatDialogue、Chat、Sidebar、Annotation、MCPConfigure 与 `getConfigureItem`、`chatCompletionToMessage` 等改从 `@fibrae/semi-ai-react` 导入。深路径 `@fibrae/semi-ui-react/{ai-chat-input,ai-chat-dialogue,chat,sidebar}/...` 改为 `@fibrae/semi-ai-react/...`，`@fibrae/semi-foundation/{同上}/...` 改为 `@fibrae/semi-ai-foundation/...`。
- 破坏性：`@fibrae/semi-ui-react/styles.css` 不含 AI 样式，整包加载时在其后引入 `@fibrae/semi-ai-react/styles.css`（自定义前缀用 `semi-build-scss --ai <semi-ai-foundation>`）；`OverrideDefaultProps` 引入 AI 包后才含 AI 组件名。新增对应的 `@fibrae/semi-ai-vue`，样式在 `@fibrae/semi-ui-vue/styles.css` 之后引入 `@fibrae/semi-ai-vue/styles.css`。
- 破坏性：目录与文件名统一为 kebab-case（D4）：`@fibrae/semi-ui-react/iconButton/index` 改为 `@fibrae/semi-ui-react/icon-button/index`，`@fibrae/semi-foundation/datePicker/datePicker.scss` 改为 `@fibrae/semi-foundation/date-picker/date-picker.scss`，`@fibrae/semi-ui-react/table/Table` 改为 `@fibrae/semi-ui-react/table/table`；导出名、类名、Sass 变量名与语言包文件名不变。文档站页面路径同样改为 kebab-case，如 `/input/datepicker` 改为 `/input/date-picker`。
- 破坏性：发布产物合并为单一 `dist/`（只含 ESM、类型与 CSS），删除 `lib/`、`dist/css/`、`./dist/*` 与 foundation 的 `./lib/*` 子路径。`@fibrae/semi-ui/dist/css/semi.min.css` 改为 `@fibrae/semi-ui-react/styles.css`，`dist/css/semi-tailwind.css` 改为 `@fibrae/semi-ui-react/tailwind.css`，`dist/css/semi-ai.min.css` 改为 `@fibrae/semi-ai-react/styles.css`，Vue 包同理。
- `semi-scss-compile` 的 `foundationPath`、`aiFoundationPath`（`-f`、`--ai`）指向包内 `dist/`，`iconPath`（`-i`）改为 `node_modules/@fibrae/semi-icons-core/dist`；构建插件只能与本版本的 Semi 包搭配。
- 新增 hooks 入口 `@fibrae/semi-ui-react/hooks`、`@fibrae/semi-ui-vue/hooks`，导出 `useLocale`、`useClickOutside`、`useCopied`、`useDidUpdate`、`useEventListener`（及 `getWindow`、`getDocument`、`getBody`）、`useFocusHandover`、`useResizeObserver`，React 另有 `useMergedRef`。Vue 另有 `useMounted`（服务端与 hydration 期间为 `false`，挂载后为 `true`）与 `useRecordFocus(scope, visible)`（在 `visible` 变为 `true` 时记录焦点，首帧可见时在 `onBeforeMount` 记录，服务端不执行）。React 的 `useResizeObserver(target, onResize, { enabled })` 接受 ref、元素或 `null`，为空或 `enabled` 为 false 时不观察。
- 包入口导出各组件 Props 与辅助类型，重名的加组件前缀（如 `CascaderValue`、`TableSize`）。内部名改为公开名：`ModalReactProps` 为 `ModalProps`，`SideSheetReactProps` 为 `SideSheetProps`，`ToastReactProps` 为 `ToastProps`，`NoticeReactProps` 为 `NoticeProps`，`CollapseReactProps` 为 `CollapseProps`，`ColorPickerReactProps` 为 `ColorPickerProps`，`BaseFormProps` 为 `FormProps`，`BasicLayoutProps` 为 `LayoutProps`。
- 组件根 DOM 接收未声明属性（F2），如 `id`、`title`、Form 注入的 `name`；没有根 DOM 的包装组件（Popover、Popconfirm、Dropdown、UserGuide）丢弃未声明属性（F11）。Props 类型包含落点元素的原生属性（F6），同名不同签名的保持原 Semi 签名；F11、F12 组件与 Provider 不接受任意 DOM 属性。
- 破坏性：受控判断改看值是否为 `undefined`：`value={undefined}`（及 `checked`、`visible`、`activeKey` 等）与不传相同，按非受控处理，`defaultXxx` 生效；`null` 仍是受控值。受控值变回 `undefined` 时输入类组件清空并转为非受控，Tabs、Collapse、Carousel、UserGuide 从最后的受控值继续。
- 「是否传入」类属性同样按值判断，写成 `undefined` 与不传相同，隐藏 Modal 的 footer、header 需传 `null`。React 中回调属性传 `null` 按未传处理，内容类属性传 `0` 照常渲染。
- 对外导出的顶层组件每次渲染读取 `semiGlobal.config.overrideDefaultProps`（F7），Provider、Consumer 与 React 的 Icon 例外；TagGroup、IconButton、Divider、ButtonGroup 等有自己的键，IconButton 不再沿用 `Button`。破坏性：Navigation 的键名为 `Nav`，React 原 `Navigation` 键不再生效。
- `overrideDefaultProps` 中写成 `undefined` 的键视为未设置；`id`、`insetLabelId`、`wrapperId`、`addonId`、`extraId` 不再生效，类型也去掉。Vue 的非函数全局默认值在实例首次缺省时读取并缓存。
- 破坏性：收集子组件的组件（Steps、Timeline、Navigation、Tabs、Breadcrumb、Select、Table 的 `Table.Column`）展开 children 中的 Fragment，其中子项与直接写出的一样处理。只能在父组件内使用的子组件在外部使用时抛出 `<子组件> must be used inside <父组件>`。
- 键盘：不再监听 `keypress`，按键读 `KeyboardEvent.key` 而非 `keyCode`，输入法组合中的按键跳过。只设 `keyCode` 的模拟事件（如 `fireEvent.keyDown(el, { keyCode: 13 })`）需改传 `key`；`@fibrae/semi-foundation/utils/key-code` 不再有默认导出。
- 指针：拖动、缩放与按住连发（Slider、DragMove、Cropper、Resizable、ColorPicker、ImagePreview、Table 列宽、AudioPlayer 与 VideoPlayer 进度条、InputNumber 步进按钮）只在主键按下（`button` 为 0）时开始，笔的侧键与橡皮擦不再触发；鼠标左键、触摸与笔尖不变。
- 破坏性（样式）：`semi-` 前缀元素及其伪元素统一为 `box-sizing: border-box`（`@layer semi-base`），`style` 传入的宽高包含边框与内边距，部分组件小 1 到 2px；依赖 content-box 的自定义样式需调整。
- 组件自绘的可聚焦元素键盘聚焦时统一显示主题焦点环（`$width-focus-ring`、`$color-focus-ring`）。Semi 元素统一为细滚动条（`$color-scrollbar-thumb`），可被覆盖；`.semi-light-scrollbar` 更名为 `.semi-scrollbar`。
- 浮层统一入栈，Esc 只关闭栈顶浮层，在 document 冒泡阶段处理，模拟 Esc 需在焦点元素而非 window 上派发；带遮罩的 Modal、SideSheet、ImagePreview 打开时页面其余部分为 `inert`。锁定滚动时给 body 加 `padding-inline-end`，不再改写 `width`；`getPopupContainer` 返回 `null` 或 `undefined` 时 Portal 抛错。
- 破坏性：图标默认装饰性（`aria-hidden="true"`），不再输出 `role="img"` 与英文类型名的 `aria-label`；只有图标的按钮需传 `aria-label`，按 `getByRole('img', { name: 'close' })` 查询的测试需调整。图标不再用 `forwardRef`，判断图标改用 `elementType === 'Icon'`。
- 虚拟列表由 `react-window` 换为 `@tanstack/react-virtual`。拖拽排序换为 `@dnd-kit/react` 0.5（`~0.5.0`）：TagInput、Transfer 拖动中实时重排，触摸按住 250ms 后才开始；删除深路径 `@fibrae/semi-ui-react/transfer/sortable-list`。
- 破坏性（类型）：`BaseProps` 的 `children` 收紧为 `ReactNode`；每次都会传入的回调参数改为必填（如 Table 的 `sorter(a, b)`、Tree 的 `onChange(value)`）；回调事件参数改为运行时实际事件（点击外部为原生 `MouseEvent`，Esc 为原生 `KeyboardEvent`），读取 `e.nativeEvent`、`e.persist()` 会报错。
- 复制：Typography 的 `copyable.onCopy` 与 Sidebar 的 `onDetailContentCopy` 在剪贴板写入完成后异步回调，失败时 `res` 为 false。
- 破坏性（样式钩子）：RTL 改由 `dir` 与 `:dir(rtl)` 决定，删除 `semi-rtl`、`semi-portal-rtl`、`semi-modal-rtl`、`semi-table-wrapper-rtl` 等方向类名，自定义样式改用 `:dir(rtl)`。ConfigProvider 的 `direction` 与外层不同时，在内容外包一层带 `dir` 的 `div`。
- 破坏性：子组件 `elementType` 统一为 `Parent.Child`：`'BreadcrumbItem'` 改为 `'Breadcrumb.Item'`，`'NavHeader'`、`'NavFooter'` 改为 `'Nav.Header'`、`'Nav.Footer'`，Vue 的 `'AnchorLink'` 改为 `'Anchor.Link'`、`'DescriptionsItem'` 改为 `'Descriptions.Item'`；部分无人读取的 `elementType` 删除。
- Vue：命令式 API（Toast、Notification、Modal.confirm）共用一条 `app.use` 记录，节点型选项为 `XxxNode = string | VNode | (() => VNodeChild)`；`useClickOutside` 新增第 4 个参数 `nested`，返回的节点算作内部。
- Solid：新增组件包 `@fibrae/semi-ui-solid`、图标包 `@fibrae/semi-icons-solid` 与插画包 `@fibrae/semi-illustrations-solid`，导出名、prop 名、回调签名与受控 prop 同 React 包；`className` 写作 `class`，元素 ref 用回调或变量，节点型 prop 为 `JSX.Element`，回调为 Solid 事件处理函数（可用 `[handler, data]` 形式）。
- Solid：各 Solid 包的 `solid-js` peer 依赖为 `^1.9.17`，更早的 1.9 版本缺少 dom 产物导入的 `setStyleProperty`（1.9.8 起才有），且未经测试。
- Solid：`overrideDefaultProps` 在组件创建时读取；其中的 DOM 节点值（JSX）被忽略并告警，Spin 的 `indicator`、Switch 的 `checkedText` 这类节点型 prop 只能按实例传入。事件处理中的多次 set 不自动合并，需要「同一次更新」时用 `batch` 包住。
- Solid：hooks 入口 `@fibrae/semi-ui-solid/hooks` 导出 `useLocale`、`useClickOutside`、`useCopied`、`useEventListener`、`useFocusHandover`、`useMounted`、`useRecordFocus`、`useResizeObserver` 与 `mergeRefs`，参数接收访问器，状态以访问器返回；`useMounted()` 在服务端与 hydration 期间为 `false`，挂载后为 `true`；`useRecordFocus(scope, visible)` 在 `visible` 变为 `true` 时、DOM 更新之前记录当前焦点，服务端不执行；`useClickOutside` 返回的处理函数写在目标元素的 `onMouseDown` 上，`useEventListener` 的目标写成访问器（如 `() => window`）。不提供 `useDidUpdate`、`useMergedRef`，分别改用 `createEffect(on(..., { defer: true }))` 与 `mergeRefs`。
- Solid：拖拽排序（TagInput、Transfer）基于 `@dnd-kit/solid`，放下后不重建列表：父组件不接受新顺序时恢复原顺序，项节点与手柄焦点都保留；拖拽浮层元素只在拖拽中存在。
- Vue：空插槽三种语义：`#closeIcon` 为空回落默认图标（隐藏用 `closable=false`），Modal 的 `#header`、`#footer` 为空则隐藏，Carousel 的 `#leftArrow`、`#rightArrow` 为空不回落。原生属性只在类型中，运行时经 attrs 透传。
- 服务端渲染：默认打开的弹层不进服务端 HTML，hydration 后才打开。Toast、Notification、Modal 的命令式 API 只在客户端调用，在服务端调用抛带说明的错误。Calendar 在服务端渲染时需传 `displayValue`，「今天」标记只在挂载后出现；服务端与客户端时区须一致，否则给 DatePicker、TimePicker 传 `timeZone`（可经 ConfigProvider）。`semiGlobal` 只在应用启动时设置，按请求变化的配置用 ConfigProvider。

### 构建与宿主

- `@fibrae/semi-json-viewer-core` 把 `jsonc-parser` 打进自身 `dist`，不再作为运行时依赖，Next Pages Router 的 webpack 不再解析其 UMD 入口。
- `@fibrae/semi-foundation` 新增依赖 `@shikijs/core`，代码高亮改从它导入，不再导入 `shiki/core`（`shiki` 仍提供 engine 与主题）。
- `@fibrae/semi-webpack-plugin` 的 peer `webpack` 标为可选：插件运行时经 `compiler.webpack` 取宿主自带的 webpack（如 Next.js），无需单独安装；类型声明仍引用 `webpack`。
- `@fibrae/semi-vite-plugin` 为每个 server 环境（含 Nuxt 未设 `consumer` 的环境与 React Router `serverBundles` 的 `ssrBundle_*`）把 React、Vue 的 UI、AI、图标、插画包设为 `resolve.noExternal`，服务端渲染无需再配 `ssr.noExternal`；Solid 包不在其中，foundation 与 ai-foundation 只在设置了 `prefixCls` 时一并打进服务端产物（它们持有 `BASE_CLASS_PREFIX`，保持 external 会使服务端类名仍为 `semi-`，与客户端不一致）；SolidStart dev 中 vite-plugin-solid 会把 foundation 写进服务端环境的 `resolve.external`，插件在所有插件之后把它移除，`prefixCls` 才对服务端渲染生效。
- 破坏性：`@fibrae/semi-vite-plugin` 的 `semiTheming()` 返回 `Plugin[]` 而不是单个 `Plugin`：写进 Vite 的 `plugins` 数组时会被展开，常规用法不变；把返回值当单个插件对象使用的代码（读取 `.name`、直接调用其钩子）须改为按数组处理。
- `@fibrae/semi-vite-plugin` 的 `omitCss` 同时作用于 dev 预构建，dev 不再注入组件 CSS；改选项后用 `vite --force` 重建 `.vite/deps`。
- `@fibrae/semi-vite-plugin` 在应用依赖 `@fibrae/semi-ui-solid`、`@fibrae/semi-ai-solid` 时，把 foundation、ai-foundation 的依赖经直接依赖它们的 Solid 包加入 `optimizeDeps.include`（只装 ai-solid 的应用也覆盖 foundation 的依赖），SolidStart dev 不再因 CommonJS 依赖白屏：有根入口的依赖按包名加入，只有子路径导出的依赖（如 `@tiptap/pm`）按 `exports` 中的子路径逐个加入，dev 中 ai-foundation 直接导入的 `@tiptap/pm/state` 与 `@tiptap/core` 预构建内的 ProseMirror 是同一份实例，AIChatInput 不再因 ProseMirror 报 `Adding different instances of a keyed plugin` 而无法挂载。
- `@fibrae/semi-vite-plugin` 的 `omitCss` 与 `prefixCls` 覆盖 Solid 包。
- 破坏性：`@fibrae/semi-next` 的 `omitCss` 默认值由 `true` 改为 `false`，组件按需带出自己的样式，不再需要导入 `styles.css`；仍要整包样式时显式传 `omitCss: true` 并导入一次 `styles.css`。自定义 `prefixCls` 须同时传 `omitCss: true`，否则读取配置时抛错。不传选项时 `--webpack` 下不再挂 `SemiWebpackPlugin`，由 Next 直接处理组件导入的 `.css`。
- `@fibrae/semi-next` 删除对服务端 `externals` 的改写（Next 16 中从未生效），改为把 `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react`、`@fibrae/semi-icons-react`、`@fibrae/semi-illustrations-react` 合并进 `transpilePackages`，Pages Router 两种打包器的 dev、build、start 不再报 `.css` 扩展名错误。
- `@fibrae/semi-next` 同时返回 `turbopack.rules` 与 `webpack()`，支持 Next 16 默认的 Turbopack；开 `omitCss` 或 `prefixCls` 时，应用已有同 glob 的 Turbopack 规则（`*.js`）即抛错，其他规则保留。
- `@fibrae/semi-next` 在 Turbopack 下（按 Next 读取配置前设置的 `process.env.TURBOPACK` 判断）传入 `cssLayer`、`extractCssOptions`、`overrideStylesheetLoaders` 即在读取配置时抛错。
- `@fibrae/semi-webpack-plugin` 新增子路径导出 `./semi-omit-css-loader`、`./semi-prefix-loader`，供按绝对路径引用 loader 的宿主（Next 的 `turbopack.rules`）使用。
- `semi-build-scss` 的 `-f`、`-i`（JS API 的 `foundationPath`、`iconPath`）改为可选：缺省时由 `@fibrae/semi-scss-compile` 自带的 `@fibrae/semi-foundation`、`@fibrae/semi-icons-core` 依赖解析，pnpm 隔离布局下应用无需直接安装这两个包，`semi-build-scss --prefix my -o app/semi-my.css` 即可，但 `@fibrae/semi-scss-compile` 的版本须与组件库一致，不一致时显式传 `-f`。`--ai` 路线的 `-f` 同样可选，`--ai` 本身仍须给出路径。
- `@fibrae/semi-ui-solid`、`@fibrae/semi-ai-solid`、`@fibrae/semi-icons-solid`、`@fibrae/semi-illustrations-solid` 的 `dist` 在 dom 产物 `.js` 之外新增同名的 `.jsx` 产物（JSX 原样保留，导出名一致）。`exports` 的 `.`、`./*`（icons 另有 `./lab`）改为 `solid` 条件指向 `.jsx`、`default` 指向 `.js`，并新增 `types` 条件指向 `.d.ts`。识别 `solid` 条件的工具（vite-plugin-solid、SolidStart）使用 `.jsx`，其他打包器取 dom 产物、只能客户端渲染；包体积约翻倍。
- `@fibrae/semi-ui-vue`、`@fibrae/semi-ai-vue` 的 `dist` 中，SFC 脚本产物由 `<名>.vue_vue_type_script_setup_true_lang.js` 改名为 `<名>.script.js`，文件名不再含 `.vue`；`exports` 不变，不应深层导入这些内部文件。
- `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react` 的 `dist` 中，除入口 `index.js` 与 `locale/source/` 以外的全部 `.js` 首行新增 `'use client'`（icons、illustrations 包不加）。Next App Router 与 React Router RSC 模式的 Server Component 可直接导入扁平组件；点语法的子组件（如 `Typography.Title`）仍只能在 `'use client'` 文件中使用；`semiGlobal` 与 Form 的 HOC、hooks 同样只能在 `'use client'` 文件中使用，RSC 应用在 `'use client'` 模块中设置 `semiGlobal`。
- `@fibrae/semi-vite-plugin` 丢弃来自 `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react` 的 `"use client"` 指令警告（`MODULE_LEVEL_DIRECTIVE`），并保留用户已有的 `build.rolldownOptions.onLog`。未使用该插件且未装 `@vitejs/plugin-react` 的 RSC 宿主构建会看到这些警告，可以忽略。
- 新增包 `@fibrae/semi-nuxt`：Nuxt 4 的模块，`modules: ['@fibrae/semi-nuxt']` 即把 `@fibrae/semi-vite-plugin` 注册进 Nuxt 的 Vite 构建，选项写在 `semi` 配置键下并原样传给插件（`prefixCls`、`cssLayer`、`omitCss`）。Nuxt 的服务端渲染与 dev 无需再配 `ssr.noExternal`；不做组件自动导入。peer 依赖 `nuxt >=4.6.2`。应用未设置 `features.inlineStyles` 时模块把它设为 `false`：Nuxt 默认内联 facade 为页面 `.vue` 的客户端 chunk 中的 CSS，只被单个页面导入、因而打进该页 chunk 的 Semi 组件样式会内联一份、同时仍链接一份，增量随页面独占的组件而定（实测常用组件页约 200KB）；关闭后样式只经 `<link>` 加载。代价是应用自己的 SFC 样式也不再内联；要保留内联，在 `nuxt.config.ts` 或 `.nuxtrc` 显式设置 `features.inlineStyles`（或旧键 `experimental.inlineSSRStyles`），模块不覆盖。
- `@fibrae/semi-ui-react`、`@fibrae/semi-ui-vue`、`@fibrae/semi-ui-solid` 的 `dist/locale/source/` 新增 57 个语言包的重导出（`<名>.js` 与 `.d.ts`，Solid 另有同内容的 `.jsx`），可经 `./*` 从 `@fibrae/semi-ui-<框架>/locale/source/<名>` 导入，内容是对 `@fibrae/semi-foundation/locale/source/<名>` 的一行重导出，导入内置语言包时应用无需直接安装 foundation。重导出不带 `'use client'`，语言包含 date-fns 的函数，RSC 应用须在 `'use client'` 模块中导入并传给 `ConfigProvider`、`LocaleProvider`。`Locale` 类型仍从 `@fibrae/semi-foundation/locale/interface` 导入（React 另可从 `@fibrae/semi-ui-react` 包根导入）；`@fibrae/semi-foundation/locale/source/<名>` 的路径不变。

## 语言包

- 破坏性：语言包与 `Locale` 类型移到 semi-foundation：语言包源文件在 `@fibrae/semi-foundation/locale/source/<code>`（`@fibrae/semi-ui-<框架>/locale/source/<code>` 由 UI 包重导出，仍可用），`@fibrae/semi-ui-react/locale/interface` 改为 `@fibrae/semi-foundation/locale/interface`；`LocaleProvider`、`LocaleConsumer` 仍从 `@fibrae/semi-ui-react` 导入。
- 破坏性（类型）：删除 `Image.loading`、`Image.loadError`、`DatePicker.day`、`Upload.illegalTips`、`Upload.cropOk`、`Upload.cropCancel`、`Table.sortedAscending`、`Table.sortedDescending`、`Table.sortedNone`、`Table.sortRoleDescription`、`Table.deselectRow`、`Table.deselectAllRows`、`Select.selected`、`Select.createItem`、`Tree.toggleCheck`、`Tree.expandItem`、`Tree.collapseItem`、`Avatar.clickable`、`Slider.disabled`；`Upload.cropTitle` 改为必填。
- 按 `Locale` 声明的自定义语言包需补齐新增键（如 `BackTop`、`Input`、`Notification`、`Sortable` 命名空间），类型会报出缺失项；原来写死英文的可访问名称改读语言包，默认 zh_CN 下为中文，按英文名称查询元素的测试需改为按语言包取值。
- 修正语言包数据：多个语言的 `currency` 改为合法 ISO 4217 码（`InputNumber currency` 显示随之变化），ur、my_MM、sw、ceb_PH、fil_PH 的 `dateFnsLocale` 改为 enUS、ga 改为 enIE，并修正部分日期格式与文案；zh_CN、zh_TW 的 `DatePicker.fullMonths` 改为「1月」到「12月」。

## 动画

- CSSAnimation 只响应元素自身的动画事件，子元素冒泡的不再结束父动画。Feedback 底部滑入、滑出的 keyframes 改名为 `semi-feedback-slideShow_bottom`、`semi-feedback-slideHide_bottom`。
- 根元素设置 `line-height: 1.4286`，依赖继承行高的组件不再随宿主变化；需要其他行高时在容器上覆盖。

## 主题

- 破坏性：删除主题包与编译期 Sass 覆写：`@fibrae/semi-theme-default` 删除（并入 `@fibrae/semi-foundation/theme/`），插件删除 `theme`、`variables`、`include` 选项，`semi-scss-compile` 删除 `themePath`（`-t`/`--theme`），`local.scss`、`custom.scss` 不再加载。定制只走 `--semi-*` CSS 变量与 `@layer semi` 之外的 CSS；`prefixCls`、`cssLayer`、`omitCss` 保留。
- 破坏性：Sass 变量不再是公开定制面，`!default` 删除；`semi-theme-shared` 删除 `resolveThemeDir`、`convertMapToString`。
- token 入口由 `semi-ui-react/_base/base.scss` 移到 `@fibrae/semi-foundation/base/tokens.scss`，任一组件入口自带 token；新增 `@fibrae/semi-ui-react/tokens`（Vue 包同名），在应用入口最先导入。
- 破坏性：删除 Web Component 构建工具链：semi-webpack、semi-rspack 删除 `webComponentPath`、`semiWebComponentLoader`、`semiCssModuleLoader`，`semi-theme-shared` 删除 `injectWebComponentStyles`、`cssToModule`。组件可在 open ShadowRoot 内使用（F13），样式由应用加入 ShadowRoot。
- 破坏性：删除 `$z-popover`、`$z-dropdown`、`$z-tooltip` 等变量与 `--semi-z-popover`、`--semi-z-dropdown`、`--semi-z-tooltip` 等 CSS 变量：弹层在 top layer，z-index 不起作用（D5）。
- base 层名由 `base` 改为 `semi-base`。与 Tailwind 同用时须先声明 `@layer theme, base, semi, components, utilities;` 并保持 `cssLayer` 为 `true`；新增 `@fibrae/semi-ui-react/tailwind.css`（Vue 包同名）映射 token，圆角工具类由 `rounded-semi-border-radius-*` 改为 `rounded-semi-*`。
- 破坏性：token 落点由 `body` 改为 `:root`（暗色为 `[theme-mode='dark']`），`theme-mode` 仍写在 `body` 上；`:root` 上的未分层覆盖现在对浅色生效。
- 破坏性：调色板 token 改为完整颜色（`--semi-blue-5: 0, 100, 250` 改为 `#0064fa`）；`rgba(var(--semi-x), a)` 须改为 `rgb(from var(--semi-x) r g b / a)`，不透明时直接写 `var(--semi-x)`。
- 改名：`--semi-transform-rotate-none` 改为 `--semi-transform_rotate-none`；重复声明的 `--semi-color-ai-background-top-hover`（激活态）改为 `--semi-color-ai-background-top-active`。暗色主题块设 `color-scheme: dark`。
- 新增 `--semi-spacing-*`、`--semi-font-size-*`、`--semi-line-height-*`、`--semi-font-weight-*`、`--semi-z-*` 等尺寸类 CSS 变量与 `--semi-shadow-knob`；字号、字重、字体栈等在 `:root` 覆盖即运行时生效，间距、控件高度、描边宽度的变量只影响 Tailwind 原子类。

## 组件

### ConfigProvider

- `getPopupContainer` 只作用于 Modal、SideSheet、ImagePreview。嵌套时内层只覆盖显式传入的属性，其余继承外层；`locale={null}` 清除继承的语言，不传 `locale` 时不再注入 zh_CN。
- 数字和 `GMT±HH:MM` 形式的 `timeZone` 按固定 UTC 偏移换算，不再映射为 IANA 时区，格式 token `z` 显示偏移；删除 `IANAOffsetMap` 导出，需要夏令时请传 IANA 名称。
- Vue：`ConfigConsumer` 使用默认作用域插槽，`useConfig()` 返回 `ComputedRef<ContextValue>`。
- Solid：`useConfig()` 返回 accessor；`ConfigConsumer` 的 children 只调用一次，参数是随配置更新的响应式对象，在 JSX 之外解构只得到初始值。

### LocaleProvider、LocaleConsumer

- 破坏性：LocaleProvider 不传 `locale` 时继承外层语言，不再重置为 zh_CN；最外层不传时 context 值为 `undefined`（Vue 为 `null`）。语言包缺少 `dateFnsLocale` 时回落 date-fns 默认的 enUS。
- 破坏性（类型）：LocaleConsumer 的 `componentName` 必填，只接受 `LocaleComponentName`，泛型参数改为组件名（`<LocaleConsumer<Locale['Chat']>>` 改为 `<'Chat'>`）。`useLocale` 不再接受 `'code'`、`'currency'`、`'dateFnsLocale'`，改读返回值的 `localeCode`、`currency`、`dateFnsLocale`。
- Vue：`LocaleConsumer` 使用默认作用域插槽，`useLocale(name)` 返回 computed。

### ResizeObserver（深路径导入 `@fibrae/semi-ui-react/resize-observer`）

- 破坏性（类型）：`children` 必填且为单个 `ReactElement`，`ReactResizeObserverProps` 不再接受 `className`、`style`。观察子元素下的第一个 DOM 节点，不再给子元素注入 `ref`。
- Solid：从 `@fibrae/semi-ui-solid/resize-observer` 深路径导入，组件名 `SolidResizeObserver`，Props 类型为 `SolidResizeObserverProps`；`children` 可为任意 JSX，观察其中第一个元素（跳过文本节点），换根节点时观察目标随之切换。

### Badge

- Vue：`count` 为 `number | string`（数字写 `:count="5"`），节点内容用 `#count` 插槽；属性与原生事件落在根元素，计数节点只接受 `countStyle`、`countClassName`。
- Solid：`style` 落在根元素（同 Vue），计数节点只接受 `countStyle`、`countClassName`。`dot` 时不读取 `count`，`count` 为节点时圆点也带 `type`、`theme` 类名（与 `dot` 加数字一致）。

### Banner

- 删除已废弃的 `target` 属性，传入时作为未声明属性落到根 DOM。
- Vue：`onClose` 改为 `close` 事件；没有 `showIcon`、`closable`，用 `#icon`、`#closeIcon`、`#title`、`#description` 插槽，`#icon`、`#closeIcon` 为空时不显示图标或关闭按钮。
- Solid：关闭按钮的点击不冒泡，祖先元素的原生监听也收不到（React 只拦住 React 处理函数）。

### Input、TextArea

- 破坏性：ref 改为 `InputHandle { focus, blur, select, setSelectionRange, input, nativeElement }` 与 `TextAreaHandle`（以 `textarea` 替代 `input`），原生节点读 `ref.current.input` 或 `ref.current.textarea`。
- `onEnterPress` 改在 `keydown` 触发，不再声明 `onKeyPress`，TextArea 删除从未生效的 `onPressEnter`。清除按钮改为原生 `button`，删除类名 `semi-input-clearbtn-hidden`；`readonly` 时不显示清除按钮。
- `onFocus`、`onBlur` 以整个组件为界，焦点在输入框与内部按钮、addon 之间移动不触发；`addonAfter` 里的 Button 获焦不再触发 `onBlur`，Form 的 blur 校验随之推迟。
- 破坏性（类型）：`onChange(value, e)` 的 `e` 改为 `InputChangeEvent`、`TextAreaChangeEvent`，读值用 `value`；`onClear` 参数为 `MouseEvent<HTMLButtonElement>`，`onFocus`、`onBlur` 为 `FocusEvent<HTMLDivElement>`；`InputState` 去掉 `isHovering`、`minLength`。
- TextArea 的 `autosize` 优先用 CSS `field-sizing: content`（行数换算为最小、最大高度，不写内联 `height`）；浏览器不支持时（Chrome 123 以前、Firefox 152 以前、Safari 26.2 以前）挂载后改由 JS 按内容高度写内联 `height`，值、宽度、字体加载变化时重算，行数范围仍由样式限定。TagInput 的输入框宽度同理，不支持时按文字宽度写内联 `width`。InputGroup 的 ref 指向 `role="group"` 的 span，`onFocus`、`onBlur` 由子元素焦点事件冒泡触发。
- 只读（`readonly`）Input 的原生输入框也显示默认光标，TimePicker `inputReadOnly` 的输入框显示指针光标。
- TextArea 字数超过 `maxCount` 时 textarea 带 `aria-invalid="true"`，回到范围内后取消。
- Vue：主值为 `modelValue`（`v-model`，支持 `.trim`、`.number`、`.lazy`）；`prefix`、`suffix`、`addonBefore`、`addonAfter`、`insetLabel`、`clearIcon` 改为同名插槽；`maxlength`、`minlength`、`autofocus` 用 HTML 拼写，不提供 `onlyBorder`；除 `class`、`style` 外的属性落到原生 input。
- Vue：InputGroup 的 `label.text`、`label.extra` 只接受 `string | number`，节点用 `#label`、`#labelExtra` 插槽；未声明属性下发给每个子节点。
- Vue：`v-model.trim`、`.number` 下，输入框中已键入的末尾空格或小数点在无关的重新渲染后仍然保留。
- Solid：Input、TextArea 的 `ref` 是根元素（Tooltip 等触发器以它为锚点），其 `focus()`、`blur()` 作用于原生输入框，Input 的 `focus()` 套用 `preventScroll` 属性；原生节点用 `inputRef`、`textareaRef` 取得，不提供 `InputHandle`、`TextAreaHandle`。`autofocus` 用小写；`onChange` 的 `e` 为原生事件（`InputChangeEvent`、`TextAreaChangeEvent`），`onFocus`、`onBlur` 为原生 `FocusEvent`。
- Solid：`prefix`、`suffix`、`insetLabel` 等节点型 prop 只在内容就是一个 Semi 图标组件时按图标处理，包在其他元素里的图标不算；在 prop 外预先创建的图标元素（如数据对象里的 `icon`）在客户端按根元素的 `semi-icon` 类判断。`semi-icons-solid` 新增导出 `IconSlotContext`，槽位经它向其中创建的图标下发尺寸与类名。服务端 HTML 带 input 的 `value` 属性与 textarea 的内容；包的类型为 Solid JSX 声明了 `attr:value`。InputGroup 经 context 向子控件下发 `size`、`disabled` 与其他未声明属性，优先级低于子控件自身的同名属性（React、Vue 中分组的值优先），`labelPosition` 不下发；TextArea 不读取 InputGroup 的 `size`、`disabled` 与下发属性。

### InputNumber

- 破坏性：ref 改为 `InputNumberHandle`（形状同 `InputHandle`）。`localeCode` 与 `currency={true}` 的货币优先级为「自身属性 > 全局 `overrideDefaultProps.InputNumber` > 语言包」。
- 挂载和 `value` 变化从不触发 `onChange`、`onNumberChange`，Form.InputNumber 不再在挂载时被标为 touched。
- `min`、`max` 之外的受控值与 `defaultValue` 按原样显示，只在用户输入、失焦、步进、清除时校正并通知一次。
- 值超过 `max` 时向上、低于 `min` 时向下的步进被拒绝，按钮不可用，按钮与方向键都不改值；朝范围内步进落回边界，离边界不足一个 `step` 时落在边界上。
- 破坏性（类型）：`onChange`、`onNumberChange` 的事件参数改为必填的 `InputNumberChangeEvent`，不再有 `null`；`onUpClick`、`onDownClick` 为 `PointerEvent<HTMLSpanElement>`，`onFocus`、`onBlur` 为 `FocusEvent<HTMLDivElement>`。
- 开启 `scientificNotation` 时失焦格式化不触发 `onChange`；货币模式下 `parser` 收到字符串。
- Vue：`v-model` 绑定 `modelValue`（`number | string`，清空为 `''`），不支持修饰符；回调改为事件 `change`、`numberChange`、`upClick`、`downClick`、`focus`、`blur`、`keydown`。
- Vue：`prefix`、`suffix`、`insetLabel`、`clearIcon`、`addonBefore`、`addonAfter` 改为同名插槽；`class`、`style` 落在外层 `.semi-input-number`，其余属性落在原生 input。
- Solid：`ref` 是 `.semi-input-number` 根元素，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；原生 input 用 `inputRef` 取得，不提供 `InputNumberHandle`。`onUpClick`、`onDownClick` 的 `e` 为原生 `PointerEvent`，长按连发期间沿用开始按下的那次事件；`onFocus`、`onBlur` 为原生 `FocusEvent`。

### DatePicker

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`，面板在 top layer。ref 改为 `DatePickerHandle { open, close, focus, blur }`，删除 `BaseDatePicker` 导出；受控 `open` 时 `open()`、`close()` 不改变可见性。
- 破坏性：删除 `onChangeWithDateFirst`，`onChange` 固定为 `(date, dateString)`；React 删除 `locale`、`localeCode`、`dateFnsLocale` 属性，改经 `LocaleProvider`、`ConfigProvider` 设置。
- 日历按 APG 支持键盘：每个月份网格一个 Tab 停靠点，方向键、PageUp、PageDown 移动日期，Enter、Space 选中，Esc 关闭面板。输入框为 `role="combobox"`，按 `textbox` 查询的测试需改为 combobox。
- 破坏性（类型）：`onClear` 为 `MouseEventHandler<HTMLButtonElement>`，`onClickOutSide` 参数为原生 `MouseEvent`，`onBlur` 改为面板关闭时触发的 `(e?: MouseEvent) => void`；`yearAndMonthOpts`、`timePickerOpts` 收窄；深路径 foundation 的 `RangeType` 改名 `RangeInput`，不再导出 `OnChangeType`。
- `multiple` 只对 `type="date"` 生效；支持 `type="year"`，选中值为该年 1 月 1 日。`onOpenChange` 只在由关到开时上报一次，`needConfirm` 时 Esc 关闭会调用 `onCancel`，键入无法解析的日期按 Enter 不再以今天提交。
- `month`、`monthRange` 的预设与回落值取当月 1 日 00:00，`disabledDate` 以每月 1 日 00:00 调用，`rangeStart`、`rangeEnd` 无值时为 `''`。`timeZone` 取值顺序为 prop、ConfigProvider、全局默认值。
- 范围类型（`dateRange`、`dateTimeRange`、`monthRange`）只提交两端都是有效日期的值：只选或只输入一端时不写入 `value`，不触发 `onChange`、`onConfirm`，确认按钮禁用，输入框保留已输入的文字；清空仍触发 `onChange([], [])`。
- React：首次渲染即由 `value`、`defaultValue` 算出选中值，服务端 HTML 的输入框带格式化后的日期（原来挂载后才填入）。
- React：面板的「今天」标记在服务端渲染与 hydration 期间不出现，hydration 后再标出，并在跨日时更新（原来在面板挂载时固定）。
- Vue：`v-model` 与 `v-model:open`；`triggerRender`、`renderDate`、`renderFullDate` 改为插槽 `#trigger`、`#date`、`#fullDate`；`topSlot`、`bottomSlot`、`leftSlot`、`rightSlot`、`prefix`、`insetLabel`、`clearIcon` 改为同名插槽，`rangeSeparatorNode` 改为 `#rangeSeparator`；`autoFocus` 改为 `autofocus`。
- Vue：声明的 `change`、`focus`、`blur` 遮住同名原生事件，`@blur` 只在面板关闭时触发；单选清空发 `undefined`，范围与多选清空发 `[]`。
- Vue：首次渲染（含服务端渲染）输入框就带选中日期的文字；日期面板的「今天」标记在挂载后才出现。
- Solid：`ref` 是 `.semi-datepicker` 根元素 `DatePickerElement`（带 `open()`、`close()`、`focus(rangeType?)`、`blur()`）；`autoFocus` 写作 `autofocus`，`onFocus` 收到原生 `FocusEvent`、`MouseEvent` 或 `KeyboardEvent`，`onBlur`、`onClickOutSide` 收到原生 `MouseEvent`；`style`、`inputStyle`、`dropdownStyle` 接受对象或字符串，类名写 `class`；不提供 `Form.DatePicker`。
- Solid：`triggerRender` 只调用一次，参数是随状态更新的活对象，字段要在返回的 JSX 中读取，`componentProps` 不含 `ref`；自定义触发器包在根元素内的 div 中，内容不含可聚焦元素时由该 div 带 `role="button"`、`tabindex` 与 `aria-haspopup`、`aria-expanded`、`aria-controls`。`renderDate`、`renderFullDate` 按日期格调用，日期或状态变化时重新调用。
- Solid：日期面板挂载后才标记今天（`semi-datepicker-day-today`），服务端 HTML 与 hydration 首帧不标记任何日期。

### Tooltip、Popover

- 破坏性：弹层改用 Popover API 进入 top layer，Portal 到触发元素所在根节点，不受祖先 `overflow`、`transform`、`z-index` 影响，也不在触发元素 DOM 内。位置按视口计算，`x-placement` 是自动翻转后的方位；放得下视口的弹层夹在视口内，触发器滚出或被裁出可见区域时弹层隐藏；打开期间随滚动、窗口 resize、触发器或弹层的尺寸变化重新定位，只随触发器所在区域的滚动重算，同一帧内的多个弹层一起重算；触发器只因别处布局变化而移动时也会跟随，但晚一帧。Tooltip、Popover、Dropdown 与 Select 的 ref 都提供 `rePosition()`（Popover 的 `PopoverHandle` 为新增），立即按触发器当前位置重新定位，一般无需调用。Tooltip 左右两侧边角方位（`leftTop`、`leftBottom`、`rightTop`、`rightBottom`）的箭头离弹层角 1px 更远，与 Popover 和上下方位一致，`arrowPointAtCenter` 时正对触发器中心。
- 新增：页面有固定顶栏时，在 `:root` 上设 CSS 变量 `--semi-tooltip-viewport-inset-top`（顶栏高度，可写 `calc()`、`var()`），所有基于 Tooltip 的弹层把视口顶部这一段当作不可用：翻转与夹取都避开它，触发器整个落在顶栏下方时弹层隐藏。top layer 不受 `z-index` 影响，顶栏无法靠层级盖住弹层。打开时读取一次，打开期间修改要到下次打开才生效。
- 破坏性：删除 Tooltip、Popover、Popconfirm 的 `getPopupContainer`、`zIndex`、`margin`、`rePosKey`，`numbers.DEFAULT_Z_INDEX`、`MARGIN`、`ARROW_BOUNDING`，以及 `arrowBounding`、`transformFromCenter`、`ArrowBounding`；新增 `TooltipHandle.hide()`。`onEscKeyDown`、`onClickOutSide` 的参数类型改为原生 `KeyboardEvent`、`MouseEvent`。
- 行为变化：`closeOnEsc` 默认 `true`（Modal 内的提示先按 Esc 只关提示，旧行为传 `closeOnEsc={false}`）；Popover 的 `disableFocusListener` 默认改为 `false`；新增 `afterOpen`（Vue `afterOpen` 事件，进场动画结束后调用）与 `onOpen`（Vue `open` 事件，弹层显示时调用，早于 `afterOpen`），Popover、Popconfirm、Dropdown 一并转发；受控 `visible` 只报告请求，触发器操作只报告 `onVisibleChange(true)`、关闭类操作只报告 `(false)`，React 在 `visible={false}` 时须在回调中回写才会打开。
- 行为变化：进出场改为 keyframes 动画（`semi-tooltip-zoom-in`、`semi-tooltip-zoom-out`），Popover、Dropdown 同样适用；关闭时弹层在出场动画期间仍为 `:popover-open`，动画结束才隐藏，出场中重新打开从头播放进场。覆盖过弹层 `transition` 的自定义样式改为覆盖 `animation`。
- 行为变化：React 中触发元素卸载后仍显示的弹层，在外部按下时照常通知 `onClickOutSide` 并按触发方式关闭，与 Vue 一致。
- Vue：内容用 `#content="{ initialFocusRef }"`，触发器用默认插槽，可见性用 `visible`、`update:visible`、`visibleChange`；`class`、`style` 落在弹层，其他未声明属性丢弃；可访问名称键为 `ariaLabel`、`ariaLabelledby`，另有 `ariaDescribedby`（React 无）。
- Solid：触发器写成函数 children `(getTriggerProps) => JSX`，把 `getTriggerProps(own)` 的结果展开到触发元素上；要与注入值合并的 `ref`、`tabIndex`、`aria-*`、`data-popupid` 作为 `own` 传入，写在展开之后会整体覆盖。退出描述写 `getTriggerProps({ 'aria-describedby': null })`，后代经 `useTooltipDescription()` 取弹层 id。
- Solid：非函数 children 一律包进 Tooltip 自己的 span，Button、Input、链接这类可聚焦触发器要用函数形式；禁用、加载中的特殊触发器只识别 Semi Button、IconButton、Input、TextArea、InputNumber、PinCode、Switch、Checkbox、Radio、Rating、Slider、Select、TreeSelect、Cascader、AutoComplete、TimePicker、DatePicker、Upload、Pagination、Transfer，不识别原生 `<button disabled>`。`role="dialog"` 时按渲染出的元素（`own.role`、`role` 属性、button、带 href 的 a）决定是否输出 `aria-haspopup`、`aria-expanded`、`aria-controls`。
- Solid：弹层位于 挂载点 > div > [popover]，`body > .semi-tooltip-wrapper` 这类选择器不再匹配；弹层内的组件用 `preventDefault` 认领 Escape，`stopPropagation` 无效。
- Solid：在触发器或内容中渲染的 Tooltip 类弹层里按下鼠标不算点击外部，其他组件在触发器中渲染的 Portal 里按下仍算外部；指针或焦点移入内容中渲染的弹层不算离开外层，移入触发器上渲染的弹层（如外包 Tooltip 的 Dropdown 菜单）算离开（同 React）；指针从触发元素直接移入本弹层不触发离开，`mouseLeaveDelay` 为 0 时也不关闭（React 会关闭）。
- Solid：Popover 未传 `arrowStyle` 时，箭头颜色读对象 `style` 的 `background-color`、`border-color`，字符串 `style` 不参与；`ref` 在组件创建时交出 `PopoverHandle`。
- Solid：函数形式的 `content` 像 JSX 的函数子节点一样在跟踪作用域中调用：函数体内读取的 signal 变化时整体重建内容，在返回的 JSX 中读取的 signal 原地更新；`content={<For each={...}>...</For>}` 这类 JSX 在弹层打开期间随数据更新。
- Solid：`ref` 在组件创建时交出 `TooltipHandle`，`initialFocusRef` 是 ref 回调，箭头颜色只读对象 `style` 的 `background-color`；`mouseLeaveDelay` 到时关闭时 `onVisibleChange(false)` 晚于弹层隐藏，卸载时补发的 `afterClose` 同步调用；`motion={false}` 时也在隐藏后的微任务中移除弹层并调用 `afterClose`（React 在同一次提交中调用），使它晚于 foundation 定时器触发的 `onVisibleChange(false)`。

### Modal、SideSheet

- 破坏性：`Modal.info`、`success`、`error`、`warning`、`confirm`、`useModal`、`destroyAll` 改由 `modal/index` 挂载，深导入 `modal/modal` 的组件不再带这些静态方法；`cancelButtonProps.onClick`、`okButtonProps.onClick` 不再替换内置处理，先于 `onCancel`、`onOk` 调用，需替换的改在这两个回调里处理。
- 破坏性（类型）：`onCancel` 参数为 `React.MouseEvent | KeyboardEvent`（Esc 传原生事件）；Modal 的 `direction` 收窄为 `'ltr' | 'rtl'`，删除深路径导出的 `ConfirmType`、`Directions`；`Modal.useModal` 返回 `[ModalHookApi, ReactElement]`；`SideSheetState` 删除 `displayNone`；深路径 `side-sheet/index` 导出的 `SideSheetContentProps` 以 `sheetSize` 代替 `width`、`height`。
- 行为变化：Modal 的 `footer={undefined}`、`header={undefined}` 与不传相同，隐藏传 `null`；SideSheet 隐藏关闭按钮用 `closable={false}`；Modal 新增 `role?: 'dialog' | 'alertdialog'`（确认框默认 `alertdialog`），组件版不再默认设 `aria-describedby`；模态判断统一为 Modal `mask && (容器在 body 内 || maskFixed)`、SideSheet `mask && 容器在 body 内`，`mask={false}` 时不再锁 body 滚动、不拦截页面点击，非模态不再把 Tab 锁在层内。
- Vue：Modal 用 `v-model:visible`，仅取消路径更新，确定按钮只调 `onOk`；`title`、`header`、`footer`、`icon`、`closeIcon`、`modalRender` 改为 `#title`、`#header`、`#footer`、`#icon`、`#closeIcon`、`#modal="{ modal }"`；`useModal` 返回 `[api, Holder]` 并须渲染 `<Holder />`，静态方法读应用上下文时先 `app.use(Modal)`。SideSheet 的 `title`、`footer`、`closeIcon` 改同名插槽，`onCancel` 改 `cancel` 事件，`afterVisibleChange` 改同名事件，新增 `update:visible`，无 `defaultVisible`。
- Solid：`title`、`header`、`footer`、`icon`、`closeIcon`、`content` 为 `JSX.Element`，`style`、`bodyStyle`、`maskStyle`、`headerStyle` 接受对象或字符串；`onCancel` 收到原生 `MouseEvent | KeyboardEvent`，`onOk`、`onCancel` 的返回值只在是 Promise 时等待，`() => setVisible(false)` 可直接写；`okButtonProps`、`cancelButtonProps` 用 `autoFocus` 指定初始聚焦（不落到 DOM）。`Modal.useModal()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，挂载前调用 api 也立即生效；静态方法只读全局默认值与默认语言包，`direction` 需自行传入。`getPopupContainer` 在组件挂载后才调用；页面取消动画（`animation: none`）时离场立即结束并卸载；SideSheet 显示中卸载时同步调用 `afterVisibleChange(false)`。传 `header` 时不读取 `title`、`icon`。

### Table

- 破坏性：表格语义改为 `role="table"`、`role="cell"`，删除 `aria-colcount`、`aria-colindex` 等；默认筛选图标、排序按钮（`.semi-table-column-sorter-wrapper`）、展开按钮（`.semi-table-expand-icon`）改为原生 `button`，排序方向改用表头 `aria-sort`；依赖旧角色、属性或 DOM 的选择器需调整。
- 破坏性：列宽拖动不再依赖 react-resizable，手柄类名 `.react-resizable-handle` 改为 `.semi-table-resize-handle`，宽度不小于 20px，`resizable` 只对 `columns` 写法生效；固定列阴影改用 `scroll-state` 容器查询，删除 `semi-table-scroll-position-*` 类名；`Table.Column` 的静态 `elementType` 改为 `'Table.Column'`；未声明的 `rowSpan` 不再影响表头行合并，改用 `onHeaderCell` 返回 `rowSpan`；`getVirtualizedListRef` 的 `ref.current` 只有 `scrollTo(offset)`、`scrollToItem(index, align)`；`virtualized` 只读取 `itemSize`、`onScroll`、`overscanCount`，`virtualized.onScroll` 只在纵向偏移变化时调用。
- 破坏性（类型）：`ColumnProps`、`onCell`、`onHeaderCell`、`onRow`、`onGroupedRow` 的返回对象等删除 `[x: string]: any`，自定义字段改用交叉类型；`Data` 只剩 `key?`，回调参数需标注行类型；`ChangeInfoSorter` 只剩 `dataIndex`、`sortOrder`、`sorter`；`getCurrentPageData()` 的 `groups` 改为 `Map<string | number, Set<string | number>>`；`OnGroupedRow` 首参改为 `{ groupKey, records }`；`onHeaderCell`、`resizable.onResize*` 首参改为 `ColumnProps`；删除 `RowSelectionProps.title`、`TableComponents.footer`。
- 行为变化：`rowSelection.onSelectAll` 只作用于当前筛选结果中的非禁用行，`changedRows` 只含状态变化的行；`TableProps` 声明 `onRowMouseEnter`、`onRowMouseLeave`、`onRowDoubleClick`、`onRowContextMenu`（后两者原来不生效）；只设 `filterDropdown` 或 `renderFilterDropdown` 的列也渲染筛选入口；开启 `rowSelection.clickRow` 时，点击展开行或分组行不选中行；选择列、展开列不在最前时，树形缩进与展开按钮仍落在第一个数据列。
- `virtualized.itemSize` 为 `null`，或函数返回 `null`、`undefined` 时，按 `size` 预设的默认行高排布，不再告警。
- 样式：表头背景在 `bg-1` 上叠加 `fill-0`（新增 `$color-table_th-fill-default`），固定表头时为对齐表体滚动条而预留的表头滚动条改为透明，该区域同样铺满灰底，可排序表头悬浮改为 `fill-1`；表头垂直内边距 `$spacing-table_row_head-paddingY` 由 8px 改为 12px，分割线 `$width-table_header_border` 由 2px 改为 1px；固定列的边线只在有内容滚到其下方时显示，阴影由单元格上的 3px 实色 `box-shadow` 改为通高的渐变伪元素（宽 `$width-table_fixed_shadow`，颜色由 `--semi-table-fixed-shadow` 决定，暗色模式取 `$color-table_shadow-bg-dark`），删除 `$shadow-table_left`、`$shadow-table_right`；`bordered` 的右侧外框改由容器的 `border-inline-end` 绘制，位于滚动条外侧，延伸到表格末端的单元格带 `semi-table-cell-last` 并去掉自身右边框，不再出现两条边线；虚拟化表格的固定列也显示阴影；分组行展开收起时不再闪现纵向滚动条。
- React：`resizable` 在服务端渲染与 hydration 期间输出普通表格，hydration 后再加载列宽拖动。
- 受控 `filterDropdownVisible` 时点击筛选图标只调用 `onFilterDropdownVisibleChange(true)` 请求，使用方回写后才打开（React）；非受控的自定义筛选面板与 `filterConfirmMode="confirm"` 菜单，`onFilterDropdownVisibleChange(true)` 在弹层显示后调用，回调里可聚焦面板内元素。
- Vue：单元格内容用 `#cell` 作用域插槽（表级或 `Table.Column`，代替 `render`），表头用 `#headerCell` 或 `#title`；表级 `title`、`footer` 只接字符串，节点用 `#title`、`#footer`、`#empty`、`#expandedRow`、`#groupSection`、`#pagination`、`#selectionCell`、`#expandIcon`、`#sortIcon`、`#filterIcon`、`#filterDropdown`、`#filterDropdownItem`；合并单元格改由 `onCell` 返回 `colSpan`、`rowSpan`。事件为 `change`、`expand`、`expandedRowsChange`、`rowMouseEnter`、`rowMouseLeave`、`rowDoubleClick`、`rowContextMenu`、`scroll`，支持 `v-model:expandedRowKeys`；`onRow` 等返回对象用 Vue 命名（`class`、`onMouseenter`）。
- Vue：`virtualized` 的表体在每一列都有数值 `width` 时，首次渲染（含服务端渲染）就带行，选择列与展开列取默认宽度；有列没有数值 `width` 时，挂载并量出列宽后才渲染表体。
- Solid 破坏性：列配置只放数据（同 Vue）。`render` 只返回单元格内容，不再接受 `{ children, props }`，单元格属性与 `colSpan`、`rowSpan` 改用 `onCell` 返回，删除 `RenderReturnObject`、`ColumnRenderReturnType` 导出；列 `title` 收窄为 `string | ((props: ColumnTitleProps) => JSX.Element)`，带标记的标题写成函数；`filterDropdown` 改为 `() => JSX.Element`；`filterIcon` 只接受 `(filtered: boolean) => JSX.Element`；`filters[].text` 与 `renderFilterDropdownItem` 参数的 `text` 收窄为 `string`，带标记的筛选项用 `renderFilterDropdownItem`。
- Solid：`Table.Column` 是只携带列配置的 token，不渲染自身；`ref` 拿到根元素 `TableElement`，其上的 `getCurrentPageData()` 在调用时读取当前状态；`getVirtualizedListRef` 直接收到列表句柄（`scrollTo(offset)`、`scrollToItem(index, align)`），没有 `.current`，在虚拟列表创建时（表头量完列宽之后）调用一次。`onCell`、`onHeaderCell`、`onRow`、`onHeaderRow` 的返回对象用 Solid 命名（`class`、`onDblClick`）；合并单元格只由 `onCell` 返回 `colSpan`、`rowSpan`（同 Vue），为 0 时跳过该单元格且不调用 `render`。不提供 `shouldCellUpdate`，单元格只随自身读取的数据更新；`resizable` 静态导入，没有先渲染普通表格的加载阶段。
- Solid：列的 `render`、`onCell`、`onHeaderCell`、`onRow`、`expandedRowRender` 只在记录、下标或列变化时重新调用（悬停、选中、展开不触发）；函数形式的列 `title` 在跟踪作用域中调用（同 Tooltip 的 `content`），返回 `<Show>` 这类 JSX 时随数据更新。`render` 的第四个参数、`rowSelection.renderCell`、`renderFilterDropdown`、`sortIcon` 与 `useFullRender` 时函数 `title` 的参数是活对象，字段要在返回的 JSX 中读取；破坏性（类型）：其中 `expandIcon`、`selection`、`indentText`、`originNode`、`sorter`、`filter` 是渲染函数 `() => JSX.Element`，在插入处调用，每次调用新建一个节点，没调用的不创建；`sorter`、`filter` 在列没有排序、筛选时不存在，`title` 里用 `parts.sorter?.()`。函数形式的 `expandIcon` 在展开状态变化时替换节点，旋转过渡不播放。

### Checkbox、Switch

- 破坏性（样式钩子）：删除 `semi-switch-focus`（及 `cssClasses.FOCUS`）、`semi-checkbox-focus`、`semi-checkbox-focus-border`，焦点环改由 CSS `:has(input:focus-visible)` 绘制；`SwitchState.nativeControlChecked` 改名 `checked`；Switch 的 `checked` 与 `defaultChecked` 同传时取 `checked`。
- 行为变化：Checkbox、Radio 的 `id` 落在原生 input 上（用 `#id` 选根元素的写法需改选 input 的父级），input 带 `value`；Checkbox 不再响应 Enter 切换（仅空格）；`onClick` 在切换前调用；Switch 的 `loading` 期间切换被忽略且不通知 `onChange`；Switch 的全部 `aria-*` 落在 `role="switch"` 的 input 上，不再有任何 `aria-*` 落在根元素。
- CheckboxGroup 内没有 `value` 的 Checkbox 不参与分组取值，也不再继承分组的 `aria-invalid`、`aria-errormessage`。
- Vue：Switch 的 `checked` 改为 `modelValue`，通过 `update:modelValue` 与 `change(checked, event)` 通知；`checkedText`、`uncheckedText` 改为具名插槽。
- Solid：Checkbox 的 `ref` 是根元素，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；`autofocus`、`onFocus`、`onBlur` 落在原生 input 上；`onChange` 事件的 `target` 为 `{ checked, value, name, disabled }`，`nativeEvent` 为点击事件；CheckboxGroup 的 `onBlur` 在焦点离开整个分组时触发，`options` 项的类名字段为 `class`。
- Solid：Switch 的 `ref` 是根元素，其 `focus()`、`blur()` 作用于原生 input。

### RadioGroup、CheckboxGroup

- 破坏性：Radio `mode="advanced"` 的 input 由 `type="checkbox"` 改回 `type="radio"`，按 `checkbox` 查询的测试需改为 `radio`；`onChange` 事件的 `target` 为 Radio 自身 props 加 `name`、`disabled`、`value`、`checked`，不再带 `focusInner`、`isButtonRadio` 等内部键；删除 `semi-radio-focus`、`semi-radio-focus-border` 等焦点与悬停类名，改用 CSS `:focus-visible`、`:hover`。
- 破坏性（类型）：CheckboxGroup 的 `options` 收窄为 `Array<string | CheckboxOptionItem>`，`value`、`defaultValue`、`onChange` 参数收窄为 `Array<string | number | boolean>`，新增 `CheckboxOptionItem`；`RadioInnerProps` 不再含 `style`、`className`、`children`、`preventScroll`，新增 `id`、`value`。未传 `name` 时每组生成唯一 name，RadioGroup 内没有 `value` 的 Radio 在组值为 `undefined` 时不再判为选中。
- 行为变化：Radio 的 `checked` 与 `defaultChecked` 同传时取 `checked`，`checked={false}` 时内部状态不再被 `defaultChecked` 置为选中。
- Vue：Checkbox、Radio 的 `modelValue` 对应 `checked`，分组的 `modelValue` 对应 `value`，`change` 的 `target` 为 `{ checked, value, name, disabled }`；`extra` 为具名插槽；分组 `options` 项字段为 `label`、`extra`、`value`、`disabled`、`class`、`style`，无 `onChange`，自定义内容用 `#label`、`#extra`（参数 `{ option, index }`）。
- Solid：Radio 的 `ref` 是根 label，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；`autofocus`、`onFocus`、`onBlur` 落在原生 input 上；`onChange` 事件的 `target` 不含 `children`、`extra`；RadioGroup 的 `onBlur` 在焦点离开整个分组时触发，文本子节点被丢弃；`aria-invalid`、`aria-errormessage`、`aria-required` 不落在 `role="radio"` 的 input 上。
- Solid 破坏性（类型）：RadioGroup `options` 项的 `label`、`extra` 收窄为 `string | number`（同 Vue），其他内容由 RadioGroup 新增的 `renderLabel(option, index)`、`renderExtra(option, index)` 提供（对应 Vue 的 `#label`、`#extra`），按钮型不调用 `renderExtra`；AIChatInput 的 `Configure.RadioButton` 同样适用。

### Steps

- 破坏性：Steps 把每个有效子元素按顺序当作一个步骤位置（Fragment 展开后编号，文本不占位），fill 列宽与 nav 的 `total` 按它计数，原生元素只占序号、不注入步骤属性；`StepProps`、`BasicStepProps`、`FillStepProps`、`NavStepProps` 不再含 `children`（类型）。可点击（设了 `onChange` 或 `onClick`）的 Step 带 `role="button"`。
- Vue：`onChange` 与 `onUpdate:current` 都是函数属性，支持 `v-model:current`，传入任一个时所有 Step 可点击，不支持 `@change.once`；Step 的 `title`、`description`、`icon` 改为插槽，不再有 `elementType`，包装 Step 的组件无需透传属性。
- Solid：只有 `Steps.Step`（包括只渲染 Step 的包装组件）占步骤位置，原生元素与文本不占序号、不计入 fill 列宽与 nav 的 `total`，被丢弃并在开发期告警；放在 Steps 外的 Step 单独写时不渲染，在数组中显示为 "[object Object]"。

### Pagination

- 破坏性：DOM 改为 `ul > li > button`：上一页、下一页、页码、「…」是 `li` 内的原生 `button`，类名（`semi-page-item`、`semi-page-prev` 等）从 `li` 移到 button，总数、每页条数、快速跳转改为 `li`，small 模式根元素改为 `ul`，`PaginationProps.ref` 收窄为 `Ref<HTMLUListElement>`；按旧结构写的选择器需调整。删除 `popoverZIndex`。
- 行为变化：`prevText`、`nextText` 只有文字时以可见文字命名按钮；快速跳转的小数页码向下取整；`size="small"` 时 `showSizeChanger` 不生效；`total` 或 `currentPage` 变化不再重置用户选的页大小，`onPageSizeChange` 回写相同 `pageSize` 不再回到第 1 页。
- Vue：用 `v-model:currentPage`、`v-model:pageSize`，`onPageChange`、`onPageSizeChange`、`onChange` 改为 `pageChange`、`pageSizeChange`、`change` 事件；`prevText`、`nextText` 改为同名插槽；`class`、`style`、`aria-*` 落在根 `ul`。
- Solid：`prevText`、`nextText` 为 `JSX.Element`；`class`、`style`、`ref`（回调，指向根 `ul`）与其余原生属性落在根 `ul`。

### Notification

- 破坏性：默认导出 `Notification` 由组件改为普通对象，只承载静态方法与 `useNotification`，删除未文档化的 `<Notification />` 树内渲染（改用 `useNotification` 的 `contextHolder`）；删除 `NotificationListHandle`、`NoticeProps.onHookClose`、`NoticeState.visible`；`ConfigProps` 删除 `direction`，`NoticeInstance` 删除 `motion`；选项类型不再含 `close`、`ref`、`onAnimationEnd`、`onAnimationStart`。
- 新增 `Notification.resetConfig()` 与 `stack?: boolean | number`（`true` 为 3，同位置通知超过阈值时堆叠，悬停展开）及类型 `NotificationHookOptions`；悬停或键盘聚焦列表时全部通知暂停自动关闭；`useNotification` 的通知有进场、离场动画，并读取 `overrideDefaultProps.Notification`；`.semi-notification-notice` 上方 margin 改由 `.semi-notification-list` 的 `padding-block-start` 提供，覆盖过上方 margin 的需改覆盖列表 padding。
- 样式：堆叠中的 `.semi-notification-notice-stack-item` 改为单行 grid，展开收起由 `grid-template-rows` 过渡，覆盖其 `height` 的样式不再生效；不支持 `interpolate-size` 的浏览器在进出场动画期间给通知写内联 `height`。
- Vue：静态方法与 React 同名同参，可选 `app.use(Notification)` 让静态通知读到应用上下文（`direction` 仍需在选项里传）；`useNotification()` 返回 `[api, Holder]` 并须渲染 `<Holder />`；`title`、`content`、`icon` 为 `NotificationNode`，选项 `className` 改 `class`、`style` 为 `StyleValue`，不提供 `motion`。
- Solid：`title`、`content`、`icon` 为 `NotificationNode`（节点或返回节点的函数），在事件处理函数里调用 hook 方法时写成函数才能读到 `contextHolder` 处的 context；`useNotification()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，只放置一次；选项的 `dir`、`data-*`、`aria-*` 落在通知元素上，`ref` 拿到通知元素，不提供 `NoticeHandle`；静态方法只读全局默认值与默认语言包。

### FloatButton、FloatButtonGroup

- 每一项渲染为原生 `<button type="button">`，有 `href` 时为 `<a>`（新增 `rel`），`ref` 类型为 `React.Ref<HTMLButtonElement | HTMLAnchorElement>`，`href` 不再经 `window.open` 跳转；纯图标按钮与子项需传 `aria-label`；FloatButtonGroup 的 `disabled` 真正禁用每一项，子项的 `href`、`disabled`、`onClick`、`shape`、`size`、`colorful` 生效。
- 破坏性（类型）：`FloatButtonProps`、`FloatButtonGroupProps` 不再接受 `children`；`FloatButtonProps` 不再含 `type` 与 `form*` 属性。Vue：`onClick` 改为 `click` 事件（FloatButton 载荷 `(event)`，Group 为 `(value, event)`），`icon` 为 `#icon` 插槽，节点型 `badge.count` 用 `#badgeCount`；Group 的 `items` 中 `className` 改 `class`，`icon`、`content`、`badge.count` 改为作用域插槽 `#icon`、`#content`、`#badgeCount`（参数 `{ item, index }`），不支持 item 的 `ref`。

### MarkdownRender

- `format="md"` 改用 unified 管线，不在运行时执行代码，可在禁用 `unsafe-eval` 的 CSP 下使用，`@mdx-js/mdx` 只在 `format="mdx"` 时加载；md 下 `components.wrapper` 不再生效；`remarkPlugins`、`rehypePlugins` 按元素比较，`[插件, 配置对象]` 需用 `useMemo` 保持引用稳定。
- 破坏性（类型）：`components` 改为 `MarkdownRenderComponents`，值必须是 React 组件或 HTML 标签名，元素键只接受组件或自身标签名，Chat、AIChatDialogue 传入的 components 同样受约束。默认 `table` 保留 GFM 列对齐且不再分页（需要时经 `components.table` 传 `pagination`）；`defaultComponents` 新增 `pre`，无语言的代码由 `span` 改为 `code` 元素。
- 有语言的代码块被 rehype 插件拆成元素（不交给 CodeHighlight）时保留外层 `pre`，原来会去掉 `pre`，空白折叠，依赖 `pre code` 的高亮样式不生效。
- React：`format="md"` 在首次渲染同步编译，服务端 HTML 与首个提交即有内容；`mdx`、依赖异步插件的来源仍在挂载后编译。
- Vue：`format="md"` 在首次渲染（含服务端渲染）就带编译好的内容，用到异步插件的 md 与 `mdx` 仍在挂载后编译，服务端 HTML 中根节点为空。
- Vue：`components` 的值是 Vue 组件或标签名，覆盖组件从 attrs 读 `class`、`colspan` 等 HTML 属性名而非 `className`；MDX 手写 JSX 的监听器按 Vue 命名（`onMouseenter`、`onKeydown`、`onDblclick`）；无默认插槽与事件；替换 `code` 组件时用 `@fibrae/semi-ui-vue/markdown-render/index` 导出的 `codeText` 取源码。
- Solid：`format="md"` 在首次渲染（含服务端渲染）同步编译，服务端 HTML 即有正文（含 GFM 表格）；`mdx` 与依赖异步插件的 md 仍在挂载后编译。
- Solid：`components` 的值是 Solid 组件或标签名，覆盖组件收到 `class`（MDX 中手写的 `className` 并入 `class`）与 kebab-case 的 `style` 对象，MDX 手写 JSX 的属性与监听器按 Solid 命名（`class`、`onClick`）；`code` 只在 `props.children` 为源码字符串时高亮，替换 `code` 时同样从 `props.children` 取源码；`ref` 回调拿到根 div；重新编译或 `components` 变化后，与上次相同的顶层块保留 DOM，其余块重建（React 按元素对比）；`components.wrapper` 整体是一个块，每次编译都重建。

### Toast

- 与 Notification 相同的变化：新增 `Toast.resetConfig()`，悬停或聚焦时暂停全部 Toast 自动关闭，每次调用都应用 `zIndex`。`stack` 类型改为 `boolean | number`，`true` 为 3，收起时只显示最前 3 层。
- 破坏性：`Toast.defaultOpts`（及 `ToastFactory.create()` 返回实例上的同名属性）改为只读，整体赋值会抛错，修改默认值用 `config()`、`resetConfig()`。
- 破坏性（类型）：`useToast` 返回元组 `[toast, contextHolder]`，方法参数不含 `type`、`id`，`content`、`icon` 只接受 ReactNode；静态方法与 `useToast` 选项类型不含 `close`，`useToast` 另不含 `zIndex`、`getPopupContainer`；`getPopupContainer` 改为 `() => HTMLElement`；删除 `ToastListHandle`，新增 `ToastHookApi`。
- 行为变化：`useToast` 支持 `stack`，先来的在前，`contextHolder` 输出固定定位的 `.semi-toast-wrapper`；滑动统一由 `.semi-toast-content` 承担，`semi-toast-keyframe-toast-show` 不再含位移，覆盖动画样式的使用方注意选择器变化。
- 样式：堆叠中的 `.semi-toast-zero-height-wrapper` 改为单行 grid，展开收起由 `grid-template-rows` 过渡，覆盖其 `height` 的样式不再生效；不支持 `interpolate-size` 的浏览器在离场动画期间给 Toast 写内联 `height`。
- Vue：静态方法与 React 同名同参，可选 `app.use(Toast)`；`useToast()` 返回 `[api, Holder]` 并须渲染 `<Holder />`，读取 `overrideDefaultProps.Toast`，`ToastHookOptions` 不含 `top`、`bottom`、`left`、`right`、`zIndex`、`getPopupContainer`；`content`、`icon` 为 `ToastNode`，选项 `className` 改 `class`、`style` 为 `StyleValue`。
- Solid：`content`、`icon` 为 `ToastNode`（节点或返回节点的函数），在事件处理函数里调用 hook 方法时写成函数才能读到 `contextHolder` 处的 context；`useToast()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，只放置一次；选项的 `dir`、`data-*`、`aria-*` 落在 Toast 元素上，`ref` 拿到 Toast 元素，不提供 `ToastHandle`；静态方法只读全局默认值与默认语言包。

### ColorPicker

- 破坏性：`usePopover` 时弹层默认 trigger 由 `hover` 改为 `click`（`popoverProps.trigger` 优先）。`alpha` 默认为 true；受控 `value` 为 `null` 是受控的空值，变回 `undefined` 时回到 `defaultValue`。
- 破坏性（类型）：`@fibrae/semi-ui-react/color-picker` 只导出 `ColorValue`、`ColorFormat`、`HsvaColor`、`RgbaColor`，不再导出 `ColorModel`、`AnyColor`、`ObjectColor` 等；`ColorPickerFoundation` 的静态转换方法删除，改从 `@fibrae/semi-foundation/color-picker/utils/convert` 导入。
- `ColorPicker.colorStringToValue` 支持 `#rgb`、`#rgba`，无法解析或越界的颜色字符串抛出以 `Semi ColorPicker` 开头的错误（原来得到 NaN、黑色或非法 hex）。选色区与两条滑条可用键盘操作。
- Vue：`modelValue` 配 `update:modelValue`（`v-model`），`onChange` 改为 `change` 事件，类型不含 `null`；`className` 改 `class`；`topSlot`、`bottomSlot`、`children` 改为 `#topSlot`、`#bottomSlot` 与默认插槽（`usePopover` 时的触发器）；`popoverProps` 的对话框名称用 `ariaLabel`、`ariaLabelledby`。
- Solid：`className` 改 `class`；`popoverProps` 为 Solid Popover 的 props（对话框名称用 `'aria-label'`、`'aria-labelledby'`）；`usePopover` 的触发器写法同 Popover，自定义的可聚焦元素要带上弹层状态时写成函数 children `(getTriggerProps) => JSX`，非函数 children 包进 Tooltip 的 span；`ref` 回调拿到取色器 div（`usePopover` 时弹层打开后才回调），不提供命令式 handle；`style` 接受对象或字符串。

### Calendar

- 破坏性（类型）：`onClose` 参数改为 `React.MouseEvent | KeyboardEvent | null`（点击外部关闭为 `null`）；`CalendarProps` 不再包含 `children`；`DayColProps.events` 收紧为 `DailyEventLayout[]`。
- 各视图改为 ARIA 表格（ul、li 改 div，类名不变），月视图「N 更多」改为原生 `button`，展开卡片是对话框，依赖旧 DOM 结构或 role 的测试与选择器需调整。日期格与时间槽的点击回调仍只能由指针触发（已知限制）。
- React：各视图的「今天」标记与当前时间线在服务端渲染与 hydration 期间不出现，hydration 后再标出。
- Vue：render 属性改为作用域插槽 `#timeDisplay`、`#dateDisplay`、`#dateGrid`、`#allDayEvents`（收到全部 events）、`#header`，事件内容用 `#event="{ event }"`，`events[].children` 只放 `string | number`；`onClick`、`onClose`、`onMoreClick` 改为 `click(e, date)`、`close(e)`、`moreClick(e, date, remaining)`。
- Solid：`events[].children` 可以是节点或返回节点的函数；节点只在第一处显示原节点，跨周、跨天的片段与月视图卡片里显示不带事件处理函数的副本，需要交互时传函数。
- Solid：「今天」的标记（`semi-calendar-today` 与 `aria-current="date"`）挂载后才出现，服务端 HTML 不含；其余日期不再输出 `aria-current="false"`。月视图首帧显示全部事件，测量后才折叠为「N 更多」。

### Navigation

- 破坏性：删除 `getPopupContainer`（改用 `subDropdownProps` 或 Sub 的 `dropdownProps`）与 `Navigation`、`Navigation.Header` 的 `prefixCls`，类名前缀固定为 `semi-navigation`；公开的 `Nav.Item` 不再渲染 children；`toggleIconPosition` 收窄为 `'left' | 'right'`；删除 `NavState`（改用 foundation 的 `NavigationState`）。
- 破坏性：根元素由 `div` 改为 `<nav>`，`ref` 类型改为 `Ref<HTMLElement>`；导航项不再是 `menuitem`，内部渲染原生 `button` 或 `<a href>`，按 `menuitem` 查询的测试改为 `link` 或 `button`。`onSelect`、`onClick` 的 `domEvent` 由 React 合成事件改为原生事件，读 `domEvent.nativeEvent` 的代码直接用 `domEvent`。
- 破坏性（React）：Fragment 里的 Item、Sub 作为导航项渲染，不再套 `li.semi-navigation-list-extra`；`renderWrapper` 返回非 li 内容时需把 `itemElement` 放进返回值。受控 `openKeys`、`selectedKeys` 为 `null` 按空数组处理；`mode="horizontal"` 忽略 `isCollapsed`、`defaultIsCollapsed`。
- 展开侧边栏时文字的淡入改为 keyframes 动画 `semi-navigation-text-fade-in`，Firefox、Safari 上同样淡入。
- Vue：受控值用 `v-model:selectedKeys`、`v-model:openKeys`、`v-model:isCollapsed`；`onClick`、`onSelect`、`onOpenChange`、`onCollapseChange` 改为 `click`、`select`、`openChange`、`collapseChange` 事件；`renderWrapper` 改为 `#wrapper`，`items` 中的节点与 header、footer 内容改为 `#icon`、`#text`、`#header`、`#footer` 等插槽；收集 itemKey 时只读直接子项与 Nav.Sub 的默认插槽，包装 Nav.Sub 的组件只算一项，其中的子项不参与默认选中的祖先展开（React 会）；不提供 `multiple`、`onDeselect`。
- Solid：Nav.Item、Nav.Sub、Nav.Header、Nav.Footer 写在 Nav 外不渲染，包装它们的组件也算子项；children 的 itemKey 结构变化时按默认值重建菜单，非受控的选中与展开重置。`renderWrapper` 对每项只调用一次，`itemElement` 只能放在一处；`items` 换成新数组时所有项重新挂载，持有焦点的项失焦。不提供 `multiple`、`onDeselect` 与 Nav.Sub 的 `isCollapsed`、`isOpen`、`maxHeight`（React 声明而不生效）。
- Solid：Semi 图标按尺寸类适配槽位，写了 `size="default"` 的图标也会被调整；弹层中嵌套 Sub 的外层 li 为 `role="none"`，只有标题是 `menuitem`；Nav.Sub 的 `class` 落在外层 li 上（React 丢弃 `className`）。
- Solid 破坏性：`items` 的条目只放数据：`text` 收为 `string | number`，删除条目上的 `icon`、`toggleIcon`、`expandIcon`；类型 `NavItemPropsWithItems`、`SubNavPropsWithItems` 删除，改为 `NavItemConfig`（`NavItems = (string | NavItemConfig)[]`）。图标、显示的文案与箭头由 Nav 的 `renderItemIcon`、`renderItemText`、`renderItemToggleIcon`、`renderItemExpandIcon` 提供，入参 `{ item, level }`（类型 `NavItemRenderProps`，与 Vue 的 `#icon`、`#text`、`#toggleIcon`、`#expandIcon` 插槽一致），只在该项显示时调用；`renderItemExpandIcon` 传入后替代 Nav 的 `expandIcon`。用了 `renderItemText` 时，`onClick`、`onSelect` 回调里的 `text` 是渲染结果（Vue 为条目数据）。Nav.Sub 的 `expandIcon` 只在箭头显示时读取，收起状态下不再创建。
- Solid 破坏性：`header`、`footer` 的配置对象只放数据（同 Vue 的 `NavHeaderConfig`、`NavFooterConfig`）：`header.logo` 改为渲染函数 `() => JSX.Element`，只在显示时调用；`footer.collapseButton` 收为 `boolean | (() => JSX.Element)`，`true` 为内置按钮，渲染函数替换它，水平模式或底部有子元素时不调用。新增类型 `NavHeaderConfig`、`NavFooterConfig`，Nav 的 `header`、`footer` 类型改为 `JSX.Element | NavHeaderConfig`、`JSX.Element | NavFooterConfig`。Nav.Header 的 `text` 与配置对象的 `text` 收为 `string | number`（同 Vue），其他内容放在 Nav.Header 的 children 中；Nav.Header 的 `logo`、Nav.Footer 的 `collapseButton` 仍接受 JSX，`collapseButton` 只在按钮位置显示时读取。迁移：`header={{ logo: <IconSemiLogo /> }}` 改为 `header={{ logo: () => <IconSemiLogo /> }}`。

### Transfer

- 破坏性（类型）：删除 `DraggableResolvedDataItem`、`DataItem`/`FullPathItem` 的 `style`、`BasicDataItem` 的 `className`、`style` 与 `ResolvedDataItem._optionKey`；`RenderSelectedItemProps.sortableHandle` 改为 `SortableHandle`；React 的 `treeProps` 类型去掉 `value`、`ref`、`onChange`、`keyMaps`、`treeData` 等，运行时也忽略。
- 非受控时只记录已选 value 并按当前 `dataSource` 解析：不在新 `dataSource` 中的已选项不再显示，也不进 `onChange`，需要保留时改用受控 `value`；条目以 `value` 识别，缺失或重复的不能被正确选中。`value={null}` 视同未传。
- 条目 DOM 变化：`renderSourceItem`、`renderSelectedItem` 的内容外包 `role="listitem"` 的 div，groupList 改为嵌套列表，筛选框改为原生 `search` 元素，移除按钮与拖拽句柄改为原生 `button`（支持键盘排序），依赖旧结构的选择器需调整。默认过滤不区分大小写；ref 改为 `TransferHandle { search }`。
- treeList 左侧的 Tree 以语言包的 `optionList` 命名，与左侧普通列表一致；`treeProps['aria-label']` 仍可覆盖。
- React：`draggable` 在服务端渲染与 hydration 期间输出不带拖拽的已选列表，hydration 后再加载拖拽排序。
- Vue：`v-model` 受控；事件 `change`、`select`、`deselect`、`search`；`renderSourceItem` 等改为 `#sourceItem`、`#selectedItem`、`#sourceHeader`、`#selectedHeader`、`#sourcePanel`、`#selectedPanel`（排序回调只作为后者的 `onSortEnd` 参数，没有 `sortEnd` 事件）；`sortableHandle` 改为 `#selectedItem` 的 `handle` 参数；`emptyContent` 拆为 `#emptyLeft`、`#emptyRight`、`#emptySearch`。
- Solid：`ref` 拿到根元素，其上带 `search(value)`（类型 `TransferElement = HTMLDivElement & TransferHandle`），`tabIndex` 落在搜索框上；`renderSourcePanel`、`renderSelectedPanel`、`renderSourceHeader`、`renderSelectedHeader` 只调用一次，参数是随状态更新的活对象，`renderSourceItem`、`renderSelectedItem` 每项只调用一次，`checked`、`fullPath` 是 getter，字段要在返回的 JSX 中读取；`dataSource` 中同 key 的项换成新对象时该项重新挂载。破坏性（类型）：`DataItem`、`FullPathItem` 的 `label` 收窄为 `string | number`；新增 `renderLabel(item)` 自定义左右两侧每一项与 treeList 节点的内容（同 Vue 的 `#label`），`showPath` 的路径为 label 文本以 `>` 连接。

### Tree

- 破坏性（样式钩子）：节点数据的 `active` 字段不再生成 `-active` 类，`BasicTreeNodeProps.active` 与 `&-active` 规则删除。`TreeProps.expandIcon` 放宽为 `ReactNode | ((props) => ReactNode)`；删除 `preventScroll`；拖拽回调的 `event` 改为 `DragEvent`；ref 改为 `TreeHandle { search, scrollTo }`。
- 键盘按 APG Tree View：整棵树是一个 Tab 停靠点，焦点留在 `role="tree"` 上并用 `aria-activedescendant` 指向当前节点；展开箭头与复选框不可聚焦，多选不再有 `role="group"` 层，传给 Tree 的 `tabIndex` 与 `aria-label` 等落在 `role="tree"` 元素上。节点内容里可聚焦元素的 `click` 仍冒泡触发 `onSelect`，需自行 `stopPropagation`。
- 节点数据中与行状态同名的字段（`expanded`、`checked`、`level`、`empty` 等）不再覆盖内部状态；树外拖入不再触发 `onDrop`，需要时在容器上监听原生 `drop`；默认搜索只匹配字符串与数字 `label`，元素 `label` 请用 `treeNodeFilterProp` 或自定义 `filterTreeNode`；多选 `related` 下全选的父节点不再同时半选。
- Vue：`v-model`、`v-model:expandedKeys`、`v-model:loadedKeys`；`renderLabel`、`icon`、`expandIcon`、`renderFullLabel`、`searchRender`、`emptyContent` 改为 `#label`、`#icon`、`#expandIcon`、`#fullLabel`、`#search`（空插槽隐藏搜索框）、`#emptyContent`；`renderDraggingNode` prop 删除，改为同名作用域插槽；没有 `Tree.TreeNode` 与默认插槽，`treeData` 只支持整体替换，`label` 只接受 `string | number`；`change`、`select`、`drop` 事件会遮住根元素上的同名原生监听。
- Solid：`renderFullLabel` 对每行只调用一次，参数是随行状态更新的活对象，字段要在返回的 JSX 中读取；返回内容一律由 Tree 自己的 `li` 包住，这个 `li` 带 `id`、`role="treeitem"`、行状态和拖拽处理（同 Vue），虚拟化时的定位样式也在它上面，参数中没有 `style`。`RenderFullLabelProps`、`SearchRenderProps` 和函数形式 `expandIcon` 的参数用 `class` 代替 `className`。破坏性（类型）：`RenderFullLabelProps.expandIcon` 是创建内置展开按钮的渲染函数 `() => JSX.Element`，在插入处调用 `row.expandIcon()`，没调用的行不创建展开按钮。
- Solid：不提供 `Tree.TreeNode`；搜索结果不延后渲染；`ref` 拿到根元素 `TreeElement`，其上带 `search`，`scrollTo` 收到带 `key` 的 `ScrollData` 时滚到该节点，其余参数照原生 `scrollTo` 滚动根元素。元素形式的 `icon`、`expandIcon` 每行各读取一次（每行一个新元素），`expandIcon` 元素会被就地加上 `-expand-icon` 类和点击展开的原生监听；函数形式的 `icon` 收到 `TreeRowProps`；`renderLabel` 只在标签、节点数据或搜索词变化时重新调用。
- Solid 破坏性（类型）：`TreeNodeData.label` 收紧为 `string | number`，`TreeNodeData.icon` 为 `never`（不再读取，`keyMaps.icon` 随之无效）；节点内容用 `renderLabel`（参数 `label` 为 `string | number | undefined`），图标用 Tree 的 `icon`，按节点区分时传函数（同 Vue 的 `#label`、`#icon`）。`icon` 只在插入它的行里读取，`renderFullLabel` 接管整行时不创建。

### Dropdown

- 破坏性：删除 `getPopupContainer`、`zIndex`、`margin`、`rePosKey`；Dropdown.Divider 渲染为 `li role="separator"`，Dropdown.Title 为 `li role="presentation"`，Props 元素类型改为 `ElementProps<'li'>`；`menu` 数组项类型不再含 `children`；删除 `DropdownItemProps.selected`（用 `active`）与内部 `hover` 属性。
- 受控 `visible` 时只上报请求：触发与内部关闭只发出 `onVisibleChange(true/false)`，使用方自行改变 `visible` 不上报，需由使用方回写才开合。`showTick` 时菜单项角色变为 `menuitemcheckbox`，按 `menuitem` 查询的测试需调整；新增 `selectionMode?: 'single' | 'multiple'`（`menuitemradio`、`menuitemcheckbox`）。
- 键盘按 APG menu：Enter、空格触发菜单项，方向键循环，Home、End，右键开左键关子菜单，Esc 只关当前层，菜单内 Tab 关闭全部菜单。只有原生 button、带 href 的 a、Semi Button、Dropdown.Item 等交互元素作触发器才带 `aria-haspopup`、`aria-expanded`；菜单项上的 `onKeyPress` 不再收到 Enter，改用 `onKeyDown`。
- Vue：子组件 `Dropdown.Menu`、`Dropdown.Item`、`Dropdown.Title`、`Dropdown.Divider`（也可按名导入）；弹层内容用 `#content`，受控显隐用 `v-model:visible`，`#menuIcon="{ item, index }"` 自定义图标；`menu` 数据项回调用 `onClick`、`onMouseenter` 等键名；`class` 落在 `.semi-dropdown-wrapper`，`style` 落在 `.semi-dropdown`；不声明 `showArrow`、`arrowPointAtCenter`、`disableArrowKeyDown`。
- Solid：触发器写成函数 children `(getTriggerProps) => JSX`，规则同 Tooltip，要与注入值合并的 `class`、`onKeyDown` 也作为 `own` 传入，写在展开之后会覆盖菜单按钮的类名和键盘处理；非函数 children 包进 Dropdown 自己的 span，其中的 Button 等不会成为菜单按钮，含可聚焦元素时 span 退出 Tab 顺序并在开发期告警。子菜单父项写成 `{(t) => <Dropdown.Item {...t()}>子菜单</Dropdown.Item>}`；禁用的父项不打开子菜单，使用方传入的 `condition` 也不能改变（React 中 `condition` 优先）。
- Solid：`class` 落在 `.semi-dropdown-wrapper`，`style` 落在 `.semi-dropdown`；不提供 `content`，内容用 `render` 或 `menu`；不声明 `disableArrowKeyDown`（同 Vue，上下键总由菜单处理）；`ref` 在组件创建时交出 `DropdownHandle`；`stopPropagation` 只阻止弹层内的点击到达逻辑父级的 JSX 处理函数，document 上的监听仍会收到；打开中卸载时补发的 `afterClose` 同步调用。`render` 的菜单须在 JSX 中内联书写或惰性创建，在 Dropdown 之外预先创建的 JSX 读不到它的上下文，`showTick`、`selectionMode` 不生效。

### ImagePreview

- 破坏性：删除 `@fibrae/semi-ui-react/image` 的 `PreviewInner` 导出、静态标记 `isSemiImage` 与 `ImageProps.imageID`（分组位置由缩略图文档顺序决定）。破坏性（类型）：单图 `preview` 改为 `ImagePreviewProps`（不含 `lazyLoad`、`children`、`className`、`style` 等，预览层样式用 `previewCls`、`previewStyle`）；`PreviewImageProps` 删除 `clickZoom`、`setRatio`、`style`；`onLoad`、`onError` 参数改为 `React.SyntheticEvent<HTMLImageElement>`；`renderLeftIcon`、`renderRightIcon` 返回类型收紧为 `ReactElement`。分组改为注册式：封装组件内部的 Image 也加入分组；Image 的 ref 指向 `img`，未声明属性落在缩略图分组元素上；预览图 `max-width: none` 写在 `.semi-image-preview-image-img`。
- React：服务端渲染的 Image 在 hydration 前已加载完成或失败时，hydration 提交后补发 `onLoad` 或 `onError` 并更新加载状态（原来一直停在加载中）。
- Vue：自定义内容用插槽 `#title="{ title, index }"`、`#previewMenu`、`#leftIcon`、`#rightIcon`、`#closeIcon`，Image 另有 `#placeholder`、`#fallback`，`previewTitle`、`fallback` 只接受字符串；`v-model:visible`、`v-model:currentIndex`；单图配置对象为 `ImagePreviewProps`，组件 props 为 `ImagePreviewComponentProps`；`<KeepAlive>` 失活时释放 inert、滚动锁与键盘监听。
- Solid：`onLoad`、`onError` 收到原生 `Event`；`style`、`imgStyle`、`previewStyle` 接受对象或字符串；`renderLeftIcon`、`renderRightIcon`、`renderCloseIcon` 接受任意 JSX（含字符串，空内容回落默认图标）；`renderPreviewMenu` 只在函数身份变化时重新调用，`MenuProps` 的字段是 getter，`menuItems` 的节点整个生命周期复用；Image 的 `ref` 指向 `img`，ImagePreview 的 `ref` 与未声明属性落在分组 div 上；Image 不重新挂载而移动位置时，分组在 MutationObserver 回调（微任务）之后按新的文档顺序排列；Image 未传 `setDownloadName` 时使用 `preview` 对象里的 `setDownloadName`（React 忽略它）。

### Popconfirm

- 破坏性（类型）：`onConfirm`、`onCancel` 参数改为原生 `MouseEvent`；ref 为 `PopconfirmHandle { focusTrigger }`。`okButtonProps`、`cancelButtonProps` 的 `onClick` 改为追加调用（先调用使用方的，再执行内置确认、取消流程，原来替换内置流程）；`icon` 接受任意 ReactNode。
- 行为变化（React）：`visible` 受控时 `trigger` 不再强制为 `custom`，点击、悬停调用 `onVisibleChange(true)` 请求打开，点击外部与 Esc 调用 `onVisibleChange(false)`，由使用方回写；使用方自行改变 `visible` 不再上报。确认框真正关闭时才把焦点还给触发元素；所有触发方式的弹层都是 `role="dialog"`，以标题命名。
- 确认框渲染在 shadow root 内时，焦点已移到主文档的元素后关闭，焦点不再被拉回触发元素。
- Vue：`title`、`content`、`icon` 改为同名插槽（`#content="{ initialFocusRef }"`），不提供 `showIcon`；`onVisibleChange`、`onClickOutSide`、`onEscKeyDown`、`afterClose` 改为事件 `visibleChange`、`clickOutSide`、`escKeyDown`、`afterClose`，受控用 `v-model:visible`，`onConfirm`、`onCancel` 仍为函数 prop；`class`、`style` 落在 `.semi-popconfirm` 上。
- Solid：触发器写法同 Tooltip（函数 children），`disabled` 时函数 children 收到的 `getTriggerProps` 原样返回 own，`<Show>` 这类 JSX children 照常随数据更新；`content` 的函数与 JSX 形式同 Popover；`okButtonProps`、`cancelButtonProps` 的初始聚焦用 `autoFocus`（不落到 DOM），Solid 原生的 `autofocus` 不触发聚焦；`ref` 在组件创建时交出 `PopconfirmHandle`；`onConfirm`、`onCancel` 的返回值只在是 Promise 时等待。卡片内的点击在 Solid 的事件委托中止于卡片，弹层的 `clickToHide` 与外层元素的 `onClick` 收不到，`stopPropagation={false}` 对卡片内的点击无效。

### Rating

- 破坏性：`tabIndex` 不再是声明的属性，传入的值（含 Tooltip 注入）被丢弃，只有选中的 radio 是 Tab 停靠点。破坏性（样式钩子）：删除 `semi-rating-focus` 类名，焦点环改由 `:focus-visible` 绘制。
- 键盘按 APG radio group：下、右方向键选中下一个，上、左选中上一个（原来上增下减，与文档相反），RTL 只镜像左右；空格选中未选中的星，已选中的星上不再清除；Enter 由被按下的 radio 决定值。`onFocus`、`onBlur` 只在焦点进入或离开整个控件时触发；`onHoverChange` 参数改为 `number | undefined`；配置 `tooltips` 时星距与不配置一致（默认 30px，原来 24px）。
- Vue：`value` 改为 `modelValue`（`update:modelValue`、`change(value)`）；`onHoverChange`、`onClick`、`onFocus`、`onBlur`、`onKeyDown` 改为 `hoverChange`、`click(event, index)`、`focus`、`blur`、`keydown` 事件；`character` 改 `#character` 插槽；`autoFocus` 改 `autofocus`；列表 `tabindex` 固定 -1，`name` 被丢弃。
- Solid：`ref` 是根 `ul`，可直接展开 Tooltip 的触发器属性；其 `focus()` 聚焦 Tab 会到达的那颗星并套用 `preventScroll`，禁用时不聚焦，`blur()` 释放其中持有焦点的星。`autofocus` 为小写，`name` 被丢弃；`character` 在每颗星各渲染一份，要内联书写，传入同一个预先创建的 DOM 节点会被搬走；`character` 按 `hasContent` 判断，`0` 作为文字显示。

### TreeSelect

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`；`dropdownMatchSelectWidth` 让下拉最小宽度跟随触发器的当前宽度（`--semi-tooltip-trigger-width`），`style.width` 不再复制到下拉。删除从未生效的 SCSS 变量 `$font-treeSelect_default-fontSize` 等，`$height-treeSelect_popover`（300px）开始生效。
- 破坏性（类型）：`TreeSelectProps` 改为泛型 `TreeSelectProps<T, Multiple, WithObject>`，`onChange` 参数随 `multiple` 与 `onChangeWithObject` 区分，`OnChange` 接口改为 `OnChangeArgs`（Form.TreeSelect 的行内 `onChange` 参数推断不出来）；`onClear` 参数改为 `React.MouseEvent`；删除 `mouseEnterDelay`、`mouseLeaveDelay`；`searchPosition` 收窄为 `'dropdown' | 'trigger'`；`TreeSelectTriggerRenderProps` 删除索引签名。
- 破坏性：`onFocus`、`onBlur` 跟随 DOM 焦点，以整个组件（触发器、搜索框、标签、清除按钮与下拉）为界成对触发，Tab 进入也触发 `onFocus`，组件内部移动不触发。`searchRender` 参数新增 `ref` 需写到输入框上，`autofocus` 键改为 `autoFocus`；清除按钮改为带名称的原生 `button`；键盘按 APG combobox，`aria-activedescendant` 指向当前节点。
- Vue：`v-model` 与 `v-model:expandedKeys`，`loadedKeys` 配 `update:loadedKeys`；回调改为事件 `change`（`(value, node, event)`）、`expand`、`load`、`select`、`search`、`dropdownVisibleChange`（对应 `onVisibleChange`）、`focus`、`blur`、`clear`、`keydown`；render 属性改为 `#label`、`#icon`、`#selectedItem`、`#tag`、`#trigger`、`#search`（空插槽隐藏搜索框，不提供 `searchRender`）等插槽；`treeData` 只在整体替换时生效；`multiple` 默认 `undefined`，不能经全局默认值设置；`<KeepAlive>` 失活关闭下拉。
- Solid：`ref` 是触发器根元素 `TreeSelectElement`（外层 Tooltip 以它为锚点，另带 `search`、`close`），`focus()` 只聚焦 combobox（搜索框在触发器上时聚焦该搜索框，含 `searchRender` 返回的 textarea），不打开下拉，`blur()` 释放组件内持有的焦点；`class` 代替 `className`，`style`、`dropdownStyle` 用 CSS 对象；`onFocus`、`onBlur` 收到原生事件；不提供 `Form.TreeSelect`。
- Solid：`triggerRender`、`searchRender` 只调用一次，参数为活对象，字段要在返回的 JSX 中读取；`searchRender` 参数的 `ref` 是回调，要写到文本框上，自动聚焦键为 `autofocus`；搜索结果不延后渲染；下拉打开后方向键由 combobox 处理，焦点不移入下拉搜索框；下拉树的行写法同 Tree 的 Solid 说明。
- Solid 破坏性（类型）：`treeData` 同 Tree 收紧，`label` 只接受 `string | number`，节点数据不带 `icon`；新增 `icon` 属性（元素或 `(row: TreeRowProps) => JSX.Element`），用法同 Tree 的 `icon`。单选的 `renderSelectedItem` 只在内置触发器显示已选内容时调用，传 `triggerRender` 时不调用。
- Solid：多选标签经 TagGroup 的 `renderTag` 创建，超出 `maxTagCount` 的标签只在 +N 弹层打开时调用 `renderSelectedItem`；`renderSelectedItem` 返回空 `content` 的项仍占 `maxTagCount` 的一个位置并计入 +N（判断 content 是否为空要先创建隐藏项的内容），收到的 `index` 是该项在已找到数据的选中项中的序号。

### Cascader

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`；不再读取未声明的 `open`（改用 `defaultOpen`）。破坏性（类型）：`CascaderProps` 改为泛型 `CascaderProps<Multiple>`；单选 `displayRender` 参数改为 `ReactNode[]`；`triggerRender` 的 `inputValue` 改为 `ReactNode` 并删除 `onChange`（改用 `onSearch`）；`filterSorter` 参数改为路径数组 `CascaderData[]`；`checkRelation`、`searchPosition` 收窄为字面量联合；`virtualizeInSearch.height` 收紧为 `number`；删除 `mouseEnterDelay`、`mouseLeaveDelay`。
- 选项角色由 `menuitem` 改为 `treeitem`（搜索结果为 `listbox` + `option`），按 `menuitem` 查询的测试需调整；键盘按 APG combobox，焦点留在触发器或搜索框，选项 id 不再是 `cascaderItem-${key}`。清除按钮改为带名称的原生 `button`；ref 改为 `CascaderHandle { open, close, focus, blur, search }`，`ref.focus()`、`ref.blur()` 真正移动 DOM 焦点。
- Vue：`v-model` 受控；回调改为事件 `change`、`select`、`search`、`focus`、`blur`、`keydown`、`dropdownVisibleChange`、`clear`、`exceed`、`load`、`listScroll`，`focus`、`blur` 在打开、关闭下拉时触发而非 DOM 焦点事件；`displayRender`、`filterRender`、`triggerRender` 改为 `#display`、`#tag`、`#filterItem`、`#trigger`，节点属性（`arrowIcon`、`clearIcon`、`prefix`、`suffix` 等）只用插槽；`multiple` 默认 `undefined`，不能经全局默认值设置；`<KeepAlive>` 失活关闭下拉；不提供 `Trigger` 组件。
- Solid：`ref` 是触发器根元素 `CascaderElement`（带 `open`、`close`、`focus`、`blur`、`search`），`focus()` 不打开下拉；破坏性（类型）：`CascaderData.label` 收窄为 `string | number`，删除 `CascaderLabel`，单选 `displayRender` 的参数为 `Array<string | number>`；新增 `renderLabel(item)` 自定义列中选项的内容（同 Vue 的 `#label`），搜索结果、回显与标签显示 label 文本；`expandIcon` 要内联书写；`FilterRenderProps` 的类名字段为 `class`，`filterRender` 返回单个元素时选项属性直接写到该元素上；不接受 `children`（React 声明而不渲染）。
- Solid：`triggerRender`、`filterRender` 只调用一次，参数为活对象；单选 `displayRender` 只在已选路径变化时调用，要跟随其他状态须在返回的 JSX 中读取，可搜索时其节点不写入搜索框；`onListScroll` 的 `e` 为原生 `Event`，`onFocus`、`onBlur` 在打开、关闭下拉时触发；搜索结果与关键字同步渲染；InputGroup 的 `size` 覆盖组件自身的 `size`。

### semi-foundation

- Foundation、Adapter 的方法与 state 属内部实现，直接继承或实现它们的代码不保证兼容。深路径导入有大量删除与改名，如删除 `utils/index`（改为导入具体模块）、`pullAll` 改名 `differenceUnique`、`empty` 改名 `isEmpty`、各组件 `constants` 中无导入方的取值表。
- 移到 semi-foundation：`registerMediaQuery`、`coversPage` 到 `@fibrae/semi-foundation/utils/dom`，`measureScrollbar`、`amendTableWidth` 到 `.../table/utils`，Tree 静态方法到 `.../tree/shared`；`highlight/foundation` 改为具名导出 `findAll`；`FieldState` 改名 `FieldSnapshot`。

### AudioPlayer、VideoPlayer

- 破坏性（类型）：Props 不再接受 `onTimeUpdate`、`onEnded` 等 23 个 React 媒体事件回调及 Capture 变体（从不触发）；VideoPlayer 的 `controlsList` 收窄为 `VideoControl[]`，`theme` 收窄为 `'dark' | 'light'`；删除无效的 `forwardRef`，改用 `ref`。
- 破坏性（深路径导入）：删除 `semi-ui-react/video-player/utils`，改从 `@fibrae/semi-foundation/video-player/utils` 导入。
- VideoPlayer 新增 `onNext`，「下一个」按钮只在传了 `onNext` 且 `controlsList` 允许时显示（原来默认显示）；静音改由 `muted` 承载，不再把音量写成 0；`onVolumeChange` 在拖动音量或切换静音时触发。AudioPlayer 时间统一为 `mm:ss`，超 1 小时为 `h:mm:ss`（原 `75:00`），封面不再可预览。AudioPlayer 挂载前音频元数据已加载完（服务端渲染后 hydration、缓存命中）时，挂载时直接读出时长，进度条可拖动、可点击跳转（原来时长停在 0，拖到哪里都跳回开头）。
- AudioPlayer 进度条圆点与 VideoPlayer 一致，中心对准进度末端，两端时盖住轨道圆角（原来圆点限制在轨道内），进度条两侧留出半个圆点的间距，圆点不压住时间文字；指针按下进度条不再显示键盘焦点环。VideoPlayer 音量与菜单弹层改为不透明深灰底，音量弹层底部增加 12px 留白（高度 160px 改为 168px）；两者的弹层与菜单项样式不再依赖样式表加载顺序（原来可能被 Dropdown、Popover 的默认底色与文字色覆盖）。
- VideoPlayer 进度条圆点在悬停、键盘聚焦或拖动时显示，与轨道同心，进度为 0 时也显示（原来只在悬停播放头所在分段时显示，进度为 0 时不显示，拖动后移出可能一直残留）；轨道悬停变粗改为以中心线上下对称的高度过渡；时间预览 Tooltip 不再拦截指针（原来箭头伸进进度条热区，指针移到箭头下时悬停中断，轨道粗细闪烁）。
- VideoPlayer 传了 `captionsSrc` 时 Safari 也默认显示字幕（原来 Safari 按系统字幕偏好不启用 `default` 字幕轨，播放器又没有字幕开关，字幕始终不显示）。
- Vue：不转发原生媒体事件；VideoPlayer 回调改为事件 `play`、`pause`、`qualityChange`、`rateChange`、`routeChange`、`volumeChange`，`onNext` 仍是函数 prop。
- Solid：AudioPlayer 的 `ref` 与未声明属性落在根 div；VideoPlayer 的 `ref` 指向原生 video 元素，未声明属性落在根 div；两者的 `style` 都接受对象或字符串；Props 也不接受媒体事件的小写（`ontimeupdate`）与 `on:` 写法；进度与音量滑块的 range input 用 `input` 事件上报。

### TimePicker

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`（面板在 top layer）、`onChangeWithDateFirst`（`onChange` 固定为 `(value, valueString)`）、无效的 `clearText`。
- 破坏性（类型）：`TimePickerProps` 改为类型别名（`interface X extends TimePickerProps` 改交叉类型），`onChange` 按 `type` 判别为 `(Date, string)` 或 `(Date[], string[])`；删除无效的 `locale`、`localeCode`、`dateFnsLocale`（改用 `LocaleProvider`、`ConfigProvider`）；`scrollItemProps` 收窄为 `cycled`、`mode`、`motion`、`transform`；`triggerRender` 参数改为 `TimePickerTriggerRenderProps`；ref 为 `TimePickerHandle { focus, blur }`。
- `timeRange` 只选一侧时 `value` 固定长度 2，空侧为 `undefined`，字符串为 `['07:00:00', '']`，`disabledTime` 收到 `[date, undefined]`；按 `length === 1` 判断的代码需调整。
- 受控 `open` 时点击外部会调用 `onOpenChange(false)` 与 `onBlur`；`open={undefined}` 按非受控；`value` 为 `null` 是受控空值，时间戳 `0` 有效；`hourStep` 等非正整数抛 `RangeError`。
- Vue：`v-model`（`modelValue`）与 `v-model:open`；清空时单选上报 `undefined`、范围上报 `[]`；`triggerRender` 改 `#trigger`，`panelHeader`、`panelFooter`、`panels` 改 `#panelHeader`、`#panelFooter`、`#panel`。
- Solid：`ref` 是 `.semi-timepicker` 根元素，其 `focus()`、`blur()` 作用于原生输入框，`focus()` 套用 `preventScroll` 属性，不提供 `TimePickerHandle`；`autoFocus` 写作 `autofocus`，`onFocus` 收到原生 `FocusEvent`（`onBlur` 仍为点击外部的 `MouseEvent`）；`style`、`inputStyle`、`popupStyle` 接受对象或字符串。
- Solid：`triggerRender` 只调用一次，参数是随状态更新的响应式对象（在 JSX 之外解构只得到初始值）；自定义触发器包在根元素内的一个 div 中（`.semi-timepicker > div`），内容不含可聚焦元素时由该 div（React 中为根元素）带 `role="button"`、`tabindex` 与 `aria-haspopup`、`aria-expanded`、`aria-controls`。

### Upload

- 破坏性：`limit` 为 1 时选择文件不再调用 `onExceed`；`onDrop` 第一个参数改为原生 `DragEvent`；`accept` 中点开头的扩展名按完整后缀匹配（`.tar.gz` 要求以其结尾）；`addOnPasting` 只响应原生 `paste` 事件，`onPastingError` 改为粘贴文件读取失败时触发，参数收窄为 `Error`。
- 破坏性（类型）：`FileItem`、`BaseFileItem` 删除 `[key: string]: any`（Chat 的 `attachment`、AIChatInput 的 `Attachment` 随之变化）；`RenderFileItemProps` 不再含 `key`；`transformFile` 改为 `(file: File) => File`；`cropModalProps` 收窄为 `UploadCropModalProps`；ref 为 `UploadHandle { insert, upload, openFileDialog }`。
- 上传事件不再原地改写文件项，每次生成新对象，用 `===` 比较旧文件项需改为比较 `uid`；卸载、隐藏或缓存时进行中的上传不再中止（需要中止的用 `customRequest`）。
- DOM 变化：图片墙空列表也渲染 `.semi-upload-file-list`（依赖 `.semi-upload > .semi-upload-add` 的样式需调整）；`tabIndex` 落在添加按钮上，根元素不再输出 `aria-required`、`tabIndex`；列表缩略图 `alt` 为空，卡片操作与「清空」改为原生 `button`。
- Vue：受控列表用 `v-model:fileList`；回调改为事件 `change`、`success`、`error`、`progress`、`remove`、`retry`、`exceed`、`drop`、`clear`、`pastingError`、`cropError` 等，`onPreviewClick` 仍是函数 prop；卸载后不再发出这些事件。
- Vue：节点与 render props 改为插槽，如 `#dragIcon`、`#dragMainText`、`#prompt`、`#fileItem`、`#thumbnail`、`#picClose`、`#fileOperation`、`#fileListHeader`；`validateMessage` 只收字符串，节点用 `#fileValidateMessage`；逐文件插槽的文件数据在 `file` 字段。
- Solid 破坏性（类型）：`FileItem`、`BeforeUploadObjectResult`、`AfterUploadResult` 的 `validateMessage` 只收字符串（原为 `JSX.Element`），节点用 `renderValidateMessage(fileItem)`，参数同其他渲染函数为 `RenderFileItemProps`，渲染为空时回落到文字；照片墙只为带 `validateMessage` 的文件显示校验图标，`renderValidateMessage` 替换图标提示中的文字（Vue 的 `#fileValidateMessage` 为该文件渲染出内容时即使没有文字也显示图标）。
- Solid：`ref` 拿到根元素 `UploadElement`，其上带 `insert`、`upload`、`openFileDialog`；`FileCard` 经 `Upload.FileCard` 使用，`FileCardProps` 不含 `class`；文件卡片按位置复用，`renderFileItem`、`renderThumbnail` 等渲染函数每个位置只调用一次，参数是随文件更新的响应式对象，在 JSX 之外解构只能拿到初始值；`fileListTitle` 的渲染函数须声明参数，无参函数按节点处理（只替换标题文字）；`renderPicClose` 的参数为 `{ class, remove }`；`itemStyle` 与 `cropModalProps` 的 `style`、`bodyStyle` 只接受对象；同一文件可以再次选择，靠清空文件输入框的值实现，不重新挂载输入框。
- Solid：添加区含 Semi 的 Button、IconButton 或 AIChatInput 的默认上传按钮时，首帧（含服务端 HTML）即不带 `role="button"`、`tabindex`；其他可聚焦控件（原生 `button`、链接等）挂载后才判定，挂载前添加区仍是按钮。

### Cropper

- 裁剪框最小边长 10px 对指针拖拽同样生效；加载后改变 `aspectRatio`，裁剪框按新比例重排；滚轮缩放末步停在 `maxZoom`、`minZoom`；图片未加载时 `getCropperCanvas` 抛错；ref 为 `CropperHandle`，只有 `getCropperCanvas`。
- Vue：`zoom` 用 `v-model:zoom`（或 `:zoom` 加 `@zoomChange`），`rotate` 只能单向绑定；`preview` 仍是返回宿主 DOM 的函数。
- Solid：`ref` 拿到根元素 `CropperElement`，其上带 `getCropperCanvas`；`imgProps`（类型 `CropperImgProps`）的 `style` 与 `cropperBoxStyle` 只接受对象。

### Resizable

- 破坏性（类型）：`onResizeStart`、`onChange`、`onResizeEnd` 的事件统一为 `PointerEvent`，键盘缩放时为 `KeyboardEvent`，读 `clientX` 等需先判断类型；`HandlerCallback` 改为 `PointerEvent`，删除 `ResizeEventType`、`ResizableState`、`ResizeGroupState`。
- 拖拽条为 `role="separator"` 和 Tab 停靠点，方向键调整大小；ResizeItem 的 `min`、`max` 统一按 border-box px 计算，支持 `vw`、`vh`（`rem`、`em` 仍得 NaN）；`onResizeStart` 任一侧返回 `false` 取消调整；`size` 只传一个轴时另一轴用 `defaultSize`。
- Vue：受控尺寸用 `v-model:size`；`onChange`、`onResizeEnd` 改为 `change`、`resizeEnd` 事件，`onResizeStart` 仍是函数 prop；`handleNode` 改为 `#handle="{ direction }"`；已知限制：ResizeItem 传字符串 style 会冲掉尺寸，请用对象 style。
- Solid：受控 `size` 拖动时立即显示 `onChange` 中同步写回的尺寸，不落后一次指针移动；`style`、`handleStyle`、`handleWrapperStyle` 可以是对象或字符串，`minWidth` 等的数字仍按 px 处理；破坏性：`handleNode` 改为 `renderHandle(direction)`，只为启用的方向调用（同 Vue 的 `#handle="{ direction }"`），删除类型 `HandleComponent`；ResizeItem、ResizeHandler 在 ResizeGroup 内经 ref 回调登记，序号按 DOM 顺序计算。ResizeItem 的字符串 `style` 变化时会冲掉分组写入的尺寸，请用对象 style（同 Vue）。ResizeHandler 只有原生属性，不提供 `direction`、`onResizeStart`、`disabled`（React 声明而不生效，同 Vue）。

### CodeHighlight

- 由 prismjs 改用 shiki：`language` 取 shiki 语言名与别名，未知语言按纯文本；配色为 `github-light`、`github-dark`；删除 `defaultTheme`，`.token.*` 类名不再存在，基于 Prism 的自定义主题 CSS 失效；高亮异步完成，首帧为纯文本。不再内置语言，经 `CodeHighlight.register({ languages, themes })` 或 `languages`、`themes` 属性提供；`code` 改为可选。
- Vue：`languages`、`themes` 在 `<script setup>` 顶层声明，不要在模板写内联字面量；`CodeHighlight.register` 与 React 共用注册表。
- Solid：`CodeHighlight.register` 与 React、Vue 共用注册表；高亮结果作为 DOM 节点插入根元素，首帧为纯文本。

### HotKeys

- 破坏性：`HotKeys.Keys` 删除需 Shift 才能输入的符号别名（`Exclamation`、`At`、`Hash` 等），`hotKeys` 写 `'!'`、`'@'` 现在抛错，改写为 `['Shift', '1']`；删除无效的 `mergeMetaCtrl`；`HotKeysProps` 收窄为实际接受的属性（不含 `children`），`hotKeys` 必填。
- Vue：`onHotKey` 改 `@hotKey`（载荷为原生 `KeyboardEvent`），`render` 改默认插槽（为空表示只监听不渲染）；`class`、`style`、`@click` 落在根元素。
- Solid：`render` 接受节点或返回节点的函数，函数只调用一次；为 `null` 时不渲染根元素，快捷键仍有效。`getListenerTarget` 内读取的 signal 变化时，监听移到新目标（React 只在换成另一个函数时）。

### Highlight

- `searchWords` 中的 `undefined`、`null`、空字符串被忽略；相邻的不同样式搜索词不再合并成一个块，各自保留 `className` 与 `style`。
- Vue：没有根元素，丢弃 `class`、`style`；数字样式不补 `px`，要写 `'4px'`；`searchWords` 对象项的类名字段为 `class`。
- Solid：同 Vue，没有根元素，丢弃 `class`、`style` 等未声明属性，对象项的类名字段为 `class`；`highlightStyle` 与对象项 `style` 的键用 kebab-case，数字值不补 `px`。

### Layout

- Vue：`Layout.Sider` 的 `onBreakpoint` 改为 `@breakpoint(screen, matches)`；嵌套更深的 Sider 需传 `hasSider`；类型 `BasicLayoutProps` 改名 `LayoutProps`。
- Solid：`Layout.Sider` 经 context 向最近的 Layout 登记，`has-sider` 在 Sider 创建时登记，服务端首帧已带上，不扫描直接子元素，嵌套在其他元素里的 Sider 也算。

### Grid

- 破坏性（深路径导入）：`semi-ui-react/grid/row` 不再导出 `RowContext`、`RowContextType`。
- Row 的 `gutter` 改为 CSS 变量 `--semi-row-gutter-{x,y}-{xs..xxl}` 加媒体查询，不再写入 Row、Col 的行内 style；Col 不在 Row 内时 gutter 为 0 正常渲染；Col 断点层的 `0`（如 `md={0}`）只在命中断点及以上隐藏，`order`、`offset`、`push`、`pull` 设为 0 现在生效。
- Vue：具名导出 `Row`、`Col`，无 default 导出；`gutter`、`span`、`xs` 等数字与对象 prop 必须用 `:` 绑定。
- Solid：`style` 接受对象（kebab-case 键）或字符串，写在 gutter 变量之后，使用方的值优先。

### Descriptions

- 横向布局只把 `Descriptions.Item`（含 Fragment 里的）当作列，非元素子节点不再占列位；`align="left"` 在 RTL 下镜像。
- Vue：`data` 项的 `key`、`value` 只接受 `string | number`，自定义内容用作用域插槽 `#itemKey`、`#value`（参数 `{ item, index }`）。
- Solid：children 中只渲染 `Descriptions.Item`，其他子节点（React 纵向布局下原样输出，如自定义 `tr`）不渲染并在开发期告警，放在 Descriptions 外的 Item 单独写时不渲染；横向布局下 `span`、`hidden` 或 `column` 变化时重建全部单元格内容。
- Solid 破坏性（类型）：`data` 项的 `key`、`value` 只接受 `string | number`（不再接受 JSX 与函数），自定义内容用 `renderKey(item, index)`、`renderValue(item, index)`，`index` 是该项在 `data` 中的位置（含 `hidden` 项）；隐藏项不调用它们。`Descriptions.Item` 的 `itemKey`、`children` 不变。

### Card

- 字符串 `title` 渲染为 `div`（外观仍是 6 号标题），不再是 `h6`；`headerExtraContent` 在 DOM 中位于 title 之后；`header`、`cover`、`footer` 为 `0` 时渲染在各自容器内。
- Vue：ReactNode 属性改为同名插槽 `title`、`headerExtraContent`、`header`、`cover`、`footer`、`actions`（`overrideDefaultProps` 不能再设置它们）；`title?: string` 与 `#title` 等价，插槽优先；根 div 用 `$el`。
- Solid：`loading` 期间不创建正文 `children`，加载结束后才创建；`loading` 时只要传了 `children` 就显示骨架屏占位（与 React 一致），不检查它渲染后是否为空（React 会跳过渲染为空的 children），因为判断是否为空要先创建它们。

### DragMove

- 破坏性（类型）：`onMouse*`、`onTouch*`、`allowMove` 参数改为 `PointerEvent`；`children` 收窄为 `ReactNode`；`handler` 改为 `() => HTMLElement | null`，返回的元素需位于被拖元素内；右键、中键不再启动拖动。
- Vue：没有根元素，未声明属性全部丢弃（F11）；回调改为 `mouseDown`、`mouseMove`、`mouseUp`、`touchStart` 等事件，载荷 `PointerEvent`；默认插槽中每个顶层元素各自可拖动，文本与多根组件不可拖动。
- Solid：children 中每个顶层元素各自可拖动（多根组件的每个根也是），文本节点不可拖动；`handler` 返回的元素需位于被拖元素内。

### Slider

- 破坏性（类型）：`SliderState.focusPos` 改名 `activeHandle`；`tipFormatter` 参数为 `number`（每个手柄单独调用），删除类型 `tipFormatterBasicType`；`handleDot` 改为 `HandleDot | HandleDot[]`。
- 每个手柄内改为视觉隐藏的原生 `input type="range"`（`.semi-slider-handle-input`）：`getByRole('slider')` 返回该 input，`aria-valuenow` 等不再输出，改读 `value`、`min`、`max`、`disabled`，`onKeyDown` 绑定在它上；新增 `name`；方向键由组件处理，各浏览器一致：`vertical` 时指向 `max` 一端的方向键（默认下，`verticalReverse` 时上）与右方向键增加值，水平 RTL 时左方向键增加值；PageUp、PageDown、Home、End 仍由原生 range 处理；foundation 的 `handleKeyDown` 改为 `(event, pos)`；步长网格从 `min` 起算；无 `value` 时初始位置为 `min`（原为 0）；指针按下轨道或手柄聚焦 input 时不显示键盘焦点环。
- Vue：`value` 改 `modelValue`；`onAfterChange`、`onMouseUp` 改为 `afterChange`、`mouseUp` 事件；`marks`、`tipFormatter` 只收字符串或数字，节点用 `#mark`、`#tip` 插槽。
- Solid：`ref` 是根元素，其 `focus()` 聚焦起点手柄（范围模式下为第一个手柄），`blur()` 释放持有焦点的手柄；`autofocus` 为小写，同样聚焦起点手柄。`onKeyDown`、`onFocus`、`onBlur` 为原生 DOM 事件；手柄 Tooltip 不通过 `aria-describedby` 关联；开启 `tooltipOnMark` 时标签与气泡各调用一次，各自持有独立的节点。
- Solid 破坏性（类型）：`marks` 只收字符串或数字，节点用 `renderMark(value, label)`。

### Tag

- 破坏性（类型）：`TagGroupProps` 删除泛型参数 `T`，改为按 `mode` 判别的联合且 `tagList` 必填：`<TagGroup<'custom'> ...>` 改为 `<TagGroup mode="custom" ...>`，`TagGroupProps<'custom'>` 改为 `TagGroupProps`；`onClose`、`onTagClose` 事件参数改为 `React.MouseEvent | React.KeyboardEvent`。
- 可点击 Tag 按 Enter、空格时对自身 `click()`，`onClick` 收到真实 click 事件；`visible={undefined}` 按非受控；TagGroup、SplitTagGroup 透传未声明属性到根 div（F2）。
- Vue：内容及图标用默认插槽、`prefixIcon`、`suffixIcon`；`close(event, tagKey)`、`tagClose(event, tagKey)` 去掉 children 参数；`tagList[].children` 只收 `string | number`，自定义节点用 `#tag`，无 `mode="custom"`。
- Solid：`onClose`、`onTagClose` 的 `event` 为 `TagCloseEvent`（原生 `MouseEvent | KeyboardEvent`），`tagChildren` 为解析后的 children；使用方在 `onClose` 中同步移除标签时，焦点仍先移到相邻标签；TagGroup 按 `tagKey`（没有时按文本与出现次序）识别各项，`tagList` 每次重建对象也不重新挂载；`+N` 直接作 Popover 的触发器，不额外包 span。
- Solid 破坏性：TagGroup 删除 `mode`，`tagList` 只收数据 `TagGroupItem[]`（Tag 的属性，`children` 为 `string | number`，不含 `prefixIcon`、`suffixIcon`），新导出类型 `TagGroupItem`；自定义标签节点用 `renderTag={(tag, index) => JSX.Element}`，对应 Vue 的 `#tag` 插槽。`renderTag` 只为显示的标签调用，超出 `maxTagCount` 的标签在 +N 弹层打开时才创建；`maxTagCount` 变化时跨过折叠边界的项重新调用 `renderTag`。

### Sidebar

- 破坏性（类型）：Props 删除无效的 `onChange`（选项切换走 `onActiveOptionChange`）；`DetailContent` 不再接受 `editable`、`imgUploadProps`、`onContentChange`（改用 Sidebar 的 `fileEditable`、`imgUploadProps`、`onFileContentChange`）；MCPConfigure 选项的 `value` 改为必填；`AnnotationItem` 的 `onClick` 参数改为 `React.MouseEvent<HTMLAnchorElement>`。
- 破坏性：上传位 HTML 不再带 `accept`、`limit` 等属性，状态类名 `.uploading` 等改为 `.semi-sidebar-file-image-slot-<status>`；Annotation 条目改为 `<a href={url} target="_blank">`，不再调用 `window.open`；`getUploadImageSrc` 收到上传响应而非 props 对象。
- 破坏性：文件编辑器菜单栏的代码块按钮与其他按钮一样只显示图标（`IconTerminal`），不再显示文字「CB」，删除其专用类名 `.semi-sidebar-file-menu-bar-btn-codeblock`。
- Vue：回调改为事件（如 Sidebar 的 `cancel`、`activeOptionChange`，Annotation 的 `change`、`click`，CodeContent、FileContent 的 `expand`，MCPConfigure 的 `statusChange`），支持 `v-model:visible`、`v-model:activeKey`、`v-model:options`；未绑定 `expand` 监听时不渲染展开按钮。
- Vue：渲染函数与节点属性为插槽（如 Sidebar 的 `#title`、`#optionIcon`、`#optionItem`、`#mainContent`、`#detailContent`，MCPConfigure 的 `#icon`、`#desc`、`#item`）；数据只收字符串；ref 类型为 `SidebarContainerHandle`。
- Solid：节点属性与渲染函数的返回值为 `JSX.Element`；类名字段写作 `class`（包括 `imgUploadProps`、`jsonViewerProps`、`codeHighlightProps` 中的）；回调收到原生 `MouseEvent`、`KeyboardEvent`；`ref`、`containerRef` 是回调，每次显示时交出新建的 `.semi-sidebar-container` div，隐藏时不回调 `null`；`imgUploadProps.action` 可省略，只传 `customRequest` 也显示图片按钮。
- Solid：Sidebar 在 `mode` 或 `detailContent.key` 变化时重新挂载详情，单独使用的 FileItem 只在创建编辑器时读取 `extensions`、`imgUploadProps`，换新值需由使用方重新挂载；CodeContent、FileContent、Annotation 与主模式选项按项对象识别各项，`codes`、`files`、`info`、`options` 换成新对象时对应面板（含编辑器）重新挂载；MCPConfigure 按位置复用选项行，`renderItem` 在选项对象或模式变化时重新调用。
- Solid 破坏性：数据只放数据（同 Vue）。`SideBarOption` 删除 `icon`，`name` 改为 `string`，按钮图标由 Sidebar 的 `renderOptionIcon(option)` 提供（对应 Vue 的 `#optionIcon`）；`MCPConfigureOption` 的 `icon` 改为图片地址 `string`、`desc` 改为 `string`，其他内容由 MCPConfigure 的 `renderIcon({ option, custom })`、`renderDesc({ option, custom })` 提供（对应 Vue 的 `#icon`、`#desc`），传 `renderIcon` 时不再按 `icon` 渲染图片；`desc` 为字符串后内置过滤会匹配它；`AnnotationInfo.header` 改为 `string`，分组标题由 AnnotationContent 的 `renderHeader(info)` 提供，Annotation 上同一属性叫 `renderInfoHeader(info)`（`renderHeader` 是容器头部，对应 Vue 的 `#infoHeader`）。

### Lottie

- 破坏性：`Lottie.getLottie()` 改为异步，返回解析为 lottie-web 的 `Promise`；lottie-web 按需导入，`getLottie`、`getAnimationInstance` 回调在其加载完成后调用；系统开启「减少动态效果」时不自动播放（显式传 `params.autoplay` 则以其为准）。
- Vue：回调改为 `getAnimationInstance`、`getLottie` 事件；`params` 整体替换才重载，原地修改不重载，大 JSON 用 `shallowRef` 或 `markRaw`；`params.container` 存在时只渲染注释节点。
- Solid：`params` 深比较后才重新加载，`class`、`style`、`width`、`height` 变化不重载；`params.container` 存在时不渲染任何节点；使用方的 `aria-hidden`、`role` 覆盖默认的装饰性与 image 语义。

### Anchor

- 破坏性：根元素不再自动生成 `id="semi-anchor-xxx"`，改用 `.semi-anchor` 选择；滑轨与链接列表包在新容器 `.semi-anchor-rail-wrapper` 中，`.semi-anchor` 不再是 `position: relative`；`LinkProps` 删除无效的 `level`、`direction`；`onClick` 事件参数改为 `React.MouseEvent | React.KeyboardEvent`；删除 `strings.POSITION_SET`，改用 Tooltip 的 `POSITION_SET`。
- Link 只响应 Enter 激活；以 `#` 开头的 `href` 按元素 id 查找而非 CSS 选择器；当前链接带 `aria-current="location"`（原 `aria-details="active"`）；新增 `scrollIntoViewOptions`；无激活链接时 `onChange` 收到 `''`（原 `undefined`）。
- Vue：`onChange`、`onClick` 改为 `change`、`click` 事件（`click` 只在激活链接时触发）；Link 节点标题用 `#title` 插槽。
- Solid：`Anchor.Link` 须是 Anchor 或 Anchor.Link 的直接 JSX 子节点（可经 Fragment、Show、For），写在 Anchor 外不渲染；`getContainer` 只在挂载时与其读取的 signal 变化时求值，容器晚于挂载出现时让它读取一个随容器出现而变化的 signal。

### Breadcrumb

- 破坏性：删除 `Breadcrumb.Item.isBreadcrumbItem`，改为声明 `elementType: 'Breadcrumb.Item'`；`onClick` 第一个参数类型改为 `BreadcrumbItemInfo | RouteProps`，children 写法下 `name` 是 `ReactNode`。
- `maxItemCount` 小于 2 时首项与当前项仍显示；`activeIndex` 指向折叠区间内的项时，当前项保持可见，改为隐藏其前后较长的一段；没有 `href` 的项仅在有 `onClick` 时可聚焦；非 `Breadcrumb.Item` 的子节点原样渲染。
- Vue：`separator` 为字符串属性，节点用 `#separator` 插槽，Item 的 `icon` 改 `#icon`；routes 写法的 `renderItem` 改 `#item="{ route, index }"`，`renderMore` 改 `#more="{ restItems }"`，`routes[].onClick` 不支持，用 Breadcrumb 的 `@click`。
- 修复（React）：非 `Breadcrumb.Item` 的子元素才触发开发期告警；此前写反，合法的 `Breadcrumb.Item` 误报，`<div />` 等不报。
- Solid：Breadcrumb.Item 写在 Breadcrumb 外不渲染，包装 Item 的组件也算项；其他 Semi 组件作子节点时丢弃并在开发期告警。`routes` 换成新数组时所有项重新挂载；`separator` 传同一个节点变量时只显示在一处，需直接写 JSX。
- Solid 破坏性：路由数据里不放节点。`RouteProps` 删除 `icon`，`name`、`separator` 改为 `string`；路由图标由 Breadcrumb 的 `renderIcon(route, index)` 提供（对应 Vue 的 `#icon="{ route, index }"`），自定义标题仍用 `renderItem(route)`；`Breadcrumb.Item` 的 `icon` 不变。
- Solid 破坏性：`renderMore` 收到被折叠项的数据 `Array<RouteProps | BreadcrumbItemProps>`（routes 写法为路由对象，children 写法为各 `Breadcrumb.Item` 的 props，其 `children`、`icon` 在显示处读取才创建），不再收到现成节点，由使用方渲染；隐藏项变化时重新调用。

### Tabs

- 破坏性：删除 `TabPane.isTabPane`，改为声明 `elementType: 'Tabs.TabPane'`；删除 `TabBarProps.closable`；`activeKey` 类型加入 `null`；`onTabClick` 事件参数为 `MouseEvent | KeyboardEvent`；非受控 Tabs 的当前 key 不在新列表中时回落到第一个启用的页签；children 写法只把 `TabPane` 当页签。
- `activeKey={null}` 是受控空值（不选中任何页签），`undefined` 按非受控；`role="tablist"` 移到只含 Tab 的 `.semi-tabs-bar-tablist`；`Tabs.TabItem` 透传的 `role`、`tabIndex`、`aria-*` 不再覆盖组件值；tab 与 panel 的 `id` 对 `itemKey` 做 URL 编码；新增语言包键 `Tabs.prevTabs`、`Tabs.nextTabs`。
- 没有选中页签（`activeKey` 为 `null` 或不命中任何页签）时，tablist 中第一个启用的页签作为 Tab 停靠点；按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不再移动焦点或选中页签；选中的页签收进「更多」菜单时，其 `id` 落在 tablist 外的 `hidden` 元素上，面板仍以该页签的标题命名。
- `collapsible` 把选中的页签滚进可见区域时只滚动标签栏，不再滚动页面（原来首次出现或切换选中项时，若页面已滚离 Tabs，会被拉回 Tabs 所在位置）；Firefox 与 Safari 中标签栏不在视口内时直接滚到位，不播放平滑滚动。
- 可关闭页签按 Backspace 或 Delete 关闭时阻止按键的默认行为，Safari 不再因此后退页面。
- Vue：页签写成 `<TabPane>` 子节点，标题用 `#tab`、`#icon`；`tabBarExtraContent`、`renderTabBar`、`renderArrow`、`more.render` 改为 `#tabBarExtraContent`、`#tabBar`、`#arrow`、`#more`；`v-model:activeKey`，事件 `change`、`tabClick`、`tabClose`、`visibleTabsChange`。
- Solid：TabPane 没有 `elementType`，Tabs 按 TabPane 返回的数据识别页签，只渲染 TabPane 的包装组件也算页签（React、Vue 不算）；放在 Tabs 外的 TabPane 单独写时不渲染，在数组中显示为 "[object Object]"；`tabList` 模式下 children 中的 TabPane 不渲染。
- Solid：动态页签用 `<For>` 或 `<Index>`，直接 `.map()` 每次更新都重建全部面板；`renderTabBar` 对同一个函数只调用一次，传入的 props 是活对象，在返回的 JSX 中读取字段才会随状态更新。
- Solid：新增面板并同时选中时，在同一个 `batch` 中更新面板与 `activeKey` 才不播放滑入动画；夹在 Tabs 与 TabPane 之间的 Provider 到不了面板内容。
- Solid 破坏性（类型）：`tabList` 的数据项只放数据，`PlainTab.tab` 收窄为 `string | number`，删除 `PlainTab.icon`（`OverflowItem` 随之没有 `icon`）；节点形式的标签与图标用 Tabs 的 `renderTab(item, index)`、`renderIcon(item, index)`（类型 `TabRender`，同 Vue 的 `#tab`、`#icon`），在页签、「更多」菜单项与面板名称处各调用一次，数据相同的新对象不重新调用，标签内的节点与焦点保留；`renderArrow` 的 `defaultNode` 改为 `() => JSX.Element`，在插入处调用 `defaultNode()`。TabPane 写法下 `renderTabBar` 的 `tabBarProps.list` 与 `renderArrow` 的 `items` 是普通数据，只含 `itemKey`、`disabled`、`closable`，不带 `tab`，需要标签文本时用 `tabList`。
- Solid：`collapsible="auto"` 只在页签增删或重排时重新检测溢出，改字符串标题不触发；`renderArrow` 收到的 `items` 对象跨渲染复用；`more.render` 的返回值包在 `span` 中。

### UserGuide、Portal

- `StepItem.mask`、`className` 生效；步骤的 `theme` 优先于全局；`nextButtonProps`、`prevButtonProps` 的 `onClick` 先调用使用方的再执行内置处理（原为替换）；`target` 允许 `null`；popup 卡片在 top layer，不接收 `getPopupContainer`、`zIndex`。
- 滚动锁只在 popup 模式且当前步骤显示遮罩时加锁（`mask` 为 false 不再锁页面）；Esc 等同「跳过」。
- Vue：回调改为 `change`、`next`、`prev`、`skip`、`finish` 事件，新增 `v-model:current`、`v-model:visible`；`steps` 只放数据，自定义内容用 `#title`、`#description`、`#cover`，按钮文字用 `#nextText`、`#prevText`。
- Solid：步骤的类名字段为 `class`；破坏性：`steps` 只放数据，`title`、`description` 为字符串，没有 `cover`，自定义内容用 `renderTitle`、`renderDescription`、`renderCover`，参数为 `{ item, index }`（`UserGuideStepRenderProps`），只为当前步骤调用，标题与描述渲染为空时回落到字符串，封面渲染为空时没有封面区域；UserGuide 无根 DOM，丢弃未声明属性（F11）；只在 `current`、`steps`、`spotlightPadding` 变化与窗口缩放、滚动时重新测量目标（React 每次渲染都测量）；popup 卡片的初始聚焦不带 `preventScroll`。
- React：Portal 在服务端渲染与 hydration 期间不输出容器与内容，默认打开的 Modal、SideSheet、ImagePreview、Feedback、UserGuide 在 hydration 后的下一次提交中打开（原在服务端抛 `document is not defined`）；纯客户端渲染仍在首个提交内创建容器。

### OverflowList、Select

- TreeSelect 关闭时清空搜索值、开启 `insetInput` 的 DatePicker 关闭时恢复触发框可用，改在离场动画结束后执行。
- 破坏性：`Select.Option`、`Select.OptGroup` 改用静态 `elementType` 识别，删除 `isSelectOption`、`isSelectOptionGroup`；不再读取未声明的 `open`，改用 `defaultOpen`；删除 `getPopupContainer`、`zIndex`、`dropdownMargin`、`rePosKey`、`selectMethod`。
- 破坏性（类型）：`SelectProps`、`Select` 新增泛型参数 `Multiple`，`onChange` 与 `renderSelectedItem` 按 `multiple` 收窄，显式写 `Select<T>` 又传 `multiple` 的改为 `Select<T, true>`；`onSelect`、`onDeselect` 的 value 为选项原始值；`onBlur` 参数为 `React.FocusEvent<HTMLElement> | MouseEvent`。
- 破坏性（类型）：Select 删除 `mouseEnterDelay`、`mouseLeaveDelay`、`TriggerRenderProps.onChange`（改用 `onSearch`），`searchPosition` 收窄为 `'trigger' | 'dropdown'`，`virtualize.itemSize` 必填；`OverflowListProps` 不再包含 `children`，改为泛型 `<T>`，scroll 模式 `overflowRenderer` 为 `(overflowItems: [T[], T[]]) => [ReactNode, ReactNode]`。
- 破坏性（DOM 结构）：带 label 的 OptGroup 的选项包在 `div.semi-select-group-wrapper` 内，依赖选项与标题同级的自定义样式（如分隔线选择器）需调整。
- 可搜索的 Select、TreeSelect、Cascader 改为 ARIA 1.2 combobox，按 `textbox` 查询触发器内搜索框的测试改为 `combobox`。删除语言包键 `Select.selected`、`Select.createItem`，新增 `Select.clear`；`renderOptionItem` 参数新增 `id`，需写在 `role="option"` 外层元素上。
- 行为：`onFocus`、`onBlur` 成对触发，焦点在触发器内部移动不触发；点击外部关闭下拉时焦点留在被点击处；键盘按 APG select-only combobox 处理；已选项按 `value` 而非 `label` 识别；回调收到的选项对象不再带内部字段；`dropdownMatchSelectWidth` 跟随触发器的当前宽度，打开期间触发器变宽下拉也随之变宽。OverflowList 新增 `wrapperProps`。
- OverflowList 按项与容器的小数宽度判断溢出：原来按取整后的宽度，Safari 等按小数宽度排版文字时，恰好放得下的项也被折叠，Select `ellipsisTrigger` 少显示标签、`+N` 偏大。
- React：Select 的触发器只在弹层打开时设置 `aria-controls`，关闭时不再指向未渲染的 listbox。
- Vue：Select 用 `v-model`（`modelValue`），`autoFocus` 写作 `autofocus`，`SelectOptionGroupProps` 改名 `SelectOptGroupProps`，`prefix`、`suffix`、`insetLabel`、`emptyContent`、`arrowIcon` 等为同名插槽，render 函数对应 `#optionItem`、`#createItem`、`#selectedItem`、`#tag`、`#trigger`，回调为同名事件（`change`、`select`、`dropdownVisibleChange`、`listScroll` 等）；OverflowList 为 `#item="{ item, index }"`、`#overflow="{ items, position }"` 与 `overflow`、`intersect`、`visibleStateChange` 事件。
- Vue：布尔属性 `onChangeWithObject`（Select、Tree、TreeSelect、Cascader）、`onSelectWithObject`（AutoComplete）改名为 `changeWithObject`、`selectWithObject`，Vue 把 `on` 开头的无值属性当作监听器，服务端渲染时会丢掉，客户端经 attrs 透传时同样会丢；Transfer 的 `treeProps` 不接受 `changeWithObject`。
- Solid：OverflowList 的 scroll 模式观察 `visibleItemRenderer` 返回的元素本身，并在其上写入 `data-scrollkey`（React 克隆元素加属性），只接受 HTML 元素作为项的根，返回文本、null 或 SVG 的项被跳过；`key` 重复的项只渲染一个。
- Solid：Select 的 `ref` 是触发器根元素（外层 Tooltip 以它为锚点），元素上另带 `SelectHandle` 的 `open`、`close`、`clearInput`、`selectAll`、`deselectAll`、`search`、`rePosition`，类型为 `SelectElement`；`focus()` 只聚焦 combobox（搜索框在触发器内时为该搜索框），可搜索时也不展开下拉。`autoFocus` 写作 `autofocus`；`onFocus`、`onBlur` 收到原生 `FocusEvent`（点击外部关闭时为 `MouseEvent`）。
- Solid：`Select.Option`、`Select.OptGroup` 是只携带数据的 token，不渲染自身。破坏性（类型）：`Select.Option`、`optionList` 条目与 `Select.OptGroup` 的 `label` 收窄为 `string | number`，`renderOptionItem` 参数的 `label` 同为文本。`label` 是选项的文本，用于搜索、高亮与回调；`Select.Option` 的 `children` 只作为下拉行与回显的内容（可以是任意 JSX），不再充当 label：只写 children 的选项按 `value` 搜索，回调收到的 `label` 为 `value`，需要按文本搜索时同时写 `label`（`<Select.Option value="a" label="抖音" />`）。分组标题只接受文本。`renderOptionItem` 每行只调用一次，参数是响应式对象（`focused`、`selected` 等随状态更新，在 JSX 之外解构只得到初始值）。
- Solid：位于 InputGroup 中时，组的 `size` 覆盖 Select 自身的 `size`，组的 `disabled` 只在 Select 未设置时生效（同 Input）。

### Form

- 破坏性：删除字段属性 `validate`（只认 `validator`）与 Form 级 `validateFields`；`<form>` 默认带 `noValidate`，传 `noValidate={false}` 恢复浏览器原生校验。
- 破坏性：`onErrorChange` 在 validate、submit、表单级 validator 失败与转为通过、reset 时各触发一次，字段注册、keepState 恢复、ArrayField 增删行不再单独触发。
- 破坏性：表单状态改为不可变更新，每次变化 `onChange`、`useFormState`、render props 拿到新对象；读最新值用 `formApi.getValue(s)()` 或 Field `onChange` 的 `latestValues`。
- 破坏性：未传 `id` 的字段，控件 DOM id 由 `useId` 生成，依赖 `#<field>` 或 `htmlFor` 字面值的代码需显式传 `id`；Form 的 ref 为 `FormHandle { formApi }`，实例上的 `submit`、`reset`、`foundation` 不再存在。
- 破坏性（类型）：`withField` 返回 `ComponentType<FieldProps<ComponentProps<C>>>`，删除 `T`、`R` 类型参数与 `maintainCursor`；字段不再接受 `value`、`defaultValue`、`checked`、`defaultChecked`，改用 `initValue`；`trigger` 收窄为 `FieldValidateTriggerType`；`ArrayField` 的 `field`、`children` 必填。
- 破坏性（类型）：`FormState.errors`、`touched` 与 `onErrorChange` 的 `errors` 改为与值同构的嵌套结构；`FieldPath` 展开深度上限为 5；删除 `FormSelect`、`Field` 类与 `FormSelectType` 等，改用 `FieldProps<P>`、`FormSelectProps<T, Multiple>`。
- 表单级 `validator` 返回或 resolve `{}` 视为通过；Form 卸载或整表 `reset()` 时挂起的 `validate()` 以取消原因 reject；静默校验不再写入 `formState.errors`；`labelPosition="inset"` 下无法内嵌标签的字段（TextArea、Checkbox、Radio、Switch、Upload 等）按 `top` 布局渲染 Label 并在开发模式警告；Form.InputGroup 的 `label` 接受 `LabelProps | ReactNode`。
- 表单值深拷贝时 `Blob`、`File` 按引用保留，不再复制（`File` 不可变，按引用与深拷贝语义相同）。
- Vue：全部具名导出（`Form`、`FormInput`、`FormSelect`、`withField`、`useForm`、`useFormApi` 等），不提供 `withFormApi`、`withFormState`；api 经 `getFormApi` 事件或模板 ref 的 `formApi` 取得，默认作用域插槽 `{ formState, formApi, values }` 替代 `render`、`children`；字段值只由 Form 管理，不支持 `v-model`，字段 `@change` 末参追加 `latestValues`；字段壳插槽为 `#fieldLabel`、`#labelExtra`、`#helpText`、`#extraText`、`#error="{ error }"`，错误只存字符串或布尔；ArrayField 插槽为 `{ arrayFields, onAdd, onAddWithInitValue }`。
- Solid：字段组件只有具名导出（`FormInput`、`FormSelect` 等），`Form` 上只挂 `Section`、`Label`、`ErrorMessage`、`Slot`、`InputGroup` 与 `useForm`，`ArrayField` 单独导出；不提供 `withFormApi`、`withFormState`，`WithFieldOption` 没有 `shouldMemo`。Form 的 `ref` 收到挂着 `formApi` 的 form 元素（`FormElement`），`onSubmit` 的 `e` 为原生 `SubmitEvent`；`useFormState`、`useFieldState` 与 `Form.useForm()` 返回的表单状态是访问器，`useFieldApi`、`useFieldState` 的字段路径可以传访问器。
- Solid：`render`、`component`、声明了参数的函数 `children` 与 ArrayField 的 children 只调用一次，参数是随表单状态更新的活对象，在 JSX 之外解构只得到初始值；无参函数按子节点访问器处理，不传 render props。按表单值渲染字段列表用 `<Index>`，`<For>` 会因每次写值换新对象而反复重建行。Form.InputGroup 照常渲染组内不是字段的子元素（React 会丢弃），组错误按字段注册顺序排列；ArrayField 的 `arrayFields` 行对象在行存在期间保持身份，`field` 随前面行的增删更新，行删除后再调用它的 `remove()` 不生效（React 会删除当前位于原下标的行）。
- Solid：Field 的 `label`、`helpText`、`extraText` 只在各自显示时创建；label 不渲染（`noLabel`、`pure`、InputGroup 内非 inset）时，不再从 label 配置的 `required` 得出 `aria-required`，与 Label 的星号同一条件。ErrorMessage 在 `error` 为全假的数组时不渲染，也不创建 `helpText`。

### Button

- 破坏性：`--semi-button-colorful-*` 改为只读写法，默认值写在 `var()` 回退里，可在 body 或祖先上设置；删除 `--semi-button-colorful-disabled-fill`。
- 破坏性（类型）：`IconButtonProps` 删除 `iconSize`、`iconStyle`；删除 `circle` 属性及 `semi-button-circle` 类，继续传入时落到原生 `button`。
- `loading` 时点击不再触发 `onClick`（submit 不提交），按钮带 `aria-disabled="true"` 并保持可聚焦；带 `icon` 的 Button 只读取 `overrideDefaultProps.Button`。Vue：`icon` 为 `#icon` 插槽，`children` 为默认插槽，回调为 `@click` 等原生事件；`OverrideDefaultProps` 删除 `SplitButtonGroup` 键。
- Solid：`icon` 接受 `JSX.Element` 或图标组件（`Component<{ fill?: IconFill }>`），只有组件形式会收到彩色按钮的 `fill`；没有 `x-semi-children-alias`。

### ButtonGroup

- `disabled`、`size`、`type`、`theme`、`colorful` 只是子按钮的默认值，子按钮自己的值优先（`theme` 原为组优先），显式传 `undefined` 视同未传。
- `data-*`、`id`、`aria-*`、事件等其余属性落在 `role="group"` 根元素，不再传给每个子按钮；组值经 context 下发，被 Tooltip、Popover 包住的后代按钮也继承，弹层内容与组内 Modal、SideSheet 里的按钮不继承；Fragment 与数组子节点被展开。
- Vue：组属性经 provide/inject 下发，自身 `false` 胜过组 `true`；传入的 `role` 覆盖默认的 `group`。
- Solid：分隔线只画在根元素为 Semi Button、IconButton 的直接子项之后，用其他元素包住按钮的子项继承组值但没有分隔线；传入的 `role` 覆盖默认的 `group`。

### Carousel、Typography、ScrollList

- Carousel：`ref.stop()` 后手动切换、焦点离开、幻灯片增加等都不再恢复自动播放，直到 `ref.play()`；`prefers-reduced-motion: reduce` 时不自动播放且无切换动画；键盘焦点进入时暂停自动播放；非当前幻灯片带 `inert`。
- Carousel 箭头改为原生 `<button type="button">`（`arrowProps.*.props` 类型改为 `ButtonHTMLAttributes<HTMLButtonElement>`），指示点改为 `role="tab"` 的 button；新增语言包键 `Carousel.indicators`、`Carousel.slideN`、`Carousel.carousel`、`Carousel.slide`（自定义语言包需补齐）与主题变量 `$radius-carousel_arrow`，箭头高度由 39px 改为 32px。
- Typography 的复制按钮与展开、收起控件改为原生 `<button type="button">`，`ellipsis.onExpand` 事件类型改为 `React.MouseEvent<HTMLButtonElement>`，复制按钮不再带内联 `margin-left`；`ellipsis` 对象中写成 `undefined` 的 `rows`、`pos`、`suffix` 取默认值（`1`、`'end'`、`''`）；无 `href` 的 `link` 有点击监听时获得 `role="link"`；`disabled` 的 `link` 不再触发 `link.onClick`。
- 破坏性：Numeral 不再支持函数 children；`CopyableConfig`、`LinkType` 的深路径从 `typography/title` 移到 `typography/interface`；`BaseTypographyProps` 不再从入口导出；类型上 `ScrollItemProps` 不再包含 `children`，ScrollItem 的 `motion` 收为 `boolean`，`onSelect` 参数收窄为 `T & { type?: string | number; index: number }`。
- ScrollList 的各列不显示滚动条（原来随系统设置显示），用滚轮、拖动或方向键滚动。
- React：新增 `TypographyTitle`、`TypographyText`、`TypographyParagraph`、`TypographyNumeral` 命名导出，与 `Typography.Title` 等是同一组件，供 Server Component 直接使用（点语法在 Server Component 中为 `undefined`）。
- Vue：Typography 的 `copyable` 只接受 `boolean | { content, duration, class, style }`，插槽 `#copyIcon`、`#copyTip`、`#copySuccessTip`、`#copyAction`、`#icon`、`#ellipsisTooltip="{ content, trigger }"`、`#ellipsisContent`，事件 `copy`、`expand(expanded, e)`；Carousel 用 `v-model:activeIndex` 与 `@change`，箭头为 `#leftArrow`、`#rightArrow`；ScrollList 的 `header`、`footer` 为同名插槽，ScrollItem 用 `select` 事件与 `v-model:selectedIndex`。
- Solid：Carousel 根元素的焦点回调写作 `onFocusIn`、`onFocusOut`（div 的 `onFocus`、`onBlur` 收不到后代的焦点事件），`ref` 拿到根元素 `CarouselElement`，其上带 `play`、`stop`、`goTo`、`prev`、`next`；幻灯片是使用方自己的 HTML 元素（文本节点与 SVG 被忽略），Carousel 就地加上 class、过渡样式、`inert`、role 与 aria 属性，不克隆，原有的 id、role、aria-* 保留。
- Solid 破坏性：箭头内容由 `arrowProps.leftArrow.children`、`arrowProps.rightArrow.children` 改为 Carousel 的 `leftArrow`、`rightArrow` 属性（`JSX.Element`，`null` 时按钮为空，与 Vue 的 `#leftArrow`、`#rightArrow` 一致），只在显示箭头时创建，`ArrowButton` 只剩 `props`；箭头按钮的 `x-semi-prop` 改为 `leftArrow`、`rightArrow`。
- Solid：Typography 的 `icon` 接受 `JSX.Element` 或图标组件，只有组件形式会收到按文字尺寸推出的 `size`；`copyable` 配置与 `link` 的样式类名写作 `class`；`copyable.render` 在 `copied` 变化时重新调用。
- Solid 破坏性（类型）：`copyable` 配置的 `copyTip`、`successTip` 改为 `string | (() => JSX.Element)`，`icon` 改为 `() => JSX.Element`（`icon: () => <X />`），只在对应内容显示时调用。
- Solid：省略计算、省略提示（Tooltip、Popover 的内容与 `renderTooltip` 的第一个参数）和默认复制内容取 children 的纯文本，元素取其 `textContent`；省略的截断、展开与收起不重新创建 children。
- Solid 破坏性：Numeral 只格式化字符串与数字 children，每个分别格式化（动态插值 `{price()}` 单独成段，与 React 一致）；元素 children（含子组件渲染出的元素）原样输出，其中的文字不格式化。copyable 按钮的可访问名称只取字符串的 `copyTip`（未复制时）与 `successTip`（已复制时），否则用语言包的 `copy`、`copied`；`icon`、`successTip` 渲染出的元素上的 `aria-label` 不再参与命名。
- Solid：ScrollItem 的 `ref` 拿到根元素 `ScrollItemElement`，其上带 `scrollToIndex`，未声明属性落在根 div；ScrollList 的 `ref` 是根元素。`bodyHeight` 为数字时补 `px`，为 0 时不设高度；`header`、`footer` 为空串时不渲染。wheel 模式点击选项时，祖先的 `onClick` 收不到这次点击（同 Vue）。

### AutoComplete、TagInput、Avatar、PinCode

- 破坏性：AutoComplete 删除 `getPopupContainer`、`zIndex`、`AutoComplete.Option` 与 `children`（改用 `Select.Option`），删除深路径 `@fibrae/semi-ui-react/auto-complete/option`、`@fibrae/semi-foundation/auto-complete/optionFoundation`；`style.width` 不再复制为下拉最小宽度。
- 破坏性（类型）：AutoComplete 的 `defaultValue` 收窄为 `string | number`，`onKeyDown` 参数改为 `KeyboardEvent<HTMLDivElement>`，删除 `mouseEnterDelay`、`mouseLeaveDelay`、`tabIndex`；输入框角色改为 combobox（按 textbox 查询的测试需改为 combobox），`id` 落在输入框上。
- 破坏性（类型）：TagInput 的 `onFocus`、`onBlur` 参数改为 `React.FocusEvent<HTMLDivElement>`，`onInputChange` 第二个参数改为 `React.SyntheticEvent`，`value` 为 `string[] | null`，ref 为 `TagInputHandle { focus, blur }`；`AvatarState.hoverContent` 改为 `hovered: boolean`。
- 破坏性（样式钩子）：TagInput 悬停改由 CSS `:hover` 提供，不再加 `semi-tagInput-hover` 类；删除 `semi-tagInput-clearBtn-invisible` 与 `semi-avatar-focus`。TagInput 清除按钮与拖拽句柄改为带名称（`TagInput.clear`、`TagInput.dragSort`）的原生 button，`onFocus`、`onBlur` 以整个组件为界。
- Avatar：可点击头像的焦点目标为 `role="button"`（按 `img` 查询的测试需改为 button），不再加语言包 `Avatar.clickable` 前缀（键已删除）；AvatarGroup 未声明属性落在根 div，`size`、`shape` 经 context 下发到被 Tooltip、Popover 包住的头像。PinCode：`autoFocus` 默认值由 `true` 改为 `false`，需要时显式传 `autoFocus` 或用 `PinCodeHandle.focus(0)`。
- Avatar：`border.motion` 的外圈动画只放大并淡出，边框粗细不再随动画变细到 0（原来每帧触发布局与重绘）；删除 Sass 变量 `$animation_width-additionalBorder-end`。
- React：服务端渲染的 Avatar 图片在 hydration 前已加载失败时，hydration 提交后调用 `onError` 并显示文字（原来保留破图）。
- AutoComplete：下拉中有可聚焦元素（`renderItem`、`emptyContent` 里的按钮或链接）时，方向键只移动高亮，焦点不再移入下拉。
- Vue：AutoComplete、PinCode、TagInput 用 `v-model`（`modelValue`，TagInput 另有 `v-model:inputValue`），回调为同名事件，`autoFocus` 写作 `autofocus`；AutoComplete 的 `renderItem`、`triggerRender` 为 `#item`、`#trigger`，`prefix`、`suffix`、`insetLabel`、`clearIcon`、`emptyContent` 只有插槽，ref 为 `{ nativeElement }`；TagInput 插槽 `#prefix`、`#suffix`、`#insetLabel`、`#clearIcon`、`#tag`；PinCode 新增按整组计的 `focus`、`blur` 事件。
- Solid：AvatarGroup 只给 Avatar 加重叠类（经 context，包括被 Tooltip 包住的头像），其他子元素不加；Avatar 的 `onError` 类型为 `() => boolean | void`。
- Solid 破坏性：AvatarGroup 的 `renderMore` 签名为 `(restNumber: number, restAvatars: ((props?: AvatarProps) => JSX.Element)[]) => JSX.Element`。超出 `maxCount` 的头像在组内不创建，`restAvatars` 的每一项是渲染函数，在调用处才创建该头像（独立头像，不是列表项，不取组的 `size`、`shape`），传入的属性覆盖头像自身的属性（如 `avatar({ size: 'extra-small' })`，对应 React 的 `cloneElement`）；`maxCount` 与 React 一样按子节点计数，包装元素（如 Tooltip）里的头像随包装元素整体隐藏，不单独隐藏，`maxCount` 变化或增删子节点时由后面的子节点补位。默认 `+N` 头像的名称只列被隐藏头像的 `alt`。
- Solid 破坏性（类型）：Avatar 的 `topSlot.text`、`bottomSlot.text` 改为 `AvatarSlotText`（`string | number | (() => JSX.Element)`，从包入口导出），自定义内容写成函数 `text: () => <IconPlus />`，只在标记实际显示时（预设尺寸，topSlot 另需圆形）调用；`render` 仍完全替换标记。
- Solid：AutoComplete 的 `ref` 是根 div，其 `focus()`、`blur()` 转给输入框，用 `triggerRender` 时没有可转交的输入框，`ref.focus()` 不移动焦点（React 聚焦根 div）；`autoFocus` 写作 `autofocus`，`onFocus`、`onBlur` 收到原生 `focusin`、`focusout`；`id`、`name` 与 `aria-*` 落在输入框；数据项的类名字段为 `class`；`triggerRender` 的参数字段是 getter，在 JSX 之外解构只得到当前值；`stopPropagation` 只接受布尔值。破坏性（类型）：`data` 对象项的 `label` 收窄为 `string | number`，标记内容经 `renderItem` 渲染。
- Solid：PinCode 的 `ref` 是 `role="group"` 根元素，其 `focus()` 聚焦第一个空格子（全部填满时聚焦最后一格），`blur()` 释放持有焦点的格子；不提供 `PinCodeHandle` 的 `focus(index)`、`blur(index)`，聚焦某一格用 `ref.querySelectorAll('input')[index].focus()`。`autoFocus` 写作 `autofocus`；`onFocus`、`onBlur` 按整组计（同 Vue）；`id` 落在第一个输入框上；Form 注入的 `name` 被丢弃。
- Solid：TagInput 的 `ref` 是 `role="group"` 根元素，其 `focus()` 聚焦文本输入框并进入激活状态，`blur()` 释放其中的焦点并结束激活，不提供 `TagInputHandle`。`autoFocus` 写作 `autofocus`；`onFocus`、`onBlur` 收到原生 `focusin`、`focusout`，`onInputChange`、`onKeyDown` 收到原生事件；`id`、`name`、`role`、`tabIndex` 与 `aria-*` 落在文本输入框；`renderTagItem` 在标签的下标或值变化时重新调用；在 `+N` 浮层、`suffix` 中的 Tooltip 等内部弹层里按下鼠标不结束激活（同 Vue）。拖拽排序按需加载，加载前显示不带手柄的标签列表。
- Solid：Avatar 的 `hoverMask` 在悬停时才读取并创建，挂载时不创建。

### Chat、AIChatInput、AIChatDialogue

- 破坏性（类型）：AIChatInput 的 `uploadProps` 为 `Omit<UploadProps, 'fileList' | 'listType'>`，Chat 的为 `Omit<UploadProps, 'fileList' | 'defaultFileList'>`；`markdownRenderProps` 不再接受 `raw`、`ref`（Chat 还不接受 `components`，改用 `customMarkDownComponents`）；`ChatProps` 不再接受 `children`；`FileItem`、`BaseFileItem` 删除索引签名。
- 破坏性（类型）：`onSkillChange`、`renderTemplate` 的 `skill` 加入 `undefined`，`getEditor` 返回 `Editor | null`；`getConfigureItem` 改为泛型且 `onChange` 为 `(value: unknown) => void`；`ResponseChunk` 改为按 `type` 区分的联合；两处 `Reference` 统一为 `id` 必填、`type` 可选；`Metadata.color` 收窄为 `AvatarProps['color']`；删除 `onSuggestClick`、`onTemplateVisibleChange`；`@fibrae/semi-ai-react/ai-chat-input/extension/status-extension` 迁到 `@fibrae/semi-ai-foundation/ai-chat-input/extension/status-extension`。
- 破坏性（深路径导入）：`@fibrae/semi-ai-foundation` 的 `chat/constants`、`ai-chat-input/constants` 中 `strings` 删除 `PIC_SUFFIX_ARRAY`、`PIC_PREFIX`，判断图片改用 `@fibrae/semi-ai-foundation/file-suffix` 的 `isImageFile`。
- 破坏性（类型）：`renderDialogueAction` 的 `defaultActions` 现包含分享与编辑按钮，顺序为 copy、like、dislike、reset、share、edit、more，自定义操作栏会多出这两个按钮；`status` 为 `incomplete` 视为终止状态，`queued` 隐藏操作栏。
- 行为变化（React）：AIChatInput 的 `immediatelyRender` 默认值改为 `false`，编辑器在挂载后创建，首个提交中 `getEditor()` 返回 `null`；服务端渲染不再打印 tiptap 的告警。纯客户端渲染需要首个提交就有编辑器时显式传 `immediatelyRender`。
- 行为变化：`onMessageCopy` 在剪贴板写入成功后才触发，无文本可复制时不触发；`sendMessage(content)` 无附件时 content 为字符串；重新生成清除旧回答的 `like`、`dislike`、`error`、`references`；`createAt` 改为 `createdAt`；`markdownRenderProps.components` 与内置组件合并而非整体替换；消息列表与滚动条始终可用，类名 `semi-chat-container-scroll-hidden`、`semi-ai-chat-dialogue-list-scroll-hidden` 已删除；AIChatDialogue 引用列表按文件名的扩展名显示文件图标，没有扩展名或以点开头的名字（如 `doc`、`.js`）不显示。
- 样式与结构：提示项、上传触发器、引用项、附件移除按钮等改为原生 `button`；Chat 提示项由 `div` 改为 `button`；AIChatInput 默认上传触发器为带 `aria-label` 的 `button`，`renderUploadButton` 的 `defaultNode` 即该按钮，不要再包一层 button；`RenderSkillItemProps`、`RenderSuggestionItemProps` 新增 `id`、`role`、`aria-selected`，需展开到根元素；删除 SCSS 变量 `$height-aiChatDialogue_file`、`$height-aiChatInput_attachment`、`$height-aiChatInput_footer_configure_radio_button`、`$width-chat_attachment_file`；模板按钮不再是 Configure 项，`setup` 与 `onConfigureChange` 不再含 `template`；新增语言包键 `AIChatInput.send`、`AIChatInput.stop`、`AIChatInput.upload`、`AIChatDialogue.copy`，自定义语言包需补齐。
- Vue：渲染函数改为作用域插槽，如 AIChatDialogue 的 `#avatar`、`#title`、`#content`、`#action`、`#fullDialogue`、`#contentItem`、`#messageEdit`、`#hintBox`，Chat 的 `#title`、`#avatar`、`#content`、`#action`、`#fullChatBox`、`#inputArea`、`#divider`，AIChatInput 的 `#reference`、`#topSlot`、`#uploadButton`、`#configureArea`、`#actionArea`、`#suggestionItem`、`#skillItem`、`#template`；回调为事件（如 `messageSend`、`messageCopy`、`chatsChange`、`contentChange`，`chats` 用 `v-model:chats`），`select`、`click`、`focus`、`blur`、`paste` 会遮住同名原生事件；`Skill`、`DialogueStep` 数据项无 `icon`，改用 `#skillIcon`、`#actionIcon`。
- Solid：AIChatInput 的 `ref` 拿到根元素 `AIChatInputElement`，其上带 `AIChatInputHandle` 的方法；编辑器在挂载时创建，此前 `getEditor()` 为 `null`，不提供 `immediatelyRender`；`extensions`、`defaultContent`、`showPlaceholderWhenSkillOnly` 只在创建编辑器时读取；`onFocus`、`onBlur`、`onPaste` 收到编辑器区域的原生 `focusin`、`focusout`、`paste`。破坏性（类型）：`renderUploadButton` 的 `defaultNode` 是创建默认上传按钮的渲染函数 `() => JSX.Element`，在插入处调用 `defaultNode()`；自定义节点不调用时不创建默认按钮。
- Solid：AIChatInput 的 `renderTopSlot`、`renderUploadButton`、`renderReference`、`renderSkillItem`、`renderSuggestionItem`、`renderActionArea`、`renderConfigureArea` 的参数字段是 getter，函数只在自身被替换时重新调用（`renderTemplate` 在当前 skill 变化时也重新调用）；渲染参数与 `getConfigureItem` 的类名字段为 `class`，`templatesStyle` 只接受对象；`uploadTipProps` 与自定义上传节点同用时，提示用 span 包住该节点；Configure 的 `value`、`defaultValue`、`ref` 只在创建时读取，子项随所属 owner 销毁而从值中移除。
- Solid：Chat 的 `ref` 拿到根元素 `ChatElement`，其上带 `resetMessage`、`clearContext`、`scrollToBottom`、`sendMessage`；消息行按 `id` 保留 DOM（没有 `id` 或 `id` 重复的按位置），流式输出替换消息对象时，已有消息的节点、操作按钮与输入框的焦点和内容不变。`chatBoxRenderConfig` 的各渲染函数与 `renderInputArea`、`renderHintBox`、`renderDivider` 的参数字段是 getter，每条消息（或每个实例）只调用一次，函数本身被替换时才重新调用（`renderChatBoxAction` 在默认按钮集合变化时也重新调用）；破坏性（类型）：`defaultNodes` 的各项、`defaultTitle`、`defaultAvatar`、`defaultContent`、`renderInputArea` 的 `defaultNode` 与 `detailProps` 里的各节点是渲染函数 `() => JSX.Element`，在插入处调用，每次调用新建一个节点，没调用的不创建；`renderChatBoxAction` 的 `defaultActions` 是按显示顺序排列的按钮渲染函数 `(() => JSX.Element)[]`，`defaultActionsObj` 的各键也是 `() => JSX.Element`，在插入处调用，没调用的按钮不创建；渲染参数的类名字段为 `class`。
- Solid：Chat 的 `inputBoxStyle`、`hintStyle` 接受对象或字符串；`uploadTipProps` 与自定义 `uploadProps.children` 同用时，提示用 span 包住该节点，描述落在 span 上。`onMessageReset` 的参数类型为 `Message | null`，由 `resetMessage` 方法触发时为 `null`（同 Vue）。
- Solid 破坏性：数据只放数据（同 Vue）。Chat `roleConfig` 的 `avatar` 只接受图片地址 `string`，其他头像内容由 `chatBoxRenderConfig.renderRoleAvatar({ role, message })` 渲染在内置头像内（对应 Vue 的 `#roleAvatar`），新增导出类型 `ChatRenderRoleAvatarProps`；AIChatInput 的 `Skill` 删除 `icon`（类型不再继承 foundation 的 `BaseSkill`，索引签名为 `unknown`），技能面板每项的图标由 `renderSkillIcon(skill)` 提供（对应 Vue 的 `#skillIcon`）；`Configure.Mcp` 的 `McpOption` 删除 `icon`（索引签名为 `unknown`），菜单项图标由 `renderOptionIcon(option)` 提供（对应 Vue 的 `#optionIcon`）。
- Solid：AIChatDialogue 的 `ref` 是根元素 `AIChatDialogueElement`，其上带 `selectAll`、`deselectAll`、`scrollToBottom`、`scrollToTop`，不提供 `continueSend`（React 中写死为 false）；`style`、`hintStyle` 接受对象或字符串；`AIChatDialogue.Annotation` 的 `onClick` 收到原生 `MouseEvent | KeyboardEvent`；消息行按 `id` 复用，流式更新与无关属性变化不重建已有消息的 DOM 和焦点。
- Solid：AIChatDialogue 的 `dialogueRenderConfig` 各渲染函数、`renderHintBox` 与 `Reasoning` 的 `customRenderer` 参数字段是 getter，只在函数本身被替换时重新调用，类名字段为 `class`；`messageEditRender` 在消息进入编辑时调用一次；`renderDialogueContentItem` 的渲染函数在所渲染的项变化时重新调用并重建其内容，收到的 `message` 是调用时的值；`renderDialogueAction` 的 `defaultActions` 是按显示顺序排列的按钮渲染函数 `(() => JSX.Element)[]`，`defaultActionsObj` 的各键也是 `() => JSX.Element`（破坏性，类型），在插入处调用，没调用的按钮不创建，可见按钮集合变化时重新给出。破坏性（类型）：`defaultTitle`、`defaultAvatar`、`defaultContent` 与 `renderFullDialogue` 的 `defaultNodes`（`avatar`、`title`、`content`、`action`）是渲染函数 `() => JSX.Element`，在插入处调用，没调用的节点不创建。带语言的代码块外层不包 `pre`（React 保留），没有 `pre` 的默认上下外边距。

### Spin、Skeleton

- Spin 的加载指示器由 `div` 改为 `<output>`；加载中被包裹内容带 `inert`（List、Table 的 `loading` 同样），不可聚焦；`className` 落在根元素并与 `wrapperClassName` 合并；破坏性（类型）：Skeleton 占位的 `size` 只接受 `extra-extra-small` 到 `extra-large`，`shape` 只接受 `circle`、`square`，`Skeleton.Paragraph` 不再声明 `type`，`GenericProps` 即 `AvatarProps`。Vue：Spin 的 `indicator`、`tip`、Skeleton 的 `placeholder` 改为同名插槽；`Skeleton.Image`、`Title`、`Button` 不接受 `size`、`shape`；类型改名为 `SkeletonBasicProps`、`SkeletonAvatarProps`、`SkeletonParagraphProps`，`GenericProps` 删除。

### Space

- 不再展开 Fragment 与嵌套数组，条件兄弟切换不再重挂载有状态子组件；用户 `style` 的 `columnGap`、`rowGap` 始终优先于数字 `spacing`；破坏性（类型）：`spacing` 数组类型收窄为 `[Spacing, Spacing]`，CardGroup 的 `spacing` 同步收窄。Vue：直接渲染默认插槽，不包裹子节点，数字 `spacing` 输出 `px`。
- Solid：同 Vue，直接渲染 `children`，不包裹子节点，数字 `spacing` 输出 `px`。

### Divider

- `children` 全是文本（含数字 `0`）时包进 `semi-divider_inner-text`；无文字内容时根元素带 `role="separator"`，可用 `role` 覆盖。Vue：内容用默认插槽，规则相同。

### Progress

- 破坏性：`stroke` 与 `strokeGradient` 颜色改由浏览器解析，色板名输出 `var(--semi-blue-5)` 形式，渐变中间色用 `color-mix`；逗号与斜杠混写的颜色（如 `hsla(125, 50%, 46% / 1)`）不再被接受，改为合法 CSS；`@fibrae/semi-foundation/progress/generates` 的 `generateColor` 改为输出 CSS 表达式；删除 `ProgressState` 子路径导出。
- 破坏性（类型）：`ProgressProps` 不再接受 `children`，`motion` 收为 `boolean`；`type="circle"` 且 `size="large"` 按 default 渲染为 72px。Vue：`format` 改为 `#format="{ percent }"` 插槽；`percent` 为 NaN 时抛 `[Semi Progress]:percent can not be NaN`。

### Empty

- 破坏性（类型）：`image`、`darkModeImage` 的对象形式只接受 `{ id: string }`；`image` 传空字符串视为无图片；插画 `alt` 为空，标题渲染为 `div`。Vue：`title`、`description`、`image`、`darkModeImage` 用同名插槽，默认插槽是底部操作区；暗色模式挂载后观察 `document.body` 的 `theme-mode`。
- Solid：暗色模式同 Vue，每个实例挂载后观察 `document.body` 的 `theme-mode`，挂载后再传入的 `darkModeImage` 也随之切换。

### Feedback

- 破坏性（类型）：`FeedbackProps` 按 `mode` 判别（`FeedbackModalProps` 的 `mode` 必填为 `'modal'`，`FeedbackSideSheetProps` 为可选 `'popup'`），popup 下传 Modal 专属属性报类型错误；`onCancel` 参数为 `React.MouseEvent | KeyboardEvent`；checkbox 的 `onValueChange` 值为 `(string | number | boolean)[]`；表情选择改为 `role="radiogroup"` 的原生 radio，外层 `span` 改为 `label`；radio、checkbox 选项组需用 `radioGroupProps`、`checkboxGroupProps` 的 `aria-label` 命名。
- Vue：`visible` 支持 `v-model:visible`，取消路径在 `onCancel` 返回后发出 `update:visible(false)`，确定只调用 `onOk`；`onOk`、`onCancel` 仍是函数 prop，其余回调为事件 `valueChange`、`afterClose`、`afterVisibleChange`；children、`renderContent`、`footer`、`title`、`modalRender` 等节点改为插槽（`#content`、`#modal`、`#radioLabel` 等）；子组件属性对象的受控键为 `modelValue`。
- Solid：`class`、`style` 与 `data-*` 落在 SideSheet 或 Modal 的外层元素（同这两个组件）；`onOk`、`onCancel` 返回 Promise 时按钮显示加载态，其他返回值（如 signal setter 的结果）被忽略；内容随弹层的显示创建与释放。

### JsonViewer

- 破坏性（类型）：`JsonViewerProps` 不再接受 `children`、`dangerouslySetInnerHTML`，删除从未生效的 `renderTooltip`；`value`、`width`、`height` 改为可选；`ref` 为 `JsonViewerHandle` 而非类实例；`options` 默认值按键合并，只传部分选项时 `autoWrap` 仍为 `true`；`customRenderRule` 的 `render` 返回 `null`、`undefined`、`false` 时保留 token 原文。
- 搜索栏容器由 `div` 改为原生 `search` 元素（类名不变，`div.semi-json-viewer-search-bar-container` 选择器需改），大小写、正则、全词选项改为按钮，自定义语言包需补 `JsonViewer.caseSensitive`、`JsonViewer.regex`、`JsonViewer.wholeWord`。Vue：`value` 改名 `modelValue` 配合 `v-model`；`customRenderRule[].render` 改为 `#customRender="{ item, index, content }"` 插槽；`renderSearchButton` 改为 `#searchButton`。
- 构建插件配置了 `prefixCls` 时，悬停字符串值同样触发 `hoverNode`（原来判断写死了 `semi-` 类名，自定义前缀下悬停字符串值没有反应）。
- Solid：`ref` 拿到根元素 `JsonViewerElement`，其上带 `JsonViewerHandle` 的方法；破坏性（类型）：`renderSearchButton` 的第一个参数改为创建默认按钮的函数 `() => JSX.Element`，在插入处调用 `defaultButton()`；`renderSearchButton` 只调用一次，`searchControls.showSearchBar` 是随状态更新的 getter，需要在返回的 JSX 中读取；`customRenderRule[].render` 返回 JSX，放进带 token 类名的 span，在继承 JsonViewer 所在位置 context 的独立 root 中执行，下一次布局或卸载时释放；搜索栏用 `preventDefault` 认领 Esc，祖先元素的 JSX 处理函数收不到，document 上的监听仍会收到已标记 `defaultPrevented` 的事件（React 中收不到）。

### Collapse

- 破坏性：删除 `reCalcKey`（Collapsible、Collapse.Panel）与静态方法 `Collapsible.getEntryInfo`；`onChange` 事件类型收窄为 `MouseEvent`，`activeKey` 类型加入 `null`（受控空值，`''` 与 `null` 收起全部面板）；Collapsible 的高度过渡改用 `calc-size(auto, size)`，外层不再有内联 `height`，改由 `--semi-collapsible-height` 写入。不支持 `calc-size()` 的浏览器（Firefox、Safari）同样播放高度动画，时长与曲线不变，`onMotionEnd` 在动画结束时调用。
- 面板头部按 APG accordion 改为原生 `<button class="semi-collapse-header-button">`，`extra` 与展开箭头在按钮之外；`clickHeaderToExpand={false}` 时点击标题与箭头展开，点击 `extra` 不展开；收起内容带 `inert`。Vue：受控用 `v-model:activeKey`，`change` 载荷总是 `string[]`；`expandIcon`、`collapseIcon`、Panel 的 `header`、`extra` 改为插槽；`onMotionEnd` 改为 `motionEnd` 事件；Collapsible 的 `className` 改为 `class`。
- Collapsible 使用方传入的 `onTransitionEnd` 不再被内部处理覆盖。
- React、Solid：`keepDOM` 加 `lazyRender` 时，面板内容消失后「展开过」的记录随之复位，内容在收起状态下恢复时不渲染、头部不带 `aria-controls`，重新展开后才渲染（同 Vue）。
- Solid：`Collapse.Panel` 按是否传入 children 判断有无内容，不对 children 求值，求值为空的 children（如 `{cond() && <X />}` 为 false）仍渲染空内容区并启用箭头。

### BackTop

- 破坏性（类型）：`BackTopProps` 收窄为实际接受的属性，不再含按钮的 `type` 与 `form*`；`target` 类型为 `() => Window | HTMLElement | null`；`ref` 指向 `HTMLButtonElement`。
- 破坏性：基于 FloatButton 渲染为原生 `<button>`，新增 `icon`、`shape`、`size`、`colorful`、`badge`；`<BackTop><IconArrowUp /></BackTop>` 改为 `<BackTop icon={<IconArrowUp />} />`，宽高、圆角、背景色改用 `shape`、`size`、`colorful`，`.semi-backtop > .semi-button` 选择器改为 `button.semi-backtop`，覆盖定位需 `.semi-floatButton.semi-backtop` 的权重。Vue：`onClick` 改为 `click` 事件（经 `duration` 节流），`children` 为默认插槽，`icon` 为 `#icon`，`badge.count` 节点用 `#badgeCount`；`overrideDefaultProps.BackTop` 不能设置 `click`。

### Timeline、List

- 破坏性（类型）：List 的 `grid` 只接受 Row 与 Col 的指定属性，不再接受任意 div 属性（如 `id`）；Timeline `dataSource` 项的 `Data` 不再接受 `children`，改用 `content`。
- 可点击的 List.Item 在 li 内渲染原生 `<button>` 作为唯一焦点目标，`tabIndex`、`aria-*` 落在按钮上，点击 `extra` 内元素不再触发 `onClick`，children 中的交互内容需移到 `extra`；新增类名 `semi-list-item-clickable`、`semi-list-item-button`；可点击的 Timeline.Item 的 children 外包一层 `role="button"` 的 `semi-timeline-item-content-main`；依赖 `.semi-list-items .semi-list-empty` 的选择器改为 `.semi-list-empty`；`children` 为空数组时显示空状态。
- Vue：Timeline 的 `dataSource` 项 `content`、`time`、`extra` 只接受 `string | number`，自定义内容用 `#content`、`#dot`、`#time`、`#extra` 插槽；List 的 `renderItem` 改为 `#item="{ item, index }"`，`header`、`footer`、`emptyContent`、`loadMore` 改为同名插槽，`onClick`、`onRightClick` 是函数属性（写 `@click`、`@rightClick`），`grid` 里 `className` 改为 `class`。
- Solid：Timeline 的 children 中只渲染 `Timeline.Item`，文本等其他子节点不渲染并在开发期告警；放在 Timeline 外的 `Timeline.Item` 单独写时不渲染，在数组中显示为 "[object Object]"；`extra`、`time` 为 `0` 时渲染对应区块。
- Solid 破坏性（类型）：Timeline `dataSource` 项的 `content`、`time`、`extra` 只接受 `string | number`，删除 `dot` 字段，自定义内容用 `renderContent`、`renderDot`、`renderTime`、`renderExtra`（参数 `(item, index)`，`renderDot` 没有默认值）。`Timeline.Item` 的 `dot`、`time`、`extra` 不变。
- Solid：可点击的 List.Item 的 `ref` 为 li，`focus()`、`blur()` 作用于项内按钮；`renderItem` 同 `<For>` 回调一样不追踪，只在 `renderItem`、项或 index 变化时重算该行，函数体中 JSX 之外读取的 signal 变化不会重算。
