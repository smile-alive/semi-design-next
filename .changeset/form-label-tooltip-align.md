---
'@fibrae/semi-foundation': patch
'@fibrae/semi-ui-react': patch
'@fibrae/semi-ui-vue': patch
'@fibrae/semi-ui-solid': patch
'@fibrae/semi-ui-svelte': patch
---

Form 标签的 `tooltip` 问号图标调整：

- 与标签文字的中线对齐，不再低 2px；顶部与左侧标签位置都已修正，不带 tooltip 的标签间距不变。
- 默认尺寸由 16px 改为 14px，与标签文字同大。主题变量 `$width-form_label_tooltip-icon` 现在真正控制图标尺寸（默认值改为 `$font-size-regular`），此前被图标自身的默认尺寸覆盖。
