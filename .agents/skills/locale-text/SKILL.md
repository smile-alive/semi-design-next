---
name: locale-text
description: 给组件新增或修改可访问名称、内置文案时，补齐 57 个语言包、类型和用例。触发：语言包、locale、可访问名称、aria-label 写死、新增文案、翻译、国际化、i18n。
---

# 语言包文案

组件的可访问名称和内置文案一律从语言包读取。语言包在 `packages/semi-foundation/src/locale/source/`，共 57 个，每个文件都是 `const local: Locale = {...}`：类型就是完整性检查，漏了键 typecheck 会报错。

## 步骤

1. **定键**：在 `packages/semi-foundation/src/locale/interface.ts` 中对应组件的切片里加键，键名描述用途（`closableTag`、`pageN`）。有占位符的写成 `${名字}`，并用 JSDoc 说明它代表什么：

    ```ts
    /** `${page}` is the page number */
    pageN: string;
    ```

2. **写中英文**：`zh_CN.ts` 和 `en_US.ts` 手写，表达要符合读屏场景：说明控件做什么，不描述外观。
3. **补其余 55 个**：逐个文件用编辑工具加上同一个键，不用脚本批量改写；文件多时可以交给子代理分批处理。译文与该语言包里的已有用词保持一致。数词和复数要按语言规则处理：斯拉夫语、波罗的语、芬兰语、爱尔兰语等的数词形式与英文不同。
4. **登记复核**：除 zh_CN、en_US 外的译文是机器翻译，在 `docs/component-issues.md` 中待母语者复核的那一行补上新增的键或组件。
5. **组件读取**：

    读取写法按所改框架 `.agents/references/<框架>/components.md` 的「读取语言包」节。使用方传入的名称优先。名称落在真正的焦点目标上，见 `.agents/references/a11y.md`。各框架共用 foundation 的 57 个语言包，不复制文案。

6. **用例**：按所改框架 `.agents/references/<框架>/testing.md` 的「可访问名称用例」节，用 ja_JP 断言名称。ja_JP 既不是默认的 zh_CN，也不是英文，能证明名称真的来自语言包。
7. **验证**：

    ```bash
    pnpm build && pnpm typecheck
    vp test run --project common --project <框架> packages/semi-foundation/src/locale packages/<包>/src/locale packages/<包>/src/<组件目录>
    ```

8. **记录**：可访问名称或可见文案有变化时，写进 `docs/release-notes.md` 对应组件的章节。

## 新增语言

1. 新建 `packages/semi-foundation/src/locale/source/<code>.ts`：写成 `const local: Locale = {...}`，`code`、`dateFnsLocale`（从 `date-fns/locale` 导入）、`currency` 的含义见 `packages/semi-foundation/README.md` 的「语言包」一节。
2. 译全 `Locale` 的所有键，`${名字}` 占位符本身不翻译。
3. 跑 typecheck 确认键齐全。
4. 在文档站 `website/content/other/locale/index.zh-CN.mdx` 与 `index.en-US.mdx` 的表补上该语言：中文页的小节是「目前支持语言」，英文页是「Languages supported」。
5. 在 `docs/component-issues.md` 待母语者复核的行补上该语言包。
