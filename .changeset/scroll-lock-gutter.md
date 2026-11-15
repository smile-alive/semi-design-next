---
'@fibrae/semi-foundation': patch
---

锁定滚动与弹层遮挡的修复。

- 锁定滚动时，页面有滚动条就给根元素设 `scrollbar-gutter: stable`，`position: fixed` 的元素不再随滚动条消失横移（不支持的浏览器仍给 body 加 `padding-inline-end`）。
- 模态层只隐藏被它遮挡的顶层弹层（`:popover-open`），页面上以关闭的 popover 形式存在的元素（如只在窄屏是抽屉的侧边栏）不再在 Modal 打开时消失。
