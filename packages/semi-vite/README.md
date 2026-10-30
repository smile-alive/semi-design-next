# @fibrae/semi-vite-plugin

Semi Design Next 的 Vite 构建插件，给使用 Semi 各框架 UI 包与 AI 包的 Vite 应用用：替换 CSS 类名前缀、控制样式是否包在 `@layer semi` 中、可选地去掉 Semi 包内的 `.css` 导入；服务端渲染的宿主（React Router、SolidStart 等）靠它把 Semi 包接入服务端构建与 dev 预构建。

只在浏览器渲染时，样式本身不需要插件即可加载。主题通过 `--semi-*` CSS 变量（见 [tokens](../../website/content/basic/tokens)）和应用自己的未分层 CSS 定制，后者总是优先于 `@layer semi` 内的样式；插件没有编译期的 theme、variables 等选项。

## 安装

```shell
pnpm add -D @fibrae/semi-vite-plugin
```

peer 依赖：`vite >=8.0.0`。仅提供 ESM。

## 使用

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import semiTheming from '@fibrae/semi-vite-plugin';

export default defineConfig({
    plugins: [
        semiTheming({
            prefixCls: 'custom', // .semi-button -> .custom-button
        }),
    ],
});
```

插件名为 `semi-theme`，`enforce: 'pre'`。包同时具名导出 `semiTheming` 和类型 `SemiVitePluginOptions`。

### 服务端渲染

宿主配置里加上插件即可服务端渲染与 hydration。默认按组件加载样式（组件 JS 自带样式导入），不导入 `styles.css`；整包样式是可选路线：开 `omitCss` 再导入一次 `styles.css`。两条路线不混用，混用时 CSS 体积约翻倍。

| 宿主                                                | 安装                                                    | 宿主配置                                                    | 样式                                                  |
| --------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| React Router 8 framework mode（含 `serverBundles`） | `@fibrae/semi-ui-react`、`-D @fibrae/semi-vite-plugin`  | `plugins: [semi(), reactRouter()]`                          | 无                                                    |
| SolidStart 2                                        | `@fibrae/semi-ui-solid`、`-D @fibrae/semi-vite-plugin`  | `plugins: [solidStart(), nitro(), semi({ omitCss: true })]` | `app.tsx` 导入一次 `@fibrae/semi-ui-solid/styles.css` |
| SvelteKit 3                                         | `@fibrae/semi-ui-svelte`、`-D @fibrae/semi-vite-plugin` | `plugins: [sveltekit({ adapter }), semi()]`                 | 无                                                    |

```ts
// vite.config.ts（React Router）
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import semi from '@fibrae/semi-vite-plugin';

export default defineConfig({
    plugins: [semi(), reactRouter()],
});
```

SolidStart 选整包样式，是因为它的 dev 服务端默认不收集 `node_modules` 内组件导入的 CSS：按组件路线在生产环境正常，dev 首屏无样式。给 `solidStart()` 传 `css: { filter: { exclude: [/^(?!.*\/node_modules\/@fibrae\/semi-).*\/node_modules\//] } }` 后 dev 也收集 Semi 包的组件 CSS，代价是多一处宿主配置，且 dev 首屏的样式略大于整包样式（约多 20%），分成数十个 `<style>`。

### 选项

| 选项        | 类型      | 默认值  | 说明                                                                                                 |
| ----------- | --------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `prefixCls` | `string`  | `semi`  | CSS 类名前缀。                                                                                       |
| `cssLayer`  | `boolean` | `true`  | 编译后的 CSS 是否包在 `@layer semi { ... }` 中；`false` 输出不分层的 CSS。                           |
| `omitCss`   | `boolean` | `false` | 注释掉 Semi 包内的 `.css` 导入，配合一次性导入 `styles.css` 的整包样式路线使用，dev 预构建同样生效。 |

### 工作方式

1. 拦截 Semi 各框架包与共享包（foundation、icons-core 等）`dist` 下 `.css` 的请求，把后缀换成 `.scss`；对应的 `.scss` 存在时读取它作为源码。
2. 通过 `semi:` Sass importer 编译，`semi:theme` 来自 `@fibrae/semi-foundation/theme/index.scss`，`$prefix` 取 `prefixCls`，再按 `cssLayer` 决定是否包 `@layer semi`。
3. 设置 `prefixCls` 时，改写各 `env.js` 中的 `BASE_CLASS_PREFIX`；同时向 `optimizeDeps.rolldownOptions.plugins` 注册插件，使 dev 预构建（`.vite/deps`）里的 env 模块也被改写。
4. `omitCss` 为真时，注释掉 Semi 包 `dist` 下 JS（含 Solid 包的 `.jsx`、Svelte 包的 `.svelte`）里的 `.css` 导入，避免它们进入打包器；同样注册进 `optimizeDeps.rolldownOptions.plugins`，dev 预构建也不再注入组件 CSS。
5. 对每个 server 环境（`consumer` 为 `server`，未设时按 Vite 的默认：除 `client` 外都是 server，覆盖 Nuxt 与 React Router `serverBundles` 的 `ssrBundle_*`）设置 `resolve.noExternal`，把 React、Vue 的 UI、AI、图标、插画包打进服务端产物，Node 不必加载它们的 `.css` 导入。foundation 默认保持 external；设置 `prefixCls` 时，foundation 与 ai-foundation 一并打进服务端产物（它们持有 `BASE_CLASS_PREFIX`，保持 external 会使服务端类名仍为 `semi-`）。vite-plugin-solid 在 dev 中把 Solid 包的非 Solid 依赖（含 foundation）写进服务端环境的 `resolve.external`，Vite 先查 `external` 再查 `noExternal`，所以设置 `prefixCls` 时插件在所有插件之后（`configEnvironment` 的 `order: 'post'`）把 foundation 从中移除。Solid 包交给 vite-plugin-solid，Svelte 包由 vite-plugin-svelte 按 `svelte` 条件自行打进服务端产物，都不在此列。
6. 对应用能解析到的 `@fibrae/semi-ui-solid`、`@fibrae/semi-ai-solid`，按它直接依赖的 foundation、ai-foundation，把 foundation `package.json` 中的依赖写成 `<Solid 包> > <foundation> > <依赖>`（如 `@fibrae/semi-ai-solid > @fibrae/semi-foundation > hast-util-to-jsx-runtime`）加入 `optimizeDeps.include`：vite-plugin-solid 把 Solid 包排除在预构建之外，其中的 CommonJS 依赖不预构建就无法在浏览器导入。只装 ai-solid 的 pnpm 应用解析不到 ui-solid，foundation 的依赖经 ai-solid 列入。没有根入口的依赖（如 `@tiptap/pm`）按 `exports` 中的子路径逐个加入，否则直接导入的子路径与其他预构建依赖内联的副本是两份实例。

## 常见问题

`vite dev` 中类名仍是 `semi-*`，或开 `omitCss` 后 dev 仍注入组件 CSS：`.vite/deps` 缓存是在没有插件或另一组选项下生成的。停止 dev server，用 `vite --force` 重新预构建。

## 与其他包的关系

- 构建时把私有包 `@fibrae/semi-theme-shared` 打进 `dist`，不作为运行时依赖；运行时依赖只有 `sass`。
- 同类插件：[`@fibrae/semi-webpack-plugin`](../semi-webpack/README.md)、[`@fibrae/semi-rspack-plugin`](../semi-rspack/README.md)、[`@fibrae/semi-next`](../semi-next/README.md)；Nuxt 经 [`@fibrae/semi-nuxt`](../semi-nuxt/README.md) 使用本插件，无需手写 `vite.plugins`。
- 需要预编译整份样式表时见 [`@fibrae/semi-scss-compile`](../semi-scss-compile/README.md)。

## 开发

- `pnpm --filter @fibrae/semi-vite-plugin build`：`vp pack` 构建 `dist/index.mjs`。
- `pnpm --filter @fibrae/semi-vite-plugin test`：先构建，再用 `test/run.ts` 以 `dist` 产物跑 fixture 构建（`entry`、`omit-entry`、`vue-entry`、`ai-entry`、`solid-entry`），并用 `resolveConfig` 检查各环境的 `noExternal` 与 Solid 的 `optimizeDeps.include`，用 dev server 检查预构建中的 CSS 导入。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
