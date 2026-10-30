# Svelte 组件写法

semi-ui-svelte 的 Svelte 5 组件写法。组件内语句顺序、foundation、属性透传等共享规则见 `.agents/references/components.md`，本文只写 Svelte 实现。Svelte 版按 Svelte 原生机制设计 API，可以与 React、Vue 版不一致；能力对齐的参照是 Vue 版。

## 硬性规则

- 组件写在 `.svelte`，脚本用 `<script lang="ts">`；用到 runes 的非组件模块（宿主、可复用逻辑）命名为 `*.svelte.ts`，只有这类文件能写 `$state`、`$effect`。
- 对外导出的顶层组件读全局默认值：`const defaults = useDefaultProps('Xxx')`（`_base/use-default-props.ts`）写在 `$props()` 之前，非可绑定 prop 的 fallback 写 `defaults('size', 'default')`，没有内置默认值的写 `defaults('tip')`；在 `_utils/semi-global.ts` 的 `OverrideDefaultProps` 里补上 `Xxx?: GlobalDefaults<XxxProps>`。
- props 用 `let { ... }: XxxProps = $props()` 解构；受控值用 `$bindable()`，不写 fallback：带 fallback 的 bindable 被绑定到 `undefined`（表单重置）时抛错。
- 模板表达式与 `$derived` 无副作用；副作用放 `$effect`、`onMount` 与事件处理。
- 编译器警告（`a11y_*`、`state_referenced_locally` 等）不写 `svelte-ignore`：语义上必须保留的写法在 `lint/svelte/exemptions.ts` 按文件加 `compilerOff` 条目并写明原因。

## 公开 API

- prop 名与回调名以 semi-ui-react 为准（`checked`、`value`、`activeKey`，回调 `onChange(value, event)`、`onVisibleChange`），回调用 `onX?.()` 调用。`className` 改为 `class`（接受字符串、数组与对象，Svelte 内置 clsx 语义），Semi 自己的 `contentClassName`、`wrapperClassName` 保持原名；`style` 只接受字符串。
- 受控值是可绑定 prop 配同名回调。使用方有三种写法：`bind:checked={x}` 双向同步；`bind:checked={get, set}` 函数绑定，完全受控，setter 可以拒绝或改写；`checked={x}` 单向传值只作初值，组件内的交互在本地覆盖，父级再推新值时以父级为准。本地覆盖是 Svelte 的临时覆盖：组件上带展开属性时，展开对象一换，所有 prop 都重新求值，单向值回到父级的值（sveltejs/svelte#11286 已按不修关闭）。组件内不为此加同步层，文档引导使用方用 `bind:` 或回调写回；用例里要保持本地值时不要与会换新对象的展开属性混用。不提供 `defaultValue`、`defaultChecked`、`defaultVisible` 等 `default*` 属性。
- ReactNode 属性与 render 函数改为 snippet，名字与 Vue 版插槽一致：去掉 `render` 前缀（`renderTabBar` -> `tabBar`），位置参数改为一个对象参数的具名字段，字段名与 Vue 插槽作用域相同；默认内容是 `children`。返回字符串的格式化函数仍是函数 prop。
- 对外的方法写成组件脚本里的 `export function focus()`，使用方经 `bind:this` 取组件实例调用。

## props 与透传

- 未声明的属性用 rest 收集，`{...rest}` 写在根元素的显式属性之前，组件自己的属性后写、优先生效；`class` 合并写 `class={[内部类, rest.class, { ... }]}`。
- Props 类型交叉落点元素的属性类型：`interface XxxProps extends Omit<HTMLAttributes<HTMLDivElement>, 冲突名>`（`svelte/elements`），同名时 Semi 签名优先。HTML 的小写事件属性与 Semi 的同名回调冲突时（`onchange` 与 `onChange`）把小写名放进 `Omit`。落到内部 input 而落点元素没有的属性另行交叉（Checkbox、Radio、Switch 的 `name`）。
- 焦点落在内部 input 的组件用 `splitControlAttrs(rest, isNativeInputKey)`（`_base/control-attrs.ts`）把 `aria-*`、`id`、`name`、`tabindex`、`autofocus` 与焦点监听分给 input，其余给根元素。
- 包住 snippet 内容的元素带 `x-semi-prop="<prop 名>"`，与其他框架版相同。

## 有 foundation

- `useFoundation(Foundation, propsView, initialState, createAdapter, { context })`（`_base/use-foundation.svelte.ts`）返回 `{ foundation, states }`，`states` 是函数，模板与 `$derived` 读 `states().x`，只订阅读到的 key。不叫 `state`：组件里名为 `state` 的变量会让同一组件的 `$state` 被编译成 store 订阅。foundation 方法经宿主包装在 `untrack` 里执行。
- `$bindable` 要求解构，foundation 读不到 props 对象：组件把 foundation 要读的 prop 写成 getter 对象交给宿主（`{ get checked() { return checked; } }`）。
- 受控值的通知先写回可绑定 prop、再调回调：`notifyChange: (next, event) => { checked = next; onChange?.(next, event); }`。受控判断仍是 `isControlledComponent`（值是否为 `undefined`），foundation 不改。
- prop 变化同步到 foundation 用 `_base/watch.svelte.ts` 的 `watch(() => checked, (value) => foundation.setChecked(value))`：在 DOM 更新之后执行，挂载时不执行。
- 原生复选框被拒绝的切换不会改变派生值，Svelte 也就不会回写 DOM：事件处理里调完 foundation 后手动把 `input.checked` 设回派生值。
- 按 key 懒创建的响应式结构用 `SvelteMap`、`SvelteSet`，不在读取路径上 `new` 一个带 `$state` 字段的对象：在 reaction 里创建并立即读取的 `$state` 不被该 reaction 追踪。
- 卸载时 Svelte 先移除 DOM，再执行 `onMount` 清理与 foundation 的 `destroy`。`destroy` 只做取消与注销，不读布局，也不判断焦点是否还在组件内；卸载时要恢复焦点的，按 `FocusTrapHandle.shouldRestoreFocus` 的写法把 `document.body` 视为可恢复。

## 子项与内容

- 父组件需要事先知道子项数据的（Tabs 的标签栏、Select 的选项与已选标签、Table 的列、Tree、Cascader、Transfer），用数据 prop 加逐项 snippet：`<Tabs tabList={list}>{#snippet panel({ itemKey })}...{/snippet}</Tabs>`。snippet 读不到子组件的 props，子组件注册式在服务端首帧缺内容，所以不提供 `TabPane`、`Option`、`Table.Column` 这类只为声明数据的子组件。
- 子项自己渲染自己的 DOM、只读父级状态的（RadioGroup 与 Radio、CheckboxGroup、Collapse 与 Panel、ButtonGroup），父组件经 context 下发，子组件读取后自行渲染。这类组件的数据 prop（RadioGroup 的 `options`）照常保留。
- 数据项里的节点改为组件级 snippet，snippet 参数带上数据项。

## context 与语言包

- 每个组件目录一个 `context.ts`：`export const [getXxxContext, setXxxContext] = createContext<XxxContextValue>('Xxx', { optional: true })`（`_base/create-context.ts`，包装 svelte 的 `createContext`；`optional` 时缺 provider 返回 `undefined`，`defaultValue` 时返回默认值，两者都不给时缺 provider 抛错）。值是带 getter 的对象或 `$state` 对象，读取方按属性读，保持响应。
- 全局配置用 `useConfig()`（`config-provider`），语言包用 `const locale = useLocale('Xxx')`，模板读 `locale().locale.xxx`。可访问名称与内置文案一律从语言包读取。

## 服务端渲染

- id 只用 `$props.id()`，必须是顶层变量声明的初始化表达式（`const uid = $props.id();`），一个组件实例一个前缀，需要多个 id 时加后缀（`${uid}-input`）。
- `onMount`、`$effect`、`$effect.pre` 不在服务端执行；首帧可见的状态在 `initialState` 里由 props 算出。

## 样式、图标与动画

- 在 `<script lang="ts">` 里导入 foundation 的 SCSS，导入哪些文件照 Vue 版同名组件：`import '@fibrae/semi-foundation/radio/radio.scss';`。发布时 `scripts/svelte-package.ts` 改写为 `.css`。
- 图标从 `@fibrae/semi-icons-svelte` 导入（`import { IconClose } from '@fibrae/semi-icons-svelte'`）。Svelte 版 Icon 不支持 `elementType` 与 ref。
- 进出场用 `in:` / `out:` 指令配 `_base/css-animation.ts` 的 `cssAnimation`：`in:cssAnimation={{ className: '<进场类>' }}`、`out:cssAnimation={{ className: '<出场类>', motion }}`。关键帧只在 foundation SCSS 里维护。

## 代码风格

- `.svelte` 由 `vp fmt` 格式化（oxfmt 内置 prettier-plugin-svelte，`htmlWhitespaceSensitivity: 'strict'`），细则见 [lint](lint.md)。元素属性 `{...rest}` 在前（手写），其余按名字排序、事件处理在最后（`svelte/sort-attributes` 检查并自动修复）。
- 模板空白会被渲染：标签之间要紧贴时直接写在同一行（如 `</div><MarkdownCode />`），并用注释说明原因。
- `style:` 与 `class:` 指令的值不用 `$derived` 的同名变量：格式化会把 `style:height={height}` 折成简写 `style:height`，而 svelte 5.57 的服务端输出对简写不取 derived 的值。
- 语句顺序由 `pnpm lint:component-order` 检查，调用归组见 `lint/svelte/component-order.ts`。
