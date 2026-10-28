---
name: fix-component-bug
description: 按 F10 修复各框架组件的缺陷：先查已有记录与原意，写会失败的用例，在根因处修复，再登记。触发：组件 bug、修复组件、行为不对、和文档不一致、回归、报错、无障碍问题。
---

# 修复组件缺陷

原组件只作参考实现（F10）：证据确凿的原有 bug 默认修复，a11y 按 APG 的推荐做法。公开 API、目录结构的变化，以及与已定决策冲突的修改，先报告维护者。

## 1 确认问题

1. 读组件、foundation、该目录的 `__tests__`，以及调用方（`git grep` 组件名和被改的函数）。
2. 查 `docs/component-issues.md` 中该组件的条目：它只记录未结问题、已知限制与保持原样的决定，已登记的按记录的状态和决定处理；已修复问题的历史用 `git log -S '<关键字>'` 与 `docs/release-notes.md` 查。查 `docs/release-notes.md`：行为可能是有意的变化，不是 bug。查 `docs/decisions.md` 第 1 节的决策表。
3. 文档和代码不一致时，先用 `git log -S '<关键字>' -- <文件>` 和 `git blame` 判断哪边是原意，再改另一边。
4. 能复现时记下最小复现步骤；只能静态推断时标为 `UNKNOWN`，并写明验证条件。

## 2 先写失败用例

- 按所改框架读 `.agents/references/<框架>/` 与共享的 `testing.md`，写在当前代码上会失败的用例，断言可见行为。需要真实布局、焦点或指针时写浏览器测试。
- 共享 foundation 的改动同时回放受影响的各框架调用方。
- 只用 `-t` 跑这一条，确认它失败，并记下失败输出：

    ```bash
    vp test run --project <框架> packages/<包>/src/<目录> -t "<用例名>"
    ```

## 3 修复

- 在根因处修一次：逻辑在 foundation 就改 foundation，共用函数就改共用函数，不在组件层打补丁。
- 搜索同一模式的其他位置：根因相同、且在本次范围内的一起修；其余的写进报告。
- 写法遵循所改框架的 `.agents/references/<框架>/components.md` 与共享的 `coding-style.md`。改了无障碍行为的，对照 `a11y.md`。

## 4 验证

- 重跑新用例和该目录的用例，lint 改动的文件。
- 公开类型有变化时跑 `pnpm build && pnpm typecheck`。
- 改了布局、焦点、指针或 demo 时，跑该组件目录的浏览器测试，并用 [check-pages](../check-pages/SKILL.md) 扫描相关页面。
- 按所改框架 `.agents/references/<框架>/lint.md` 中的验证命令执行。

## 5 登记

- `docs/component-issues.md`：修复了已登记的问题就删除该条；发现但不在本次范围内的问题补一条，写法与状态值按该文件开头的说明和图例。
- `docs/release-notes.md`：使用方能感知的变化，写进对应组件的章节。
- 文档页：API 表、Methods、键盘说明受影响时，zh-CN 和 en-US 同步修改。

## 报告

```text
组件：<目录>
根因：<一句话，带 文件:行>
修复：<改了什么，为什么在这里改>
证据：修复前失败的用例输出；修复后的检查命令与结果
同模式位置：<已一并修复 / 列出未处理的>
UNKNOWN：<未能验证的部分与条件>
```
