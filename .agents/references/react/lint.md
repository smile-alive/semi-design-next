# React lint

共享规则见 [lint](../lint.md)。

- React 插件只在 React 范围启用：`react/*` 规则只作用于 React 包与站点 React 文件，不作用于其他框架的文件，避免误报。
- `react/todo` 规则查出会让 React Compiler 放弃编译的语法（见 [components](components.md) 的 React Compiler 一节）。
- `pnpm lint:react` 运行 `compiler-check.ts`，检查全部 semi-ui-react 源码的 React Compiler 编译情况，已在 `pnpm lint` 中运行。单文件检查：`cd website && node scripts/compiler-check.ts ../packages/semi-ui-react/src/<文件>...`。
- `lint/react/exemptions.ts` 的 `reactIconOnClickExemptions` 登记图标 onClick 的豁免，`pnpm lint:private` 读取它。
- `lint/react/component-order.ts` 登记 React 组件的语句顺序调用表，`pnpm lint:component-order` 读取它。
