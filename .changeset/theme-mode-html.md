---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

破坏性：`theme-mode` 属性由 `body` 改到 `html` 元素。`useThemeMode` 和 Empty 的 `darkModeImage` 都读写 `html` 上的属性；写在 `body` 上的暗色样式仍生效，但 Empty 不再跟随。在 `<head>` 内用脚本设置 `html` 上的属性，首帧就以暗色绘制，不会闪白。
