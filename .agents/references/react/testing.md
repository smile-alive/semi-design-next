# React 测试

共享规则见 [testing](../testing.md)。

## 项目与入口

- 单测在 `react` 项目中运行（jsdom），setup 为 `vitest/react/react.setup.ts`，类型由 `vitest/react/tsconfig.react.json` 检查。
- 浏览器用例在 `react-browser` 项目中运行（Chromium），类型由 `vitest/react/tsconfig.react.browser.json` 检查。
- 公共工具从 `@test/utils/react` 导入，浏览器工具从 `@test/utils/browser` 导入。
- 服务端渲染用例在 `react-ssr` 项目中运行（Node，没有 `document` 与 `window`），文件名为 `*.ssr.test.tsx`，见下一节。

## 服务端渲染与 hydration

- 用例表是各包的 `src/__tests__/ssr-cases.tsx`。新增导出要加用例，守卫要求每个大写导出都被覆盖。`html` 列出服务端 HTML 必须包含的字符串，子串定不到受控值时（如哪个标签页选中）另写断言函数 `check`；断言要与受控值绑定，换掉受控值后必须失败。默认打开的用例写 `opened`（弹层的 role），hydration 后等待它出现。
- `ssr.ssr.test.tsx`（`react-ssr` 项目）先 `renderToString`，再用 `prerender` 比较输出，最后断言没有 `console.error`（AI 包另断言 `console.warn`）。
- `hydration.test.tsx`（`react` 项目）逐条 hydrate 用例表，断言没有错误与 hydration 告警。`@test/utils/react` 提供两个工具：
    - `renderWithoutDocument(element)`：临时移走 jsdom 的 `document` 再 `renderToString`，渲染期读 `document` 会和 Node 中一样抛 ReferenceError。
    - `hydrateFromServer(element, beforeHydrate?)`：把这样得到的 HTML 放进 `document.body`，再 `hydrateRoot`，返回 `{ container, errors }`；`errors` 收集 recoverable error、uncaught error 和 hydration 告警，其他 `console.error` 照常输出。`beforeHydrate` 在 hydrate 前操作服务端 DOM，如改系统时间、触发图片事件。
- 服务端渲染时 `window` 与其他 jsdom 全局仍在，按 `typeof window` 分支的依赖两边都走浏览器分支，这类不一致用例发现不了，由 check-pages 的 SSR 验收覆盖。

## 写法

- `@test/utils/react` 的 `mockResizeObserver` 与 `mockMatchMedia` 的 `fire` 同步包裹 `act`，调用后不需要 `await`。
- `@test/utils/react` 的 `countLiveListeners` 与其他工具用法同共享规则，见 [testing](../testing.md)。
