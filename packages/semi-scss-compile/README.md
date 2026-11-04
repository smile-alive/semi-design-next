# @fibrae/semi-scss-compile

[简体中文](README.zh-CN.md)

A command line tool (`semi-build-scss`) and JS API that compile the component styles of Semi Design Next into one CSS file, and generate the Tailwind v4 `@theme inline` mapping. Use it when:

- An application needs a precompiled stylesheet with its own class prefix, or without `@layer semi` (for example Next.js with `omitCss`).
- Building a framework's UI package, to produce `styles.css` and `tailwind.css`.

## Installation

```shell
pnpm add -D @fibrae/semi-scss-compile
```

Without `-f` and `-i`, it uses the foundation and icons-core this package depends on, so this package's version must match your component library. If they differ, pass `-f` explicitly, and under pnpm that package must be a direct dependency of the application. `--ai` requires a path, and under pnpm `@fibrae/semi-ai-foundation` must be a direct dependency of the application, with the same version as the component library.

Ships ESM only. Runtime dependencies are `sass`, `@fibrae/semi-foundation` and `@fibrae/semi-icons-core`.

## Command line

```shell
# Full stylesheet: foundation and icons-core resolve automatically
semi-build-scss -o app/semi.css --min

# Change the class prefix and drop the @layer wrapper
semi-build-scss --prefix my --no-layer -o app/semi-my.css

# AI component stylesheet: use --ai instead of --icon
semi-build-scss --ai node_modules/@fibrae/semi-ai-foundation/dist -o app/semi-ai.css -m
```

| Option             | Description                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `-f, --foundation` | The `dist` directory of `@fibrae/semi-foundation`. Optional; defaults to the foundation this package depends on.                             |
| `-i, --icon`       | The `dist` directory of `@fibrae/semi-icons-core` (reads `styles/icons.scss`). Optional; defaults to the icons-core this package depends on. |
| `-a, --ai`         | The `dist` directory of `@fibrae/semi-ai-foundation`. Use either this or `--icon`.                                                           |
| `-o, --output`     | Output file. Required.                                                                                                                       |
| `-m, --min`        | Minify the output. Expanded by default.                                                                                                      |
| `--prefix <cls>`   | Class prefix, `semi` by default.                                                                                                             |
| `--no-layer`       | Do not wrap in `@layer semi`.                                                                                                                |

A missing `-o`, passing both `--icon` and `--ai`, or an unknown option all exit with a non-zero code.

The stylesheet loads `semi-foundation/theme/` through the `semi:` Sass importer shared by the Semi build plugins, so the result matches what the plugins compile. The AI stylesheet has no tokens and must load after the full stylesheet.

## JS API

```js
import { compile, compileAi, compileSemiCss, compileSemiAiCss, compileTailwindTheme } from '@fibrae/semi-scss-compile';

// Write to a file
compile({ outputPath: 'dist/semi.min.css', isMin: true });

// Return a string; cssLayer: false drops @layer semi, prefixCls changes the class prefix
const css = compileSemiCss({ prefixCls: 'my' });

// AI stylesheet: compileAi writes a file, compileSemiAiCss returns a string
const aiCss = compileSemiAiCss({ aiFoundationPath: 'node_modules/@fibrae/semi-ai-foundation/dist' });

// Tailwind v4 @theme inline text; foundationPath is required
const theme = compileTailwindTheme({ foundationPath: 'node_modules/@fibrae/semi-foundation/dist' });
```

`Options` is `foundationPath?`, `iconPath?` (defaulting to the foundation and icons-core this package depends on), `outputPath`, `isMin?`, `prefixCls?` and `cssLayer?`. `AiOptions` drops `iconPath` and adds `aiFoundationPath`. `compileSemiCss` and `compileSemiAiCss` do not touch `outputPath` and only return a string. `compileTailwindTheme` has no default resolution, so under pnpm `@fibrae/semi-foundation` must be a direct dependency of the application.

`compileTailwindTheme` maps `--semi-color-*` to `--color-semi-color-*`, and also maps radii, shadows, easings, spacing, font sizes, line heights, font weights, font families and palette scales. Gradients are skipped, and unknown color shapes throw. For how to use it with Tailwind, see the [Tailwind docs](../../website/content/ecosystem/tailwind).

## Related packages

- Bundles the private package `@fibrae/semi-theme-shared` into `dist` at build time.
- Used by the builds of the UI packages and others to produce stylesheets. [`@fibrae/semi-next`](../semi-next/README.md) and the `omitCss` setups of the webpack and rspack plugins need the stylesheet it generates.

## Development

- `pnpm --filter @fibrae/semi-scss-compile build`: builds `dist/index.mjs` and `dist/bin.mjs` with `vp pack`.
- Tests are in `__tests__/` (`ai-css.test.ts`, `icons.test.ts` for dependency resolution under the isolated pnpm layout, and `tailwind-theme.test.ts`). They run with the root vitest and compile `packages/semi-foundation/src` directly.

For general commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
