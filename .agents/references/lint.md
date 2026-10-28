# 各框架 lint

脚本规则按框架放在 `lint/`，由根 `vite.config.ts` 的 `lint` 字段引入；模板语言的规则由根 `eslint.config.ts` 引入，样式在 `stylelint.config.ts`。格式统一由 `vp fmt` 处理。

- `lint/` 的分工：`base.ts` 放与框架无关的规则，`boundaries.ts` 放导入边界，`jsx-a11y.ts` 放写 JSX 的框架共用的 a11y 选项，`exemptions.ts` 放框架无关文件的豁免；每个框架一个目录（`<框架>/`），`index.ts` 导出 `FrameworkLint`（`lint/framework.ts`），自己的豁免放在同目录的 `exemptions.ts`。`lint/index.ts` 按 base、各框架、边界、豁免的顺序组合，豁免排在最后。override 的 `files` 一律写相对仓库根目录的路径。
- 框架范围由命名推导（`lint/framework.ts` 的 `frameworkFiles`）：`packages/semi-*-<框架>/**`、`**/<框架>.*`、`**/*.<框架>.*` 与框架自己的源文件扩展名；不属于任何框架的文件是通用范围。框架的主规则 override 用整个范围，只覆盖一部分文件的 override（属性排序、框架的编译器规则）与豁免必须落在范围之内。`pnpm lint:scopes` 输出各区域属于各框架与通用范围的文件数，带文件参数时逐个列出归属；文件同属多个框架、`packages` 列表与命名对不上、手写的 glob 匹配不到文件、框架的 override 或豁免超出范围、`lint/exemptions.ts` 的豁免落到框架文件上时失败。
- 新增框架：建 `lint/<框架>/`，导出 `FrameworkLint`，`files` 用 `frameworkFiles(<框架>)`，在 `lint/index.ts` 的 `frameworks` 中加一项；导入边界由各框架的 `files` 与 `imports` 自动推导。源文件里嵌 TypeScript 的框架（如单文件组件）在自己的 overrides 里把 `lint/base.ts` 的 `typescriptRules` 用到自己的扩展名。模板语言 oxlint 不能解析时，另写 `lint/<框架>/eslint.ts`，在 `eslint.config.ts`、`vite.config.ts` 的 `staged` 与 `package.json` 的 lint 脚本中各加一处。不在 package 里放 `lint` 配置：`vp lint` 与 `vp check` 只读根配置。
- 导入边界：通用范围不导入任何框架的 `imports`，框架范围不导入其他框架的 `imports`；foundation 与 semi-ai-foundation 另外不导入 `motion`（Semi 只为它提供预设），semi-foundation 也不导入 semi-ai-foundation，这两条排在最后，即使包内出现按框架命名的文件也照样生效。`imports` 是 gitignore 风格的模式，自动包含子路径，裸名也匹配最后一段路径；其中由 `frameworkSpecifiers` 按同一命名规则补上相对路径（进入 `semi-*-<框架>` 目录，或指向 `<框架>.*`、`*.<框架>`、`*.<框架>.*` 与框架自己的源文件扩展名），所以用相对路径导入框架文件同样受边界约束。只服务单一框架的第三方库要列进对应框架的 `imports`。框架范围与两个 foundation 内另外禁止指向其他 Semi 包源码的相对路径；仓库脚本与测试工具（`scripts/`、`vitest/packed`）属于通用范围，可以用相对路径读包源码。边界规则只写在 `lint/boundaries.ts`，不另写 `no-restricted-imports` override，否则会整条替换边界规则。构建插件的测试夹具、站点配置 `website/astro.config.ts` 与渲染框架图标的站点外壳 `.astro` 组件在 `lint/exemptions.ts` 豁免。
- 框架范围的插件与模板规则见各框架目录的 `lint.md`。豁免按文件所属框架放在 `lint/<框架>/exemptions.ts`，框架无关的文件放 `lint/exemptions.ts`；只加入实际报错的规则并解释原因。源码与模板都不写禁用 lint 的注释。
- 同包相对导入、跨包包名导入。测试工具按框架分入口（如 `@test/utils/<框架>`），框架无关的工具直接导入所在模块；导入另一框架的入口由边界规则拦下。
- `lint-private` 检查框架源文件中的 private 关键字，图标点击的 TSX 检查不覆盖模板。
- 检查命令：`pnpm lint:scopes [文件...]` 输出文件的归属框架；`pnpm lint:component-order` 检查各框架的组件体语句顺序；`pnpm lint:private`、`pnpm lint:<框架>`（框架专属检查）、`pnpm lint:script` 内的模板检查等见 `package.json` 的 `lint` 链。

## 新增框架

新框架 `<fw>` 只加自己的目录与注册项，不改其他框架的文件和共享正文：

1. 建 `lint/<fw>/`，导出 `FrameworkLint`（`lint/framework.ts`）：`files` 用 `frameworkFiles('<fw>')`，`componentOrder` 登记本框架的语句顺序调用表（`lint/<fw>/component-order.ts`）；有图标 onClick 豁免时填 `iconOnClickExemptions`，需要专用类型检查器时填 `typecheck`。
2. 在 `lint/index.ts` 的 `frameworks` 中加一项。oxlint overrides、导入边界、lint:scopes、语句顺序的目标、lint-private 的图标包与豁免、typecheck 检查器、vitest 的 `common` 排除都由这一项派生。
3. 在根 `tsconfig.json` 的 `references` 中加 `vitest/<fw>/tsconfig.<fw>.json` 与 `tsconfig.<fw>.browser.json`，以及该框架包的 tsconfig。
4. 建 `vitest/<fw>/index.ts` 导出 `TestFramework`，并在 `vitest/index.ts` 的 `testFrameworks` 中加一项；setup 放 `vitest/<fw>/<fw>.setup.ts`。
5. 在 `AGENTS.md` 的框架表中加一行。
6. 框架包的源码别名与 fmt 的 `framework` 分组各加一项。
7. 有框架专属检查时加 `lint:<fw>` 脚本并接到 `package.json` 的 `lint` 链尾。
8. 模板语言 oxlint 解析不了时才需要模板 ESLint 配置。
9. 建 `.agents/references/<fw>/` 下的 `components.md`、`testing.md`、`lint.md`；文档站接入该框架时再建 `website.md`，文档站的其余登记不在本步骤内。
