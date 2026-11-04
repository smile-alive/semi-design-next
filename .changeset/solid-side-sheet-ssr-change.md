---
'@fibrae/semi-ui-solid': patch
---

修复 SideSheet 默认打开时在服务端渲染释放阶段误触发 `afterVisibleChange(false)`
