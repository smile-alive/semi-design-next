---
name: locale-text
description: 给组件新增或修改可访问名称、内置文案时，补齐 zh_CN、en_US 两个语言包、类型和用例。触发：语言包、locale、可访问名称、aria-label 写死、新增文案、翻译、国际化、i18n。
---

# 语言包文案

组件的可访问名称和内置文案一律从语言包读取。内置语言包只有 `packages/shared/semi-foundation/src/locale/source/` 下的 `zh_CN.ts` 与 `en_US.ts`，每个文件都是 `const local: Locale = {...}`：类型就是完整性检查，漏了键 typecheck 会报错。使用方传入的自定义语言包（`LocaleInput`）缺的键由 `resolve-locale.ts` 从 en_US 补齐，所以 en_US 必须有每一个键。

## 步骤

1. **定键**：在 `packages/shared/semi-foundation/src/locale/interface.ts` 中对应组件的切片里加键，键名描述用途（`closableTag`、`pageN`）。有占位符的写成 `${名字}`，并用 JSDoc 说明它代表什么：

    ```ts
    /** `${page}` is the page number */
    pageN: string;
    ```

2. **写中英文**：`zh_CN.ts` 和 `en_US.ts` 手写，表达要符合读屏场景：说明控件做什么，不描述外观。
3. **组件读取**：

    读取写法按所改框架 `.agents/references/<框架>/components.md` 的「读取语言包」节。使用方传入的名称优先。名称落在真正的焦点目标上，见 `.agents/references/a11y.md`。各框架共用 foundation 的语言包，不复制文案。

4. **用例**：在 UI 包 `src/components/locale/__tests__/` 或 AI 包 `src/__tests__/` 的 `accessible-names` 用例里，用 en_US 断言名称。en_US 不是默认的 zh_CN，能证明名称真的来自语言包。
5. **验证**：

    ```bash
    pnpm build && pnpm typecheck
    vp test run --project common --project <框架> packages/shared/semi-foundation/src/locale packages/<包>/src/locale packages/<包>/src/<组件目录>
    ```

6. **记录**：可访问名称或可见文案有变化时，写进 `docs/release-notes.md` 对应组件的章节。

不新增内置语言。其他语言由使用方按 `LocaleInput` 自己编写，写法见文档站 `website/content/other/locale/` 的「自定义语言包」一节。
