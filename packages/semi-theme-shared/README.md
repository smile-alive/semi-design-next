# @fibrae/semi-theme-shared

私有包（`private: true`），不发布。Semi 构建插件共用的样式编译管线：`semi:` Sass importer、`compileSemiScss`、webpack/rspack 的 SCSS loader 函数，以及改写 Semi 包源码的小工具。

## 使用方式

没有构建步骤，`exports["."]` 直接指向 `./src/index.ts`。`@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin`、`@fibrae/semi-scss-compile` 以 devDependency（`workspace:*`）引用它，并由各自的 `vp pack` 内联进 `dist`，所以发布物不依赖本包。运行时依赖只有 `sass`。

## 导出

| 导出                                                               | 说明                                                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `semiImporters({ prefixCls, resolveFoundation })`                  | 返回 `semi:theme`、`semi:theme/global`、`semi:theme/animation`、`semi:foundation/<subpath>` 的 Sass importer。`prefixCls` 须匹配 `/^[a-zA-Z][\w-]*$/`，否则抛错。  |
| `compileSemiScss(file, options, source?)`                          | 编译文件或 `source` 字符串，返回 `{ css, loadedFiles }`。`cssLayer` 默认 `true`，`quietDeps` 为 `true`，`fatalDeprecations` 默认为当前 Sass 的全部 active 弃用项。 |
| `wrapInSemiLayer(css)`                                             | 用 `@layer semi{...}` 包裹，`@charset` 或 BOM 保持在最前。                                                                                                         |
| `resolveFoundationFromNode(subpath, fromDir, rootDir)`             | 先从样式表目录、再从应用根目录解析 `@fibrae/semi-foundation/<subpath>.scss`，失败时经各框架 UI 包（`semi-ui-<框架>`）的 `package.json` 间接解析。                  |
| `semiScssLoader`                                                   | webpack/rspack loader 函数，读取 `{ prefixCls, cssLayer }`，调用 `compileSemiScss`，并对每个加载的文件 `addDependency`。                                           |
| `assertNoStyleOptionsWithOmitCss(options)`                         | `omitCss` 为真且传入 `cssLayer` 时抛错。                                                                                                                           |
| `cssImportToScss`、`commentOutCssImports`、`replaceVariableValues` | 把 `.css` 导入改为 `.scss`、注释掉 `.css` 导入、改写 `env.js` 中 `BASE_CLASS_PREFIX` 一类常量。                                                                    |

`semi:` importer 的协议见 [styles](../../.agents/references/styles.md) 的「Sass 模块与 semi: importer」「主题 token 协议」两节。

## 开发

没有构建配置和脚本。测试位于 `__tests__/compile.test.ts`，由根目录的 vitest 运行，以 `theme/index.scss`、`global.scss`、`animation.scss` 为入口编译，守护 Sass 弃用项。通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
