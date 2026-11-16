---
'@fibrae/semi-ui-react': patch
'@fibrae/semi-ui-vue': patch
'@fibrae/semi-ui-solid': patch
'@fibrae/semi-ui-svelte': patch
---

补记 0.8.0 中已发布的两项 Table 修复。

- `onCell` 或 `render` 返回 `rowSpan: 0`、`colSpan: 0` 时不再多渲染单元格。
- 没有数值宽度的列随窗口缩放后，固定列的偏移随之更新，不再出现空白间隙。
