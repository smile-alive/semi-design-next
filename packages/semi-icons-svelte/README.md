# @fibrae/semi-icons-svelte

Semi Design Next 的 Svelte 图标组件，与其他框架的图标包共用 `@fibrae/semi-icons-core` 的数据和样式，供 Svelte 应用和 `@fibrae/semi-ui-svelte` 使用。

## 安装

```shell
pnpm add @fibrae/semi-icons-svelte
```

peer 依赖：`svelte` ^5.57.0。`@fibrae/semi-icons-core` 是普通依赖，随包安装。发布 `.svelte` 源码，由 `@sveltejs/vite-plugin-svelte`（SvelteKit 已内置）经 `svelte` 条件编译。

## 使用

```svelte
<script lang="ts">
    import { IconSend } from '@fibrae/semi-icons-svelte';
</script>

<IconSend size="large" spin />
```

- 样式随组件引入，不需要单独引入。
- 单个图标没有自己的 props，所有属性透传给 `Icon`。`Icon` 的 props：`size`（`inherit`、`extra-small`、`small`、`default`、`large`、`extra-large`，默认 `default`）、`spin`、`rotate`、`prefixCls`、`type`、`fill`（`string` 或 `string[]`）；`style` 只接受字符串。
- 多色图标的 `fill` 按顺序给各部分上色；其他图标把 `fill` 传给根 `svg`。
- 图标默认是装饰性的（`aria-hidden`）。传 `aria-label`、`aria-labelledby` 或 `tabindex >= 0` 时改为 `role="img"` 且不隐藏。
- 自定义图标：默认导出的 `Icon` 用 `children` snippet 渲染自己的 `svg`，snippet 参数带上 `fill`。不支持 React 版的 `elementType` 与 ref。

```svelte
<script lang="ts">
    import Icon from '@fibrae/semi-icons-svelte';
</script>

<Icon size="large">
    {#snippet children({ fill })}
        <svg viewBox="0 0 24 24" {fill}><circle cx="12" cy="12" r="10" /></svg>
    {/snippet}
</Icon>
```

### 彩色图标

```ts
import { IconAnchor } from '@fibrae/semi-icons-svelte/lab';
```

### 入口

| 入口                                              | 内容                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `@fibrae/semi-icons-svelte`                       | 默认导出 `Icon`，具名导出 `IconXxx`、类型 `IconProps`、`SvgProps` 等 |
| `@fibrae/semi-icons-svelte/lab`                   | 彩色图标                                                             |
| `@fibrae/semi-icons-svelte/components/svg.svelte` | 按图标数据渲染 `svg` 的组件，供插画包使用                            |

组件文档见 [website/content/basic/icon](../../website/content/basic/icon)。

## 与其他包的关系

- 依赖 `@fibrae/semi-icons-core` 的图标数据与样式。
- 被 `@fibrae/semi-ui-svelte` 与 `@fibrae/semi-illustrations-svelte` 使用。
- React、Vue、Solid 对应包是 `@fibrae/semi-icons-react`、`@fibrae/semi-icons-vue`、`@fibrae/semi-icons-solid`。

## 开发

- `src/icons`、`src/lab` 整个目录是生成源码，不要手改。新增图标按 [semi-icons-core 的「新增图标」](../semi-icons-core/README.md#新增图标)操作，在仓库根目录运行 `pnpm build:icon` 重新生成。
- 构建与测试命令见根目录 [README.md](../../README.md#常用命令)。
