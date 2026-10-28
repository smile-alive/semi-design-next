# Solid 组件写法

semi-ui-solid 的写法。框架版本以其 `peerDependencies` 为准（Solid 1.9）。组件内语句顺序、foundation 与属性透传等共享规则见 `.agents/references/components.md`，本文只写 Solid 实现。宿主原语的设计与实测依据在 `_base/use-foundation.ts` 的注释与 `_base/__tests__/host-contract.test.tsx`；Solid 决策与 1.9 实测（X*、S-H*）见 `docs/decisions.md` 的「3. Solid」。

## 硬性规则

- 对外导出的顶层组件调用 `useDefaultProps('Button', props, defaultProps)`（F7），名称用导出名，并在 `_utils/semi-global.ts` 的 `OverrideDefaultProps` 中补 `Button?: GlobalDefaults<ButtonProps>`。
- 不解构 props（`solid/no-destructure`），在 JSX、`createMemo` 和派生函数里读 `props.x`。

## 公开 API

- prop 名、回调签名与受控 prop 以 semi-ui-react 为准（`checked`、`value`、`activeKey`，回调 `onChange(value, event)`），只按 Solid 原生写法改：`className` 改为 `class`（Semi 自己的 `contentClassName`、`wrapperClassName` 等保持原名），`style` 接受对象（键用 kebab-case）或字符串，`ref` 是回调，React 的 `ReactNode` 改为 `JSX.Element`，render 类函数 prop 返回 `JSX.Element`。不照搬 Vue 的插槽、emit 与 `modelValue`。
- 目录与文件用 kebab-case，组件写在 `.tsx`，`index.ts` 汇总导出组件与 `XxxProps` 等类型；包入口 `src/index.ts` 再导出。组件用 `function` 声明：`export default function Button(props: ButtonProps)`，子组件挂载用 `Object.assign(Tabs, { TabPane })`。
- 不写 `elementType`：Solid 读不到子组件的类型（S-H4），识别子项见下文「子项」。

## props

- 在组件体顶层把 prop 读进普通变量会丢失响应，只有确实只取初始值的（`defaultValue` 类）才这样写，并注释原因。
- 再用 `splitProps(props, [...])` 分出组件声明的每个属性，其余 `{...rest}` 写在根元素的显式属性之前（F2）。class 写 `class={clsx(内部类, local.class)}`；style 需要与内部样式合并时把使用方的放在后面。组件自己也处理的事件（如 `onClick`）从 rest 中拆出，在自己的处理函数里先调 `_base/call-handler.ts` 的 `callHandler(local.onClick, event)`：展开与显式写法同时出现时只有一个生效。
- Props 类型写成 `interface XxxProps extends ElementProps<'button', 'type'>`（`_base/element-props.ts`），参数含义与 React 版相同（F6）；必须是 `interface ... extends`。
- 根元素不是焦点目标时（Switch 的根是 div、控件是 input），在 `splitProps` 取走自有 props 之后，用 `_base/control-attrs.ts` 的 `splitControlAttrs(props, isNativeInputKey)` 拆分：`aria-*`、`id`、`name`、`tabIndex`、`autofocus`、`onFocus`、`onBlur` 交给控件，其余落在根元素。不在创建时收集键名，也不手写键数组，拆出的两半是活视图。
- Form 会包装的字段组件先 `splitProps(omitFormInjected(props), [...])`，丢弃 `validateStatus`、`insetLabel`、`insetLabelId`。
- 父组件下发、子组件自身值优先的 prop（Button 的 size、type、theme、disabled、colorful 由 ButtonGroup 下发）不写进 `defaultProps`，在派生函数里按共享规则的「组值回落」顺序回落。组配置会穿过 Portal，消费方用 `_base/popup-layer.ts` 的 `usePopupLayer()` 比较层级，只继承同层的组。
- 判断是否传入 JSX 内容（`children`、`title` 等）可以写 `'key' in local`：`splitProps` 保留键的存在性，读键不触发 getter、不创建 JSX（card、collapse/panel、select/utils 即此用法）。`useDefaultProps` 合入的组件默认值键与全局默认值（`overrideDefaultProps`）的键在 props 上同样存在，所以只对不会出现在默认值里的 JSX 字段这样写。受控判断仍只看值是否为 `undefined`，不用 `in`（共享规则）。
- `defaultProps` 写在模块顶层，`satisfies Partial<ButtonProps>`。全局默认值里的 DOM 节点由 `readGlobalDefaults` 丢弃并告警：一个节点只能挂在一处，各实例会互相搬走它；字符串与图标组件照常生效。

## 响应式与渲染

- 派生值写成 `const x = () => ...`；计算较重、或结果要作为对象身份下发（context 值、传给子组件的数组）时用 `createMemo`，需要按内容去重时给 `createMemo` 传 `{ equals }`。
- `props.children` 每次读取都会重新创建子节点：只在 JSX 里读一次；要判断有无内容或读多次时，用 `children(() => props.children)` 解析一次，再读它的结果。JSX 类 prop（`icon`、`tip`）同样处理；有无内容用 `_base/has-content.ts` 的 `hasContent(resolved())` 判断（`0` 算有内容），不用真值判断。React 用 cloneElement 给图标定尺寸的位置，用 `_base/icon-slot.ts` 的 `createIconSlot(source, size, className?)` 解析：槽位经 `IconSlotContext` 向其中创建的 Semi 图标下发尺寸与类名，图标登记自己渲染的节点，`kind()` 据此区分 `text`、`icon`、`node`；未自带尺寸的图标取该尺寸。
- 条件与列表用 `<Show>`、`<Switch>`/`<Match>`、`<For>`（按项身份）或 `<Index>`（按位置），运行时决定的标签或组件用 `<Dynamic>`；不在 JSX 里对数组 `.map`。
- 由别的值引起的状态变化按三档选写法，优先靠前的：(1) 能写成派生值就写派生值或 `createMemo`（含用上一次结果的 `createMemo((prev) => ..., 初值)`，如 collapse/panel 的 `everOpened`）；(2) 必须在同一次提交内写入、或属于注册类副作用时用 `createComputed`（`form/with-field.tsx` 在字段路径变化时重新注册，`_base/use-record-focus.ts` 在 DOM 更新前记录焦点）；(3) 其余用 `_base/use-watch.ts` 的 `useWatch(source, fn)`。三档都是 X15 的 Solid 2.0 迁移项，包在 `batch` 里的写入也一样，迁移时一并处理。
- 组件体、memo 与 JSX 表达式里不调用 foundation 的写方法、不写 signal：Solid 1 在这些位置写入既不报错也不告警（S-H2），只能靠写法保证。
- Solid 的 ref 回调里可以写 signal 来记录元素（Kobalte setTriggerRef 的写法）；组件体、memo 和 JSX 表达式里仍然不写 signal。

## 服务端渲染

共享规则见 `.agents/references/components.md` 的「服务端渲染」，本节是 Solid 的执行模型。

- 服务端执行组件体、`createMemo`、`createRenderEffect`、`createComputed` 与 `onCleanup`，不执行 `onMount`、`createEffect` 和原生元素的 `ref`；`renderToString` 结束后在定时器里释放根，`onCleanup` 里抛出的错误成为未捕获异常。所以释放 DOM 资源的 `onCleanup` 登记在 `onMount` 里，只在 render effect 里做的 DOM 写入先判断 `isServer`（`solid-js/web`）。只有浏览器能渲染的内容（读 `document` 的弹层容器、`getPopupContainer`）用 `_base/use-mounted.ts` 的 `useMounted()` 门控，不手写 `createSignal(false)` 加 `onMount`。不引用 `sharedConfig` 判断是否在 hydration 中：Solid 在服务端渲染期间同样设置 `sharedConfig.context`，纯客户端渲染时它为空，都不等于「DOM 已挂上」；要在已挂载的 DOM 上查询的（`getPopupContainer`）用 `useMounted()`。弹层打开时记录焦点用 `_base/use-record-focus.ts` 的 `useRecordFocus(scope, visible)`。
- 服务端 JSX 求值为 `{ t: string }` 对象，没有 `Node`、`Element`：子项登记、类型判断与槽位识别都在组件体里按身份完成（见「子项」和 `createIconSlot`），不在 ref 回调或解析后的 DOM 上做。
- JSX 在读取 getter 的地方创建，创建了却没插入的元素在服务端没有对应标记，hydration 会错位。写法与 `solid-js` 自身一致：`Show` 只在显示的分支里读 `children` 或 `fallback`，`ErrorBoundary` 的 `fallback` 接受 JSX 或 `(err, reset) => JSX`，`children()` 就是 memo 加 resolve。
    - JSX prop 只在显示它的那个分支里读，且只读一次（Button 加载时不读 `icon`）。多处要用时用 `children()` 解析一次再复用，判断和插入都读这一个结果；不在组件体里解析之后只在某一个分支插入：`createMemo`（含 `children()`）在创建时立即求值，组件体里一声明就创建其中的 JSX，所以显示条件写进 thunk（`children(() => (shown() ? local.extra : undefined))`），或只在显示分支里读。
    - 组件要把数据交给内容时用带参数的渲染函数，类型写成 `JSX.Element | ((...args) => JSX.Element)` 联合类型，读到函数就在插入处传参调用（`ErrorBoundary` 的 `fallback`、`tooltip` 的 `PopupContent`），不用 `as unknown as JSX.Element` 把函数当作 JSX 传递。
    - 数据对象里不放 JSX，也不放 getter。列表、树、表格类数据只放数据（`label: string | number`），内容交给 `renderXxx` 或列的 `render`，与 Vue 版一致。
    - 只为检查而读取的 JSX（是不是纯文本、有没有内容）改为检查插入处解析出的同一个结果；做不到时，为检查提供单独的非 JSX prop。首帧不插入的项（超出 `maxCount`、折叠、弹层里）写成「数据 + 渲染函数」，由显示它的分支自己创建。不在 hydration 编号之外读取 JSX：那要改写 Solid 的内部字段 `sharedConfig.context`。
- 服务端要从标记里读属性时用 `_base/is-markup.ts` 的 `serverHtml` 取 HTML 字符串，不在各处断言 `{ t }` 形状。
- 原生元素上服务端与浏览器写法不同的属性：受控文本用 `attr:value`（input）、`textContent`（textarea）带进服务端 HTML，两端都写，浏览器显示的文字仍由 ref 与同步函数写 `value` 属性（不用 `value` 绑定：它在输入法组合中也会写入）；`isServer` 只用来跳过副作用，不决定输出的标记（唯一例外：Tooltip 函数 children 外包的 span，见「触发器」）；布尔属性用小写的 HTML 名（`readonly`），驼峰的 `readOnly` 在服务端输出 `readOnly="false"`。

## context

- 用 `_base/create-context.ts` 的 `createContext<T>(name, options?)`，每个组件目录一个 `context.ts`，导出 `[XxxContext, useXxxContext]` 与值类型；提供方写 `<XxxContext.Provider value={...}>`。必选、`{ optional: true }`、`{ defaultValue }` 的语义见共享规则。带默认值的 context 不能被重置为 `undefined`（S-H3）。
- 值形态：只有数据时下发 `Accessor<T>`（`createMemo`）；带方法时下发 `{ view: Accessor<View>, ...方法 }`；不变的标识值直接下发。读取方调用访问器，不在组件体顶层解包。
- ConfigProvider 与 LocaleProvider：`useConfig()` 返回 `Accessor<ContextValue>`，`useLocale(componentName)` 返回 `Accessor<LocaleResult>`，可访问名称与内置文案都从它读。

## 有 foundation

- `useFoundation<Foundation, Adapter, P, S>(Foundation, props, initialState, createAdapter, options?)` 返回 `{ foundation, state }`，`state` 是访问器。泛型要显式写，调用前声明 `type Foundation = ...; type Adapter = ...;`。adapter 只补组件特有的方法，回调 prop 经 `notify*` 调用（`base.getProps().onChange?.(...)` 或直接读 `props.onChange?.(...)`）。
- `state()` 的返回值是只读视图：按 key 读、展开、`Object.keys`、`in` 都只看到 state 自身的键，读到的是当时的值；展开得到的是快照，要随 state 更新就在跟踪作用域里按 key 读。
- state 按 key 订阅：表达式读 `state().x` 只订阅 `x`，只写其他 key 时不重新执行；直接写 `state().x`，不为隔离再包 `createMemo`。`state()` 本身不订阅任何 key。写入即通知，同值也通知（与 React、Vue 每次 `setState` 都重新渲染一致，foundation 原地修改 Set 或对象后写回也能生效）；驱动副作用、必须按值变化才执行一次的派生（Tooltip 的 `phase` 驱动 `showPopover`）用 `createMemo` 按值去重。一次 `setState` 写多个 key 时一起通知，读多个 key 的表达式只执行一次。
- 返回的 foundation 把每次方法调用包进 `batch`，一次事件处理只提交一次；一个处理函数连续调用多个 foundation 方法时，整体再包一层 `batch`。foundation 自己的定时器、请求回调里的多次 `setState` 逐次提交，依赖一次提交的组件在 foundation 内合并写入。
- 受控 prop 与 state 合成的显示值，在渲染期用 foundation 的静态纯函数派生（Switch 的 `SwitchFoundation.deriveChecked`），不靠 effect 追平 state。prop 变化同步到 foundation 写 `useWatch(() => props.x, (value) => foundation.handleX(value))`（`_base/use-watch.ts`），与 React 的 `prevProps.x !== props.x` 一致：它和创建时读到的值按 `Object.is` 比较，值没变不调用。state 在创建时取值的不用 `createEffect(on(..., { defer: true }))`：deferred effect 和首次运行时的值比较，父组件 `onMount` 里改的受控值会被漏掉；不经 memo 时，使用方展开信号对象（`<X {...p()} />`）任何一个键变化都会通知全部键，回调在值没变时重跑，把非受控状态写回 `undefined`。使用方每次传新对象时在 source 里先派生出可比较的值（Carousel 的 `isAutoPlayOn`），或在回调里按内容比较。不经 `useWatch`、直接在 effect 里读 prop 再调 foundation 的写法同样要经 memo。基准是 state 最后一次从 prop 取值的时刻：state 在创建时取值用 `useWatch`；foundation 的 `init` 在 `onMount` 里再读同一 prop 时（Tooltip 的 trigger、visible，DatePicker 的 value、timeZone），基准是 init 读到的值：写在 `useFoundation` 之后的 deferred `on` 首次运行紧跟 init，正好以它为基准。不要再加一个创建时记下的前值变量，否则 init 前的变化会被再应用一次（时区被二次换算）或在改回原值时漏报；也不要用「previous 为 undefined 就返回」代替 defer，source 能取 undefined 时从 undefined 变化的那一次会被跳过。
- `setState` 回调在宿主的 effect 里执行，晚于 DOM 更新、早于组件自己声明的 effect。`connect`、`init` 在 `onMount`，`destroy`、`disconnect` 在 `onMount` 里登记的 `onCleanup` 中：服务端渲染不挂载，只释放，destroy 不会在那里访问 DOM。这两个清理属于 `onMount` 的计算，先于组件顶层的 `onCleanup` 执行。

## 无 foundation

- 状态直接用 `createSignal`；受控判断按值是否为 `undefined`，清空与保留最后受控值的语义同「有 foundation」一节。

## 事件、ref 与生命周期

- 委托事件（`onClick`、`onKeyDown`、`onFocusIn` 等）沿组件树冒泡，Portal 内的事件会冒泡到逻辑父元素的 JSX 处理函数，原生监听收不到（S-H5）。需要捕获阶段、`passive` 或不冒泡的事件时，用 `_base/use-event-listener.ts` 的 `useEventListener(target, type, listener, { enabled, capture, passive })`：`target`、`enabled` 是访问器，目标变化时重新绑定，销毁时移除。观察 DOM 变化、把回调排到下一帧，同样用 `_base` 的 `useMutationObserver`、`useRaf`（在组件顶层调用），不手写 MutationObserver、`requestAnimationFrame` 加 `onCleanup`。
- 元素 ref 写函数形式 `ref={(node) => (el = node)}`（lint 原因见 [lint](lint.md)）。ref 回调运行时元素还没接入文档（S-H7），测量、聚焦放 `onMount` 或之后的 effect。使用方的 `ref` 随 `{...rest}` 落到根元素；组件自己也要根元素时写 `ref={mergeRefs(local.ref, (node) => (root = node))}`（`_base/merge-refs.ts`）。原生元素的 ref 表达式在创建元素时同步求值，不在 `use` 的 untrack 内；元素位于 Provider、Show、Switch 的 children 或 fallback 中，或由被跟踪作用域调用的 helper 创建时，写 `ref={untrack(() => mergeRefs(local.ref, ...))}`，否则外层 memo 跟踪这次读取，使用方展开信号对象时任一键变化都会重建整棵子树。
- 根元素不是焦点目标的组件（Switch、Checkbox、Input、Slider 等）不提供命令式 handle：使用方的 `ref` 仍拿根元素，在根元素的 ref 回调里调 `_base/forward-focus.ts` 的 `forwardFocus(root, target)`，让 `ref.focus()`、`ref.blur()` 落到控件上，`target` 也可以返回根元素本身（如根元素即 combobox 的 Select）；组件内部要绕过被替换的 `focus()` 聚焦根元素时用同文件的 `focusElement`；需要原生元素的另给 `inputRef` 类 prop。React handle 上 `focus()`、`blur()` 之外的方法，有 DOM 等价做法的（PinCode 的按位聚焦）不提供，差异写进 release-notes；元素做不到的（Select 的 `open`、`selectAll`）在根元素的 ref 回调里挂到元素上，ref 类型写作 `SelectElement = HTMLDivElement & SelectHandle`。方法与元素原生方法同名而语义不同时按参数分派，原生用法保持可用（Tree 的 `scrollTo` 只接管带 `key` 的参数）。
- 点击外部用 `_base/use-click-outside.ts` 的 `useClickOutside(targets, onOutside, enabled)`：`targets` 是访问器数组，`enabled` 是访问器，`onOutside` 是普通回调。把返回的处理函数放在目标的 `onMouseDown` 上，Portal 内位于目标之下的按下才算内部（与 React 的 `onMouseDownCapture` 标记同一约定，不用 Vue 的嵌套列表）。
- 稍后才出现的元素（`Show` 内）用 signal 的 setter 当 ref；`useResizeObserver`、`useIntersectionObserver` 接收访问器。
- 自动聚焦经 `_base/autofocus.ts` 的 `autofocus(flag, element)`，在元素接入文档之后调用：静态元素写在 `onMount` 里，稍后插入的内容（弹层内容）写在响应其出现的 effect 里。
- 持有焦点的节点可能被自己移除时（自隐藏的按钮、重新挂载的项）用 `_base/use-focus-handover.ts`，卸载后把焦点交给指定目标。
- 状态变化需要屏幕阅读器播报时用 `_base/use-announcer.ts`，它提供常驻的 live region 文本。
- 复制到剪贴板并短暂显示「已复制」时用 `_base/use-copied.ts`。
- 无 role 的 div 有名称时需要 `group` 角色，用 `_base/named-role.ts` 的 `namedRole`。
- 进出场动画用 `_base/css-animation.tsx` 的 `useCSSAnimation`：变化的值传访问器，回调传普通函数；`ref` 放在动画元素上，`className()`、`style()` 写到该元素。它不管挂载：元素是否挂载由 foundation 状态决定，调用方在 `onAnimationEnd` 里卸载；一轮里没有运行中的 CSS 动画时立即结束。jsdom 的 `getAnimations()` 恒为空，测动画事件路径时 spy `Element.prototype.getAnimations`。
- 命令式 API（`Toast.info`、`Modal.confirm`）用 `_base/detached-render.ts` 的 `renderDetached` 渲染：树在任何 owner 之外，只读全局默认值与默认语言包；每次调用是一个新根，只能经 `code` 里读的 signal 更新；返回的 dispose 同步移除容器，在微任务里释放树。自建容器的调用方（Toast、Notification）在访问 `document` 之前先调同文件的 `assertClient()`，服务端调用抛出说明性错误。hook 形式返回 `[api, contextHolder]`，holder 在调用方的 owner 下创建，继承其 context。
- 渲染到 `getPopupContainer` 的浮层（Modal、SideSheet）用 `_base/popup-portal.tsx` 的 `PopupPortal`，它负责容器回落、`semi-portal` 包裹元素和外层 Tooltip 的弹层登记。
- 只渲染可见行的列表（Select、Cascader、Tree、TreeSelect、Transfer、Pagination、Table）用 `_base/virtual-list.tsx` 的 `VirtualList`（`@tanstack/solid-virtual`）。`height` 是像素数，按它计算可见行，不测量；`itemSize` 为函数且返回值变了而行数没变时，调用 handle 的 `measure()`。children 是 `(row) => JSX.Element`，每个行 key 只调用一次，`row.index`、`row.style`、`row.data`（即 `itemData`）都是活 getter，不解构；按身份复用行时传 `itemKey`，此时 `itemCount` 与 `itemData` 从同一来源派生或在同一个 `batch` 里更新，否则 `itemKey` 拿到和数据对不上的 index。`outerElementType` 把收到的 `ref`、`style`、`onScroll`、`children` 落到自己的滚动元素上，`innerElementType` 接收 `style` 和各行。行不可聚焦的列表传 `tabIndex={-1}`。
- 拖拽排序用 `_sortable` 的 `Sortable`（`@dnd-kit/solid`），手柄由 `renderItem` 参数的 `sortableHandle(() => 内容)` 取得组件再渲染。直接用 dnd-kit 时，`useSortable` 的输入写成 getter（`get index() { return props.index; }`），字面量只读一次；`DragDropProvider` 不传 `onDragOver`，传了之后放下时元素不回原位；父组件不接受新顺序时，在 dragend 之后的微任务里把 `sortable.index` 重置为 index prop，不重建列表，项节点与焦点都保留。
- 定时器、观察器和 document 监听在创建处配 `onCleanup`，卸载时一定释放。
- `onMount` 与 effect 同队列，和 `createEffect` 等保持原顺序；`onCleanup` 单独一队。

## 子项

- 在子项之间插入元素或包裹子项（ButtonGroup 的分隔线）：子项在组件体里经 context 把「自己渲染出的节点 -> 数据访问器」登记到父组件（`WeakMap`，见 `button/context.ts` 的 `useGroupItem`），父组件用 `children()` 解析出直接子项后按身份查表；不在 ref 回调里登记（服务端不执行 ref；Tooltip 的特殊触发器两端分别登记，见「触发器」），不读子项 DOM 的 class 反推数据。
- 判断解析后的子项是元素还是文本用 `_base/is-markup.ts` 的 `isMarkup`，不写 `instanceof Node`、`instanceof Element`：服务端没有 DOM 类，元素是 `{ t }` 对象。只在客户端有意义的 DOM 判断（克隆节点、丢弃全局默认值里的节点）写成 `!isServer && x instanceof Node`。
- 收集子组件数据（Tabs、Select、Steps）用 `_base/token.ts` 的 token：子组件 `return createToken('Parent.Child', props)`，标签用公开访问路径（`Tabs.TabPane`、`Select.Option`、`Steps.Step`）。
- `props` 原样保存子组件收到的 Solid props 对象，不复制、不 mergeProps：getter 让父组件读到的每个字段都是响应式的，子项 prop 变化不需要重新收集。
- 子组件体不读 `props.children` 和其他 JSX 字段；父组件在渲染位置读取，且每个 JSX 字段只在一个 JSX 位置读一次（每次读都会新建节点）。内容归读取处的 owner（For 项、Show 分支）所有，随之释放，context 也从读取处查找。子组件体不读 context：token 在父组件体的 `children()` memo 中创建，位于父组件的 Provider 之外。
- 父组件只调用一次 `children(() => local.children)`，再从 `resolved.toArray()` 中按 `isToken<P>(node, type)` 取出 token。非 token 节点由组件决定怎么处理：Tabs 当内容按原顺序渲染；Steps、Select 丢弃并调 `@fibrae/semi-foundation/utils/warning`。所以 helper 不带过滤策略参数。数组的 filter 类型守卫对 token 不生效，用 `flatMap((n) => isToken(n, type) ? [n] : [])`。
- 把 children 原样插入 DOM 之前先滤掉 token：token 单独插入时被跳过，但在数组中插入时 Solid 会把它渲染为 "[object Object]" 文本。
- render 类函数 prop（如 renderTabBar）用 `<Show keyed when={local.renderX} fallback={...}>{(render) => render(liveProps, Default)}</Show>` 调用：Show 的函数子项在 untrack 中执行，同一个函数只调用一次，传入的活对象只有在返回的 JSX 中读取的字段才被跟踪；必须加 keyed，否则非 keyed 的 Show 只按真假判断，换成另一个函数时不会重新调用。
- 需要「同一次更新」语义的派生（如 Tabs 的 forceDisableMotion）只在使用方用 batch 包住多次 set 时成立；不在 memo 中用 queueMicrotask 等副作用模拟 React 的自动批处理，差异写进 release-notes。

## 触发器

- 触发器类组件使用函数 children 加 `getTriggerProps(own)`。own 中不是 undefined 的值优先；null 表示移除属性或退出注入（`'aria-describedby': null` 表示退出描述，id 改由 useTooltipDescription 交给后代）；字符串形式的 aria-describedby、data-popupid 与组件自己的 id 用空格拼接；ref 会合并。需要与注入值合并的键必须作为 own 传入，写在展开之后会整体覆盖。
- `getTriggerProps` 这类以对象字面量为参数的泛型函数，类型参数用 const 修饰，避免 `type: 'button'` 这样的字面量被拓宽成 string 后无法赋给元素属性类型。
- Tooltip 把 tabindex、data-popupid、aria-* 作为 props 交给使用方展开，再由触发组件按 F2 的 rest 透传落到根 DOM。Tooltip 对触发器 DOM 只做两件事：给特殊触发器加内联 pointer-events: none、绑定原生事件监听。非函数 children 的属性全部落在 Tooltip 自己的 span 上。Tooltip 没有根 DOM，按 F11 丢弃未声明属性。
- 特殊触发器通过 SpecialTriggerContext 登记「触发器 -> 状态访问器」的 WeakMap，嵌套 Tooltip 复用外层的表。SpecialTriggerContext 定义在 `tooltip/context.ts`，归 Tooltip 所有；组件在组件体里调用同文件的 `useSpecialTrigger(() => ({ disabled, loading, block }), () => local.ref)`，只传组件实际有的字段，第二个参数是组件自己的 `ref` prop；不直接读写 WeakMap。
    - 浏览器：在根元素的 ref 回调里（与使用方的 ref 经 `mergeRefs` 合并）调用返回的登记函数，以元素为键。
    - 服务端不执行 ref，`useSpecialTrigger` 在组件体里以 getTriggerProps 交给组件的 ref 函数为键登记，Tooltip 在服务端按同一个 ref 查表。
    - Tooltip 函数 children 外包的 span 是 `isServer` 决定输出的唯一例外：服务端在 span 里直接输出 `output()`，浏览器由 effect 等父级 reconcile 完成后再用 `replaceChildren` 搬入，以保持触发器节点身份（见本节 reconcileArrays 一条），两端最终 DOM 一致。
- 在 Solid 下，弹层内的组件用 preventDefault 认领 Escape，不能用 stopPropagation：委托处理函数和 openLayer 的监听都在 document 上。
- 在不同分支之间搬动同一批节点时（例如运行时增加或去掉包裹元素），不要在新分支的 JSX 里直接插入这些节点：父级 reconcileArrays 会 remove() 旧列表中的节点，不管它当前在哪个父元素下。应在 effect 里等父级 reconcile 完成后再搬入，并且这个 effect 要同时订阅包裹元素和节点来源（children().toArray），用 replaceChildren 整体替换；只保留 Node，string、number 转为文本，丢弃 undefined、null、boolean。
- JSX 类型的 prop（例如 `showArrow={<Arrow />}`）每读一次 getter 就创建一次组件：用 `children()` 解析一次，之后的判断（包括 class 表达式里的布尔判断）都读解析结果，不要再读 props 上的 getter。
- 「JSX 或 render 函数」联合类型的 prop（Tooltip、Popover、Popconfirm 的 `content`）用 `tooltip` 导出的 `PopupContent` 渲染：在插入处的 owner 下用 memo 读一次 getter，读到函数就在跟踪作用域中调用并传入 renderProps，与 insert() 对待函数子节点一致。生产编译下 `<For>`、`<Show>` 和返回它们的组件求值得到 memo 访问器，也是函数，`untrack` 调用一次会冻结在首次快照。这与上文 renderX 类 prop 的「Show keyed、只调用一次」不同：renderX 只接受函数。触发器 children 仍按声明参数区分，因为 Tooltip 要先决定是否包 span。

## 测试

- 写法见 [testing](testing.md)。
