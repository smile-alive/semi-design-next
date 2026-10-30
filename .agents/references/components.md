# 组件写法

本文是各框架共用的组件写法。框架专属写法（声明、hook、属性落点、子项、测试）在各框架目录（`.agents/references/<框架>/`）的 `components.md` 中，每个框架文件开头的「硬性规则」优先。可以参照的现有组件见各框架文件。函数、导出、memo 的通用写法见 [coding-style](coding-style.md)，无障碍见 [a11y](a11y.md)。

## 组件内语句顺序

各框架的组件体按同一套分组排列，由 `pnpm lint:component-order` 检查，`pnpm lint:component-order --fix` 自动排序。每组包含哪些框架调用，以本框架 `lint/<框架>/component-order.ts` 的 `calls` 为准：

1. 导入、类型声明（类型声明放在组件输入之前）
2. 组件输入：默认值、props 的声明与合并、未声明属性与插槽的读取
3. 读取 context：`useXxxContext()`、`useLocale`、`useConfig`、`useSemiGlobal`
4. 本地状态：状态、ref、id 与 `let` 变量
5. composable：`useFoundation` 与其他取返回值的 `use*`
6. 派生值，以及渲染期与 setup 期的常量
7. 下发 context
8. 事件处理与内部函数，含 `debounce`、`throttle`
9. 副作用，以及不取返回值的 `use*`（`useDidUpdate`、`useEventListener`、`useResizeObserver`）
10. 生命周期
11. 对外句柄
12. 返回渲染结果的语句（函数式组件的 `return`）

- 组间空一行；事件处理与内部函数之间一律空一行；其他多行语句（watch、effect、生命周期回调、多行对象）前后各空一行；同组的其他单行语句连续写；前导注释前空一行，一条注释可以说明紧随其后的几条单行语句。
- 依赖优先于分组：语句不排到它读取的绑定之前，函数体内的读取和经其他绑定的间接读取都算（setup 与渲染期可能立即调用这些函数）。所以 `provideXxxContext({ select: handleSelect })` 排在 `handleSelect` 之后，读取渲染函数的派生值排在该函数之后。
- 注册类调用保持相对顺序：同一队列的注册调用（如 watch 之间、生命周期钩子之间、effect 之间）不互换；队列划分见各框架文件。`useFoundation`、`useId` 和其他 composable 可能注册任何一类，与所有注册类调用保持原顺序（observer 类 composable 排在给目标赋值的生命周期钩子之后，见各框架文件）。
- 没有归类的语句（`if`、`for`、赋值、`'use no memo'` 指令、提前 `return`、`await`）是屏障，其他语句不跨过它们。
- 新增的 hook 或 composable 若属于 3 至 11 组中的其他组，登记在本框架 `lint/<框架>/component-order.ts` 的 `calls`，Semi 宿主函数登记在 `lint/component-order.ts` 的 `semiCalls`；未登记的 `use*` 按 composable 处理。

## 有 foundation

- 受控判断与「是否传入」只看值是否为 `undefined`，不用 `'key' in props`（props 对象可能包含所有声明过的键）。foundation 里用 `this.isControlledComponent(key)`，静态函数和组件里直接写 `props.x !== undefined`；`null` 是受控的值。受控值变回 `undefined` 时把 state 同步为空并转为非受控（表单重置）；Tabs、Collapse、Carousel、UserGuide 例外，从最后的受控值继续；Slider、Rating 例外，回到 `defaultValue`（Switch、Checkbox、Radio 变回未选中，属于同步为空）。
- 默认值只填 `undefined`。回调 prop 不设 `noop` 默认值，调用处一律 `?.()`：默认值不覆盖使用方显式传入的 `null`，直接调用会抛 TypeError。判断使用方是否给了回调写 `Boolean(onX)`，不和 `noop` 比较。
- adapter 只写组件特有的方法，`getProps`、`setState` 等由 `base` 提供；adapter 接口用完整的 `DefaultAdapter<P, S>` 泛型（`Partial<DefaultAdapter>` 不满足约束）。`setState` 后立即能读到新值，所以 foundation 里需要旧值做比较或通知时，要先读或先通知，再写。
- foundation 不直接调用 props 上的事件回调，统一经 adapter 的 `notify*` 方法发出（如 `this.adapter.notifyChange(value)`），由 adapter 负责调用 props 回调，写法参照同组件已有的 `notify*`（`base.getProps().onX?.(...)`）；回调的返回值被 foundation 使用时（Promise、boolean），`notify*` 原样返回。布尔和配置型 props（`onChangeWithObject`）与参与计算的数据函数（`loadData`、`column.onFilter`）不在此列。
- 必须和 props 在同一次提交里生效的派生状态（如 Collapsible 的高度与过渡 class；分两次提交会让过渡以 0ms 生效），用渲染期比较加条件 setState：新值和旧值不同时才调用，下一轮就收敛。
- 渲染期要用的 foundation 逻辑写成静态纯函数直接调用（如 `DescriptionsFoundation.getHorizontalList(columns, column)`、`Foundation.getInitialState`），不经过 foundation 实例：渲染期从实例上读到的 props 可能是上一轮的值。只有无状态计算、不需要 adapter 的逻辑写成 foundation 里的普通函数，不继承 `BaseFoundation`，组件直接调用（Highlight 的 `findAll`）。
- render 中不能有副作用，定时器等放到事件处理或值变化的回调里。
- foundation 的公开 API 有变化时，写进提交说明和 `docs/release-notes.md`。
- 组件对 foundation 的 props 同步、默认值填充与 ref 合并写法，见各框架文件。

## 无 foundation

- 状态直接放在组件内。受控判断按值是否为 `undefined`，清空与保留最后受控值的语义同「有 foundation」一节。
- 对外导出的顶层组件的默认值填充、是否需要跳过重复渲染等，见各框架文件。

## 属性透传与 ref

- 解构掉组件声明的每个属性，以及 Form 经 withField 注入的非 DOM 属性 `validateStatus`、`insetLabel`、`insetLabelId`，其余属性透传到根元素的显式属性之前（F2）。没有根 DOM 的包装组件（Popover、Popconfirm、Dropdown、UserGuide）丢弃未声明属性（F11）。对话框的 `data-*` 落在最外层，`aria-*` 落在 `role="dialog"` 元素上（F12）。
- 根元素不是焦点目标时（如 Switch 的根是 div、控件是 input），`aria-*`、`name`、`tabIndex` 交给原生控件，否则 Tooltip 注入的 `tabIndex` 会多出一个 Tab 停靠点。Input、TimePicker 的未声明属性（含 `data-*`）落在原生 input 上。
- 含多个焦点目标的组件（PinCode、RadioGroup、CheckboxGroup）接收 Form 注入的 `onBlur`，只在 `!e.currentTarget.contains(e.relatedTarget)` 时调用：焦点在组内移动不算离开，Form 的失焦校验只触发一次。
- 组件自己带签名的事件（如 Rating 的 `onClick(e, index)`）必须从透传属性中拆出，不能再作为 DOM 事件落到根元素。
- 没有根元素的组件不做透传、不加 ref，返回类型要显式标注，否则 d.ts 生成时会引用不该暴露的类型。
- Props 类型继承落点元素的原生属性（F6）：第一个参数是接收未声明属性的元素，第二个参数列出组件以不兼容签名重定义的属性；漏列时 `extends` 报错。必须写成 `interface ... extends`，不用交叉类型：交叉类型不检查冲突，同名属性会静默合并成两个签名的交叉。落点写法见各框架文件。
- 需要命令式方法时导出 `XxxHandle` 接口，方法清单与 Methods 文档、demo、测试、组件间调用保持一致。

## 事件、焦点与 DOM 工具

- foundation 自己挂在整个挂载期的监听（媒体元素事件、全屏后的 document 事件）用 `this.signal`：`addEventListener(type, fn, { signal: this.signal })`，卸载时统一移除，不写配对的 remove 与 `destroy`。`signal` 只在挂载期间可读，`init` 之前或 `destroy` 之后读取会抛错。
- 拖动用 pointer capture，不在 window 或 document 上挂 move、up：
    - `onPointerDown` 里 `e.currentTarget.setPointerCapture(e.pointerId)` 并开始拖动；`onPointerMove` 在拖动状态下更新；`onLostPointerCapture` 结束拖动，它在 pointerup、pointercancel 之后都会触发，元素离开页面时也会。
    - 捕获后的事件仍冒泡到祖先，祖先上的同类处理要按自己的拖动状态判断。捕获期间不发兼容的 mouseleave，按住后移出不能靠它结束。
    - 拖动面设 `touch-action: none`，样式里写明原因。
    - foundation 只读 `pointerId`、`clientX/Y` 与 `currentTarget` 时，参数类型用 `Pick<PointerEvent, ...>`；事件要原样交给使用方回调时传 `e.nativeEvent`，捕获在组件里做（`nativeEvent.currentTarget` 不是被按下的元素）。
- 判断插槽类 prop（`prefix`、`suffix`、`insetLabel`、`addonBefore` 等）是否渲染用 `_utils` 的 `hasContent(node)`（`null`、`undefined`、布尔与 `''` 不渲染，`0` 照常渲染），不用真值判断；`-text` 类用 `isText(node)`，数字与字符串都算文字。

## 子组件识别

- 父组件靠 `elementType` 识别子组件（如 Tooltip、ButtonGroup），取公开访问路径：`Parent.Child`（`Nav.Header`、`Select.OptGroup`、`Tabs.TabPane`），顶层组件取组件名（`Button`）。没有读取方的组件不声明 `elementType`。声明与读取的写法见各框架文件。

## context

- 用 `_base/create-context.ts` 的 `createContext<T>(name, options?)` 创建，导出 `[XxxContext, useXxxContext]`，`name` 用提供方组件名。默认必选：没有 provider 时读取抛出「`caller` must be used inside `name`」，不手写抛错包装；子组件离开父组件也能用时传 `{ optional: true }`，返回 `undefined`；缺 provider 时有真实可用的值（ConfigProvider 的 `{}`、Typography 的 `'normal'`）传 `{ defaultValue }`。不用 `null`、`{} as X` 冒充默认值；唯一例外是 FormApi，公开的 `useFormApi` 返回类型不含 `undefined`，在 Form 外沿用空对象。
- 值形态与提供方、读取方的写法见各框架文件。

## 类型与体积

- 改了组件的 Props 类型后跑全量 `tsc`，报出的错误属性在使用方处修正。
- 体积敏感的依赖（Lottie、MarkdownRender、CodeHighlight 的 shiki）保持按需加载。改动公开组件的依赖或导入时对比前后体积（命令见所属框架的 components.md），增长要说明原因。

## 组值回落

- 父组件经 context 下发、子组件自身值优先的 prop（如 Button 的 size、type、disabled 由 ButtonGroup 下发），默认值写 `undefined`，不用工厂默认值（工厂默认值会让缺省时读到全局值，组值无法生效）。派生时按「自身值 -> 组值 -> 全局默认值 -> 兜底值」回落。
- 组配置会穿过弹层的 Teleport 或 Portal，消费方用 `_base/popup-layer.ts` 的 `usePopupLayer()` 比较弹层层级，只继承同一层级的组。

## 无障碍与语言包

- 键盘、焦点、role 按 WAI-ARIA 与 APG 对齐，组合控件使用 `aria-activedescendant`，共享 foundation 焦点样式。
- 语言包各框架共用：可访问名称与内置文案从语言包读取，使用方名称优先，缺省按 ConfigProvider -> LocaleProvider -> zh_CN 读取。

## 服务端渲染

组件支持服务端渲染与 hydration：服务端输出的 HTML 与客户端首次渲染必须一致，差异只能在挂载之后出现。具体机制（id 原语、挂载后状态、弹层容器、告警判断）见各框架文件。

- 渲染期、setup 与初始状态不访问 `document`、`window`、`navigator`、`matchMedia` 等 DOM 与浏览器全局；需要的读取放到挂载后的生命周期或副作用里。
- id 只来自框架的 id 原语（React 的 `useId`、Vue 的 `useId`、Solid 的 `createUniqueId`），不用计数器、`Math.random` 或 `crypto.randomUUID` 在渲染期生成：服务端与客户端的调用顺序和次数不同，值会不一致。
- 当前时间与随机值只在挂载后使用：Calendar 的「今天」标记只在挂载后出现，服务端渲染的使用方传 `displayValue` 固定显示的日期。
- 首帧可见的状态由 props 在初始状态中算出，不等挂载后再同步：foundation 提供 `getInitialState` 一类静态纯函数，框架包在创建状态时直接调用，服务端与客户端得到同一份初始状态。依赖测量的状态（尺寸、截断、折叠）首帧取不依赖布局的值，挂载后再修正。
- 弹层挂载后渲染：服务端渲染与 hydration 期间不输出弹层容器与内容；默认打开的弹层（`defaultVisible`、受控 `visible`、`defaultOpen` 等）在 hydration 之后打开，服务端不输出弹层内容。
- 命令式 API（`Modal.confirm`、`Toast`、`Notification` 等）只在客户端调用；在服务端调用时抛出说明性错误，信息写明应改在事件处理或挂载后的副作用里调用。
- 全局默认值（`semiGlobal.config`）只在应用启动时设置，服务端与客户端用同一份配置；渲染过程中不修改它。

## 框架写法

- 声明、hook、属性落点、子项、测试的框架写法见各框架目录（`.agents/references/<框架>/`）的 `components.md`，同一框架的硬性规则在该文件开头。
