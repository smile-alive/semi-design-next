# @fibrae/semi-icons-svelte

[简体中文](README.zh-CN.md)

The Svelte icon and illustration components of Semi Design Next, sharing the data and styles of `@fibrae/semi-icons-core` with the icon packages of other frameworks, for Svelte applications and `@fibrae/semi-ui-svelte`.

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
- A single icon has no props of its own, and all attributes pass through to `Icon`. `Icon` props: `size` (`inherit`, `extra-small`, `small`, `default`, `large` or `extra-large`, `default` by default), `spin`, `rotate`, `type` and `fill` (`string` or `string[]`). `style` accepts strings only.
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

### Illustrations

```svelte
<script lang="ts">
    import { IllustrationIdle } from '@fibrae/semi-icons-svelte/illustrations';
</script>

<IllustrationIdle width="150" height="150" />
```

- The export name is `Illustration` plus the illustration name, and dark variants add a `Dark` suffix.
- Each illustration is an `svg` component whose attributes pass through to the root `svg`, with a default size of 200, and decorative by default (`aria-hidden`).
- Gradient, mask and clipPath ids are generated per instance (`$props.id()`), so multiple instances on a page do not interfere, and the server and browser agree.
- Colors use `var(--semi-color-*)`, so the page must have the Semi theme styles loaded (provided by the styles of `semi-ui-svelte`).

### Entry points

| Entry                                             | Contents                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-svelte`                       | Default export `Icon`, named exports `IconXxx`, the types `IconProps`, `SvgProps` and others |
| `@fibrae/semi-icons-svelte/lab`                   | Color icons                                                                                  |
| `@fibrae/semi-icons-svelte/illustrations`         | Illustrations `IllustrationXxx` and `IllustrationXxxDark`                                    |
| `@fibrae/semi-icons-svelte/components/svg.svelte` | Component that renders icon or illustration data as a plain `svg`                            |

Component docs are in [website/content/basic/icon](../../website/content/basic/icon) and [website/content/show/empty](../../website/content/show/empty).

## Related packages

- Depends on the icon and illustration data and the icon styles of `@fibrae/semi-icons-core`.
- Used by `@fibrae/semi-ui-svelte` and `@fibrae/semi-ai-svelte`.
- The equivalent package for each framework is `@fibrae/semi-icons-<framework>`.

## Development

- `src/icons`, `src/lab` and `src/illustrations` are generated source, so do not edit them by hand. To add an icon or illustration, follow [Adding icons](../shared/semi-icons-core/README.md#adding-icons) or [Adding illustrations](../shared/semi-icons-core/README.md#adding-illustrations) in semi-icons-core and run `pnpm build:icon` at the repository root to regenerate.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
