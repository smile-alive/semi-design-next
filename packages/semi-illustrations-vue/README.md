# @fibrae/semi-illustrations-vue

[简体中文](README.zh-CN.md)

The Vue 3 illustration components of Semi Design Next. Export names match `@fibrae/semi-illustrations-react` (each set has a `Dark` variant), and they often pair with `Empty` from `@fibrae/semi-ui-vue`.

## Installation

```shell
pnpm add @fibrae/semi-illustrations-vue
```

Peer dependency: `vue`. `@fibrae/semi-icons-core` and `@fibrae/semi-icons-vue` are regular dependencies and install with the package. Ships ESM only.

## Usage

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

- The export name is `Illustration` plus the illustration name, and dark variants add a `Dark` suffix.
- Each illustration is an `svg` component whose attributes pass through to the root `svg`, with a default size of 200, and decorative by default (`aria-hidden`).
- Gradient, mask and clipPath ids are generated per instance, so multiple instances on a page do not interfere.
- Colors use `var(--semi-color-*)`, so the page must have the Semi theme styles loaded (provided by the styles of `semi-ui-vue`). This package has no styles of its own.

Component docs are in [website/content/show/empty](../../website/content/show/empty).

## Related packages

- Depends on `createSvgComponent` from `@fibrae/semi-icons-vue`.
- Illustration data comes from `@fibrae/semi-icons-core/illustrations`, the same data the illustration packages of other frameworks read.
- The equivalent package for each framework is `@fibrae/semi-illustrations-<framework>`.

## Development

- All of `src/` is generated source, so do not edit it by hand. The illustration SVGs are in `svgs/illustrations` of `semi-icons-core`, as described in [semi-icons-core](../semi-icons-core/README.md#adding-illustrations). After changing them, run `pnpm build:icon` at the repository root to regenerate.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
