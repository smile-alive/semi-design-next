---
'@fibrae/semi-foundation': patch
'@fibrae/semi-ui-react': patch
'@fibrae/semi-ui-vue': patch
'@fibrae/semi-ui-solid': patch
'@fibrae/semi-ui-svelte': patch
---

hover 弹层与 Cascader 的悬停展开加入指针宽限。

- Tooltip、Popover、Dropdown（含嵌套子菜单）、Navigation 弹出的子菜单：鼠标离开触发器后朝弹层一侧移动、且在离开点与弹层近侧两角围成的三角区内时，弹层保持打开，途经的其他 hover 触发器不打开，最长 300ms；离开三角区、反向移动或超时后照常按 `mouseLeaveDelay` 关闭，指针停留的触发器再打开。
- Cascader `showNext="hover"`：鼠标斜着移向已展开的下一列、途经同列其他选项时不切换，停留超过 300ms 或离开三角区后才切换到指针所在的选项。
