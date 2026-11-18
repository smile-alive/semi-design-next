---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Spin 新增 `minDuration`：加载效果显示后至少保持的毫秒数，避免刚显示就消失的闪烁。

四个框架的 hook 入口新增 `useSpinDelay`，把任意加载状态转换成“是否显示加载效果”：加载超过 `delay`（默认 500ms）才显示，显示后至少保持 `minDuration`（默认 200ms）。初始渲染时已在加载则立即显示，`ssr: false` 时每次挂载都等待 `delay`。
