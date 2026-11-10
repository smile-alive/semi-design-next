# @fibrae/semi-ui-svelte

[简体中文](README.zh-CN.md)

The Svelte component library of Semi Design Next, for Svelte 5.57+ applications. It is a community fork of [Semi Design](https://github.com/DouyinFE/semi-design), unaffiliated with ByteDance and the Semi Design team, and shares the logic and styles of one foundation with the UI packages of other frameworks.

## Installation

```sh
pnpm add svelte @fibrae/semi-ui-svelte @fibrae/semi-icons-svelte
```

Peer dependency: `svelte` ^5.57.0. For browser, module format, Node.js and build plugin requirements, see the [requirements in Getting Started](../../website/content/start/getting-started/index.en-US.mdx#requirements).

## Usage

```svelte
<script lang="ts">
    import { Button, Switch } from '@fibrae/semi-ui-svelte';

    let checked = $state(false);
</script>

<Button theme="solid" type="primary">Hello Semi</Button>
<Switch bind:checked aria-label="Switch" />
```

Styles and theme tokens load with the components. You do not need to import base styles or reset.css.

### Entry points

| Entry                                      | Description                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-ui-svelte`                   | All components and types, `ConfigProvider`, `LocaleProvider`, `LocaleConsumer`, `useLocale` and `semiGlobal`                                      |
| `@fibrae/semi-ui-svelte/locale`            | The built-in locale packs `zh_CN` and `en_US`, and the `Locale` and `LocaleInput` types                                                           |
| `@fibrae/semi-ui-svelte/<directory>/index` | Deep file paths that map one-to-one to the directories under `src/components/`; component files are `<directory>/<name>.svelte`                   |
| `@fibrae/semi-ui-svelte/hooks`             | `useLocale`, `useClickOutside`, `useCopied` and the attachment `observeResize`                                                                    |
| `@fibrae/semi-ui-svelte/tokens`            | Theme tokens and base rules. Import it first in the application entry so tokens still load with the entry when the first component is lazy-loaded |
| `@fibrae/semi-ui-svelte/styles.css`        | The full stylesheet, for loading all component styles at once                                                                                     |
| `@fibrae/semi-ui-svelte/tailwind.css`      | The Tailwind v4 `@theme inline` mapping                                                                                                           |

The package ships `.svelte` source and `.d.ts` files, not compiled output. `exports` carries the `svelte` condition, and `@sveltejs/vite-plugin-svelte` (built into SvelteKit) compiles for the application's target (DOM or server). Tools that neither honor the `svelte` condition nor compile `.svelte` cannot use this package.

To use the full `styles.css`, turn on `omitCss` in `@fibrae/semi-vite-plugin`; otherwise the style imports inside the components are bundled a second time. The full stylesheet already includes tokens, and under `omitCss` the `tokens` entry is removed along with the component styles.

When using `@fibrae/semi-ai-svelte` with the full stylesheet, import `@fibrae/semi-ai-svelte/styles.css` after `styles.css`.

### Customizing styles

Override `--semi-*` CSS variables to change global colors, radii, font sizes and spacing. Semi's styles sit in `@layer semi`, so unlayered CSS rules in your application always win. There are no theme packages and no compile-time Sass overrides. The published `.scss` contains `semi:` addresses and must go through a build plugin (such as `@fibrae/semi-vite-plugin`) or `@fibrae/semi-scss-compile`.

### Internationalization

The default locale is `zh_CN`. The built-in packs `zh_CN` and `en_US` come from the `locale` entry. Pass a locale pack with `LocaleProvider`. Call `useLocale(componentName)` during component initialization. It returns a function, read as `locale().locale.xxx`, that updates when the locale changes:

```svelte
<script lang="ts">
    import { LocaleProvider } from '@fibrae/semi-ui-svelte';
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
</script>

<LocaleProvider locale={en_US}>
    <App />
</LocaleProvider>
```

For any other language, pass your own pack typed `LocaleInput`: `code` is required, and every text it leaves out falls back to `en_US`. For the structure of a locale pack, see [@fibrae/semi-foundation](../shared/semi-foundation/README.md#locale-packs).

### Server rendering

Components output server HTML with `render` from `svelte/server` and in SvelteKit, and the browser hydrates with `hydrate`. Keep in mind:

- Ids inside components come from `$props.id()`, so the server and browser agree.
- `onMount` and `$effect` do not run on the server, and state that depends on them (such as measured sizes) appears after hydration.
- Set `semiGlobal.config` only at application startup. The server and browser use the same config.

### Documentation

Component docs are in [website/content](../../website/content). To get started, read [Getting Started](../../website/content/start/getting-started/index.en-US.mdx).

## Related packages

- Depends on `@fibrae/semi-foundation` (logic and styles) and `@fibrae/semi-icons-svelte`.
- Used by `@fibrae/semi-ai-svelte` and the docs site `website`.
- The UI package of each framework (`semi-ui-<framework>`) shares the same foundation.

## Development

`pnpm --filter @fibrae/semi-ui-svelte build` runs `scripts/svelte-package.ts`: `svelte-package` outputs `src` to `dist` (`.svelte` files as they are, `.ts` compiled to `.js` and `.d.ts`). The script changes style imports to the foundation's `.css`, removes `__tests__`, and writes the full `styles.css` and `tailwind.css`.

For general commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root. For how to write components, see [components](../../.agents/references/svelte/components.md). For changes relative to upstream, see [release-notes](../../docs/release-notes.md).
