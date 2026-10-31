---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Table 行选择支持 Shift 范围选择：按住 Shift 点击选择框（`clickRow` 时也可点击行，或在选择框上按 Shift+Space），把锚点到当前行之间的当前页可见行设成锚点的选中状态，跳过禁用行。范围选择只调用一次 `onChange`，不调用 `onSelect`；`checkRelation` 为 `'related'` 时按普通点击处理。
