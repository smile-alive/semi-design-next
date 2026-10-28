# Solid lint

共享规则见 [lint](../lint.md)。

- Solid 范围经 oxlint 的 `jsPlugins` 加载 `eslint-plugin-solid`，启用它的 TypeScript 预设（`configs/typescript`）并全部按 error 处理，另开 `jsx-a11y`。Solid 没有模板语言，不另起 ESLint。
- oxlint 的 `no-unassigned-vars` 看不到 Solid 编译器对 `ref={el}` 的赋值，元素 ref 写成函数形式 `ref={(node) => (el = node)}`。
- `lint/solid/exemptions.ts` 按文件登记 Solid 的豁免，只列确实报错的规则。
- `lint/solid/component-order.ts` 登记 Solid 组件的语句顺序调用表，`pnpm lint:component-order` 读取它。
