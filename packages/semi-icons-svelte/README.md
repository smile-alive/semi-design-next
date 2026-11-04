# @fibrae/semi-icons-svelte

[简体中文](README.zh-CN.md)

The Svelte icon components of Semi Design Next, sharing the data and styles of `@fibrae/semi-icons-core` with the icon packages of other frameworks, for Svelte applications and `@fibrae/semi-ui-svelte`.

## Installation

```shell
pnpm add @fibrae/semi-icons-svelte
```

Peer dependency: `svelte` ^5.57.0. `@fibrae/semi-icons-core` is a regular dependency and installs with the package. Ships `.svelte` source, compiled through the `svelte` condition by `@sveltejs/vite-plugin-svelte` (built into SvelteKit).

## Usage

```svelte
<script lang="ts">
    import { IconSend } from '@fibrae/semi-icons-svelte';
</script>

<IconSend size="large" spin />
```

- Styles load with the components, with no separate import.
- A single icon has no props of its own, and all attributes pass through to `Icon`. `Icon` props: `size` (`inherit`, `extra-small`, `small`, `default`, `large` or `extra-large`, `default` by default), `spin`, `rotate`, `prefixCls`, `type` and `fill` (`string` or `string[]`). `style` accepts strings only.
- On multi-color icons, `fill` colors each part in order. Other icons pass `fill` to the root `svg`.
- Icons are decorative by default (`aria-hidden`). With `aria-label`, `aria-labelledby` or `tabindex >= 0`, they become `role="img"` and are no longer hidden.
- Custom icons: the default-exported `Icon` renders your own `svg` with a `children` snippet, and the snippet parameter carries `fill`. `elementType` and ref from the React version are not supported.

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

### Color icons

```ts
import { IconAnchor } from '@fibrae/semi-icons-svelte/lab';
```

### Entry points

| Entry                                             | Contents                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-svelte`                       | Default export `Icon`, named exports `IconXxx`, the types `IconProps`, `SvgProps` and others |
| `@fibrae/semi-icons-svelte/lab`                   | Color icons                                                                                  |
| `@fibrae/semi-icons-svelte/components/svg.svelte` | Component that renders an `svg` from icon data, used by the illustration package             |

Component docs are in [website/content/basic/icon](../../website/content/basic/icon).

## Related packages

- Depends on the icon data and styles of `@fibrae/semi-icons-core`.
- Used by `@fibrae/semi-ui-svelte` and `@fibrae/semi-illustrations-svelte`.
- The equivalent package for each framework is `@fibrae/semi-icons-<framework>`.

## Development

- `src/icons` and all of `src/lab` are generated source, so do not edit them by hand. To add an icon, follow [Adding icons in semi-icons-core](../semi-icons-core/README.md#adding-icons) and run `pnpm build:icon` at the repository root to regenerate.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
