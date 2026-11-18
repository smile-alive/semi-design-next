---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

四个框架的 hook 入口新增公共 hook，用法见文档站的 Hooks 页：

- `useThemeMode`：读写 `html` 元素的 `theme-mode`，可跟随系统主题。
- `useBreakpoint`：按 Grid 断点返回各断点是否命中，不依赖 ConfigProvider 的 `responsiveObserve`。
- `useAnnouncer`：经整页共用的隐藏 live region 让屏幕阅读器播报。
- `useScrollLock`：锁定页面滚动，与 Modal、SideSheet 共用计数。
- `useHotKeys`：监听组合键，规则同 HotKeys 组件。
- `useControllableState`（React、Solid）：`value` / `defaultValue` / `onChange` 受控模式。
