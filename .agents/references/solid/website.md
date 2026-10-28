# Solid 文档站

共享规则见 [website](../website.md)。

- Solid 路由随该页全部 demo 迁移完成而启用。
- Solid demo 写在 `demos/<id>.solid.tsx`，入口写 `export default function <组件名>Demo()`，`website/tsconfig.solid.json` 经 tsc 检查。不随渲染变化的常量与辅助函数放在模块顶层。
- `@astrojs/solid-js` 只编译 `semi-*-solid` 包与 `*.solid.tsx`，React 集成排除同一组文件（`astro.config.ts` 的 `solidFiles`）。
- Solid API 的说明写在 `api.solid.json`，`gen-solid-api.ts` 从组件源文件的默认导出提取自有属性（不含 solid-js 的原生属性）、模块顶层 `defaultProps` 的默认值和 `ref` 元素上的方法（组件有方法时才写 `methods`），生成的双语片段只由 `pnpm --filter semi-website gen:solid-api` 更新；缺说明或过时说明都报错。具名导出的组件把 `source` 写成 `<文件>#<导出名>`，默认值取自它传给 `mergeProps` 的模块顶层对象。命令式 API 的选项不是组件，在 Solid 块里手写表格。
- demo 里的 style 对象用 CSS 属性名（`'margin-right'`），数值带单位写成字符串。
- 基线回落：Solid 页面缺少基线时回落到 React 的基线（见 [check-pages](../../skills/check-pages/SKILL.md)）。
