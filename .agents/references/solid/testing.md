# Solid 测试

共享规则见 [testing](../testing.md)。

## 项目与入口

- Solid 单测在 `solid` 项目中运行（jsdom，`unplugin-solid` 编译 JSX），setup 为 `vitest/solid/solid.setup.ts`，类型由 `vitest/solid/tsconfig.solid.json` 检查。
- `*.browser.test.tsx` 在 `solid-browser` 项目中运行（Chromium，与其他浏览器项目同一套浏览器配置），类型由 `vitest/solid/tsconfig.solid.browser.json` 检查。
- 用 `@solidjs/testing-library` 的 `render(() => <Comp />)`，公共工具从 `@test/utils/solid` 导入，浏览器工具从 `@test/utils/browser` 导入。

## 写法

- prop 变化用 `createSignal` 驱动：`const [size, setSize] = createSignal(...)`，渲染 `<Comp size={size()} />`，调用 `setSize` 后同步断言，不需要等待。Solid 的写入是同步的，`mockMatchMedia`、`mockResizeObserver` 的 `fire` 不用 `await`。
- Portal 内容不在 `render` 返回的 `container` 里，用 `screen` 或 `document` 查询。
- 设置 `semiGlobal.config.overrideDefaultProps` 的用例在 render 之前设置，并在 `afterEach` 里还原为原值。
- 受控用例至少覆盖单向绑定、显式 `undefined`、受控转非受控；回调参数用 `vi.fn<NonNullable<XxxProps['onChange']>>()` 断言。
- `inert` 写作 `inert={...}`（Solid 1.9 的 JSX 类型没有 `bool:` 命名空间）。Solid 把它当 property 写入，jsdom 不反射到 attribute，单测断言 `element.inert`，浏览器测试可断言 attribute。
