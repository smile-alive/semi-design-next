# @fibrae/semi-webpack-plugin

Semi Design Next 的 webpack 5 构建插件（`SemiWebpackPlugin`），给使用 Semi 组件包的 webpack 应用用：替换 CSS 类名前缀、控制样式是否包在 `@layer semi` 中、去掉 Semi 包内的 `.css` 导入（Next.js 场景），并允许定制样式的 loader 链。[`@fibrae/semi-next`](../semi-next/README.md) 建立在它之上。

样式通过 `--semi-*` CSS 变量（见 [tokens](../../website/content/basic/tokens)）和应用自己的未分层 CSS 定制，后者总是优先于 `@layer semi` 内的样式；插件没有编译期的 theme、variables 等选项。

## 安装

```shell
pnpm add -D @fibrae/semi-webpack-plugin
```

peer 依赖 `webpack` 5（可选；插件运行时经 `compiler.webpack` 取宿主自带的 webpack，类型声明仍引用 `webpack`）。仅提供 ESM。

## 使用

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

除默认导出外，还具名导出类型 `SemiWebpackPluginOptions` 和 loader 函数 `semiScssLoader`、`semiPrefixLoader`、`semiSourceSuffixLoader`。

按路径引用 loader 的宿主（如 Next.js 的 `turbopack.rules`）用子路径导出取得 loader 文件，例如 `require.resolve('@fibrae/semi-webpack-plugin/semi-omit-css-loader')`：

| 子路径                   | 作用                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `./semi-omit-css-loader` | 注释掉 JS 中的 `.css` 导入                                            |
| `./semi-prefix-loader`   | 按 `options.replacers` 改写 `env.js` 中的常量，如 `BASE_CLASS_PREFIX` |

### 选项

| 选项                        | 类型                                      | 默认值  | 说明                                                                                                  |
| --------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `prefixCls`                 | `string`                                  | `semi`  | CSS 类名前缀。同时改写 Semi JS 里的 `BASE_CLASS_PREFIX`，`omitCss` 时也生效。                         |
| `cssLayer`                  | `boolean`                                 | `true`  | 编译后的样式是否包在 `@layer semi { ... }` 中；`false` 输出不分层的样式。                             |
| `omitCss`                   | `boolean`                                 | `false` | 去掉 Semi 包 `dist` 下 JS 里的 `.css` 导入，且不再编译样式，样式改由应用导入的完整样式表提供。        |
| `extractCssOptions`         | `{ loader: string; loaderOptions?: any }` | 无      | 抽取 CSS 的 loader（如 `mini-css-extract-plugin` 的 loader）。未设置时使用 `style-loader`。           |
| `overrideStylesheetLoaders` | `(loaders: any[]) => any[]`               | 无      | 收到默认 loader 列表（已含 `extractCssOptions`），返回新列表。建议只追加自己的 loader，不删改默认项。 |

`omitCss` 与 `cssLayer` 互斥：样式不再编译，`cssLayer` 无从生效，同时传入会在构造时抛错。需要无分层样式表时，用 [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md) 生成（`semi-build-scss --no-layer`），并让它的 `--prefix` 与 `prefixCls` 一致。

### 工作方式

1. Semi 的 JS 导入编译产物 `.css`；插件为 Semi 各框架包（UI、AI、图标）`dist` 下的 JS 追加 `semi-source-suffix-loader`，把导入指回 `.scss`。
2. 对 `dist/**/*.scss` 使用 `[style-loader 或 extractCssOptions.loader, css-loader, semi-scss-loader]`。`semi-scss-loader` 通过 `semi:` Sass importer 编译，`semi:theme` 来自 `@fibrae/semi-foundation/theme/index.scss`，`$prefix` 取 `prefixCls`。
3. 通过 `compiler.webpack` 取得运行中的 webpack 实例，因此可在自带 webpack 的 Next.js 中使用。

## 与其他包的关系

- 构建时把私有包 `@fibrae/semi-theme-shared` 打进 `dist`；运行时依赖 `css-loader`、`style-loader`、`sass`。
- 被 [`@fibrae/semi-next`](../semi-next/README.md) 依赖。
- 同类插件：[`@fibrae/semi-vite-plugin`](../semi-vite/README.md)、[`@fibrae/semi-rspack-plugin`](../semi-rspack/README.md)。

## 开发

webpack 按文件路径加载 loader，所以 `vp pack` 以 `unbundle` 方式把每个源文件产出为独立的 `dist` 文件。

- `pnpm --filter @fibrae/semi-webpack-plugin build`：构建。
- `pnpm --filter @fibrae/semi-webpack-plugin test`：先构建，再用 `test/run.ts` 以 `dist` 产物跑 fixture 构建（`entry`、`vue-entry`、`ai-entry`）。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
