# @fibrae/semi-vite-plugin

[简体中文](README.zh-CN.md)

The Vite build plugin of Semi Design Next, for Vite applications that use the Semi UI and AI packages of any framework. It replaces the CSS class prefix, controls whether styles are wrapped in `@layer semi`, and can remove the `.css` imports inside Semi packages. Server-rendering hosts (React Router, SolidStart and others) rely on it to bring Semi packages into the server build and dev pre-bundling.

For browser-only rendering, the styles themselves load without the plugin. Themes are customized through `--semi-*` CSS variables (see [tokens](../../../website/content/basic/tokens)) and your own unlayered CSS, which always wins over styles inside `@layer semi`. The plugin has no compile-time theme or variables options.

## Installation

```shell
pnpm add -D @fibrae/semi-vite-plugin
```

Peer dependency: `vite >=8.0.0`. Ships ESM only.

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import semiTheming from '@fibrae/semi-vite-plugin';

export default defineConfig({
    plugins: [
        semiTheming({
            prefixCls: 'custom', // .semi-button -> .custom-button
        }),
    ],
});
```

The plugin is named `semi-theme` and has `enforce: 'pre'`. The package also has a named export `semiTheming` and the type `SemiVitePluginOptions`.

### Server rendering

Adding the plugin to the host config is enough for server rendering and hydration. By default, styles load per component (the component JS brings its own style imports), so do not import `styles.css`. The full stylesheet is an optional route: turn on `omitCss` and import `styles.css` once. Do not mix the two routes; mixing roughly doubles the CSS size.

| Host                                                      | Install                                                 | Host config                                                 | Styles                                                      |
| --------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| React Router 8 framework mode (including `serverBundles`) | `@fibrae/semi-ui-react`, `-D @fibrae/semi-vite-plugin`  | `plugins: [semi(), reactRouter()]`                          | None                                                        |
| SolidStart 2                                              | `@fibrae/semi-ui-solid`, `-D @fibrae/semi-vite-plugin`  | `plugins: [solidStart(), nitro(), semi({ omitCss: true })]` | Import `@fibrae/semi-ui-solid/styles.css` once in `app.tsx` |
| SvelteKit 3                                               | `@fibrae/semi-ui-svelte`, `-D @fibrae/semi-vite-plugin` | `plugins: [sveltekit({ adapter }), semi()]`                 | None                                                        |

```ts
// vite.config.ts (React Router)
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import semi from '@fibrae/semi-vite-plugin';

export default defineConfig({
    plugins: [semi(), reactRouter()],
});
```

SolidStart uses the full stylesheet because its dev server does not collect CSS imported by components in `node_modules` by default: the per-component route works in production, but the first dev render has no styles. Passing `css: { filter: { exclude: [/^(?!.*\/node_modules\/@fibrae\/semi-).*\/node_modules\//] } }` to `solidStart()` makes dev collect the component CSS of Semi packages too. The cost is one more host setting, and first-render dev styles slightly larger than the full stylesheet (about 20% more), split into dozens of `<style>` tags.

### Options

| Option      | Type      | Default | Description                                                                                                                                    |
| ----------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefixCls` | `string`  | `semi`  | CSS class prefix.                                                                                                                              |
| `cssLayer`  | `boolean` | `true`  | Whether compiled CSS is wrapped in `@layer semi { ... }`. `false` outputs unlayered CSS.                                                       |
| `omitCss`   | `boolean` | `false` | Comments out the `.css` imports inside Semi packages, for the route that imports the full `styles.css` once. Also applies to dev pre-bundling. |

### How it works

1. Intercepts requests for `.css` under `dist` of the Semi framework packages and shared packages (foundation, icons-core and others) and swaps the suffix for `.scss`. When the matching `.scss` exists, it reads that as the source.
2. Compiles through the `semi:` Sass importer, with `semi:theme` coming from `@fibrae/semi-foundation/theme/index.scss` and `$prefix` from `prefixCls`, then wraps in `@layer semi` according to `cssLayer`.
3. When `prefixCls` is set, rewrites `BASE_CLASS_PREFIX` in each `env.js`, and registers the plugin in `optimizeDeps.rolldownOptions.plugins` so the env modules in dev pre-bundling (`.vite/deps`) are rewritten too.
4. When `omitCss` is true, comments out the `.css` imports in JS under `dist` of Semi packages (including `.jsx` in the Solid packages and `.svelte` in the Svelte packages) so they never reach the bundler. It is also registered in `optimizeDeps.rolldownOptions.plugins`, so dev pre-bundling stops injecting component CSS.
5. For each server environment (`consumer` is `server`; when unset, Vite's default treats everything except `client` as server, which covers Nuxt and the `ssrBundle_*` of React Router `serverBundles`), sets `resolve.noExternal` to bundle the React and Vue UI, AI and icon packages into the server output, so Node does not have to load their `.css` imports. The foundation stays external by default. When `prefixCls` is set, foundation and ai-foundation are bundled into the server output as well (they hold `BASE_CLASS_PREFIX`, and staying external would leave server class names as `semi-`). In dev, vite-plugin-solid writes the non-Solid dependencies of Solid packages (including the foundation) into the server environment's `resolve.external`, and Vite checks `external` before `noExternal`. So when `prefixCls` is set, the plugin removes the foundation from it after all other plugins (`order: 'post'` on `configEnvironment`). Solid packages are left to vite-plugin-solid, and vite-plugin-svelte bundles Svelte packages into the server output through the `svelte` condition, so neither is included here.
6. For the `@fibrae/semi-ui-solid` and `@fibrae/semi-ai-solid` the application can resolve, it follows their direct foundation and ai-foundation dependencies and adds the dependencies in the foundation's `package.json` to `optimizeDeps.include` as `<Solid package> > <foundation> > <dependency>` (for example `@fibrae/semi-ai-solid > @fibrae/semi-foundation > hast-util-to-jsx-runtime`). vite-plugin-solid excludes Solid packages from pre-bundling, and their CommonJS dependencies cannot be imported in the browser without pre-bundling. A pnpm application that installs only ai-solid cannot resolve ui-solid, so the foundation's dependencies are listed through ai-solid. CommonJS files the foundation imports by a deep path that the dependency does not export (`lottie-web/build/player/lottie_light`) are added as well. Dependencies with no root entry (such as `@tiptap/pm`) are added subpath by subpath from `exports`; otherwise a directly imported subpath and the copy inlined by other pre-bundled dependencies would be two separate instances.

## Troubleshooting

In `vite dev`, class names are still `semi-*`, or dev still injects component CSS after turning on `omitCss`: the `.vite/deps` cache was generated without the plugin or with different options. Stop the dev server and pre-bundle again with `vite --force`.

## Related packages

- Bundles `@fibrae/semi-scss-compile/core` into `dist` at build time, not as a runtime dependency. The only runtime dependency is `sass`.
- Sibling plugins: [`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md), [`@fibrae/semi-rspack-plugin`](../semi-rspack/README.md) and [`@fibrae/semi-next`](../semi-next/README.md). Nuxt uses this plugin through [`@fibrae/semi-nuxt`](../semi-nuxt/README.md), with no hand-written `vite.plugins`.
- For a precompiled full stylesheet, see [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md).

## Development

- `pnpm --filter @fibrae/semi-vite-plugin build`: builds `dist/index.mjs` with `vp pack`.
- `pnpm --filter @fibrae/semi-vite-plugin test`: builds first, then uses `test/run.ts` to run fixture builds against the `dist` output (`entry`, `omit-entry`, `vue-entry`, `ai-entry` and `solid-entry`). It checks each environment's `noExternal` and Solid's `optimizeDeps.include` with `resolveConfig`, and the CSS imports in pre-bundling with a dev server.

For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
