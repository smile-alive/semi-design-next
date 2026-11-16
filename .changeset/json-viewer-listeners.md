---
'@fibrae/semi-json-viewer-core': patch
---

JsonViewer 的 DOM 监听在销毁时统一移除，折叠图标改为委托监听，反复悬停行号不再给每个新图标挂监听。
