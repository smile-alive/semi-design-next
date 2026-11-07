# @fibrae/semi-webpack-plugin

[简体中文](README.zh-CN.md)

The webpack 5 build plugin of Semi Design Next (`SemiWebpackPlugin`), for webpack applications that use the Semi component packages. It replaces the CSS class prefix, controls whether styles are wrapped in `@layer semi`, removes the `.css` imports inside Semi packages (for Next.js), and lets you customize the style loader chain. [`@fibrae/semi-next`](../next/README.md) builds on it.

Styles are customized through `--semi-*` CSS variables (see [tokens](../../../website/content/basic/tokens)) and your own unlayered CSS, which always wins over styles inside `@layer semi`. The plugin has no compile-time theme or variables options.

## Installation

```shell
pnpm add -D @fibrae/semi-webpack-plugin
```

Peer dependency: `webpack` 5 (optional; at runtime the plugin takes the host's webpack through `compiler.webpack`, while the type declarations still reference `webpack`). Ships ESM only.

## Usage

```js
// webpack.config.mjs
import SemiWebpackPlugin from '@fibrae/semi-webpack-plugin';

export default {
    plugins: [
        new SemiWebpackPlugin({
            prefixCls: 'custom', // .semi-button -> .custom-button
        }),
    ],
};
```

Besides the default export, the package has the named type `SemiWebpackPluginOptions` and the loader functions `semiScssLoader`, `semiPrefixLoader` and `semiSourceSuffixLoader`.

Hosts that reference loaders by path (such as `turbopack.rules` in Next.js) get the loader files from subpath exports, for example `require.resolve('@fibrae/semi-webpack-plugin/semi-omit-css-loader')`:

| Subpath                  | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `./semi-omit-css-loader` | Comments out `.css` imports in JS                                                             |
| `./semi-prefix-loader`   | Rewrites constants in `env.js`, such as `BASE_CLASS_PREFIX`, according to `options.replacers` |

### Options

| Option                      | Type                                      | Default | Description                                                                                                                                                                |
| --------------------------- | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefixCls`                 | `string`                                  | `semi`  | CSS class prefix. Also rewrites `BASE_CLASS_PREFIX` in Semi's JS, including under `omitCss`.                                                                               |
| `cssLayer`                  | `boolean`                                 | `true`  | Whether compiled styles are wrapped in `@layer semi { ... }`. `false` outputs unlayered styles.                                                                            |
| `omitCss`                   | `boolean`                                 | `false` | Removes the `.css` imports from JS under `dist` in Semi packages and stops compiling styles. Styles come from a full stylesheet the application imports.                   |
| `extractCssOptions`         | `{ loader: string; loaderOptions?: any }` | None    | The loader that extracts CSS (such as the `mini-css-extract-plugin` loader). Without it, `style-loader` is used.                                                           |
| `overrideStylesheetLoaders` | `(loaders: any[]) => any[]`               | None    | Receives the default loader list (already including `extractCssOptions`) and returns a new list. Prefer appending your own loaders over removing or changing the defaults. |

`omitCss` and `cssLayer` are mutually exclusive: with no styles compiled, `cssLayer` has nothing to act on, and passing both throws in the constructor. For an unlayered stylesheet, generate it with [`@fibrae/semi-scss-compile`](../../shared/scss-compile/README.md) (`semi-build-scss --no-layer`) and keep its `--prefix` the same as `prefixCls`.

### How it works

1. Semi's JS imports the compiled `.css`. The plugin appends `semi-source-suffix-loader` to the JS under `dist` of the Semi framework packages (UI, AI, icons), which points those imports back to `.scss`.
2. `dist/**/*.scss` uses `[style-loader or extractCssOptions.loader, css-loader, semi-scss-loader]`. `semi-scss-loader` compiles through the `semi:` Sass importer, with `semi:theme` coming from `@fibrae/semi-foundation/theme/index.scss` and `$prefix` from `prefixCls`.
3. It gets the running webpack instance through `compiler.webpack`, so it works in Next.js, which bundles its own webpack.

## Related packages

- Bundles the private package `@fibrae/semi-scss-core` into `dist` at build time. Runtime dependencies are `css-loader`, `style-loader` and `sass`.
- Depended on by [`@fibrae/semi-next`](../next/README.md).
- Sibling plugins: [`@fibrae/semi-vite-plugin`](../vite/README.md) and [`@fibrae/semi-rspack-plugin`](../rspack/README.md).

## Development

webpack loads loaders by file path, so `vp pack` emits each source file as a separate `dist` file in `unbundle` mode.

- `pnpm --filter @fibrae/semi-webpack-plugin build`: builds.
- `pnpm --filter @fibrae/semi-webpack-plugin test`: builds first, then uses `test/run.ts` to run fixture builds against the `dist` output (`entry`, `vue-entry` and `ai-entry`).

For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
