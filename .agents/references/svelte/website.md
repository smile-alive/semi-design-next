# Svelte 文档站

共享规则见 [website](../website.md)。

- Svelte 路由（`src/pages/[locale]/svelte/`）随该页全部 demo 迁移完成而启用：页面有 React demo 时，按每个 demo 是否都有 `.svelte` 文件判断；没有 demo 的页面在 frontmatter 的 `frameworks` 里写上 `svelte`。
- Svelte demo 写在 `demos/<id>.svelte`，脚本用 `<script lang="ts">`，`website/tsconfig.svelte.json` 经 `svelte-check --fail-on-warnings` 检查（编译器 a11y 警告也算失败）。组件与图标从包根导入（`@fibrae/semi-ui-svelte`、`@fibrae/semi-icons-svelte`），类型取自包的 `dist`，与其他框架一样先 `pnpm build` 再 `pnpm typecheck`；不给包源码配 `paths`：`svelte-check` 会连带诊断被导入的包源码。
- demo 照组件的公开 API 写，不照搬 React 写法：
    - 没有 `default*` 属性。单向传值只作初值（`<Switch checked />`），需要读写的用 `bind:checked={value}`，需要拒绝或改写的用函数绑定 `bind:checked={() => value, (next) => { ... }}`。
    - 内容型属性传 snippet：在模板里用 `{#snippet name()}...{/snippet}` 定义后作为属性传入，或直接写在组件标签内（同名 snippet 自动成为属性）；默认内容就是标签内的其余内容（`children`）。
    - `style` 只接受字符串（`style="margin-left: 5px"`），原生事件用小写名（`onclick`）。
    - 状态用 `$state`，事件处理写成内联箭头函数或脚本里的函数。
- `.svelte` 与 MDX 里的 svelte 代码块由 `vp fmt` 格式化，属性顺序由 `svelte/sort-attributes` 检查。demo 的模板由 `pnpm lint:svelte-template` 检查。
- Svelte API 的说明写在 `api.svelte.json`，`source` 指向组件的 `.svelte` 文件。`gen-svelte-api.ts` 读组件脚本里带类型标注的 `let { ... }: XxxProps = $props()`：属性取自标注的类型（来自 `interface.ts`），不含 `svelte/elements` 的原生属性，但组件按名解构的原生属性（如 `children`）算作自有属性；默认值取 `defaults('<key>', <fallback>)` 的 fallback 与 `$bindable(<fallback>)` 的参数；Methods 取实例脚本里的 `export function`（使用方经 `bind:this` 调用），组件有方法时才写 `methods`。snippet 属性的类型列显示 `Snippet` 或 `Snippet<[参数]>`，说明里写明它是 snippet 以及参数含义；可绑定的属性在说明里写 `bind:<名>`。生成的双语片段只由 `pnpm --filter semi-website gen:svelte-api [<分类>/<页面>...]` 更新；缺说明或过时说明都报错。
- 正文的 Svelte 专属说明写在 `<Framework only="svelte">`，引入示例的代码块语言写 `svelte`。
- 基线回落：Svelte 页面缺少基线时回落到 React 的基线（见 [check-pages](../../skills/check-pages/SKILL.md)）。
