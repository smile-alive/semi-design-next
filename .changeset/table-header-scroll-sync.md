---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Table 横向滚动时表头与表体在同一帧移动（含破坏性变化）。

- 破坏性：设置 `scroll.y` 时表头改为表体滚动容器里吸顶的 `thead`，`scroll.y` 改为表头与表体合计的最大高度，同样的值表格矮一个表头高度；表头与表体合为一张原生表格，不再有 `.semi-table-header` 容器，也不再使用 `components.header.outer`（`virtualized`、`sticky` 的表头仍使用）。
- `virtualized` 的表头放进虚拟列表的滚动容器，`scrollToItem` 的目标行停在表头下方。
- `sticky` 表头在支持滚动驱动动画的浏览器中由 CSS 跟随表体，其余浏览器仍在滚动事件里同步。
- Table `bordered` 的底边改由表体绘制，横向滚动条下方的外框闭合。
- Toast 相邻条目的间距由 24px 改为 12px，与第一条距顶部的距离相同。
