# @fibrae/semi-illustrations-vue

Semi Design Next 的 Vue 3 插画组件，导出名与 `@fibrae/semi-illustrations-react` 一致（每组含 `Dark` 变体），常配合 `@fibrae/semi-ui-vue` 的 `Empty` 使用。

## 安装

```shell
pnpm add @fibrae/semi-illustrations-vue
```

peer 依赖：`vue`。`@fibrae/semi-icons-core` 与 `@fibrae/semi-icons-vue` 是普通依赖，随包安装。仅发布 ESM。

## 使用

```vue
<script setup lang="ts">
    import { IllustrationIdle, IllustrationIdleDark } from '@fibrae/semi-illustrations-vue';
    import { Empty } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Empty>
        <template #image><IllustrationIdle :style="{ width: '150px', height: '150px' }" /></template>
        <template #darkModeImage><IllustrationIdleDark :style="{ width: '150px', height: '150px' }" /></template>
    </Empty>
</template>
```

- 导出名为 `Illustration` 加插画名，暗色变体加 `Dark` 后缀。
- 每个插画是一个 `svg` 组件，属性透传给根 `svg`，默认宽高 200，默认装饰性（`aria-hidden`）。
- 渐变、mask、clipPath 的 id 按实例生成，同页多个实例互不影响。
- 配色使用 `var(--semi-color-*)`，页面需要已加载 Semi 主题样式（由 `semi-ui-vue` 的样式提供），本包自身不含样式。

组件文档见 [website/content/show/empty](../../website/content/show/empty)。

## 与其他包的关系

- 依赖 `@fibrae/semi-icons-vue` 的 `createSvgComponent`。
- 插画数据来自 `@fibrae/semi-icons-core/illustrations`，与其他框架的插画包读取同一份。
- React 对应包是 `@fibrae/semi-illustrations-react`。

## 开发

- `src/illustrations` 是生成源码，不要手改。插画 SVG 在 `semi-icons-core` 的 `svgs/illustrations`，见 [semi-icons-core](../semi-icons-core/README.md#新增插画)；修改后在仓库根目录运行 `pnpm build:icon` 重新生成。
- 构建与测试命令见根目录 [README.md](../../README.md#常用命令)。
