---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ai-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ai-react': minor
'@fibrae/semi-ai-vue': minor
'@fibrae/semi-ai-solid': minor
'@fibrae/semi-ai-svelte': minor
---

内部元素的样式统一经 `classNames`、`styles` 设置（含破坏性变化），便于配合 Tailwind 工具类。

- 破坏性：删除各组件的 `xxxClassName`、`xxxCls`、`xxxStyle` 部位属性（如 Card 的 `bodyStyle`、Select 的 `dropdownClassName`、Modal 的 `maskStyle`、Tabs 的 `tabBarClassName`），改用按部位名分键的 `classNames`、`styles`，部位名见各组件的 API 表格；部位类名追加在组件自带类名之后，根元素仍用 `className`（Vue、Solid、Svelte 为 `class`）与 `style`。
- 破坏性：Spin 删除 `wrapperClassName`（与根元素的 `className` 重复）；Radio 的 `options` 项、Descriptions 的 `data` 项、Navigation 的 `items` 配置同样改用 `classNames`、`styles`。
- 全局 `overrideDefaultProps` 里的 `classNames`、`styles` 是默认值，组件传入时整体替换；InputNumber 内部的 Input 不再读取 Input 的全局默认值。
- Upload 的 `Upload.FileCard` 与 `renderFileItem` 参数新增类名，来自 `classNames.item`。
- Select 开启 `ellipsisTrigger` 的多选可搜索时，打开后搜索框留在标签所在行。
