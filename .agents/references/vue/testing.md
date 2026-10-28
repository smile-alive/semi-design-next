# Vue 测试

共享规则见 [testing](../testing.md)。

## 项目与入口

- Vue 单测在 `vue` 项目中运行（jsdom），setup 为 `vitest/vue/vue.setup.ts`，项目另加载 `vitest/vue/vue.jsdom.setup.ts`。
- `vitest/vue/vue.jsdom.setup.ts` 把事件时间戳顺延 1ms。Vue 按 `Date.now()` 给事件打时间戳，跳过不早于该时间戳挂上的监听器，冻结时钟（见 [testing](../testing.md)）下冒泡路径上只有第一个 Vue 监听器会执行。这段补丁只在 `vue` 项目加载，不放进 `vue.setup.ts`：`vue-browser` 也加载 `vue.setup.ts`，改动真实浏览器的事件时间戳不可接受。Vue 用例不必为此调用 `vi.useRealTimers()`。
- 单测类型由 `vitest/vue/tsconfig.vue.json` 的 vue-tsc 检查；fixture SFC 放在对应 `__tests__/fixtures`。unit 不能用通用 `.vue` shim 掩盖模板类型错误。
- 浏览器用例在 `vue-browser` 项目中运行（Chromium），setup 为 `vitest/vue/vue.setup.ts`，类型由 `vitest/vue/tsconfig.vue.browser.json` 的 vue-tsc 检查，不加载 jest-dom 的 matcher 类型。
- 公共工具从 `@test/utils/vue` 或框架无关的模块导入。

## 写法

- 单测用 `@testing-library/vue`。`@testing-library/vue` 挂载后用 `replaceWith` 去掉 Vue Test Utils 的包裹 div，节点被移动，挂载期间（`onMounted`）获得的焦点随之丢失。autofocus 类单测断言 `HTMLElement.prototype.focus` 的调用对象（`vi.spyOn` 后读 `mock.contexts`），需要真实焦点的浏览器用例用 `createApp` 直接挂载到已在文档中的元素。
- Vue 的 `render` 从 `@test/utils/vue` 导入，每次 app 使用独立的 `idPrefix`，避免同一用例多个 app 的 `useId` 重复。`mockMatchMedia`、`mockResizeObserver` 的 `fire` 与 `fireLive` 会等待 `nextTick()`，调用时必须 `await`；`@test/utils/react` 的同名方法同步包裹 `act`（见 [React 测试](../react/testing.md)）。纯表格数据也可从 `@test/utils/table/data` 导入。
- 只用 `page` 与 `userEvent` 派发事件，不用浏览器环境下会访问 `process` 的 VTL `fireEvent`。
- 用 render 函数渲染组件的 Vue 测试写成 `.test.tsx` 与 `.browser.test.tsx`，首行是 `/** @jsxImportSource vue */`。组件的子内容写插槽对象（`<Comp>{{ default: () => ..., prefix: () => ... }}</Comp>`），只有默认插槽时可直接写函数（`<Comp>{() => 'text'}</Comp>`）；多个根节点写 `<>...</>`，不写 JSX 数组。`v-model` 写成 `modelValue` 与 `onUpdate:modelValue`（或 `activeKey` 与 `onUpdate:activeKey`），`class`、`style` 用 Vue 的写法（`class`，`style` 的值写带单位的字符串）。原生属性与监听器直接写（`onClick`、`id`）；用例要传类型不接受的属性（F11 组件上的 `id`）时写成 `{...{ id }}`，展开对象不做多余属性检查，但已声明的属性仍按类型检查，数组形式的监听器要断言类型。把 attrs 转发给组件的 fixture 在 `defineProps` 里用 `/* @vue-ignore */` 交叉被包装组件的属性类型（`InstanceType<typeof Comp>['$props']`，泛型组件用 `Parameters<typeof Comp>[0]`）。组件类型来自变量（参数、`Component` 类型的值）时 JSX 无法使用，保留 `h()`。依赖模板编译的场景使用 fixture SFC，不用依赖运行时编译的字符串模板。
- 受控行为至少覆盖单向绑定、父级同值重渲染、显式 undefined、受控转非受控。默认值检查覆盖注入的 semiGlobal 与函数 prop；Boolean prop 必须有 default 键，Function prop 的 default 必须为 undefined。
- 浏览器用例对齐 React 的键盘、焦点与 axe 断言，不依靠 vuejs-accessibility 覆盖所有非交互 role/tabindex 约束。卸载后确认 Teleport、监听器与 observer 清理。
