---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ui-vue': minor
---

Form 新增 `schema` 属性，接受 Zod、Valibot、ArkType 等实现了 Standard Schema 的校验对象，与字段的 `validator`、`rules` 及 Form 的 `validator` 互斥；字段首次挂载时显示已有的错误，整表 `reset()` 清空全部错误
