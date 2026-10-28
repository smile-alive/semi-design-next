# 仓库开发约束

本文件和 `.agents/` 是各编码 agent 在本仓库开发时共同遵守的说明，不按编辑器或产品分别复制；`CLAUDE.md` 只引用本文件。强制规则写在本文；细则在 `.agents/references/`，按需执行的工作流在 `.agents/skills/`。Claude Code 只扫描 `.claude/skills/`，那里的每一项都是指向 `.agents/skills/<name>` 的符号链接：新增或删除 skill 时同步增删链接，不放拷贝。细则与本文冲突时以本文为准，并修正细则。

仓库是 Semi Design Next，即 [Semi Design](https://github.com/DouyinFE/semi-design) 的社区 fork，不与上游同步，不保留向后兼容。`docs/` 放迁移决策、问题表和发布说明，不放写法规则。

## 开始工作

1. 查看 `git status --short`，读目标文件、调用方和测试。工作区常有其他人未提交的改动：不覆盖、不回退，同一文件里只动本任务的部分。不用 `git stash`（所有 worktree 共用一个 stash 栈）。
2. 按任务先读：

| 任务                                                                       | 先读                                                                                                                  |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 目录结构、支持环境、常用命令                                               | [README.md](README.md)                                                                                                |
| 已定决策（D、S、C、F 系列）与未完成事项                                    | [decisions](docs/decisions.md) 第 1、2 节；依赖现状看各 `package.json` 与 `pnpm-workspace.yaml` 的 catalog            |
| 某组件未结的问题、已知限制与保持原样的决定                                 | [component-issues](docs/component-issues.md)                                                                          |
| 相对原 Semi 的破坏性变化与行为变化                                         | [release-notes](docs/release-notes.md)                                                                                |
| TS/TSX 写法：导出、函数、类成员、依赖与工具函数、Node 脚本                 | [coding-style](.agents/references/coding-style.md)                                                                    |
| lint 目录隔离、作用域、导入边界与豁免                                      | [lint](.agents/references/lint.md)                                                                                    |
| 组件的跨框架协议：语句顺序、foundation 与 adapter、属性透传与 ref、context | [components](.agents/references/components.md)                                                                        |
| 角色、键盘、可访问名称、jsx-a11y 豁免                                      | [a11y](.agents/references/a11y.md)                                                                                    |
| 组件 SCSS、主题 token、逻辑属性、`@layer`                                  | [styles](.agents/references/styles.md)；主题插件协议见 styles 的「Sass 模块与 semi: importer」「主题 token 协议」两节 |
| 测试写法、浏览器测试的坑、验证范围                                         | [testing](.agents/references/testing.md)                                                                              |
| 文档站内容、demo、MDX、dev server                                          | [website](.agents/references/website.md)                                                                              |
| 解析源码做统计、检查或 codemod                                             | [ast](.agents/references/ast.md)                                                                                      |
| 修组件 bug                                                                 | [fix-component-bug](.agents/skills/fix-component-bug/SKILL.md)                                                        |
| 新增或修改可访问名称、内置文案                                             | [locale-text](.agents/skills/locale-text/SKILL.md)                                                                    |
| 扫描文档站页面、维护 a11y 基线                                             | [check-pages](.agents/skills/check-pages/SKILL.md)                                                                    |

改哪个框架的包或文件，就先读该框架目录下全部文件；改框架无关代码，只读共享文件。新增框架只加一行，并按 [lint](.agents/references/lint.md) 的步骤登记。

| 框架  | 包                      | 规则                        | lint          | 测试项目与目录                            |
| ----- | ----------------------- | --------------------------- | ------------- | ----------------------------------------- |
| React | `packages/semi-*-react` | `.agents/references/react/` | `lint/react/` | `react`、`react-browser`；`vitest/react/` |
| Vue   | `packages/semi-*-vue`   | `.agents/references/vue/`   | `lint/vue/`   | `vue`、`vue-browser`；`vitest/vue/`       |
| Solid | `packages/semi-*-solid` | `.agents/references/solid/` | `lint/solid/` | `solid`、`solid-browser`；`vitest/solid/` |

3. 涉及公开 API、目录结构，或与已定决策冲突的修改，先说明影响，等维护者决定；已定决策不重新讨论。

## 产品边界

- 各框架包支持的框架版本以其 `package.json` 的 `peerDependencies` 为准。浏览器支持 Chrome 120、Firefox 125、Safari 17.2 及以上（D15），用到的每项 JS、DOM 与 CSS 能力都要在这三个版本上成立：
    - es-toolkit 等已有依赖能直接替代的 JS 能力（如 `RegExp.escape`、Set methods、`Map.groupBy`），组件代码直接调用该函数；
    - 只能从全局补齐的 API 放进 `@fibrae/semi-polyfill`，组件代码照常调用原生 API，组件包不导入 polyfill；
    - 参数级差异与 CSS 新特性在 `semi-foundation/src/utils/supports.ts` 或组件 foundation 中挂载后检测，支持时走新写法，否则走兼容写法，注释写明可删除的浏览器版本；CSS 回退写在 `@supports not (...)` 块里。
- 部署在 HTTPS 下（D1），`navigator.clipboard`、`crypto.randomUUID` 直接用，不留回退。
- 发布物只有 ESM，由 `vp pack` 产出；不提供 UMD、CDN 构建。
- 支持服务端渲染与 hydration（React 另支持 RSC 客户端边界），写法见 [components](.agents/references/components.md#服务端渲染)。
- 原组件只作参考实现（F10）：a11y 按 WAI-ARIA 与 APG 的推荐做法；证据确凿的原有 bug 默认修复，并补一条在旧实现上会失败的用例；文档与代码不一致时，先用 git 历史判断原意，再改另一边。
- 属性落点以决策为准：F2 根元素透传未声明属性；F6 Props 类型为原 Semi 声明加属性落点元素的原生属性（`ElementProps`，同名时原 Semi 签名优先）；F7 对外导出的顶层组件都读全局默认值；F11 无根 DOM 的包装组件丢弃未声明属性；F12 对话框的 `aria-*` 落在 `role="dialog"` 元素上。
- 可访问名称和内置文案一律从语言包读取，不写死字面量；新增时 57 个语言包一起补齐。
- 已有成熟库能覆盖的能力（如 Motion 动画），Semi 只提供给该库使用的预设，不做包装组件或绑定包。

## 包与依赖

- `packages/semi-foundation` 与框架无关，不依赖任何框架和 UI 包；组件逻辑放 foundation，各框架包用本框架的原生机制通过 adapter 接入，框架包之间不互相导入。
- 同包模块用相对路径导入；跨 Semi 包用包名（`@fibrae/semi-*`），不用指向另一个包源码的相对路径。这两条由 lint 检查。
- 文件属于哪个框架只看命名：框架包命名为 `semi-<名>-<框架>`；包外为某个框架写的文件命名为 `<框架>.*` 或 `*.<框架>.*`（如 `<框架>.setup.ts`、`*.<框架>.tsx`），框架自有的扩展名按扩展名归属，细则见该框架的 lint.md。其余文件属于通用范围，不导入任何框架的模块，由 lint 检查；`pnpm lint:scopes [文件...]` 查看归属。
- Node 与 pnpm 的版本以 `mise.toml` 为准，根 `package.json` 的 `packageManager` 与之一致。共用依赖走 `pnpm-workspace.yaml` 的 catalog。
- 新依赖先查已有依赖、语言原语和 foundation 工具能否覆盖；解析源码不新增解析器依赖。依赖与工具函数的写法见 [coding-style](.agents/references/coding-style.md#依赖与工具函数)。
- 生成文件只由生成命令更新：`pnpm build:icon` 从 SVG 生成 semi-icons-core 数据、各框架的图标与插画组件源码。SVG 源文件里的 id 不手写 `{uid}`，生成器统一加前缀，渲染时按实例替换。

## 编码约定

- 格式化只用 `vp fmt`（oxfmt，含 `sortImports`），lint 使用 `vp lint`（oxlint）和 stylelint。框架另需的 lint 工具与例外见该框架的 lint.md。lint 规则按框架放在 `lint/<框架>/`，根目录只组合，细则见 [lint](.agents/references/lint.md)。
- TS/TSX 按 [coding-style](.agents/references/coding-style.md)。硬性规则：私有成员用 `#`，不用 TS `private`、`public` 和构造参数属性；Node 脚本写成 `.ts`，只用可擦除语法。
- 组件按 [components](.agents/references/components.md) 与所属框架的 components.md。硬性规则：对外导出的顶层组件都读全局默认值（F7），并在本框架 `semi-global.ts` 的类型里补上组件名；渲染与派生计算无副作用。各框架的其余硬性写法见上文框架表中该框架的 `components.md`。
- 样式按 [styles](.agents/references/styles.md)：Sass 变量是内部实现，不写 `!default`、不与 `semi:theme` 的名字重名；用逻辑属性，不写 `!important`。
- 测试按 [testing](.agents/references/testing.md)：放在 `__tests__/`，断言可见行为；修 bug 先写在当前代码上会失败的用例。

## 注释

源码注释用英文，只写 WHY：业务约束、第三方的强制约定、为什么不能用显然的做法，以及已知限制和它的升级条件。不写修改历史，删代码不留墓碑。注释与实现矛盾时改注释。

## lint

- lint 报错先改代码。warning 也算失败（`--deny-warnings`、`--max-warnings 0`）。
- correctness 分类整类按 error 开启（`lint/base.ts` 的 `categories`），`lint/` 各模块的 `rules` 里只写带选项的规则和分类之外的规则。配置只允许收紧，放宽需要维护者授权。
- 必须保留的写法（语义上必须保留的 `role`、没有键盘操作的点击处理等），在文件所属框架的 `lint/<框架>/exemptions.ts`（框架无关的文件用 `lint/exemptions.ts`）中按文件加豁免条目，只列确实报错的规则，注释写明原因。JS、TS 源码里不写 `eslint-disable` 或 `oxlint-disable`。不预防性豁免，不照抄相邻文件的豁免。样式中刻意的物理值可以写带原因的 `stylelint-disable`。

## 验证

每条 shell 命令前先设置 PATH。Homebrew 的 Node 会遮住 mise 的 Node，全局 `pnpm` shim 也会让 `test:packed` 失败：

```bash
export PATH="$(mise where node@26.10.0)/bin:$(mise where pnpm@12.9.1):$PATH"
```

| 范围 | 命令 |
| --- | --- |
| 单元测试 | `vp test run --project <项目> <目录...>`，项目为 `common` 或框架名，`-t "<用例名>"` 只跑指定用例 |
| 浏览器测试 | `vp test run --project <项目>-browser <目录...>`，项目为 `common` 或框架名 |
| lint | `vp lint --deny-warnings <路径...>`，`pnpm lint:scopes`，`pnpm lint:private`，`pnpm lint:class-order`，`pnpm lint:component-order`，`pnpm lint:scss-variables`，`pnpm lint:style`，`pnpm lint:mdx-tables`（文档表格列数与 MDX 编译）；反复重跑整条 lint 用 `vp run --cache lint`，没变的步骤直接回放结果，`lint:style` 每次都执行（stylelint 加载 TS 配置时会写临时文件）；各框架的专属检查 `pnpm lint:<框架>` 见其 lint.md |
| 格式 | `pnpm format:check` |
| 类型 | `pnpm build && pnpm typecheck`（框架包和部分测试 tsconfig 读取 foundation 已构建的 dist，foundation 有改动时先 build） |
| 覆盖率 | `pnpm test:coverage`（全局阈值在 `vitest/index.ts`，包级阈值在所属框架的 `vitest/<框架>/index.ts`；不含 SSR 与 hydration 项目，它们由 `pnpm test:ssr` 另跑；两者已在 `check:full` 中） |
| 打包产物 | `pnpm build && pnpm test:packed` |
| 宿主夹具 | `pnpm build && pnpm test:hosts [宿主...] [--full]`；改动构建插件、发布形态或宿主相关代码时跑，需要网络或预热的 pnpm store，写法见 [testing](.agents/references/testing.md#宿主夹具) |
| 文档页面 | 见 [check-pages](.agents/skills/check-pages/SKILL.md) |
| 提交前 | `pnpm check`；完整校验 `pnpm check:full` |

- 只验证改动范围：相关目录的用例、改动文件的 lint；公开类型变化时跑 typecheck；改动布局、焦点或指针行为时才跑浏览器测试。全量测试和全站页面扫描在一批改动合入后跑一次，不为几行改动反复跑全套。
- 完成声明要有本次实际运行的输出，未执行或无法验证的部分标 `UNKNOWN`。

## 交付

- 回复和文档用简体中文，技术标识保持原文。结果用 `PASS`、`FAIL`、`SKIP`、`UNKNOWN` 标记。
- 组件的行为或公开 API 有变化时，写进 `docs/release-notes.md` 对应组件的章节；发现但不在本次范围内的问题，登记到 `docs/component-issues.md`。
- 文件用编辑工具修改，不用 sed、重定向、heredoc 或脚本改写内容；formatter、linter 自动修复和生成命令除外。用 codemod 改写仓库文件前，先说明范围并取得用户确认（见 [ast](.agents/references/ast.md)）。删除用 `trash`。一次性脚本放在仓库外的临时目录。
- 只在用户要求时 commit，不 push。commit 用 Conventional Commits：`type(scope)` 用英文，scope 写包名或组件目录名；subject 和 body 用简体中文，header 不超过 72 个字符；只暂存本任务的改动，不加 AI 署名。
