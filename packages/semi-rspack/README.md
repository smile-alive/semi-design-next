# @fibrae/semi-rspack-plugin

Semi Design Next 的 rspack 2 构建插件（`SemiRspackPlugin`），给使用 Semi 组件包的 rspack 应用用：替换 CSS 类名前缀、控制样式是否包在 `@layer semi` 中、去掉 Semi 包内的 `.css` 导入。

样式通过 `--semi-*` CSS 变量（见 [tokens](../../website/content/basic/tokens)）和应用自己的未分层 CSS 定制，后者总是优先于 `@layer semi` 内的样式；插件没有编译期的 theme、variables 等选项。

## 安装

```shell
pnpm add -D @fibrae/semi-rspack-plugin
```

peer 依赖：`@rspack/core ^2.0.0`。仅提供 ESM。

## 使用

插件的 loader 输出纯 CSS，项目需要另有一条规则把 `.scss` 当 CSS 处理，例如 rspack 原生 CSS 支持。

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

### 选项

选项类型沿用 webpack 插件的名字 `SemiWebpackPluginOptions`，只有以下三项（没有 `extractCssOptions` 和 `overrideStylesheetLoaders`）：

| 选项        | 类型      | 默认值  | 说明                                                                          |
| ----------- | --------- | ------- | ----------------------------------------------------------------------------- |
| `prefixCls` | `string`  | `semi`  | CSS 类名前缀。同时改写 Semi JS 里的 `BASE_CLASS_PREFIX`，`omitCss` 时也生效。 |
| `cssLayer`  | `boolean` | `true`  | 编译后的样式是否包在 `@layer semi { ... }` 中；`false` 输出不分层的样式。     |
| `omitCss`   | `boolean` | `false` | 去掉 Semi 包 `dist` 下 JS 里的 `.css` 导入，且不再编译样式。                  |

`omitCss` 与 `cssLayer` 互斥，同时传入会在构造时抛错。需要无分层样式表时，用 [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md) 生成（`semi-build-scss --no-layer`），并让它的 `--prefix` 与 `prefixCls` 一致。

### 工作方式

`apply` 只向 `compiler.options.module.rules` 追加规则：

1. 设置了 `prefixCls`：对各 `env.js` 追加前缀 loader 规则。
2. `omitCss`：只追加去除 `.css` 导入的规则。
3. 否则：追加把 JS 里 `.css` 导入指回 `.scss` 的规则，以及编译 `dist/**/*.scss` 的主题规则。后者通过 `semi:` Sass importer 编译，`semi:theme` 来自 `@fibrae/semi-foundation/theme/index.scss`。

规则构造函数 `applySemiRules`、`createSourceSuffixLoaderRule`、`createThemeLoaderRule`、`createOmitCssLoaderRule`、`createPrefixLoaderRule` 和各 loader（`semiScssLoader`、`semiPrefixLoader`、`semiSourceSuffixLoader`、`semiOmitCssLoader`）也从入口导出，供需要自行组装规则的场景使用。

## 与其他包的关系

- 构建时把私有包 `@fibrae/semi-theme-shared` 打进 `dist`；运行时依赖只有 `sass`。
- 同类插件：[`@fibrae/semi-vite-plugin`](../semi-vite/README.md)、[`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md)。

## 开发

loader 通过 `src/constants.ts` 以文件路径引用，所以 `vp pack` 以 `unbundle` 方式把 `src/index.ts` 与 `src/loaders/*.ts` 分别产出。

- `pnpm --filter @fibrae/semi-rspack-plugin build`：构建。
- `pnpm --filter @fibrae/semi-rspack-plugin test`：先构建，再用 `test/run.ts` 以 `dist` 产物跑 fixture 构建（`entry`、`omit-entry`、`vue-entry`、`ai-entry`）。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
