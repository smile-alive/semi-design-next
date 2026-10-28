# React 组件写法

semi-ui-react 的 React 19 函数组件写法。组件内语句顺序、foundation、属性透传等共享规则见 `.agents/references/components.md`，本文只写 React 实现。可以参照的现有组件：有 foundation 的看 `switch/`、`spin/`、`rating/`；没有 foundation 的看 `tag/`、`button/`；复杂的看 `tooltip/`。函数、导出、memo 的通用写法见 [coding-style](../coding-style.md)，无障碍见 [a11y](../a11y.md)。

## 硬性规则

- 对外导出的 React 顶层组件调用 `useDefaultProps`（F7），名称用组件导出名，并在 `packages/semi-ui-react/src/_utils/semi-global.ts` 的 `overrideDefaultProps` 类型中补上组件名。
- React 组件和 hook 要能通过 `compiler-check.ts`（`pnpm lint:react`）。
- render 中不写副作用，定时器等放到事件处理或 `useDidUpdate` 里。

## 声明与导出

- 组件用 `function` 声明，导出时直接写 `export function Indent()` 或 `export default function Indent()`。HOC 或工厂函数内部定义的组件同样用 `function` 声明。
- `memo` 组件先声明函数，在导出处包装：`function Indent(props) {...}` 加 `export default React.memo(Indent)`，包装函数沿用文件里已有的 `memo` 或 `React.memo` 写法。需要具名导出的 memo 组件写成 `export const Indent = memo(function Indent(props) {...})`。泛型组件保留 `as typeof X`。
- 组件和 hook 内部的函数用箭头函数。hook 本身是顶层函数，用 `function` 声明。

## JSX 属性顺序

- `perfectionist/sort-jsx-props` 检查属性顺序，依次为：`key`/`ref`、`id`/`name`、元素类型（`as`、`type` 等）、类名、样式、`data-*`、无障碍属性、表单状态、其余属性、节点属性（`render*`、`*Render`、`icon` 等）、`children` 一类、`on*` 与 `handle*` 回调。组内按字母，展开运算符两侧分开排序。分组以 `lint/react/index.ts` 为准，`vp lint --fix` 可自动修正。

## 有 foundation

```tsx
const defaultProps = { size: 'middle', spinning: true } satisfies Partial<SpinProps>;

export default function Spin(rawProps: SpinProps) {
    const props = useDefaultProps('Spin', rawProps, defaultProps);
    const { ref, children, size, spinning, delay, ...rest } = props;

    const [foundation, state] = useFoundation<SpinFoundation, SpinAdapter<SpinProps, SpinState>, SpinProps, SpinState>(
        SpinFoundation,
        props,
        () => ({ loading: props.spinning }),
        (base) => ({ setLoading: (loading) => base.setState({ loading }) })
    );

    useDidUpdate(props.spinning, (spinning) => foundation.handleSpinningChange(spinning));

    return <div {...rest} ref={ref} className={...}>...</div>;
}
```

- `useDefaultProps(名称, props, 默认值)` 只填 `undefined`。它每次渲染读取 `semiGlobal.config.overrideDefaultProps`，全局里有而默认值里没有的键也会填上。对外导出的顶层组件一律调用它（F7），名称用组件的导出名。静态挂载的子组件、内部组件，以及 ConfigProvider、LocaleProvider 不调用。
- `useFoundation` 返回 `[foundation, state]`。泛型要显式写出，调用处可以内联。
- 值变化时调 foundation 用 `useDidUpdate(值, 回调)`。它不接收依赖数组，挂载时和 StrictMode 重跑时都不触发；使用方每次传新对象、要按内容比较时，第三个参数传 `isEqual`。
- 必须和 props 在同一次提交里生效的派生状态（如 Collapsible 的高度与过渡 class；分两次提交会让过渡以 0ms 生效），用渲染期比较加条件 setState：新值和旧值不同时才调用，下一轮就收敛。不用 `useDidUpdate`。
- 渲染期要用的 foundation 静态纯函数直接调用（如 `DescriptionsFoundation.getHorizontalList(columns, column)`）。host 在 insertion 阶段才同步 props，渲染期从实例上读到的是上一轮的 props，所以不经过 `useFoundation` 返回的实例。
- DOM 测量用 `useLayoutEffect`，纯通知用 `useEffect`。

## 无 foundation

- 状态直接用 `useState`。对外导出的顶层组件调 `useDefaultProps`；子组件和内部组件把默认值写成参数解构的默认值（默认值里不写 JSX，见 React Compiler 一节）。
- 需要跳过重复渲染的对外组件用 `memo`：库构建不开 Compiler（C1），不会自动记忆化。

## 属性透传与 ref

- 没有根元素的组件（如 Highlight 直接返回文本与标签组成的数组）不做透传、不加 ref，函数返回类型要显式标注（如 `React.ReactNode[]`）：否则 `build` 生成 d.ts 时推断出的类型会引用 csstype，报 TS2883。
- Props 类型继承落点元素的原生属性（F6）：`interface XxxProps extends ElementProps<'div', 'title'>`（`_base/base.ts`），第一个参数是接收未声明属性的元素，第二个参数列出组件以不兼容签名重定义的属性；漏列时 `extends` 报 TS2430。必须写成 `interface ... extends`，不用 `type X = ElementProps<...> & {...}`：交叉类型不检查冲突，同名属性会静默合并成两个签名的交叉。新接入的组件在 `_base/__tests__/element-props*.test.tsx`（按组件族分文件）加一行用例，属性写在 JSX 字面量上（展开对象不做多余属性检查）。
- `ref` 写在 Props 里（`ref?: React.Ref<HTMLDivElement>`，注释写明挂在哪个元素上）。被其他组件继承 Props 的（如 TooltipProps），把 ref 写在函数参数类型上，不写进 Props。
- 需要命令式方法时写 `XxxHandle` 接口加 `useImperativeHandle`。
- 合并 ref 用 `useMergedRef(a, b, c?)`（`_base/use-merged-ref.ts`），它包着遵循 React 19 cleanup 语义的 `_utils/merge-refs.ts`；只在 render 之外拼 ref 时直接调 `mergeRefs`。

## 通用 hook 与 DOM 工具

`packages/semi-ui-react/src/_base/` 下的 hook 先于手写同类逻辑使用：

- 事件监听声明在组件里，不经 adapter 注册：
    - 「某条件成立期间监听」写成 `useEventListener(target, type, listener, { enabled })`，`enabled` 直接用渲染时算出的条件（如面板是否显示），监听函数只转调 foundation 的处理方法（如 `handleClickOutside(e)`）。条件依赖受控 prop 与 state 的组合时，写成 foundation 的静态纯函数（如 `TimePickerFoundation.isPanelShown(props, state)`），渲染期和 foundation 共用。
    - 点击外部用 `useClickOutside(refs, onOutside, enabled)`，判断里面外用 `isEventInside(e, ...nodes)`（`utils/dom`）。都只看 `composedPath()`，监听 `mousedown`，不写 `contains` 和回退。
    - 监听目标在组件生命周期内会换（如编辑器实例的 DOM）时，把元素本身传给 `useEventListener`，不传 ref。
- 尺寸变化：`useResizeObserver(target, onResize, { enabled })`，不手写 ResizeObserver 加 effect。`target` 是 ref、元素或 `null`，为空或 `enabled` 为 false 时不观察；ref 只用于整个生命周期都存在的元素，会出现、消失或更换的元素存进 state 后传元素本身。按条件观察（如开启行号时）写进 `enabled`。
- 视口可见性：`useIntersectionObserver(getTargets, callback, { rootMargin, threshold }, targetsKey)`，`getTargets` 在提交后执行，可以查询渲染出的 DOM；需要重新观察时改变 `targetsKey`，包括回调里 unobserve 过的同一批元素。不手写 IntersectionObserver 加 effect。
- 复制反馈：`useCopied(毫秒)` 返回 `[copied, copy]`，`copy(text)` 解析为是否成功，定时器在重复复制和卸载时清理。
- 元素 id 用 `useId`；`getUuidShort` 只用于 React 之外创建的 DOM。
- 根元素是无角色的 div、使用方可能给它命名时写 `role={namedRole(rest)}`（`_base/named-role.ts`），放在 `{...rest}` 之前：有 `aria-label` 或 `aria-labelledby` 时为 `group`，使用方的 `role` 优先。
- 操作会移除或重挂当前持焦的节点（自身消失的按钮、按 key 重挂的项）时，把 `useFocusHandover(getTarget)`（`_base/use-focus-handover.ts`）返回的回调 ref 挂在该节点上：节点持焦被移除后，在同一次提交的 layout effect 中把焦点交给 `getTarget()`，目标可以是同一次提交新挂载的节点；处理函数已把焦点移到别处时不抢回。能让节点不重挂的（稳定 key、不换包裹结构）先修结构。

## 静态成员与子组件识别

- `export default Object.assign(memo(Button), { elementType: 'Button' })`：Tooltip、ButtonGroup 等靠 `type.elementType` 识别子组件，`memo` 的结果上也要能读到。没有读取方的组件不声明 `elementType`。父组件用 `_base/element-type.ts` 的 `elementTypeOf(node)` 读取，不写 `'elementType' in type`（Fragment、Suspense 的 type 是 symbol），也不另设 `isXxx` 布尔标记。
- 收集子组件的组件用 `_base/flatten-children.ts` 的 `flattenChildren(children)` 取子节点：它展开 Fragment（与 Vue 的 `slotNodes` 一致），Fragment 里的子项与直接写出的子项同样编号、定位和选中；不用 `Children.toArray`，它把 Fragment 当作一个元素。
- 子组件挂载（`Select.Option` 等）同样用 `Object.assign`。
- 点语法跨不过 `'use client'` 边界：Server Component 拿到的是父组件的客户端引用，`Typography.Title` 为 `undefined`。需要在 Server Component 中直接使用的子组件，在 `src/index.ts` 补「父名 + 子名」的命名导出（如 `TypographyTitle`），点语法保留，`__tests__/ssr.ssr.test.tsx` 加一条两者是同一组件的断言；其他复合组件的点语法只在 `'use client'` 文件中使用。

## React Compiler

- 库构建不经过 Compiler（C1），`website/scripts/compiler-check.ts` 只保证使用方开启 Compiler 时能编译。需要稳定引用的值（合并后的 ref 回调、传给子组件的回调、context 值）照常用 `useMemo`、`useCallback`，不交给 Compiler 记忆化。
- 组件和 hook 内不写以下代码，Compiler 遇到后会整个放弃编译该函数，构建和测试都发现不了，`react/todo` lint 规则能查出这类语法，`pnpm lint:react`（`compiler-check.ts`，在 `pnpm lint` 中运行）还能查出 hook 落在 memo cache 分支等问题：
    - `||=`、`&&=`、`??=`；
    - 参数解构默认值里的 JSX，如 `{ icon = <IconChevronDown /> }`，改为在函数体内判断 `=== undefined`；
    - 对象字面量里的 getter。
- Compiler 的 infer 模式不把 `use()` 算作 hook 调用：只调用 `use(Context)` 的自定义 hook 会被整个跳过。hook 里还有需要记忆化的计算时改用 `useContext`；只读 context 的 hook（`_base/create-context.ts`）没有可记忆化的内容，跳过无影响，照常用 `use()`。组件里另有其他 hook 时，`use()` 照常用。
- 以 `Ref` 结尾的变量会被当作 ref；把对象的方法直接作为 `ref` 传入也会被推断为 ref，要用 `useCallback` 包一层。DOM 节点、组件句柄和只在 effect 里比较的值，每个直接用一个 `useRef`，在事件回调、effect 或 adapter 方法里读 `.current`，多个节点也不合成对象。只有两种情况放进 `useState(() => new Runtime())` 创建的对象：读这些值的函数会在渲染期传进调用（用户的 render prop、`renderXxx()` 内构造的回调），Compiler 对 ref 报 `Cannot access refs during render`；或者多个可变对象（定时器、观察器与相关操作）带有自己的逻辑。
- `MutationObserver` 回调里改 class 前，先判断 `classList.contains`：`classList.add` 即使 class 已存在也会写属性，再次触发观察器。
- 虚拟列表一律用 `_base/virtual-list.tsx` 的 `VirtualList`，组件不直接调用 `@tanstack/react-virtual` 的 `useVirtualizer`：Compiler 会整个放弃编译调用它的函数，oxlint 报 `react/incompatible-library`。只有 `virtual-list.tsx` 带 `'use no memo'` 与 `lint/react/exemptions.ts` 的豁免条目。

## React 19 与 context

- context 用 `_base/create-context.ts` 的 `createContext<T>(name, options?)`，导出 `[XxxContext, useXxxContext]`，`name` 用提供方组件名，提供方写 `<XxxContext value>`，读取一律调 `useXxxContext()`，不直接 `use(XxxContext)`。`use(Context)` 受上一条限制，只在 hook 不需要记忆化时使用。
- 用 `<Context value>`、`use(Context)`、`useId`、`useEffectEvent`。不写 `forwardRef`、`propTypes`、静态 `defaultProps`、`__SemiComponentName__`。
- 改了组件的 Props 类型后跑全量 `tsc`，报出的错误属性（曾有 `<Tooltip title>`、`<Button checked>`）在使用方处修正。

## 服务端渲染

通用约束见 [components](../components.md#服务端渲染)，React 的机制：

- 渲染期与 `useState` 初始化不访问 DOM；初始状态由 props 算出（foundation 的 `getInitialState` 一类静态函数），不在 `foundation.init()`（layout effect）里补首帧可见的状态。
- 只在客户端确定的值用 `_base/use-is-server-render.ts`：服务端与 hydration 期间为 `true`，hydration 之后的重渲染为 `false`，纯客户端渲染始终为 `false`。依赖外部数据源的值写 `useSyncExternalStore`，服务端快照只给与运行环境和当前时间无关的值。
- 弹层经 `_portal` 挂载，它在服务端与 hydration 期间不输出任何内容，默认打开的弹层在下一次提交中出现。依赖弹层 DOM 的 effect（焦点、`beforeShow`、滚动锁）不写在外层组件，写在 Portal 内、渲染在内容之后的子组件里（如 SideSheet 的 `SideSheetOpenEffects`），保证 effect 运行时容器与内容已经插入。
- `renderToString` 不等待 `lazy`，Suspense 边界会以客户端重渲染的形式输出，hydration 报 recoverable error。按需加载的增强（Table 的 `resizable`、Transfer 的 `draggable`）在 `useIsServerRender()` 为 `true` 时直接渲染原有的回退内容，之后再进入 `lazy` 边界。
- React 在 hydration 时才给 `img` 挂 `load`、`error` 监听，之前已完成的图片不会上报；依赖图片事件的组件在 `useFoundation` 之后调用 `_base/use-replay-image-events.ts`（Image、Avatar），补发的事件才能到达已 init 的 foundation。
- 命令式 API 在创建容器前调用 `_utils/react-render.ts` 的 `assertBrowser(api, hook)`。
- 用例与工具见 [testing](testing.md#服务端渲染与-hydration)。

## 写法补充

- 参数只用于一次解构时在形参处解构，解构默认值含 JSX 时例外，在函数体内判断 `=== undefined`（见 React Compiler 一节）。
- 类名统一 `import clsx from 'clsx'`，本地名就叫 `clsx`。
- `_utils/index.tsx` 的 `cloneDeep` 刻意跳过函数和 React element，不替换它；纯数据拷贝用 `structuredClone`。
- `packages/semi-ui-react` 的入口会匹配所有 `.ts`，包内的 `scripts/*.ts` 要列进它 `vite.config.ts` 的 `notShipped`。
- 体积对比用 `pnpm build && node scripts/size-probe.ts <导出名...>`：每个导出单独打包，React 外置。

## 语言包读取

`const { locale } = useLocale('Pagination')`，再用 `locale.pageN.replace('${page}', String(page))` 这类方式代入值。useLocale 返回的对象直接解构读取。
