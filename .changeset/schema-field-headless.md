---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
---

SchemaField 与 SchemaForm 改为无头渲染器，Form 支持按任意路径定位（含破坏性变化）。

- 破坏性：SchemaField、SchemaForm 自身不再渲染界面，节点交给 `renderers: { object, array, field }` 渲染；要保留原来的界面，传 `renderers={semiRenderers}`。删除 `widgets`，改为展开 `semiRenderers` 后替换 `field`；`renderField` 的参数改为对应种类的渲染上下文，删除 `renderSection`、`renderItem` 与类型 `SchemaFieldRenderContext`、`SchemaFieldRenderer`。
- 渲染上下文交出节点的 `title`、`description`、`required`、`depth` 与数组行的 `item: { index, arrayTitle, arrayKey }`；数组另交出 `items`（含行的 `value`）、`add`（默认按 schema 生成新行）、`move`、条数与上下限、数组自身的 `error` 和 `fieldProps`。项在 schema 里的 `title`、`description` 原样交出，数组的说明不再合并项的说明。
- 新增导出 `semiRenderers`、`blankRow(jsonSchema, arrayField)`。由 Form `schema` 导出的 JSON Schema 按 schema 缓存，每行一个 SchemaField 时不再重复转换。
- 新增 `formApi.focusField` 与 Form 的 `onRevealField`；`formApi.scrollToField` 支持数组、对象节点等任意路径，改为返回 Promise，路径未渲染时先请调用方展开折叠容器。
- 新增 FormLabel 的 `tooltip`（字段 `label` 配置同名），说明以标签旁的问号按钮加 Tooltip 显示；新增 FormSection 的 `extraText`。
- 必填星号移到标签文字之前。
