# @fibrae/semi-rspack-plugin

[简体中文](README.zh-CN.md)

The rspack 2 build plugin of Semi Design Next (`SemiRspackPlugin`), for rspack applications that use the Semi component packages. It replaces the CSS class prefix, controls whether styles are wrapped in `@layer semi`, and removes the `.css` imports inside Semi packages.

Styles are customized through `--semi-*` CSS variables (see [tokens](../../website/content/basic/tokens)) and your own unlayered CSS, which always wins over styles inside `@layer semi`. The plugin has no compile-time theme or variables options.

## Installation

```shell
pnpm add -D @fibrae/semi-rspack-plugin
```

Peer dependency: `@rspack/core ^2.0.0`. Ships ESM only.

## Usage

The plugin's loader outputs plain CSS, so the project needs a separate rule that treats `.scss` as CSS, such as rspack's native CSS support.

```js
// rspack.config.mjs
import { SemiRspackPlugin } from '@fibrae/semi-rspack-plugin';

export default {
    module: { rules: [{ test: /\.s?css$/, type: 'css' }] },
    plugins: [
        new SemiRspackPlugin({
            prefixCls: 'custom', // .semi-button -> .custom-button
        }),
    ],
};
```

### Options

The option type keeps the webpack plugin's name `SemiWebpackPluginOptions` and has only these three options (no `extractCssOptions` or `overrideStylesheetLoaders`):

| Option      | Type      | Default | Description                                                                                     |
| ----------- | --------- | ------- | ----------------------------------------------------------------------------------------------- |
| `prefixCls` | `string`  | `semi`  | CSS class prefix. Also rewrites `BASE_CLASS_PREFIX` in Semi's JS, including under `omitCss`.    |
| `cssLayer`  | `boolean` | `true`  | Whether compiled styles are wrapped in `@layer semi { ... }`. `false` outputs unlayered styles. |
| `omitCss`   | `boolean` | `false` | Removes the `.css` imports from JS under `dist` in Semi packages and stops compiling styles.    |

`omitCss` and `cssLayer` are mutually exclusive, and passing both throws in the constructor. For an unlayered stylesheet, generate it with [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md) (`semi-build-scss --no-layer`) and keep its `--prefix` the same as `prefixCls`.

### How it works

`apply` only appends rules to `compiler.options.module.rules`:

1. With `prefixCls` set: appends a prefix loader rule for each `env.js`.
2. With `omitCss`: appends only the rule that removes `.css` imports.
3. Otherwise: appends a rule that points `.css` imports in JS back to `.scss`, and a theme rule that compiles `dist/**/*.scss`. The latter compiles through the `semi:` Sass importer, with `semi:theme` coming from `@fibrae/semi-foundation/theme/index.scss`.

The rule constructors `applySemiRules`, `createSourceSuffixLoaderRule`, `createThemeLoaderRule`, `createOmitCssLoaderRule` and `createPrefixLoaderRule`, and the loaders (`semiScssLoader`, `semiPrefixLoader`, `semiSourceSuffixLoader` and `semiOmitCssLoader`), are also exported from the entry for assembling rules yourself.

## Related packages

- Bundles the private package `@fibrae/semi-theme-shared` into `dist` at build time. The only runtime dependency is `sass`.
- Sibling plugins: [`@fibrae/semi-vite-plugin`](../semi-vite/README.md) and [`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md).

## Development

Loaders are referenced by file path through `src/constants.ts`, so `vp pack` emits `src/index.ts` and `src/loaders/*.ts` separately in `unbundle` mode.

- `pnpm --filter @fibrae/semi-rspack-plugin build`: builds.
- `pnpm --filter @fibrae/semi-rspack-plugin test`: builds first, then uses `test/run.ts` to run fixture builds against the `dist` output (`entry`, `omit-entry`, `vue-entry` and `ai-entry`).

For general commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
