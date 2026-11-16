---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Select 的选项 value 支持布尔值，泛型改为按选项值推断（含破坏性类型变化）；Form 导出 `controlProps`、`singleItemName`。

- 破坏性（类型）：React、Vue、Solid 的 `Select`、`SelectProps`、`FormSelect`、`FormSelectProps` 的泛型改为 `<V, Multiple, WithObject>`。`V` 是选项 value 的类型（`string | number | boolean`），优先从 `optionList` 推断，内联选项推断为字面量联合；`WithObject` 跟随 `onChangeWithObject`（Vue 为 `changeWithObject`），对象模式下 `onChange` 收到 `OptionProps<V>`。原来的 `SelectProps<Item>` 改为 `SelectProps<string, undefined, true>`；删除 `BasicSelectValue`，新增导出 `SelectRawValue`、`SelectChangeValue`。
- 选项 value 可以是 `true`、`false`，`onChange`、`onSelect` 收到原始布尔值。
- Vue：`changeWithObject` 不再读全局默认值。
- Form：导出 `controlProps(node)`（`semiRenderers` 交给叶子控件的约束）与 `singleItemName(node, locale)`（单值数组行的名称），自写的 SchemaField 渲染器可以直接复用。
