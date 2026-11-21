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

所有带内部元素的组件都支持 `classNames`、`styles`，按部位名设置内部元素的类名与内联样式，便于配合 Tailwind 等工具类定制，部位清单见各组件 API 文档中 `classNames` 的说明。复合组件的父组件用 `item` 开头的键作用到全部子项（如 Steps 的 `itemTitle`、`itemDescription`），子项组件自己的 `classNames` 用不带前缀的键，写在父级之后。

破坏性：

- Radio 的 `addon` 部位改名为 `label`，TreeSelect 的 `optionList` 部位改名为 `list`。
- DatePicker 的 `triggerRender`、Tabs 的 `renderTabBar` 收到的参数改为传完整的 `classNames`、`styles`；Upload 不再经 `className`、`style` 把文件项样式传给自定义 `renderFileItem`。
