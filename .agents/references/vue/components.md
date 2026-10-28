# Vue 组件写法

semi-ui-vue 的 Vue 3 组件写法。组件内语句顺序、foundation、属性透传与组值回落等共享规则见 `.agents/references/components.md`，本文只写 Vue 实现。

## 硬性规则

- 对外导出的 Vue 顶层组件用 `withDefaults` 加 `semiDefault`、`semiGlobalDefault`，props 不解构（见「props」一节），并在对应包的 `semi-global.ts` 类型里补上组件名。
- computed 与模板无副作用，副作用放 watch 与生命周期。

## 组件结构

- 使用 `<script setup lang="ts">` 与模板；目录和文件用 kebab-case。已有的 VNode（插槽节点、调用方节点）用 `<component :is="node" v-bind="extra">` 渲染：Vue 合并 class、style 与监听器并保留原 ref，不用 `cloneVNode`。
- 模板表达不了的渲染（组件工厂如命令式 Toast，数据树如 Tree、Cascader、Table 单元格）写成 `.tsx` 中的 JSX，首行必须是 `/** @jsxImportSource vue */`，并注释为什么不用模板。仓库自身的构建由 tsconfig 的 `jsxImportSource: vue` 选中 `vue/jsx-runtime`，但站点的 `@vitejs/plugin-react` 把全局 importSource 设为 React，只有文件内的 pragma 能让 Vue 文件在那里仍按 Vue 编译（`_base/__tests__/base.test.tsx` 有守卫用例）。不用 `<script lang="tsx">`（plugin-vue 会把 SFC 的 tsx 交给 Oxc 默认的 React 转换）。
- 没有手写结构、只把数据逐层转成 VNode 的通用树（如图标的 SVG 数据）用递归的 `h()`。`vue/jsx-runtime` 等同 `h()`：原生元素直接写子内容，组件的子内容写插槽函数或插槽对象（`<Comp>{{ default: () => ... }}</Comp>`）。Vue 的 tsconfig 保持 `jsx: preserve`（vue-tsc 只在此模式下正确检查 Vue JSX 的子内容），转换由 Vite 与 `vp pack` 显式设置的 automatic runtime 负责。
- 有状态组件仍用 SFC 与模板；SFC 内只为插槽参数构造单个 VNode 时直接用 `h()`，不为一次调用拆文件。不用 `getCurrentInstance`；class 用模板的数组与对象写法，不用 clsx。SFC 不写 `<style>`，在 script 导入共享 foundation SCSS。
- `<script setup>` 的语句顺序与空行见共享规则。宏之间的顺序由 `vue/define-macros-order` 检查（`defineOptions`、`defineProps`、`defineEmits`、`defineSlots`、`defineModel`，`defineExpose` 放最后）。同一关注点超过约 30 行或会被第二个组件复用时抽成 `use-xxx.ts`。模板 ref 用 `useTemplateRef`，不用 `ref()`（`vue/prefer-use-template-ref`）。
- Vue 的 watch 与生命周期钩子分属两个队列，互相不约束；watch 之间、生命周期钩子之间保持原顺序。observer 类 composable 排在给目标赋值的 `onMounted` 之后。

## props

- Props 只声明组件属性，原生属性经 attrs 透传（D12）。有根 DOM 的对外组件在 `defineProps` 里交叉落点元素的原生属性类型，落点与 React 版的 `ElementProps` 相同，F11 组件不加：`defineProps<XxxProps & /* @vue-ignore */ ElementProps<'tag', keyof XxxProps | EmitHandlers<XxxEmits>>>()`（`_base/element-props.ts`）。`@vue-ignore` 让 compiler-sfc 跳过这一项，运行时 props 不变，TSX 调用方仍能写原生属性；省略的键必须包含 emit 推导出的 `onXxx`（内联 emits 直接列出名字），否则同名原生事件与 emit 签名取交集，调用方按 emit 签名写的处理函数报错。组件自己绑定、调用方传了也无效的原生属性同样省略（Input、TextArea 的 `value`）；落到内部 input 而落点元素没有的属性另行交叉（Checkbox、Radio、Switch 的 `Pick<InputHTMLAttributes, 'name' | 'autofocus'>`）。属性全部转交给内层组件的包装组件交叉 `InstanceType<typeof Comp>['$props']`（泛型组件用 `Parameters<typeof Comp>[0]`），只经 attrs 转发内层监听器的交叉 `EmitProps<Emits>`。组件内的 `props` 类型也带着这些原生属性，运行时恒为 undefined，读原生属性用 `attrs`。
- props、emits、slots 用类型声明，导出 `XxxProps`、`XxxSlots` 与需要的 `XxxHandle`。事件对象使用原生 DOM 事件，需返回值的回调仍用函数 prop。
- 靠监听是否存在决定渲染、或经 context 下发并读全局默认值的事件（Upload、VideoPlayer、Steps、List、Breadcrumb 等的 `onXxx`）也保留函数 prop；这类事件不支持 `.once` 等修饰符（`@xxx.once` 编译为 `onXxxOnce`，不命中函数 prop，也不走 emits），在 release-notes 的对应章节写明。
- 返回 DOM 或 VNode 的 render 类函数 prop 改为作用域插槽：插槽名去掉 `render` 前缀（`renderTabBar` -> `#tabBar`），位置参数改为插槽作用域对象的具名字段（`TabsTabBarSlotProps` 的 `tabBarProps`），React 版传入的组件参数改为 VNode 字段（`tabBar`）；Tree 的 `#renderDraggingNode` 是保留原名的特例，不作为新插槽的范例；返回字符串的格式化函数（AutoComplete 的 `renderSelectedItem`）仍是函数 prop。
- Props 类型里不写 `typeof` 推导类型或裸 `RegExp`：compiler-sfc 生产编译会丢掉 skipCheck、只保留能识别的运行时类型，开发构建下报 Invalid prop；在 interface 里展开字面量联合（Table 的 `SortOrder`），正则写成 `RegExp & object`（PinCode 的 `PinCodeFormat`），并加 WHY 注释。
- 受控主值为 `modelValue`，其他受控值保留名称，用 prop 加 `emit('update:x')` 实现；不用 `defineModel` 或 `useVModel`。受控判断按值是否为 `undefined`。无 foundation 的组件使用 `useControllable`，沿用 React 的清空与保留最后受控值语义。
- props 写成 `const props = withDefaults(defineProps<XxxProps>(), { ... })`，不解构，脚本与模板都读 `props.x`（`vue/define-props-destructuring` 为 never）。对外组件有兜底值的 prop 写 `x: () => semiDefault('Xxx', 'x', fallback)`；只有全局默认值的写 `x: semiGlobalDefault('Xxx', 'x')`，类型保留 `| undefined`；并补 `semi-global.ts` 的组件类型。三态 boolean 必须有默认值键（`undefined` 或 `semiGlobalDefault`），否则 Vue 把缺省读成 false；tooltip condition 与 table pagination 默认 true。布尔简写在 vnode props 中可能为 `''`，检查子组件状态时与 true 同样处理。
- 含 Function 的 prop 默认值为字面量 `undefined`，在 setup 中调用一次 `useSemiGlobal`，再由 computed 中的 `readSemiDefault` 读取全局默认值，经 foundation props 覆盖层传入。避免编译器把函数误当默认值工厂或在模块加载时求值；`semiGlobalDefault` 同理不能用于这类 prop。
- 单个 prop 传给 watch/composable 时写成 getter（`() => props.visible`）。attrs 与 slots 不是响应式的：依赖它们的判断写成 render 期调用的函数，不放 computed。

## context 与组值

- context 用 `_base/create-context.ts` 的 `createContext<T>(name, { optional? })`：每个组件目录一个 `context.ts`，导出 `[provideXxxContext, useXxxContext]` 与值类型，`name` 用提供方组件名。`useXxxContext()` 没有 provider 时的行为见共享规则。嵌套继承写成先 `useXxxContext()` 读外层、再 `provideXxxContext()` 下发；重置子树写成 context 类型含 `undefined` 并 `provideXxxContext(undefined)`。值形态：只有数据时下发 `ComputedRef<T>`；带方法时下发普通对象 `{ view: ComputedRef<View>, ...方法 }`，方法不进 computed；不变的标识值（如弹层层级的 symbol）直接下发。`semiGlobalKey` 是公开的 app 级注入键（`app.provide(semiGlobalKey, config)`），不走 `createContext`。
- Vue 的 `createContext` helper 没有 `defaultValue`：读取处用 `??` 补默认值，不为对齐 React 而加参数。
- 组件的 `useLocale` 返回 computed，使用方名称优先，缺省按 ConfigProvider -> LocaleProvider -> zh_CN 读取。
- 组值回落的 computed 写法：默认值写字面量 `undefined`（不用工厂默认值），在 computed 中按共享规则的顺序回落。

## 子节点

- 逐个包裹或在子项之间插入元素的组件（ButtonGroup 分隔线、AvatarGroup）：用 `slotNodes(slots.default?.() ?? [])` 取 `[node, key]`，模板 `v-for` 把 `:key="key"` 写在包装元素上（无包装时写在 `<component :is>` 上），outlet 上不加 `v-if`；key 规则同 `React.Children.toArray`，不用 `node.key ?? index`。
- 收集子组件数据的组件（Select、Tabs、Steps、Table.Column）：在模板或 render 期读取默认插槽 vnode 的 props，用 `_base/element-type.ts` 读 `elementType` 识别；`v-for`、`v-if`、`<template>`（Fragment）由 `slotNodes` 展开，与 React 的 `flattenChildren` 一致；不用子组件自注册，自注册在 SSR 与 mount 同步阶段拿不到数据。
- 例外是 React 本身经 context 自注册、且首帧不需要子项数据的组件：ResizeGroup 要子项挂载后的实际尺寸，Image 分组要收集封装在其他组件里的 Image；FormInputGroup 的组内字段本就经 Form 的 context 注册，组只汇集这些注册的字段名与错误，读插槽 props 拿不到 withField 包装后的字段身份；子项在 `onMounted` 注册、`onBeforeUnmount` 注销。
- 子组件身份用 `defineOptions({ elementType: 'Xxx' })` 声明，父组件用 `_base/element-type.ts` 读取。在 computed 里读插槽的收集型组件用 `_base/use-slot-version.ts` 的 `useSlotVersion(slots)` 让 computed 失效：它在 `onBeforeUpdate` 里比较插槽函数引用，只在引用变化时递增，不无条件递增；已知限制是引用不变、读非响应式数据的插槽在组件因其他原因更新时不重读，调用方传响应式数据或新的插槽函数。
- 模板里标签名来自 prop 或内部常量时（Table 的 `components`、Transfer 与 JsonViewer 的 `search`）用 `_base/native-tag.ts` 的 `nativeTag(tag)` 渲染，绕过 `resolveDynamicComponent` 的注册表查找，应用全局注册同名组件不会接管；递归渲染自身的 SFC 用 `defineOptions({ name })`。`nativeTag` 组件的 `type` 是函数，检查 `vnode.type` 是否为字符串的代码（Tooltip 的 `canCarryPopupState`）认不出它，见 component-issues 的 Tooltip 节。

## foundation 与响应式

- `useFoundation(Foundation, props, initialState, createAdapter, options)` 返回 `{ foundation, state }`，直接接收 props 对象。实例保持 markRaw，state 为 shallowRef 并整对象替换；adapter 只补组件特有的方法。`options.props` 的 getter 映射 modelValue 等字段，初始化、getProp 与 getProps 使用相同视图。静态方法需要 foundation 的 props 视图时，每个组件只声明一个共享的 `const foundationProps = computed(() => foundation.getProps())`，不在多个 computed 里重复调用 `getProps()`；映射是恒等时直接读 `props.x`。需要 prevProps 时保存 getProps 快照。
- `useFoundation` 无法从参数推断泛型（F 会退化为 Lifecycle，adapter 回调参数变成隐式 any）：调用前声明局部别名 `type Foundation = XxxFoundation<...>; type Adapter = XxxAdapter<...>;`，调用写 `useFoundation<Foundation, Adapter, P, S>(`；没有嵌套泛型的短调用可以内联。
- prop 变化同步到 foundation 时写 `watch(() => props.x, cb)`，用默认的 pre 时机，让 state 与 prop 在同一次渲染里生效；只有回调要读取、测量、滚动或聚焦 DOM 时才加 `{ flush: 'post' }`；只有需要按内容比较（调用方每次传新数组或新对象）时才用 `useDidUpdate(getter, cb, isEqual, flush)`，并按同样的规则选 `'pre'` 或默认的 `'post'`。同一组件里有先后依赖的两个 post watch 按依赖顺序创建（post 队列按 id 稳定排序），并在后者旁注明不能调换。
- 挂载 connect/init，卸载 destroy/disconnect；setState 回调在 DOM 提交后的 post watcher 中执行。
- 进出场动画用 `<Transition>`、列表用 `<TransitionGroup>`，写 `appear`、`type="animation"`、`:css="props.motion"`，动画类经 `enterActiveClass`、`leaveActiveClass` 指向 foundation SCSS 的类，不手写 animationend 监听。显示后才能做的事（聚焦、`inert`、浮层登记）以 `@enter` 置位的 shallowRef 门控，不以 `visible` 门控：vShow 在 post 队列之后才恢复 display。外层 `v-if` 卸载 v-show 元素时不走 leave、after-leave 不触发，由该 shallowRef 派生的状态要在卸载路径另行复位；初始可见时 `appear` 会触发一次 `@enter`，从它派生可见性回调时初值取 `props.visible`。测试用 `@test/utils/vue` 的 `endTransitions()` 结束过渡。
- 响应式容器按数据的写法选：
    - 整体替换的值用 `shallowRef`：基本类型、foundation state、每次生成新对象的结果、会整体重建的列表（ArrayField 的 `keys`）。
    - 组件自有、只原地增删的集合用 `shallowReactive`：Set、Map、子项注册数组。原地 `add`、`delete`、`set`、`push`、`splice`，不复制后整体赋值；变量用 `const`，不解构，不整体替换。
    - 不用深层 `ref()`、`reactive()`：集合里的 DOM 元素、VNode、foundation 实例会被包成 Proxy，`===` 与 `Set.has` 失效，深层追踪也没有用处。foundation 实例不放进 `reactive()`、`ref()`：Proxy 会让 `#` 访问抛错，用 `shallowRef` 或 `markRaw`。
    - 原地修改不改变引用。消费方要读内容（`has`、`get`、遍历、在 computed 里读），不能用 `() => collection` 作 watch source，也不能当 prop 传下去等子组件发现引用变化；需要这两种用法的集合用 `shallowRef` 整体替换。
- 观察 DOM 变化用 `_base/use-mutation-observer.ts`：挂载后开始观察，开始时以空记录调用一次回调以读取初始状态，卸载时断开；观察可见性用 `_base/use-intersection-observer.ts`：目标或选项变化时重建，没有目标时不建 observer。不手写 observer 加 `onMounted`、`onBeforeUnmount`。两者都在挂载时开始，调用写在给目标赋值的 `onMounted` 之后，首次观察才落在挂载内；目标来自插槽输出等不被追踪的 DOM 时，由组件在提交后比较并只在变化时给 ref 赋值。
- 下一帧或延时执行用 `_base/use-raf.ts`、`_base/use-timeout.ts` 返回的调度函数：新的调用替换尚未执行的那次，卸载时取消。不手写 `let frame` 或 `let timer` 加 `onBeforeUnmount` 清理；只在某次 watch 运行内有效的定时器仍用 watch 的 `onCleanup`。

## 服务端渲染

框架无关的协议见 `.agents/references/components.md` 的「服务端渲染」一节，本节写 Vue 的机制。

- 服务端只执行 `setup`、`immediate` 的 watcher 和 `flush` 不是 `'post'` 的 `watchEffect`，不执行 `onBeforeMount`、`onMounted` 与其他 watcher。读写 DOM 的首次执行放 `onBeforeMount`、`onMounted`，不用 `immediate` watcher；读写 DOM 的 `watchEffect` 用 `flush: 'post'`。打开时记录焦点用 `_base/use-record-focus.ts`；只在挂载后渲染的内容用 `_base/use-mounted.ts`；其他「首次执行加后续变化」的逻辑写 `onBeforeMount` 加不带 `immediate` 的 `watch`。
- 弹层经 `_base/portal.vue` 在 `onMounted` 后才渲染 `Teleport`，服务端 HTML 只含触发器，默认打开的弹层在 hydration 后出现。
- 服务端渲染用例在 `vue-ssr` 项目（`*.ssr.test.tsx`），hydration 用例在 `vue` 项目：用例表 `__tests__/ssr-cases.tsx` 按导出列出，守卫检查两个方向；新增导出必须补用例。

## 模板与事件

- 可点击状态用 `_base/control-attrs.ts` 的 `hasClickListener(attrs)` 判断，按值剔除 click 监听时用 `isClickListenerKey(key)`：`.once`、`.capture`、`.passive` 会让键变成 `onClickOnce`、`onClickCapture`、`onClickPassive`（可叠加），只看 `attrs.onClick` 会漏掉；`.stop`、`.self`、`.prevent` 的键仍是 `onClick`。`click` 不声明在 emits 里。
- 输入类使用 `@input`，由 foundation 处理 isComposing；容器焦点进入与离开使用 `@focusin`/`@focusout`。
- 模板只写简单表达式：带类型标注的内联箭头函数、超过约 80 字符的条件对象或三元表达式移到 script；读 slots、`$attrs` 或 v-for 变量的写成 render 期调用的函数（必要时带参数），只依赖 props、state、computed 的才用 computed；作为子组件 prop 传递的对象保持函数调用，每次渲染给新对象。
- 插槽与事件转发：包装层把本组件的插槽整体转给子组件时用动态转发 `<template v-for="(_, name) in $slots" #[name]="scope"><slot :name="name as keyof XxxSlots" v-bind="scope" /></template>`（插槽类型是内联写法时先 `const slots = defineSlots<...>()`，再写 `name as keyof typeof slots`）；要过滤时在 script 用 `passedSlots()`，并配一条「被过滤的插槽不下传」的用例。列表 `v-for` 内的子组件要整体接收插槽时，动态转发会编译出 `ref_for`，改在 script 写一个返回 `h(Child, props, { ...slots })` 的函数，模板用 `<component :is="childNode(item, index)" v-for=... :key>` 渲染（AIChatDialogue 的 Dialogue、Chat 的 ChatBox）；子组件只读自己的插槽名时，多收到的插槽无影响。
- script 已用 `h()` 造出某个子节点作为插槽参数（`#fullDialogue` 的 `defaultNodes`、`#content` 的 `defaultContent`、`#ellipsisTooltip` 的 `trigger`）时，默认分支用 `<component :is>` 渲染同一个函数的结果，多个节点用单元素 `v-for` 绑定，不在模板里再写一遍子组件。v-for 作用域内的插槽出口不用对象 `v-bind`。`h()` 里传 defineSlots 返回的 slots 写 `h(Child, props, { ...slots })`（`Slots` 是 interface，没有索引签名，直接传报 TS2769）。模板里用 `$slots`，script 里用 `slots`；script 不读插槽时只写 `defineSlots<XxxSlots>()`，不赋值。
- 同名纯转发的事件在包装层声明 emits 并显式 re-emit，写成 `(...args) => emit('x', ...args)`；只适用于子组件在 `defineEmits` 里声明、且参数个数与本组件声明一致的事件，原生透传监听或子组件参数多于本组件声明时保持 `emit('x', $event)`。只用第一个参数的事件处理写成带 `$event` 的内联语句（`@close="removeTag(item, $event)"`），不写单参数箭头函数；`vue/v-on-handler-style` 的选项都与这套写法冲突，所以不开启。
- 根是焦点目标时使用默认 attrs 透传；根和控件不同则 `inheritAttrs: false`，模板中直接调用 `splitControlAttrs($attrs, ...)` 分流，不能用 computed 缓存 useAttrs。Input 类除 class/style 外都透传到原生输入；Switch 类将 aria-*、id、name、tabindex、autofocus 透传到控件。
- 无根 DOM 包装组件丢弃未声明 attrs，class/style 按既定落点转发弹层；对话框的 aria-* 落到 role="dialog"；使用方传的 `role` 在 Modal 落到 `role="dialog"` 元素、在 SideSheet 落到外层容器（F12）。
- 内部 DOM 用 `useTemplateRef('x')`，默认不写泛型，由模板 ref 目标推断；ref 被 adapter 读取且该组件模板又读 foundation state 时推断成环（TS7022/TS7023），这时保留显式泛型并写一行 WHY 注释；`<component :is>` 指向不同形组件的保留泛型；v-for 数组 ref 保留 `X[]`（去泛型后元素被推断为可空）。单元素 v-for 内的模板 ref 写字符串 ref 加 `const xs = useTemplateRef('x')`，使用处写 `xs.value?.[0]`（字符串 key 不能与 `<script setup>` 的顶层绑定同名，否则 dev 构建告警 non-ref value）；setter 要经插槽 props 交给使用方（TreeSelect 的 `inputRef`），或 ref 是 watch、useEventListener、useResizeObserver 的源且目标可能重挂载时，保留函数 ref 加 shallowRef。
- 子组件句柄类型用 `InstanceType<typeof Child>`，不手写结构类型；tsconfig 开启 `inferComponentDollarEl`，子组件的 `$el` 不再写 `as HTMLElement`。公开方法用 defineExpose。Tooltip 类触发器：单个节点直接接收触发属性，文本或多个节点包进 wrapper span；多根组件（如嵌套的 Tooltip）按 F1 锚定它的第一个元素。
- 测试与组件的 render 写法见 [testing](testing.md)。
- React Compiler 检查不适用于 Vue；验证使用 vue-tsc、script lint、模板 lint 和对应行为用例。具体 lint 边界见 [lint](lint.md)。
