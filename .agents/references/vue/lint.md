# Vue lint

共享规则见 [lint](../lint.md)。

- Vue 范围使用 Vue 插件与 `.vue` 的 script 规则：`.ts` composable 与 `.vue` 不套用 React 规则，避免误报。
- `.vue` 模板由 ESLint 检查：`eslint.config.ts` 引入 `lint/vue/eslint.ts`，`eslint-plugin-vue`、`vuejs-accessibility` 负责模板；oxlint 检查 `.vue` 的 script，`eslint-plugin-oxlint` 读取 `lint/index.ts` 导出的 `lintConfig`，关闭重复规则。`.vue` 的 `no-unused-vars` 在最后重新开启。TypeScript 模板表达式由 TypeScript parser 解析。
- oxlint 的 type-aware 规则跳过 SFC。逻辑放 `.ts` composable 或 foundation，SFC 负责绑定；公开类型与模板由 `vue-tsc` 验证。
- props/emits 使用类型声明，props 用 `withDefaults` 得到的对象，不解构（`vue/define-props-destructuring` 设为 never），ref 明确类型。模板组件名用 PascalCase，属性和事件用 camelCase，保留 `aria-*` 与 `data-*`；`v-bind`、`v-on`、`v-slot` 使用简写，绑定属性始终写值。
- 模板里的内置元素（`template`、`slot`、`component`、`transition`、`transition-group`、`keep-alive`、`teleport`、`suspense`）不与其他元素的标签同行，由本地规则 `semi/builtin-own-line`（`lint/vue/builtin-own-line.ts`）检查并插入换行，缩进交给 `vp fmt`；内容只有文本与插值时可以写在一行。换行只插在按 Vue 的 `whitespace: 'condense'` 不改变编译结果的位置。紧贴文本或插值、与相邻元素只隔空格，或换行后会被 oxfmt 合并回一行、挂出悬空括号的内置元素保持原样，不报错。
- 属性排序由 `vue/attributes-order` 的固定分组与组内字母序决定。它不表达 JSX 的完整分组，不手工强求与 React 包完全一致。
- semi-ui-vue 与 semi-ai-vue 的 `.tsx`（Vue JSX）只开 oxlint 的 `jsx-a11y`，规则选项与其他 JSX 框架共用 `lint/jsx-a11y.ts` 的 `jsxA11yRules`，`react/*` 不开；Vue 的小写属性（`tabindex`、`for`）同样被识别。lint 看不到 JSX 编译后注入的 runtime 导入，漏写首行 pragma 时仓库内构建仍正常，只在站点被 `@vitejs/plugin-react` 按 React 编译，所以 pragma 由 semi-ui-vue 的 `_base/__tests__/base.test.tsx` 与 semi-ai-vue 的 `__tests__/package-conventions.test.ts` 的守卫用例检查。
- 豁免放在 `lint/vue/exemptions.ts`（只列确实报错的规则）。`off` 给 oxlint 的 script 规则，`templateOff` 给 ESLint 的 `vue/*` 或 `vuejs-accessibility/*` 模板规则，避免 oxlint 读取它不支持的模板规则。关闭框架插件的规则时，豁免 override 会带上该框架 overrides 启用的插件：oxlint 忽略 override 中既未在顶层、也未在本 override 启用的插件的规则。源码与模板都不写禁用 lint 的注释。
- `lint-private` 检查 `.vue` 中的 private 关键字，图标点击的 TSX 检查不覆盖模板。模板依赖 vuejs-accessibility，缺少的非交互 role/tabindex 规则由浏览器 axe 用例覆盖。
- `lint/vue/component-order.ts` 登记 Vue 的语句顺序调用表，`pnpm lint:component-order` 读取它；`pnpm lint:vue` 随 `pnpm lint:script` 运行。
- 验证改动的 `.vue` 时同时运行 `vp lint --deny-warnings <路径>` 与 `pnpm exec eslint <路径> --max-warnings 0`，再运行相应 `vue-tsc`。提交 hook 按 oxlint -> ESLint -> oxfmt 顺序修复。
