# @fibrae/semi-scss-compile

[English](README.md)

把 Semi Design Next 的组件样式编译成一份 CSS 的命令行（`semi-build-scss`）和 JS API，并生成 Tailwind v4 的 `@theme inline` 映射。适用于：

- 应用需要一份预编译样式表，带自己的类名前缀，或不带 `@layer semi`（例如 Next.js 配合 `omitCss`）。
- 构建各框架 UI 包时产出 `styles.css` 和 `tailwind.css`。

## 安装

```shell
pnpm add -D @fibrae/semi-scss-compile
```

`-f`、`-i` 缺省时使用本包依赖的 foundation、icons-core，因此本包版本须与所用组件库一致；版本不一致时显式传入 `-f`，此时 pnpm 下该包要作为应用的直接依赖安装。`--ai` 必须给出路径，pnpm 下 `@fibrae/semi-ai-foundation` 要作为应用的直接依赖安装，版本与组件库一致。

仅提供 ESM，运行时依赖 `sass`、`@fibrae/semi-foundation`、`@fibrae/semi-icons-core`。

## 命令行

```shell
# 完整样式表：foundation 与 icons-core 自动解析
semi-build-scss -o app/semi.css --min

# 换类名前缀，并去掉 @layer 包裹
semi-build-scss --prefix my --no-layer -o app/semi-my.css

# AI 组件样式表：用 --ai 代替 --icon
semi-build-scss --ai node_modules/@fibrae/semi-ai-foundation/dist -o app/semi-ai.css -m
```

| 选项               | 说明                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `-f, --foundation` | `@fibrae/semi-foundation` 的 `dist` 目录，可选，缺省用本包依赖的 foundation。                             |
| `-i, --icon`       | `@fibrae/semi-icons-core` 的 `dist` 目录（读取 `styles/icons.scss`），可选，缺省用本包依赖的 icons-core。 |
| `-a, --ai`         | `@fibrae/semi-ai-foundation` 的 `dist` 目录，与 `--icon` 二选一。                                         |
| `-o, --output`     | 输出文件，必填。                                                                                          |
| `-m, --min`        | 压缩输出，默认 expanded。                                                                                 |
| `--prefix <cls>`   | 类名前缀，默认 `semi`。                                                                                   |
| `--no-layer`       | 不包 `@layer semi`。                                                                                      |

缺少 `-o`、`--icon` 与 `--ai` 同时给出、传入未知选项，都以非 0 退出码结束。

样式表通过各 Semi 构建插件共用的 `semi:` Sass importer 加载 `semi-foundation/theme/`，结果与插件的编译一致。AI 样式表不含 token，要在完整样式表之后加载。

## JS API

```js
import { compile, compileAi, compileSemiCss, compileSemiAiCss, compileTailwindTheme } from '@fibrae/semi-scss-compile';

// 写入文件
compile({ outputPath: 'dist/semi.min.css', isMin: true });

// 返回字符串；cssLayer: false 去掉 @layer semi，prefixCls 改类名前缀
const css = compileSemiCss({ prefixCls: 'my' });

// AI 样式表：compileAi 写文件，compileSemiAiCss 返回字符串
const aiCss = compileSemiAiCss({ aiFoundationPath: 'node_modules/@fibrae/semi-ai-foundation/dist' });

// Tailwind v4 的 @theme inline 文本，foundationPath 必填
const theme = compileTailwindTheme({ foundationPath: 'node_modules/@fibrae/semi-foundation/dist' });
```

`Options` 为 `foundationPath?`、`iconPath?`（缺省解析本包依赖的 foundation、icons-core）、`outputPath`、`isMin?`、`prefixCls?`、`cssLayer?`；`AiOptions` 去掉 `iconPath`，增加 `aiFoundationPath`。`compileSemiCss` 与 `compileSemiAiCss` 不读写 `outputPath`，只返回字符串。`compileTailwindTheme` 不做缺省解析，pnpm 下要把 `@fibrae/semi-foundation` 作为应用的直接依赖安装。

`compileTailwindTheme` 把 `--semi-color-*` 映射为 `--color-semi-color-*`，并映射圆角、阴影、缓动、间距、字号、行高、字重、字体族和调色板色阶；渐变跳过，未知的颜色形状抛错。Tailwind 的使用方式见 [Tailwind 文档](../../../website/content/ecosystem/tailwind)。

### `@fibrae/semi-scss-compile/core`

本包与各构建插件共用的样式编译管线：`semi:` Sass importer、`compileSemiScss`、webpack/rspack 的 SCSS loader 函数，以及改写 Semi 包源码的小工具。运行时依赖只有 `sass`。

| 导出                                                               | 说明                                                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `semiImporters({ prefixCls, resolveFoundation })`                  | 返回 `semi:theme`、`semi:theme/global`、`semi:theme/animation`、`semi:foundation/<subpath>` 的 Sass importer。`prefixCls` 须匹配 `/^[a-zA-Z][\w-]*$/`，否则抛错。  |
| `compileSemiScss(file, options, source?)`                          | 编译文件或 `source` 字符串，返回 `{ css, loadedFiles }`。`cssLayer` 默认 `true`，`quietDeps` 为 `true`，`fatalDeprecations` 默认为当前 Sass 的全部 active 弃用项。 |
| `wrapInSemiLayer(css)`                                             | 用 `@layer semi{...}` 包裹，`@charset` 或 BOM 保持在最前。                                                                                                         |
| `resolveFoundationFromNode(subpath, fromDir, rootDir)`             | 先从样式表目录、再从应用根目录解析 `@fibrae/semi-foundation/<subpath>.scss`，失败时经各框架 UI 包（`semi-ui-<框架>`）的 `package.json` 间接解析。                  |
| `semiScssLoader`                                                   | webpack/rspack loader 函数，读取 `{ prefixCls, cssLayer }`，调用 `compileSemiScss`，并对每个加载的文件 `addDependency`。                                           |
| `assertNoStyleOptionsWithOmitCss(options)`                         | `omitCss` 为真且传入 `cssLayer` 时抛错。                                                                                                                           |
| `cssImportToScss`、`commentOutCssImports`、`replaceVariableValues` | 把 `.css` 导入改为 `.scss`、注释掉 `.css` 导入、改写 `env.js` 中 `BASE_CLASS_PREFIX` 一类常量。                                                                    |

`semi:` importer 的协议见 [styles](../../../.agents/references/styles.md) 的「Sass 模块与 semi: importer」「主题 token 协议」两节。

## 与其他包的关系

- `@fibrae/semi-vite-plugin`、`@fibrae/semi-webpack-plugin`、`@fibrae/semi-rspack-plugin` 以 devDependency 引用本包，构建时把 `/core` 打进各自的 `dist`，运行时不依赖本包。
- 被各框架 UI 包等的构建用于产出样式表；[`@fibrae/semi-next`](../semi-next/README.zh-CN.md) 以及 webpack、rspack 插件的 `omitCss` 场景需要它生成的样式表。

## 开发

- `pnpm --filter @fibrae/semi-scss-compile build`：`vp pack` 构建 `dist/index.mjs`、`dist/bin.mjs` 与 `dist/core/index.mjs`。
- 测试位于 `__tests__/`（`ai-css.test.ts`、`compile.test.ts`（把 `theme/index.scss`、`global.scss`、`animation.scss` 作为入口直接编译，拦截 Sass 弃用写法）、`icons.test.ts`（pnpm 隔离布局下的依赖解析）、`tailwind-theme.test.ts`），由根目录的 vitest 运行，直接编译 `packages/shared/semi-foundation/src`。

通用命令见根目录 [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令)。
