# @fibrae/semi-scss-core

[简体中文](README.zh-CN.md)

A private package (`private: true`) that is not published. It is the style compilation pipeline shared by the Semi build plugins: the `semi:` Sass importer, `compileSemiScss`, the webpack/rspack SCSS loader function, and small tools that rewrite Semi package source.

## How it is used

There is no build step, and `exports["."]` points directly at `./src/index.ts`. `@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin`, `@fibrae/semi-rspack-plugin` and `@fibrae/semi-scss-compile` reference it as a devDependency (`workspace:*`) and inline it into `dist` with their own `vp pack`, so published packages do not depend on it. The only runtime dependency is `sass`.

## Exports

| Export                                                             | Description                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `semiImporters({ prefixCls, resolveFoundation })`                  | Returns the Sass importer for `semi:theme`, `semi:theme/global`, `semi:theme/animation` and `semi:foundation/<subpath>`. `prefixCls` must match `/^[a-zA-Z][\w-]*$/`, or it throws.                                      |
| `compileSemiScss(file, options, source?)`                          | Compiles a file or the `source` string and returns `{ css, loadedFiles }`. `cssLayer` defaults to `true`, `quietDeps` is `true`, and `fatalDeprecations` defaults to all active deprecations of the current Sass.        |
| `wrapInSemiLayer(css)`                                             | Wraps in `@layer semi{...}`, keeping `@charset` or a BOM first.                                                                                                                                                          |
| `resolveFoundationFromNode(subpath, fromDir, rootDir)`             | Resolves `@fibrae/semi-foundation/<subpath>.scss` from the stylesheet directory, then the application root, and on failure indirectly through the `package.json` of each framework's UI package (`semi-ui-<framework>`). |
| `semiScssLoader`                                                   | The webpack/rspack loader function. It reads `{ prefixCls, cssLayer }`, calls `compileSemiScss`, and runs `addDependency` on each loaded file.                                                                           |
| `assertNoStyleOptionsWithOmitCss(options)`                         | Throws when `omitCss` is true and `cssLayer` is passed.                                                                                                                                                                  |
| `cssImportToScss`, `commentOutCssImports`, `replaceVariableValues` | Change `.css` imports to `.scss`, comment out `.css` imports, and rewrite constants such as `BASE_CLASS_PREFIX` in `env.js`.                                                                                             |

For the `semi:` importer protocol, see the 「Sass 模块与 semi: importer」 and 「主题 token 协议」 sections of [styles](../../../.agents/references/styles.md).

## Development

There is no build config or script. Tests are in `__tests__/compile.test.ts`. They run with the root vitest, compile with `theme/index.scss`, `global.scss` and `animation.scss` as entries, and guard against Sass deprecations. For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
