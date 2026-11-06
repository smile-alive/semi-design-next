---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ui-vue': minor
---

Form 校验升级（破坏性）：错误一律为 `string[]`；删除 async-validator，`rules` 由自带规则引擎执行，默认文案来自语言包；字段 `rules` 与 `validator` 互斥，`validator` 可传 Standard Schema；`keepState` 默认开启并支持 ArrayField；有 `schema` 时必填星号只看 `label.required`；`FormApi` 区分输入与输出类型。新增 `schemaDebounce`、ArrayField 的 `move`、SchemaField 与 SchemaForm
