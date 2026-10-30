# Svelte lint

共享规则见 [lint](../lint.md)。

- oxlint 检查 `.svelte` 的 `<script>` 与 `*.svelte.ts`，不检查模板。`.svelte` 模板由 ESLint 检查：`eslint.config.ts` 引入 `lint/svelte/eslint.ts`，用 `eslint-plugin-svelte` 的 recommended 配置，解析器为 `@typescript-eslint/parser`；`no-unused-vars` 设 `args: 'none'`，函数类型的参数交给 `svelte-check` 的 `noUnusedParameters`。
- `eslint-plugin-svelte` 没有 a11y 规则，模板 a11y 由 `svelte-check --fail-on-warnings` 承担，编译器警告按失败处理。`pnpm lint:svelte` 对全部 `packages/semi-*-svelte` 跑 `svelte-check`；`pnpm lint:svelte-template` 跑模板 ESLint，随 `pnpm lint:script` 运行。
- 豁免放在 `lint/svelte/exemptions.ts`，只列确实报错的规则：`off` 给 oxlint 的 script 规则，`templateOff` 给 ESLint 的 `svelte/*` 模板规则，`compilerOff` 给 Svelte 编译器警告码。`compilerOff` 经 `lint/svelte/compiler-warnings.ts` 的 `warningFilter` 生效，包内与仓库根的 `svelte.config.js` 都挂上它。源码与模板都不写 `svelte-ignore` 或禁用 lint 的注释。
- 包内 `src`（不含 `__tests__`）的相对导入写全扩展名：`.ts` 模块写 `.js`（`./utils.js`、`./locale/index.js`），`.svelte.ts` 模块写 `.svelte.js`，组件写 `.svelte`。`svelte-package` 原样发布导入路径，Node、webpack 的 `fullySpecified` 与 TS `nodenext` 都要求扩展名；`import/extensions` 在 `lint/svelte/index.ts` 中检查。
- `svelte.config.js` 必须存在：`svelte-check` 与 `svelte-package` 缺它时回退读根 vite 配置并报错。
- `lint/svelte/component-order.ts` 登记 Svelte 的语句顺序调用表：`.svelte` 的 `<script lang="ts">`（不含 `module`）用 `svelte-script` 目标，`*.svelte.ts` 用 `composables` 目标；`set*Context` 归下发 context，`export function` 归对外句柄。
- `vp fmt` 格式化 `.svelte`：`vite.config.ts` 的 `fmt` 开启 `svelte: true`，运行时读项目里的 `svelte/compiler`。`*.svelte` 覆盖为 `htmlWhitespaceSensitivity: 'strict'`：默认的 `css` 模式会在块级元素之间增删换行，而 Svelte 会把这些空白渲染出来。提交 hook 对 `.svelte` 依次跑 oxlint 修复、ESLint 修复与 `vp fmt`。
- `svelte/sort-attributes` 检查属性顺序：`this` 在最前，其余按名字排序，`on*` 事件在最后，只在两个 spread 之间排序，spread 本身的位置手写。eslint-plugin-svelte 3.23.1 会把简写属性（`{components}`）和指令（`bind:`、`class:`、`style:`）跨 spread 交换，改变覆盖关系；`pnpm-workspace.yaml` 的 `patchedDependencies` 用 `patches/eslint-plugin-svelte@3.23.1.patch` 修正。上游 sveltejs/eslint-plugin-svelte#1613 发版后删除补丁并升级；版本变了补丁对不上时 `pnpm install` 会报错。
- 验证改动的 `.svelte` 时运行 `vp lint --deny-warnings <路径>`、`pnpm exec eslint <路径> --max-warnings 0` 与 `pnpm --filter @fibrae/semi-ui-svelte exec svelte-check --fail-on-warnings`。
