---
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Banner（破坏性）：根元素不再固定 `role="alert"`，默认不设 `role`，传入的 `role` 落在根元素上。依赖读屏立即播报的场景要自己传 `role="alert"`。
