# 发布说明

本文记录 Semi Design Next 相对上游 Semi Design 的破坏性变化与使用方需要注意的行为变化；决策依据与未结的问题见 docs/decisions.md。

每条只写使用方要改什么或会看到什么，一两句话，不写实现细节与原因；各框架相同的变化只写一次，以框架名开头的条目（如「Vue：」）只列该框架特有的差异。

## 全局

- 支持 Chrome 120、Firefox 125、Safari 17.2 及以上（D15）。支持 Safari 17.4 以下时，在应用入口最先 `import '@fibrae/semi-polyfill'`，它只补齐 `AbortSignal.any` 与 `Element.prototype.checkVisibility`。
- 破坏性：React 包支持 React 19，Vue 包支持 Vue 3.5+。React 组件都是函数组件，ref 不再是类实例：有命令式方法的组件经 `XxxHandle` 暴露（如 `SelectHandle`、`DatePickerHandle`、`FormHandle`），其余指向根 DOM。删除 `BaseComponent` 导出与组件的 `propTypes` 静态属性。
- 破坏性：包名 `@fibrae/semi-ui` 改为 `@fibrae/semi-ui-react`，`@fibrae/semi-ai` 改为 `@fibrae/semi-ai-react`，`@fibrae/semi-illustrations` 改为 `@fibrae/semi-icons-react/illustrations`；`@fibrae/semi-foundation`、`@fibrae/semi-ai-foundation` 不变，类名不变。
- 破坏性：插画并入图标包（D17），不再发布 `@fibrae/semi-illustrations-{react,vue,solid,svelte}`。`@fibrae/semi-illustrations-<框架>` 改为 `@fibrae/semi-icons-<框架>/illustrations`，单个插画的深路径改为 `@fibrae/semi-icons-<框架>/illustrations/illustration-<name>`，导出名不变；依赖中删除插画包。
- 破坏性：图标包 `@fibrae/semi-icons` 改为 `@fibrae/semi-icons-react`，如 `@fibrae/semi-icons/lab` 改为 `@fibrae/semi-icons-react/lab`，`@fibrae/semi-icons/styles/icons.scss` 改为 `@fibrae/semi-icons-core/styles/icons.scss`。新增 `@fibrae/semi-icons-core`，放图标与插画的框架无关数据（`@fibrae/semi-icons-core/lab`、`@fibrae/semi-icons-core/illustrations`，单个插画的深路径为 `@fibrae/semi-icons-core/illustrations/illustration-<name>`），semi-icons-react 已依赖它。semi-icons-react 的深路径 `components/Icon`、`components/createIcon` 改为 `components/icon`、`components/create-icon`。
- 破坏性：AI 组件拆为独立包（D9）：AIChatInput、AIChatDialogue、Chat、Sidebar、Annotation、MCPConfigure 与 `getConfigureItem`、`chatCompletionToMessage` 等改从 `@fibrae/semi-ai-react` 导入。深路径 `@fibrae/semi-ui-react/{ai-chat-input,ai-chat-dialogue,chat,sidebar}/...` 改为 `@fibrae/semi-ai-react/...`，`@fibrae/semi-foundation/{同上}/...` 改为 `@fibrae/semi-ai-foundation/...`。
- 破坏性：`@fibrae/semi-ui-react/styles.css` 不含 AI 样式，整包加载时在其后引入 `@fibrae/semi-ai-react/styles.css`（自定义前缀用 `semi-build-scss --ai <semi-ai-foundation>`）；`OverrideDefaultProps` 引入 AI 包后才含 AI 组件名。新增对应的 `@fibrae/semi-ai-vue`、`@fibrae/semi-ai-solid`、`@fibrae/semi-ai-svelte`，样式在对应 UI 包的 `styles.css` 之后引入各自的 `styles.css`（如 `@fibrae/semi-ui-vue/styles.css` 之后引入 `@fibrae/semi-ai-vue/styles.css`）。
- 破坏性：目录与文件名统一为 kebab-case（D4）：`@fibrae/semi-ui-react/iconButton/index` 改为 `@fibrae/semi-ui-react/icon-button/index`，`@fibrae/semi-foundation/datePicker/datePicker.scss` 改为 `@fibrae/semi-foundation/date-picker/date-picker.scss`，`@fibrae/semi-ui-react/table/Table` 改为 `@fibrae/semi-ui-react/table/table`；单个图标与插画的深路径改为导出名的 kebab-case，如 `@fibrae/semi-icons-react/icons/IconHome` 改为 `@fibrae/semi-icons-react/icons/icon-home`、`@fibrae/semi-icons-react/illustrations/IllustrationNoContent` 改为 `@fibrae/semi-icons-react/illustrations/illustration-no-content`；`@fibrae/semi-animation/styles/viewTransition.css` 改为 `@fibrae/semi-animation/styles/view-transition.css`。导出名、类名（含 `semi-icon-<SVG 文件名>`）、Sass 变量名与语言包文件名不变。文档站页面路径同样改为 kebab-case，如 `/input/datepicker` 改为 `/input/date-picker`。
- 破坏性（深路径）：四个框架的 UI 包与 AI 包按 D18 整理组件目录：入口组件是与目录同名的文件，`index` 只做导出，`<组件>/index` 深路径不变；有两个及以上 hook 的组件把 hook 放进 `hooks/`（Vue 为 `composables/`，Solid 为 `primitives/`）；多个文件组成的部分放进以该部分命名的子目录，如 `@fibrae/semi-ui-vue/form/composables/use-form-api`、`@fibrae/semi-ui-solid/table/table-header/head-table`、`@fibrae/semi-ui-svelte/form/fields/form-input.svelte`、`@fibrae/semi-ui-svelte/image/preview/preview.svelte`。semi-ui-react：`button/button` 改为完整的 Button，原不带 icon 的基础渲染器改为 `button/base-button`；`table/table` 改为 Table 入口，原表格主体改为 `table/normal-table`，`table/body/index` 改为 `table/body/body`，`table/{table-header,table-header-row,head-table,resizable-header-cell}` 改为 `table/table-header/<名>`；`image/preview`、`image/preview-*` 改为 `image/preview/<名>`；`calendar/use-*` 改为 `calendar/hooks/use-*`；`form/base-form` 改为 `form/form`，`form/hoc/with-*` 改为 `form/with-*`，SchemaForm 与 SchemaField 在 `form/schema-form/` 下；Toast、Notification 的命令式入口为 `toast/static-api`、`notification/static-api`；`color-picker/{alpha-slider,color-choose-area,color-slider,data-part}/index` 改为 `color-picker/<名>`；`resizable/group/resize-context` 改为 `resizable/context`，`resizable/group/<名>`、`resizable/single/<名>` 改为 `resizable/<名>`；`toast/use-toast/index`、`modal/use-modal/index`、`notification/use-notification/index` 改为 `toast/use-toast`、`modal/use-modal`、`notification/use-notification`，`modal/use-modal/hook-modal` 删除（`HookModalRef` 改从 `modal/use-modal` 导入，`HookModal` 组件不再导出）。semi-ai-react：`chat/chat-box/index` 改为 `chat/chat-box/chat-box`，`chat/input-box/index` 改为 `chat/input-box`，`ai-chat-input/extension/<名>-slot/index` 改为 `ai-chat-input/extension/<名>-slot`，`ai-chat-input/extension/input-slot/component` 改为 `ai-chat-input/extension/input-slot-component`。
- 破坏性（深路径）：`@fibrae/semi-foundation` 的组件目录移到 `components/` 下，如 `@fibrae/semi-foundation/button/button.scss` 改为 `@fibrae/semi-foundation/components/button/button.scss`，`@fibrae/semi-foundation/table/foundation` 改为 `@fibrae/semi-foundation/components/table/foundation`，`_portal/portal.scss` 改为 `components/portal/portal.scss`。`utils/` 中的 `popup-lifecycle`、`modal-resources`、`focus-scope`、`focus-handle`、`reset-timer`、`release-holder` 移到 `base/`。`base/`、`utils/`、`locale/`、`theme/` 下的其余路径不变。`@fibrae/semi-ai-foundation` 同样把组件目录移到 `components/`（如 `chat/foundation` 改为 `components/chat/foundation`），`message-list-foundation`、`action-bar-foundation` 改为 `base/message-list-foundation`、`base/action-bar-foundation`，`file-suffix`、`upload-status` 改为 `utils/file-suffix`、`utils/upload-status`。
- 破坏性（深路径）：各框架的 UI 包与 AI 包把源码分为 `components/`、`base/`、`utils/`、`internal/` 与通用 hook 目录（React、Svelte 为 `hooks/`，Vue 为 `composables/`，Solid 为 `primitives/`）。组件深路径不变（如 `@fibrae/semi-ui-react/button/index`），`_base/*`、`_utils/*`、`_portal`、`_sortable`、`_css-animation` 子路径删除：适配层改为 `base/*`（如 `@fibrae/semi-ui-svelte/base/create-context`），通用 hook 改为对应目录（如 `@fibrae/semi-ui-svelte/hooks/watch.svelte.js`），无状态工具与 `semi-global` 改为 `utils/*`，AI 包根目录的 `semi-global` 同样改为 `utils/semi-global`。`internal/*` 是 AI 包使用的内部组件，不属于公开 API。Vue 的 hooks 入口改名为 `@fibrae/semi-ui-vue/composables`，Solid 的改名为 `@fibrae/semi-ui-solid/primitives`；React、Svelte 仍为 `/hooks`。semi-ui-react 的 context 模块统一命名为 `context`：`anchor/anchor-context`、`breadcrumb/bread-context`、`collapse/collapse-context`、`descriptions/descriptions-context`、`image/preview-context`、`layout/layout-context`、`list/list-context`、`navigation/nav-context`、`table/table-context`、`tabs/tabs-context`、`tree/tree-context` 改为 `<组件>/context`，`markdown-render/components/link-context` 改为 `markdown-render/context`。四个 AI 包的 Chat、AIChatDialogue、AIChatInput、Sidebar 的子组件放在组件目录根部，合起来组成一个部分的放进以该部分命名的子目录，深路径随之变化：如 `@fibrae/semi-ai-react/chat/chat-box/chat-box`、`@fibrae/semi-ai-svelte/ai-chat-dialogue/dialogue/dialogue-title.svelte`、`@fibrae/semi-ai-vue/ai-chat-input/rich-text-input`、`@fibrae/semi-ai-solid/sidebar/container`，Sidebar 原 `widget/<名>` 下的子组件改为 `sidebar/<名>`（如 `sidebar/options`）。入口深路径 `<组件>/index`（如 `@fibrae/semi-ai-react/chat/index`）不变。
- 新增目录入口（D22）：`@fibrae/semi-foundation/base`、`/utils`、`/locale`，`@fibrae/semi-ai-foundation/base`、`/utils`，以及各 UI 包的 `/base`、`/utils`、`/internal`，各自汇总该目录的导出，如 `import { BaseFoundation, FocusScope } from '@fibrae/semi-foundation/base'`。原有深路径照常可用；foundation 的日期模块（`utils/date-fns-extra`、`utils/date-fns-locale`、`utils/zoned-time`）与 `base/env` 不在入口中，只按深路径导入。
- 破坏性：发布产物合并为单一 `dist/`（只含 ESM、类型与 CSS），删除 `lib/`、`dist/css/`、`./dist/*` 与 foundation 的 `./lib/*` 子路径。`@fibrae/semi-ui/dist/css/semi.min.css` 改为 `@fibrae/semi-ui-react/styles.css`，`dist/css/semi-tailwind.css` 改为 `@fibrae/semi-ui-react/tailwind.css`，`dist/css/semi-ai.min.css` 改为 `@fibrae/semi-ai-react/styles.css`，其余框架包同理。
- `semi-scss-compile` 的 `foundationPath`、`aiFoundationPath`（`-f`、`--ai`）指向包内 `dist/`，`iconPath`（`-i`）改为 `node_modules/@fibrae/semi-icons-core/dist`；构建插件只能与本版本的 Semi 包搭配。
- 新增 hooks 入口 `@fibrae/semi-ui-react/hooks` 与 Vue 的组合式函数入口 `@fibrae/semi-ui-vue/composables`，导出 `useLocale`、`useClickOutside`、`useCopied`、`useDidUpdate`、`useEventListener`（及 `getWindow`、`getDocument`、`getBody`）、`useFocusHandover`、`useResizeObserver`，React 另有 `useMergedRef`。Vue 另有 `useMounted`（服务端与 hydration 期间为 `false`，挂载后为 `true`）与 `useRecordFocus(scope, visible)`（在 `visible` 变为 `true` 时记录焦点，首帧可见时在 `onBeforeMount` 记录，服务端不执行）。React 的 `useResizeObserver(target, onResize, { enabled })` 接受 ref、元素或 `null`，为空或 `enabled` 为 false 时不观察。
- 包入口导出各组件 Props 与辅助类型，重名的加组件前缀（如 `CascaderValue`、`TableSize`）。内部名改为公开名：`ModalReactProps` 为 `ModalProps`，`SideSheetReactProps` 为 `SideSheetProps`，`ToastReactProps` 为 `ToastProps`，`NoticeReactProps` 为 `NoticeProps`，`CollapseReactProps` 为 `CollapseProps`，`ColorPickerReactProps` 为 `ColorPickerProps`，`BaseFormProps` 为 `FormProps`，`BasicLayoutProps` 为 `LayoutProps`。
- 组件根 DOM 接收未声明属性（F2），如 `id`、`title`、Form 注入的 `name`；没有根 DOM 的包装组件（Popover、Popconfirm、Dropdown、UserGuide）丢弃未声明属性（F11）。Props 类型包含落点元素的原生属性（F6），同名不同签名的保持原 Semi 签名；F11、F12 组件与 Provider 不接受任意 DOM 属性。
- 破坏性：受控判断改看值是否为 `undefined`：`value={undefined}`（及 `checked`、`visible`、`activeKey` 等）与不传相同，按非受控处理，`defaultXxx` 生效；`null` 仍是受控值。受控值变回 `undefined` 时输入类组件清空并转为非受控，Tabs、Collapse、Carousel、UserGuide 从最后的受控值继续。
- 「是否传入」类属性同样按值判断，写成 `undefined` 与不传相同，隐藏 Modal 的 footer、header 需传 `null`。React 中回调属性传 `null` 按未传处理，内容类属性传 `0` 照常渲染。
- 对外导出的顶层组件每次渲染读取 `semiGlobal.config.overrideDefaultProps`（F7），Provider、Consumer 与 React 的 Icon 例外；TagGroup、IconButton、Divider、ButtonGroup 等有自己的键，IconButton 不再沿用 `Button`。破坏性：Navigation 的键名为 `Nav`，React 原 `Navigation` 键不再生效。
- `overrideDefaultProps` 中写成 `undefined` 的键视为未设置；`id`、`insetLabelId`、`wrapperId`、`addonId`、`extraId` 不再生效，类型也去掉。Vue 的非函数全局默认值在实例首次缺省时读取并缓存。
- 破坏性：收集子组件的组件（Steps、Timeline、Navigation、Tabs、Breadcrumb、Select、Carousel、FormInputGroup、Layout 的 Sider、Table 的 `Table.Column`）展开 children 中的 Fragment，其中子项与直接写出的一样处理。只能在父组件内使用的子组件在外部使用时抛出 `<子组件> must be used inside <父组件>`。
- 键盘：不再监听 `keypress`，按键读 `KeyboardEvent.key` 而非 `keyCode`，输入法组合中的按键跳过。只设 `keyCode` 的模拟事件（如 `fireEvent.keyDown(el, { keyCode: 13 })`）需改传 `key`；`@fibrae/semi-foundation/utils/key-code` 不再有默认导出。
- 指针：拖动、缩放与按住连发（Slider、DragMove、Cropper、Resizable、ColorPicker、ImagePreview、Table 列宽、AudioPlayer 与 VideoPlayer 进度条、InputNumber 步进按钮）只在主键按下（`button` 为 0）时开始，笔的侧键与橡皮擦不再触发；鼠标左键、触摸与笔尖不变。
- 破坏性（样式）：`semi-` 前缀元素及其伪元素统一为 `box-sizing: border-box`（`@layer semi-base`），`style` 传入的宽高包含边框与内边距，部分组件小 1 到 2px；依赖 content-box 的自定义样式需调整。
- 组件自绘的可聚焦元素键盘聚焦时统一显示主题焦点环（`$width-focus-ring`、`$color-focus-ring`）。Semi 元素统一为细滚动条（`$color-scrollbar-thumb`），可被覆盖；`.semi-light-scrollbar` 更名为 `.semi-scrollbar`。
- 浮层统一入栈，Esc 只关闭栈顶浮层，在 document 冒泡阶段处理，模拟 Esc 需在焦点元素而非 window 上派发；带遮罩的 Modal、SideSheet、ImagePreview 打开时页面其余部分为 `inert`。锁定滚动时给 body 加 `padding-inline-end`，不再改写 `width`；`getPopupContainer` 返回 `null` 或 `undefined` 时 Portal 抛错。
- 破坏性：图标默认装饰性（`aria-hidden="true"`），不再输出 `role="img"` 与英文类型名的 `aria-label`；只有图标的按钮需传 `aria-label`，按 `getByRole('img', { name: 'close' })` 查询的测试需调整。图标不再用 `forwardRef`，判断图标改用 `elementType === 'Icon'`。
- 虚拟列表由 `react-window` 换为 `@tanstack/react-virtual`。拖拽排序换为 `@dnd-kit/react` 0.5（`~0.5.1`）：TagInput、Transfer 拖动中实时重排，触摸按住 250ms 后才开始；删除深路径 `@fibrae/semi-ui-react/transfer/sortable-list`。
- 破坏性（类型）：`BaseProps` 的 `children` 收紧为 `ReactNode`；每次都会传入的回调参数改为必填（如 Table 的 `sorter(a, b)`、Tree 的 `onChange(value)`）；回调事件参数改为运行时实际事件（点击外部为原生 `MouseEvent`，Esc 为原生 `KeyboardEvent`），读取 `e.nativeEvent`、`e.persist()` 会报错。
- 复制：Typography 的 `copyable.onCopy` 与 Sidebar 的 `onDetailContentCopy` 在剪贴板写入完成后异步回调，失败时 `res` 为 false。
- 破坏性（样式钩子）：RTL 改由 `dir` 与 `:dir(rtl)` 决定，删除 `semi-rtl`、`semi-portal-rtl`、`semi-modal-rtl`、`semi-table-wrapper-rtl` 等方向类名，自定义样式改用 `:dir(rtl)`。ConfigProvider 的 `direction` 与外层不同时，在内容外包一层带 `dir` 的 `div`。
- 破坏性：子组件 `elementType` 统一为 `Parent.Child`：`'BreadcrumbItem'` 改为 `'Breadcrumb.Item'`，`'NavHeader'`、`'NavFooter'` 改为 `'Nav.Header'`、`'Nav.Footer'`，Vue 的 `'AnchorLink'` 改为 `'Anchor.Link'`、`'DescriptionsItem'` 改为 `'Descriptions.Item'`；部分无人读取的 `elementType` 删除。
- Vue：命令式 API（Toast、Notification、Modal.confirm）共用一条 `app.use` 记录，节点型选项为 `XxxNode = string | VNode | (() => VNodeChild)`；`useClickOutside` 新增第 4 个参数 `nested`，返回的节点算作内部。
- Solid：新增组件包 `@fibrae/semi-ui-solid`、图标包 `@fibrae/semi-icons-solid`（插画入口为 `/illustrations`），导出名、prop 名、回调签名与受控 prop 同 React 包；`className` 写作 `class`，元素 ref 用回调或变量，节点型 prop 为 `JSX.Element`，回调为 Solid 事件处理函数（可用 `[handler, data]` 形式）。
- Solid：各 Solid 包的 `solid-js` peer 依赖为 `^1.9.17`，更早的 1.9 版本缺少 dom 产物导入的 `setStyleProperty`（1.9.8 起才有），且未经测试。
- Solid：`overrideDefaultProps` 在组件创建时读取；其中的 DOM 节点值（JSX）被忽略并告警，Spin 的 `indicator`、Switch 的 `checkedText` 这类节点型 prop 只能按实例传入。事件处理中的多次 set 不自动合并，需要「同一次更新」时用 `batch` 包住。
- Solid：primitives 入口 `@fibrae/semi-ui-solid/primitives` 导出 `useLocale`、`useClickOutside`、`useCopied`、`useEventListener`、`useFocusHandover`、`useMounted`、`useRecordFocus`、`useResizeObserver` 与 `mergeRefs`，参数接收访问器，状态以访问器返回；`useMounted()` 在服务端与 hydration 期间为 `false`，挂载后为 `true`；`useRecordFocus(scope, visible)` 在 `visible` 变为 `true` 时、DOM 更新之前记录当前焦点，服务端不执行；`useClickOutside` 返回的处理函数写在目标元素的 `onMouseDown` 上，`useEventListener` 的目标写成访问器（如 `() => window`）。不提供 `useDidUpdate`、`useMergedRef`，分别改用 `createEffect(on(..., { defer: true }))` 与 `mergeRefs`。
- Solid：拖拽排序（TagInput、Transfer）基于 `@dnd-kit/solid`，放下后不重建列表：父组件不接受新顺序时恢复原顺序，项节点与手柄焦点都保留；拖拽浮层元素只在拖拽中存在。
- Svelte：新增组件包 `@fibrae/semi-ui-svelte`、图标包 `@fibrae/semi-icons-svelte`（插画入口为 `/illustrations`），`svelte` peer 依赖为 `^5.57.0`。导出名、prop 名与回调名同 React 包；`className` 写作 `class`（接受字符串、数组与对象），`style` 只接受字符串；节点型 prop 与 render 函数改为 snippet，名字同 Vue 插槽（去掉 `render` 前缀），参数是带具名字段的对象，默认内容为 `children`。
- Svelte：受控值是可绑定 prop：`bind:checked={x}` 双向同步，`bind:checked={get, set}` 完全受控（setter 可拒绝或改写），`checked={x}` 单向传值只作初值、交互后本地覆盖、父级再推新值时以父级为准，同一组件上的展开属性（`{...rest}`）换成新对象时父级的值也会重新生效（Svelte 对未绑定 prop 的本地改写是临时的），要保留交互结果用 `bind:` 或在回调里写回；不提供 `defaultValue`、`defaultChecked`、`defaultVisible` 等 `default*` 属性。只为声明数据的子组件（`TabPane`、`Select.Option`、`Table.Column`）不提供，改用数据 prop（`tabList`、`optionList`、`columns`）加逐项 snippet。
- Svelte：包发布 `.svelte` 源码与 `.d.ts`，应用需用 `@sveltejs/vite-plugin-svelte` 等 Svelte 编译插件构建；组件导入同目录的 `.css`。对外方法经 `bind:this` 取组件实例调用；图标不支持 `elementType` 与 ref。`overrideDefaultProps` 在组件创建时读取；按子树变化的全局默认值用 `setContext(semiGlobalKey, new SemiGlobal())` 下发（`semiGlobalKey`、`SemiGlobal` 从包根导入）。
- Svelte：写在组件上的 `{@attach}` 作用于组件接收 `aria-*` 与 `tabindex` 的元素：有内部原生控件的组件（Input、TextArea、Switch、Checkbox、Radio、Select、TagInput 等）是该控件，其余是根元素；组件句柄（如 `focus()`）经 `bind:this` 获取。
- Svelte：带子组件的组件同时提供静态成员与具名导出，两者是同一个组件：`Layout.Header`、`Dropdown.Item`、`Nav.Sub`、`Typography.Text`、`Card.Meta`、`List.Item`、`Checkbox.Group`、`Radio.Group`、`Collapse.Panel`、`Tabs.TabItem`、`Skeleton.Avatar`、`ScrollList.Item` 等，模板中可写 `<Dropdown.Item>`，也可导入 `DropdownItem`。Form 例外，只有具名导出（F17）。
- Svelte：`@fibrae/semi-ui-svelte` 根导出的类型名都带组件前缀（如 `ButtonProps`、`ResizableSize`、`SpaceAlign`、`CardMetaProps`、`GridGutter`、`ModalSize`、`TypographyTextProps`），`Size`、`Type`、`Direction` 这类通用名不从包根导出。
- Vue：空插槽三种语义：`#closeIcon` 为空回落默认图标（隐藏用 `closable=false`），Modal 的 `#header`、`#footer` 为空则隐藏，Carousel 的 `#leftArrow`、`#rightArrow` 为空不回落。原生属性只在类型中，运行时经 attrs 透传。
- 服务端渲染：默认打开的弹层不进服务端 HTML，hydration 后才打开。Toast、Notification、Modal 的命令式 API 只在客户端调用，在服务端调用抛带说明的错误。Calendar 在服务端渲染时需传 `displayValue`，「今天」标记只在挂载后出现；服务端与客户端时区须一致，否则给 DatePicker、TimePicker 传 `timeZone`（可经 ConfigProvider）。`semiGlobal` 只在应用启动时设置，按请求变化的配置用 ConfigProvider。
- 行为变化：组件被隐藏而不卸载（React StrictMode 重放、`<Activity>`、Vue `<KeepAlive>`）时，已打开的面板、弹层、卡片、确认框、裁剪弹窗保持打开，随子树隐藏，重新显示后原样出现，隐藏与显示都不发 `onVisibleChange` 等可见性通知。原来 Vue 版在 KeepAlive 失活时关闭这些弹层（部分还会发 `visibleChange(false)` 或写回 `v-model`），React 的 Tooltip 系在 Activity 隐藏时关闭。涉及 Tooltip、Popover、Dropdown、Popconfirm、Select、AutoComplete、TreeSelect、Cascader、DatePicker、TimePicker、Calendar 的事件卡片、Chat 的删除确认、AIChatInput 面板、Upload 裁剪弹窗、Navigation 子菜单。Vue 的 `useClickOutside` 与 HotKeys 在 KeepAlive 缓存期间不响应。
- Vue：多个组件对受控 prop 的反应改在 DOM 更新之后执行，父组件在自己的 `onUpdated` 里第一次读子组件 DOM 可能仍是旧值，下一轮才是新值，同一次提交内用户看不到闪烁。涉及 Pagination（`currentPage`、`total`、`pageSize`）、InputNumber、Input、TextArea、TagInput、PinCode 的受控值，DatePicker（`value`、`timeZone`、`defaultPickerValue`）、Cascader（`treeData`、`keyMaps`、`modelValue`），Table 的 `dataSource` 变化后多渲染一轮。
- React：多数组件的回调 prop 不再有 `noop` 默认值，改以 `?.()` 调用，显式传 `null` 不再抛错；读取组件 `defaultProps` 取回调的外部代码会看到 `undefined`。
- 公开类型：React 的 `JsonViewerState`、`DayColState`、`MonthCalendarState` 移除；`OverflowListState`、`UserGuideState`、`AnchorState`、`PopconfirmState` 改为 foundation 类型的别名；Vue、Svelte 的 `UserGuideState`、`AnchorState` 改为从 foundation 再导出。
- Svelte：RadioGroup、PinCode、Slider、InputGroup、TagInput 上传的 `onfocusin`、`onfocusout`、`onmouseenter`、`onmouseleave` 与组件自身的处理同时生效，不再被覆盖。
- 破坏性（类型）：Semi 组件之间传递的内部属性移出公开 Props 类型，API 表不再列出。React 与 Solid：TextArea 的 `disabledEnterStartNewLine`，Input（及继承它的 InputNumber）的 `showClearIgnoreDisabled`，OverflowList 的 `overflowRenderDirection`，FormErrorMessage 的 `errorMessageId`、`helpTextId`、`isInInputGroup`；React 另有 Breadcrumb.Item 的 `active`、`shouldRenderSeparator`、`route`，Select.Option 的 `current`；Solid 另有 ScrollList 的 `x-semi-header-alias`、`x-semi-footer-alias`。React 删除 Tooltip、Popover、Dropdown（及继承它的 AIChatInput `Mcp`）、Popconfirm、Button、Row、Col、Layout、Layout.Sider、Skeleton 各子组件、InputNumber、Rating、Steps、TimePicker、ScrollList、Table 的 `prefixCls`，类名固定为组件默认前缀，自定义前缀改用构建插件的 `prefixCls`。React 另删 Radio、RadioGroup、Checkbox、CheckboxGroup、DatePicker 与 Steps 各子项的 `prefixCls`；Radio、Checkbox 不再读全局默认值里的 `prefixCls`，foundation 的 Radio、Checkbox、DatePicker 类型随之去掉该字段。Solid 删除 Row、Col、Layout 及其 Header、Footer、Content、Sider、Skeleton 各子组件、InputNumber、Rating、Radio、RadioGroup、Checkbox、CheckboxGroup、DatePicker、TimePicker、Popover、Popconfirm、Dropdown、ScrollList、Table、Steps 及各 Step 的 `prefixCls`，Tooltip 的 `prefixCls` 拆入 `TooltipInternalProps`，由 Popover、Dropdown 使用。Vue 与 Svelte 删除 Row、Col、Layout 及其各部件、Skeleton 各子组件、Steps、Rating、Table、Radio、RadioGroup、Checkbox、CheckboxGroup、Popover、Popconfirm、Dropdown、Tooltip 的 `prefixCls`（Vue 另删 Select.Option 的），Popover、Dropdown 给 Tooltip 的前缀改经内部 context 传入（Vue 的 AutoComplete 给 Select.Option 同理）。四个图标包的 `Icon` 删除 `prefixCls`，类名前缀固定为 `semi`。
- 破坏性：删除 React、Solid 的 Input（及 InputNumber）的 `onlyBorder` 与 `semi-input-only_border` 类名；各框架删除 ScrollList.Item 的 `type`（`onSelect` 的参数不再带 `type`），删除 Layout.Header、Layout.Footer、Layout.Content 的 `type`。React 的 Cascader、Image、UserGuide 的 Props 类型去掉未渲染的 `children`。Solid 的 TimePicker、PinCode 在类型中声明 `autofocus`。

### 构建与宿主

- `@fibrae/semi-json-viewer-core` 把 `jsonc-parser` 打进自身 `dist`，不再作为运行时依赖，Next Pages Router 的 webpack 不再解析其 UMD 入口。
- `@fibrae/semi-foundation` 新增依赖 `@shikijs/core`，代码高亮改从它导入，不再导入 `shiki/core`（`shiki` 仍提供 engine 与主题）。
- `@fibrae/semi-webpack-plugin` 的 peer `webpack` 标为可选：插件运行时经 `compiler.webpack` 取宿主自带的 webpack（如 Next.js），无需单独安装；类型声明仍引用 `webpack`。
- `@fibrae/semi-vite-plugin` 为每个 server 环境（含 Nuxt 未设 `consumer` 的环境与 React Router `serverBundles` 的 `ssrBundle_*`）把 React、Vue 的 UI、AI、图标包设为 `resolve.noExternal`，服务端渲染无需再配 `ssr.noExternal`；Solid 包不在其中，foundation 与 ai-foundation 只在设置了 `prefixCls` 时一并打进服务端产物（它们持有 `BASE_CLASS_PREFIX`，保持 external 会使服务端类名仍为 `semi-`，与客户端不一致）；SolidStart dev 中 vite-plugin-solid 会把 foundation 写进服务端环境的 `resolve.external`，插件在所有插件之后把它移除，`prefixCls` 才对服务端渲染生效。
- 破坏性：`@fibrae/semi-vite-plugin` 的 `semiTheming()` 返回 `Plugin[]` 而不是单个 `Plugin`：写进 Vite 的 `plugins` 数组时会被展开，常规用法不变；把返回值当单个插件对象使用的代码（读取 `.name`、直接调用其钩子）须改为按数组处理。
- `@fibrae/semi-vite-plugin` 的 `omitCss` 同时作用于 dev 预构建，dev 不再注入组件 CSS；改选项后用 `vite --force` 重建 `.vite/deps`。
- `@fibrae/semi-vite-plugin` 在应用依赖 `@fibrae/semi-ui-solid`、`@fibrae/semi-ai-solid` 时，把 foundation、ai-foundation 的依赖经直接依赖它们的 Solid 包加入 `optimizeDeps.include`（只装 ai-solid 的应用也覆盖 foundation 的依赖），SolidStart dev 不再因 CommonJS 依赖白屏：有根入口的依赖按包名加入，foundation 按未导出深路径导入的 CommonJS 文件（Lottie 的 `lottie-web/build/player/lottie_light`）另行加入，只有子路径导出的依赖（如 `@tiptap/pm`）按 `exports` 中的子路径逐个加入，dev 中 ai-foundation 直接导入的 `@tiptap/pm/state` 与 `@tiptap/core` 预构建内的 ProseMirror 是同一份实例，AIChatInput 不再因 ProseMirror 报 `Adding different instances of a keyed plugin` 而无法挂载。
- `@fibrae/semi-vite-plugin` 的 `omitCss` 与 `prefixCls` 覆盖 Solid 包。
- 破坏性：`@fibrae/semi-next` 的 `omitCss` 默认值由 `true` 改为 `false`，组件按需带出自己的样式，不再需要导入 `styles.css`；仍要整包样式时显式传 `omitCss: true` 并导入一次 `styles.css`。自定义 `prefixCls` 须同时传 `omitCss: true`，否则读取配置时抛错。不传选项时 `--webpack` 下不再挂 `SemiWebpackPlugin`，由 Next 直接处理组件导入的 `.css`。
- `@fibrae/semi-next` 删除对服务端 `externals` 的改写（Next 16 中从未生效），改为把 `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react`、`@fibrae/semi-icons-react`、`@fibrae/semi-icons-react/illustrations` 合并进 `transpilePackages`，Pages Router 两种打包器的 dev、build、start 不再报 `.css` 扩展名错误。
- `@fibrae/semi-next` 同时返回 `turbopack.rules` 与 `webpack()`，支持 Next 16 默认的 Turbopack；开 `omitCss` 或 `prefixCls` 时，应用已有同 glob 的 Turbopack 规则（`*.js`）即抛错，其他规则保留。
- `@fibrae/semi-next` 在 Turbopack 下（按 Next 读取配置前设置的 `process.env.TURBOPACK` 判断）传入 `cssLayer`、`extractCssOptions`、`overrideStylesheetLoaders` 即在读取配置时抛错。
- `@fibrae/semi-webpack-plugin` 新增子路径导出 `./semi-omit-css-loader`、`./semi-prefix-loader`，供按绝对路径引用 loader 的宿主（Next 的 `turbopack.rules`）使用。
- `semi-build-scss` 的 `-f`、`-i`（JS API 的 `foundationPath`、`iconPath`）改为可选：缺省时由 `@fibrae/semi-scss-compile` 自带的 `@fibrae/semi-foundation`、`@fibrae/semi-icons-core` 依赖解析，pnpm 隔离布局下应用无需直接安装这两个包，`semi-build-scss --prefix my -o app/semi-my.css` 即可，但 `@fibrae/semi-scss-compile` 的版本须与组件库一致，不一致时显式传 `-f`。`--ai` 路线的 `-f` 同样可选，`--ai` 本身仍须给出路径。
- `@fibrae/semi-ui-solid`、`@fibrae/semi-ai-solid`、`@fibrae/semi-icons-solid`、`@fibrae/semi-icons-solid/illustrations` 的 `dist` 在 dom 产物 `.js` 之外新增同名的 `.jsx` 产物（JSX 原样保留，导出名一致）。`exports` 的 `.`、`./*`（icons 另有 `./lab`）改为 `solid` 条件指向 `.jsx`、`default` 指向 `.js`，并新增 `types` 条件指向 `.d.ts`。识别 `solid` 条件的工具（vite-plugin-solid、SolidStart）使用 `.jsx`，其他打包器取 dom 产物、只能客户端渲染；包体积约翻倍。
- `@fibrae/semi-ui-vue`、`@fibrae/semi-ai-vue` 的 `dist` 中，SFC 脚本产物由 `<名>.vue_vue_type_script_setup_true_lang.js` 改名为 `<名>.script.js`，文件名不再含 `.vue`；`exports` 不变，不应深层导入这些内部文件。
- `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react`、`@fibrae/semi-icons-react` 的 `dist` 中，除入口（`index.js`，icons 另有 `lab/index.js`、`illustrations/index.js`）以外的全部 `.js` 首行新增 `'use client'`。Server Component 里的图标因此保留组件身份，传给 Input、Select、Button 等的 `prefix`、`suffix`、`icon` 时仍按 Semi 图标处理；`createSvgComponent` 也只能在 `'use client'` 文件中调用。Next App Router 与 React Router RSC 模式的 Server Component 可直接导入扁平组件；点语法的子组件（如 `Typography.Title`）仍只能在 `'use client'` 文件中使用；`semiGlobal` 与 Form 的 HOC、hooks 同样只能在 `'use client'` 文件中使用，RSC 应用在 `'use client'` 模块中设置 `semiGlobal`。
- `@fibrae/semi-vite-plugin` 丢弃来自 `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react`、`@fibrae/semi-icons-react` 的 `"use client"` 指令警告（`MODULE_LEVEL_DIRECTIVE`），并保留用户已有的 `build.rolldownOptions.onLog`。未使用该插件且未装 `@vitejs/plugin-react` 的 RSC 宿主构建会看到这些警告，可以忽略。
- React：Server Component 传入的节点属性（如 Button 的 `icon`、Input 与 Select 的 `prefix`、Nav 的 `footer.collapseButton`、Table 列的 `filterDropdown`、Tooltip 的 `showArrow`、Form 的 `label`、Table 单元格值、Carousel 箭头 children 内嵌套的元素）在 dev 下以 lazy 形态到达浏览器时先解开再使用，不再被换成默认内容、当成配置对象展开或渲染为空，hydration 不再报不一致。
- 新增包 `@fibrae/semi-nuxt`：Nuxt 4 的模块，`modules: ['@fibrae/semi-nuxt']` 即把 `@fibrae/semi-vite-plugin` 注册进 Nuxt 的 Vite 构建，选项写在 `semi` 配置键下并原样传给插件（`prefixCls`、`cssLayer`、`omitCss`）。Nuxt 的服务端渲染与 dev 无需再配 `ssr.noExternal`；不做组件自动导入。peer 依赖 `nuxt >=4.6.2`。应用未设置 `features.inlineStyles` 时模块把它设为 `false`：Nuxt 默认内联 facade 为页面 `.vue` 的客户端 chunk 中的 CSS，只被单个页面导入、因而打进该页 chunk 的 Semi 组件样式会内联一份、同时仍链接一份，增量随页面独占的组件而定（实测常用组件页约 200KB）；关闭后样式只经 `<link>` 加载。代价是应用自己的 SFC 样式也不再内联；要保留内联，在 `nuxt.config.ts` 或 `.nuxtrc` 显式设置 `features.inlineStyles`（或旧键 `experimental.inlineSSRStyles`），模块不覆盖。
- 破坏性：`@fibrae/semi-ui-react`、`@fibrae/semi-ui-vue`、`@fibrae/semi-ui-solid`、`@fibrae/semi-ui-svelte` 新增入口 `./locale`，导出内置语言包 `zh_CN`、`en_US` 与类型 `Locale`、`LocaleInput`（如 `import { zh_CN } from '@fibrae/semi-ui-vue/locale'`），应用无需直接安装 foundation；组件入口不导出它们，没有 `@fibrae/semi-ui-<框架>/locale/source/<名>` 深路径。React 的 `locale` 入口不带 `'use client'`，语言包是纯数据，RSC 应用可在 Server Component 中导入并传给 `ConfigProvider`、`LocaleProvider`。
- 新增包 `@fibrae/semi-ui-svelte`、`@fibrae/semi-ai-svelte`、`@fibrae/semi-icons-svelte`、`@fibrae/semi-icons-svelte/illustrations`：由 `svelte-package` 发布 `.svelte` 源码与 `.d.ts`，不经 `vp pack`；`exports` 的 `.`、`./*`、`./*.svelte`、`./*.svelte.js`（只有 ui 包有 `./*.svelte.js`，icons 另有 `./lab`）带 `types`、`svelte`、`default` 条件，须由识别 `svelte` 条件并编译 `.svelte` 的工具使用（`@sveltejs/vite-plugin-svelte`、SvelteKit）；peer 依赖 `svelte ^5.57.0`。包内相对导入都带完整扩展名（`.js`、`.svelte.js`、`.svelte`），Node 的 ESM 解析、webpack 的 `fullySpecified` 与 TS `moduleResolution: nodenext` 都能解析。
- `@fibrae/semi-ui-svelte` 提供 `hooks`、`tokens`、`styles.css`、`tailwind.css` 入口。attachment `observeResize` 与 `dragMove` 都从包根导出，`hooks` 入口仍导出 `observeResize`。
- `@fibrae/semi-vite-plugin` 的 `omitCss` 覆盖 Svelte 包：注释掉 `semi-(ui|ai|icons)-svelte/dist` 下 `.svelte` 与 `.js` 里的 `.css` 导入，包括 `tokens` 入口；`prefixCls` 无需改动即生效；Svelte 包的服务端构建由 vite-plugin-svelte 处理，插件不把它们加入 `resolve.noExternal`。

## 语言包

- 破坏性：只内置 zh_CN、en_US（D21），删除其他 55 个语言包。`zh_CN`、`en_US` 与 `Locale`、`LocaleInput` 类型从 UI 包的 `locale` 入口导入（如 `import { zh_CN } from '@fibrae/semi-ui-react/locale'`）；`@fibrae/semi-ui-react/locale/source/<code>`、`@fibrae/semi-ui-react/locale/interface` 删除。
- 其他语言由应用自己提供：`locale` 接受 `LocaleInput`，`code` 必填，只写要翻译的命名空间与键，缺的部分回退 en_US。日期组件的月份、星期等另需 ConfigProvider 的 `dateFnsLocale`（D20）。
- 破坏性（类型）：删除 `Image.loading`、`Image.loadError`、`DatePicker.day`、`Upload.illegalTips`、`Upload.cropOk`、`Upload.cropCancel`、`Table.sortedAscending`、`Table.sortedDescending`、`Table.sortedNone`、`Table.sortRoleDescription`、`Table.deselectRow`、`Table.deselectAllRows`、`Select.selected`、`Select.createItem`、`Tree.toggleCheck`、`Tree.expandItem`、`Tree.collapseItem`、`Avatar.clickable`、`Slider.disabled`；`Upload.cropTitle` 改为必填。
- 语言包新增键（如 `BackTop`、`Input`、`Notification`、`Sortable` 命名空间），自定义语言包未写的键显示英文；原来写死英文的可访问名称改读语言包，默认 zh_CN 下为中文，按英文名称查询元素的测试需改为按语言包取值。
- zh_CN 的 `DatePicker.fullMonths` 改为「1月」到「12月」。

## 动画

- CSSAnimation 只响应元素自身的动画事件，子元素冒泡的不再结束父动画。Feedback 底部滑入、滑出的 keyframes 改名为 `semi-feedback-slideShow_bottom`、`semi-feedback-slideHide_bottom`。
- 根元素设置 `line-height: 1.4286`，依赖继承行高的组件不再随宿主变化；需要其他行高时在容器上覆盖。

## 主题

- 破坏性：删除主题包与编译期 Sass 覆写：`@fibrae/semi-theme-default` 删除（并入 `@fibrae/semi-foundation/theme/`），插件删除 `theme`、`variables`、`include` 选项，`semi-scss-compile` 删除 `themePath`（`-t`/`--theme`），`local.scss`、`custom.scss` 不再加载。定制只走 `--semi-*` CSS 变量与 `@layer semi` 之外的 CSS；`prefixCls`、`cssLayer`、`omitCss` 保留。
- 破坏性：Sass 变量不再是公开定制面，`!default` 删除；`semi-theme-shared` 删除 `resolveThemeDir`、`convertMapToString`。
- token 入口由 `semi-ui-react/_base/base.scss` 移到 `@fibrae/semi-foundation/base/tokens.scss`，任一组件入口自带 token；新增 `@fibrae/semi-ui-react/tokens`（Vue、Solid、Svelte 的 UI 包同名），在应用入口最先导入。
- 破坏性：删除 Web Component 构建工具链：semi-webpack、semi-rspack 删除 `webComponentPath`、`semiWebComponentLoader`、`semiCssModuleLoader`，`semi-theme-shared` 删除 `injectWebComponentStyles`、`cssToModule`。组件可在 open ShadowRoot 内使用（F13），样式由应用加入 ShadowRoot。
- 破坏性：删除 `$z-popover`、`$z-dropdown`、`$z-tooltip` 等变量与 `--semi-z-popover`、`--semi-z-dropdown`、`--semi-z-tooltip` 等 CSS 变量：弹层在 top layer，z-index 不起作用（D5）。
- base 层名由 `base` 改为 `semi-base`。与 Tailwind 同用时须先声明 `@layer theme, base, semi, components, utilities;` 并保持 `cssLayer` 为 `true`；新增 `@fibrae/semi-ui-react/tailwind.css`（Vue、Solid、Svelte 的 UI 包同名）映射 token，圆角工具类由 `rounded-semi-border-radius-*` 改为 `rounded-semi-*`。
- 破坏性：token 落点由 `body` 改为 `:root`（暗色为 `[theme-mode='dark']`），`theme-mode` 仍写在 `body` 上；`:root` 上的未分层覆盖现在对浅色生效。
- 破坏性：调色板 token 改为完整颜色（`--semi-blue-5: 0, 100, 250` 改为 `#0064fa`）；`rgba(var(--semi-x), a)` 须改为 `color-mix(in srgb, var(--semi-x) A%, transparent)`，不透明时直接写 `var(--semi-x)`；`color-mix` 与 token 自身的透明度相乘，调色板 token 配成半透明时结果会更淡。
- 改名：`--semi-transform-rotate-none` 改为 `--semi-transform_rotate-none`；重复声明的 `--semi-color-ai-background-top-hover`（激活态）改为 `--semi-color-ai-background-top-active`。暗色主题块设 `color-scheme: dark`。
- 新增 `--semi-spacing-*`、`--semi-font-size-*`、`--semi-line-height-*`、`--semi-font-weight-*`、`--semi-z-*` 等尺寸类 CSS 变量与 `--semi-shadow-knob`；字号、字重、字体栈等在 `:root` 覆盖即运行时生效，间距、控件高度、描边宽度的变量只影响 Tailwind 原子类。

## 组件

### ConfigProvider

- 新增 `dateFnsLocale`：DatePicker、TimePicker、Calendar 使用的 date-fns 语言，未传时继承外层，再按语言包的 `code` 取内置语言。
- `getPopupContainer` 只作用于 Modal、SideSheet、ImagePreview。嵌套时内层只覆盖显式传入的属性，其余继承外层；`locale={null}` 清除继承的语言，不传 `locale` 时不再注入 zh_CN。
- 数字和 `GMT±HH:MM` 形式的 `timeZone` 按固定 UTC 偏移换算，不再映射为 IANA 时区，格式 token `z` 显示偏移；删除 `IANAOffsetMap` 导出，需要夏令时请传 IANA 名称。
- Vue：`ConfigConsumer` 使用默认作用域插槽，`useConfig()` 返回 `ComputedRef<ContextValue>`。
- Solid：`useConfig()` 返回 accessor；`ConfigConsumer` 的 children 只调用一次，参数是随配置更新的响应式对象，在 JSX 之外解构只得到初始值。
- Svelte：`useConfig()` 返回随配置更新的对象，按属性读取保持响应，解构只得到当前值；`ConfigConsumer` 的内容写在 `children` snippet 中，参数是配置对象。

### LocaleProvider、LocaleConsumer

- 破坏性：LocaleProvider 不传 `locale` 时继承外层语言，不再重置为 zh_CN；最外层不传时 context 值为 `undefined`（Vue、Solid 为 `null`）。
- 破坏性：语言包与 `Locale` 类型删除 `dateFnsLocale`，`useLocale` 的返回值与 LocaleConsumer 的回调参数（Vue 的作用域插槽、Svelte 的 snippet 参数）不再提供它；React、Solid 的 LocaleConsumer children 改为 `(componentLocale, localeCode, currency)`。DatePicker、TimePicker、Calendar 按语言包的 `code` 取内置的 zh-CN、en-US date-fns 语言，其他语言回落 enUS（月份、星期、上下午与 Calendar 的可访问名称显示为英文）；需要其他语言时从 `date-fns/locale` 导入并传给 ConfigProvider 的 `dateFnsLocale`。只用文案的组件不再打包 date-fns 语言数据。
- 破坏性（类型）：LocaleConsumer 的 `componentName` 必填，只接受 `LocaleComponentName`，泛型参数改为组件名（`<LocaleConsumer<Locale['Chat']>>` 改为 `<'Chat'>`）。`useLocale` 不再接受 `'code'`、`'currency'`，改读返回值的 `localeCode`、`currency`。
- Vue：`LocaleConsumer` 使用默认作用域插槽，`useLocale(name)` 返回 computed。
- Svelte：`useLocale(name)` 返回函数，读取写成 `locale().locale.xxx`；`LocaleConsumer` 的内容写在 `children` snippet 中。最外层不传 `locale` 时 context 值为 `null`（同 Vue）。

### ResizeObserver（深路径导入 `@fibrae/semi-ui-react/resize-observer`）

- 破坏性（类型）：`children` 必填且为单个 `ReactElement`，`ReactResizeObserverProps` 不再接受 `className`、`style`。观察子元素下的第一个 DOM 节点，不再给子元素注入 `ref`；子元素在第一个节点前插入、移除第一个节点或替换根节点时，观察目标随之切换到新的第一个节点。
- Solid：从 `@fibrae/semi-ui-solid/resize-observer` 深路径导入，组件名 `SolidResizeObserver`，Props 类型为 `SolidResizeObserverProps`；`children` 可为任意 JSX，观察其中第一个元素（跳过文本节点），换根节点时观察目标随之切换。
- Svelte：没有 ResizeObserver 组件，改用 attachment `observeResize(onResize)`，写成 `<div {@attach observeResize(onResize)}>`，从 `@fibrae/semi-ui-svelte/hooks` 导入；回调收到 `ResizeObserverEntry[]`，元素移除时自动断开；不提供 `observeParent`、`observerProperty`、`delayTick`。

### Badge

- Vue：`count` 为 `number | string`（数字写 `:count="5"`），节点内容用 `#count` 插槽；属性与原生事件落在根元素，计数节点只接受 `countStyle`、`countClassName`。
- Solid：`style` 落在根元素（同 Vue），计数节点只接受 `countStyle`、`countClassName`。`dot` 时不读取 `count`，`count` 为节点时圆点也带 `type`、`theme` 类名（与 `dot` 加数字一致）。
- Svelte：`count` 接受数字、字符串或 snippet；`countStyle` 是字符串。
- React：`style` 落在根元素（同其他框架），不再替换 `countStyle`；计数文字不换行，窄子元素上计数向两侧撑宽。

### Banner

- 破坏性：根元素不再固定 `role="alert"`，默认不设 `role`，传入的 `role` 落在根元素上。依赖读屏立即播报的场景要自己传 `role="alert"`。
- 删除已废弃的 `target` 属性，传入时作为未声明属性落到根 DOM。
- Vue：`onClose` 改为 `close` 事件；没有 `showIcon`、`closable`，用 `#icon`、`#closeIcon`、`#title`、`#description` 插槽，`#icon`、`#closeIcon` 为空时不显示图标或关闭按钮。
- Vue、Solid：关闭按钮的点击不冒泡，祖先元素的原生监听也收不到（React 只拦住 React 处理函数）。
- Svelte：`onClose(event)` 是回调 prop；`title` 是 `string | Snippet`，`description`、`children` 是 snippet；`icon`、`closeIcon` 传 snippet 替换默认图标，传 `null` 隐藏图标或去掉关闭按钮（传渲染为空的 snippet 不会隐藏）；关闭按钮的点击不冒泡。

### Input、TextArea

- 破坏性：ref 改为 `InputHandle { focus, blur, select, setSelectionRange, input, nativeElement }` 与 `TextAreaHandle`（以 `textarea` 替代 `input`），原生节点读 `ref.current.input` 或 `ref.current.textarea`。
- `onEnterPress` 改在 `keydown` 触发，不再声明 `onKeyPress`，TextArea 删除从未生效的 `onPressEnter`。清除按钮改为原生 `button`，删除类名 `semi-input-clearbtn-hidden`；`readonly` 时不显示清除按钮。
- `onFocus`、`onBlur` 以整个组件为界，焦点在输入框与内部按钮、addon 之间移动不触发；`addonAfter` 里的 Button 获焦不再触发 `onBlur`，Form 的 blur 校验随之推迟。
- 破坏性（类型）：`onChange(value, e)` 的 `e` 改为 `InputChangeEvent`、`TextAreaChangeEvent`，读值用 `value`；`onClear` 参数为 `MouseEvent<HTMLButtonElement>`，`onFocus`、`onBlur` 为 `FocusEvent<HTMLDivElement>`；`InputState` 去掉 `isHovering`、`minLength`。
- TextArea 的 `autosize` 优先用 CSS `field-sizing: content`（行数换算为最小、最大高度，不写内联 `height`）；浏览器不支持时（Chrome 123 以前、Firefox 152 以前、Safari 26.2 以前）挂载后改由 JS 按内容高度写内联 `height`，值、宽度、字体加载变化时重算，行数范围仍由样式限定。TagInput 的输入框宽度同理，不支持时按文字宽度写内联 `width`。InputGroup 的 ref 指向 `role="group"` 的 span，`onFocus`、`onBlur` 由子元素焦点事件冒泡触发。
- 只读（`readonly`）Input 的原生输入框也显示默认光标，TimePicker `inputReadOnly` 的输入框显示指针光标。
- TextArea 字数超过 `maxCount` 时 textarea 带 `aria-invalid="true"`，回到范围内后取消。
- Vue：主值为 `modelValue`（`v-model`，支持 `.trim`、`.number`、`.lazy`）；`prefix`、`suffix`、`addonBefore`、`addonAfter`、`insetLabel`、`clearIcon` 改为同名插槽；`maxlength`、`minlength`、`autofocus` 用 HTML 拼写，不提供 `onlyBorder`；除 `class`、`style` 外的属性落到原生 input。
- Vue：InputGroup 的 `label.text`、`label.extra` 只接受 `string | number`，节点用 `#label`、`#labelExtra` 插槽。
- Vue：`v-model.trim`、`.number` 下，输入框中已键入的末尾空格或小数点在无关的重新渲染后仍然保留。
- Solid：Input、TextArea 的 `ref` 是根元素（Tooltip 等触发器以它为锚点），其 `focus()`、`blur()` 作用于原生输入框，Input 的 `focus()` 套用 `preventScroll` 属性；原生节点用 `inputRef`、`textareaRef` 取得，不提供 `InputHandle`、`TextAreaHandle`。`autofocus` 用小写；`onChange` 的 `e` 为原生事件（`InputChangeEvent`、`TextAreaChangeEvent`），`onFocus`、`onBlur` 为原生 `FocusEvent`。
- Solid：`prefix`、`suffix`、`insetLabel` 等节点型 prop 只在内容就是一个 Semi 图标组件时按图标处理，包在其他元素里的图标不算；在 prop 外预先创建的图标元素（如数据对象里的 `icon`）在客户端按根元素的 `semi-icon` 类判断。`semi-icons-solid` 新增导出 `IconSlotContext`，槽位经它向其中创建的图标下发尺寸与类名。服务端 HTML 带 input 的 `value` 属性与 textarea 的内容；包的类型为 Solid JSX 声明了 `attr:value`。
- Svelte：`value` 可绑定，没有 `default*` 属性；函数绑定 `bind:value={get, set}` 的 setter 可以拒绝输入，被拒绝的文本会还原到输入框；`prefix`、`suffix`、`addonBefore`、`addonAfter`、`insetLabel`、`clearIcon` 是 snippet；`inputStyle`、`textareaStyle`、`lineNumberStyle` 是字符串。
- Svelte：根容器带 `class` 和 `style`，其余未声明属性透传到原生 `input` 或 `textarea`；实例方法经 `bind:this` 调用：`focus`、`blur`、`select`、`setSelectionRange`、`getInput`、`getNativeElement`（TextArea 为 `getTextarea`、`getNativeElement`）。
- 破坏性：InputGroup 经 context 向组内任意深度的控件下发 `size`、`disabled`，不再只作用于直接子项（原来 React 用 `cloneElement`、Vue 用子节点注入）。读组的控件有 Input、TextArea（只读 `disabled`，TextArea 没有 `size`）、InputNumber、Select、Cascader、TreeSelect、DatePicker、TimePicker、AutoComplete、TagInput、Button、IconButton，以及嵌套 ButtonGroup 里的 Button。包在 `div`、Space 等元素里的控件同样生效。
- 破坏性（四个框架）：优先级为控件自己显式传的值 > 组的值 > 全局默认值（`overrideDefaultProps`）> 内置默认值，显式传 `undefined` 视为没传。原来组的 `size` 覆盖控件自己的 `size`（React、Vue、Solid、Svelte 的 Input 系控件），现在 `<InputGroup size="large"><Input size="small" /></InputGroup>` 渲染 small；`disabled={false}` 优先于组的 `disabled`。组没有设 `size` 时不再向控件发布 `default`，控件取自己的全局默认。
- 破坏性（四个框架）：InputGroup 上的其他未声明属性（`aria-*`、`data-*`、`name`、`id` 等）只落在 `role="group"` 的 span 上，不再下发给任何子控件（原来 React 复制到每个直接子项，Vue、Solid、Svelte 经注入或 context 分发给输入类控件）。使用方传入的 `role`、`aria-label`、`aria-labelledby`、`id` 覆盖内置值；有 `label` 时这些属性落在 span 而不是外层 wrapper。`onFocus`、`onBlur` 仍由根 span 冒泡接收，不下发。React 的 `InputGroupProps` 继承 span 的原生属性，`style` 类型由 `Record<string, any>` 变为 `CSSProperties`。
- Select、Cascader、TreeSelect、AutoComplete、DatePicker、TimePicker、InputNumber、TagInput 自己渲染的 Input、TagInput、Button（触发器、前后缀、搜索框等控件自身子树里的）不读外层 InputGroup，控件本身读组；弹层里的控件（如 DatePicker 面板中的按钮、Popover 里的 Input）同样不继承。
- ButtonGroup 把 InputGroup 的 `size`、`disabled` 折进它下发的值，优先级为 Button 自己 > 最近的 ButtonGroup > 外层 ButtonGroup > InputGroup > 全局默认；组 `disabled` 时 ButtonGroup 的分隔线带 `-disabled` 类，与按钮一致。
- Input 不把 InputGroup 传给自己的 `prefix`、`suffix`、`addonBefore`、`addonAfter`：其中的 Button 等控件不再继承组的 `size`、`disabled`（四个框架，同 Ant Design 的 `ContextIsolator`）。
- Svelte：InputGroup 新增 `label`、`labelPosition`、`fieldLabel`、`labelExtra`，有标签时 group 以 `aria-labelledby` 指向标签，没有标签时 `aria-label` 取语言包文案。
- Svelte：Input、TextArea 不接受原生 `defaultValue`；不传 `value` 即非受控，单向传值作初值。
- Svelte：新增 `readOnly` prop，对应原生 `readonly`，只禁止键入、保留清除按钮；`readonly` 仍同时隐藏清除按钮。
- 传 `getValueLength` 时 `maxLength={0}` 也生效，不再放行输入。Vue：模板里不带值的 `readOnly` 按开启处理。
- 浏览器自动填充后，Input、TextArea 保持主题的背景与文字颜色，错误、警告状态的底色不再被盖住。
- Vue、Svelte：Firefox 的 `compositionend` 先于 `input` 事件，从候选词提交时不再丢失提交的文字（原来父组件收到预编辑文本）。
- Vue、Solid、Svelte：`composition` 为 true 时，Firefox 中一次输入法提交只触发一次 `onChange`（原来 `compositionend` 之后补发的同值 `input` 事件再触发一次）。
- Svelte：Input、TextArea 等把原生属性拆给内部控件的组件，除 `tabindex` 外也认 `tabIndex`，落在原生控件上而不是根元素。
- 破坏性（类型，React）：TextArea 的 `onBlur` 收到 React 合成事件 `FocusEvent<HTMLDivElement>`，`TextAreaChangeEvent` 同样改为该类型（原来是原生 `FocusEvent`）。
- 清除按钮触发的 `onChange`、`onClear` 事件对象上不再有 `__fromClearBtn` 属性（四个框架）。

### InputNumber

- 破坏性：ref 改为 `InputNumberHandle`（形状同 `InputHandle`）。`localeCode` 与 `currency={true}` 的货币优先级为「自身属性 > 全局 `overrideDefaultProps.InputNumber` > 语言包」。
- 挂载和 `value` 变化从不触发 `onChange`、`onNumberChange`，FormInputNumber 不再在挂载时被标为 touched。
- `min`、`max` 之外的受控值与 `defaultValue` 按原样显示，只在用户输入、失焦、步进、清除时校正并通知一次。
- 值超过 `max` 时向上、低于 `min` 时向下的步进被拒绝，按钮不可用，按钮与方向键都不改值；朝范围内步进落回边界，离边界不足一个 `step` 时落在边界上。
- 破坏性（类型）：`onChange`、`onNumberChange` 的事件参数改为必填的 `InputNumberChangeEvent`，不再有 `null`；`onUpClick`、`onDownClick` 为 `PointerEvent<HTMLSpanElement>`，`onFocus`、`onBlur` 为 `FocusEvent<HTMLDivElement>`。
- 开启 `scientificNotation` 时失焦格式化不触发 `onChange`；货币模式下 `parser` 收到字符串。
- Vue：`v-model` 绑定 `modelValue`（`number | string`，清空为 `''`），不支持修饰符；回调改为事件 `change`、`numberChange`、`upClick`、`downClick`、`focus`、`blur`、`keydown`。
- Vue：`prefix`、`suffix`、`insetLabel`、`clearIcon`、`addonBefore`、`addonAfter` 改为同名插槽；`class`、`style` 落在外层 `.semi-input-number`，其余属性落在原生 input。
- Solid：`ref` 是 `.semi-input-number` 根元素，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；原生 input 用 `inputRef` 取得，不提供 `InputNumberHandle`。`onUpClick`、`onDownClick` 的 `e` 为原生 `PointerEvent`，长按连发期间沿用开始按下的那次事件；`onFocus`、`onBlur` 为原生 `FocusEvent`。
- Svelte：`value` 可绑定，没有 `defaultValue`；回调为 `onChange`、`onNumberChange`、`onUpClick`、`onDownClick`、`onFocus`、`onBlur`、`onKeyDown`。
- Svelte：`prefix`、`suffix`、`insetLabel`、`clearIcon`、`addonBefore`、`addonAfter` 是 snippet；实例方法经 `bind:this` 调用：`focus(options)`、`blur`、`select`、`setSelectionRange`、`getInput()`、`getNativeElement()`；未声明属性落到原生 input，`class`、`style` 落到 `.semi-input-number` 外层；放在 InputGroup 里时跟随分组的 `size`、`disabled`。

### DatePicker

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`，面板在 top layer。ref 改为 `DatePickerHandle { open, close, focus, blur }`，删除 `BaseDatePicker` 导出；受控 `open` 时 `open()`、`close()` 不改变可见性。
- 破坏性：删除 `onChangeWithDateFirst`，`onChange` 固定为 `(date, dateString)`；React 删除 `locale`、`localeCode`、`dateFnsLocale` 属性，改经 `LocaleProvider`、`ConfigProvider` 设置。
- 日历按 APG 支持键盘：每个月份网格一个 Tab 停靠点，方向键、PageUp、PageDown 移动日期，Enter、Space 选中，Esc 关闭面板。输入框为 `role="combobox"`，按 `textbox` 查询的测试需改为 combobox。
- 破坏性（类型）：`onClear` 为 `MouseEventHandler<HTMLButtonElement>`，`onClickOutSide` 参数为原生 `MouseEvent`，`onBlur` 改为面板关闭时触发的 `(e?: MouseEvent) => void`；`yearAndMonthOpts`、`timePickerOpts` 收窄；深路径 foundation 的 `RangeType` 改名 `RangeInput`，不再导出 `OnChangeType`。
- 破坏性（类型）：`onChange` 按 `type` 与 `multiple` 判别，单值类型（含 `multiple` 不生效的 `dateTime`、`month`、`year`）为 `(Date, string)`，范围类型与 `type="date"` 的 `multiple` 为 `(Date[], string[])`。React、Solid 的 `DatePickerProps` 改为类型别名（`interface X extends DatePickerProps` 改交叉类型），省略 `type` 时内联 `onChange` 的参数推断不出（这两个包不开启 strictNullChecks）；Vue 的 DatePicker 与 `FormDatePicker` 是泛型组件，模板中 `@change` 按 `type`、`multiple` 收窄，单值为 `Date | undefined`、`string | undefined`；Svelte 的 `DatePickerProps<T, M>` 带泛型，单值同为可含 `undefined`。传入类型为宽联合的 `type` 变量时需先收窄。
- `multiple` 只对 `type="date"` 生效；支持 `type="year"`，选中值为该年 1 月 1 日。`onOpenChange` 只在由关到开时上报一次，`needConfirm` 时 Esc 关闭会调用 `onCancel`，键入无法解析的日期按 Enter 不再以今天提交。
- `month`、`monthRange` 的预设与回落值取当月 1 日 00:00，`disabledDate` 以每月 1 日 00:00 调用，`rangeStart`、`rangeEnd` 无值时为 `''`。`timeZone` 取值顺序为 prop、ConfigProvider、全局默认值。
- 范围类型（`dateRange`、`dateTimeRange`、`monthRange`）只提交两端都是有效日期的值：只选或只输入一端时不写入 `value`，不触发 `onChange`、`onConfirm`，确认按钮禁用，输入框保留已输入的文字；清空仍触发 `onChange([], [])`。
- `open` 或 `defaultOpen` 为 true 且 `disabled` 时，初始不显示面板。
- `defaultPickerValue` 是无法按 `format` 解析的字符串时按未传处理，面板显示当前月份（原来得到无效日期）。
- 首次渲染即由 `value`、`defaultValue` 算出选中值，服务端 HTML 的输入框带格式化后的日期（原来挂载后才填入）。
- 面板的「今天」标记在服务端渲染与 hydration 期间不出现，hydration 后再标出，并在跨日时更新（原来在面板挂载时固定）。
- Vue：`v-model` 与 `v-model:open`；`triggerRender`、`renderDate`、`renderFullDate` 改为插槽 `#trigger`、`#date`、`#fullDate`；`topSlot`、`bottomSlot`、`leftSlot`、`rightSlot`、`prefix`、`insetLabel`、`clearIcon` 改为同名插槽，`rangeSeparatorNode` 改为 `#rangeSeparator`；`autoFocus` 改为 `autofocus`。
- Vue：声明的 `change`、`focus`、`blur` 遮住同名原生事件，`@blur` 只在面板关闭时触发；单选清空发 `undefined`，范围与多选清空发 `[]`。
- Solid：`ref` 是 `.semi-datepicker` 根元素 `DatePickerElement`（带 `open()`、`close()`、`focus(rangeType?)`、`blur()`）；`autoFocus` 写作 `autofocus`，`onFocus` 收到原生 `FocusEvent`、`MouseEvent` 或 `KeyboardEvent`，`onBlur`、`onClickOutSide` 收到原生 `MouseEvent`；`style`、`inputStyle`、`dropdownStyle` 接受对象或字符串，类名写 `class`。
- Solid：`triggerRender` 只调用一次，参数是随状态更新的活对象，字段要在返回的 JSX 中读取，`componentProps` 不含 `ref`；自定义触发器包在根元素内的 div 中，内容不含可聚焦元素时由该 div 带 `role="button"`、`tabindex` 与 `aria-haspopup`、`aria-expanded`、`aria-controls`。`renderDate`、`renderFullDate` 按日期格调用，日期或状态变化时重新调用。
- Svelte：`value`、`open` 可绑定，没有 `defaultValue`、`defaultOpen`，`defaultPickerValue` 保留（不是受控值的初值）；`needConfirm` 时点日期只触发 `onChange` 并更新待选值，可绑定的 `value` 在点确认时才写回，取消在各写法下都恢复原值。
- Svelte：插槽改为同名 snippet：`trigger`、`date`、`fullDate`、`topSlot`、`bottomSlot`、`leftSlot`、`rightSlot`、`prefix`、`insetLabel`、`clearIcon`，分隔符节点的 snippet 叫 `rangeSeparatorNode`（`rangeSeparator` 已是字符串 prop），`trigger` 参数的 `componentProps` 不含原生属性、`on*` 回调与 snippet。
- Svelte：`inputStyle`、`dropdownStyle`、`dropdownClassName` 只接受字符串；`inputReadOnly` 只禁止键入、保留清除按钮；`open()`、`close()`、`focus(focusType?)`、`blur()` 经 `bind:this` 调用。
- Svelte：`needConfirm` 下点清除按钮立即写回空值（`undefined`，范围类型为 `[]`），不等确认；`autoSwitchDate` 选年份只通知一次 `onChange`；范围类型的清除按钮因值清空而消失时（键盘清除、指针清除、父级清空），焦点交给起始输入框，焦点原本不在清除按钮上时不移交；单值类型清除后焦点落在输入框；实例 `open()`、`close()` 在用户交互后仍有效；新增类型导出 `DatePickerHandle`（`open`、`close`、`focus(focusType?)`、`blur`）。
- 受控 `value` 加 `autoSwitchDate` 时，选年只触发一次 `onChange`。范围选择中一侧显示时间或年月列表时，另一侧月份周数变化后列表选中项保持居中。React：input 上不再有 `format` 属性。
- 设置 `timeZone` 后，输入按目标时区解析：系统时区夏令时跳过、目标时区有效的时刻可以输入并正确显示；目标时区自身跳过的时刻一律不接受。
- 破坏性：设置 `timeZone` 后，`Date` 与时间戳是时刻，字符串是目标时区的钟点。`value`、`defaultValue`、`presets`、`defaultPickerValue` 中的字符串按 `format` 解析为目标时区的钟点（原来按系统时区解析再换算），`defaultPickerValue` 的 `Date` 也按时刻换算。受控时切换 `timeZone` 按新时区重读 `value`，字符串值的钟点不变。
- 破坏性：设置 `timeZone` 后，交给使用方的日期都是 `TZDate`（`Date` 子类）：`onChange`、`onConfirm`、`onCancel`、`onPanelChange` 的 `date`，`disabledDate`、`disabledTime` 的参数，`triggerRender` 的 `value`。`getTime()` 是时刻，getter 与 date-fns 按目标时区读，`toISOString()` 与 `JSON.stringify` 输出带偏移（如 `+09:00`）而不是 `Z`（原来 `disabledDate` 的 `getDay()` 读到系统时区的日期，`triggerRender` 拿到内部表示）。`dateString` 按目标时区格式化，与输入框文字一致，可原样传回 `value`（原来按系统时区格式化）。
- 设置 `timeZone` 后，今天的标记、默认面板月份、空输入回落的今天、嵌入输入框自动补的时间都按目标时区取当前时间。
- `utcToZonedTime`（TimePicker 同用）遇到系统时区跳过的时刻不再后移一小时，返回 `TZDate`（`Date` 子类），其 `toISOString()` 带偏移而不带 `Z`。`TZDate` 在首次加载时从 `Date.prototype` 复制 getter，测试中 mock `Date` 且用 `timeZone` 时，要在 mock 之前加载组件。
- 受控 DatePicker 在值已为空时点清除不再触发 `onChange([])`，值非空时照旧触发，输入框在使用方改值前继续显示原值。
- 范围选择：焦点移到另一端发生在 `onChange` 之后（原来在之前），`onChange` 里读到的焦点仍是选中日期所属的输入框。
- `insetInput` 的时间输入框聚焦时，两侧面板逐个切到时间视图，第二个滚动列表出现时量一次高度并重新居中。
- 受控 `open` 改为 false 时，面板内的键盘焦点（嵌入输入框、日期格、时间列表）交还触发器，与 Esc、选中关闭一致（原来落到 body）。`insetInput` 的范围类型在出场动画期间关闭时，焦点不再被拉回即将卸载的嵌入输入框。

### Tooltip、Popover

- 破坏性：弹层改用 Popover API 进入 top layer，Portal 到触发元素所在根节点，不受祖先 `overflow`、`transform`、`z-index` 影响，也不在触发元素 DOM 内。位置按视口计算，`x-placement` 是自动翻转后的方位；放得下视口的弹层夹在视口内，触发器滚出或被裁出可见区域时弹层隐藏；打开期间随滚动、窗口 resize、触发器或弹层的尺寸变化重新定位，只随触发器所在区域的滚动重算，同一帧内的多个弹层一起重算；触发器只因别处布局变化而移动时也会跟随，但晚一帧。Tooltip、Popover、Dropdown 与 Select 的 ref 都提供 `rePosition()`（Popover 的 `PopoverHandle` 为新增），立即按触发器当前位置重新定位，一般无需调用。Tooltip 左右两侧边角方位（`leftTop`、`leftBottom`、`rightTop`、`rightBottom`）的箭头离弹层角 1px 更远，与 Popover 和上下方位一致，`arrowPointAtCenter` 时正对触发器中心。
- 新增：页面有固定顶栏时，在 `:root` 上设 CSS 变量 `--semi-tooltip-viewport-inset-top`（顶栏高度，可写 `calc()`、`var()`），所有基于 Tooltip 的弹层把视口顶部这一段当作不可用：翻转与夹取都避开它，触发器整个落在顶栏下方时弹层隐藏。top layer 不受 `z-index` 影响，顶栏无法靠层级盖住弹层。打开时读取一次，打开期间修改要到下次打开才生效。
- 新增：Tooltip、Popover 与 Dropdown 的 ref 提供 `getPopup()`，返回当前弹层元素，未显示时为 `null`（Svelte 经 `bind:this` 调用，Dropdown 原有）；React、Solid 的 Tooltip、Popover 新增 `aria-describedby`，`role="dialog"` 时落在弹层上，其他 role 不落弹层。
- 破坏性：删除 Tooltip、Popover、Popconfirm 的 `getPopupContainer`、`zIndex`、`margin`、`rePosKey`，`numbers.DEFAULT_Z_INDEX`、`MARGIN`、`ARROW_BOUNDING`，以及 `arrowBounding`、`transformFromCenter`、`ArrowBounding`；新增 `TooltipHandle.hide()`。`onEscKeyDown`、`onClickOutSide` 的参数类型改为原生 `KeyboardEvent`、`MouseEvent`。
- 行为变化：`closeOnEsc` 默认 `true`（Modal 内的提示先按 Esc 只关提示，旧行为传 `closeOnEsc={false}`）；Popover 的 `disableFocusListener` 默认改为 `false`；新增 `afterOpen`（Vue `afterOpen` 事件，进场动画结束后调用）与 `onOpen`（Vue `open` 事件，弹层显示时调用，早于 `afterOpen`），Popover、Popconfirm、Dropdown 一并转发；受控 `visible` 只报告请求，触发器操作只报告 `onVisibleChange(true)`、关闭类操作只报告 `(false)`，React 在 `visible={false}` 时须在回调中回写才会打开。
- 行为变化：进出场改为 keyframes 动画（`semi-tooltip-zoom-in`、`semi-tooltip-zoom-out`），Popover、Dropdown 同样适用；关闭时弹层在出场动画期间仍为 `:popover-open`，动画结束才隐藏，出场中重新打开从头播放进场。覆盖过弹层 `transition` 的自定义样式改为覆盖 `animation`。
- 行为变化：React 中触发元素卸载后仍显示的弹层，在外部按下时照常通知 `onClickOutSide` 并按触发方式关闭，与 Vue 一致。
- 行为变化：出场动画期间重新打开时，这次出场作废并立即调用一次 `afterClose`，每次显示都有自己的 `afterClose`（Modal、SideSheet 仍把它算作同一次显示）。在外部元素的 mousedown 处理中打开受控的 `trigger="custom"` 弹层时，同一次按下不再算点击外部。Popover 的箭头 svg 带 `aria-hidden="true"`。
- 行为变化：Select、TreeSelect、Cascader、AutoComplete 的下拉打开而焦点不在组件内时，按 Esc 也关闭下拉（原来 Esc 被弹层认领后没有任何反应）；Select 在 `loading` 时仍不响应。
- 行为变化：hover 触发的弹层在隐藏后重新显示时，若指针与焦点都已离开触发器与弹层则关闭；隐藏期间受控 `visible` 变为 false 或 `condition` 变为 false，重新显示时关闭。React 的 `<Activity>` 隐藏不再误发 `afterClose`；Svelte 无出场动画的关闭，`afterClose` 推迟一个微任务。
- Vue：内容用 `#content="{ initialFocusRef }"`，触发器用默认插槽，可见性用 `visible`、`update:visible`、`visibleChange`；`class`、`style` 落在弹层，其他未声明属性丢弃；可访问名称键为 `ariaLabel`、`ariaLabelledby`，另有 `ariaDescribedby`（React、Solid 写作 `aria-describedby`）。
- Solid：触发器写成函数 children `(getTriggerProps) => JSX`，把 `getTriggerProps(own)` 的结果展开到触发元素上；要与注入值合并的 `ref`、`tabIndex`、`aria-*`、`data-popupid` 作为 `own` 传入，写在展开之后会整体覆盖。退出描述写 `getTriggerProps({ 'aria-describedby': null })`，后代经 `useTooltipDescription()` 取弹层 id。
- Solid：非函数 children 一律包进 Tooltip 自己的 span，Button、Input、链接这类可聚焦触发器要用函数形式；禁用、加载中的特殊触发器只识别 Semi Button、IconButton、Input、TextArea、InputNumber、PinCode、TagInput、Switch、Checkbox、Radio、Rating、Slider、Select、TreeSelect、Cascader、AutoComplete、TimePicker、DatePicker、Upload、Pagination、Transfer，不识别原生 `<button disabled>`。`role="dialog"` 时按渲染出的元素（`own.role`、`role` 属性、button、带 href 的 a）决定是否输出 `aria-haspopup`、`aria-expanded`、`aria-controls`。
- Solid：弹层位于 挂载点 > div > [popover]，`body > .semi-tooltip-wrapper` 这类选择器不再匹配；弹层内的组件用 `preventDefault` 认领 Escape，`stopPropagation` 无效。
- Solid：在触发器或内容中渲染的 Tooltip 类弹层里按下鼠标不算点击外部，其他组件在触发器中渲染的 Portal 里按下仍算外部；指针或焦点移入内容中渲染的弹层不算离开外层，移入触发器上渲染的弹层（如外包 Tooltip 的 Dropdown 菜单）算离开（同 React）；指针从触发元素直接移入本弹层不触发离开，`mouseLeaveDelay` 为 0 时也不关闭（React 会关闭）。
- Solid：Popover 未传 `arrowStyle` 时，箭头颜色读对象 `style` 的 `background-color`、`border-color`，字符串 `style` 不参与；`ref` 在组件创建时交出 `PopoverHandle`。
- Solid：函数形式的 `content` 像 JSX 的函数子节点一样在跟踪作用域中调用：函数体内读取的 signal 变化时整体重建内容，在返回的 JSX 中读取的 signal 原地更新；`content={<For each={...}>...</For>}` 这类 JSX 在弹层打开期间随数据更新。
- Solid：`ref` 在组件创建时交出 `TooltipHandle`，`initialFocusRef` 是 ref 回调，箭头颜色只读对象 `style` 的 `background-color`；`mouseLeaveDelay` 到时关闭时 `onVisibleChange(false)` 晚于弹层隐藏，卸载时补发的 `afterClose` 同步调用；`motion={false}` 时也在隐藏后的微任务中移除弹层并调用 `afterClose`（React 在同一次提交中调用），使它晚于 foundation 定时器触发的 `onVisibleChange(false)`。
- Svelte：触发器默认包进 Tooltip 自己的 span（`semi-tooltip-trigger-wrapper`）；可聚焦的触发器改用 `child` snippet：`{#snippet child({ props })}<button {...props}>…</button>{/snippet}`，`props` 带 `data-popupid`、`tabindex`、`aria-describedby` 和取元素引用的 attachment，必须整体展开；`role="dialog"` 且元素可承载弹层状态时另带 `aria-haspopup`、`aria-expanded`、`aria-controls`；包装 span 里有可聚焦元素时，span 退出 Tab 顺序并在开发期告警。
- Svelte：`visible` 可绑定，配 `onVisibleChange`；事件为 `onClickOutSide`、`onEscKeyDown`、`onOpen`、`afterOpen`、`afterClose`；`content({ initialFocusRef })` 的 `initialFocusRef` 是回调，可直接写 `{@attach initialFocusRef}`；箭头用 `arrow` snippet；`class`、`style` 只落在弹层上，`style` 只接受字符串，其中的 `background-color` 也给箭头着色；对外方法 `focusTrigger`、`getPopupId`、`hide`、`rePosition` 经 `bind:this` 调用。
- Svelte：不提供 `useTooltipDescription`（弹层 id 已在 `child` 的 `props` 里）；弹层只在挂载后渲染，服务端不输出。
- Svelte：span 内唯一的子元素（Button 的组分隔线不算）是 Semi Button、IconButton、Switch、Checkbox 时，由它们向 Tooltip 登记：disabled 或 loading 的 Button、IconButton 在 `click`、`contextMenu` 触发（loading 时除 `custom` 外的所有触发）下由 span 接管指针；loading 的 Button 的 `aria-describedby` 与弹层状态落在按钮上，span 的 `tabindex` 为 -1；Switch、Checkbox 的描述落在 input 上，Tab 只停在 input；新增 `wrapWhenSpecial`（默认 true）；原生 `<button disabled>` 与 `child` snippet 里的特殊触发器不识别，首帧与服务端不知道特殊状态，挂载后才补上。
- Svelte：`stopPropagation` 在弹层元素的 Svelte `onclick` 里执行（含 `stopImmediatePropagation`），弹层内容的 `onclick` 正常收到点击；在 Svelte 事件委托注册之前添加的 document 点击监听仍会收到事件，之后添加的收不到。
- Svelte：Popover 触发器写法同 Tooltip，可聚焦触发器用 `child` snippet 展开 `props`，不传时包进 Tooltip 的 span；内容用 `content({ initialFocusRef })` snippet；`visible` 可绑定，配 `onVisibleChange`，没有 `defaultVisible`；对话框名称键为 `'aria-label'`、`'aria-labelledby'`、`'aria-describedby'`；`class`、`style` 落在弹层上，`style` 只接受字符串，未传 `arrowStyle` 时箭头颜色读 `style` 里的 `background-color`、`border-color`；`focusTrigger()`、`rePosition()` 经 `bind:this` 调用；箭头 svg 带 `aria-hidden="true"`。
- 行为变化：`guardFocus` 的 Tab 环由 FocusTrapHandle 处理，焦点停在弹层容器本身时按 Tab 也被圈住；`guardFocus` 每次打开读取一次，打开期间修改要到下次打开才生效。`mouseLeaveDelay` 小于 `mouseEnterDelay` 的警告统一按 `(mouseLeaveDelay ?? 0) < (mouseEnterDelay ?? 0)` 判断，两个延时变化时重新检查。
- 行为变化：Vue、Solid、Svelte 的弹层在 KeepAlive 激活、`<Activity>` 重新显示时也会重新检查指针是否仍在触发器上（React 原本如此）；Vue KeepAlive 失活时释放弹层的 layer。
- React：Server Component 中 Tooltip、Popover、Dropdown 包着的元素在 dev 下以 lazy 形态到达浏览器时，照常作为触发器，不再多包一层 `semi-tooltip-trigger-wrapper`，hydration 不再报不一致。

### Modal、SideSheet

- 破坏性：`Modal.info`、`success`、`error`、`warning`、`confirm`、`useModal`、`destroyAll` 改由 `modal/index` 挂载，深导入 `modal/modal` 的组件不再带这些静态方法；`cancelButtonProps.onClick`、`okButtonProps.onClick` 不再替换内置处理，先于 `onCancel`、`onOk` 调用，需替换的改在这两个回调里处理。
- 行为变化：SideSheet 的 `visible` 变为 false 时把焦点还给打开前的元素（四个框架一致）。
- 破坏性（类型）：`onCancel` 参数为 `React.MouseEvent | KeyboardEvent`（Esc 传原生事件）；Modal 的 `direction` 收窄为 `'ltr' | 'rtl'`，删除深路径导出的 `ConfirmType`、`Directions`；`Modal.useModal` 返回 `[ModalHookApi, ReactElement]`；`SideSheetState` 删除 `displayNone`；深路径 `side-sheet/index` 导出的 `SideSheetContentProps` 以 `sheetSize` 代替 `width`、`height`。
- 行为变化：Modal 的 `footer={undefined}`、`header={undefined}` 与不传相同，隐藏传 `null`；SideSheet 隐藏关闭按钮用 `closable={false}`；Modal 新增 `role?: 'dialog' | 'alertdialog'`（确认框默认 `alertdialog`），组件版不再默认设 `aria-describedby`；模态判断统一为 Modal `mask && (容器在 body 内 || maskFixed)`、SideSheet `mask && 容器在 body 内`，`mask={false}` 时不再锁 body 滚动、不拦截页面点击，非模态不再把 Tab 锁在层内。
- Vue：Modal 用 `v-model:visible`，仅取消路径更新，确定按钮只调 `onOk`；`title`、`header`、`footer`、`icon`、`closeIcon`、`modalRender` 改为 `#title`、`#header`、`#footer`、`#icon`、`#closeIcon`、`#modal="{ modal }"`；`useModal` 返回 `[api, Holder]` 并须渲染 `<Holder />`，静态方法读应用上下文时先 `app.use(Modal)`。SideSheet 的 `title`、`footer`、`closeIcon` 改同名插槽，`onCancel` 改 `cancel` 事件，`afterVisibleChange` 改同名事件，新增 `update:visible`，无 `defaultVisible`。
- Solid：`title`、`header`、`footer`、`icon`、`closeIcon`、`content` 为 `JSX.Element`，`style`、`bodyStyle`、`maskStyle`、`headerStyle` 接受对象或字符串；`onCancel` 收到原生 `MouseEvent | KeyboardEvent`，`onOk`、`onCancel` 的返回值只在是 Promise 时等待，`() => setVisible(false)` 可直接写；`okButtonProps`、`cancelButtonProps` 用 `autoFocus` 指定初始聚焦（不落到 DOM）。`Modal.useModal()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，挂载前调用 api 也立即生效；静态方法只读全局默认值与默认语言包，`direction` 需自行传入。`getPopupContainer` 在组件挂载后才调用；页面取消动画（`animation: none`）时离场立即结束并卸载；SideSheet 显示中卸载时同步调用 `afterVisibleChange(false)`，服务端渲染释放时不调用。传 `header` 时不读取 `title`、`icon`。
- Svelte：SideSheet 的 `visible` 可绑定，没有 `defaultVisible`；关闭按钮、遮罩、Esc 先把 `visible` 写回 false，再调 `onCancel`（收到原生 `MouseEvent | KeyboardEvent`），函数绑定的 setter 可以拒绝关闭；`afterVisibleChange` 是回调 prop。
- Svelte：SideSheet 的 `title`（字符串或 snippet）、`footer`、`closeIcon`、`children` 是 snippet；`bodyStyle`、`headerStyle`、`maskStyle`、`style` 只接受字符串；`aria-*` 与 `style` 落在 `role="dialog"` 元素，`class` 和其余属性落在外层 `.semi-sidesheet`；抽屉挂载后才渲染，服务端不输出；`visible` 不读全局默认值；`bind:this` 的实例提供 `getRoot()`。
- Svelte：`Modal` 与 `Modal.info/success/error/warning/confirm`、`Modal.destroyAll`、`Modal.useModal` 随包提供；`useModal()` 返回 `{ info, success, error, warning, confirm }`，不返回 Holder，也没有 `install()`，确认框读调用组件所在处的 ConfigProvider 与 LocaleProvider；命令式确认框只能在浏览器调用，服务端调用抛出指明 API 名的错误。
- Svelte：`visible` 用 `bind:visible`；`onCancel` 返回 Promise 时，兑现后才写回 `false`，拒绝则保持打开，原因由 foundation 重新抛出；`title`、`header`、`footer`、`icon`、`closeIcon`、`modal` 是 snippet，`title`、`content`、`closeIcon` 也接受字符串；尺寸类型导出名为 `ModalSize`；动画由 class 驱动，`keepDOM` 重开保留节点和内部状态。
- 容器是全屏元素（`document.fullscreenElement`）时按覆盖整页处理：Modal、SideSheet、ImagePreview 为模态并锁 body 滚动。
- 同一元素有多个退出动画时，等全部结束才卸载（React、Solid、Svelte）。React：页面取消动画（`animation: none`）时离场立即结束并卸载，原来一直不卸载。
- 行为变化：Modal 的 `afterClose`、SideSheet 的 `afterVisibleChange` 每次显示只报一次：离场动画期间重新打开算同一次显示，卸载时仍欠着的 `afterClose` 补报。`Modal.destroyAll()` 只关闭本框架包创建的确认框，不同框架的包同页时互不关闭。确认框挂载前调用 `destroy()` 时不再渲染，`afterClose` 在 `destroy()` 内同步调用。
- 行为变化：React 的 Modal、SideSheet 被 `<Activity mode="hidden">` 隐藏时不报 `afterClose`、`afterVisibleChange(false)`，只有真正卸载才报；隐藏期间释放 body 滚动锁与遮罩栈，重新显示后再取回。SideSheet 每次显示时判定一次是否模态，显示期间改 `mask` 或容器要到下次显示才生效。React ModalContent 的初始焦点按 `autofocus` 处理，与其余三个框架一致。

### Table

- 破坏性：表格语义改为 `role="table"`、`role="cell"`，删除 `aria-colcount`、`aria-colindex` 等；默认筛选图标、排序按钮（`.semi-table-column-sorter-wrapper`）、展开按钮（`.semi-table-expand-icon`）改为原生 `button`，排序方向改用表头 `aria-sort`；依赖旧角色、属性或 DOM 的选择器需调整。
- 破坏性：列宽拖动不再依赖 react-resizable，手柄类名 `.react-resizable-handle` 改为 `.semi-table-resize-handle`，宽度不小于 20px，`resizable` 只对 `columns` 写法生效；固定列阴影改用 `scroll-state` 容器查询，删除 `semi-table-scroll-position-*` 类名；`Table.Column` 的静态 `elementType` 改为 `'Table.Column'`；未声明的 `rowSpan` 不再影响表头行合并，改用 `onHeaderCell` 返回 `rowSpan`；`getVirtualizedListRef` 的 `ref.current` 只有 `scrollTo(offset)`、`scrollToItem(index, align)`；`virtualized` 只读取 `itemSize`、`onScroll`、`overscanCount`（Vue、Svelte 的 `virtualized` 没有 `onScroll`，改用 `scroll` 事件、顶层 `onScroll`），滚动回调只在纵向偏移变化时调用。
- 破坏性（类型）：`ColumnProps`、`onCell`、`onHeaderCell`、`onRow`、`onGroupedRow` 的返回对象等删除 `[x: string]: any`，自定义字段改用交叉类型；`Data` 只剩 `key?`，回调参数需标注行类型；`ChangeInfoSorter` 只剩 `dataIndex`、`sortOrder`、`sorter`；`getCurrentPageData()` 的 `groups` 改为 `Map<string | number, Set<string | number>>`；`OnGroupedRow` 首参改为 `{ groupKey, records }`；`onHeaderCell`、`resizable.onResize*` 首参改为 `ColumnProps`；删除 `RowSelectionProps.title`、`TableComponents.footer`。
- 行为变化：`rowSelection.onSelectAll` 只作用于当前筛选结果中的非禁用行，`changedRows` 只含状态变化的行；`TableProps` 声明 `onRowMouseEnter`、`onRowMouseLeave`、`onRowDoubleClick`、`onRowContextMenu`（后两者原来不生效）；只设 `filterDropdown` 或 `renderFilterDropdown` 的列也渲染筛选入口；开启 `rowSelection.clickRow` 时，点击展开行或分组行不选中行；选择列、展开列不在最前时，树形缩进与展开按钮仍落在第一个数据列。
- 新增：行选择支持 Shift 范围选择。按住 Shift 点击选择框（`clickRow` 时也可点击行，或在选择框上按 Shift+Space），把锚点（上一次不按 Shift 点击的行）到当前行之间的当前页可见行设成锚点的选中状态，跳过禁用行；锚点不变时再次 Shift 点击替换上一段范围，范围外的选择不变。锚点不在当前页或 `checkRelation` 为 `'related'` 时按普通点击处理；范围选择只调用一次 `onChange`，不调用 `onSelect`。Cmd、Ctrl 点击没有单独的行为。
- `virtualized.itemSize` 为 `null`，或函数返回 `null`、`undefined` 时，按 `size` 预设的默认行高排布，不再告警。
- 传 `groupBy` 时服务端渲染的首帧已含分组行。
- 同时传受控 `expandedRowKeys` 与非空 `defaultExpandedRowKeys` 时，首帧（含服务端 HTML）按受控值展开（原来按默认值展开，直到受控值下次变化）。
- `defaultExpandAllRows`、`expandAllRows`、`defaultExpandAllGroupRows`、`expandAllGroupRows` 与 `rowSelection.defaultSelectedRowKeys`（含 `checkRelation: 'related'` 推出的子孙、父级与半选）在服务端渲染与 hydration 首帧就生效，原来挂载后才展开、选中。
- 样式：表头背景在 `bg-1` 上叠加 `fill-0`（新增 `$color-table_th-fill-default`），固定表头时为对齐表体滚动条而预留的表头滚动条改为透明，该区域同样铺满灰底，可排序表头悬浮改为 `fill-1`；表头垂直内边距 `$spacing-table_row_head-paddingY` 由 8px 改为 12px，分割线 `$width-table_header_border` 由 2px 改为 1px；固定列的边线只在有内容滚到其下方时显示，阴影由单元格上的 3px 实色 `box-shadow` 改为通高的渐变伪元素（宽 `$width-table_fixed_shadow`，颜色由 `--semi-table-fixed-shadow` 决定，暗色模式取 `$color-table_shadow-bg-dark`），删除 `$shadow-table_left`、`$shadow-table_right`；`bordered` 的右侧外框改由容器的 `border-inline-end` 绘制，位于滚动条外侧，延伸到表格末端的单元格带 `semi-table-cell-last` 并去掉自身右边框，不再出现两条边线；虚拟化表格的固定列也显示阴影；分组行展开收起时不再闪现纵向滚动条。
- React：`resizable` 在服务端渲染与 hydration 期间输出普通表格，hydration 后再加载列宽拖动。
- 受控 `filterDropdownVisible` 时点击筛选图标只调用 `onFilterDropdownVisibleChange(true)` 请求，使用方回写后才打开；非受控的自定义筛选面板与 `filterConfirmMode="confirm"` 菜单，`onFilterDropdownVisibleChange(true)` 在弹层显示后调用，回调里可聚焦面板内元素。
- Vue：单元格内容用 `#cell` 作用域插槽（表级或 `Table.Column`，代替 `render`），表头用 `#headerCell` 或 `#title`；表级 `title`、`footer` 只接字符串，节点用 `#title`、`#footer`、`#empty`、`#expandedRow`、`#groupSection`、`#pagination`、`#selectionCell`、`#expandIcon`、`#sortIcon`、`#filterIcon`、`#filterDropdown`、`#filterDropdownItem`；合并单元格改由 `onCell` 返回 `colSpan`、`rowSpan`。事件为 `change`、`expand`、`expandedRowsChange`、`rowMouseEnter`、`rowMouseLeave`、`rowDoubleClick`、`rowContextMenu`、`scroll`，支持 `v-model:expandedRowKeys`；`onRow` 等返回对象用 Vue 命名（`class`、`onMouseenter`）。
- `virtualized` 的表体在每一列都有数值 `width` 时，首次渲染（含服务端渲染）就带行，选择列与展开列取默认宽度；有列没有数值 `width` 时，挂载并量出列宽后才渲染表体。
- Solid 破坏性：列配置只放数据（同 Vue）。`render` 只返回单元格内容，不再接受 `{ children, props }`，单元格属性与 `colSpan`、`rowSpan` 改用 `onCell` 返回，删除 `RenderReturnObject`、`ColumnRenderReturnType` 导出；列 `title` 收窄为 `string | ((props: ColumnTitleProps) => JSX.Element)`，带标记的标题写成函数；`filterDropdown` 改为 `() => JSX.Element`；`filterIcon` 只接受 `(filtered: boolean) => JSX.Element`；`filters[].text` 与 `renderFilterDropdownItem` 参数的 `text` 收窄为 `string`，带标记的筛选项用 `renderFilterDropdownItem`。
- Solid：`Table.Column` 是只携带列配置的 token，不渲染自身；`ref` 拿到根元素 `TableElement`，其上的 `getCurrentPageData()` 在调用时读取当前状态；`getVirtualizedListRef` 直接收到列表句柄（`scrollTo(offset)`、`scrollToItem(index, align)`），没有 `.current`，在虚拟列表创建时（表头量完列宽之后）调用一次。`onCell`、`onHeaderCell`、`onRow`、`onHeaderRow` 的返回对象用 Solid 命名（`class`、`onDblClick`）；合并单元格只由 `onCell` 返回 `colSpan`、`rowSpan`（同 Vue），为 0 时跳过该单元格且不调用 `render`。不提供 `shouldCellUpdate`，单元格只随自身读取的数据更新；`resizable` 静态导入，没有先渲染普通表格的加载阶段。
- Solid：列的 `render`、`onCell`、`onHeaderCell`、`onRow`、`expandedRowRender` 只在记录、下标或列变化时重新调用（悬停、选中、展开不触发）；函数形式的列 `title` 在跟踪作用域中调用（同 Tooltip 的 `content`），返回 `<Show>` 这类 JSX 时随数据更新。`render` 的第四个参数、`rowSelection.renderCell`、`renderFilterDropdown`、`sortIcon` 与 `useFullRender` 时函数 `title` 的参数是活对象，字段要在返回的 JSX 中读取；破坏性（类型）：其中 `expandIcon`、`selection`、`indentText`、`originNode`、`sorter`、`filter` 是渲染函数 `() => JSX.Element`，在插入处调用，每次调用新建一个节点，没调用的不创建；`sorter`、`filter` 在列没有排序、筛选时不存在，`title` 里用 `parts.sorter?.()`。函数形式的 `expandIcon` 在展开状态变化时替换节点，旋转过渡不播放。
- Svelte：没有 `Table.Column`，列只用 `columns` 数据声明；列的 `render`、`title` 函数与列插槽改为 Table 级 snippet：`cell`、`headerCell`、`sortIcon`、`filterIcon`、`filterDropdown`、`filterDropdownItem`、`selectionCell`、`expandedRow`、`groupSection`、`empty`，参数带 `column`，按列分支，空 snippet 不回落默认渲染。
- Svelte：`selectionCell` 收到 `originNode` snippet 渲染原复选框；自定义筛选面板在列上设 `filterDropdown: true` 并配 Table 级 `filterDropdown` snippet；`title`、`footer` 接受字符串或 snippet；分页自定义渲染用 `paginationContent` snippet；`expandIcon` 接受 `boolean` 或 `Snippet<[{ expanded }]>`。
- Svelte：顶层 `selectedRowKeys`、`currentPage` 可绑定（`bind:selectedRowKeys`、`bind:currentPage`），与 `rowSelection.selectedRowKeys`、`pagination.currentPage` 同时给时以顶层为准，嵌套写法行为不变；显示选择列仍需传 `rowSelection`。`pagination` 没有 `currentPage` 时 Table 自己分页，`bind:currentPage` 提供起始页并随翻页写回，父级改值导致的翻页不触发 `onChange`，只有用户点页码或改页大小才触发。
- Svelte：`expandedRowKeys` 可绑定，删除 `defaultExpandedRowKeys`，嵌在对象里的非受控默认值保留：`defaultExpandAllRows`、`defaultExpandAllGroupRows`、`rowSelection.defaultSelectedRowKeys`、列的 `defaultSortOrder`、`defaultFilteredValue`。
- Svelte：`components` 只接受字符串标签；`onRow`、`onCell`、`onHeaderRow` 返回 Svelte 小写属性（`onclick`、`colspan`）；受控 `pagination.currentPage` 表示远程分页，Table 不再切片 `dataSource`。
- `virtualized.itemSize` 可以是函数 `(index, { sectionRow, expandedRow }) => number`，返回空值时用默认行高；`virtualizedData`、`itemSize` 或 `size` 变化时重新计算行偏移。
- Vue：`Table.Column` 子列的 `defaultSortOrder`、`defaultFilteredValue` 在服务端渲染的首帧已生效。
- 服务端渲染的首帧已带筛选排序后的行键、行 key 映射与禁用行键，表头全选框在服务端 HTML 中的勾选状态可能与原来不同；隐藏再显示不重算分页；缺少 `rowKey` 的开发模式警告只在相关 prop 变化时触发。Solid：`pagination.pageSize` 变化的比较错误已修正。
- 只改 `pagination.pageSize` 时行数随之更新。合并表头中 `colSpan`、`rowSpan` 为 0 的列不再让后面列的固定偏移错位。
- 缺 `dataIndex` 的告警统一为「列从不缺变为缺时警告一次」（Solid、Svelte 原来每次列变化都重复警告）。`pagination.onChange` 显式传 `undefined` 时翻页走表格自身分页（React、Solid、Vue 原来翻页不生效）；`BasePagination` 类型增加 `onChange?`。`scrollToFirstRowOnChange` 只在 foundation 处理，四个框架一致。
- React：`onFilterDropdownVisibleChange` 传入非函数的非空值时抛 TypeError（原来先判断是否为函数）。
- 可访问性：表体内容超出可视区时可用键盘聚焦滚动（`tabindex="0"`，原来只有设了 `scroll.y` 才可聚焦）；不拆分表头的表格，表体在可滚动时带 `role="group"` 与语言包 `Table.scrollRegion` 名称；固定表头、虚拟化时滚动容器在 `role="table"` 内，只可聚焦，不加角色和名称。标题为空的列在表头单元格内渲染视觉隐藏的 `Table.untitledColumn` 文本（类名 `semi-table-column-untitled`）。只剩图标的排序按钮（`useFullRender` 时标题函数拿到的排序器、标题为空的可排序列）以下一次排序动作（`Table.ascend`、`Table.descend`、`Table.cancelSort`）命名，四个框架一致。
- 每个叶子列都声明数值 `width` 时，表头与表体的 table 带 `min-width`（列宽之和），WebKit 不再把 `table-layout: auto` 的表格压到容器宽度、按比例缩小各列。
- 破坏性（类型）：React、Solid 的 `VirtualizedOnScrollArgs.scrollOffset` 改为必填；`OnFilter` 首参名改为 `value`。

### Checkbox、Switch

- 破坏性（样式钩子）：删除 `semi-switch-focus`（及 `cssClasses.FOCUS`）、`semi-checkbox-focus`、`semi-checkbox-focus-border`，焦点环改由 CSS `:has(input:focus-visible)` 绘制；`SwitchState.nativeControlChecked` 改名 `checked`；Switch 的 `checked` 与 `defaultChecked` 同传时取 `checked`。
- 行为变化：Checkbox、Radio 的 `id` 落在原生 input 上（用 `#id` 选根元素的写法需改选 input 的父级），input 带 `value`；Checkbox 不再响应 Enter 切换（仅空格）；`onClick` 在切换前调用；Switch 的 `loading` 期间切换被忽略且不通知 `onChange`；Switch 的全部 `aria-*` 落在 `role="switch"` 的 input 上，不再有任何 `aria-*` 落在根元素。
- CheckboxGroup 内没有 `value` 的 Checkbox 不参与分组取值，也不再继承分组的 `aria-invalid`、`aria-errormessage`。
- React：Checkbox `onChange` 事件的 `nativeEvent` 为点击事件（原生 `MouseEvent`，空格切换也是点击事件），可读 `shiftKey` 等修饰键，与其他框架一致。
- Vue：Switch 的 `checked` 改为 `modelValue`，通过 `update:modelValue` 与 `change(checked, event)` 通知；`checkedText`、`uncheckedText` 改为具名插槽。
- Solid：Checkbox 的 `ref` 是根元素，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；`autofocus`、`onFocus`、`onBlur` 落在原生 input 上；`onChange` 事件的 `target` 为 `{ checked, value, name, disabled }`，`nativeEvent` 为点击事件；CheckboxGroup 的 `onBlur` 在焦点离开整个分组时触发，`options` 项的类名字段为 `class`。
- Solid：Switch 的 `ref` 是根元素，其 `focus()`、`blur()` 作用于原生 input。
- Svelte：Switch 的 `checked` 可绑定，`checkedText`、`uncheckedText` 为 snippet；`aria-*`、`id`、`name`、`tabindex`、`autofocus` 与焦点监听落在原生 input 上，其余未声明属性落在根元素。
- Svelte：Checkbox 的 `checked` 与 CheckboxGroup 的 `value` 可绑定，不提供 `defaultChecked`、`defaultValue`；`onChange` 对 Checkbox 收 `(event)`，`target` 为 `{ checked, value, name, disabled }`，对 CheckboxGroup 收 `(value)`。
- Svelte：`extra` 以及分组选项的 `label`、`extra` 是 snippet，参数 `{ option, index }`；`Checkbox.Group` 与具名导出 `CheckboxGroup` 是同一组件；`onclick` 在切换前调用，`onBlur` 在焦点离开整个分组时触发；`focus()`、`blur()` 经 `bind:this` 调用。
- Svelte：Switch、Checkbox 作为 Tooltip `child` snippet 的触发器时，`{...props}` 里的 attachment 会传到根元素。

### RadioGroup、CheckboxGroup

- 破坏性：Radio `mode="advanced"` 的 input 由 `type="checkbox"` 改回 `type="radio"`，按 `checkbox` 查询的测试需改为 `radio`；Checkbox、Radio 的 `onChange` 事件 `target` 在四个框架都只有 `{ checked, value, name, disabled }`，不再展开组件 props（原 Semi 为全部 props 加 `checked`）；删除 `semi-radio-focus`、`semi-radio-focus-border` 等焦点与悬停类名，改用 CSS `:focus-visible`、`:hover`。
- 破坏性（类型）：CheckboxGroup 的 `options` 收窄为 `Array<string | CheckboxOptionItem>`，`value`、`defaultValue`、`onChange` 参数收窄为 `Array<string | number | boolean>`，新增 `CheckboxOptionItem`；`RadioInnerProps` 不再含 `style`、`className`、`children`、`preventScroll`，新增 `id`、`value`。未传 `name` 时每组生成唯一 name，RadioGroup 内没有 `value` 的 Radio 在组值为 `undefined` 时不再判为选中。
- 行为变化：Radio 的 `checked` 与 `defaultChecked` 同传时取 `checked`，`checked={false}` 时内部状态不再被 `defaultChecked` 置为选中。
- Vue：Checkbox、Radio 的 `modelValue` 对应 `checked`，分组的 `modelValue` 对应 `value`，`change` 的 `target` 为 `{ checked, value, name, disabled }`；`extra` 为具名插槽；分组 `options` 项字段为 `label`、`extra`、`value`、`disabled`、`class`、`style`，无 `onChange`，自定义内容用 `#label`、`#extra`（参数 `{ option, index }`）。
- Solid：Radio 的 `ref` 是根 label，其 `focus()`、`blur()` 作用于原生 input，`focus()` 套用 `preventScroll` 属性；`autofocus`、`onFocus`、`onBlur` 落在原生 input 上；RadioGroup 的 `onBlur` 在焦点离开整个分组时触发，文本子节点被丢弃；`aria-invalid`、`aria-errormessage`、`aria-required` 不落在 `role="radio"` 的 input 上。
- Solid 破坏性（类型）：RadioGroup `options` 项的 `label`、`extra` 收窄为 `string | number`（同 Vue），其他内容由 RadioGroup 新增的 `renderLabel(option, index)`、`renderExtra(option, index)` 提供（对应 Vue 的 `#label`、`#extra`），按钮型不调用 `renderExtra`；AIChatInput 的 `Configure.RadioButton` 同样适用。
- Svelte：Radio 的 `checked` 与 RadioGroup 的 `value` 可绑定，支持 `bind:`、函数绑定、单向传值、不传四种写法，不提供 `defaultChecked`、`defaultValue`，全局默认值也不能设 `value`、`checked`；`onChange(event)` 的 `target` 为 `{ checked, value, name, disabled }`。
- Svelte：RadioGroup 保留 `options`，自定义内容用 `label`、`extra` snippet（参数 `{ option, index }`），Radio 的 `children`、`extra` 是 snippet；`Radio.Group` 与具名导出 `RadioGroup` 是同一组件；`style`、`addonStyle` 及选项里的同名字段只接受字符串。
- Svelte：根元素透传的是 `onclick`，只在点击落在 input 上时调用一次；`onBlur` 在焦点离开整个分组时触发；`focus()`、`blur()` 经 `bind:this` 调用。
- 行为变化：RadioGroup 内的 Radio 一律使用组的 `name`，Radio 自己的 `name` 不再生效（原来 Radio 的优先，设了不同 `name` 的 Radio 会脱离组的方向键导航），与 CheckboxGroup、Ant Design 一致。
- Vue（类型）：RadioGroup 改为泛型 `RadioGroup<T extends RadioValue>`，`modelValue`、`defaultValue` 与 `update:modelValue` 的参数取 `T`，字面量联合类型的 ref 可直接 `v-model`；`RadioGroupProps`、`RadioGroupEmits` 带同名类型参数（默认 `RadioValue`），FormRadioGroup 随之泛型。
- 破坏性（类型）：Checkbox、Radio 的 `onChange` 事件 `target` 中 `value`、`name` 改为可选属性（`value?: T`、`name?: string`），四个框架与 foundation 的 `RadioChangeEvent`、`BasicTargetObject` 一致；手写成必填属性的回调参数类型需改为可选或直接用导出的事件类型。

### Steps

- 破坏性：Steps 把每个有效子元素按顺序当作一个步骤位置（Fragment 展开后编号，文本不占位），fill 列宽与 nav 的 `total` 按它计数，原生元素只占序号、不注入步骤属性；`StepProps`、`BasicStepProps`、`FillStepProps`、`NavStepProps` 不再含 `children`（类型）。可点击（设了 `onChange` 或 `onClick`）的 Step 带 `role="button"`。
- Vue：`onChange` 与 `onUpdate:current` 都是函数属性，支持 `v-model:current`，传入任一个时所有 Step 可点击，不支持 `@change.once`；Step 的 `title`、`description`、`icon` 改为插槽，不再有 `elementType`，包装 Step 的组件无需透传属性。
- Solid：只有 `Steps.Step`（包括只渲染 Step 的包装组件）占步骤位置，原生元素与文本不占序号、不计入 fill 列宽与 nav 的 `total`，被丢弃并在开发期告警；放在 Steps 外的 Step 单独写时不渲染，在数组中显示为 "[object Object]"。
- Svelte 破坏性：没有 `Steps.Step`，步骤改为 `dataSource: StepData[]`（`status`、`title`、`description`、`onClick`，其余属性落在步骤根元素上），内容用 Steps 的 `title`、`description` snippet，参数 `{ item, index }`；自定义图标逐项设置：`StepData.icon?: Snippet | false`，设了 snippet 的步骤用自定义图标，`false` 时该步骤图标区为空，未设的步骤用内置状态图标，没有组件级 `icon` snippet。
- Svelte：`current` 不可绑定，回调 `onChange(current)`；设了 `onChange` 才让所有步骤可点击，数据项带 `onClick` 的那一步也可点击；更新 `current` 由使用方在 `onChange` 里写。
- 破坏性（深路径导入）：React 的 `steps/basic-step` 不再导出内部常量 `stepSizeMapIconSize`。

### Pagination

- 破坏性：DOM 改为 `ul > li > button`：上一页、下一页、页码、「…」是 `li` 内的原生 `button`，类名（`semi-page-item`、`semi-page-prev` 等）从 `li` 移到 button，总数、每页条数、快速跳转改为 `li`，small 模式根元素改为 `ul`，`PaginationProps.ref` 收窄为 `Ref<HTMLUListElement>`；按旧结构写的选择器需调整。删除 `popoverZIndex`。
- 行为变化：`prevText`、`nextText` 只有文字时以可见文字命名按钮；快速跳转的小数页码向下取整；`size="small"` 时 `showSizeChanger` 不生效；`total` 或 `currentPage` 变化不再重置用户选的页大小，`onPageSizeChange` 回写相同 `pageSize` 不再回到第 1 页；`popoverPosition` 传 `null` 与不传相同。
- Vue：用 `v-model:currentPage`、`v-model:pageSize`，`onPageChange`、`onPageSizeChange`、`onChange` 改为 `pageChange`、`pageSizeChange`、`change` 事件；`prevText`、`nextText` 改为同名插槽；`class`、`style`、`aria-*` 落在根 `ul`。
- Solid：`prevText`、`nextText` 为 `JSX.Element`；`class`、`style`、`ref`（回调，指向根 `ul`）与其余原生属性落在根 `ul`。
- Svelte：`currentPage`、`pageSize` 可绑定，没有 `defaultCurrentPage`、`defaultPageSize`；回调为 `onPageChange`、`onPageSizeChange`、`onChange`；未传 `currentPage` 时点击后页码成为本地值，之后 `total` 或外部 `pageSize` 变化不再回到第 1 页，绑定值写 `undefined` 才回到第 1 页；根元素是 `ul`，未声明的属性透传到 `ul`。
- Svelte：`prevText`、`nextText` 是 `string | Snippet`。非空字符串直接渲染并从首帧起作为按钮名称，空字符串与不传一样显示默认图标、用语言包名称；snippet 内容是单个文本节点时，按钮名称取该文本（挂载后读取，服务端首帧用语言包名称），图标或元素用语言包名称，传了空内容的 snippet 按钮是空的，不回落图标。
- React：defaultProps 去掉 `pageSize: null`，API 表的默认值不再显示 `null`；未传时仍取 `pageSizeOpts` 第一项。
- foundation：适配器类型 `AdapterPageList` 改名 `PageListView`；`updatePage` 的页码改为必传，非受控时 `total`、`pageSize` 变化回到第 1 页的行为不变。

### Notification

- 破坏性：默认导出 `Notification` 由组件改为普通对象，只承载静态方法与 `useNotification`，删除未文档化的 `<Notification />` 树内渲染（改用 `useNotification` 的 `contextHolder`）；删除 `NotificationListHandle`、`NoticeHandle`、`NoticeProps.onHookClose`、`NoticeState.visible`；`ConfigProps` 删除 `direction`，`NoticeInstance` 删除 `motion`；选项类型不再含 `close`、`ref`、`onAnimationEnd`、`onAnimationStart`。
- 新增 `Notification.resetConfig()` 与 `stack?: boolean | number`（`true` 为 3，同位置通知超过阈值时堆叠，悬停展开）及类型 `NotificationHookOptions`；悬停或键盘聚焦列表时全部通知暂停自动关闭；`useNotification` 的通知有进场、离场动画，并读取 `overrideDefaultProps.Notification`；`.semi-notification-notice` 上方 margin 改由 `.semi-notification-list` 的 `padding-block-start` 提供，覆盖过上方 margin 的需改覆盖列表 padding。
- 样式：堆叠中的 `.semi-notification-notice-stack-item` 改为单行 grid，展开收起由 `grid-template-rows` 过渡，覆盖其 `height` 的样式不再生效；不支持 `interpolate-size` 的浏览器在进出场动画期间给通知写内联 `height`。
- Vue：静态方法与 React 同名同参，可选 `app.use(Notification)` 让静态通知读到应用上下文（`direction` 仍需在选项里传）；`useNotification()` 返回 `[api, Holder]` 并须渲染 `<Holder />`；`title`、`content`、`icon` 为 `NotificationNode`，选项 `className` 改 `class`、`style` 为 `StyleValue`，不提供 `motion`。
- Solid：`title`、`content`、`icon` 为 `NotificationNode`（节点或返回节点的函数），在事件处理函数里调用 hook 方法时写成函数才能读到 `contextHolder` 处的 context；`useNotification()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，只放置一次；选项的 `dir`、`data-*`、`aria-*` 落在通知元素上，`ref` 拿到通知元素；静态方法只读全局默认值与默认语言包。
- Svelte：提供静态 `Notification`（`open`、`info`、`success`、`warning`、`error`、`close`、`destroyAll`、`config`、`resetConfig`、`addNotice`、`removeNotice`）和 `Notification.useNotification()`，没有 Vue 的 `Notification.install(app)`；`title`、`content`、`icon` 接受字符串或 snippet，`onClick` 签名为 `(event: MouseEvent) => void`，落在通知元素上；没有 `type` 且自定义 `icon` 时，图标元素不再带 `-undefined` 类名。
- Svelte：`Notification.useNotification()` 在组件初始化时调用，只返回 `api`，没有 Holder：通知挂在 `document.body`，读调用组件所在处的 context、ConfigProvider 与语言包，调用组件销毁时一并移除；容器带 `data-semi-keep-interactive`，模态层打开时仍可交互。
- 同一批内更新一条通知再新增另一条时，被更新的通知仍重新计时。
- React、Vue：静态方法与 `useNotification` 的选项类型并入通知元素的原生属性（`dir`、`onMouseEnter` 等），与运行时透传一致（F6）。
- 行为变化：`useNotification` 返回的 id 前缀由 `semi_notice_` 改为 `notification-`；列表处于悬停或聚焦暂停时新挂载的通知从一开始就不计时，四个框架一致。

### FloatButton、FloatButtonGroup

- 每一项渲染为原生 `<button type="button">`，有 `href` 时为 `<a>`（新增 `rel`），`ref` 类型为 `React.Ref<HTMLButtonElement | HTMLAnchorElement>`，`href` 不再经 `window.open` 跳转；纯图标按钮与子项需传 `aria-label`；FloatButtonGroup 的 `disabled` 真正禁用每一项，子项的 `href`、`disabled`、`onClick`、`shape`、`size`、`colorful` 生效。
- 破坏性（类型）：`FloatButtonProps`、`FloatButtonGroupProps` 不再接受 `children`；`FloatButtonProps` 不再含 `type` 与 `form*` 属性。Vue：`onClick` 改为 `click` 事件（FloatButton 载荷 `(event)`，Group 为 `(value, event)`），`icon` 为 `#icon` 插槽，节点型 `badge.count` 用 `#badgeCount`；Group 的 `items` 中 `className` 改 `class`，`icon`、`content`、`badge.count` 改为作用域插槽 `#icon`、`#content`、`#badgeCount`（参数 `{ item, index }`），不支持 item 的 `ref`。
- Svelte：FloatButton 的 `onClick` 改为原生 `onclick`（参数 `(event)`），与 Button 一致；有 `href` 时根元素为 `<a>`，否则为 `<button>`，不支持 ref；`icon`、`badgeCount` 是 snippet。
- Svelte：FloatButtonGroup 的 `onClick(value, event)` 保持原名，只在点击落在项上时调用；items 里 item 的 `onClick` 保持原名，先于分组的 `onClick` 调用；分组的 `icon`、`content`、`badgeCount` 是 snippet，参数 `{ item, index }`；items 里的 `class`、`style` 是字符串，`oncontextmenu`、`onmouseenter`、`onmouseleave` 用小写原生名。

### MarkdownRender

- `format="md"` 改用 unified 管线，不在运行时执行代码，可在禁用 `unsafe-eval` 的 CSP 下使用，`@mdx-js/mdx` 只在 `format="mdx"` 时加载；md 下 `components.wrapper` 不再生效；`remarkPlugins`、`rehypePlugins` 按元素比较，`[插件, 配置对象]` 需用 `useMemo` 保持引用稳定。
- 破坏性（类型）：`components` 改为 `MarkdownRenderComponents`，值必须是 React 组件或 HTML 标签名，元素键只接受组件或自身标签名，Chat、AIChatDialogue 传入的 components 同样受约束。默认 `table` 保留 GFM 列对齐且不再分页（需要时经 `components.table` 传 `pagination`）；`defaultComponents` 新增 `pre`，无语言的代码由 `span` 改为 `code` 元素。
- 有语言的代码块被 rehype 插件拆成元素（不交给 CodeHighlight）时保留外层 `pre`，原来会去掉 `pre`，空白折叠，依赖 `pre code` 的高亮样式不生效。
- React、Vue、Svelte：`pre` 按标记识别整块渲染的 `code` 组件，替换 `components.code` 并自行渲染块级结构（如带语言栏的 div）时，React 给组件加静态属性 `elementType: 'MarkdownRender.Code'`，Vue 在 `defineOptions` 写同名选项，Svelte 在模块加载时调用 `@fibrae/semi-ui-svelte/markdown-render/components/tree` 的 `markCodeBlock(组件)`；有语言且未被拆分的代码块随之去掉外层 `pre`。
- `format="md"` 在首次渲染（含服务端渲染）同步编译，服务端 HTML 与首个提交即有内容（含 GFM 表格）；`mdx` 与依赖异步插件的 md 仍在挂载后编译，服务端 HTML 中根节点为空。
- Vue：`components` 的值是 Vue 组件或标签名，覆盖组件从 attrs 读 `class`、`colspan` 等 HTML 属性名而非 `className`；MDX 手写 JSX 的监听器按 Vue 命名（`onMouseenter`、`onKeydown`、`onDblclick`）；无默认插槽与事件；替换 `code` 组件时用 `@fibrae/semi-ui-vue/markdown-render/index` 导出的 `codeText` 取源码。
- Solid：`components` 的值是 Solid 组件或标签名，覆盖组件收到 `class`（MDX 中手写的 `className` 并入 `class`）与 kebab-case 的 `style` 对象，MDX 手写 JSX 的属性与监听器按 Solid 命名（`class`、`onClick`）；`code` 只在 `props.children` 为源码字符串时高亮，替换 `code` 时同样从 `props.children` 取源码；`ref` 回调拿到根 div；重新编译或 `components` 变化后，与上次相同的顶层块保留 DOM，其余块重建（React 按元素对比）；`components.wrapper` 整体是一个块，每次编译都重建。
- Svelte：`components` 的值是 Svelte 组件或标签名；MDX 原生元素上的 `onClick` 转为 `onclick`，style 对象转为字符串。
- Svelte：默认用 Semi 组件渲染 `a`、`img`、`p`、`pre`、`code`、`h1` 至 `h6`、`table`，经 `MarkdownRender.defaultComponents` 暴露，`components` 里传的值覆盖默认项；`components` 里的组件除 `children` snippet 外还收到 `node`（编译后的元素 `{ type, props }`），自定义 `code` 用 `codeText(node.props.children)` 取源码，转发给 `defaultComponents` 时要带上 `node`，展开到 DOM 元素前要先解构掉 `node`。

### Toast

- 与 Notification 相同的变化：新增 `Toast.resetConfig()`，悬停或聚焦时暂停全部 Toast 自动关闭，每次调用都应用 `zIndex`。`stack` 类型改为 `boolean | number`，`true` 为 3，收起时只显示最前 3 层。
- 破坏性：`Toast.defaultOpts`（及 `ToastFactory.create()` 返回实例上的同名属性）改为只读，整体赋值会抛错，修改默认值用 `config()`、`resetConfig()`。
- 破坏性（类型）：`useToast` 返回元组 `[toast, contextHolder]`，方法参数不含 `type`、`id`，`content`、`icon` 只接受 ReactNode；静态方法与 `useToast` 选项类型不含 `close`，`useToast` 另不含 `zIndex`、`getPopupContainer`；`getPopupContainer` 改为 `() => HTMLElement`；删除 `ToastListHandle`、`ToastHandle`，新增 `ToastHookApi`。
- 行为变化：`useToast` 支持 `stack`，先来的在前，`contextHolder` 输出固定定位的 `.semi-toast-wrapper`；滑动统一由 `.semi-toast-content` 承担，`semi-toast-keyframe-toast-show` 不再含位移，覆盖动画样式的使用方注意选择器变化。
- 样式：堆叠中的 `.semi-toast-zero-height-wrapper` 改为单行 grid，展开收起由 `grid-template-rows` 过渡，覆盖其 `height` 的样式不再生效；不支持 `interpolate-size` 的浏览器在离场动画期间给 Toast 写内联 `height`。
- Vue：静态方法与 React 同名同参，可选 `app.use(Toast)`；`useToast()` 返回 `[api, Holder]` 并须渲染 `<Holder />`，读取 `overrideDefaultProps.Toast`，`ToastHookOptions` 不含 `top`、`bottom`、`left`、`right`、`zIndex`、`getPopupContainer`；`content`、`icon` 为 `ToastNode`，选项 `className` 改 `class`、`style` 为 `StyleValue`。
- Solid：`content`、`icon` 为 `ToastNode`（节点或返回节点的函数），在事件处理函数里调用 hook 方法时写成函数才能读到 `contextHolder` 处的 context；`useToast()` 返回 `[api, contextHolder]`，`contextHolder` 读调用 hook 处的 context，只放置一次；选项的 `dir`、`data-*`、`aria-*` 落在 Toast 元素上，`ref` 拿到 Toast 元素；静态方法只读全局默认值与默认语言包。
- Svelte：提供静态 `Toast`（含 `ToastFactory`）和 `Toast.useToast()`；`useToast()` 在组件初始化时调用，只返回 `api`，没有 Holder：hook 的 Toast 挂在 `document.body`，读调用组件所在处的 context、ConfigProvider 与语言包，调用组件销毁时一并移除。`content`、`icon` 接受字符串或 snippet，静态 Toast 的 snippet 读不到调用方的 context；服务端调用静态方法或 hook 的 `api` 抛 "can only be called in the browser" 错误，`useToast()` 本身可在服务端调用。
- Svelte：进场、离场由 store 持有离场状态，CSS 动画结束后才移除元素，不使用 Svelte 的 `in:`、`out:`；同一元素有多个离场动画时等最后一个结束（Notification 同）。
- 同一批内更新一条消息再新增另一条时，被更新的消息仍重新计时。
- 行为变化：`useToast` 返回的 id 前缀由 `semi_toast_` 改为 `toast-`（Vue 原本如此）；React、Solid 的 `useToast` 不再把 `duration: 3` 写死在选项里盖掉全局 `Toast.duration`，hook 与静态方法一样按「全局默认 < 调用参数」合并，显式 `undefined` 不覆盖。Vue、Svelte 的 `useNotification` 同样在 `open` 时合并全局默认，结果不变。
- `Toast`、`Notification` 默认导出现在是 foundation 类的实例加 `useToast`、`useNotification`（Vue 另有 `install`）；方法都是箭头属性，可以解构，`defaultOpts` 是原型上的 getter，对象展开 `{ ...Toast }` 取不到它。
- Vue：`useToast()`、`useNotification()` 在调用它们的 setup 里读取应用的全局默认值；调用 hook 的组件之下又单独提供另一份 `semiGlobal` 时，不再读到那一份。
- Svelte：内部导出 `createToastHookApi(store, beforeAdd?)` 改为 `createToastHookApi(store, { beforeAdd?, readGlobalDefaults? })`。
- React、Vue：静态方法与 `useToast` 的选项类型并入 Toast 元素的原生属性（`dir`、`title`、`onClick` 等）与 `data-*`，与运行时透传一致（F6）。React 深路径 `toast/toast` 的单条 Toast 组件 props 类型改名 `ToastItemProps`（`ToastReactProps` 只指选项类型）。
- 未传 `getPopupContainer` 时，Toast、Notification 的静态方法与 Svelte hook 在全屏期间把容器移进 `document.fullscreenElement`，退出全屏后的下一次调用移回 `body`（原来全屏时看不到）；移动会重启已显示条目的 CSS 动画。

### ColorPicker

- 输入区的间距改为逻辑属性，RTL 下镜像。
- 破坏性：`usePopover` 时弹层默认 trigger 由 `hover` 改为 `click`（`popoverProps.trigger` 优先）。`alpha` 默认为 true；受控 `value` 为 `null` 是受控的空值，变回 `undefined` 时回到 `defaultValue`。
- 破坏性（类型）：`@fibrae/semi-ui-react/color-picker` 只导出 `ColorValue`、`ColorFormat`、`HsvaColor`、`RgbaColor`，不再导出 `ColorModel`、`AnyColor`、`ObjectColor` 等；`ColorPickerFoundation` 的静态转换方法删除，改从 `@fibrae/semi-foundation/color-picker/utils/convert` 导入。
- `ColorPicker.colorStringToValue` 支持 `#rgb`、`#rgba`，无法解析或越界的颜色字符串抛出以 `Semi ColorPicker` 开头的错误（原来得到 NaN、黑色或非法 hex）。选色区与两条滑条可用键盘操作。
- Vue：`modelValue` 配 `update:modelValue`（`v-model`），`onChange` 改为 `change` 事件，类型不含 `null`；`className` 改 `class`；`topSlot`、`bottomSlot`、`children` 改为 `#topSlot`、`#bottomSlot` 与默认插槽（`usePopover` 时的触发器）；`popoverProps` 的对话框名称用 `ariaLabel`、`ariaLabelledby`。
- Solid：`className` 改 `class`；`popoverProps` 为 Solid Popover 的 props（对话框名称用 `'aria-label'`、`'aria-labelledby'`）；`usePopover` 的触发器写法同 Popover，自定义的可聚焦元素要带上弹层状态时写成函数 children `(getTriggerProps) => JSX`，非函数 children 包进 Tooltip 的 span；`ref` 回调拿到取色器 div（`usePopover` 时弹层打开后才回调），不提供命令式 handle；`style` 接受对象或字符串。
- Svelte：`value` 可绑定，没有 `defaultValue`；单向 `value={x}` 只作初值，要完全受控用函数绑定 `bind:value={get, set}`；`value` 可为 `null`，表示受控的空值，显示默认色，只报告变化（同 Solid）；`colorStringToValue` 是具名导出，不挂在组件上；`usePopover` 时顶层 `children` 是触发器 snippet，`topSlot`、`bottomSlot` 是 snippet，`popoverProps` 直接是 Popover 的 props；根元素经 `bind:this` 后调用 `getRoot()` 获取，没有 `ColorPickerHandle` 类型。

### Calendar

- 破坏性（类型）：React、Solid 的 `dateGridRender` 两个参数改为必填。
- 破坏性（深路径导入，类型）：foundation `calendar/foundation`、`calendar/event-util` 的 `weekStartsOnEnum` 改名 `WeekStartsOn`（与 Vue、Svelte 的同名类型一致）。
- 破坏性（类型）：`onClose` 参数改为 `React.MouseEvent | KeyboardEvent | null`（点击外部关闭为 `null`）；`CalendarProps` 不再包含 `children`；`DayColProps.events` 收紧为 `DailyEventLayout[]`。
- 各视图改为 ARIA 表格（ul、li 改 div，类名不变），月视图「N 更多」改为原生 `button`，展开卡片是对话框，依赖旧 DOM 结构或 role 的测试与选择器需调整。日期格与时间槽的点击回调仍只能由指针触发（已知限制）。
- 各视图的「今天」标记与当前时间线在服务端渲染与 hydration 期间不出现，挂载后再标出。
- Vue：render 属性改为作用域插槽 `#timeDisplay`、`#dateDisplay`、`#dateGrid`、`#allDayEvents`（收到全部 events）、`#header`，事件内容用 `#event="{ event }"`，`events[].children` 只放 `string | number`；`onClick`、`onClose`、`onMoreClick` 改为 `click(e, date)`、`close(e)`、`moreClick(e, date, remaining)`。
- Solid：`events[].children` 可以是节点或返回节点的函数；节点只在第一处显示原节点，跨周、跨天的片段与月视图卡片里显示不带事件处理函数的副本，需要交互时传函数。
- Solid：「今天」的标记（`semi-calendar-today` 与 `aria-current="date"`）挂载后才出现，服务端 HTML 不含；其余日期不再输出 `aria-current="false"`。月视图首帧显示全部事件，测量后才折叠为「N 更多」。
- Svelte：自定义渲染用 snippet，名字照 Vue 插槽：`header`、`event`、`dateDisplay`、`dateGrid`、`timeDisplay`、`allDayEvents`；事件为回调 prop：`onClick(event, value)`、`onClose(event | null)`、`onMoreClick(event, date, remaining)`；`events[].children` 只接受 `string | number`，其他内容用 `event` snippet。
- Svelte：提供 `header` snippet 后，即使渲染为空也保留表头行；month 视图首帧行数上限为 0，有事件的日期在服务端 HTML 里先折叠成「还有 N 项」，挂载后按真实行高展开；未传 `displayValue` 时，服务端不输出 today 高亮与当前时间线，挂载后才出现，SSR 场景应传 `displayValue`。
- RTL 下全天事件与日视图事件镜像，内联定位由 `left` 改为 `inset-inline-start`。React：月视图可见事件数变化时不再重新挂载整棵视图，事件内容的状态保留。
- 月视图同时只开一张「N 更多」卡片，打开另一张时前一张直接关闭；被折叠的日期格因行高或事件变化不再折叠时，卡片关闭并通知一次 `onClose`，不会自己重新弹出。

### Navigation

- 破坏性：删除 `getPopupContainer`（改用 `subDropdownProps` 或 Sub 的 `dropdownProps`）与 `Navigation`、`Navigation.Header` 的 `prefixCls`，类名前缀固定为 `semi-navigation`；公开的 `Nav.Item` 不再渲染 children；`toggleIconPosition` 收窄为 `'left' | 'right'`；删除 `NavState`（改用 foundation 的 `NavigationState`）。
- 破坏性：根元素由 `div` 改为 `<nav>`，`ref` 类型改为 `Ref<HTMLElement>`；导航项不再是 `menuitem`，内部渲染原生 `button` 或 `<a href>`，按 `menuitem` 查询的测试改为 `link` 或 `button`。`onSelect`、`onClick` 的 `domEvent` 由 React 合成事件改为原生事件，读 `domEvent.nativeEvent` 的代码直接用 `domEvent`。
- 破坏性：受控 `openKeys`、`selectedKeys` 为 `null` 按空数组处理；`mode="horizontal"` 忽略 `isCollapsed`、`defaultIsCollapsed`。React：Fragment 里的 Item、Sub 作为导航项渲染，不再套 `li.semi-navigation-list-extra`；`renderWrapper` 返回非 li 内容时需把 `itemElement` 放进返回值。
- 破坏性（类型）：删除 Nav 的 `multiple`、`onDeselect` 与 Nav.Sub 的 `isCollapsed`、`isOpen`、`maxHeight`（原来声明而不生效）；Nav.Item、Nav.Sub 的 `indent` 收窄为 `boolean`。
- 折叠或水平模式的弹层中，嵌套 Sub 的外层 li 为 `role="none"`，只有标题是 `menuitem`，不再两层 `menuitem` 嵌套。
- 展开侧边栏时文字的淡入改为 keyframes 动画 `semi-navigation-text-fade-in`，Firefox、Safari 上同样淡入。
- Vue：受控值用 `v-model:selectedKeys`、`v-model:openKeys`、`v-model:isCollapsed`；`onClick`、`onSelect`、`onOpenChange`、`onCollapseChange` 改为 `click`、`select`、`openChange`、`collapseChange` 事件；`renderWrapper` 改为 `#wrapper`，`items` 中的节点与 header、footer 内容改为 `#icon`、`#text`、`#header`、`#footer` 等插槽；收集 itemKey 时只读直接子项与 Nav.Sub 的默认插槽，包装 Nav.Sub 的组件只算一项，其中的子项不参与默认选中的祖先展开（React 会）。
- Solid：Nav.Item、Nav.Sub、Nav.Header、Nav.Footer 写在 Nav 外不渲染，包装它们的组件也算子项。`renderWrapper` 对每项只调用一次，`itemElement` 只能放在一处；`items` 换成新数组时所有项重新挂载，持有焦点的项失焦。
- Solid：Semi 图标按尺寸类适配槽位，写了 `size="default"` 的图标也会被调整。
- Solid 破坏性：`items` 的条目只放数据：`text` 收为 `string | number`，删除条目上的 `icon`、`toggleIcon`、`expandIcon`；类型 `NavItemPropsWithItems`、`SubNavPropsWithItems` 删除，改为 `NavItemConfig`（`NavItems = (string | NavItemConfig)[]`）。图标、显示的文案与箭头由 Nav 的 `renderItemIcon`、`renderItemText`、`renderItemToggleIcon`、`renderItemExpandIcon` 提供，入参 `{ item, level }`（类型 `NavItemRenderProps`，与 Vue 的 `#icon`、`#text`、`#toggleIcon`、`#expandIcon` 插槽一致），只在该项显示时调用；`renderItemExpandIcon` 传入后替代 Nav 的 `expandIcon`。用了 `renderItemText` 时，`onClick`、`onSelect` 回调里的 `text` 是渲染结果（Vue 为条目数据）。Nav.Sub 的 `expandIcon` 只在箭头显示时读取，收起状态下不再创建。
- Solid 破坏性：`header`、`footer` 的配置对象只放数据（同 Vue 的 `NavHeaderConfig`、`NavFooterConfig`）：`header.logo` 改为渲染函数 `() => JSX.Element`，只在显示时调用；`footer.collapseButton` 收为 `boolean | (() => JSX.Element)`，`true` 为内置按钮，渲染函数替换它，水平模式或底部有子元素时不调用。新增类型 `NavHeaderConfig`、`NavFooterConfig`，Nav 的 `header`、`footer` 类型改为 `JSX.Element | NavHeaderConfig`、`JSX.Element | NavFooterConfig`。Nav.Header 的 `text` 与配置对象的 `text` 收为 `string | number`（同 Vue），其他内容放在 Nav.Header 的 children 中；Nav.Header 的 `logo`、Nav.Footer 的 `collapseButton` 仍接受 JSX，`collapseButton` 只在按钮位置显示时读取。迁移：`header={{ logo: <IconSemiLogo /> }}` 改为 `header={{ logo: () => <IconSemiLogo /> }}`。
- Svelte：`Nav` 的 `selectedKeys`、`openKeys`、`isCollapsed` 可绑定，没有 `default*` 属性，单向传值只作初值，`undefined` 表示不受控；子项用 `items` 数据 prop 加 snippet（`icon`、`toggleIcon`、`expandIcon`、`text`），整体包装用 `wrapper` snippet。
- Svelte：`NavItem`、`SubNav` 也可写成 children，经 context 读父级，但这种写法下不会自动展开选中项的祖先、顶层 Sub 没有选中标记，需要这两项时用 `items`；两者的文字 snippet 叫 `label`（对应 Vue 的 `text` 插槽，因与 `text` prop 同名而改名）。
- Svelte：`header`、`footer` 是配置对象或 snippet，`NavHeader`、`NavFooter` 放在这两个 snippet 里使用，不会从 Nav 的 children 中提取；`icon` snippet 始终保留图标列，不能用空内容去掉图标框，收到 `{ size }`；折叠态下折叠按钮的可访问名称固定取语言包 `expandText`。
- Svelte：`children` 直接渲染在列表 `ul` 内，自定义内容要自带 `li`（Vue 会把非导航项内容包进列表项，Svelte 读不到 snippet 内容）。
- Svelte：子项写法下 `openKeys` 变回 `undefined` 时展开状态清空。
- `onSelect` 的 `selectedItems`：`items` 写法为该项的配置对象原样加 `level`（含 `path` 等业务字段）；`Nav.Item` 写法为使用方传给该项的 props，不再补默认值。纯对象、数组、`Date`、`Map`、`Set`、`RegExp` 深拷贝，函数、元素、DOM 节点与其他类实例保留引用。Vue：为声明的 props 加 attrs，`click` 事件监听不在其中；Svelte：为传给 `NavItem` 的全部属性，含 snippet；Solid：`items` 写法下其中的 `text` 是条目数据，不是 `renderItemText` 的结果。
- `items`、children 变化时保留非受控的选中与展开；`selectedKeys` 变化不再收起手动展开的项，竖向模式下补上选中项的祖先。Nav.Sub 的 `class`（React 为 `className`）落在外层 li。

### Transfer

- 破坏性（类型）：删除 `DraggableResolvedDataItem`、`DataItem`/`FullPathItem` 的 `style`、`BasicDataItem` 的 `className`、`style` 与 `ResolvedDataItem._optionKey`；`RenderSelectedItemProps.sortableHandle` 改为 `SortableHandle`；`treeProps` 类型去掉 `value`、`ref`、`onChange`、`keyMaps`、`treeData` 等，运行时也忽略。
- 新增 blur 事件（React `onBlur`、Vue `blur`、Solid `onBlur`、Svelte `onBlur`），焦点从 Transfer 内部移到外部时触发一次，参数为 FocusEvent；在搜索框、复选框、列表项、移除按钮、拖拽手柄之间移动不触发；窗口失焦（`relatedTarget` 为空）也触发，与 TreeSelect 一致。行为变化（React）：根元素不再直接透传使用方的 `onBlur`（原为内部任一控件的 focusout 冒泡都会触发），改为上述语义。
- 受控值（Vue `modelValue`）从数组变回 `undefined` 时，已选项重置为 `defaultValue`（未设置则清空），不再残留转为受控之前的非受控选择（表单 reset 后右侧仍显示旧选项）。
- 非受控时只记录已选 value 并按当前 `dataSource` 解析：不在新 `dataSource` 中的已选项不再显示，也不进 `onChange`，需要保留时改用受控 `value`；条目以 `value` 识别，缺失或重复的不能被正确选中。`value={null}` 视同未传。
- 条目 DOM 变化：`renderSourceItem`、`renderSelectedItem` 的内容外包 `role="listitem"` 的 div，groupList 改为嵌套列表，筛选框改为原生 `search` 元素，移除按钮与拖拽句柄改为原生 `button`（支持键盘排序），依赖旧结构的选择器需调整。默认过滤不区分大小写；ref 改为 `TransferHandle { search }`。
- treeList 左侧的 Tree 以语言包的 `optionList` 命名，与左侧普通列表一致；`treeProps['aria-label']` 仍可覆盖。
- 根元素（`role="group"`）不再带 `aria-required`：group 不支持该属性，必填的 FormTransfer 原先会被 axe 报 `aria-allowed-attr`。
- React：`draggable` 在服务端渲染与 hydration 期间输出不带拖拽的已选列表，hydration 后再加载拖拽排序。
- Vue：`v-model` 受控；事件 `change`、`select`、`deselect`、`search`；`renderSourceItem` 等改为 `#sourceItem`、`#selectedItem`、`#sourceHeader`、`#selectedHeader`、`#sourcePanel`、`#selectedPanel`（排序回调只作为后者的 `onSortEnd` 参数，没有 `sortEnd` 事件）；`sortableHandle` 改为 `#selectedItem` 的 `handle` 参数；`emptyContent` 拆为 `#emptyLeft`、`#emptyRight`、`#emptySearch`。
- Solid：`ref` 拿到根元素，其上带 `search(value)`（类型 `TransferElement = HTMLDivElement & TransferHandle`），`tabIndex` 落在搜索框上；`renderSourcePanel`、`renderSelectedPanel`、`renderSourceHeader`、`renderSelectedHeader` 只调用一次，参数是随状态更新的活对象，`renderSourceItem`、`renderSelectedItem` 每项只调用一次，`checked`、`fullPath` 是 getter，字段要在返回的 JSX 中读取；`dataSource` 中同 key 的项换成新对象时该项重新挂载。破坏性（类型）：`DataItem`、`FullPathItem` 的 `label` 收窄为 `string | number`；新增 `renderLabel(item)` 自定义左右两侧每一项与 treeList 节点的内容（同 Vue 的 `#label`），`showPath` 的路径为 label 文本以 `>` 连接。
- Svelte：`value` 可绑定，没有 `defaultValue`；插槽改为同名 snippet：`label`、`sourceItem`、`selectedItem`、`sourceHeader`、`selectedHeader`、`sourcePanel`、`selectedPanel`、`emptyLeft`、`emptyRight`、`emptySearch`，空状态传 `false` 隐藏，传空 snippet 只留空容器。
- 破坏性（类型）：React、Solid 的分页配置类型 `PaginationProps` 改名 `TransferPaginationProps`，并从包根导出（原来与 Pagination 的 `PaginationProps` 重名，包根没有导出）。React 内部的表头配置 `HeaderConfig` 用 `side: 'left' | 'right'` 代替 `type: string`（不对外导出）。
- React、Solid：`inputProps` 的类型去掉 `value`、`onChange`，运行时也在展开前去掉，搜索框始终由 Transfer 控制（原来传入同名属性会接管搜索框，筛选不再跟随输入）。Vue：`inputProps` 里的 `modelValue`、`defaultValue` 同样被忽略。
- Svelte：`selectedItem` 参数里的 `handle` 是 `Snippet<[Snippet]>`，写 `{@render handle?.(grip)}`，不可拖拽时为 `undefined`；`treeProps` 里的 `value`、`onChange`、`keyMaps`、`treeData`、`treeDataSimpleJson`、`onChangeWithObject`、`search`、`label` 由 Transfer 接管，`inputProps` 不含 `value`、`onChange`；`search` 方法经 `bind:this` 调用，只认小写 `tabindex`。

### Tree

- 行为变化：Tree 与 TreeSelect 的派生状态由同一份 `deriveTreeState` 计算。`treeData`、`treeDataSimpleJson` 异步到达或结构变化后，Tree 不再按 `value` 自动展开到所在节点，保留原有展开状态（与 TreeSelect、rc-tree 一致）；非受控单选在节点删除后不再残留 `selectedKeys`；非受控 `defaultValue` 在 `treeData` 晚到时不再丢失；`onChangeWithObject` 下对象值首次渲染能展开到父节点。
- 破坏性（样式钩子）：节点数据的 `active` 字段不再生成 `-active` 类，`BasicTreeNodeProps.active` 与 `&-active` 规则删除。`TreeProps.expandIcon` 放宽为 `ReactNode | ((props) => ReactNode)`；删除 `preventScroll`；拖拽回调的 `event` 改为 `DragEvent`；ref 改为 `TreeHandle { search, scrollTo }`。
- 键盘按 APG Tree View：整棵树是一个 Tab 停靠点，焦点留在 `role="tree"` 上并用 `aria-activedescendant` 指向当前节点；展开箭头与复选框不可聚焦，多选不再有 `role="group"` 层，传给 Tree 的 `tabIndex` 与 `aria-label` 等落在 `role="tree"` 元素上。节点内容里可聚焦元素的 `click` 仍冒泡触发 `onSelect`，需自行 `stopPropagation`。
- 节点数据中与行状态同名的字段（`expanded`、`checked`、`level`、`empty` 等）不再覆盖内部状态；树外拖入不再触发 `onDrop`，需要时在容器上监听原生 `drop`；默认搜索只匹配字符串与数字 `label`，元素 `label` 请用 `treeNodeFilterProp` 或自定义 `filterTreeNode`；多选 `related` 下全选的父节点不再同时半选。
- 没有 `treeData` 时把 `treeDataSimpleJson` 改为 `undefined` 不再抛 `TypeError`，树变为空（TreeSelect 同）。
- Vue：`v-model`、`v-model:expandedKeys`、`v-model:loadedKeys`；`renderLabel`、`icon`、`expandIcon`、`renderFullLabel`、`searchRender`、`emptyContent` 改为 `#label`、`#icon`、`#expandIcon`、`#fullLabel`、`#search`（空插槽隐藏搜索框）、`#emptyContent`；`renderDraggingNode` prop 删除，改为同名作用域插槽；没有 `Tree.TreeNode` 与默认插槽，`treeData` 只支持整体替换，`label` 只接受 `string | number`；`change`、`select`、`drop` 事件会遮住根元素上的同名原生监听。
- Solid：`renderFullLabel` 对每行只调用一次，参数是随行状态更新的活对象，字段要在返回的 JSX 中读取；返回内容一律由 Tree 自己的 `li` 包住，这个 `li` 带 `id`、`role="treeitem"`、行状态和拖拽处理（同 Vue），虚拟化时的定位样式也在它上面，参数中没有 `style`。`RenderFullLabelProps`、`SearchRenderProps` 和函数形式 `expandIcon` 的参数用 `class` 代替 `className`。破坏性（类型）：`RenderFullLabelProps.expandIcon` 是创建内置展开按钮的渲染函数 `() => JSX.Element`，在插入处调用 `row.expandIcon()`，没调用的行不创建展开按钮。
- Solid：不提供 `Tree.TreeNode`；搜索结果不延后渲染；`ref` 拿到根元素 `TreeElement`，其上带 `search`，`scrollTo` 收到带 `key` 的 `ScrollData` 时滚到该节点，其余参数照原生 `scrollTo` 滚动根元素。元素形式的 `icon`、`expandIcon` 每行各读取一次（每行一个新元素），`expandIcon` 元素会被就地加上 `-expand-icon` 类和点击展开的原生监听；函数形式的 `icon` 收到 `TreeRowProps`；`renderLabel` 只在标签、节点数据或搜索词变化时重新调用。
- Solid 破坏性（类型）：`TreeNodeData.label` 收紧为 `string | number`，`TreeNodeData.icon` 为 `never`（不再读取，`keyMaps.icon` 随之无效）；节点内容用 `renderLabel`（参数 `label` 为 `string | number | undefined`），图标用 Tree 的 `icon`，按节点区分时传函数（同 Vue 的 `#label`、`#icon`）。`icon` 只在插入它的行里读取，`renderFullLabel` 接管整行时不创建。
- Svelte：`value`、`expandedKeys`、`loadedKeys` 可绑定；没有 `defaultValue`、`defaultExpandedKeys`，保留 `defaultExpandAll`。
- Svelte：自定义内容用 snippet，名字同 Vue 插槽：`label`、`icon`、`expandIcon`、`fullLabel`、`search`、`emptyContent`、`renderDraggingNode`；`search={false}` 隐藏搜索框；`expandIcon` 收到 `class`、`onClick`、`expanded`，由使用方挂到自己的元素上，`fullLabel` 收到的 `expandIcon` 是 snippet；传了 `icon`、`search` 就一律替换内置内容；`renderDraggingNode` 渲染的拖拽图像能读到 Tree 的 context。
- Svelte：`search()`、`scrollTo()` 经 `bind:this` 调用；`class`、`style` 落在外层 wrapper 上，`aria-*` 与 `tabindex` 落在 `role="tree"` 元素上。
- Svelte：`bind:value` 的值被父组件改回 `undefined` 时清空选中与勾选（同 TreeSelect）。
- `onChange` 取节点数据时检查 `keyEntities[key].key === key`，名为 `constructor` 这类原型属性名的 key 不再误取到原型上的值。

### Dropdown

- 破坏性：删除 `getPopupContainer`、`zIndex`、`margin`、`rePosKey`；Dropdown.Divider 渲染为 `li role="separator"`，Dropdown.Title 为 `li role="presentation"`，Props 元素类型改为 `ElementProps<'li'>`；`menu` 数组项类型不再含 `children`；删除 `DropdownItemProps.selected`（用 `active`）与内部 `hover` 属性。
- 受控 `visible` 时只上报请求：触发与内部关闭只发出 `onVisibleChange(true/false)`，使用方自行改变 `visible` 不上报，需由使用方回写才开合。`showTick` 时菜单项角色变为 `menuitemcheckbox`，按 `menuitem` 查询的测试需调整；新增 `selectionMode?: 'single' | 'multiple'`（`menuitemradio`、`menuitemcheckbox`）。
- 键盘按 APG menu：Enter、空格触发菜单项，方向键循环，Home、End，右键开左键关子菜单，Esc 只关当前层，菜单内 Tab 关闭全部菜单。只有原生 button、带 href 的 a、Semi Button、Dropdown.Item 等交互元素作触发器才带 `aria-haspopup`、`aria-expanded`；菜单项上的 `onKeyPress` 不再收到 Enter，改用 `onKeyDown`。
- Vue：子组件 `Dropdown.Menu`、`Dropdown.Item`、`Dropdown.Title`、`Dropdown.Divider`（也可按名导入）；弹层内容用 `#content`，受控显隐用 `v-model:visible`，`#menuIcon="{ item, index }"` 自定义图标；`menu` 数据项回调用 `onClick`、`onMouseenter` 等键名；`class` 落在 `.semi-dropdown-wrapper`，`style` 落在 `.semi-dropdown`；不声明 `showArrow`、`arrowPointAtCenter`、`disableArrowKeyDown`。
- Solid：触发器写成函数 children `(getTriggerProps) => JSX`，规则同 Tooltip，要与注入值合并的 `class`、`onKeyDown` 也作为 `own` 传入，写在展开之后会覆盖菜单按钮的类名和键盘处理；非函数 children 包进 Dropdown 自己的 span，其中的 Button 等不会成为菜单按钮，含可聚焦元素时 span 退出 Tab 顺序并在开发期告警。子菜单父项写成 `{(t) => <Dropdown.Item {...t()}>子菜单</Dropdown.Item>}`；禁用的父项不打开子菜单，使用方传入的 `condition` 也不能改变（React 中 `condition` 优先）。
- Solid：`class` 落在 `.semi-dropdown-wrapper`，`style` 落在 `.semi-dropdown`；不提供 `content`，内容用 `render` 或 `menu`；不声明 `disableArrowKeyDown`（同 Vue，上下键总由菜单处理）；`ref` 在组件创建时交出 `DropdownHandle`；`stopPropagation` 只阻止弹层内的点击到达逻辑父级的 JSX 处理函数，document 上的监听仍会收到；打开中卸载时补发的 `afterClose` 同步调用。`render` 的菜单须在 JSX 中内联书写或惰性创建，在 Dropdown 之外预先创建的 JSX 读不到它的上下文，`showTick`、`selectionMode` 不生效。
- Svelte：触发器用 `child` 或 `children` snippet，不克隆节点；`child` 的参数是 `{ props }`，要展开到可聚焦元素上，Dropdown 在上面补 `aria-haspopup="menu"`、`aria-expanded` 和展开状态的 `${prefixCls}-showing` class，`class` 要由使用方自己合并，例如 `class={[props.class, 'own']}`。
- Svelte：子组件既是 `Dropdown.Menu`、`Dropdown.Item`、`Dropdown.Title`、`Dropdown.Divider`，也是具名导出 `DropdownMenu`、`DropdownItem`、`DropdownTitle`、`DropdownDivider`；选项由 `menu` 数据属性加 snippet 提供，事件用小写 DOM 名（`onclick`、`onmouseenter`、`oncontextmenu`）；`menuIcon` 是 snippet，参数 `{ item, index }`。
- Svelte：`visible` 可绑定，没有绑定或只单向传入时按非受控处理，受控要用 `bind:visible` 或函数绑定。
- Svelte：`DropdownProps` 不含 Tooltip 的 `wrapWhenSpecial`：触发器总经 `child` snippet 渲染，Tooltip 不再包裹特殊触发器，该属性没有作用。
- React：`DropdownProps` 不含 Tooltip 的 `disableArrowKeyDown`：上下键总由菜单处理，传入的值原本就不生效（同 Vue、Solid、Svelte）。
- Svelte：Dropdown、Tooltip 的子元素是禁用或 loading 的 Button 时，click 与 contextMenu 触发能打开菜单（同 React、Vue）。
- 破坏性（类型）：`menu` 数据项类型 `DropDownMenuItem`、`DropDownMenuItemItem`、`DropDownMenuItemDivider`、`DropDownMenuItemTitle` 改名 `DropdownMenuItem`、`DropdownMenuItemType`、`DropdownMenuItemDividerType`、`DropdownMenuItemTitleType`（包根与深路径均改，四个框架一致），不保留旧名。

### ImagePreview

- 破坏性：删除 `@fibrae/semi-ui-react/image` 的 `PreviewInner` 导出、静态标记 `isSemiImage` 与 `ImageProps.imageID`（分组位置由缩略图文档顺序决定）。破坏性（类型）：单图 `preview` 改为 `ImagePreviewProps`（不含 `lazyLoad`、`children`、`className`、`style` 等，预览层样式用 `previewCls`、`previewStyle`）；`PreviewImageProps` 删除 `clickZoom`、`setRatio`、`style`；`onLoad`、`onError` 参数改为 `React.SyntheticEvent<HTMLImageElement>`；`renderLeftIcon`、`renderRightIcon` 返回类型收紧为 `ReactElement`。分组改为注册式：封装组件内部的 Image 也加入分组；Image 的 ref 指向 `img`，未声明属性落在缩略图分组元素上；预览图 `max-width: none` 写在 `.semi-image-preview-image-img`。
- 行为变化：受控 `currentIndex={0}`、`visible={false}` 首次渲染时不再被 `defaultCurrentIndex`、`defaultVisible` 覆盖。
- React、Vue、Solid：服务端渲染的 Image 在 hydration 前已加载完成或失败时，hydration 后补发 `onLoad` 或 `onError` 并更新加载状态（原来一直停在加载中）。Avatar、Cropper 与 Upload 的文件卡片同样补发；Svelte 的 hydration 自带补发。
- Vue：自定义内容用插槽 `#title="{ title, index }"`、`#previewMenu`、`#leftIcon`、`#rightIcon`、`#closeIcon`，Image 另有 `#placeholder`、`#fallback`，`previewTitle`、`fallback` 只接受字符串；`v-model:visible`、`v-model:currentIndex`；单图配置对象为 `ImagePreviewProps`，组件 props 为 `ImagePreviewComponentProps`；`<KeepAlive>` 失活时释放 inert、滚动锁与键盘监听。
- Solid：`onLoad`、`onError` 收到原生 `Event`；`style`、`imgStyle`、`previewStyle` 接受对象或字符串；`renderLeftIcon`、`renderRightIcon`、`renderCloseIcon` 接受任意 JSX（含字符串，空内容回落默认图标）；`renderPreviewMenu` 只在函数身份变化时重新调用，`MenuProps` 的字段是 getter，`menuItems` 的节点整个生命周期复用；Image 的 `ref` 指向 `img`，ImagePreview 的 `ref` 与未声明属性落在分组 div 上；Image 不重新挂载而移动位置时，分组在 MutationObserver 回调（微任务）之后按新的文档顺序排列。
- Solid：`previewTitle`（含 Image `preview` 对象里的标题）可以是函数，预览打开后才调用；写在 `preview` 对象里的 JSX 标题在读取对象时就创建节点，服务端渲染时要写成函数，否则 hydration 不一致。
- Svelte：分组列表是数据，由 `ImagePreview` 的 `src`（`string | string[]`）给出，Image 不向父级注册；Image 用自己的 `src`（或 `preview.src` 的第一项）在列表里找索引，找不到或 `preview` 为 false 时不入组，前者单独预览；不再按 DOM 顺序排序，不支持「src 加子元素」的组合写法；逐张的 `alt`、`title` 改为 `ImagePreview` 的 `titles`、`alts` 数组属性（按索引对应）。
- Svelte：没有 `defaultVisible`、`defaultCurrentIndex`，`visible`、`currentIndex` 可绑定（`bind:visible`、`bind:currentIndex`，函数绑定与单向传值也成立），Image 的 `preview` 对象不含 `defaultCurrentIndex`；插槽改为同名 snippet：`title({ title, index })`、`previewMenu(MenuProps)`、`leftIcon({ index })`、`rightIcon({ index })`、`closeIcon`，Image 另有 `placeholder`、`fallback`（`fallback` 可为字符串或 snippet）；`MenuProps.menuItems` 是渲染 9 个默认底部按钮的 snippet（`Snippet<[start?: number, end?: number]>`），不含分隔线，`menuItems(start, end)` 按 slice 规则只渲染其中一段，可逐项或按组渲染。
- Svelte：Image 的 `onLoad`、`onError` 是带 Event 的 Semi 回调；`class`、`style` 落在根 div，其余未声明属性落在 img；未入组的 Image 加载成功后才可打开预览，入组的缩略图无需加载；分组 `lazyLoad` 时缩略图先只有 `data-src`，进入视口后才给 `src`。
- Svelte 破坏性（类型）：`title` snippet 的参数类型 `ImagePreviewTitleSnippetProps.title` 改为可选属性 `title?: string`，手写成必填的 snippet 参数类型需改用导出的 `ImagePreviewTitleSnippetProps`。
- 行为变化：`getPopupContainer` 返回 null 时，四个框架都在显示时报错（原来只有 Vue 报错）；焦点归还统一由预览自己的模态资源负责，React `<Activity>` 隐藏预览时不再重置预览状态。
- Image 的 `preview.setDownloadName` 生效。Vue 的优先级为顶层 `setDownloadName` > `preview` > 全局默认值；React、Solid、Svelte 的全局默认值与顶层 `setDownloadName` 同级，先于 `preview`。

### Popconfirm

- 破坏性（类型）：`onConfirm`、`onCancel` 参数改为原生 `MouseEvent`；ref 为 `PopconfirmHandle { focusTrigger }`。`okButtonProps`、`cancelButtonProps` 的 `onClick` 改为追加调用（先调用使用方的，再执行内置确认、取消流程，原来替换内置流程）；`icon` 接受任意 ReactNode。
- 行为变化：`visible` 受控时 `trigger` 不再强制为 `custom`，点击、悬停调用 `onVisibleChange(true)` 请求打开，点击外部与 Esc 调用 `onVisibleChange(false)`，由使用方回写；使用方自行改变 `visible` 不再上报。确认框真正关闭时才把焦点还给触发元素；所有触发方式的弹层都是 `role="dialog"`，以标题命名。
- 确认框渲染在 shadow root 内时，焦点已移到主文档的元素后关闭，焦点不再被拉回触发元素。
- 行为变化：footer 挂载后，四个框架都直接聚焦 `autoFocus` 按钮，同时把它交给 Tooltip 作初始焦点（原来 React、Solid 在 footer 晚挂载时只交给 Tooltip）；最终焦点落点不变。
- Vue：`title`、`content`、`icon` 改为同名插槽（`#content="{ initialFocusRef }"`），不提供 `showIcon`；`onVisibleChange`、`onClickOutSide`、`onEscKeyDown`、`afterClose` 改为事件 `visibleChange`、`clickOutSide`、`escKeyDown`、`afterClose`，受控用 `v-model:visible`，`onConfirm`、`onCancel` 仍为函数 prop；`class`、`style` 落在 `.semi-popconfirm` 上。
- Solid：触发器写法同 Tooltip（函数 children）；`content` 的函数与 JSX 形式同 Popover；`okButtonProps`、`cancelButtonProps` 的初始聚焦用 `autoFocus`（不落到 DOM），Solid 原生的 `autofocus` 不触发聚焦；`ref` 在组件创建时交出 `PopconfirmHandle`；`onConfirm`、`onCancel` 的返回值只在是 Promise 时等待。卡片内的点击在 Solid 的事件委托中止于卡片，弹层的 `clickToHide` 与外层元素的 `onClick` 收不到，`stopPropagation={false}` 对卡片内的点击无效。
- Svelte：`title` 接受字符串或 snippet；`content` 是 snippet，参数含 `initialFocusRef`；`icon` 是 snippet，传 `null` 不显示图标，空 snippet 无法判断，照常显示图标框；可见性用可绑定的 `visible` 配 `onVisibleChange`，没有 `defaultVisible`；`okButtonProps`、`cancelButtonProps` 的 `onclick` 先于内置的确认、取消流程调用，`autoFocus` 不落到 DOM；`class`、`style` 落在 `.semi-popconfirm` 卡片上；`stopPropagation={false}` 时，卡片内的点击会到达 document 与外层监听；`focusTrigger()` 经 `bind:this` 调用。
- `disabled` 与启用之间切换时触发器不再重新挂载，焦点与内部状态保留；禁用时触发器也带 Tooltip 的 aria 属性与 `data-popupid`。
- React、Solid：使用方传入的 `aria-describedby` 落在确认框上，优先于默认指向内容的描述（同时有标题与内容时）。

### Rating

- 破坏性：`tabIndex` 不再是声明的属性，传入的值（含 Tooltip 注入）被丢弃，只有选中的 radio 是 Tab 停靠点。破坏性（样式钩子）：删除 `semi-rating-focus` 类名，焦点环改由 `:focus-visible` 绘制。
- 键盘按 APG radio group：下、右方向键选中下一个，上、左选中上一个（原来上增下减，与文档相反），RTL 只镜像左右；空格选中未选中的星，已选中的星上不再清除；Enter 由被按下的 radio 决定值。`onFocus`、`onBlur` 只在焦点进入或离开整个控件时触发；`onHoverChange` 参数改为 `number | undefined`；配置 `tooltips` 时星距与不配置一致（默认 30px，原来 24px）。
- Vue：`value` 改为 `modelValue`（`update:modelValue`、`change(value)`）；`onHoverChange`、`onClick`、`onFocus`、`onBlur`、`onKeyDown` 改为 `hoverChange`、`click(event, index)`、`focus`、`blur`、`keydown` 事件；`character` 改 `#character` 插槽；`autoFocus` 改 `autofocus`；列表 `tabindex` 固定 -1，`name` 被丢弃。
- Solid：`ref` 是根 `ul`，可直接展开 Tooltip 的触发器属性；其 `focus()` 聚焦 Tab 会到达的那颗星并套用 `preventScroll`，禁用时不聚焦，`blur()` 释放其中持有焦点的星。`autofocus` 为小写，`name` 被丢弃；`character` 在每颗星各渲染一份，要内联书写，传入同一个预先创建的 DOM 节点会被搬走；`character` 按 `hasContent` 判断，`0` 作为文字显示。
- Svelte：`value` 可绑定，回调 `onChange(value)`，没有 `defaultValue`，受控 `value` 变回 `undefined` 时回到 0；事件为 `onChange`、`onHoverChange`、`onClick(event, index)`、`onFocus`、`onBlur`、`onKeyDown`。
- Svelte：`character` 是 `string | Snippet`，字符串既是每颗星画的字符，也是星值的单位，snippet 时单位取语言包；`aria-label`、`aria-labelledby` 是原生属性，没有 `ariaLabel`；`tabindex`、`name` 被丢弃；放进外层 Tooltip 时，描述挂在 Tooltip 的 span 上，不注入到 ul。

### TreeSelect

- `expandAction="click"` 加 `loadData` 时，点击 `isLeaf` 节点不再调用 `loadData`。
- 行为变化：`treeData` 换了引用但结构不变（如每次新建 ReactNode 的 `label`）时，不再重置展开与动画状态，受控 `expandedKeys` 的展开动画照常播放；搜索中 `treeData` 更新时，已收起的节点不会被重新展开；展开动画状态在 `treeData` 结构变化时重置（原来比较键集合）。
- 行为变化：受控 `expandedKeys` 变化、搜索展开与 `treeData` 结构变化时的展开动画改由 `motionExpand` 决定，不再受下拉弹出动画 `motion` 影响：`motion={false}` 时这些展开照常有动画，`motionExpand={false}` 时都没有动画。
- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`；`dropdownMatchSelectWidth` 让下拉最小宽度跟随触发器的当前宽度（`--semi-tooltip-trigger-width`），`style.width` 不再复制到下拉。删除从未生效的 SCSS 变量 `$font-treeSelect_default-fontSize` 等，`$height-treeSelect_popover`（300px）开始生效。
- 破坏性（类型）：`TreeSelectProps` 改为泛型 `TreeSelectProps<T, Multiple, WithObject>`，`onChange` 参数随 `multiple` 与 `onChangeWithObject` 区分，`OnChange` 接口改为 `OnChangeArgs`（FormTreeSelect 的行内 `onChange` 参数推断不出来）；`onClear` 参数改为 `React.MouseEvent`；删除 `mouseEnterDelay`、`mouseLeaveDelay`；`searchPosition` 收窄为 `'dropdown' | 'trigger'`；`TreeSelectTriggerRenderProps` 删除索引签名。
- 破坏性：`onFocus`、`onBlur` 跟随 DOM 焦点，以整个组件（触发器、搜索框、标签、清除按钮与下拉）为界成对触发，Tab 进入也触发 `onFocus`，组件内部移动不触发。`searchRender` 参数新增 `ref` 需写到输入框上，`autofocus` 键改为 `autoFocus`；清除按钮改为带名称的原生 `button`；键盘按 APG combobox，`aria-activedescendant` 指向当前节点。
- Vue：`v-model` 与 `v-model:expandedKeys`，`loadedKeys` 配 `update:loadedKeys`；回调改为事件 `change`（`(value, node, event)`）、`expand`、`load`、`select`、`search`、`dropdownVisibleChange`（对应 `onVisibleChange`）、`focus`、`blur`、`clear`、`keydown`；render 属性改为 `#label`、`#icon`、`#selectedItem`、`#tag`、`#trigger`、`#search`（空插槽隐藏搜索框，不提供 `searchRender`）等插槽；`treeData` 只在整体替换时生效；`multiple` 默认 `undefined`，不能经全局默认值设置。
- Solid：`ref` 是触发器根元素 `TreeSelectElement`（外层 Tooltip 以它为锚点，另带 `search`、`close`），`focus()` 只聚焦 combobox（搜索框在触发器上时聚焦该搜索框，含 `searchRender` 返回的 textarea），不打开下拉，`blur()` 释放组件内持有的焦点；`class` 代替 `className`，`style`、`dropdownStyle` 用 CSS 对象；`onFocus`、`onBlur` 收到原生事件。
- Solid：`triggerRender`、`searchRender` 只调用一次，参数为活对象，字段要在返回的 JSX 中读取；`searchRender` 参数的 `ref` 是回调，要写到文本框上，自动聚焦键为 `autofocus`；搜索结果不延后渲染；下拉打开后方向键由 combobox 处理，焦点不移入下拉搜索框；下拉树的行写法同 Tree 的 Solid 说明。
- Solid 破坏性（类型）：`treeData` 同 Tree 收紧，`label` 只接受 `string | number`，节点数据不带 `icon`；新增 `icon` 属性（元素或 `(row: TreeRowProps) => JSX.Element`），用法同 Tree 的 `icon`。单选的 `renderSelectedItem` 只在内置触发器显示已选内容时调用，传 `triggerRender` 时不调用。
- Solid：多选标签经 TagGroup 的 `renderTag` 创建，超出 `maxTagCount` 的标签只在 +N 弹层打开时调用 `renderSelectedItem`；`renderSelectedItem` 返回空 `content` 的项仍占 `maxTagCount` 的一个位置并计入 +N（判断 content 是否为空要先创建隐藏项的内容），收到的 `index` 是该项在已找到数据的选中项中的序号。
- Svelte：`value`、`expandedKeys`、`loadedKeys` 可绑定，删除 `defaultValue`、`defaultExpandedKeys`，`defaultOpen`、`defaultExpandAll` 保留（没有对应的可绑定 prop）；回调同 React：`onChange(value, node, event)`、`onExpand`、`onLoad`、`onSelect`、`onSearch`、`onVisibleChange`、`onFocus`、`onBlur`、`onClear`；`search(value)`、`close()` 经 `bind:this` 调用。
- Svelte：插槽改为同名 snippet：`label`、`icon`、`expandIcon`、`fullLabel`、`selectedItem`、`tag`、`trigger`、`search`、`prefix`、`suffix`、`insetLabel`、`arrowIcon`、`clearIcon`、`emptyContent`、`outerTopSlot`、`outerBottomSlot`；`search={false}` 隐藏搜索框但仍过滤，`arrowIcon={null}`、`emptyContent={null}` 隐藏。
- 下拉打开时按 Tab 离开会关闭下拉并触发一次 `onBlur`（APG combobox 模式），原来只触发 `onBlur`、下拉保持打开；窗口失焦时下拉保持打开。
- Svelte：设置 `trigger` snippet 后根元素不带 `semi-tree-select` 类，只保留传入的 `class`、`style`、`data-*`。
- Svelte：`value` 被父级设为 `undefined` 时，选择框清空显示。
- `checkRelation="unRelated"` 多选加触发器内搜索时，已有标签后不再带 `tagInput-empty` 类，左侧间距恢复正常。
- `expandedKeys={null}`、`loadedKeys={null}` 按受控处理（同 `value={null}`）。
- 触发器内的搜索框随 TreeSelect 解析出的 `size`（含 InputGroup 下发的）变化，原来固定为默认尺寸。Svelte 的 `TreeSelectSearchSnippetProps`、Vue 的 `TreeSelectSearchSlotProps` 新增 `size`，只在触发器搜索框上有值。
- `removeTag` 在组件 `disabled` 时不再生效，key 找不到节点数据时不再抛错。React、Solid：`checkRelation="unRelated"` 加 `leafOnly` 时按 `realCheckedKeys` 显示全部标签，与 Vue、Svelte 一致（原来过滤掉非叶子键的标签）。

### Cascader

- 多选选项的 checkbox 只在结束一侧留 8px 间距（原来两侧各 8px，RTL 样式漏到了 LTR），LTR 下 checkbox 起始侧少 8px。
- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`；不再读取未声明的 `open`（改用 `defaultOpen`）。破坏性（类型）：`CascaderProps` 改为泛型 `CascaderProps<Multiple>`；单选 `displayRender` 参数改为 `ReactNode[]`；`triggerRender` 的 `inputValue` 改为 `ReactNode` 并删除 `onChange`（改用 `onSearch`）；`filterSorter` 参数改为路径数组 `CascaderData[]`；`checkRelation`、`searchPosition` 收窄为字面量联合；`virtualizeInSearch.height` 收紧为 `number`；删除 `mouseEnterDelay`、`mouseLeaveDelay`。
- 行为变化：`onFocus`、`onBlur` 与 TreeSelect 一致，成对且以整个组件（触发器、其中的搜索框与标签、下拉）为界。焦点从组件外进入时触发一次 `onFocus`（Tab、点击、脚本 `focus()` 都算，原来只有点击或按键打开下拉才触发），组件内移动不重复触发；之后每次 focus 只触发一次 `onBlur`：焦点离开到外部元素、在组件外按下鼠标、单选选中后关闭下拉（让 Form 的 `trigger="blur"` 立即校验）。Esc、多选选中、点击触发器收起下拉时焦点仍在组件内，不再触发 `onBlur`（原来关闭下拉就触发）；`ref.close()` 同样不触发。打开时按 Tab 离开还会关闭下拉（APG combobox 模式）。`onFocus` 的参数可能是 `FocusEvent`，`onBlur` 的参数可能是 `FocusEvent`（Vue 为 `focus`、`blur` 事件）。
- 行为变化：`filterLeafOnly={false}` 时，受控单选在搜索结果中选中分支后保持选中，与非受控一致（原来受控的 `value` 回写分支路径时被清空）。
- 破坏性（类型）：`Entity` 删除 `_notExist`。treeData 中没有的选中值仍以占位实体保存在 `keyEntities` 中，由 foundation 内部标记，`displayRender`、`onExceed` 收到的实体不再带该字段。
- 选项角色由 `menuitem` 改为 `treeitem`（搜索结果为 `listbox` + `option`），按 `menuitem` 查询的测试需调整；键盘按 APG combobox，焦点留在触发器或搜索框，选项 id 不再是 `cascaderItem-${key}`。清除按钮改为带名称的原生 `button`；ref 改为 `CascaderHandle { open, close, focus, blur, search }`，`ref.focus()`、`ref.blur()` 真正移动 DOM 焦点。
- Vue：`v-model` 受控；回调改为事件 `change`、`select`、`search`、`focus`、`blur`、`keydown`、`dropdownVisibleChange`、`clear`、`exceed`、`load`、`listScroll`，`focus`、`blur` 按上条语义触发，参数可能是 `FocusEvent`；`displayRender`、`filterRender`、`triggerRender` 改为 `#display`、`#tag`、`#filterItem`、`#trigger`，节点属性（`arrowIcon`、`clearIcon`、`prefix`、`suffix` 等）只用插槽；`multiple` 默认 `undefined`，不能经全局默认值设置；不提供 `Trigger` 组件。
- Solid：`ref` 是触发器根元素 `CascaderElement`（带 `open`、`close`、`focus`、`blur`、`search`），`focus()` 不打开下拉；破坏性（类型）：`CascaderData.label` 收窄为 `string | number`，删除 `CascaderLabel`，单选 `displayRender` 的参数为 `Array<string | number>`；新增 `renderLabel(item)` 自定义列中选项的内容（同 Vue 的 `#label`），搜索结果、回显与标签显示 label 文本；`expandIcon` 要内联书写；`FilterRenderProps` 的类名字段为 `class`，`filterRender` 返回单个元素时选项属性直接写到该元素上；不接受 `children`（React 声明而不渲染）。
- Solid：`triggerRender`、`filterRender` 只调用一次，参数为活对象；单选 `displayRender` 只在已选路径变化时调用，要跟随其他状态须在返回的 JSX 中读取，可搜索时其节点不写入搜索框；`onListScroll` 的 `e` 为原生 `Event`，`onFocus`、`onBlur` 收到的可能是原生 `FocusEvent`；搜索结果与关键字同步渲染。
- Svelte：Cascader 的 `value` 可绑定，没有 `defaultValue`；单选多选靠 `multiple` 区分，没有 `Multiple` 泛型；回调同 React：`onChange`、`onChangeWithObject`、`onSelect`、`onSearch`、`onFocus`、`onBlur`、`onDropdownVisibleChange`、`onClear`、`onExceed`、`onLoad`、`onListScroll`、`onKeyDown`（每个按键只上报一次）。
- Svelte：插槽改为同名 snippet：`prefix`、`suffix`、`insetLabel`、`topSlot`、`bottomSlot`、`label`、`display`、`tag`、`filterItem`、`trigger`、`expandIcon`、`clearIcon`、`arrowIcon`、`emptyContent`，`emptyContent`、`arrowIcon` 传 `null` 隐藏，空 snippet 不回落默认内容；`filterItem` 收到要展开到自定义行上的 `props`（含 `id`、`role`、`class`、`onclick`，虚拟搜索结果里还带定位用的 `style`，要一起展开到行上），没有 `componentProps`，`trigger` 参数也没有 `componentProps`；`treeData` 可以是 `$state`，就地修改会重新收集选项。
- `checkRelation="unRelated"` 多选时，自定义触发器的 `value` 是已勾选项的位置集合，不再为空。`filterTreeNode` 加远程搜索时，`treeData` 更新不再清空搜索框。
- Svelte：不再检测绑定的 `value` 与 `keyMaps` 的原地修改，需替换整个对象；`treeData` 的原地修改仍会重新收集选项。
- `disableStrictly` 下，被禁用键对应的标签不能再通过 `handleTagRemoveByKey`（含可搜索多选时 TagInput 的移除回调）移除，原来只有渲染层把标签显示为不可关闭。
- 搜索框收起时焦点回到触发器：`preventScroll` 跟随组件属性（原来写死为 true），焦点原本在下拉框 slot 里的输入框时也会回到触发器，与 TreeSelect 一致。
- 异步加载的「正在加载」判断不再依赖宿主写入 `loadedKeys` 与 `treeData` 的先后：键在 `loadingKeys` 中，或在 `loadedKeys` 中且上一轮实体没有 `children`、新实体有，都算加载中，四个框架一致。
- Svelte 破坏性（类型）：`trigger` snippet 的参数类型 `CascaderTriggerSnippetProps.value` 改为可选属性 `value?: string | Set<string>`。

### semi-foundation

- Foundation、Adapter 的方法与 state 属内部实现，直接继承或实现它们的代码不保证兼容。深路径导入有大量删除与改名，如删除 `utils/index`（改为导入具体模块）、`pullAll` 改名 `differenceUnique`、`empty` 改名 `isEmpty`、各组件 `constants` 中无导入方的取值表。
- 移到 semi-foundation：`registerMediaQuery`、`coversPage` 到 `@fibrae/semi-foundation/utils/dom`，`measureScrollbar`、`amendTableWidth` 到 `.../table/utils`，Tree 静态方法到 `.../tree/shared`；`highlight/foundation` 改为具名导出 `findAll`；`FieldState` 改名 `FieldSnapshot`。
- `base/foundation` 的宿主契约：foundation 以静态 `propKeys`（可配 `propEquals`）声明要响应的 prop，宿主在这些 prop 变化的那次提交后调用 `handlePropsChange(prev)`，挂载时不调用；一次性副作用写在 `initOnce()`，每个实例只在第一次 `init()` 前执行一次；`commitState(partial)` 返回在提交后兑现的 Promise；`Lifecycle` 接口从 `base/foundation` 导出。隐藏（React StrictMode 重放、`<Activity>`、经 `useKeepAliveFoundation` 接入的 Vue `<KeepAlive>`）等同 `destroy()`，重新显示等同 `init()`；`destroy()` 只撤销 `init()` 建立的监听、计时器与页面级占用，不写 state，也不关闭已打开的面板与弹层。state 由 foundation 持有，各组件新增静态 `getInitialState(props)`；原来只转发 `setState` 或只读 state、prop 的 adapter 方法已删除，state 泛型参数 `S` 多数已去掉，自定义 adapter 与继承 foundation 的代码需同步。Tree 的 `treeDerivedPropKeys`、TreeSelect 的 `treeSelectDerivedPropKeys` 导出删除，改为各自的 `static propKeys`；MonthsGrid 的 `MonthsGridDateAdapter`、`MonthsGridRangeAdapter` 类型导出删除。Vue 的 `useKeepAliveFoundation` 删除 `reactivate` 选项。
- 新增的共享工具与常量：`utils/a11y` 的 `namedRole({ role, 'aria-label', 'aria-labelledby' })`、`isAriaKey`（类型守卫）、`isNativeInputKey(key)`（同时认驼峰与小写的 focus、blur 监听键）；`utils/assert-client` 的 `assertClient(api, hint)`；`base/constants` 的 `ValidateStatus` 类型（`date-picker/foundation`、`tree-select/foundation` 不再导出同名类型），`tag-input/foundation` 的 `TagInputValidateStatus`；`base/reset-timer` 的 `ResetTimer`；`utils/clipboard` 的 `CopiedTimer`（`mount()`、`unmount()`、`copy(text, duration)`，复制成功且仍挂载时通知已复制，`duration` 后复原，四个框架的 `useCopied` 共用）；`scroll-list/item-foundation` 的 `wheelMode` 与 `ItemFoundation.getItemText`；`utils/layer` 的 `POPUP_ID_ATTRIBUTE`、`popupTriggerSelector(id)`、`POPUP_SELECTOR`、`getPopupTrigger(id, root)`；overflow-list 的 `SCROLL_KEY_ATTRIBUTE`；tabs 的 `getTabKeyAttrs(itemKey)`（取代 `getTabDataKey`）；`TextEntryFoundation.handleCompositionEnd` 返回 boolean（true 表示宿主可立刻把显示的文本写回 DOM）；`@fibrae/semi-ai-foundation` 的 `file-suffix` 新增 `getFileKind`、`FileKind`，`upload-status` 新增 `isUploadFailed`；`utils/dom` 新增 `defaultPopupContainer()`（全屏期间取全屏元素，否则取 body），`coversPage` 的参数可返回 `null`（视为不覆盖整页），全屏元素也算覆盖整页；`video-player/constants` 新增 `DEFAULT_CONTROLS_LIST`、`VideoControl`、`MediaEventKey`；`transfer/constants` 新增 `strings.PATH_SEPARATOR`；`backtop/constants` 新增 `numbers.DEFAULT_VISIBILITY_HEIGHT`、`DEFAULT_DURATION`；`typography/copy` 的 `getCopyConfig`，`typography/ellipsis` 的 `isOverflowed`、`isTooltipTriggerFocusable`、`isPopoverTooltip`、`getExpandButton`、`isExpandFocusTarget`；`form/utils` 的 `resolveFieldView`、`getFieldIds`，`form/errors` 的 `hasErrorContent`。
- 新增的 foundation 方法：`BreadcrumbFoundation.shouldCollapse`；`NavigationFoundation.isWidthTransitionEnd`、`isWidthAnimating`；`DatePickerFoundation.getPosition`；`SelectFoundation.getPosition`、`getVisibleOptions`、`getActiveOptionIndex`、`isClearable`、`isInputCombobox`；`MonthFoundation.getKeyAction` 与类型 `MonthKeyAction`；`TransferFoundation.getVisibleData`、`getGroups`、`getPath`、`deriveView(props, state, data?)`（一次算出两侧面板的搜索、过滤、分页、分组与计数）；`CarouselFoundation.handleFocusIn`、`handleFocusOut`（入参为事件，取代 `handleKeyboardFocus`、`handleFocusLeave`）、`handleIndicatorBlur`，`CarouselAdapter` 新增 `focusTab(index)`，键盘切换后的聚焦由 foundation 驱动，`handleKeyDown` 不再返回值；`OverflowListFoundation` 的静态 `createView(props)`、`syncView(props, view, containerWidth)`、`getVisibleItems(view, itemKey)`、`isHidden(view)` 与 `handleItemResize(key, width, maxCount)`、`handleContainerResize(width)`、`handleOverflowResize(width)`、`handleCommit(view)`，`OverflowListAdapter.updateView` 改为接收 `(view) => view`；`UploadFoundation.startReplace(uid)`（禁用时不生效，`UploadAdapter` 新增 `openReplacePicker()`）、静态 `getFileCardFlags`、`getFallbackValidateMessage`（宿主与 FileCard 不再读 `_sizeInvalid`）与类型 `FileCardFlags`、`FileCardFlagOptions`；`TransferFoundation.handleTreeMount`；`TreeSelectFoundation.isClearable`、`CascaderFoundation.isClearable`；`SelectFoundation` 的 `getOptionId`（模块导出函数）、静态 `getTagFold`、`scrollToSelection`（取代 `updateScrollTop`）、`handleFocusIn`、`handleFocusOut`；`TagInputFoundation` 的静态 `getVisibleCount`、`focus`、`blur`，`TagInputBaseProps` 新增 `autoFocus`、`maxTagCount`、`expandRestTagsOnClick`，autofocus 由 `initOnce()` 处理；`TimePickerFoundation.focus`、`blur`、静态 `getPanelClassNames`，`time-picker/combobox-options` 的 `getOptions` 返回的对象新增 `ampm: { list, selectedIndex }`，`TimeInputFoundation` 的打开聚焦与选中移入 `initOnce()`；`PaginationFoundation.getView`（静态，派生值，并在 `initOnce`、`handlePropsChange` 发出 `showSizeChanger` 与 `hideOnSinglePage` 冲突的警告）；`ScrollItemFoundation.getRows`（静态），`handleWheelClick` 内部先 `stopImmediatePropagation`；`DateInputFoundation.handleRangeInputAffixClick`，`handleRangeInputFocus` 在 `disabled` 时不响应；`DropdownFoundation.closeAll` 与静态 `getChildMenuDepth`、`getSpacing`；`FeedbackFoundation.getContentValues`（静态）；`JsonViewerFoundation` 的 `getValue`、`format`、静态 `mergeOptions`；`CodeHighlightFoundation.getVisibleHtml`（静态）；`SliderFoundation` 的静态 `getLayout`、`getMarkPercent`，`onHandleDown(e, pos)` 内部先聚焦手柄；`ColorPickerFoundation` 的静态 `deriveColor`（受控 `null` 显示 `defaultValue`）与 `handleAreaChange({ s, v })`；`RadioGroupFoundation.deriveValue`；`RatingFoundation.getUnit`（静态）；`InputFoundation.getLabelA11y`（静态）、`handleClearMouseDown`、`handleClearClick`，`TextAreaFoundation` 的 `getSizeStyle`、`handleClearClick`，`TextEntryFoundation.getNativeMaxLength`（静态）；`FormFoundation` 的 `handleSubmitEvent`、`handleResetEvent`；CheckboxGroup、RadioGroup、Slider 的 `handleBlur` 与 `notifyBlur`，PinCode 的 `handleFocus`、`handleBlur`、`notifyFocus`、`notifyBlur`，均经 `crossesFocusBoundary` 判断焦点是否越过组边界。
- 改名与替换：`utils/a11y` 的 `getMenuButton` 改名 `getPopupTrigger` 并移到 `utils/layer`；删除 `utils/is-element`，`isHTMLElement` 从 `utils/dom` 导入；`descriptions/foundation` 的默认导出类 `DescriptionsFoundation` 改为具名导出函数 `getHorizontalList(columns, column)`；`time-picker/combox-foundation` 改名 `time-picker/combobox-options`，默认导出类 `ComboboxFoundation` 的静态方法改为具名导出函数 `getColumns`、`getOptions`、`applyItem`、`isAM`、`hasValue`（`getDisabledHours`、`getDisplayDateFromTimeStamp` 不导出）；`@fibrae/semi-ai-foundation` 的 `chat/constants` 删除 `strings.FILE_STATUS`，改用 semi-foundation upload 的 `strings`；`AudioPlayerBaseState`、`VideoPlayerBaseState` 改名 `AudioPlayerState`、`VideoPlayerState`（框架包不再各自声明，公开类型名不变）；`highlight/foundation` 的 `ComplexSearchWord.className`、`Chunk.className` 改名 `class`，`Chunk` 新增 `text`，`findAll` 直接返回带文本的 chunk。
- Navigation、Tabs：`NavigationFoundation` 新增静态 `deriveView(props, state, itemKeysMap)` 与类型 `NavigationView`（折叠、展开项、选中项一次派生），删除静态 `getIsCollapsed`、`getSelectedKeys`、`isOpenKeysControlled`、`getOpenKeys`；`ItemAdapter.cloneDeep` 改为 `getSelectedItem()`，`navigation/item-foundation` 新增 `copySelectedItem(item, isElement?)`；新增 `tabs/tab-bar-foundation` 的 `TabBarFoundation`（溢出检查、箭头点击、可见状态，adapter 为 `getBarElement`、`notifyVisibleTabsChange`），`TabsFoundation.isTabsOverflowing`、`scrollTabIntoView`、`readVisibleState` 移到它上面。
- 改私有：`CropperFoundation.syncRotateAndZoom`、`updatePreview`、`applyAspectRatio`（foundation 在写状态时自己同步缩放、旋转与预览）、`TreeFoundation.handleNodeLoad`、`TreeSelectFoundation.handleTriggerBlur`、`InputFoundation.formatShowText`、`concatInsetInputValue`、`MonthsGridFoundation.getValidTimeFormat`、`MonthFoundation.getKeyboardTargetDate`、`getMonthSwitch`、DatePicker 的 `handleTriggerWrapperClick`、Transfer 的 `getGroupIndexes`、`getPageNumber`、`toPublicItem`、`SelectFoundation` 的 `handleTriggerFocus`、`handleTriggerBlur`、`handleInputFocus`、`handleInputBlur`、`JsonViewerFoundation.jsonViewer`。
- 删除的导出：`utils/dom` 的 `convertDOMRectToObject` 与类型 `DOMRectLikeType`；`color-picker/utils/convert` 的别名 `rgbStringToRgba`、`rgbStringToHsva`（`rgbaStringToRgba`、`rgbaStringToHsva` 保留）；`resizable/foundation` 再导出的类型 `AriaRange`；`tree/tree-util` 的 `TreeDataSimpleJson`（`tree/foundation` 与各框架包仍导出）；`date-picker/_utils/index` 再导出的 `getYears`、`getYearAndMonth`；popconfirm `constants` 的 `numbers`；`date-picker/foundation` 的 `TriggerRenderProps` 与 MonthsGrid、YearAndMonth 的 `renderQuickControls`、`renderDateInput` 类型（React 在自己的 `date-picker` 中声明，`TriggerRenderProps` 字段不变）。
- 删除的方法：`BreadcrumbFoundation.handleClick`、`BreadcrumbAdapter.notifyClick`（两者的第二个泛型 `E` 一并去掉）；`ModalFoundation.toggleDisplayNone` 与 `ModalAdapter.toggleDisplayNone`；`ModalContentFoundation.restoreFocus`；`SideSheetFoundation` 的 `toggleDisplayNone`、`onVisibleChange`，`SideSheetAdapter` 的 `toggleDisplayNone`、`notifyVisibleChange`；`SideSheetFoundation.handlePropsChange`（不再声明 `propKeys`）；`UserGuideFoundation` 的 `measureSpotlight`、`beforeShow`、`afterHide`、`releaseScroll`、`recordFocus`、`restoreFocus`；`AutoCompleteFoundation.close`；`DateInputFoundation` 的 `handleChange`、`handleInputClear`、`notifyChange`、`notifyClear`；`YearAndMonthFoundation` 的 `backToMain`、`notifyBackToMain`；`MonthsGridFoundation` 的 `rangeStart` prop（初始 state 为 `''`）。
- adapter 接口变化：Anchor 的 `getAnchorNode`、`getContentNode` 合并为 `getRoot()`，`getContainer()` 可返回 `null`；Avatar 的 `getTextWidths` 换成 `getAvatarElement()`、`getTextElement()`。Anchor 的 `cssClasses.LINK_TITLE_ACTIVE` 与 `@fibrae/semi-ai-foundation` 的 `cssClasses.FOOTER_CONFIGURE`、`DETAIL_HEADER_LEFT`、`strings.STATUS_EXTENSION_NAME` 为新增常量。Collapse 的内容挂载判断复用 `CollapsibleFoundation.shouldRender`。Select 的 `updateScrollTop` 换成 `getListId`、`getTriggerInput`、`scrollVirtualTo`，`updateOverflowItemCount(hiddenByWidth?)` 自己读选中项数量，`handleClearClick` 内部调用 `stopPropagation`、`stopImmediatePropagation`；AutoComplete 的 `updateScrollTop` 换成 `getListbox`（按 listbox 的 id 查找选项）；TagInput 新增 `getRoot()`，`handleInputFocus`、`handleInputBlur` 自己判断焦点是否越过边界；Tree、TreeSelect 的 `notifyExpand` 的 `expandedKeys` 由 `Set<string>` 改为 `string[]`，`TreeSelectFoundation.handleSelectionKeyDown` 返回「本次是否由 Home、End 打开」，`AnchorFoundation.getInitialState(links = [])` 接受初始 `links`；TimePicker 新增 `blurFocusedElement`，`MonthsGridFoundation.onWeeksRowNumChange` 改为无参；Popconfirm 的 `focusPrevFocusElement` 换成 `getPopup`、`focusTrigger`（关闭后焦点是否回到触发器由 `handlePopupClose` 判断）；PreviewInner 的 `setRatio`、`getIsInGroup` 删除（context 的 `isGroup` 一并删除，组内受控切图调用可选的 `setCurrentIndex`），`isValidTarget` 改名 `isOutsideControls`，state `viewerVisible` 改名 `controlsVisible`，Lottie 的 `notifyLoadError` 与 MarkdownRender 的 `notifyCompileError` 删除（失败时 foundation 在开发期 `console.error`），`BreadcrumbItemAdapter.notifyClick` 改为可选。
- Toast、Notification、Modal.confirm：新增 `base/static-list-wrapper` 的 `StaticListWrapper`（`ensure`、`destroy`、`id`、`element`）；`toast/toast-api-foundation` 的 `ToastApi<O>`、`ToastApiHost` 与 `notification/notification-api-foundation` 的 `NotificationApi<O>`、`NotificationApiHost` 负责实例创建与 `destroyAll`，宿主只提供 `assertClient`、`readGlobalDefaults`、`mount`（返回卸载函数）；`modal/confirm-registry` 的 `ConfirmRegistry`（`register` 返回注销函数、`destroyAll`）；`modal/confirm-instance` 的 `ConfirmInstance<C>`（构造参数 `(config, { render, remove }, registry?)`，成员 `props`、`handle`、`close`、`update`、`handleMount`、`handleAfterClose`），持有确认框实例从创建到移除的簿记，挂载前 `close` 直接结束；`base/list-store` 的 `ListStore<I>`（构造参数 `insertAt`、`idPrefix`、`defaults`；方法 `subscribe`、`getSnapshot`、`open(opts, globalDefaults, beforeShow?)`、`remove`、`finishLeave`、`clear`）取代 `ToastListStore`、`NotificationListStore`，由 `toast-list-foundation` 的 `createToastListStore()`、`notification-list-foundation` 的 `createNotificationListStore()` 创建，`open` 按「`defaults` < 全局默认 < 调用参数」合并，显式 `undefined` 不覆盖；快照类型为 `ListStoreState<T>`（`items`、`removedItems`、`updatedItems`、`order`、`stack`）；`config`、`resetConfig` 从 store 移到 `ToastApi`、`NotificationApi`；删除 `toast/constants`、`notification/constants` 的 `numbers.stackThreshold`、`numbers.stackVisibleCount` 与 `notification/constants` 的 `getStackThreshold`，堆叠阈值只由 `ListStore.open` 计算；`notification-list-foundation` 的 `groupNoticesByPosition`、`noticePositions`、`NoticesInPosition<T>`（React 的 `NoticesInPosition` 类型导出指向它）；`base/hook-api` 的 `createHookApi<O>(store, { readGlobalDefaults, beforeAdd? })`、`HookApi<O>`、`HookApiOptions`（无条目泛型），四个框架的 `useToast`、`useNotification` 用它生成方法，各框架的 `ToastHookApi`、`NotificationHookApi` 是 `HookApi` 的别名，Svelte 的 hook 改用 `StaticListWrapper` 管理容器，`@fibrae/semi-ui-svelte/toast/use-toast` 不再导出内部函数 `createToastHookApi`；`ToastListState.list`、`NotificationListState.notices` 改名 `items`，元素类型为 `id` 必填的 `ToastItem`、`NoticeItem`。
- Toast、Notification 的列表规则与播报：`base/list-store` 新增 `isStackExpanded(stack, opened, shownCount)`、`isStackHidden(expanded, depth)`、`getStackDepths(idsNewestFirst, shownIds)`、`hasLostFocus(focusInside, list)`，四个框架的两个列表共用；`isAlertType`、`readNoticeText` 从 `utils/announcer` 移到 `base/list-store`，`pickFreshAnnouncements` 换成 `FreshItems`（`pick(items, updatedItems)`，自己记住已显示的 id），`utils/announcer` 只保留 `Announcer`、`ANNOUNCE_DELAY`、`ANNOUNCE_HOLD`；四个框架都在列表层播报，子项不再各自播报。
- `AutoCloseFoundation` 新增 `handleListChange(list)`、`isLeaving()`、类型 `AutoCloseListState`，泛型多一个 adapter 参数 `A`，取代 `handleListPausedChange`、`handleListRemoved`、`handleListUpdated`、`clickClose`；暂停、离场、原地更新后重新计时都只经 `handleListChange`，它不再返回值；删除公开方法 `startCloseTimer`、`clearCloseTimer`、`restartCloseTimer`、`pauseCloseTimer`、`resumeCloseTimer`、`leave`；倒计时用 `ResetTimer`，`destroy()` 之后不再开始计时；`AutoCloseAdapter.notifyCloseClick` 与 `clickClose` 移到 `NotificationFoundation`，`NoticeAdapter` 成为 interface 且 `notifyCloseClick` 必选。
- 弹层：新增 `base/popup-lifecycle` 的 `PopupLifecycle`（`show()`、`entered(report)`、`ended(report)`）；`TooltipFoundation.syncPopup()`（宿主每次提交改变了 `isInsert`、`transitionState` 或弹层元素后调用，被隐藏的弹层重新显示时也要调用）、`handleUnmount()`（只在真正卸载时调用）；`ModalFoundation.handleHidden()` 取代 `afterClose`；`SideSheetFoundation.handleHiddenChange(isHidden)`。`TooltipAdapter` 新增 `showPopover`、`hidePopover`、`waitAnimations`（返回 `null` 表示没有动画）、`notifyAfterOpen`、`notifyAfterClose`，`insertPortal()` 只返回 `{ portalTarget, colorScheme }`，`removePortal()` 只丢弃宿主自己的内容标记；`SideSheetAdapter` 新增 `notifyAfterVisibleChange`。`TooltipFoundation` 的 `removePortal`、`updateStateIfCursorOnTrigger`、`handleShown`、`handleOpened` 改私有，`handleContainerKeydown` 删除；`FocusTrapHandle` 删除 `enable` 选项。
- 模态资源：新增 `base/modal-resources` 的 `ModalResources`（`record`、`hold(ModalHold)`、`release()`、`restoreFocus(container?)`），统一持有遮罩栈、body 滚动锁与 FocusScope，Modal、ModalContent、SideSheet、ImagePreview、UserGuide 的 foundation 各持一个实例，是否模态只在 foundation 判定（`SideSheetFoundation.isModal` 为静态函数）。新增 `ModalContext`、`SideSheetContext`、`UserGuideContext`（`getPopupContainer`），`recordFocus()`、`restoreFocus()`（ModalContent、SideSheet、PreviewInner），`PreviewInnerBaseProps.setDownloadName`，`UserGuideBaseProps` 的 `visible`、`mode`、`mask`、`getPopupContainer`，`PopconfirmFoundation.handleFooterMounted()`。adapter 删除 `disabledBodyScroll`、`enabledBodyScroll`、`openLayer`、`closeLayer`、`trapFocus`、`releaseFocus`、`restoreFocus`、`registerKeyDownListener`、`unregisterKeyDownListener`、`getSetDownloadFunc`、`isEventInPreview`、`setImageCursor`、`capturePointer`、`focusCancelButton`、`focusOkButton`，改为交出元素的 `getRoot`、`getDialog`、`getWrap`、`getPopup`、`getFooter` 与 `setInitialFocus`。UserGuide 的 foundation 接管逐帧测量、显示与隐藏的副作用、滚动锁和焦点的记录与归还，宿主只提供 `getPopup`，`propKeys` 为 `visible`、`current`、`mode`、`mask`、`steps`，adapter 新增可选的 `clearWrittenCurrent`（绑定 `current` 的宿主在隐藏后的重置步骤前，清掉只由引导自己写入的值），Vue 经 `useKeepAliveFoundation` 接入，失活即 `destroy()`、激活即 `init()`。ImagePreview 的缩放比例进入 foundation state（`ratio`、`ratioIndex`），宿主用静态 `PreviewInnerFoundation.getRatio(props, state)` 读取，`propKeys` 为 `src`、`currentIndex`，切图后的焦点保持由 foundation 完成。弹层包裹层的 `position: static` 由内部 Portal 按最终容器写入，Solid 内部 `PopupPortal` 删除 `inBody` prop。
- Calendar：`CalendarFoundation` 新增 `toggleCard(e, key, date, remaining)`、`closeCard(e, key?)`、`closeStaleCard(monthlyData, parsedEvents)`，state `showCard` 改为单值 `openCardKey`，adapter 契约为 `notifyClose`、`notifyMoreClick`，删除 `getOpenCardKey`；`CalendarFoundation` 以 `propKeys`（`displayValue`、`showCurrTime`、`today`）自己管理日列的当前时间线，`CalendarBaseProps` 新增 `today`（视图当天 0 点的时间戳，挂载前为 `null`）；月视图 state 新增 `itemLimit`，宿主量出行高后调用 `handleRowResize(rowHeight)`。Resizable：`ResizeGroupFoundation` 持有 item 与 handler 的注册表并按 DOM 顺序排序，新增 `registerItem(entry)`、`registerHandler(element, ...)` 与类型 `ResizeGroupItem`，adapter 只提供 `getGroupRef`；各框架 context 字段统一为 `registerItem`、`registerHandler`、`notifyResizeStart`、`notifyResizing`、`notifyResizeEnd`、`notifyKeyDown`。
- Checkbox：`CheckboxFoundation.handleChange(source)` 读 group context 并自行构造事件，再调用 `notifyChange`、`notifyGroupChange`，组被禁用时只聚焦；`BaseCheckboxProps` 增加 `name`、`type`，`CheckboxGroupView` 增加可选 `onChange`；adapter 只提供 group context 并收窄事件 `target`，原 `focusCheckboxEntity` 换成 `getInput()`，聚焦与 `preventScroll` 在 foundation 处理。BackTop：`propKeys` 增加 `duration`，未传 `target` 时由 foundation 回落到 `window`，`onClick` 在 foundation 内按 `duration` 节流（窗口内多次点击合并为一次 trailing 调用）。Feedback：`handleModalOk`、`handleModalCancel` 对非 Promise 结果返回 `undefined`（原为 `null`）。
- ColorPicker：删除 `color-picker/alpha-slider-foundation`（`AlphaSliderFoundation`、`AlphaSliderBaseProps`、`AlphaSliderBaseState`、`AlphaSliderAdapter`），`ColorSliderFoundation` 同时服务 ColorSlider 与 AlphaSlider；`ColorSliderBaseProps` 改为 `{ width, value, max, onChange }`，`ColorSliderAdapter` 新增 `notifyChange`，新增静态 `getHandlePosition({ value, max, width }, handleSize)`；子 foundation 与三个子组件的 props 不再带 `foundation`。`ColorPickerFoundation.handleColorChangeByHandle({ h })`、`handleAlphaChangeByHandle({ a })` 改名 `handleHueChange(h)`、`handleAlphaChange(a)`，是接收数字的箭头字段，可直接作回调传入；`DataPartBaseProps` 删 `foundation`、加 `onChange`、`onAlphaChange`，`DataPartAdapter` 新增 `notifyChange(color, format)`、`notifyAlphaChange(alpha)`；`DataPartFoundation.getValueByInputValue` 改私有，`handleInputValueChange(text)` 先解析并通知颜色再写入文本，新增 `handleAlphaInputChange(percent)`。
- AudioPlayer、VideoPlayer：新增 `video-player/seek-foundation` 的 `SeekFoundation`（按下拖动、指针位置、悬停预览，支持 `vertical`；`SeekAdapter.focusOnPress` 为可选方法），`VideoProgressFoundation` 继承它，`VideoProgressAdapter` 改为 `SeekAdapter` 的别名，`VideoProgressFoundation.getInitialState()` 不再接收参数，`ProgressPointerEvent` 改名 `SeekPointerEvent`；四个框架的 AudioSlider 直接用 `SeekFoundation`；指针进入与移动分别由箭头字段 `handlePointerEnter(e)`、`handlePointerMove(e)` 处理，可直接作事件处理器，静态 `getPreviewTranslate(offset, vertical?)` 给出悬停预览的 `translate`。
- Table：新增 `TableFoundation.getColumnFlags(column, queries, hasFilterDropdown)`（取代静态 `getColumnQueryState`）与类型 `ColumnFlags<Q>`、实例方法 `handlePageChange(currentPage, pageSize)`；`table/utils` 新增 `getSelectionColumn(rowSelection)`、`getExpandColumn(hideExpandedColumn, expandCellFixed)`、`getDefaultComponents(virtualized)`；`table/constants` 新增 `strings.DEFAULT_COMPONENTS.body.colgroup`、`strings.DEFAULT_VIRTUALIZED_BODY_COMPONENTS`；类型 `TableBaseProps.scroll.y`、`BasePagination.onChange`。`getCurrentPageData()` 不再接收参数，返回当前页的 `{ dataSource?, groups? }`（不克隆）。删除静态 `readScrollMetrics`、`writeScrollableEdges` 与实例 `resetScrollY`（改私有）。adapter：删除 `resetScrollY`、`getScrollMetrics`、`setScrollableEdges`，新增 `getWrapper()`、`getBodyWrapper()`、`notifyPageChange(currentPage, pageSize)`，`notifyFilterDropdownVisibleChange(visible, dataIndex)` 改为 `(column, visible)`。列宽拖拽的占位列、按 key 记录的覆盖值、handler class 的加减与 `onResize*` 的参数和返回值合并都在 `table/utils`：新增 `getResizableColumns(columns, expandColumn, selectionColumn)`、`applyColumnResize(columns, { resizable, classKey, getOverride, isResizing })`、`getColumnResizeChange({ phase, column, recorded, resizable, classKey, width })` 与类型 `BaseResizableOptions<C>`，宿主只保留各自的状态容器与事件接线；`getCellWidths(headWidths, columns, virtualized)` 新增第三个参数，`virtualized` 且无测量值时取列声明的数值 `width`；`genExpandedRowKey` 删除 `suffix` 参数，后缀统一为 `-expanded-row`。
- Cascader、TreeSelect、Tree：新增 `CascaderFoundation.getTriggerKeys(props, { checkedKeys, resolvedCheckedKeys })`、`isTagClosable(key, props, { keyEntities, disabledKeys })`，`TreeSelectFoundation.getNodeLabel(item, { treeNodeLabelProp, keyMaps })`、`isTagClosable(...)`；`tree/shared` 新增 `getNodeData`（取代 `TreeSelectFoundation.getNodeData`）、`getMultipleChange`、`getClearedSelection`、`getCheckedState`、`getSearchState`、`loadTreeNode`、`deriveExpandedKeys`、`deriveSearchingState`、`deriveTreeState(props, prevState, propKeys, animated)` 与类型 `DeriveTreeProps`（`TreeFoundation`、`TreeSelectFoundation` 的静态 `deriveState` 都调用它；`animated` 决定是否生成展开动画状态，Tree 传 `motion`，TreeSelect 传 `motionExpand`，`TreeSelectFoundation.propKeys` 以 `motionExpand` 取代 `motion`）；删除 `tree/tree-util` 的 `keepExistingKeys`，`TreeFoundation.propKeys` 去掉 `loadData`。删除 `CascaderAdapter.notifyLoadData`、`toggleInputShow`（`loadData` 与搜索框显隐由 foundation 直接处理），删除 protected 的 `calcCheckedStatus`、`calcNonDisabledCheckedKeys`、`calcCheckedKeys`（改用 `tree/shared` 的 `calcCheckedStatus`、`calcRelatedCheckedKeys`）；`BasicCascaderInnerData.disabledKeys` 由可选改为必填。
- Form、ArrayField：`form/constants` 新增 `FIELD_PROP_KEYS`（27 个字段专属 prop）、`FieldPropKey`、`FORM_INJECTED_PROP_KEYS`；`form/utils` 新增 `resolveKeepState`、`createFieldRegistration(identity, read)`（`keepState`、`allowEmpty` 为 getter，`getValidateOptions`、`getChangeOptions` 每次读最新 props）、`FieldRegistrationProps`、`FieldRegistrationView`、`validationSchema`、`isRequiredByRules(formProps, rules)`、`pickFormProps`；`form/array-field-rows` 默认导出 `ArrayFieldRows`，导出 `ArrayFieldRowsHost`（注入 `cloneDeep`）、`ArrayFieldRowsMount`：构造时由 `{ field, initValue, formValues, formState }` 算出挂载初值与重置值，持有当前 field 与行 key，提供 `mount()`、`register(field, initValue?)`、`rename(field, keepState, initValue?)`、`unmount(keepState)`、`rowValues(formState, formValues, parentValues)`、`keys`、`shouldUseInitValue`，行操作 `sync`、`add`（下标钳制）、`addWithInitValue`、`remove`、`move` 不再传 field。`FieldBridge` 新增 `blurField(registration)`（未 touched 时置 touched，trigger 含 blur 时校验），删除 `setFieldTouched`、`usesSchema`；`FieldValidateOptions` 增加 `trigger`；`ChangeFieldValueOptions` 删除 `allowEmpty`、`validate`，只剩 `onChange`；`BaseFormAdapter` 删除 `forceUpdate`、`getFormProps`（useForm 代理的 `updateState` 由 foundation 在更新 state 后调用）。
- DatePicker：`DatePickerFoundation` 新增静态 `isSelectionControlled(props)`、`handleInsetDateFocus(e, range)`、`handleInsetTimeFocus()`，`DatePickerFoundationProps.customTrigger?: boolean`（宿主填写，`triggerRender` 与类型 `TriggerRenderType` 移出 foundation，由各框架的 props 类型声明），`DatePickerAdapter` 新增 `focusRangeInput(rangeInput)`、`switchPanels(view)`；`handleSelectedChange` 的 options 以 `nextRangeInputFocus` 取代 `rangeInputFocus`；`MonthsGridFoundationProps.selectionControlled` 取代 `isControlledComponent`，`MonthsGridAdapter` 新增 `getPanelNode(part, panelType)`、`reselectScrollLists()`，`MonthsGridFoundation` 新增 `handleWeeksRowNumChange()`、`switchPanels(view)`、`backToDatePanel()`，类型 `PanelView`、`PanelPart`、`PanelFocusTarget`，`MonthsGridAdapter` 新增 `focusPanelTarget(panelType, target)`，面板切换后的焦点移交与面板尺寸由 foundation 在提交后处理，`propKeys` 新增 `type`、`insetInput`、`density`、`locale`、`format`、`dateFnsLocale`；`MonthFoundation` 改为继承 `BaseFoundation`（adapter 为 `notifyDayClick`、`notifyMonthSwitch`），新增 `getActiveDate(props, state, todayText)`、`selectDay(day)`、`handleKeyDown(event, todayText)` 与类型 `MonthAdapter`、`MonthFoundationState`；`calcDisabledTime` 只返回设置了的键（无则 `{}`）；`date-picker/foundation` 再导出 `getYearMonthFromValue`、`isRangeType`、`isRangeValueComplete`、`isSplitRangeInputs`、`isYearOrMonthType`、`needConfirm` 与类型 `WeekStartNumber`，框架包不再深导入 `date-picker/_utils/*`。删除 `DatePickerAdapter.setRangeInputFocus`，`DatePickerFoundation` 的 `hasOtherRangeInputBeenFocused`、`handleSetRangeFocus`、`disabledDisposeDate`、`disabledDisposeTime`（统一用静态 `disposeDateFn`）、`destroy` 覆写，`handleTriggerClick`、`handleInputChange` 的第二参数，`MonthsGridFoundationProps` 与 `MonthsGridAdapter` 的 `setRangeInputFocus`、`hasOtherRangeInputBeenFocused`，`MonthsGridFoundationProps.triggerRender`，以及 `input/constants` 的 `strings.CLEARBTN_CLICKED_EVENT_FLAG`。Solid 包导出的 `MonthsGridProps` 随之失去 `isControlledComponent`、`setRangeInputFocus`、`hasOtherRangeInputBeenFocused`、`triggerRender`，新增 `selectionControlled`；React、Solid 的 `MonthsGridProps` 另失去 `rangeStart`。`disposeDateFn` 与各子面板把缺省的 `disabledDate`、`disabledTime` 视为都不禁用，宿主不再用 `() => false`、`() => ({})` 填充。
- `@fibrae/semi-ai-foundation`：新增 `message-list-foundation` 的 `MessageListFoundation`（Chat 与 AIChatDialogue 的 foundation 继承它，`propKeys` 为 `chats`、`hints`；`scrollToBottom(animation?)`、`scrollToTop(animation?)` 是可直接作句柄的箭头字段，`scrollToBottomImmediately`、`scrollToTopImmediately`、`scrollToTopWithAnimation` 改私有）、`MessageListAdapter`、`MessageListBaseProps`、`MessageListState`、`ListMessage`、`followChats`、`followHints`；`action-bar-foundation` 的抽象类 `ActionBarFoundation`（Chat 与 AIChatDialogue 的消息操作栏继承它：持有静态 `getInitialState()`、`isActionBarShown({ showReset, finished, showAction })` 与 `copyMessage`、`likeMessage`、`dislikeMessage`、`resetMessage`、`deleteMessage`、`openMenu`、`closeMenu`，子类只实现 `getCopyText()`）、`ActionBarAdapter`、`ActionBarState`，删除 `showDeletePopup`、`hideDeletePopup`、`showMoreDropdown`、`hideMoreDropdown`；`ai-chat-input/extension/editor-config` 的 `createEditorProps`、`getEditorOptions`；`AIChatInputFoundation` 的 `setContent`、`focusEditor`，`AIChatInputAdapter.notifyBeforeRemove`。删除 `ChatFoundation.handleChatsChange`、`handleHintsChange`，`DialogueFoundation.handleListUpdate` 与类型 `DialogueList`，`AIChatInputAdapter` 的 `setContent`、`focusEditor`、`clearContent`、`getActiveElement`，`ChatFoundation.clearContext` 的参数，`createEditorHandlers`，`chat/constants` 与 `ai-chat-dialogue/constants` 的 `strings.SCROLL_ANIMATION_TIME`、`strings.SHOW_SCROLL_GAP`，`AIChatInputBaseProps.uploadProps.beforeRemove` 的 foundation 侧声明（组件 Props 不变），`sidebar/utils` 的 `canRestoreFocus`。Chat 与 AIChatInput 的附件移除改用 `@fibrae/semi-foundation/upload/utils` 的 `removeUnlessPrevented(result, remove)`，与 Upload 共用。Sidebar 的 `ContainerFoundation` 由 `ModalResources` 持有遮罩栈与焦点归还，adapter 删除 `openLayer`、`closeLayer`、`restoreFocus`，新增 `getRoot()`、`getLayer()`，foundation 新增 `recordFocus()`。`AIChatInputFoundation` 的 `splitBlock` 无条件走编辑器的 `splitBlock` 命令，新增静态 `getTransformedContent(content, transformer)`，`handleKeyDown(view, event)` 作为编辑器的 `editorProps.handleKeyDown`，删除 `handleRichTextAreaKeyDown` 与 `AIChatInputAdapter.setTransformedContent`；`ChatFoundation`、`DialogueFoundation` 新增静态 `getContentClass(role, status, mode)`、`getMarkdownRaw(text, role, escapeHtml)`，`MessageListFoundation` 新增静态 `mergeMarkdownComponents(builtin, custom)`；`ai-chat-input/utils` 的 `getContentType` 返回新增类型 `ContentType`（`FileKind | 'unknown'`）；`ai-chat-dialogue/constants` 新增 `DialogueIconKind`，各文件类型图标表按 `FileKind`、`DialogueIconKind` 约束；`DialogueFoundation` 的 adapter 新增必填 `notifyChatsPropChange()`，`chats` 回声去重只在 foundation 做一次；`action-foundation` 新增 `getDialogueActionKeys(flags, custom)` 与类型 `DialogueActionKey`，`chat/chat-box-action-foundation` 新增 `getChatBoxActionFlags`、`getChatBoxActionKeys`、`ChatBoxActionKey`，宿主只做 key 到图标的映射；`ChatFoundation` 的 `handleDragOver`、`handleDragStart`、`handleDragEnd` 内部判断 `uploadProps.dragUpload`，foundation 的 props 须带 `enableUpload`、`uploadProps`；`sidebar/file-extensions` 新增 `getFileMenuItems(canUpload)`、`unsetLink(editor)` 与类型 `FileMenuFlag`、`FileMenuButtonKey`、`FileMenuButton`、`FileMenuItem`。
- 破坏性（类型）：写成 `p: T | undefined` 的 state 与接口属性改为可选属性 `p?: T`：`ModalState` 的两个状态字段、`TooltipState.colorScheme`、`CalendarMonthBaseState.openCardKey`、`typography/ellipsis` 的 `ExpandButton.expanded`、Table 表头的 `query`、`@fibrae/semi-ai-foundation` 的 `AIChatInputFoundation` state 的 `skill`、`content`。

### AudioPlayer、VideoPlayer

- 破坏性（类型）：Props 不再接受 `onTimeUpdate`、`onEnded` 等 23 个 React 媒体事件回调及 Capture 变体（从不触发）；VideoPlayer 的 `controlsList` 收窄为 `VideoControl[]`，`theme` 收窄为 `'dark' | 'light'`；删除无效的 `forwardRef`，改用 `ref`。
- VideoPlayer 进度条手柄用 `translate` 居中，`VideoProgressFoundation.getHandleLeft` 返回纯百分比（原 `calc(<百分比> - 8px)`）。
- 破坏性（深路径导入）：删除 `semi-ui-react/video-player/utils`，改从 `@fibrae/semi-foundation/video-player/utils` 导入。
- VideoPlayer 新增 `onNext`，「下一个」按钮只在传了 `onNext` 且 `controlsList` 允许时显示（原来默认显示）；静音改由 `muted` 承载，不再把音量写成 0；`onVolumeChange` 在拖动音量或切换静音时触发。AudioPlayer 时间统一为 `mm:ss`，超 1 小时为 `h:mm:ss`（原 `75:00`），封面不再可预览。AudioPlayer 挂载前音频元数据已加载完（服务端渲染后 hydration、缓存命中）时，挂载时直接读出时长，进度条可拖动、可点击跳转（原来时长停在 0，拖到哪里都跳回开头）。
- AudioPlayer 进度条圆点与 VideoPlayer 一致，中心对准进度末端，两端时盖住轨道圆角（原来圆点限制在轨道内），进度条两侧留出半个圆点的间距，圆点不压住时间文字；指针按下进度条不再显示键盘焦点环。VideoPlayer 音量与菜单弹层改为不透明深灰底，音量弹层底部增加 12px 留白（高度 160px 改为 168px）；两者的弹层与菜单项样式不再依赖样式表加载顺序（原来可能被 Dropdown、Popover 的默认底色与文字色覆盖）。
- VideoPlayer 进度条圆点在悬停、键盘聚焦或拖动时显示，与轨道同心，进度为 0 时也显示（原来只在悬停播放头所在分段时显示，进度为 0 时不显示，拖动后移出可能一直残留）；轨道悬停变粗改为以中心线上下对称的高度过渡；时间预览 Tooltip 不再拦截指针（原来箭头伸进进度条热区，指针移到箭头下时悬停中断，轨道粗细闪烁）。
- VideoPlayer 的初始 `volume` 取整并夹到不小于 0，音量为 0 时同时静音；销毁时清除计时器，重新显示时按当前状态重新应用音量与倍速。
- VideoPlayer 传了 `captionsSrc` 时 Safari 也默认显示字幕（原来 Safari 按系统字幕偏好不启用 `default` 字幕轨，播放器又没有字幕开关，字幕始终不显示）。
- Vue：不转发原生媒体事件；VideoPlayer 回调改为事件 `play`、`pause`、`qualityChange`、`rateChange`、`routeChange`、`volumeChange`，`onNext` 仍是函数 prop。
- Solid：AudioPlayer 的 `ref` 与未声明属性落在根 div；VideoPlayer 的 `ref` 指向原生 video 元素，未声明属性落在根 div；两者的 `style` 都接受对象或字符串；Props 也不接受媒体事件的小写（`ontimeupdate`）与 `on:` 写法；进度与音量滑块的 range input 用 `input` 事件上报。
- Svelte：`class` 接受 clsx 值，`style` 只接受字符串；媒体事件（play、pause 等）不再透传到根元素，AudioPlayer 没有回调 props；VideoPlayer 的回调为 `onPlay`、`onPause`、`onQualityChange`、`onRateChange`、`onRouteChange`、`onVolumeChange`、`onNext`，经 `bind:this` 后调用 `getVideo()` 取得原生 `<video>`。
- Svelte：`defaultPlaybackRate`、`defaultQuality`、`defaultRoute` 只在挂载时读取一次，之后变化不再生效；进度条和按钮的 Tooltip 通过 `child` snippet 接入，按钮外层没有额外的 span。

### TimePicker

- 破坏性：删除 `getPopupContainer`、`zIndex`、`dropdownMargin`（面板在 top layer）、`onChangeWithDateFirst`（`onChange` 固定为 `(value, valueString)`）、无效的 `clearText`。
- 破坏性（类型）：`TimePickerProps` 改为类型别名（`interface X extends TimePickerProps` 改交叉类型），`onChange` 按 `type` 判别为 `(Date, string)` 或 `(Date[], string[])`；删除无效的 `locale`、`localeCode`、`dateFnsLocale`（改用 `LocaleProvider`、`ConfigProvider`）；`scrollItemProps` 收窄为 `cycled`、`mode`、`motion`、`transform`；`triggerRender` 参数改为 `TimePickerTriggerRenderProps`；ref 为 `TimePickerHandle { focus, blur }`。
- `timeRange` 只选一侧时 `value` 固定长度 2，空侧为 `undefined`，字符串为 `['07:00:00', '']`，`disabledTime` 收到 `[date, undefined]`；按 `length === 1` 判断的代码需调整。
- 破坏性（类型）：`disabledTime` 的 `value` 与 `TimePickerTriggerRenderProps` 的 `value` 声明为 `(Date | undefined)[]`（与运行时一致，四个框架相同），读取一侧的日期前需判空；foundation 的 `TimePickerBaseProps.disabledTime` 与 `getDisabledTimeFns` 的 `dates` 同步放宽。
- React、Solid：使用 `triggerRender` 时未声明的属性（`id`、`aria-*`、`data-*`、原生事件等）落在根元素上（原来不落在任何元素上，与 Vue、Svelte 一致），传 `aria-label` 或 `aria-labelledby` 时根元素的 role 为 `group`；React 的根元素在触发器内没有可聚焦元素时本身是 `role="button"`，`aria-label` 为它命名，使用方的 `onClick`、`onKeyDown` 先于内部处理调用。
- 破坏性：设置 `timeZone` 后，字符串 `value` 按目标时区的钟点解析；`onChange` 的字符串是目标时区的钟点，即输入框文字（原来按系统时区格式化），日期与 `disabledTime` 的参数为 `TZDate`，序列化时带偏移而不是 `Z`。受控时切换 `timeZone` 按新时区重读 `value`。
- `ref.focus()` 聚焦触发器内第一个可聚焦元素，没有时聚焦根元素（自定义触发器同样可用）；`ref.blur()` 让触发器或面板内当前聚焦的元素失焦。
- 受控 `open` 时点击外部会调用 `onOpenChange(false)` 与 `onBlur`；`open={undefined}` 按非受控；`value` 为 `null` 是受控空值，时间戳 `0` 有效；`hourStep` 等非正整数抛 `RangeError`。
- Vue：`v-model`（`modelValue`）与 `v-model:open`；清空时单选上报 `undefined`、范围上报 `[]`；`triggerRender` 改 `#trigger`，`panelHeader`、`panelFooter`、`panels` 改 `#panelHeader`、`#panelFooter`、`#panel`。
- Solid：`ref` 是 `.semi-timepicker` 根元素，`focus()` 套用 `preventScroll` 属性，不提供 `TimePickerHandle`；`autoFocus` 写作 `autofocus`（Vue、Svelte 同），`onFocus` 收到原生 `FocusEvent`（`onBlur` 仍为点击外部的 `MouseEvent`）；`style`、`inputStyle`、`popupStyle` 接受对象或字符串。
- Solid：`triggerRender` 只调用一次，参数是随状态更新的响应式对象（在 JSX 之外解构只得到初始值）；自定义触发器包在根元素内的一个 div 中（`.semi-timepicker > div`），内容不含可聚焦元素时由该 div（React 中为根元素）带 `role="button"`、`tabindex` 与 `aria-haspopup`、`aria-expanded`、`aria-controls`。
- Svelte：`value`、`open` 可绑定（不提供 `defaultValue`、`defaultOpen`），回调为 `onChange(value, str)`、`onOpenChange`；清空时单选上报 `undefined`、范围上报 `[]`。
- Svelte：`triggerRender` 改为 `trigger` snippet，参数类型 `TimePickerTriggerRenderProps`，其中 `componentProps` 不含 snippet 与未声明属性；`panelHeader`、`panelFooter` snippet 带 `{ index }`，`panel` snippet 在范围模式下同时用作两个面板的头部与底部，不按下标回退；`inputStyle`、`popupStyle` 只接受字符串；键盘回调经 `onKeyDown`、`onKeyUp`、`onEnterPress` 到达输入框；`focus()`、`blur()` 经 `bind:this` 调用。

### Upload

- 破坏性：`limit` 为 1 时选择文件不再调用 `onExceed`；`onDrop` 第一个参数改为原生 `DragEvent`；`accept` 中点开头的扩展名按完整后缀匹配（`.tar.gz` 要求以其结尾）；`addOnPasting` 只响应原生 `paste` 事件，`onPastingError` 改为粘贴文件读取失败时触发，参数收窄为 `Error`。
- 破坏性（类型）：`FileItem`、`BaseFileItem` 删除 `[key: string]: any`（Chat 的 `attachment`、AIChatInput 的 `Attachment` 随之变化）；`RenderFileItemProps` 不再含 `key`；`transformFile` 改为 `(file: File) => File`；`cropModalProps` 收窄为 `UploadCropModalProps`；ref 为 `UploadHandle { insert, upload, openFileDialog }`。
- React、Solid 破坏性（类型）：`upload` 深路径导出的 `customRequestArgs` 改名 `UploadCustomRequestArgs`，与包根导出同名。
- 上传事件不再原地改写文件项，每次生成新对象，用 `===` 比较旧文件项需改为比较 `uid`；卸载、隐藏或缓存时进行中的上传不再中止（需要中止的用 `customRequest`），卸载后请求结果仍会回调 `onChange`、`onSuccess`、`onError` 等（Vue 的事件卸载后不再发出）。
- 选择文件后清空隐藏文件输入框的值而不重新挂载它，同一文件可再次选择；React 的 `UploadState` 删除 `inputKey`、`replaceInputKey`。
- React、Vue、Solid：服务端渲染的文件卡片缩略图在 hydration 前已加载失败时，hydration 后切到回退图标（原来保留破图）。
- DOM 变化：图片墙空列表也渲染 `.semi-upload-file-list`（依赖 `.semi-upload > .semi-upload-add` 的样式需调整）；`tabIndex` 落在添加按钮上，根元素不再输出 `aria-required`、`tabIndex`；列表缩略图 `alt` 为空，卡片操作与「清空」改为原生 `button`。
- `aria-required` 为真时（FormUpload 必填），添加按钮的 `aria-describedby` 指向一段隐藏的「必填」说明（文案取语言包 `Form.required`）；添加区内容自带可聚焦控件时说明落不到该控件上，改挂在根元素的 `aria-describedby`。
- 不带事件对象调用 `onProgress` 不再抛错；进度事件只重渲染对应的文件卡片（React；Solid、Svelte 原本按卡片细粒度更新）。
- 添加区挂载后子元素增删 `aria-label`、`aria-labelledby`、`alt` 时重新判断是否已有名称；foundation 的 `addAreaControlAttributes` 改名为 `addAreaObservedAttributes` 并包含这三个属性。
- Vue：受控列表用 `v-model:fileList`；回调改为事件 `change`、`success`、`error`、`progress`、`remove`、`retry`、`exceed`、`drop`、`clear`、`pastingError`、`cropError` 等，`onPreviewClick` 仍是函数 prop；卸载后不再发出这些事件。
- Vue：节点与 render props 改为插槽，如 `#dragIcon`、`#dragMainText`、`#prompt`、`#fileItem`、`#thumbnail`、`#picClose`、`#fileOperation`、`#fileListHeader`；`validateMessage` 只收字符串，节点用 `#fileValidateMessage`；逐文件插槽的文件数据在 `file` 字段。
- Solid 破坏性（类型）：`FileItem`、`BeforeUploadObjectResult`、`AfterUploadResult` 的 `validateMessage` 只收字符串（原为 `JSX.Element`），节点用 `renderValidateMessage(fileItem)`，参数同其他渲染函数为 `RenderFileItemProps`，渲染为空时回落到文字；照片墙只为带 `validateMessage` 的文件显示校验图标，`renderValidateMessage` 替换图标提示中的文字（Vue 的 `#fileValidateMessage` 为该文件渲染出内容时即使没有文字也显示图标）。
- Solid：`ref` 拿到根元素 `UploadElement`，其上带 `insert`、`upload`、`openFileDialog`；`FileCard` 经 `Upload.FileCard` 使用，`FileCardProps` 不含 `class`；文件卡片按位置复用，`renderFileItem`、`renderThumbnail` 等渲染函数每个位置只调用一次，参数是随文件更新的响应式对象，在 JSX 之外解构只能拿到初始值；`fileListTitle` 的渲染函数须声明参数，无参函数按节点处理（只替换标题文字）；`renderPicClose` 的参数为 `{ class, remove }`；`itemStyle` 与 `cropModalProps` 的 `style`、`bodyStyle` 只接受对象。
- Solid：添加区含 Semi 的 Button、IconButton 或 AIChatInput 的默认上传按钮时，首帧（含服务端 HTML）即不带 `role="button"`、`tabindex`；其他可聚焦控件（原生 `button`、链接等）挂载后才判定，挂载前添加区仍是按钮。
- Svelte：`fileList` 可绑定（`bind:`、函数绑定、单向、不传四种写法），没有 `defaultFileList`，绑定成 `undefined` 时清空（表单重置）；事件是 `onX` 回调；插槽改为同名 snippet：`dragIcon`、`dragMainText`、`dragSubText`、`prompt`、`validateMessage`、`fileListTitle`、`fileListHeader`、`fileItem`、`previewFile`、`thumbnail`、`picInfo`、`picPreviewIcon`、`picClose`、`fileOperation`、`fileValidateMessage`、`ellipsisTooltip`，空 snippet 不回落默认内容。
- Svelte：`itemStyle`、`cropModalProps.style`、`bodyStyle` 只接受字符串；图片墙的校验图标只在 `validateMessage` 为字符串时出现；经 `bind:this` 调用 `insert`、`upload`、`openFileDialog`（类型 `UploadHandle`）；`Upload.FileCard` 与 `UploadFileCard` 两种导出都有。
- Svelte：没有 KeepAlive 行为；有 `aria-label` 时根元素为 `role="group"`；`tabindex` 交给上传区域，`onblur` 只在焦点离开整个组件时触发。

### Cropper

- 裁剪框最小边长 10px 对指针拖拽同样生效；加载后改变 `aspectRatio`，裁剪框按新比例重排；滚轮缩放末步停在 `maxZoom`、`minZoom`；图片未加载时 `getCropperCanvas` 抛错；ref 为 `CropperHandle`，只有 `getCropperCanvas`。
- Vue：`zoom` 用 `v-model:zoom`（或 `:zoom` 加 `@zoomChange`），`rotate` 只能单向绑定；`preview` 仍是返回宿主 DOM 的函数。
- Solid：`ref` 拿到根元素 `CropperElement`，其上带 `getCropperCanvas`；`imgProps`（类型 `CropperImgProps`）的 `style` 与 `cropperBoxStyle` 只接受对象。
- Svelte：`zoom` 可绑定（`bind:zoom`、函数绑定或单向传值），滚轮缩放同时调 `onZoomChange(zoom)`，`zoom` 不读全局默认值；`imgProps` 为 `HTMLImgAttributes`（加载回调用 `onload`），`style`、`cropperBoxStyle` 只接受字符串；`getCropperCanvas()` 经 `bind:this` 调用。
- 换图后保持当前 zoom，图片尺寸与 zoom 一致。切换 `aspectRatio` 时结束进行中的角点与裁剪框拖动。
- React、Vue、Solid：服务端渲染的图片在 hydration 前已加载完成时，hydration 后补发 load 并初始化裁剪框（原来裁剪框保持 0 尺寸）。
- RTL 下裁剪器内部固定为 `direction: ltr`，裁剪框、图片与 `preview` 容器里的预览图都从左上角定位，与 LTR 一致（原来三者错位）；预览图带内联 `float: left`。

### Resizable

- 破坏性（类型）：`onResizeStart`、`onChange`、`onResizeEnd` 的事件统一为 `PointerEvent`，键盘缩放时为 `KeyboardEvent`，读 `clientX` 等需先判断类型；`HandlerCallback` 改为 `PointerEvent`，删除 `ResizeEventType`、`ResizableState`、`ResizeGroupState`。
- 拖拽条为 `role="separator"` 和 Tab 停靠点，方向键调整大小；ResizeItem 的 `min`、`max` 统一按 border-box px 计算，支持 `vw`、`vh`（`rem`、`em` 仍得 NaN）；`onResizeStart` 任一侧返回 `false` 取消调整；`size` 只传一个轴时另一轴用 `defaultSize`；ResizeGroup 中途插入的 ResizeItem、ResizeHandler 按 DOM 顺序参与拖动与键盘调整。
- Vue：受控尺寸用 `v-model:size`；`onChange`、`onResizeEnd` 改为 `change`、`resizeEnd` 事件，`onResizeStart` 仍是函数 prop；`handleNode` 改为 `#handle="{ direction }"`；已知限制：ResizeItem 传字符串 style 会冲掉尺寸，请用对象 style。
- Solid：`style`、`handleStyle`、`handleWrapperStyle` 可以是对象或字符串，`minWidth` 等的数字仍按 px 处理；破坏性：`handleNode` 改为 `renderHandle(direction)`，只为启用的方向调用（同 Vue 的 `#handle="{ direction }"`），删除类型 `HandleComponent`；ResizeItem、ResizeHandler 在 ResizeGroup 内经 ref 回调登记，序号按 DOM 顺序计算。ResizeItem 的字符串 `style` 变化时会冲掉分组写入的尺寸，请用对象 style（同 Vue）。ResizeHandler 只有原生属性，不提供 `direction`、`onResizeStart`、`disabled`（React 声明而不生效，同 Vue、Svelte）。
- Svelte：`children` 与 `handle` snippet 对应 Vue 的默认插槽与 `handle` 插槽，`handle` 的参数是 `{ direction }`；回调为 `onChange`、`onResizeEnd`；`style`、`handleStyle` 只接受字符串；`size` 是单向 prop（按轴受控），不能 `bind:size`，`defaultSize` 保留为各轴的回退值。
- 受控 `size` 拖动时立即显示 `onChange` 中同步写回的尺寸，不落后一次指针移动（四个框架）。
- ResizeGroup 不卸载、只移除正在拖动的 ResizeHandler 时结束这次拖动，透明背景层随之移除，不再挡住页面；这次拖动不调用 `onResizeEnd`（四个框架）。
- `snap.x` 或 `snap.y` 为空数组时按没有吸附点处理；原来 `snapGap` 为 0 时尺寸变成 `undefined`。

### CodeHighlight

- 由 prismjs 改用 shiki：`language` 取 shiki 语言名与别名，未知语言按纯文本；配色为 `github-light`、`github-dark`；删除 `defaultTheme`，`.token.*` 类名不再存在，基于 Prism 的自定义主题 CSS 失效；高亮异步完成，首帧为纯文本。不再内置语言，经 `CodeHighlight.register({ languages, themes })` 或 `languages`、`themes` 属性提供；`code` 改为可选。
- Vue：`languages`、`themes` 在 `<script setup>` 顶层声明，不要在模板写内联字面量；`CodeHighlight.register` 与 React 共用注册表。
- Solid：`CodeHighlight.register` 与 React、Vue 共用注册表；高亮结果作为 DOM 节点插入根元素，首帧为纯文本。
- Svelte：注册改用命名导出 `registerCodeHighlight({ languages, themes })`，没有 `CodeHighlight.register`，与其他框架共用注册表。

### HotKeys

- 破坏性：`HotKeys.Keys` 删除需 Shift 才能输入的符号别名（`Exclamation`、`At`、`Hash` 等），`hotKeys` 写 `'!'`、`'@'` 现在抛错，改写为 `['Shift', '1']`；删除无效的 `mergeMetaCtrl`；`HotKeysProps` 收窄为实际接受的属性（不含 `children`），`hotKeys` 必填。
- Vue：`onHotKey` 改 `@hotKey`（载荷为原生 `KeyboardEvent`），`render` 改默认插槽（为空表示只监听不渲染）；`class`、`style`、`@click` 落在根元素。
- Solid：`render` 接受节点或返回节点的函数，函数只调用一次；为 `null` 时不渲染根元素，快捷键仍有效。`getListenerTarget` 内读取的 signal 变化时，监听移到新目标（React 只在换成另一个函数时）。
- Svelte：`render` 改为 `children` snippet，回调为 `onHotKey`，`HotKeys.Keys` 保留；无效的按键组合在挂载或 `hotKeys` 变化时抛错。

### Highlight

- `searchWords` 中的 `undefined`、`null`、空字符串被忽略；相邻的不同样式搜索词不再合并成一个块，各自保留 `className` 与 `style`。
- Vue：没有根元素，丢弃 `class`、`style`；数字样式不补 `px`，要写 `'4px'`；`searchWords` 对象项的类名字段为 `class`。
- Solid：同 Vue，没有根元素，丢弃 `class`、`style` 等未声明属性，对象项的类名字段为 `class`；`highlightStyle` 与对象项 `style` 的键用 kebab-case，数字值不补 `px`。
- Svelte：同 Vue，没有根元素，丢弃未声明属性，对象项的类名字段为 `class`；`highlightStyle` 与对象项 `style` 是对象（键可用驼峰或 kebab-case），数字值不补 `px`。

### Layout

- Vue：`Layout.Sider` 的 `onBreakpoint` 改为 `@breakpoint(screen, matches)`；嵌套更深的 Sider 需传 `hasSider`。
- Solid：`Layout.Sider` 经 context 向最近的 Layout 登记，`has-sider` 在 Sider 创建时登记，服务端首帧已带上，不扫描直接子元素，嵌套在其他元素里的 Sider 也算。
- Svelte：`Layout.Header` 等之外另有具名导出 `LayoutHeader`、`LayoutFooter`、`LayoutContent`、`LayoutSider`；Sider 回调为 `onBreakpoint`；嵌套较深的 Sider 需传 `hasSider`（服务端首帧缺 `has-sider`）。

### Grid

- 破坏性：Row 一律是 flex 布局，删除 `type` 属性（List 的 `grid` 同样不再接受 `type`），`align`、`justify` 始终生效；类名 `semi-row-flex*` 改为 `semi-row`、`semi-row-justify-*`、`semi-row-align-*`，float 与 clearfix 删除。没设 `span` 的 Col 按内容定宽。
- 破坏性（样式钩子）：Col 的 `span`、`offset`、`push`、`pull`、`order` 改为行内 CSS 变量 `--semi-col-*`，每个断点一组规则，小断点的值向大断点继承；`semi-col-12`、`semi-col-md-6` 等预生成类名删除，手写这些类名不再生效。Grid 的 CSS 由约 74 KB 降到约 8 KB。使用方传给 Col 的 `style` 与生成的变量合并，同名时使用方优先。
- Form 不再用 Row 包裹 `<form>`；顶部标签的包裹层用 `flex-basis: 100%` 代替 `overflow: hidden`。
- 破坏性（深路径导入）：`semi-ui-react/grid/row` 不再导出 `RowContext`、`RowContextType`。
- Row 的 `gutter` 改为 CSS 变量 `--semi-row-gutter-{x,y}-{xs..xxl}` 加媒体查询，不再写入 Row、Col 的行内 style；Col 不在 Row 内时 gutter 为 0 正常渲染；Col 断点层的 `0`（如 `md={0}`）只在命中断点及以上隐藏，`order`、`offset`、`push`、`pull` 设为 0 现在生效。
- 具名导出 `Row`、`Col`，无 default 导出；Vue：`gutter`、`span`、`xs` 等数字与对象 prop 必须用 `:` 绑定。
- Solid：`style` 接受对象（kebab-case 键）或字符串，写在 gutter 变量之后，使用方的值优先。
- Svelte：具名导出 `Row`、`Col`；`style` 只接受字符串，写在 gutter 变量之后，使用方的值优先。

### Descriptions

- 横向布局只把 `Descriptions.Item`（含 Fragment 里的）当作列，非元素子节点不再占列位；`align="left"` 在 RTL 下镜像。
- Vue：`data` 项的 `key`、`value` 只接受 `string | number`，自定义内容用作用域插槽 `#itemKey`、`#value`（参数 `{ item, index }`）。
- Solid：children 中只渲染 `Descriptions.Item`，其他子节点（React 纵向布局下原样输出，如自定义 `tr`）不渲染并在开发期告警，放在 Descriptions 外的 Item 单独写时不渲染；横向布局下 `span`、`hidden` 或 `column` 变化时重建全部单元格内容。
- Solid 破坏性（类型）：`data` 项的 `key`、`value` 只接受 `string | number`（不再接受 JSX 与函数），自定义内容用 `renderKey(item, index)`、`renderValue(item, index)`，`index` 是该项在 `data` 中的位置（含 `hidden` 项）；隐藏项不调用它们。`Descriptions.Item` 的 `itemKey`、`children` 不变。
- Svelte 破坏性：不提供 `Descriptions.Item`，只用 `data`；自定义内容用 `itemKey`、`value` snippet（参数 `{ item, index }`，`index` 含隐藏项）；`keyStyle` 只接受字符串。

### Card

- 字符串 `title` 渲染为 `div`（外观仍是 6 号标题），不再是 `h6`；`headerExtraContent` 在 DOM 中位于 title 之后；`header`、`cover`、`footer` 为 `0` 时渲染在各自容器内。
- Vue：ReactNode 属性改为同名插槽 `title`、`headerExtraContent`、`header`、`cover`、`footer`、`actions`（`overrideDefaultProps` 不能再设置它们）；`title?: string` 与 `#title` 等价，插槽优先；根 div 用 `$el`。
- Solid：`loading` 期间不创建正文 `children`，加载结束后才创建；`loading` 时只要传了 `children` 就显示骨架屏占位（与 React 一致），不检查它渲染后是否为空（React 会跳过渲染为空的 children），因为判断是否为空要先创建它们。
- Svelte：`title` 是 `string | Snippet`，字符串渲染为带单行省略 Tooltip 的 6 号标题，snippet 原样渲染；`headerExtraContent`、`header`、`cover`、`footer` 是 snippet，`children` 是正文；`actions` 是 `Snippet[]`，每个元素一项；`bodyStyle`、`headerStyle`、`footerStyle` 只接受字符串；`loading` 时只要传了 `children` 就显示骨架屏；子组件 `Card.Meta` 与具名导出 `CardMeta` 是同一个组件（`title`、`avatar`、`description`）。

### DragMove

- 破坏性（类型）：`onMouse*`、`onTouch*`、`allowMove` 参数改为 `PointerEvent`；`children` 收窄为 `ReactNode`；`handler` 改为 `() => HTMLElement | null`，返回的元素需位于被拖元素内；右键、中键不再启动拖动。
- Vue：没有根元素，未声明属性全部丢弃（F11）；回调改为 `mouseDown`、`mouseMove`、`mouseUp`、`touchStart` 等事件，载荷 `PointerEvent`；默认插槽中每个顶层元素各自可拖动，文本与多根组件不可拖动。
- Solid：children 中每个顶层元素各自可拖动（多根组件的每个根也是），文本节点不可拖动；`handler` 返回的元素需位于被拖元素内。
- Svelte：没有 `DragMove` 组件，改为 attachment，写成 `<div {@attach dragMove(options)}>`，从 `@fibrae/semi-ui-svelte` 导入 `dragMove` 与 `DragMoveOptions`；Vue 的同名 props（`handler`、`constrainer`、`allowInputDrag`、`allowMove`、`customMove`、`positionStrategy`）变成同名 options，`handler` 可传函数或元素；7 个事件变成 `onMouseDown`、`onMouseMove`、`onMouseUp`、`onTouchStart`、`onTouchMove`、`onTouchEnd`、`onTouchCancel` 回调（参数为 `PointerEvent`）；不是组件，没有全局默认值。
- 松手时先写入最后位置再触发结束回调，回调里设置的位置不再被覆盖；移动回调中卸载组件后不再调用 `customMove`。

### Slider

- 破坏性（类型）：`SliderState.focusPos` 改名 `activeHandle`；`tipFormatter` 参数为 `number`（每个手柄单独调用），删除类型 `tipFormatterBasicType`；`handleDot` 改为 `HandleDot | HandleDot[]`。
- 每个手柄内改为视觉隐藏的原生 `input type="range"`（`.semi-slider-handle-input`）：`getByRole('slider')` 返回该 input，`aria-valuenow` 等不再输出，改读 `value`、`min`、`max`、`disabled`，`onKeyDown` 绑定在它上；新增 `name`；方向键由组件处理，各浏览器一致：`vertical` 时指向 `max` 一端的方向键（默认下，`verticalReverse` 时上）与右方向键增加值，水平 RTL 时左方向键增加值；PageUp、PageDown、Home、End 仍由原生 range 处理；foundation 的 `handleKeyDown` 改为 `(event, pos)`；步长网格从 `min` 起算；无 `value` 时初始位置为 `min`（原为 0）；指针按下轨道或手柄聚焦 input 时不显示键盘焦点环。
- Vue：`value` 改 `modelValue`；`onAfterChange`、`onMouseUp` 改为 `afterChange`、`mouseUp` 事件；`marks`、`tipFormatter` 只收字符串或数字，节点用 `#mark`、`#tip` 插槽。
- Solid：`ref` 是根元素，其 `focus()` 聚焦起点手柄（范围模式下为第一个手柄），`blur()` 释放持有焦点的手柄；`autofocus` 为小写，同样聚焦起点手柄。`onKeyDown`、`onFocus`、`onBlur` 为原生 DOM 事件；手柄 Tooltip 不通过 `aria-describedby` 关联；开启 `tooltipOnMark` 时标签与气泡各调用一次，各自持有独立的节点。
- Solid 破坏性（类型）：`marks` 只收字符串或数字，节点用 `renderMark(value, label)`。
- Svelte：`value` 可绑定（`bind:value`、函数绑定、单向传值、不传），没有 `defaultValue`；`onChange`、`onAfterChange`、`onMouseUp`、`onFocus`、`onBlur`、`onKeyDown` 是回调 prop；节点型刻度与提示用 `mark({ value, label })`、`tip({ value, handle })` snippet；`railStyle`、`style` 只接受字符串。
- 破坏性（类型，React）：`onKeyDown` 的类型改为 `KeyboardEventHandler<HTMLInputElement>`，与它实际绑定的手柄 input 一致（原来继承 div 的事件类型）。
- `onKeyDown` 中 `preventDefault()` 拦截的取值键松开时不再触发 `onAfterChange`、`onMouseUp`。刻度标签 `marks` 不换行（`white-space: nowrap`），靠近末端时可超出轨道。
- Svelte：`onFocus` 是外层的 focusin，`onBlur` 只在焦点离开整个 Slider 时触发，`onKeyDown` 落在手柄的 input 上；`value` 绑定或单向传值时，每次值变化除 `onChange` 外也触发 `onAfterChange`（同 Vue 的 v-model），不传 `value` 时拖动期间只触发 `onChange`，松开后触发一次 `onAfterChange`。

### Tag

- 破坏性（类型）：`TagGroupProps` 删除泛型参数 `T`，改为按 `mode` 判别的联合且 `tagList` 必填：`<TagGroup<'custom'> ...>` 改为 `<TagGroup mode="custom" ...>`，`TagGroupProps<'custom'>` 改为 `TagGroupProps`；`onClose`、`onTagClose` 事件参数改为 `React.MouseEvent | React.KeyboardEvent`。
- 可点击 Tag 按 Enter、空格时对自身 `click()`，`onClick` 收到真实 click 事件；`visible={undefined}` 按非受控；TagGroup、SplitTagGroup 透传未声明属性到根 div（F2）。
- Vue：内容及图标用默认插槽、`prefixIcon`、`suffixIcon`；`close(event, tagKey)`、`tagClose(event, tagKey)` 去掉 children 参数；`tagList[].children` 只收 `string | number`，自定义节点用 `#tag`，无 `mode="custom"`。
- Solid：`onClose`、`onTagClose` 的 `event` 为 `TagCloseEvent`（原生 `MouseEvent | KeyboardEvent`），`tagChildren` 为解析后的 children；使用方在 `onClose` 中同步移除标签时，焦点仍先移到相邻标签；TagGroup 按 `tagKey`（没有时按文本与出现次序）识别各项，`tagList` 每次重建对象也不重新挂载；`+N` 直接作 Popover 的触发器，不额外包 span。
- Solid 破坏性：TagGroup 删除 `mode`，`tagList` 只收数据 `TagGroupItem[]`（Tag 的属性，`children` 为 `string | number`，不含 `prefixIcon`、`suffixIcon`），新导出类型 `TagGroupItem`；自定义标签节点用 `renderTag={(tag, index) => JSX.Element}`，对应 Vue 的 `#tag` 插槽。`renderTag` 只为显示的标签调用，超出 `maxTagCount` 的标签在 +N 弹层打开时才创建；`maxTagCount` 变化时跨过折叠边界的项重新调用 `renderTag`。
- Svelte：Tag 的内容与图标用 `children`、`prefixIcon`、`suffixIcon` snippet；`visible` 可绑定，函数绑定的 setter 可以拒绝关闭；`onClose(event, tagKey)` 去掉 children 参数；`tabIndex` 改为 `tabindex`；点击、键盘、悬停用原生小写属性 `onclick`、`onkeydown`、`onmouseenter`；aria-label 与省略样式在挂载后读 DOM 判断，服务端首帧没有 aria-label。
- Svelte 破坏性：TagGroup 删除 `mode`，`tagList` 只收数据 `TagGroupItem[]`（`children` 为 `string | number`）；自定义标签用 `tag` snippet（参数 `{ tag, index }`，`index` 在可见区与弹层里连续计数）；`onTagClose(event, tagKey)`、`onPlusNMouseEnter(event)`；数据项自己的 `onClose` 与分组的 `onTagClose` 都会触发；`+N` 的 Tag 自己是 Popover 触发器，不额外包 span；`popoverProps` 可覆盖 Popover 的默认值，但 `child` 与 `content` 由 TagGroup 固定。

### Sidebar

- 破坏性（类型）：Props 删除无效的 `onChange`（选项切换走 `onActiveOptionChange`）；`DetailContent` 不再接受 `editable`、`imgUploadProps`、`onContentChange`（改用 Sidebar 的 `fileEditable`、`imgUploadProps`、`onFileContentChange`）；MCPConfigure 选项的 `value` 改为必填；`AnnotationItem` 的 `onClick` 参数改为 `React.MouseEvent<HTMLAnchorElement>`。
- 破坏性：上传位 HTML 不再带 `accept`、`limit` 等属性，状态类名 `.uploading` 等改为 `.semi-sidebar-file-image-slot-<status>`；Annotation 条目改为 `<a href={url} target="_blank">`，不再调用 `window.open`；`getUploadImageSrc` 收到上传响应而非 props 对象。
- 破坏性：文件编辑器菜单栏的代码块按钮与其他按钮一样只显示图标（`IconTerminal`），不再显示文字「CB」，删除其专用类名 `.semi-sidebar-file-menu-bar-btn-codeblock`。
- Vue：回调改为事件（如 Sidebar 的 `cancel`、`activeOptionChange`，Annotation 的 `change`、`click`，CodeContent、FileContent 的 `expand`，MCPConfigure 的 `statusChange`），支持 `v-model:visible`、`v-model:activeKey`、`v-model:options`；未绑定 `expand` 监听时不渲染展开按钮。
- Vue：渲染函数与节点属性为插槽（如 Sidebar 的 `#title`、`#optionIcon`、`#optionItem`、`#mainContent`、`#detailContent`，MCPConfigure 的 `#icon`、`#desc`、`#item`）；数据只收字符串；ref 类型为 `SidebarContainerHandle`。
- Solid：节点属性与渲染函数的返回值为 `JSX.Element`；类名字段写作 `class`（包括 `imgUploadProps`、`jsonViewerProps`、`codeHighlightProps` 中的）；回调收到原生 `MouseEvent`、`KeyboardEvent`；`ref`、`containerRef` 是回调，每次显示时交出新建的 `.semi-sidebar-container` div，隐藏时不回调 `null`；`imgUploadProps.action` 可省略，只传 `customRequest` 也显示图片按钮。
- Solid：Sidebar 在 `mode` 或 `detailContent.key` 变化时重新挂载详情，单独使用的 FileItem 只在创建编辑器时读取 `extensions`、`imgUploadProps`，换新值需由使用方重新挂载；CodeContent、FileContent、Annotation 与主模式选项按项对象识别各项，`codes`、`files`、`info`、`options` 换成新对象时对应面板（含编辑器）重新挂载；MCPConfigure 按位置复用选项行，`renderItem` 在选项对象或模式变化时重新调用。
- Solid 破坏性：数据只放数据（同 Vue）。`SideBarOption` 删除 `icon`，`name` 改为 `string`，按钮图标由 Sidebar 的 `renderOptionIcon(option)` 提供（对应 Vue 的 `#optionIcon`）；`MCPConfigureOption` 的 `icon` 改为图片地址 `string`、`desc` 改为 `string`，其他内容由 MCPConfigure 的 `renderIcon({ option, custom })`、`renderDesc({ option, custom })` 提供（对应 Vue 的 `#icon`、`#desc`），传 `renderIcon` 时不再按 `icon` 渲染图片；`desc` 为字符串后内置过滤会匹配它；`AnnotationInfo.header` 改为 `string`，分组标题由 AnnotationContent 的 `renderHeader(info)` 提供，Annotation 上同一属性叫 `renderInfoHeader(info)`（`renderHeader` 是容器头部，对应 Vue 的 `#infoHeader`）。
- Svelte：回调为 `on*` 属性（Sidebar 的 `onActiveOptionChange`、`onBackWard`，Container 的 `onCancel`、`afterVisibleChange`，Annotation 的 `onChange`、`onClick`，CodeContent、FileContent 的 `onExpand`，MCPConfigure 的 `onStatusChange`）；`visible`、`activeKey`（Sidebar 为 string，Annotation 为 string 或 string[]）、`options`、`customOptions` 可绑定；未传 `onExpand` 时不渲染展开按钮。
- Svelte：渲染函数与节点属性为 snippet（Sidebar 的 `optionIcon`、`optionItem`、`mainContent`、`detailHeader`、`detailBody`，MCPConfigure 的 `icon`、`desc`、`item`，Container 的 `title`、`header`），传了就整体替换默认内容，空 snippet 不回落默认渲染；详情内容 snippet 叫 `detailBody`（`detailContent` 已是数据属性），Annotation 的分组头 snippet 叫 `infoHeader`；`bind:this` 实例的 `getRoot()` 取根元素，隐藏时为 null。
- Svelte：`mode` 或 `detailContent.key` 变化时重新挂载详情；单独使用的 FileItem 只在创建编辑器时读取 `extensions`、`imgUploadProps`，换新值需重新挂载（同 Solid），`content` 只在值变化时同步到编辑器，值不变的重新传入不会重置用户的编辑（同 Vue）。
- Svelte：Sidebar 上传的 `onintroend`、`onoutroend` 与组件自身的动画结束处理同时执行。
- Svelte：文件编辑器不注入 tiptap 的样式，ProseMirror 基础规则与 gapcursor 规则写在 `sidebar.scss` 的 `@layer semi` 里，光标落在两个块之间时可见。
- Solid：隐藏的 Sidebar 不调用 `renderHeader` 与详情的渲染函数，显示时才调用。
- 破坏性（深路径导入，类型）：foundation 的 `MCPOption.icon`、`desc` 由 `any` 改为 `unknown`；`MCPConfigureContentFoundation`、它的 adapter 与 props 类型增加选项类型参数，各框架传入自己收窄后的选项类型。
- Svelte 破坏性（类型）：`mainContent` snippet 的参数类型 `SideBarMainContentSnippetProps.activeKey` 改为可选属性 `activeKey?: string`。

### Lottie

- 破坏性：默认的 SVG 渲染器改用 lottie-web 的 light 构建（只含 SVG 渲染器、不执行表达式，不需要 CSP `unsafe-eval`）；`params.renderer` 为 `canvas` 或 `html` 时加载完整版。用了表达式的动画在默认渲染器下表达式失效，需要时把 `params.renderer` 设为 `canvas`；开发环境下 `animationData` 含表达式会告警（`params.path` 加载的数据不检查）。`Lottie.getLottie(renderer?)` 新增可选参数，`canvas`、`html` 返回完整版，其余返回 light 版；`getLottie` 回调拿到的对象随渲染器而定，类型不变。
- 破坏性：`Lottie.getLottie()` 改为异步，返回解析为 lottie-web 的 `Promise`；lottie-web 按需导入，`getLottie`、`getAnimationInstance` 回调在其加载完成后调用；系统开启「减少动态效果」时不自动播放（显式传 `params.autoplay` 则以其为准）。
- Vue：回调改为 `getAnimationInstance`、`getLottie` 事件；`params` 整体替换才重载，原地修改不重载，大 JSON 用 `shallowRef` 或 `markRaw`；`params.container` 存在时只渲染注释节点。
- Solid：`params` 深比较后才重新加载，`class`、`style`、`width`、`height` 变化不重载；`params.container` 存在时不渲染任何节点；使用方的 `aria-hidden`、`role` 覆盖默认的装饰性与 image 语义。
- Svelte：`getAnimationInstance`、`getLottie` 为函数 prop；`params` 内容变化即重载（原地修改 `$state` 也会），交给 lottie-web 前做快照；使用方的 `aria-hidden`、`role` 覆盖默认值。

### Anchor

- 破坏性：根元素不再自动生成 `id="semi-anchor-xxx"`，改用 `.semi-anchor` 选择；滑轨与链接列表包在新容器 `.semi-anchor-rail-wrapper` 中，`.semi-anchor` 不再是 `position: relative`；`LinkProps` 删除无效的 `level`、`direction`；`onClick` 事件参数改为 `React.MouseEvent | React.KeyboardEvent`；删除 `strings.POSITION_SET`，改用 Tooltip 的 `POSITION_SET`。
- Link 只响应 Enter 激活；以 `#` 开头的 `href` 按元素 id 查找而非 CSS 选择器；当前链接带 `aria-current="location"`（原 `aria-details="active"`）；新增 `scrollIntoViewOptions`；无激活链接时 `onChange` 收到 `''`（原 `undefined`）；`defaultAnchor` 只在首次挂载时应用，React `<Activity>` 重新显示时不再跳回它。
- `autoCollapse` 下一次滚动跳进未展开的分支时，分支展开后再选一次高亮，落到其中的子链接，不停在父项（React、Vue、Solid；Svelte 本来如此）。React、Vue：Link 经 context 登记所在的父链接，经其他组件渲染的 Link（含 Anchor 的直接子组件渲染出的整组链接）同样让父项保持展开；React 的 `defaultAnchor` 指向这类 Link 下直接嵌套的折叠子项时也能展开。
- Vue：`onChange`、`onClick` 改为 `change`、`click` 事件（`click` 只在激活链接时触发）；Link 节点标题用 `#title` 插槽。
- Solid：`Anchor.Link` 须是 Anchor 或 Anchor.Link 的直接 JSX 子节点（可经 Fragment、Show、For），写在 Anchor 外不渲染；`getContainer` 只在挂载时与其读取的 signal 变化时求值，容器晚于挂载出现时让它读取一个随容器出现而变化的 signal。
- Svelte 破坏性：不提供 `Anchor.Link`，链接用数据 prop `links`（`{ href?, title?, disabled?, children? }[]`，`children` 嵌套），自定义标题用 `title` snippet（参数 `{ item, level }`）；服务端首帧带全部链接，`autoCollapse` 的折叠首帧即正确；`onChange`、`onClick` 是函数 prop，`onClick` 只在激活链接时触发；没有子链接的项不输出空的 `role="list"`。
- Svelte：`getContainer` 只在挂载时以及它读取的 `$state` 变化时重新求值；容器晚于挂载出现时，让它读取一个随容器出现而变化的 `$state`（同 Solid）。

### Breadcrumb

- 破坏性：删除 `Breadcrumb.Item.isBreadcrumbItem`，改为声明 `elementType: 'Breadcrumb.Item'`；`onClick` 第一个参数类型改为 `BreadcrumbItemInfo | RouteProps`，children 写法下 `name` 是 `ReactNode`。
- `maxItemCount` 小于 2 时首项与当前项仍显示；`activeIndex` 指向折叠区间内的项时，当前项保持可见，改为隐藏其前后较长的一段；没有 `href` 的项仅在有 `onClick` 时可聚焦；非 `Breadcrumb.Item` 的子节点各包一层 `li` 后渲染。
- 破坏性：DOM 改为 APG 的 `nav > ol.semi-breadcrumb-list > li`，读屏报出项数。Breadcrumb.Item 的根元素与未声明属性的落点由 `span` 改为 `li`（React 的 `ref` 类型为 `HTMLLIElement`，Props 的原生属性随之按 `li` 声明）；`moreType="popover"` 弹层里的隐藏项包在 `ol` 中，分隔符是带 `aria-hidden` 的 `li`；React `renderMore`、Vue `#more` 收到的项节点是 `li`，自行渲染时放进 `ol` 或 `ul`。按 `.semi-breadcrumb-wrapper > .semi-breadcrumb-item-wrap` 写的选择器改为经过 `.semi-breadcrumb-list`。
- Vue：`separator` 为字符串属性，节点用 `#separator` 插槽，Item 的 `icon` 改 `#icon`；routes 写法的 `renderItem` 改 `#item="{ route, index }"`，`renderMore` 改 `#more="{ restItems }"`，`routes[].onClick` 不支持，用 Breadcrumb 的 `@click`。
- 修复（React）：非 `Breadcrumb.Item` 的子元素才触发开发期告警；此前写反，合法的 `Breadcrumb.Item` 误报，`<div />` 等不报。
- Solid：Breadcrumb.Item 写在 Breadcrumb 外不渲染，包装 Item 的组件也算项；其他 Semi 组件作子节点时丢弃并在开发期告警；原生元素与文本子节点始终显示，不计入 `maxItemCount` 与 `activeIndex` 的项序号，也不进入折叠区间，服务端渲染后 hydration 不再错位。`routes` 换成新数组时所有项重新挂载；`separator` 传同一个节点变量时只显示在一处，需直接写 JSX。
- Solid 破坏性：路由数据里不放节点。`RouteProps` 删除 `icon`，`name`、`separator` 改为 `string`；路由图标由 Breadcrumb 的 `renderIcon(route, index)` 提供（对应 Vue 的 `#icon="{ route, index }"`），自定义标题仍用 `renderItem(route)`；`Breadcrumb.Item` 的 `icon` 不变。
- Solid 破坏性：`renderMore` 收到被折叠项的数据 `Array<RouteProps | BreadcrumbItemProps>`（routes 写法为路由对象，children 写法为各 `Breadcrumb.Item` 的 props，其 `children`、`icon` 在显示处读取才创建），不再收到现成节点，由使用方渲染；隐藏项变化时重新调用。
- Svelte：只提供 `routes` 加 `item`、`icon`、`separator`、`more` snippet，不提供 `Breadcrumb.Item` 子组件；`separator` 是字符串或 snippet；`icon` snippet 的参数带 `size`、`class`，要由使用方传给图标；`more` snippet 收到 `restItems`（`{ route, index }` 数据）；`item` snippet 的内容按内联渲染，不走截断的 Typography。
- React、Solid 破坏性（类型）：`showTooltip` 对象形式的类型 `showToolTipProps` 改名 `ShowTooltipProps`。

### Tabs

- 破坏性（主题 token）：`$radius-tabs_tab_card_left` 由四值圆角改为单个半径值，使用处按逻辑角赋值；左侧卡片式页签的圆角在 RTL 下镜像，LTR 不变。
- 破坏性：删除 `TabPane.isTabPane`，改为声明 `elementType: 'Tabs.TabPane'`；删除 `TabBarProps.closable`；`activeKey` 类型加入 `null`；`onTabClick` 事件参数为 `MouseEvent | KeyboardEvent`；非受控 Tabs 的当前 key 不在新列表中时回落到第一个启用的页签；children 写法只把 `TabPane` 当页签。
- `activeKey={null}` 是受控空值（不选中任何页签），`undefined` 按非受控；`role="tablist"` 移到只含 Tab 的 `.semi-tabs-bar-tablist`；`Tabs.TabItem` 透传的 `role`、`tabIndex`、`aria-*` 不再覆盖组件值；tab 与 panel 的 `id` 对 `itemKey` 做 URL 编码；新增语言包键 `Tabs.prevTabs`、`Tabs.nextTabs`。
- 没有选中页签（`activeKey` 为 `null` 或不命中任何页签）时，tablist 中第一个启用的页签作为 Tab 停靠点；按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不再移动焦点或选中页签；选中的页签收进「更多」菜单时，其 `id` 落在 tablist 外的 `hidden` 元素上，面板仍以该页签的标题命名。
- `collapsible` 把选中的页签滚进可见区域时只滚动标签栏，不再滚动页面（原来首次出现或切换选中项时，若页面已滚离 Tabs，会被拉回 Tabs 所在位置）；Firefox 与 Safari 中标签栏不在视口内时直接滚到位，不播放平滑滚动。
- 可关闭页签按 Backspace 或 Delete 关闭时阻止按键的默认行为，Safari 不再因此后退页面。
- 面板滑动动画：页面取消动画（`animation: none`）时立即结束（React 原来停在动画类上）；同一元素有多个动画时等最后一个结束（Solid、Svelte 原来在第一个 `animationend` 就结束）。
- 折叠模式点击箭头不再修改 `renderArrow`（Vue `#arrow`）收到的 `items` 数组，惰性渲染的下拉菜单不再少项。
- 键盘导航（方向键、Home、End、Delete）在最近的 `role="tablist"` 内查找全部页签，不再要求页签共享同一个父节点，页签被额外包裹（折叠模式的 OverflowList、自定义标签栏）时仍能移动；自定义 `renderTabBar`（Vue `#tabBar`、Svelte `tabBar`）须在页签外层渲染 `role="tablist"` 元素，否则按键时报错。
- Vue：页签写成 `<TabPane>` 子节点，标题用 `#tab`、`#icon`；`tabBarExtraContent`、`renderTabBar`、`renderArrow`、`more.render` 改为 `#tabBarExtraContent`、`#tabBar`、`#arrow`、`#more`；`v-model:activeKey`，事件 `change`、`tabClick`、`tabClose`、`visibleTabsChange`。
- Solid：TabPane 没有 `elementType`，Tabs 按 TabPane 返回的数据识别页签，只渲染 TabPane 的包装组件也算页签（React、Vue 不算）；放在 Tabs 外的 TabPane 单独写时不渲染，在数组中显示为 "[object Object]"；`tabList` 模式下 children 中的 TabPane 不渲染。
- Solid：动态页签用 `<For>` 或 `<Index>`，直接 `.map()` 每次更新都重建全部面板；`renderTabBar` 对同一个函数只调用一次，传入的 props 是活对象，在返回的 JSX 中读取字段才会随状态更新。
- Solid：新增面板并同时选中时，在同一个 `batch` 中更新面板与 `activeKey` 才不播放滑入动画；夹在 Tabs 与 TabPane 之间的 Provider 到不了面板内容。
- Solid 破坏性（类型）：`tabList` 的数据项只放数据，`PlainTab.tab` 收窄为 `string | number`，删除 `PlainTab.icon`（`OverflowItem` 随之没有 `icon`）；节点形式的标签与图标用 Tabs 的 `renderTab(item, index)`、`renderIcon(item, index)`（类型 `TabRender`，同 Vue 的 `#tab`、`#icon`），在页签、「更多」菜单项与面板名称处各调用一次，数据相同的新对象不重新调用，标签内的节点与焦点保留；`renderArrow` 的 `defaultNode` 改为 `() => JSX.Element`，在插入处调用 `defaultNode()`。TabPane 写法下 `renderTabBar` 的 `tabBarProps.list` 与 `renderArrow` 的 `items` 是普通数据，只含 `itemKey`、`disabled`、`closable`，不带 `tab`，需要标签文本时用 `tabList`。
- Solid：`collapsible="auto"` 只在页签增删或重排时重新检测溢出，改字符串标题不触发；`renderArrow` 收到的 `items` 对象跨渲染复用。
- Solid 破坏性：`more.render` 改为接收 `getTriggerProps`，使用方把 `getTriggerProps()` 展开到自己的触发元素上（同 Dropdown 的函数 children），返回值不再包在可聚焦的 `span` 中。
- Svelte：`Tabs` 用 `tabList` 数据属性加 snippet 描述标签和面板，不提供公开的 `TabPane`；snippet 为 `panel`、`tab`、`icon`、`tabBarExtraContent`、`tabBar`、`arrow`、`moreTrigger`、`moreContent`，没有 `panel` 时 `children` 是单一面板。
- Svelte：`activeKey` 可绑定，支持 `bind:`、函数绑定、单向传值和不传四种写法，单向传值时点击在本地覆盖，父级再推新值时以父级为准。
- Svelte：`TabItem` 可用在自定义 `tabBar` 中，通过 context 控制所在 `Tabs`，在 `Tabs` 外单独使用时不输出悬空的 `id` 和 `aria-controls`；`aria-label` 和 `aria-labelledby` 落在 tablist 上，其余未声明属性落在根元素。
- Svelte：折叠模式下 tablist 就是 OverflowList 的滚动容器，箭头在 tablist 之外，方向键、Home、End 在整个 tablist 内移动；被收进「更多」菜单的标签在 DOM 里保留隐藏的 `id` 元素，面板的 `aria-labelledby` 仍然有效。

### UserGuide、Portal

- `StepItem.mask`、`className` 生效；步骤的 `theme` 优先于全局；`nextButtonProps`、`prevButtonProps` 的 `onClick` 先调用使用方的再执行内置处理（原为替换）；`target` 允许 `null`；popup 卡片在 top layer，不接收 `getPopupContainer`、`zIndex`。
- 滚动锁只在 popup 模式且当前步骤显示遮罩时加锁（`mask` 为 false 不再锁页面）；Esc 等同「跳过」。
- popup 模式切换到 `target` 解析为 null 的步骤时，开发环境 `console.warn` 一次（该步骤在目标出现前不显示）。
- Vue：回调改为 `change`、`next`、`prev`、`skip`、`finish` 事件，新增 `v-model:current`、`v-model:visible`；`steps` 只放数据，自定义内容用 `#title`、`#description`、`#cover`，按钮文字用 `#nextText`、`#prevText`。
- Solid：步骤的类名字段为 `class`；破坏性：`steps` 只放数据，`title`、`description` 为字符串，没有 `cover`，自定义内容用 `renderTitle`、`renderDescription`、`renderCover`，参数为 `{ item, index }`（`UserGuideStepRenderProps`），只为当前步骤调用，标题与描述渲染为空时回落到字符串，封面渲染为空时没有封面区域；UserGuide 无根 DOM，丢弃未声明属性（F11）；popup 卡片的初始聚焦不带 `preventScroll`。
- React：Portal 在服务端渲染与 hydration 期间不输出容器与内容，默认打开的 Modal、SideSheet、ImagePreview、Feedback、UserGuide 在 hydration 后的下一次提交中打开（原在服务端抛 `document is not defined`）；纯客户端渲染仍在首个提交内创建容器。
- Svelte：UserGuide 的 `visible`、`current` 可绑定（`bind:`、函数绑定、单向、不传四种写法）；回调是 `onChange`、`onNext`、`onPrev`、`onSkip`、`onFinish`；跳过、Escape、完成时先把 `visible` 写成 `false` 再调回调，`current` 变化先写回再调 `onChange`；单向传 `visible` 只作初值，点跳过会在本地关闭，要拒绝关闭请用函数绑定。
- Svelte：`steps` 的 `title`、`description` 是字符串或 snippet，`cover` 是 snippet（参数 `{ item, index }`），没有 `cover` 的步骤没有封面区；按钮文字用组件级 `nextText`、`prevText` snippet，最后一步用 `finishText`。
- Svelte：未绑定、未传 `current` 时关闭后重开从第一步开始，`current` 由父级传入时保持关闭前的步骤；没有 KeepAlive 对应物，不提供失活后释放滚动锁的行为；服务端和 hydration 首帧不输出内容（popup 要等目标挂载后测量，modal 经 Portal 挂载后才渲染）。
- 引导隐藏结束后 `current` 回到受控值，未受控时回到第一步。
- 显示期间逐帧跟随目标位置，目标自行移动或晚于显示挂载时聚光区域随之更新。

### OverflowList、Select

- TreeSelect 关闭时清空搜索值、开启 `insetInput` 的 DatePicker 关闭时恢复触发框可用，改在离场动画结束后执行。
- 破坏性：`Select.Option`、`Select.OptGroup` 改用静态 `elementType` 识别，删除 `isSelectOption`、`isSelectOptionGroup`；不再读取未声明的 `open`，改用 `defaultOpen`；删除 `getPopupContainer`、`zIndex`、`dropdownMargin`、`rePosKey`、`selectMethod`。
- 破坏性（类型）：`SelectProps`、`Select` 新增泛型参数 `Multiple`，`onChange` 与 `renderSelectedItem` 按 `multiple` 收窄，显式写 `Select<T>` 又传 `multiple` 的改为 `Select<T, true>`；`onSelect`、`onDeselect` 的 value 为选项原始值；`onBlur` 参数为 `React.FocusEvent<HTMLElement> | MouseEvent`。
- 破坏性（类型）：Select 删除 `mouseEnterDelay`、`mouseLeaveDelay`、`TriggerRenderProps.onChange`（改用 `onSearch`），`searchPosition` 收窄为 `'trigger' | 'dropdown'`，`virtualize.itemSize` 必填；`OverflowListProps` 不再包含 `children`，改为泛型 `<T>`，scroll 模式 `overflowRenderer` 为 `(overflowItems: [T[], T[]]) => [ReactNode, ReactNode]`。
- 破坏性（DOM 结构）：带 label 的 OptGroup 的选项包在 `div.semi-select-group-wrapper` 内，依赖选项与标题同级的自定义样式（如分隔线选择器）需调整。
- 可搜索的 Select、TreeSelect、Cascader 改为 ARIA 1.2 combobox，按 `textbox` 查询触发器内搜索框的测试改为 `combobox`。删除语言包键 `Select.selected`、`Select.createItem`，新增 `Select.clear`；`renderOptionItem` 参数新增 `id`，需写在 `role="option"` 外层元素上。
- 行为：`onFocus`、`onBlur` 成对触发，焦点在触发器内部移动不触发；点击外部关闭下拉时焦点留在被点击处；键盘按 APG select-only combobox 处理；已选项按 `value` 而非 `label` 识别；回调收到的选项对象不再带内部字段；`dropdownMatchSelectWidth` 跟随触发器的当前宽度，打开期间触发器变宽下拉也随之变宽。OverflowList 新增 `wrapperProps`。
- 破坏性：选项对象上不再挂 `_show`、`_selected`、`_scrollIndex`、`_parentGroup`、`_keyInJsx`、`_inputCreateOnly`、`_notExist`，这些状态由 foundation 内部的选项记录保存。`renderOptionItem`、`renderSelectedItem`、`filter`、`onChange`（`onChangeWithObject`）、`onSelect`、`onDeselect`、`onCreate`、`onExceed` 与 `triggerRender` 的 `value` 收到的都是用户传入的选项对象本身（同一引用，不再是拷贝），Vue、Svelte 的对应插槽与 snippet 相同。破坏性（类型）：React 的 `SelectedItemProps` 删除 `_show`、`_selected`、`_scrollIndex`，Solid 的 `SelectedItemProps` 等同于 `OptionProps`。
- OverflowList 按项与容器的小数宽度判断溢出：原来按取整后的宽度，Safari 等按小数宽度排版文字时，恰好放得下的项也被折叠，Select `ellipsisTrigger` 少显示标签、`+N` 偏大。
- React：Select 的触发器只在弹层打开时设置 `aria-controls`，关闭时不再指向未渲染的 listbox。
- Vue：Select 用 `v-model`（`modelValue`），`autoFocus` 写作 `autofocus`，`SelectOptionGroupProps` 改名 `SelectOptGroupProps`，`prefix`、`suffix`、`insetLabel`、`emptyContent`、`arrowIcon` 等为同名插槽，render 函数对应 `#optionItem`、`#createItem`、`#selectedItem`、`#tag`、`#trigger`，回调为同名事件（`change`、`select`、`dropdownVisibleChange`、`listScroll` 等）；OverflowList 为 `#item="{ item, index }"`、`#overflow="{ items, position }"` 与 `overflow`、`intersect`、`visibleStateChange` 事件。
- Vue：布尔属性 `onChangeWithObject`（Select、Tree、TreeSelect、Cascader）、`onSelectWithObject`（AutoComplete）改名为 `changeWithObject`、`selectWithObject`，Vue 把 `on` 开头的无值属性当作监听器，服务端渲染时会丢掉，客户端经 attrs 透传时同样会丢；Transfer 的 `treeProps` 不接受 `changeWithObject`。
- Solid：OverflowList 的 scroll 模式观察 `visibleItemRenderer` 返回的元素本身，并在其上写入 `data-scrollkey`（React 克隆元素加属性），只接受 HTML 元素作为项的根，返回文本、null 或 SVG 的项被跳过；`key` 重复的项只渲染一个。
- Solid：Select 的 `ref` 是触发器根元素（外层 Tooltip 以它为锚点），元素上另带 `SelectHandle` 的 `open`、`close`、`clearInput`、`selectAll`、`deselectAll`、`search`、`rePosition`，类型为 `SelectElement`；`focus()` 只聚焦 combobox（搜索框在触发器内时为该搜索框），可搜索时也不展开下拉。`autoFocus` 写作 `autofocus`；`onFocus`、`onBlur` 收到原生 `FocusEvent`（点击外部关闭时为 `MouseEvent`）。
- Solid：`Select.Option`、`Select.OptGroup` 是只携带数据的 token，不渲染自身。破坏性（类型）：`Select.Option`、`optionList` 条目与 `Select.OptGroup` 的 `label` 收窄为 `string | number`，`renderOptionItem` 参数的 `label` 同为文本。`label` 是选项的文本，用于搜索、高亮与回调；`Select.Option` 的 `children` 只作为下拉行与回显的内容（可以是任意 JSX），不再充当 label：只写 children 的选项按 `value` 搜索，回调收到的 `label` 为 `value`，需要按文本搜索时同时写 `label`（`<Select.Option value="a" label="抖音" />`）。分组标题只接受文本。`renderOptionItem` 每行只调用一次，参数是响应式对象（`focused`、`selected` 等随状态更新，在 JSX 之外解构只得到初始值）。
- Svelte：OverflowList 的 `item`、`overflow` 是 snippet，参数为 `{ item, index }` 与 `{ items, position }`；`onOverflow`、`onIntersect`、`onVisibleStateChange` 是回调 prop；`wrapperStyle` 是字符串。
- Svelte：scroll 模式把每项包在 `display: contents` 的 span 里，在 snippet 渲染出的第一个元素上写 `data-scrollkey` 并观察它，项的 snippet 必须输出元素，否则该项被跳过；collapse 模式只在有溢出项且传了 `overflow` snippet 时渲染 overflow 盒子。
- Svelte：Select 的选项只来自 `optionList`，不提供 `Select.Option`、`Select.OptGroup`；`value` 可绑定，配 `onChange`；回调与 React 同名（`onChangeWithObject`、`onDropdownVisibleChange`、`onListScroll`、`onSearch`、`onSelect`、`onDeselect`、`onExceed`、`onCreate`、`onClear`、`onFocus`、`onBlur`）；`autoFocus` 写作 `autofocus`；保留 `defaultOpen`、`defaultActiveFirstOption`（没有受控的 `open`）。
- Svelte：`optionList` 条目用 `group: { key, label }` 分组，同组条目须相邻；分组渲染为 `role="group"`（`aria-labelledby` 指向组标题），搜索时没有可见选项的分组整组隐藏，搜索词命中组标题时显示整组；`groupLabel` snippet（参数 `{ group }`）定制组标题。`optionLabel` snippet（参数 `{ option }`）只替换选项行内的文字，选中图标、`role="option"` 与键盘行为不变，内容里不高亮搜索关键字。开启 `virtualize` 时不渲染组标题与 `role="group"`，选项平铺（同其他框架）。
- Svelte：`prefix`、`suffix`、`insetLabel`、`arrowIcon`、`clearIcon`、`emptyContent`、四个面板插槽，以及 `optionItem`、`createItem`、`selectedItem`、`tag`、`trigger` 都是 snippet；`emptyContent={null}` 隐藏空状态，空 snippet 无法识别，隐藏箭头只能用 `showArrow={false}`；`optionItem` 参数的事件名是 `onclick`、`onmouseenter`，可直接展开到元素上；`trigger` 参数没有 `componentProps`。
- Svelte：`dropdownStyle` 与选项的 `style` 是字符串；按键先由 Select 处理再调用根元素上的 `onkeydown`，`onclick`、`onfocusin`、`onfocusout` 同样先处理再调用，鼠标移入移出用根元素原生的 `onmouseenter`、`onmouseleave`；不支持泛型 `T` 与 `Multiple`，`onChange` 参数类型是 `SelectValue`；对外方法 `open`、`close`、`focus`、`clearInput`、`selectAll`、`deselectAll`、`search`、`rePosition` 经 `bind:this` 调用。
- Vue：模板里不带值的 `multiple` 按多选处理。
- `ellipsisTrigger` 加 `maxTagCount` 时，新增选项后的 `+N` 计入宽度造成的隐藏项。React：多选 Tag 的根元素不再带 `disabled` 属性。
- 多选时焦点从触发器移入 `+N` 浮层不再触发一对 `onBlur`、`onFocus`，焦点离开触发器与浮层后才触发 `onBlur`。`allowCreate` 宽度受限时「创建」提示保持宽度，换行的是输入的文本。
- 组件内部的控件不再读对应组件的全局默认值（F7）：TreeSelect、Cascader 触发器里的 TagInput 不会被加上清除按钮、前后缀、拖拽或失焦建标签；Pagination 的每页条数 Select 与 ColorPicker 的格式 Select 不会变成可搜索、可创建、多选或以对象回调，也不会被加上清除按钮与前后缀。
- Vue、Solid：回调与插槽参数里的选项对象不再带框架层的 `_slot`（Vue 的分组标题不再带 `_labelSlot`）。已选项的插槽内容按 `value` 从当前选项中取，已选项不在当前选项里（远程搜索换了 `optionList`）时显示它的 `label`。
- Solid：破坏性（类型）：`OptionGroupProps` 去掉索引签名，改为组标题 `div` 的原生属性。`inputProps` 里的 JSX（如 Input 的 `prefix`）只在输入框渲染时创建一次，不再每次读取都新建节点。
- React 破坏性（类型）：`select` 深路径导出的 `optionRenderProps` 改名 `OptionRenderProps`、`virtualListProps` 改名 `VirtualizeProps`；包根的 `SelectOptionRenderProps` 不变。

### Form

- 破坏性：React、Solid、Svelte 的 `Form` 不再挂静态成员（`Form.Input` 等字段、`Form.Section`、`Form.Label`、`Form.ErrorMessage`、`Form.Slot`、`Form.InputGroup`、`Form.useForm`、`Form.SchemaField`），改用具名导出：字段 `FormInput` 至 `FormPinCode`，部件 `FormSection`、`FormLabel`、`FormErrorMessage`、`FormSlot`、`FormInputGroup`，以及 `useForm`、`SchemaField`；四个框架的导出一致（F17）。新增类型导出 `FormErrorMessageProps`。字段自身的子组件不变，仍写 `FormSelect.Option`。
- 破坏性：删除字段属性 `validate`（只认 `validator`）与 Form 级 `validateFields`；`<form>` 默认带 `noValidate`，传 `noValidate={false}` 恢复浏览器原生校验。
- 破坏性：`onErrorChange` 在 validate、submit、表单级 validator 失败与转为通过、reset 时各触发一次，字段注册、keepState 恢复、ArrayField 增删行不再单独触发。
- 破坏性：表单状态改为不可变更新，每次变化 `onChange`、`useFormState`、render props 拿到新对象；读最新值用 `formApi.getValue(s)()` 或 Field `onChange` 的 `latestValues`。
- 破坏性：未传 `id` 的字段，控件 DOM id 由 `useId` 生成，依赖 `#<field>` 或 `htmlFor` 字面值的代码需显式传 `id`；Form 的 ref 为 `FormHandle { formApi }`，实例上的 `submit`、`reset`、`foundation` 不再存在。
- 破坏性（类型）：`withField` 返回 `ComponentType<FieldProps<ComponentProps<C>>>`，删除 `T`、`R` 类型参数与 `maintainCursor`；字段不再接受 `value`、`defaultValue`、`checked`、`defaultChecked`，改用 `initValue`；`trigger` 收窄为 `FieldValidateTriggerType`；`ArrayField` 的 `field`、`children` 必填。
- 破坏性：`useForm()` 等返回的 formApi 上不再有 `__bind`、`__unbind`、`__updateState`、`__realApi`；破坏性（类型）：Vue、Solid、Svelte 的 `form` 属性类型由 `FormApi<Values> & FormApiProxyInternals<Values>` 改为 `FormApi<Values>`。
- 破坏性（类型）：`FormState.errors`、`touched` 与 `onErrorChange` 的 `errors` 改为与值同构的嵌套结构；`FieldPath` 展开深度上限为 5；删除只作类型用的 `Field` 类与 `FormSelectType` 等，改用 `FieldProps<P>`、`FormSelectProps<T, Multiple>`（`FormSelect` 现为字段组件的具名导出）。
- 表单级 `validator` 返回或 resolve `{}` 视为通过；Form 卸载或整表 `reset()` 时挂起的 `validate()` 以取消原因 reject；静默校验不再写入 `formState.errors`；`labelPosition="inset"` 下无法内嵌标签的字段（TextArea、Checkbox、Radio、Switch、Upload 等）按 `top` 布局渲染 Label 并在开发模式警告；FormInputGroup 的 `label` 接受 `LabelProps | ReactNode`。
- 表单值深拷贝时 `Blob`、`File` 按引用保留，不再复制（`File` 不可变，按引用与深拷贝语义相同）。
- React：`FormLabel`、`FormErrorMessage`、`FormSection` 各自导入表单样式，在 Form 之外单独使用（含 `InputGroup` 的标签）时样式照常生效，与 Vue、Solid、Svelte 一致。
- 新增 Form 属性 `schema`，接受实现了 Standard Schema 的校验对象（Zod、Valibot、ArkType 等），与字段的 `validator`、`rules` 互斥，设置后它们不再运行，开发模式下警告；校验全部字段通过后，提交回调与 `formApi.validate()` 拿到 schema 的输出；与 Form 的 `validator` 同传时类型报错，绕过类型时开发模式警告，并且只用 `validator`。Semi 不依赖这些校验库。有 `schema` 时，必填星号与 `aria-required` 只由 `label.required` 决定，不再读 `rules`。
- 新增 Form 属性 `schemaDebounce`（毫秒，默认 0）：值变化触发的 schema 校验等输入停顿后再执行一次；submit、`validate()`、blur 与挂载时的校验立即执行，整表 `reset()` 与 Form 卸载取消等待中的校验。
- 破坏性：错误一律为字符串数组（`FieldError = string[]`）：`formState.errors` 的叶子、`formApi.getError`、`onErrorChange`、`onSubmitFail`、`validate()` 的 rejection 与 ErrorMessage 的 `error` 都是 `string[]`，不再支持 ReactNode 与布尔错误，多条消息用 `, ` 连接显示。字段 `validator`、规则的 `validator` 与 `formApi.setError` 接受 `string | string[]`：空串、空数组、`undefined`、`null` 视为通过，字符串转为单元素数组，`['']` 表示失败但不显示文本。表单级 `validator` 返回与值同构的错误树，叶子为 `string | string[]`，空串叶子丢弃；`setError` 给父路径传对象或数组时按同样规则归一化。数组路径上的错误：全为字符串的数组是该路径自身的错误叶子，各行的错误写成嵌套数组（`{ items: [['第 1 行错误']] }`）或对象。
- 破坏性：删除 `async-validator` 依赖，字段 `rules` 由 Semi 自带的规则引擎执行，`RuleItem` 为 Semi 自己的类型（`required`、`type`、`len`、`min`、`max`、`pattern`、`enum`、`whitespace`、`message`、`transform`、`validator`），不再支持 async-validator 的 `fields`、`defaultField`、`asyncValidator`、`warningOnly` 等字段。`type` 取 `string`、`number`、`integer`、`float`、`boolean`、`array`、`object`、`date`、`email`、`url`、`regexp`、`method`；`len`、`min`、`max` 对字符串按字符（code point）计数，对数字比较数值，对数组比较项数；规则的 `validator` 签名改为 `(value, values) => string | string[] | boolean | Promise<...>`，返回 `false` 或抛错即失败，其余返回值按上一条归一化。默认错误文案来自语言包 `Form` 切片（新增 `required`、`invalid`、`stringLen`、`stringMin`、`stringMax`、`numberLen`、`numberMin`、`numberMax`、`arrayLen`、`arrayMin`、`arrayMax`），`message` 替换该规则任一检查的文案。每条规则的内置检查至多产生一条消息，`stopValidateWithError` 时在第一条失败的规则处停止。
- 破坏性：字段的 `rules` 与 `validator` 互斥，同传时类型报错，绕过类型时开发模式警告一次并只用 `validator`。字段 `validator` 除函数外还接受 Standard Schema 对象（如 `z.string().min(3)`），失败时错误为 schema 的 issue 文案，`stopValidateWithError` 时只取第一条。
- 破坏性：Form `keepState` 默认 `true`，字段卸载后保留值、错误与 touched，重新挂载时恢复；字段与 ArrayField 的 `keepState` 未设时依次跟随所在 ArrayField、Form。ArrayField 新增 `keepState`，ArrayField 内的字段不再忽略 `keepState`（原来强制为 false 并警告）。ArrayField 以 keepState 卸载后保留整组数据，重新挂载时按保留的值渲染行，`reset()` 仍恢复到最初的 `initValue`；不保留时删除整组的值、错误与 touched。
- ArrayField 的 children 参数新增 `move(from, to)`（Vue 插槽、Svelte snippet 为 `onMove`）：移动一行的值、错误与 touched，行的 key 随行移动；下标越界时钳制到首尾，`from === to` 不做事。删除行时 touched 随值一起左移。行内字段的值全为空（如唯一字段为 `''`）时，该行不再从渲染和校验中消失。
- 破坏性（类型）：`FormApi<Values, Output = Values>` 区分输入与输出类型：`formState`、`getValues` 与字段路径用输入类型，`onSubmit` 与不带字段的 `validate()` 用输出类型（`schema` 的 `InferOutput`），带字段的 `validate(fields)` 仍为输入类型；`getTouched(field?)` 返回 `boolean | Record<string, any> | undefined`，不传字段时返回整棵 touched 树，与 `setTouched` 一致；`getError` 返回 `string[]`（父路径为错误树）或 `undefined`；删除类型 `CommonFieldError`、`BasicFieldError`、`FieldValidateResult`（React 另删 `ErrorMsg`、`ReactFieldError`，Vue 另删 `FormValidateResult`），改用 `FieldError`、`FieldErrorInput`，并新增导出 `FieldValidator`、`FormValidator`、`RuleType`、`JsonSchema`、`SchemaFieldKind`、`SchemaFieldNode`、`SchemaFieldProps`、`SchemaFormProps`；React、Solid 的 FormSlot 的 `error` 只接受 ErrorMessage 的属性对象、字符串或字符串数组，不再接受 ReactNode（Solid 为 JSX）；FormInputGroup 把组内各字段的错误摊平后合并显示；`StandardSchema` 的类型参数改为 `<Input, Output>`，并带可选的 `types` 与 `jsonSchema`。
- 新增 SchemaField 与 SchemaForm：SchemaField 在 Form 内按 JSON Schema 渲染某个路径（`field`，默认根）下的字段，JSON Schema 取显式传入的 `jsonSchema`，否则由 Form `schema` 的 `~standard.jsonSchema` 导出（Zod 4 等实现了 Standard JSON Schema 的库）。字符串、长文本（`maxLength` 大于 160）、数字、布尔、枚举分别渲染为 Input、TextArea、InputNumber、Switch、Select，对象渲染为 Section，选项数组渲染为多选 Select，对象数组渲染为可增删、上下移动的 ArrayField（`minItems` 等于 `maxItems` 时行数固定），无法映射的节点不渲染并在开发模式警告。`widgets` 按 `format` 或控件种类替换控件，`renderField` 按路径（数组项写作 `[]`，如 `contacts[].email`）接管一个节点的渲染；标签取 `title`，说明取 `description`，初值取 `default`，必填取 `required`。SchemaForm 是 Form 加根 SchemaField 的封装，children 渲染在字段之后，不接受 `render`、`component` 与函数形式的 children；它的全局默认值只覆盖 `jsonSchema`、`widgets`、`renderField`，内部 Form 读 Form 的全局默认值。两者读全局默认值（F7）。Svelte 的 SchemaForm 经 `bind:this` 调用 `getFormApi()`。语言包 `Form` 新增 `addItem`、`removeItem`、`moveUpItem`、`moveDownItem`、`item`，用作数组行按钮的可访问名称与行标签。
- 行为变化：字段卸载造成的值删除与 `onChange` 推迟到 Form 的下一次提交时发出，删除中间一行时 `onChange` 只发一次完整值；卸载整个 Form 不再逐字段触发 `onChange` 与更新。首帧 `formState.values` 是传入的 `initValues` 对象本身，不再是它的克隆。
- 字段首次挂载时显示 `formState.errors` 里已有的错误；整表 `reset()` 清空全部错误，包括没有对应字段的错误。
- 破坏性：FormSection 的根元素由 `section` 改为 `fieldset`，标题由 `h5` 改为 `legend`：分组以标题为可访问名称（`role="group"`），不再向页面插入固定层级的标题，外观不变。`ref` 类型改为 `HTMLFieldSetElement`，Props 的原生属性改为 fieldset 的属性；传入原生 `disabled` 时浏览器禁用其中全部表单控件，Form 的 `disabled` 状态不随之变化。
- Vue：不提供 `withFormApi`、`withFormState`；api 经 `getFormApi` 事件或模板 ref 的 `formApi` 取得，默认作用域插槽 `{ formState, formApi, values }` 替代 `render`、`children`；字段值只由 Form 管理，不支持 `v-model`，字段 `@change` 末参追加 `latestValues`；字段壳插槽为 `#fieldLabel`、`#labelExtra`、`#helpText`、`#extraText`、`#error="{ error }"`（`error` 为 `string[]`）；ArrayField 插槽为 `{ arrayFields, onAdd, onAddWithInitValue, onMove }`。
- Solid：不提供 `withFormApi`、`withFormState`，`WithFieldOption` 没有 `shouldMemo`。Form 的 `ref` 收到挂着 `formApi` 的 form 元素（`FormElement`），`onSubmit` 的 `e` 为原生 `SubmitEvent`；`useFormState`、`useFieldState` 与 `useForm()` 返回的表单状态是访问器，`useFieldApi`、`useFieldState` 的字段路径可以传访问器。
- Solid：`render`、`component`、声明了参数的函数 `children` 与 ArrayField 的 children 只调用一次，参数是随表单状态更新的活对象，在 JSX 之外解构只得到初始值；无参函数按子节点访问器处理，不传 render props。按表单值渲染字段列表用 `<Index>`，`<For>` 会因每次写值换新对象而反复重建行。FormInputGroup 照常渲染组内不是字段的子元素（React 会丢弃），组错误按字段注册顺序排列；ArrayField 的 `arrayFields` 行对象在行存在期间保持身份，`field` 随前面行的增删更新，行删除后再调用它的 `remove()` 不生效（React 会删除当前位于原下标的行）。
- Solid：Field 的 `label`、`helpText`、`extraText` 只在各自显示时创建；label 不渲染（`noLabel`、`pure`、InputGroup 内非 inset）时，不再从 label 配置的 `required` 得出 `aria-required`，与 Label 的星号同一条件。ErrorMessage 在 `error` 为全假的数组时不渲染，也不创建 `helpText`。
- 新增 Transfer 字段 `FormTransfer`：值为 Transfer 的 `value`（Vue `modelValue`）数组，`onChange`（Vue `change`）末参追加 `latestValues`；`labelPosition="inset"` 按 `top` 布局。`trigger="blur"` 在焦点离开整个 Transfer 时校验并标 touched（见 Transfer 的 blur 事件）。
- Svelte：`FormSelect`、`FormCascader`、`FormTreeSelect`、`FormAutoComplete`、`FormDatePicker`、`FormTimePicker` 的自定义触发器 snippet 在字段上叫 `triggerContent`（字段的 `trigger` 是校验时机），转发给控件的 `trigger`，传了它时 `labelPosition="inset"` 按 `top` 布局。
- Svelte：新增 `FormCascader`、`FormTreeSelect`；Form 字段不接受原生 `defaultValue`、`defaultChecked`，用 `initValue` 代替；FormInputGroup 只渲染一个 group，标签由 InputGroup 渲染。
- Svelte：字段组件经 `bind:this` 调用 `getControl()` 取得被包裹控件的实例，再调用控件自己的方法（如 `getControl()?.focus()`、`getControl()?.open()`）。
- React：字段挂载后再改 `keepState`（或所在 ArrayField、Form 的 `keepState`），卸载时按最新值处理（原来按挂载时的值）。ArrayField children 的 `add` 不再返回新行 key（类型本来是 `void`）。
- Solid、Svelte：嵌套 ArrayField 未设 `keepState` 时先跟随父 ArrayField，再跟随 Form（F16）；原来直接跟随 Form。
- Svelte：ArrayField 改 `field` 时，旧路径按解析后的 `keepState` 处理，为 false 时移除旧路径的值、错误与 touched（原来总是保留），与其余三个框架一致。
- 类型：`initValues` 改为 `DeepPartial<Values>`（foundation 新增导出 `DeepPartial`）：Values 由 `schema` 推导时（SchemaForm、带 `schema` 的 Form）可以只给部分初值，嵌套对象与数组元素同样可省略；没有 `schema` 时 Values 仍从 `initValues` 推导。
- React 类型：`FormCheckbox`、`FormRadio`、`FormSelect` 的 `onChange` 末参带上 `latestValues`；Checkbox、Radio 不传 `field`（作为组内控件）时只收到事件，所以 `latestValues` 为可选。
- Vue、Svelte：字段 `label` 配置新增 `id`，作为 label 元素的 id（控件的 `aria-labelledby` 指向它），不传时自动生成；FormSlot 同样采用配置里的 `id`。
- Svelte：Form 的 `onsubmit`、`onreset` 在 Form 处理提交、重置之后调用使用方传入的回调（原来被吞掉）。
- 破坏性（类型）：foundation `form/interface` 的 `setValuesConfig` 改名 `SetValuesConfig`；Solid、Svelte 的 `useFieldState` 返回值中 `error`、`touched` 改为可选属性。

### Button

- 破坏性：`--semi-button-colorful-*` 改为只读写法，默认值写在 `var()` 回退里，可在 body 或祖先上设置；删除 `--semi-button-colorful-disabled-fill`。
- 破坏性（类型）：`IconButtonProps` 删除 `iconSize`、`iconStyle`；删除 `circle` 属性及 `semi-button-circle` 类，继续传入时落到原生 `button`。
- `loading` 时点击不再触发 `onClick`（submit 不提交），按钮带 `aria-disabled="true"` 并保持可聚焦；带 `icon` 的 Button 只读取 `overrideDefaultProps.Button`。Vue：`icon` 为 `#icon` 插槽，`children` 为默认插槽，回调为 `@click` 等原生事件；`OverrideDefaultProps` 删除 `SplitButtonGroup` 键。
- Solid：`icon` 接受 `JSX.Element` 或图标组件（`Component<{ fill?: IconFill }>`），只有组件形式会收到彩色按钮的 `fill`；没有 `x-semi-children-alias`。
- Svelte：`icon` 是 snippet，参数 `{ fill }`，彩色按钮给出填充色，需传给图标组件（`{#snippet icon({ fill })}<IconEdit {fill} />{/snippet}`）；内容为 `children`，没有 `children` 即按纯图标按钮处理；回调为原生事件属性（`onclick` 等）。
- IconButton 放在 InputGroup 里时继承组的 `size`、`disabled`，自身显式传的值优先。
- `loading` 的按钮不再设 `pointer-events: none`：鼠标点击停在按钮上，不再穿透到外层元素，悬停时显示 `not-allowed` 光标（同 Ant Design 在点击处理中直接返回）。

### ButtonGroup

- `disabled`、`size`、`type`、`theme`、`colorful` 只是子按钮的默认值，子按钮自己的值优先（`theme` 原为组优先），显式传 `undefined` 视同未传；ButtonGroup 与其中的 Button 放在 InputGroup 里时，未设置的 `size`、`disabled` 取 InputGroup 的（见 Input、TextArea）。ButtonGroup 的全局默认值（`overrideDefaultProps.ButtonGroup`）排在外层 ButtonGroup 与 InputGroup 之后，不再盖过组的值。
- `data-*`、`id`、`aria-*`、事件等其余属性落在 `role="group"` 根元素，不再传给每个子按钮，传入的 `role` 覆盖默认的 `group`；组值经 context 下发，被 Tooltip、Popover 包住的后代按钮也继承，弹层内容与组内 Modal、SideSheet 里的按钮不继承；Fragment 与数组子节点被展开。
- Vue：组属性经 provide/inject 下发，自身 `false` 胜过组 `true`。
- Solid：分隔线只画在根元素为 Semi Button、IconButton 的直接子项之后，用其他元素包住按钮的子项继承组值但没有分隔线。
- Svelte：分隔线服务端首帧没有，挂载后补上；组内任意后代 Button 都画分隔线，不限直接子项。
- Svelte 破坏性（深路径导入）：`button/context` 的 `getButtonGroupContext` 改为返回原始 context（含弹层内容里收到的外层组），排除弹层的版本改名 `getButtonGroupInScope`。

### Carousel、Typography、ScrollList

- Carousel：`ref.stop()` 后手动切换、焦点离开、幻灯片增加等都不再恢复自动播放，直到 `ref.play()`；`prefers-reduced-motion: reduce` 时不自动播放且无切换动画；键盘焦点进入时暂停自动播放；非当前幻灯片带 `inert`。
- Carousel 箭头改为原生 `<button type="button">`（`arrowProps.*.props` 类型改为 `ButtonHTMLAttributes<HTMLButtonElement>`），指示点改为 `role="tab"` 的 button；新增语言包键 `Carousel.indicators`、`Carousel.slideN`、`Carousel.carousel`、`Carousel.slide`（自定义语言包需补齐）与主题变量 `$radius-carousel_arrow`，箭头高度由 39px 改为 32px。
- Typography 的复制按钮与展开、收起控件改为原生 `<button type="button">`，`ellipsis.onExpand` 事件类型改为 `React.MouseEvent<HTMLButtonElement>`，复制按钮不再带内联 `margin-left`；`ellipsis` 对象中写成 `undefined` 的 `rows`、`pos`、`suffix` 取默认值（`1`、`'end'`、`''`）；无 `href` 的 `link` 有点击监听时获得 `role="link"`；`disabled` 的 `link` 不再触发 `link.onClick`。
- 破坏性：Numeral 不再支持函数 children；`CopyableConfig`、`LinkType` 的深路径从 `typography/title` 移到 `typography/interface`；`BaseTypographyProps` 不再从入口导出；类型上 `ScrollItemProps` 不再包含 `children`，ScrollItem 的 `motion` 收为 `boolean`，`onSelect` 参数收窄为 `T & { type?: string | number; index: number }`。
- 破坏性（类型）：React、Solid 的 `CopyableProps` 的 `content`、`duration` 必填，经 `Typography` 的 `copyable` 使用不受影响。
- React、Solid 破坏性（深路径导入）：`typography/copyable` 只有默认导出，删除同名的具名导出 `Copyable`。
- ScrollList 的各列不显示滚动条（原来随系统设置显示），用滚轮、拖动或方向键滚动。
- ScrollItem wheel 模式的高亮行（`.semi-scrolllist-item-selected`）由渲染输出，重新渲染改写类名时不再丢失；React、Solid 的 `transform` 参数 `value` 类型为 `T['value']`（原为 `any`），与 Vue、Svelte 一致。
- React：新增 `TypographyTitle`、`TypographyText`、`TypographyParagraph`、`TypographyNumeral` 命名导出，与 `Typography.Title` 等是同一组件，供 Server Component 直接使用（点语法在 Server Component 中为 `undefined`）。
- Vue：Typography 的 `copyable` 只接受 `boolean | { content, duration, class, style }`，插槽 `#copyIcon`、`#copyTip`、`#copySuccessTip`、`#copyAction`、`#icon`、`#ellipsisTooltip="{ content, trigger }"`、`#ellipsisContent`，事件 `copy`、`expand(expanded, e)`；Carousel 用 `v-model:activeIndex` 与 `@change`，箭头为 `#leftArrow`、`#rightArrow`；ScrollList 的 `header`、`footer` 为同名插槽，ScrollItem 用 `select` 事件与 `v-model:selectedIndex`。
- Solid：Carousel 根元素的焦点回调写作 `onFocusIn`、`onFocusOut`（div 的 `onFocus`、`onBlur` 收不到后代的焦点事件），`ref` 拿到根元素 `CarouselElement`，其上带 `play`、`stop`、`goTo`、`prev`、`next`；幻灯片是使用方自己的 HTML 元素（文本节点与 SVG 被忽略）。
- Solid 破坏性：箭头内容由 `arrowProps.leftArrow.children`、`arrowProps.rightArrow.children` 改为 Carousel 的 `leftArrow`、`rightArrow` 属性（`JSX.Element`，`null` 时按钮为空，与 Vue 的 `#leftArrow`、`#rightArrow` 一致），只在显示箭头时创建，`ArrowButton` 只剩 `props`；箭头按钮的 `x-semi-prop` 改为 `leftArrow`、`rightArrow`。
- Solid：Typography 的 `icon` 接受 `JSX.Element` 或图标组件，只有组件形式会收到按文字尺寸推出的 `size`；`copyable` 配置与 `link` 的样式类名写作 `class`；`copyable.render` 在 `copied` 变化时重新调用。
- Solid 破坏性（类型）：`copyable` 配置的 `copyTip`、`successTip` 改为 `string | (() => JSX.Element)`，`icon` 改为 `() => JSX.Element`（`icon: () => <X />`），只在对应内容显示时调用。
- Solid：省略计算、省略提示（Tooltip、Popover 的内容与 `renderTooltip` 的第一个参数）和默认复制内容取 children 的纯文本，元素取其 `textContent`；省略的截断、展开与收起不重新创建 children。
- Solid 破坏性：Numeral 只格式化字符串与数字 children，每个分别格式化（动态插值 `{price()}` 单独成段，与 React 一致）；元素 children（含子组件渲染出的元素）原样输出，其中的文字不格式化。copyable 按钮的可访问名称只取字符串的 `copyTip`（未复制时）与 `successTip`（已复制时），否则用语言包的 `copy`、`copied`；`icon`、`successTip` 渲染出的元素上的 `aria-label` 不再参与命名。
- Solid：ScrollItem 的 `ref` 拿到根元素 `ScrollItemElement`，其上带 `scrollToIndex`，未声明属性落在根 div；ScrollList 的 `ref` 是根元素。`bodyHeight` 为数字时补 `px`，为 0 时不设高度；`header`、`footer` 为空串时不渲染。wheel 模式点击选项时，祖先的 `onClick` 收不到这次点击（同 Vue）。
- Svelte 破坏性：Carousel 的幻灯片用 `items` 数据 prop 加 `slide` snippet（参数 `{ item, index }`），不接受 children 形式，Carousel 给每张包一层带 role、`inert` 的元素；箭头内容为 `leftArrow`、`rightArrow` snippet；`activeIndex` 可绑定，回调 `onChange(activeIndex, preIndex)`；`play`、`stop`、`goTo`、`prev`、`next` 经 `bind:this` 调用。
- Svelte：Typography 的 `Text`、`Title`、`Paragraph`、`Numeral` 与根组件 `Typography` 均为具名导出，平铺在包根；`copyable` 配置对象只含 `content`、`duration`、`class`、`style`（字符串）、`onCopy`，图标、提示、自定义渲染改用 snippet `copyIcon`、`copyTip`、`copySuccessTip`、`copyAction`（参数 `{ copied, copy, config }`）；`ellipsis` 的 `onExpand` 写在 `ellipsis` 配置里。
- Svelte：`showTooltip` 的 `opts` 同时接受 Tooltip 与 Popover 属性（`type` 为 `'popover'` 时渲染带箭头的 Popover，类名含 `semi-typography-ellipsis-popover`），提示内容用 `ellipsisContent` snippet，整体接管提示用 `ellipsisTooltip` snippet（参数 `{ content, trigger }`）；`icon` 为 snippet；`component` 只接受字符串标签名。
- Svelte：省略截断时，完整文本留在 DOM 中并设 `hidden`，根元素的 `textContent` 含全文；Numeral 格式化与图标 small 尺寸在挂载后才应用，服务端输出原始文本与默认图标尺寸。
- Svelte：ScrollList 的 `header`、`footer` 接受字符串或 snippet，传了就渲染；ScrollItem 的 `selectedIndex` 可绑定，配 `onSelect(data)`；`ScrollList.Item` 与具名导出 `ScrollItem` 是同一组件；`scrollToIndex` 经 `bind:this` 调用。
- 破坏性（Solid）：Carousel 给每张幻灯片外包一层 `div.semi-carousel-content-item`，class、`role`、`aria-*`、`id`、`inert` 与切换动画写在包装元素上，使用方的幻灯片元素原样保留，要撑满轮播区域需自己设置 `height: 100%`（同 Svelte）；按幻灯片元素写的 `.semi-carousel-content-item` 选择器改为选包装元素；幻灯片自带的 `id`、`aria-label` 不再用作 tab 的 `aria-controls` 目标与幻灯片名称。服务端 HTML 已带这些 class 与属性。
- Typography（React）：`showTooltip.type` 显式为 `undefined` 时按默认 Tooltip 渲染，不再抛错。
- Typography：Numeral 不接受 `ellipsis`（类型与文档本就未声明），经透传带上也不截断（四个框架一致）。
- Typography：展开后按钮消失（可展开且不可收起）时，只在按钮持有焦点的情况下，于按钮移除后把焦点交给文字根元素（`tabindex="-1"`）；按钮保留时焦点留在按钮上。React、Solid 不再在点击时无条件同步聚焦根元素（四个框架一致）。
- Typography（Vue）：JS 省略的首帧按原插槽渲染，测量后再截断，放得下的内容不再先压成纯文本再恢复。
- ScrollList：cycled wheel 不再移动 `<li>`，DOM 顺序就是渲染顺序，列表长度变化后顺序、选中定位与点击回调值都正确，选中项立即定位且无动画。隐藏状态下挂载或隐藏后再显示的列，显示时定位到选中项，不触发 `onSelect`。任何定位都取消进行中的滚动动画，包括 `scrollToIndex(_, 0)`。删除 `ItemFoundation` 的 `shouldAppend`、`shouldPrepend`。

### AutoComplete、TagInput、Avatar、PinCode

- PinCode：格子间距改为逻辑属性；ConfigProvider 的 `direction` 为 `rtl` 时左右方向键反向（ArrowLeft 移到下一格）。
- 破坏性：AutoComplete 删除 `getPopupContainer`、`zIndex`、`AutoComplete.Option` 与 `children`（改用 `Select.Option`），删除深路径 `@fibrae/semi-ui-react/auto-complete/option`、`@fibrae/semi-foundation/auto-complete/optionFoundation`；`style.width` 不再复制为下拉最小宽度。
- 破坏性（类型）：AutoComplete 的 `defaultValue` 收窄为 `string | number`，`onKeyDown` 参数改为 `KeyboardEvent<HTMLDivElement>`，删除 `mouseEnterDelay`、`mouseLeaveDelay`、`tabIndex`；输入框角色改为 combobox（按 textbox 查询的测试需改为 combobox），`id` 落在输入框上。
- 破坏性（类型）：TagInput 的 `onFocus`、`onBlur` 参数改为 `React.FocusEvent<HTMLDivElement>`，`onInputChange` 第二个参数改为 `React.SyntheticEvent`，`value` 为 `string[] | null`，ref 为 `TagInputHandle { focus, blur }`；`AvatarState.hoverContent` 改为 `hovered: boolean`。
- 破坏性（类型）：`@fibrae/semi-foundation/components/tag-input/foundation` 删除 `any` 别名 `TagInputCursorEvent`、`TagInputKeyboardEvent`、`TagInputMouseEvent`，改为 `TagInputKeyEvent`、`TagInputFocusEvent`、`TagInputClearEvent`；`TagInputFoundation`、`TagInputAdapter` 新增按键与焦点事件的类型参数 `KE`、`FE`，`notifyKeyDown`、`notifyFocus`、`notifyBlur` 的参数随之收窄。
- TagInput：`+N` 浮层、`suffix` 中的 Popover 等内部弹层里的按下、焦点与点击不结束也不进入激活状态，`+N` 浮层里的标签可以直接关闭（四个框架一致）。
- AutoComplete：对象数据项缺 `label` 时候选行显示 `value`（四个框架一致）；数据项带 `show: false` 时，高亮项与 Enter 选中项是同一个可见项。
- 破坏性（样式钩子）：TagInput 悬停改由 CSS `:hover` 提供，不再加 `semi-tagInput-hover` 类；删除 `semi-tagInput-clearBtn-invisible` 与 `semi-avatar-focus`。TagInput 清除按钮与拖拽句柄改为带名称（`TagInput.clear`、`TagInput.dragSort`）的原生 button，`onFocus`、`onBlur` 以整个组件为界。
- Avatar：可点击头像的焦点目标为 `role="button"`（按 `img` 查询的测试需改为 button），不再加语言包 `Avatar.clickable` 前缀（键已删除）；AvatarGroup 未声明属性落在根 div，`size`、`shape` 经 context 下发到被 Tooltip、Popover 包住的头像。PinCode：`autoFocus` 默认值由 `true` 改为 `false`，需要时显式传 `autoFocus` 或用 `PinCodeHandle.focus(0)`；`onFocus`、`onBlur` 按整组计，焦点从外部进入整个 PinCode 时触发一次 `onFocus`，格子之间移动不触发。
- Avatar：`bottomSlot` 方形标签不换行，比头像宽时向两侧超出。
- Avatar：`border.motion` 的外圈动画只放大并淡出，边框粗细不再随动画变细到 0（原来每帧触发布局与重绘）；删除 Sass 变量 `$animation_width-additionalBorder-end`。
- React、Vue、Solid：服务端渲染的 Avatar 图片在 hydration 前已加载失败时，hydration 后调用 `onError` 并显示文字（原来保留破图）。
- AutoComplete：受控值回显但没有匹配项时保留已输入的文本（四个框架一致）。
- AutoComplete：下拉中有可聚焦元素（`renderItem`、`emptyContent` 里的按钮或链接）时，方向键只移动高亮，焦点不再移入下拉。
- Vue：AutoComplete、PinCode、TagInput 用 `v-model`（`modelValue`，TagInput 另有 `v-model:inputValue`），回调为同名事件，`autoFocus` 写作 `autofocus`；AutoComplete 的 `renderItem`、`triggerRender` 为 `#item`、`#trigger`，`prefix`、`suffix`、`insetLabel`、`clearIcon`、`emptyContent` 只有插槽，ref 为 `{ nativeElement }`；TagInput 插槽 `#prefix`、`#suffix`、`#insetLabel`、`#clearIcon`、`#tag`；PinCode 新增按整组计的 `focus`、`blur` 事件。
- Solid：AvatarGroup 只给 Avatar 加重叠类（经 context，包括被 Tooltip 包住的头像），其他子元素不加。
- Solid 破坏性：AvatarGroup 的 `renderMore` 签名为 `(restNumber: number, restAvatars: ((props?: AvatarProps) => JSX.Element)[]) => JSX.Element`。超出 `maxCount` 的头像在组内不创建，`restAvatars` 的每一项是渲染函数，在调用处才创建该头像（独立头像，不是列表项，不取组的 `size`、`shape`），传入的属性覆盖头像自身的属性（如 `avatar({ size: 'extra-small' })`，对应 React 的 `cloneElement`）；`maxCount` 与 React 一样按子节点计数，包装元素（如 Tooltip）里的头像随包装元素整体隐藏，不单独隐藏，`maxCount` 变化或增删子节点时由后面的子节点补位。默认 `+N` 头像的名称只列被隐藏头像的 `alt`。
- Solid 破坏性（类型）：Avatar 的 `topSlot.text`、`bottomSlot.text` 改为 `AvatarSlotText`（`string | number | (() => JSX.Element)`，从包入口导出），自定义内容写成函数 `text: () => <IconPlus />`，只在标记实际显示时（预设尺寸，topSlot 另需圆形）调用；`render` 仍完全替换标记。
- Solid：AutoComplete 的 `ref` 是根 div，其 `focus()`、`blur()` 转给输入框，用 `triggerRender` 时没有可转交的输入框，`ref.focus()` 不移动焦点（React 聚焦根 div）；`autoFocus` 写作 `autofocus`，`onFocus`、`onBlur` 收到原生 `focusin`、`focusout`；`id`、`name` 与 `aria-*` 落在输入框；数据项的类名字段为 `class`；`triggerRender` 的参数字段是 getter，在 JSX 之外解构只得到当前值；`stopPropagation` 只接受布尔值。破坏性（类型）：`data` 对象项的 `label` 收窄为 `string | number`，标记内容经 `renderItem` 渲染。
- Solid：PinCode 的 `ref` 是 `role="group"` 根元素，其 `focus()` 聚焦第一个空格子（全部填满时聚焦最后一格），`blur()` 释放持有焦点的格子；不提供 `PinCodeHandle` 的 `focus(index)`、`blur(index)`，聚焦某一格用 `ref.querySelectorAll('input')[index].focus()`。`autoFocus` 写作 `autofocus`；`id` 落在第一个输入框上；Form 注入的 `name` 被丢弃。
- Solid：TagInput 的 `ref` 是 `role="group"` 根元素，其 `focus()` 聚焦文本输入框并进入激活状态，`blur()` 释放其中的焦点并结束激活，不提供 `TagInputHandle`。`autoFocus` 写作 `autofocus`；`onFocus`、`onBlur` 收到原生 `focusin`、`focusout`，`onInputChange`、`onKeyDown` 收到原生事件；`id`、`name`、`role`、`tabIndex` 与 `aria-*` 落在文本输入框；`renderTagItem` 在标签的下标或值变化时重新调用。拖拽排序按需加载，加载前显示不带手柄的标签列表。
- Solid：Avatar 的 `hoverMask` 在悬停时才读取并创建，挂载时不创建。
- Svelte：Avatar 的 `class`、`style`、`id` 等属性落在头像 span，存在包装层时 `style` 落在包装层；传了 `onclick` 才成为可聚焦的 button；`hoverMask`、`topSlotText`、`bottomSlotText` 是 snippet，整块替换写 `topSlot.render`、`bottomSlot.render`，`topSlot.style`、`bottomSlot.style` 是字符串；内容是文字还是元素在挂载后判定，服务端首帧一律按文字结构输出。
- Svelte 破坏性：AvatarGroup 不接受 Avatar 子节点，改用 `items`（每项是 Avatar 的属性，类型 `AvatarGroupItem`）加 `item` snippet（参数 `{ item, index }`，提供头像内的文字），组的 `size`、`shape` 覆盖数据项自己的值；`maxCount` 截断、`+N` 与其可访问名称在服务端首帧同步算出，默认 `+N` 的名称只列被隐藏项的 `alt`。`more` snippet 参数为 `{ restNumber, restAvatars }`，`restAvatars` 是被隐藏的完整数据项。不能再用 Tooltip 等包裹组内的单个头像，需要时在 `item` snippet 里包裹内容。
- Svelte：PinCode 的 `value` 可绑定，没有 `defaultValue`；回调为 `onChange`、`onComplete`、`onFocus`、`onBlur`；`autofocus` 默认 `false`；实例方法为 `focus(index)`、`blur(index)`；`id` 落在第一格，`name`、`insetLabel`、`insetLabelId` 被丢弃。
- Svelte：头像内容里弹层中的 Avatar 不继承 AvatarGroup 的 `size`、`shape`，也不是列表项。
- Svelte：TagInput 的 `value`、`inputValue` 可绑定，没有 `defaultValue`，把它们绑成 `undefined` 会清空内部状态（表单重置）；回调是 `onChange`、`onInputChange(value, event)`、`onAdd`、`onRemove(value, index)`、`onExceed`、`onInputExceed`、`onFocus`、`onBlur`、`onKeyDown`。
- Svelte：snippet 有 `prefix`、`suffix`、`insetLabel`、`clearIcon`、`tag({ value, index, onClose })`，`tag` 返回空内容就不渲染该标签，不回落默认标签；`focus()`、`blur()` 经 `bind:this` 调用，没有 `TagInputHandle` 类型；`restTagsPopoverProps` 的类型去掉了 `content`、`child`、`children`。
- Svelte：`id`、`name`、`role`、`tabindex` 与全部 `aria-*` 落在内部 `<input>`（根元素是 `role="group"`），根元素上的 `onclick` 与组件自己的点击处理组合调用。
- Svelte：AutoComplete 的 `value` 可绑定，没有 `defaultValue`；`renderItem`、`triggerRender` 改为 `item`、`trigger` snippet（`trigger` 参数不含 `componentProps`），`prefix`、`suffix`、`insetLabel`、`clearIcon`、`emptyContent` 为 snippet，`insetLabel` 只要传了 snippet 就当作有内容。
- Svelte：回调为 `onChange`、`onSearch`、`onSelect`、`onClear`、`onFocus`、`onBlur`、`onDropdownVisibleChange`；`focus()`、`blur()`、`getNativeElement()` 经 `bind:this` 调用；数据项的 `class` 接受 clsx 值，`style`、`dropdownStyle` 只接受字符串；`id`、`name`、`aria-*` 落在输入框，用 `trigger` 时 `id` 落在根元素。
- Avatar：`size`、`gap` 变化后重算文字缩放。
- 破坏性（类型）：Avatar 图片加载失败时 `onError` 收到 error 事件，返回 `false` 保留破图：React 为 `(event: SyntheticEvent<HTMLImageElement>) => boolean | void`，Vue、Svelte 为 `(event: Event) => boolean | void`，Solid 的事件带 `currentTarget: HTMLImageElement`。

### Chat、AIChatInput、AIChatDialogue

- 破坏性（类型）：AIChatInput 的 `uploadProps` 为 `Omit<UploadProps, 'fileList' | 'listType'>`，Chat 的为 `Omit<UploadProps, 'fileList' | 'defaultFileList'>`；`markdownRenderProps` 不再接受 `raw`、`ref`（Chat 还不接受 `components`，改用 `customMarkDownComponents`）；`ChatProps` 不再接受 `children`；`FileItem`、`BaseFileItem` 删除索引签名。
- 破坏性（类型）：`onSkillChange`、`renderTemplate` 的 `skill` 加入 `undefined`，`getEditor` 返回 `Editor | null`；`getConfigureItem` 改为泛型且 `onChange` 为 `(value: unknown) => void`；`ResponseChunk` 改为按 `type` 区分的联合；两处 `Reference` 统一为 `id` 必填、`type` 可选；`Metadata.color` 收窄为 `AvatarProps['color']`；删除 `onSuggestClick`、`onTemplateVisibleChange`；`@fibrae/semi-ai-react/ai-chat-input/extension/status-extension` 迁到 `@fibrae/semi-ai-foundation/ai-chat-input/extension/status-extension`。
- 破坏性（深路径导入）：`@fibrae/semi-ai-foundation` 的 `chat/constants`、`ai-chat-input/constants` 中 `strings` 删除 `PIC_SUFFIX_ARRAY`、`PIC_PREFIX`，判断图片改用 `@fibrae/semi-ai-foundation/file-suffix` 的 `isImageFile`。
- 破坏性（类型）：`renderDialogueAction` 的 `defaultActions` 现包含分享与编辑按钮，顺序为 copy、like、dislike、reset、share、edit、more，自定义操作栏会多出这两个按钮；`status` 为 `incomplete` 视为终止状态，`queued` 隐藏操作栏。
- 行为变化（React）：AIChatInput 的 `immediatelyRender` 默认值改为 `false`，编辑器在挂载后创建，首个提交中 `getEditor()` 返回 `null`；服务端渲染不再打印 tiptap 的告警。纯客户端渲染需要首个提交就有编辑器时显式传 `immediatelyRender`。
- 行为变化：`onMessageCopy` 在剪贴板写入成功后才触发，无文本可复制时不触发；`sendMessage(content)` 无附件时 content 为字符串；重新生成清除旧回答的 `like`、`dislike`、`error`、`references`；AIChatDialogue 的 `createAt` 改为 `createdAt`（Chat 的消息仍是 `createAt`）；`markdownRenderProps.components` 与内置组件合并而非整体替换；消息列表与滚动条始终可用，类名 `semi-chat-container-scroll-hidden`、`semi-ai-chat-dialogue-list-scroll-hidden` 已删除；AIChatDialogue 引用列表按文件名的扩展名显示文件图标，没有扩展名或以点开头的名字（如 `doc`、`.js`）不显示。文件图标按统一的后缀表识别：`doc`、`txt`、`epub`、`mobi` 为 word，`py`、`go`、`rs`、`php`、`sql`、`html`、`css`、`scss`、`less`、`md`、`java`、`c`、`cpp` 为 code，`webm`、`3gp` 为 video，`xls` 为 excel；名字恰为 `word`、`excel` 的类型不再被当作后缀。
- 样式与结构：提示项、上传触发器、引用项、附件移除按钮等改为原生 `button`；Chat 提示项由 `div` 改为 `button`；AIChatInput 默认上传触发器为带 `aria-label` 的 `button`，`renderUploadButton` 的 `defaultNode` 即该按钮，不要再包一层 button；`RenderSkillItemProps`、`RenderSuggestionItemProps` 新增 `id`、`role`、`aria-selected`，需展开到根元素；删除 SCSS 变量 `$height-aiChatDialogue_file`、`$height-aiChatInput_attachment`、`$height-aiChatInput_footer_configure_radio_button`、`$width-chat_attachment_file`；模板按钮不再是 Configure 项，`setup` 与 `onConfigureChange` 不再含 `template`；新增语言包键 `AIChatInput.send`、`AIChatInput.stop`、`AIChatInput.upload`、`AIChatDialogue.copy`，自定义语言包需补齐。
- Vue：渲染函数改为作用域插槽，如 AIChatDialogue 的 `#avatar`、`#title`、`#content`、`#action`、`#fullDialogue`、`#contentItem`、`#messageEdit`、`#hintBox`，Chat 的 `#title`、`#avatar`、`#content`、`#action`、`#fullChatBox`、`#inputArea`、`#divider`，AIChatInput 的 `#reference`、`#topSlot`、`#uploadButton`、`#configureArea`、`#actionArea`、`#suggestionItem`、`#skillItem`、`#template`；回调为事件（如 `messageSend`、`messageCopy`、`chatsChange`、`contentChange`，`chats` 用 `v-model:chats`），`select`、`click`、`focus`、`blur`、`paste` 会遮住同名原生事件；`Skill`、`DialogueStep` 数据项无 `icon`，改用 `#skillIcon`、`#actionIcon`。
- Solid：AIChatInput 的 `ref` 拿到根元素 `AIChatInputElement`，其上带 `AIChatInputHandle` 的方法；编辑器在挂载时创建，此前 `getEditor()` 为 `null`，不提供 `immediatelyRender`；`extensions`、`defaultContent`、`showPlaceholderWhenSkillOnly` 只在创建编辑器时读取；`onFocus`、`onBlur`、`onPaste` 收到编辑器区域的原生 `focusin`、`focusout`、`paste`。破坏性（类型）：`renderUploadButton` 的 `defaultNode` 是创建默认上传按钮的渲染函数 `() => JSX.Element`，在插入处调用 `defaultNode()`；自定义节点不调用时不创建默认按钮。
- Solid：AIChatInput 的 `renderTopSlot`、`renderUploadButton`、`renderReference`、`renderSkillItem`、`renderSuggestionItem`、`renderActionArea`、`renderConfigureArea` 的参数字段是 getter，函数只在自身被替换时重新调用（`renderTemplate` 在当前 skill 变化时也重新调用）；渲染参数与 `getConfigureItem` 的类名字段为 `class`，`templatesStyle` 只接受对象；`uploadTipProps` 与自定义上传节点同用时，提示用 span 包住该节点；Configure 的 `value`、`defaultValue`、`ref` 只在创建时读取，子项随所属 owner 销毁而从值中移除（服务端渲染释放时不移除，也不触发 `onConfigureChange`）。
- Solid：Chat 的 `ref` 拿到根元素 `ChatElement`，其上带 `resetMessage`、`clearContext`、`scrollToBottom`、`sendMessage`；消息行按 `id` 保留 DOM（没有 `id` 或 `id` 重复的按位置），流式输出替换消息对象时，已有消息的节点、操作按钮与输入框的焦点和内容不变。`chatBoxRenderConfig` 的各渲染函数与 `renderInputArea`、`renderHintBox`、`renderDivider` 的参数字段是 getter，每条消息（或每个实例）只调用一次，函数本身被替换时才重新调用（`renderChatBoxAction` 在默认按钮集合变化时也重新调用）；破坏性（类型）：`defaultNodes` 的各项、`defaultTitle`、`defaultAvatar`、`defaultContent`、`renderInputArea` 的 `defaultNode` 与 `detailProps` 里的各节点是渲染函数 `() => JSX.Element`，在插入处调用，每次调用新建一个节点，没调用的不创建；`renderChatBoxAction` 的 `defaultActions` 是按显示顺序排列的按钮渲染函数 `(() => JSX.Element)[]`，`defaultActionsObj` 的各键也是 `() => JSX.Element`，在插入处调用，没调用的按钮不创建；渲染参数的类名字段为 `class`。
- Solid：Chat 的 `inputBoxStyle`、`hintStyle` 接受对象或字符串；`uploadTipProps` 与自定义 `uploadProps.children` 同用时，提示用 span 包住该节点，描述落在 span 上。`onMessageReset` 的参数类型为 `Message | null`，由 `resetMessage` 方法触发时为 `null`（同 Vue）。
- Solid 破坏性：数据只放数据（同 Vue）。Chat `roleConfig` 的 `avatar` 只接受图片地址 `string`，其他头像内容由 `chatBoxRenderConfig.renderRoleAvatar({ role, message })` 渲染在内置头像内（对应 Vue 的 `#roleAvatar`），新增导出类型 `ChatRenderRoleAvatarProps`；AIChatInput 的 `Skill` 删除 `icon`（类型不再继承 foundation 的 `BaseSkill`，索引签名为 `unknown`），技能面板每项的图标由 `renderSkillIcon(skill)` 提供（对应 Vue 的 `#skillIcon`）；`Configure.Mcp` 的 `McpOption` 删除 `icon`（索引签名为 `unknown`），菜单项图标由 `renderOptionIcon(option)` 提供（对应 Vue 的 `#optionIcon`）。
- Solid：AIChatDialogue 的 `ref` 是根元素 `AIChatDialogueElement`，其上带 `selectAll`、`deselectAll`、`scrollToBottom`、`scrollToTop`，不提供 `continueSend`（React 中写死为 false）；`style`、`hintStyle` 接受对象或字符串；`AIChatDialogue.Annotation` 的 `onClick` 收到原生 `MouseEvent | KeyboardEvent`；消息行按 `id` 复用，流式更新与无关属性变化不重建已有消息的 DOM 和焦点。
- Solid：AIChatDialogue 的 `dialogueRenderConfig` 各渲染函数、`renderHintBox` 与 `Reasoning` 的 `customRenderer` 参数字段是 getter，只在函数本身被替换时重新调用，类名字段为 `class`；`messageEditRender` 在消息进入编辑时调用一次；`renderDialogueContentItem` 的渲染函数在所渲染的项变化时重新调用并重建其内容，收到的 `message` 是调用时的值；`renderDialogueAction` 的 `defaultActions` 是按显示顺序排列的按钮渲染函数 `(() => JSX.Element)[]`，`defaultActionsObj` 的各键也是 `() => JSX.Element`（破坏性，类型），在插入处调用，没调用的按钮不创建，可见按钮集合变化时重新给出。破坏性（类型）：`defaultTitle`、`defaultAvatar`、`defaultContent` 与 `renderFullDialogue` 的 `defaultNodes`（`avatar`、`title`、`content`、`action`）是渲染函数 `() => JSX.Element`，在插入处调用，没调用的节点不创建。
- Svelte：AIChatDialogue 的插槽改为同名 snippet，参数是对象，字段名与 Vue 插槽作用域相同；默认节点（`defaultTitle`、`defaultAvatar`、`defaultContent`、`defaultNodes`、`defaultActions`、`defaultActionsObj`）是 snippet 值，用 `{@render}` 渲染。
- Svelte：`contentItem` snippet 要自己渲染不处理的项：参数带 `defaultItem` 与 `class`（`-custom-renderer` 类名），对话框不再额外包一层 `-custom-renderer`，自定义节点自行加上 `class`；Reasoning 替换正文的 snippet 是 `children`，参数为 `{ status, summary, content, markdownRenderProps }`。
- Svelte：`chats` 可绑定，不绑定时组件内的增删改在本地生效，`onChatsChange` 每次变更只调用一次；对外方法 `selectAll`、`deselectAll`、`scrollToBottom`、`scrollToTop` 经 `bind:this` 调用；`hintStyle` 与 widget 的 `style` 只接受字符串。
- Svelte：AIChatInput 的 `render*` 与插槽改为 snippet：`reference`、`topSlot`、`uploadButton`、`configureArea`、`actionArea`、`suggestionItem`、`skillItem`、`skillIcon`、`template`、`uploadTip`；`actionArea` 收到 `{ upload, send, class }`，三者都是 snippet；`uploadButton` 参数里的 `defaultNode` 是 snippet，写 `{@render defaultNode()}`。
- Svelte：AIChatInput 的 `popoverProps`、`templatesStyle` 样式只接受字符串；`uploadProps` 不含 `fileList`、`listType`、`children`，初始附件用 `uploadProps.defaultFileList`。
- Svelte：`Configure` 的子项是 `Configure.Select`、`Configure.Button`、`Configure.Mcp`、`Configure.RadioButton`、`Configure.Item`；不提供 `getConfigureItem`，自定义项写 `<Configure.Item component={X} field="..." />`。
- Svelte：AIChatDialogue 的代码块有语言栏、复制按钮与语法高亮，复制的内容取自 `node` 的源码；Chat 消息里带语言的代码块同样语法高亮。
- Chat：`uploadProps.beforeRemove` 返回或 resolve 为 `false`、或 reject 时保留附件，删除后调用 `uploadProps.onRemove`。
- AIChatInput：StrictMode 下 Configure 不再多通知 `onConfigureChange`，移除不存在的字段不通知，真实卸载的通知推迟一个微任务；`editor.can()` 不再改变发送热键状态；`@tiptap/core` 的 Commands、Storage 补上类型。
- AIChatDialogue：组件自己写回的 `chats`（点赞、点踩、删除、提示点击）只调用一次 `onChatsChange`（原来两次），列表是否变化统一由 foundation 按值判断，父组件换列表时仍上报一次。Svelte：`bind:chats={get, set}` 的 setter 把列表改写成不同的值时，改写结果也会上报，值相同、对象不同的改写不上报。
- Vue Chat、Solid Chat、Solid AIChatDialogue：原地 push 消息、流式追加文字时也会自动跟随滚动；Chat 的 `chats` 与 `hints` 在同一次提交里变化时只做一次跟随判断。
- Chat 的删除确认、AIChatDialogue 的更多菜单：关闭后 150ms 内重新打开，操作栏不再收起，组件卸载时清理计时器。
- Chat、AIChatInput：`uploadProps.beforeRemove` 共用同一规则，同步值与 Promise 都推迟到微任务后处理，返回 `false` 或 reject 时保留附件。
- AIChatInput：placeholder 变化后的占位文字重绘、初始内容的零宽字符补齐由 AIChatInput 负责，单独使用 RichTextInput（只能经 `./*` 深路径导入）不再有这两项；RichTextInput 删除 `onReady`，`onCreate` 改为接收 editor。
- AIChatInput：按键由编辑器处理，焦点在技能等 slot 内的按钮上时，Enter 只激活该按钮，不再同时选中面板高亮项；Safari 中输入法确认用的 Enter 不再选中面板项；`transformer` 变化后 top slot 收到的 `content` 立即更新。
- 破坏性（深路径导入）：`@fibrae/semi-ai-foundation` 中 Chat foundation 的 `onMessageSend`、`onHintClick`、`onInputChange` 改名为 `sendMessage`、`handleHintClick`、`handleInputChange`，AIChatDialogue foundation 的 `onHintClick` 改名为 `handleHintClick`，不再与 props 回调同名。
- 破坏性（类型）：删除 `AIChatInputLeftMenuChangeProps`（foundation 的 `LeftMenuChangeProps`），`onConfigureChange` 的参数类型统一为 `AIChatInputSetup`，即 `MessageContent.setup` 的类型。
- 破坏性：`streamingResponseToMessage` 返回 `{ messages, state }`，与 `streamingChatCompletionToMessage` 同形：`messages` 含 0 或 1 条消息，原 `nextState` 改名 `state`（收到 `response.completed` 后为 `null`），chunks 为空时返回 `{ messages: [], state: prevState ?? null }` 而非 `null`；`streamingChatCompletionToMessage` 返回的 `state` 改为必有。data-adapter 深路径中 OpenAI 报文的 `ImageGenerationCall` 改名 `WireImageGenerationCall`，与消息内容项 `ImageGenerationCall` 区分。
- Solid 破坏性（类型）：AIChatInput `renderActionArea` 的 `menuItem` 改为 `(() => JSX.Element)[]`，在插入处调用，没调用的不创建；粘贴上传、`openFileDialog` 与 `uploadProps.ref` 改走一个常驻的隐藏 Upload，自定义操作区不渲染上传按钮也能粘贴上传，`showUploadButton` 为 `false` 时 `menuItem[0]()` 不渲染内容。
- React：AIChatInput 的 `onContentChange`、`onStopGenerate` 不再以 `noop` 为默认值。
- AIChatInput：打开 skill 面板时关闭模板面板，两个面板不再同时打开；编辑器补上 Gapcursor 的样式，经 `extensions` 传入 Gapcursor 时块间光标可见（Dropcursor 用内联样式，无需规则）。
- Vue、Svelte：AIChatDialogue、Chat 的代码块被 rehype 插件拆成元素时不显示语言栏与复制按钮，同 React、Solid。
- React、Vue、Svelte：AIChatDialogue、Chat 带语言栏的代码块外层不再包 markdown 的 `pre`（div 不是 `pre` 允许的内容），同 Solid；没有 `pre` 的默认上下外边距。

### Spin、Skeleton

- Spin 的加载指示器由 `div` 改为 `<output>`；加载中被包裹内容带 `inert`（List、Table 的 `loading` 同样），不可聚焦；`className` 落在根元素并与 `wrapperClassName` 合并；破坏性（类型）：Skeleton 占位的 `size` 只接受 `extra-extra-small` 到 `extra-large`，`shape` 只接受 `circle`、`square`，`Skeleton.Paragraph` 不再声明 `type`，`GenericProps` 即 `AvatarProps`。Vue：Spin 的 `indicator`、`tip`、Skeleton 的 `placeholder` 改为同名插槽；`Skeleton.Image`、`Title`、`Button` 不接受 `size`、`shape`；类型改名为 `SkeletonBasicProps`、`SkeletonAvatarProps`、`SkeletonParagraphProps`，`GenericProps` 删除。
- Svelte：Skeleton 的 `placeholder` 是 snippet，内容用 `children`；`Skeleton.Avatar`、`Title`、`Button`、`Image`、`Paragraph` 另有同一引用的具名导出 `SkeletonAvatar` 等。

### Space

- 不再展开 Fragment 与嵌套数组，条件兄弟切换不再重挂载有状态子组件；用户 `style` 的 `columnGap`、`rowGap` 始终优先于数字 `spacing`；破坏性（类型）：`spacing` 数组类型收窄为 `[Spacing, Spacing]`，CardGroup 的 `spacing` 同步收窄。Vue：直接渲染默认插槽，不包裹子节点，数字 `spacing` 输出 `px`。
- Solid：同 Vue，直接渲染 `children`，不包裹子节点，数字 `spacing` 输出 `px`。
- Svelte：同 Vue，直接渲染 `children`，不包裹子节点；`style` 只接受字符串，使用方的 `gap` 优先。

### Divider

- `children` 全是文本（含数字 `0`）时包进 `semi-divider_inner-text`；无文字内容时根元素带 `role="separator"`，可用 `role` 覆盖。Vue：内容用默认插槽，规则相同。
- Svelte：`layout` 为 horizontal 且传了 `children` 时算带文字，内容一律包进 `semi-divider_inner-text`（不区分纯文本与元素）。
- 破坏性（深路径导入）：`@fibrae/semi-foundation/divider/constants` 的 `cssClasses.PREFIX` 由 `semi` 改为 `semi-divider`。

### Progress

- 破坏性：`stroke` 与 `strokeGradient` 颜色改由浏览器解析，色板名输出 `var(--semi-blue-5)` 形式，渐变中间色用 `color-mix`；逗号与斜杠混写的颜色（如 `hsla(125, 50%, 46% / 1)`）不再被接受，改为合法 CSS；`@fibrae/semi-foundation/progress/generates` 的 `generateColor` 改为输出 CSS 表达式；删除 `ProgressState` 子路径导出。
- 破坏性（类型）：`ProgressProps` 不再接受 `children`，`motion` 收为 `boolean`；`type="circle"` 且 `size="large"` 按 default 渲染为 72px。Vue：`format` 改为 `#format="{ percent }"` 插槽；`percent` 为 NaN 时抛 `[Semi Progress]:percent can not be NaN`。
- Svelte：`format` 是 snippet，参数 `{ percent }`；`percent` 为 NaN 时同样抛错。
- 线形进度条的文字不收缩、不换行，`format` 返回长文字时进度轨随之变短。

### Empty

- 破坏性（类型）：`image`、`darkModeImage` 的对象形式只接受 `{ id: string }`；`image` 传空字符串视为无图片；插画 `alt` 为空，标题渲染为 `div`。Vue：`title`、`description`、`image`、`darkModeImage` 用同名插槽，默认插槽是底部操作区；暗色模式挂载后观察 `document.body` 的 `theme-mode`。
- Solid：暗色模式同 Vue，每个实例挂载后观察 `document.body` 的 `theme-mode`，挂载后再传入的 `darkModeImage` 也随之切换。
- Svelte：`title`、`image`、`darkModeImage` 是 `string | Snippet`（`image` 还可以是 `{ id }`），`description` 与 `children`（底部操作区）是 snippet；`imageStyle` 只接受字符串；传了 snippet 就渲染，不过滤渲染为空的 snippet；只有传了 `darkModeImage` 的实例才在挂载后观察 `document.body` 的 `theme-mode`。

### Feedback

- 破坏性（类型）：`FeedbackProps` 按 `mode` 判别（`FeedbackModalProps` 的 `mode` 必填为 `'modal'`，`FeedbackSideSheetProps` 为可选 `'popup'`），popup 下传 Modal 专属属性报类型错误；`onCancel` 参数为 `React.MouseEvent | KeyboardEvent`；checkbox 的 `onValueChange` 值为 `(string | number | boolean)[]`；popup 模式默认开启 `closeOnEsc`，按 Esc 触发 `onCancel`（原不响应）；表情选择改为 `role="radiogroup"` 的原生 radio，外层 `span` 改为 `label`；radio、checkbox 选项组需用 `radioGroupProps`、`checkboxGroupProps` 的 `aria-label` 命名。
- 破坏性（类型）：`textAreaProps`、`radioGroupProps`、`checkboxGroupProps` 去掉 `value`（Vue 为 `modelValue`），传入也不再覆盖 Feedback 的值；其中的 `onChange` 仍在 Feedback 处理后调用。
- Vue：`visible` 支持 `v-model:visible`，取消路径在 `onCancel` 返回后发出 `update:visible(false)`，确定只调用 `onOk`；`onOk`、`onCancel` 仍是函数 prop，其余回调为事件 `valueChange`、`afterClose`、`afterVisibleChange`；children、`renderContent`、`footer`、`title`、`modalRender` 等节点改为插槽（`#content`、`#modal`、`#radioLabel` 等）。
- Solid：`class`、`style` 与 `data-*` 落在 SideSheet 或 Modal 的外层元素（同这两个组件）；`onOk`、`onCancel` 返回 Promise 时按钮显示加载态，其他返回值（如 signal setter 的结果）被忽略；内容随弹层的显示创建与释放。
- Svelte：Feedback 的 `visible` 可绑定；`title` 是字符串或 snippet，`content`（参数含 `content`）、`footer`、`closeIcon`、`children` 是 snippet，单选、多选的选项文字用 RadioGroup、CheckboxGroup 的选项 snippet；回调为 `onOk`、`onCancel`、`onValueChange`、`afterClose`、`afterVisibleChange`；`okButtonProps`、`cancelButtonProps` 的点击用原生 `onclick`；根元素经 `bind:this` 后调用 `getRoot()` 获取。
- Svelte：`FeedbackProps` 是 Feedback 自身属性与 Modal、SideSheet 属性的合并类型，另导出 `FeedbackModalProps`、`FeedbackSideSheetProps`。

### JsonViewer

- 破坏性（类型）：`JsonViewerProps` 不再接受 `children`、`dangerouslySetInnerHTML`，删除从未生效的 `renderTooltip`；`value`、`width`、`height` 改为可选；`ref` 为 `JsonViewerHandle` 而非类实例；`options` 默认值按键合并，只传部分选项时 `autoWrap` 仍为 `true`；`customRenderRule` 的 `render` 返回 `null`、`undefined`、`false` 时保留 token 原文。
- 搜索栏容器由 `div` 改为原生 `search` 元素（类名不变，`div.semi-json-viewer-search-bar-container` 选择器需改），大小写、正则、全词选项改为按钮，自定义语言包需补 `JsonViewer.caseSensitive`、`JsonViewer.regex`、`JsonViewer.wholeWord`、`JsonViewer.replaceWith`；替换输入框的可访问名称改用 `replaceWith`（中文「替换为」、英文「Replace with」），不再与「替换」按钮同名。Vue：`value` 改名 `modelValue` 配合 `v-model`；`customRenderRule[].render` 改为 `#customRender="{ item, index, content }"` 插槽；`renderSearchButton` 改为 `#searchButton`。
- 构建插件配置了 `prefixCls` 时，悬停字符串值同样触发 `hoverNode`（原来判断写死了 `semi-` 类名，自定义前缀下悬停字符串值没有反应）。
- Solid：`ref` 拿到根元素 `JsonViewerElement`，其上带 `JsonViewerHandle` 的方法；破坏性（类型）：`renderSearchButton` 的第一个参数改为创建默认按钮的函数 `() => JSX.Element`，在插入处调用 `defaultButton()`；`renderSearchButton` 只调用一次，`searchControls.showSearchBar` 是随状态更新的 getter，需要在返回的 JSX 中读取；`customRenderRule[].render` 返回 JSX，放进带 token 类名的 span，在继承 JsonViewer 所在位置 context 的独立 root 中执行，下一次布局或卸载时释放；搜索栏用 `preventDefault` 认领 Esc，祖先元素的 JSX 处理函数收不到，document 上的监听仍会收到已标记 `defaultPrevented` 的事件（React 中收不到）。
- Svelte：`value` 可绑定（`bind:`、函数绑定、单向、不传），变化同时触发 `onChange`；`customRender`、`searchButton` 为同名 snippet，参数分别是 `{ item, index, content }` 与 `{ defaultButton, showSearchBar, onToggleSearchBar, onSearch, onPrevSearch, onNextSearch, onReplace, onReplaceAll }`，`defaultButton` 是 snippet，用 `{@render}` 渲染。
- Svelte：实例方法 `getValue`、`format`、`search`、`getSearchResults`、`prevSearch`、`nextSearch`、`replace`、`replaceAll`、`getStyle` 经 `bind:this` 调用。
- `getValue()`、`format()` 在编辑器不存在（挂载前、隐藏后）时返回 `''` 或什么也不做，不抛错。
- 折叠区域超过 65535 个时不再抛错。
- `options` 按内容比较，内容未变且 `value` 与编辑器文本一致时不重建编辑器。
- 可编辑的编辑器只在内容区已有焦点时恢复光标：搜索、切换搜索选项、上一个或下一个匹配、替换、全部替换和滚动不再把焦点移到内容区，焦点留在原控件上；点击补全建议项时焦点留在内容区。
- `getSearchResults` 的返回类型写为 `FindMatch[] | null | undefined`，`FindMatch` 从 `@fibrae/semi-json-viewer-core` 与 foundation 的 `json-viewer/foundation` 导出。
- worker 首次回复前就编辑不再抛 TypeError、丢失重绘；补全建议变少后按 Enter 不再抛错。

### Collapse

- 破坏性：删除 `reCalcKey`（Collapsible、Collapse.Panel）与静态方法 `Collapsible.getEntryInfo`；`onChange` 事件类型收窄为 `MouseEvent`，`activeKey` 类型加入 `null`（受控空值，`''` 与 `null` 收起全部面板）；Collapsible 的高度过渡改用 `calc-size(auto, size)`，外层不再有内联 `height`，改由 `--semi-collapsible-height` 写入。不支持 `calc-size()` 的浏览器（Firefox、Safari）同样播放高度动画，时长与曲线不变，`onMotionEnd` 在动画结束时调用。
- 面板头部按 APG accordion 改为原生 `<button class="semi-collapse-header-button">`，`extra` 与展开箭头在按钮之外；`clickHeaderToExpand={false}` 时点击标题与箭头展开，点击 `extra` 不展开；收起内容带 `inert`。Vue：受控用 `v-model:activeKey`，`change` 载荷总是 `string[]`；`expandIcon`、`collapseIcon`、Panel 的 `header`、`extra` 改为插槽；`onMotionEnd` 改为 `motionEnd` 事件；Collapsible 的 `className` 改为 `class`。
- Collapsible 使用方传入的 `onTransitionEnd` 不再被内部处理覆盖。
- 面板较窄时 `extra` 不再收缩，标题更早截断。
- `keepDOM` 加 `lazyRender` 时，面板内容消失后「展开过」的记录随之复位，内容在收起状态下恢复时不渲染、头部不带 `aria-controls`，重新展开后才渲染。
- Solid：`Collapse.Panel` 按是否传入 children 判断有无内容，不对 children 求值，求值为空的 children（如 `{cond() && <X />}` 为 false）仍渲染空内容区并启用箭头。
- Svelte：受控值用 `bind:activeKey`，没有 `defaultActiveKey`；`expandIcon`、`collapseIcon` 与 Panel 的 `header`、`extra` 是 snippet；`onMotionEnd` 是 Panel 与 Collapsible 的回调 prop；Panel 写在 Collapse 外抛错；导出为 `Collapse` 与 `CollapsePanel`，`Collapse.Panel` 与 `CollapsePanel` 是同一组件；Panel 按是否传入 `children` 判断有无内容。
- Collapsible：在 `display: none` 下切换时立即结束并触发 `onMotionEnd`。

### BackTop

- 破坏性（类型）：`BackTopProps` 收窄为实际接受的属性，不再含按钮的 `type` 与 `form*`；`target` 类型为 `() => Window | HTMLElement | null`；`ref` 指向 `HTMLButtonElement`。
- 破坏性：基于 FloatButton 渲染为原生 `<button>`，新增 `icon`、`shape`、`size`、`colorful`、`badge`；`<BackTop><IconArrowUp /></BackTop>` 改为 `<BackTop icon={<IconArrowUp />} />`，宽高、圆角、背景色改用 `shape`、`size`、`colorful`，`.semi-backtop > .semi-button` 选择器改为 `button.semi-backtop`，覆盖定位需 `.semi-floatButton.semi-backtop` 的权重。Vue：`onClick` 改为 `click` 事件（经 `duration` 节流），`children` 为默认插槽，`icon` 为 `#icon`，`badge.count` 节点用 `#badgeCount`；`overrideDefaultProps.BackTop` 不能设置 `click`。
- Svelte：BackTop 的 `onClick` 改为 `onclick`（经 `duration` 节流）；`children` 是静态内容的 snippet，`icon`、`badgeCount` 是 snippet；`overrideDefaultProps.BackTop` 不能设置 `onclick`。
- 点击按 `duration` 节流，窗口内多次点击合并为一次 trailing 调用；`duration` 在点击间变化时，旧窗口内待补的那次点击不再触发。

### Timeline、List

- 破坏性（类型）：List 的 `grid` 只接受 Row 与 Col 的指定属性，不再接受任意 div 属性（如 `id`）；Timeline `dataSource` 项的 `Data` 不再接受 `children`，改用 `content`。
- 可点击的 List.Item 在 li 内渲染原生 `<button>` 作为唯一焦点目标，`tabIndex`、`aria-*` 落在按钮上，点击 `extra` 内元素不再触发 `onClick`，children 中的交互内容需移到 `extra`；新增类名 `semi-list-item-clickable`、`semi-list-item-button`；可点击的 Timeline.Item 的 children 外包一层 `role="button"` 的 `semi-timeline-item-content-main`；依赖 `.semi-list-items .semi-list-empty` 的选择器改为 `.semi-list-empty`；`children` 为空数组时显示空状态。
- Vue：Timeline 的 `dataSource` 项 `content`、`time`、`extra` 只接受 `string | number`，自定义内容用 `#content`、`#dot`、`#time`、`#extra` 插槽；List 的 `renderItem` 改为 `#item="{ item, index }"`，`header`、`footer`、`emptyContent`、`loadMore` 改为同名插槽，`onClick`、`onRightClick` 是函数属性（写 `@click`、`@rightClick`），`grid` 里 `className` 改为 `class`。
- Solid：Timeline 的 children 中只渲染 `Timeline.Item`，文本等其他子节点不渲染并在开发期告警；放在 Timeline 外的 `Timeline.Item` 单独写时不渲染，在数组中显示为 "[object Object]"；`extra`、`time` 为 `0` 时渲染对应区块。
- Solid 破坏性（类型）：Timeline `dataSource` 项的 `content`、`time`、`extra` 只接受 `string | number`，删除 `dot` 字段，自定义内容用 `renderContent`、`renderDot`、`renderTime`、`renderExtra`（参数 `(item, index)`，`renderDot` 没有默认值）。`Timeline.Item` 的 `dot`、`time`、`extra` 不变。
- Solid：可点击的 List.Item 的 `ref` 为 li，`focus()`、`blur()` 作用于项内按钮；`renderItem` 同 `<For>` 回调一样不追踪，只在 `renderItem`、项或 index 变化时重算该行，函数体中 JSX 之外读取的 signal 变化不会重算。
- Svelte 破坏性：Timeline 不提供 `Timeline.Item`，只用 `dataSource` 加 `content`、`time`、`extra` snippet（参数 `{ item, index }`）；自定义圆点逐项设置：`TimelineData.dot?: Snippet`，设了的节点按自定义圆点（`head-custom`）渲染，未设的节点画默认圆点，没有组件级 `dot` snippet；`dataSource` 项的 `class`、`style`（字符串）与其他 li 属性落在 `li` 上。
- Svelte：导出为 `List`、`ListItem`；`onClick`、`onRightClick` 是函数 prop，类型中去掉了小写的 `onclick`、`oncontextmenu`；`item`、`header`、`footer`、`emptyContent`、`loadMore`、`children` 都是 snippet，`item` 参数 `{ item, index }`。
- Svelte：空状态按 `children` snippet 是否存在判断（Vue 版按内容是否为空）；ListItem 的 `header`、`main`、`extra` 同样按 snippet 是否存在判断。
- Timeline（React）：`extra`、`time` 为 0 时渲染在各自容器内，不再作为裸文本出现在正文后。
