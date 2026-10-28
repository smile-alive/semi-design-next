# React 文档站

共享规则见 [website](../website.md)。

- React demo 只写函数组件，入口写 `export default function <组件名>Demo()`（如 `TabsDemo`），不写类组件；演示类组件作 children 的 demo（tooltip、popover 的 children 示例）除外。不随渲染变化的常量、辅助函数和子组件放在模块顶层。
- demo 入口返回 React 元素，多个兄弟节点用 Fragment，不返回数组或字符串：`client:visible` 下 Astro 按返回值识别 renderer，返回数组会被其他框架的 renderer 认领。
- React demo 和 `figures/` 用 TSX 编写。站点插图与站点外壳图标使用 React 渲染。
- 文档站用 React Compiler 编译（`react({ compiler: true })`），库构建不用。
- React API 的说明写在 `api.react.json`，`gen-react-api.ts` 从组件源文件的默认导出提取自有属性（不含 `@types/react` 的原生属性）、默认值和 `ref` 句柄或元素上的方法（组件有方法时才写 `methods`），生成的双语片段只由 `pnpm --filter semi-website gen:react-api` 更新；缺说明或过时说明都报错。默认值依次取自组件以自身 props 调用 `useDefaultProps` 时传入的默认值对象、组件参数解构里的默认值、模块顶层的 `defaultProps`，之后在函数体内解构的默认值读不到，写进说明；默认值写在内部渲染组件上的（如 Button），`source` 指向那个文件。具名导出的组件把 `source` 写成 `<文件>#<导出名>`。表格不设版本列，说明里不写原 Semi 的版本号。命令式 API 的选项、`formApi` 这类不是组件 props 的表格，在 React 块里手写。
