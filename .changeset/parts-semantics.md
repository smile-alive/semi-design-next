---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

同名部位跨组件同义：`dropdown` 落在弹出内容的根元素，选项列表用 `list`；`input` 只指原生 `<input>`。

破坏性：

- AutoComplete 的弹出内容在列表外新增一层 `semi-autocomplete-option-list-wrapper`，`dropdown` 改为落在这层上，列表改用新增的 `list` 部位。
- Select、Cascader、TreeSelect、TagInput、PinCode、TimePicker、DatePicker、ColorPicker 的 `input` 改为落在原生输入框上（原为输入框组件的根元素）。
