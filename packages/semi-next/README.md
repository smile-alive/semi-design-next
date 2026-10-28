# @fibrae/semi-next

Semi Design Next 的 Next.js 构建插件，给使用 Semi React 组件包的 Next.js 应用用。Semi 的组件 JS 会导入自己的 `.css`；插件让这些导入在 Turbopack、Pages Router 与自定义前缀下也能构建和服务端渲染。包名中的 next 指 Next.js。

## 何时需要

| 场景                                                          | 写法                                                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| App Router，`next dev --webpack`、`next build --webpack`      | 不需要本插件，装 `@fibrae/semi-ui-react` 即可                                                         |
| Next.js 16 默认的 Turbopack、Pages Router，或两种 Router 混用 | `semiNext()`，样式无需另外导入                                                                        |
| 自定义类名前缀                                                | `semiNext({ prefixCls: 'my', omitCss: true })`，再导入一次 `semi-build-scss --prefix my` 生成的样式表 |

## 安装

```shell
pnpm add -D @fibrae/semi-next
```

仅提供 ESM。依赖 [`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md)；`next` 由应用自带。

## 使用

### Turbopack 与 Pages Router

```js
// next.config.mjs
import semiNext from '@fibrae/semi-next';

export default semiNext()({
    // 你的 Next.js 配置
});
```

组件按需带出自己的样式，不导入 `styles.css`。`semiNext(options)` 返回 `(nextConfig) => nextConfig`，在你的配置上：

- 把 `@fibrae/semi-ui-react`、`@fibrae/semi-ai-react`、`@fibrae/semi-icons-react`、`@fibrae/semi-illustrations-react` 合并进 `transpilePackages`：Pages Router 的服务端用 Node 直接加载 `node_modules`，而 Node 不能导入 `.css`。
- 加 `turbopack.rules`：`omitCss`、`prefixCls` 时给 Semi 的 JS 挂对应 loader。你已有的其他规则保留；与插件同 glob 的规则（`*.js`）抛错，请改用别的 glob。
- 加 `webpack()`：`--webpack` 下按选项挂 `SemiWebpackPlugin`，再调用你原有的 `webpack` 函数；不传选项时不挂插件，Next 直接处理组件导入的 `.css`。

Next.js 16 在 Turbopack 下遇到只有 `webpack` 键的配置会报错退出，所以两个键总是一起返回。

### 自定义前缀

```js
// next.config.mjs
import semiNext from '@fibrae/semi-next';

export default semiNext({ prefixCls: 'my', omitCss: true })({});
```

`omitCss` 去掉 Semi 包内的 `.css` 导入，`prefixCls` 改写 Semi JS 里的类名前缀。样式改由一份带同样前缀的完整样式表提供，用 [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md) 生成后在根 layout（Pages Router 为 `pages/_app`）导入一次：

```shell
pnpm add -D @fibrae/semi-scss-compile
semi-build-scss --prefix my -o app/semi-my.css --min
# 使用 @fibrae/semi-ai-react 时另装 -D @fibrae/semi-ai-foundation，在 app/semi-my.css 之后导入
semi-build-scss --ai node_modules/@fibrae/semi-ai-foundation/dist -o app/semi-ai-my.css --min --prefix my
```

`prefixCls` 必须配 `omitCss: true`，否则读取配置时抛错（Turbopack 不能重编译 Semi 的 SCSS，`--webpack` 下重编译会与 Next 自己的样式规则冲突）。

## 选项

选项即 [`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md) 的 `SemiWebpackPluginOptions`（本包导出别名类型 `SemiNextOptions`）。

| 选项                                                         | 类型      | 默认值  | 说明                                                                               |
| ------------------------------------------------------------ | --------- | ------- | ---------------------------------------------------------------------------------- |
| `omitCss`                                                    | `boolean` | `false` | 去掉 Semi 包内的 `.css` 导入，样式改由应用导入的完整样式表提供。                   |
| `prefixCls`                                                  | `string`  | `semi`  | 类名前缀，必须与所导入样式表的前缀一致。必须配 `omitCss: true`。                   |
| `cssLayer`、`extractCssOptions`、`overrideStylesheetLoaders` | -         | -       | 重编译 SCSS 的选项，只在 `--webpack` 下传给 webpack 插件；Turbopack 下传入即抛错。 |

插件判断打包器靠 Next 在读取 `next.config` 前设置的 `process.env.TURBOPACK`：默认打包器为 `auto`，`--turbopack` 为 `1`，`--webpack` 与 `next start` 下未设置。

已知限制：Next.js 16.4.3 的 `--webpack` 下，`cssLayer` 触发的 webpack 插件重编译 SCSS 与 Next 自己的样式规则冲突，构建报 `Invalid generator object`；`extractCssOptions`、`overrideStylesheetLoaders` 未验证。

Turbopack 的 `*.css` 规则不改变模块类型，应用自己的 `*.module.css` 仍按 CSS Modules 处理。

## 开发

- `pnpm --filter @fibrae/semi-next build`：`vp pack` 构建。
- `pnpm --filter @fibrae/semi-next test`：先构建，再用 `test/run.ts` 验证返回的 `transpilePackages`、`turbopack.rules`（loader 路径指向已发布文件，`*.css` 规则不带 `as` 以保留 CSS Modules）、`webpack()` 何时挂插件，以及 `prefixCls` 与 Turbopack 下的选项校验。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
