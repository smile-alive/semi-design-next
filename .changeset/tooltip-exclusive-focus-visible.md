---
'@fibrae/semi-foundation': patch
'@fibrae/semi-ui-react': patch
'@fibrae/semi-ui-vue': patch
'@fibrae/semi-ui-solid': patch
'@fibrae/semi-ui-svelte': patch
---

Tooltip 不再同时显示多个提示。

- hover、focus 触发的提示（`role="tooltip"`）同一时间只显示一组：一个打开时关闭其他已打开的，几个在延迟内先后请求显示时只显示最后一个，嵌套在其触发器或弹层中的除外。例如鼠标停在相邻按钮上时按 Esc 关闭 Modal，焦点还回的按钮与指针下的按钮不再各显示一个提示。
- hover 触发的弹层只在触发器 `:focus-visible` 时随聚焦打开，鼠标点击关闭 Modal 后还回的焦点不再弹出提示。
- React：指针从触发器直接移入紧挨着的 hover 弹层（含 Dropdown 菜单）时，弹层不再偶发自动关闭。
- Form 标签的提示按钮改用描边问号图标，视觉上比实心图标轻，颜色与对比度不变。
