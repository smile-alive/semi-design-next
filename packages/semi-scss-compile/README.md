# @fibrae/semi-scss-compile

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

`compileTailwindTheme` 把 `--semi-color-*` 映射为 `--color-semi-color-*`，并映射圆角、阴影、缓动、间距、字号、行高、字重、字体族和调色板色阶；渐变跳过，未知的颜色形状抛错。Tailwind 的使用方式见 [Tailwind 文档](../../website/content/ecosystem/tailwind)。

## 与其他包的关系

- 构建时把私有包 `@fibrae/semi-theme-shared` 打进 `dist`。
- 被各框架 UI 包等的构建用于产出样式表；[`@fibrae/semi-next`](../semi-next/README.md) 以及 webpack、rspack 插件的 `omitCss` 场景需要它生成的样式表。

## 开发

- `pnpm --filter @fibrae/semi-scss-compile build`：`vp pack` 构建 `dist/index.mjs` 与 `dist/bin.mjs`。
- 测试位于 `__tests__/`（`ai-css.test.ts`、`icons.test.ts`（pnpm 隔离布局下的依赖解析）、`tailwindTheme.test.ts`），由根目录的 vitest 运行，直接编译 `packages/semi-foundation/src`。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
