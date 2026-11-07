# @fibrae/semi-ui-vue

[简体中文](README.zh-CN.md)

The Vue component library of Semi Design Next, for Vue 3.5+ applications. It is a community fork of [Semi Design](https://github.com/DouyinFE/semi-design), unaffiliated with ByteDance and the Semi Design team, and shares the logic and styles of one foundation with the UI packages of other frameworks.

## Installation

```sh
pnpm add vue @fibrae/semi-ui-vue @fibrae/semi-icons-vue
```

Peer dependency: `vue` ^3.5.0. For browser, module format, Node.js and build plugin requirements, see the [requirements in Getting Started](../../../website/content/start/getting-started/index.en-US.mdx#requirements).

## Usage

```vue
<script setup lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Button @click="Toast.warning({ content: 'welcome' })">Hello Semi</Button>
</template>
```

Styles and theme tokens load with the components. You do not need to import base styles or reset.css.

### Entry points

| Entry                                        | Description                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-ui-vue`                        | All components and types, `ConfigProvider`, `LocaleProvider`, `LocaleConsumer`, `useLocale` and `semiGlobal`                                      |
| `@fibrae/semi-ui-vue/<directory>/index`      | Deep file paths that map one-to-one to the directories under `src/components/`                                                                    |
| `@fibrae/semi-ui-vue/tokens`                 | Theme tokens and base rules. Import it first in the application entry so tokens still load with the entry when the first component is lazy-loaded |
| `@fibrae/semi-ui-vue/styles.css`             | The full stylesheet, for loading all component styles at once                                                                                     |
| `@fibrae/semi-ui-vue/tailwind.css`           | The Tailwind v4 `@theme inline` mapping                                                                                                           |
| `@fibrae/semi-ui-vue/locale/source/<locale>` | Built-in locale packs, re-exporting `@fibrae/semi-foundation/locale/source/<locale>`                                                              |

To use the full `styles.css`, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. For Nuxt, use `semi: { omitCss: true }` in `@fibrae/semi-nuxt`. The full stylesheet already includes tokens, and under `omitCss` the `tokens` entry is removed along with the component styles.

When using `@fibrae/semi-ai-vue` with the full stylesheet, import `@fibrae/semi-ai-vue/styles.css` after `styles.css`.

### Customizing styles

Override `--semi-*` CSS variables to change global colors, radii, font sizes and spacing. Semi's styles sit in `@layer semi`, so unlayered CSS rules in your application always win. There are no theme packages and no compile-time Sass overrides. The published `.scss` contains `semi:` addresses and must go through a build plugin (such as `@fibrae/semi-vite-plugin`) or `@fibrae/semi-scss-compile`.

### Internationalization

The default locale is `zh_CN`. Pass a locale pack with `LocaleProvider`. `useLocale(componentName)` returns that component's text in the current locale:

```vue
<script setup lang="ts">
    import { LocaleProvider } from '@fibrae/semi-ui-vue';
    import en_GB from '@fibrae/semi-ui-vue/locale/source/en_GB';
</script>

<template>
    <LocaleProvider :locale="en_GB"><App /></LocaleProvider>
</template>
```

For the structure of a locale pack, see [@fibrae/semi-foundation](../../shared/foundation/README.md#locale-packs).

### Server rendering

Components render with `createSSRApp` and `renderToString`, and the browser hydrates with `createSSRApp(...).mount`. The server and browser must use the same `app.config.idPrefix`. Keep in mind:

- Overlays that open by default (`defaultOpen`, `visible` and so on) are not in the server HTML and open after hydration.
- The "today" marker of Calendar appears only after mount, so pass `displayValue` during server rendering. The server and browser time zones must match, or pass `timeZone` to DatePicker and TimePicker.
- Imperative APIs such as `Toast`, `Notification` and `Modal.confirm` can only be called in the browser, and throw an error explaining when to call them on the server.

### Documentation

Component docs are in [website/content](../../../website/content). To get started, read [Getting Started](../../../website/content/start/getting-started/index.en-US.mdx).

## Related packages

- Depends on `@fibrae/semi-foundation` (logic and styles) and `@fibrae/semi-icons-vue`.
- Used by `@fibrae/semi-ai-vue` and the docs site `website`.
- The UI package of each framework (`semi-ui-<framework>`) shares the same foundation.

## Development

`pnpm --filter @fibrae/semi-ui-vue build` runs `vp pack`: the TS and `.vue` files under `src` emit ESM and type declarations (including those for `.vue`) file by file into `dist`, along with component CSS and the full `styles.css` and `tailwind.css`. During the build, `tsconfig` keeps `jsx: preserve` for `vue-tsc`, and the bundling stage sets the automatic runtime separately, so a `CONFIGURATION_FIELD_CONFLICT` warning appears and is expected.

For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root. For how to write components, see [components](../../../.agents/references/vue/components.md). For changes relative to upstream, see [release-notes](../../../docs/release-notes.md).
