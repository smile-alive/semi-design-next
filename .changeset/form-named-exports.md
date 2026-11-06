---
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

Form 改为只提供具名导出（破坏性），`Form` 不再挂静态成员：`Form.Input` 等字段改为 `FormInput` 至 `FormPinCode`，`Form.Section`、`Form.Label`、`Form.ErrorMessage`、`Form.Slot`、`Form.InputGroup` 改为 `FormSection`、`FormLabel`、`FormErrorMessage`、`FormSlot`、`FormInputGroup`，`Form.useForm`、`Form.SchemaField` 改为 `useForm`、`SchemaField`。新增类型导出 `FormErrorMessageProps`。
