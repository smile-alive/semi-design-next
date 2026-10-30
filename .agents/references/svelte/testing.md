# Svelte 测试

共享规则见 [testing](../testing.md)。

## 项目与入口

- `vitest/svelte/index.ts` 注册四个项目：`svelte`（jsdom）、`svelte-ssr`（node）、`svelte-browser`（Chromium）、`svelte-hydration-browser`。
- jsdom 项目设 `resolve: { conditions: ['browser'] }`，不设时解析到服务端构建，`mount()` 抛错。`vitest/svelte/svelte.setup.ts` 在每个用例后调用 `cleanup`：`@testing-library/svelte` 不自动清理。
- hydration 项目经 `vitest/svelte/hydration-setup.ts` 起一个 SSR 模式的 Vite server，用 `svelte/server` 的 `render` 渲染服务端 HTML，经 `inject('svelteSsr')` 交给浏览器用例；浏览器用例写入 HTML 后调用 `hydrate`，断言没有 hydration 告警、两端 id 一致。
- 测试与 fixture 的类型由 `vitest/svelte/tsconfig.svelte.json`、`tsconfig.svelte.browser.json` 的 `svelte-check` 检查。

## 写法

- 测试文件写成 `.test.ts`、`.browser.test.ts`，组件用 `@testing-library/svelte` 的 `render(Component, { props })`。用到 `bind:`、snippet 或多个组件组合的场景，在同目录 `__tests__` 下写 `.svelte` fixture 组件（如 `switch/__tests__/switch-modes.svelte`），测试只渲染 fixture。
- 驱动 props 变化用 `_base/__tests__/store.svelte.ts` 的 `createStore` 建 `$state` 对象传给 fixture，测试里改它的字段，再调 `flushSync()`；不用 `rerender`。
- 交互用 `fireEvent` 后调 `flushSync()`，再断言 DOM。
- 有受控值的组件覆盖 `bind:`、函数绑定、单向传值、不传四种写法，参照 `switch/__tests__/switch-modes.svelte`。首帧可见的内容加一条 `svelte-ssr` 用例。
- 宿主改动跑 `_base/__tests__/host-contract.test.ts`，除「destroy 时 DOM 仍挂载」一条外必须通过。
