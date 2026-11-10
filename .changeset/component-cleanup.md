---
'@fibrae/semi-ai-foundation': minor
'@fibrae/semi-ai-react': minor
'@fibrae/semi-ai-solid': minor
'@fibrae/semi-ai-svelte': minor
'@fibrae/semi-ai-vue': minor
'@fibrae/semi-animation': minor
'@fibrae/semi-foundation': minor
'@fibrae/semi-icons-core': minor
'@fibrae/semi-icons-react': minor
'@fibrae/semi-icons-solid': minor
'@fibrae/semi-icons-svelte': minor
'@fibrae/semi-icons-vue': minor
'@fibrae/semi-json-viewer-core': minor
'@fibrae/semi-next': minor
'@fibrae/semi-nuxt': minor
'@fibrae/semi-polyfill': minor
'@fibrae/semi-rspack-plugin': minor
'@fibrae/semi-scss-compile': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-vite-plugin': minor
'@fibrae/semi-webpack-plugin': minor
---

组件逻辑继续收进 foundation，修复已确认的组件问题并清理公开 Props；完整的破坏性变化与行为变化见仓库的 `docs/release-notes.md`。

- 破坏性：四个框架的 UI 包与 AI 包按 D18 整理组件目录，深路径随之变化；基础目录新增 `index` 入口。
- 破坏性：语言包只内置 `zh_CN`、`en_US`，经 `/locale` 入口导出；语言包删除 `dateFnsLocale`，日期组件按 `code` 取 date-fns 语言。
- 破坏性：DatePicker 设置 `timeZone` 时 `Date` 按时刻、字符串按该时区钟点处理；`onChange` 按 `type` 与 `multiple` 判别参数类型。
- 破坏性：Icon 的公开 Props 删除 `prefixCls`；React 的 UI、AI、图标包 `dist` 模块（入口除外）带 `'use client'`，`createSvgComponent` 只能在 `'use client'` 文件中调用。
- 破坏性：Grid 的 Row 一律 flex，Col 改用 CSS 变量；样式中的物理写法改为逻辑属性。
- Lottie 默认 SVG 渲染器改用 lottie-web light 构建；`@fibrae/semi-vite-plugin` 为 Solid dev 预构建补上该深路径。
- React：Server Component 传入的节点在 dev 下以 lazy 形态到达时先解开再使用；React、Solid 的 Tooltip 弹层支持 `aria-describedby`。
- Cropper 在 RTL 下按左上角定位；修复首帧、hydration、输入法与弹层相关问题。
