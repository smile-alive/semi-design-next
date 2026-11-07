# @fibrae/semi-illustrations-svelte

[简体中文](README.zh-CN.md)

The Svelte illustration components of Semi Design Next. Export names match `@fibrae/semi-illustrations-react` (each set has a `Dark` variant).

## Installation

```shell
pnpm add @fibrae/semi-illustrations-svelte
```

Peer dependency: `svelte` ^5.57.0. `@fibrae/semi-icons-core` and `@fibrae/semi-icons-svelte` are regular dependencies and install with the package. Ships `.svelte` source, compiled through the `svelte` condition by `@sveltejs/vite-plugin-svelte` (built into SvelteKit).

## Usage

```svelte
<script lang="ts">
    import { IllustrationIdle } from '@fibrae/semi-illustrations-svelte';
</script>

<IllustrationIdle width="150" height="150" />
```

- The export name is `Illustration` plus the illustration name, and dark variants add a `Dark` suffix.
- Each illustration is an `svg` component whose attributes pass through to the root `svg`, with a default size of 200, and decorative by default (`aria-hidden`).
- Gradient, mask and clipPath ids are generated per instance (`$props.id()`), so multiple instances on a page do not interfere, and the server and browser agree.
- Colors use `var(--semi-color-*)`, so the page must have the Semi theme styles loaded (provided by the styles of `semi-ui-svelte`). This package has no styles of its own.

Component docs are in [website/content/show/empty](../../website/content/show/empty).

## Related packages

- Depends on `components/svg.svelte` from `@fibrae/semi-icons-svelte`.
- Illustration data comes from `@fibrae/semi-icons-core/illustrations`, the same data the illustration packages of other frameworks read.
- The equivalent package for each framework is `@fibrae/semi-illustrations-<framework>`.

## Development

- All of `src/` is generated source, so do not edit it by hand. The illustration SVGs are in `svgs/illustrations` of `semi-icons-core`, as described in [semi-icons-core](../semi-icons-core/README.md#adding-illustrations). After changing them, run `pnpm build:icon` at the repository root to regenerate.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
