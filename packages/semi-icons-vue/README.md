# @fibrae/semi-icons-vue

[简体中文](README.zh-CN.md)

The Vue 3 icon components of Semi Design Next, sharing the data and styles of `@fibrae/semi-icons-core` with the icon packages of other frameworks, for Vue applications and `@fibrae/semi-ui-vue`.

## Installation

```shell
pnpm add @fibrae/semi-icons-vue
```

Peer dependency: `vue`. `@fibrae/semi-icons-core` is a regular dependency and installs with the package. Ships ESM only.

## Usage

```vue
<script setup lang="ts">
    import { IconSend } from '@fibrae/semi-icons-vue';
</script>

<template>
    <IconSend size="large" spin />
</template>
```

- Styles load with the components, with no separate import.
- A single icon has no props of its own, and all attributes pass through to `Icon`. `Icon` props: `size` (`inherit`, `extra-small`, `small`, `default`, `large` or `extra-large`, `default` by default), `spin`, `rotate`, `prefixCls`, `type` and `fill` (`string` or `string[]`).
- On multi-color icons, `fill` colors each part in order. Other icons pass `fill` to the root `svg`.
- Icons are decorative by default (`aria-hidden`). With `aria-label`, `aria-labelledby` or `tabindex >= 0`, they become `role="img"` and are no longer hidden.
- Custom icons: the default-exported `Icon` takes an `svg` node in its default slot.

### Color icons

```ts
import { IconAnchor } from '@fibrae/semi-icons-vue/lab';
```

### Entry points

| Entry                                           | Contents                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-vue`                        | Default export `Icon`, named exports `IconXxx`, the types `IconProps`, `IconSize` and `IconSlots` |
| `@fibrae/semi-icons-vue/lab`                    | Color icons                                                                                       |
| `@fibrae/semi-icons-vue/components/create-icon` | `createSvgComponent`, used by the illustration package                                            |

Component docs are in [website/content/basic/icon](../../website/content/basic/icon).

## Related packages

- Depends on the icon data and styles of `@fibrae/semi-icons-core`.
- Used by `@fibrae/semi-ui-vue` and `@fibrae/semi-illustrations-vue`.
- The equivalent package for each framework is `@fibrae/semi-icons-<framework>`.

## Development

- `src/icons` and all of `src/lab` are generated source, so do not edit them by hand. To add an icon, follow [Adding icons in semi-icons-core](../semi-icons-core/README.md#adding-icons) and run `pnpm build:icon` at the repository root to regenerate.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
