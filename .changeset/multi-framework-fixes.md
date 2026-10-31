---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ai-vue': minor
'@fibrae/semi-ai-solid': minor
'@fibrae/semi-ai-svelte': minor
---

修复多框架组件缺陷，含两项破坏性变化。

破坏性变化

- Solid Carousel：每张幻灯片外包一层组件自己的元素，不再改写使用方元素；幻灯片要撑满轮播区域需自己设置 `height: 100%`。
- Feedback（四个框架）：`textAreaProps`、`radioGroupProps`、`checkboxGroupProps` 的类型去掉 `value`（Vue 为 `modelValue`），传入的值不再覆盖 Feedback 的值。

修复与新增

- Table：传 `groupBy` 时服务端首帧已含分组行；Vue 子列的 `defaultSortOrder`、`defaultFilteredValue` 在服务端首帧生效。
- ResizeGroup（React、Vue、Svelte）：中途插入的项按 DOM 顺序登记。
- Transfer（四个框架）：根元素不再带 `aria-required`，必填的 Form.Transfer 不再违反 ARIA。
- React：Form.InputGroup、Carousel、Layout 展开 Fragment 子元素；Popconfirm 切换 `disabled` 不再重新挂载触发器。
- Vue：Select 模板里不带值的 `multiple` 按多选渲染；插槽不在 render 外调用。
- Solid：Select、TreeSelect、Cascader、TagInput、AutoComplete 插槽内的控件不再继承 InputGroup 的尺寸与禁用；Sidebar 只在挂载时创建 header 与 detail。
- Svelte：IconButton 继承 InputGroup；Nav、Tree 的绑定值改回 `undefined` 时清空；多个组件组合使用方事件；Form 字段组件新增 `getControl()`；Chat 代码块高亮。
