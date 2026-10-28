# @fibrae/semi-nuxt

Semi Design Next 的 Nuxt 模块，给使用 `@fibrae/semi-ui-vue` 的 Nuxt 应用用。模块做两件事：把 [`@fibrae/semi-vite-plugin`](../semi-vite/README.md) 注册进 Nuxt 的 Vite 构建，让 Semi 组件在服务端渲染与 hydration 下直接可用；另在应用未设置时关闭 Nuxt 的 `features.inlineStyles`，见「内联样式」。

## 安装

```shell
pnpm add @fibrae/semi-ui-vue
pnpm add -D @fibrae/semi-nuxt
```

peer 依赖：`nuxt >=4.6.2`。仅提供 ESM。

## 使用

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['@fibrae/semi-nuxt'],
});
```

不需要别的配置：组件 JS 自带样式导入，不导入 `styles.css`；Nuxt 的 dev 与生产构建可直接服务端渲染。模块不做组件自动导入，组件照常从 `@fibrae/semi-ui-vue` 导入。

选项写在 `semi` 配置键下，原样传给 semi-vite 插件：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['@fibrae/semi-nuxt'],
    semi: { prefixCls: 'my' },
});
```

自定义前缀时保持默认的按组件加载样式，插件按前缀重编译各组件的 SCSS。

整包样式是可选路线：开 `omitCss`，在 `css` 中导入一次 `styles.css`。两条路线不混用，混用时 CSS 体积约翻倍。`styles.css` 是预编译产物，固定为 `semi-` 前缀，不随 `prefixCls` 变化；整包样式要自定义前缀时，改为导入 `semi-build-scss --prefix my` 生成的样式表（需 `-D @fibrae/semi-scss-compile`）。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['@fibrae/semi-nuxt'],
    semi: { omitCss: true },
    css: ['@fibrae/semi-ui-vue/styles.css'],
});
```

## 内联样式

应用没有设置 `features.inlineStyles` 时，模块把它设为 `false`：Nuxt 的生产 SSR 只用 `<link>` 加载样式，不再把样式内联进 HTML。

原因：Nuxt 把页面客户端 chunk 里的全部 CSS 都算作该页面组件的样式，`inlineStyles` 的函数形式也只按组件判断，不能按样式表排除。只被单个页面导入、因而打进该页 chunk 的 Semi 组件样式会内联进该页的每个 SSR 响应，同一份 CSS 仍以 `<link>` 加载；多个页面共用的 Semi 组件进入共享 chunk，不内联。增量随页面独占的组件而定，实测几个常用组件只被一个页面导入时，该页 HTML 从约 5KB 增至约 210KB。设为 `false` 只去掉这份重复，页面内容与样式不变。

代价：应用自己的 SFC `<style>` 也不再内联，改由 `<link>` 加载。要保留 Nuxt 的内联，在 `nuxt.config.ts`、`.nuxtrc` 或 loadNuxt 的 overrides 中显式设置 `features.inlineStyles`（或旧键 `experimental.inlineSSRStyles`），模块不覆盖。已知限制：排在本模块之前的其他模块用代码设成函数时，模块分辨不出它与 Nuxt 的默认函数，会改为 `false`。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['@fibrae/semi-nuxt'],
    features: { inlineStyles: true },
});
```

## 选项

选项即 `@fibrae/semi-vite-plugin` 的 `SemiVitePluginOptions`（本包导出别名类型 `ModuleOptions`），含义与默认值见 [semi-vite 的选项表](../semi-vite/README.md#选项)。

## 与其他包的关系

noExternal、`omitCss` 的 dev 预构建都在 semi-vite 插件内实现，见其「工作方式」一节；本包不重复实现。

## 开发

- `pnpm --filter @fibrae/semi-nuxt build`：`vp pack` 构建。
- `pnpm --filter @fibrae/semi-nuxt test`：先构建，再用 `test/run.ts` 经 `@nuxt/kit` 的 `loadNuxt` 加载模块，触发 `vite:extend` 断言 semi-vite 插件已注册，且 `semi` 配置键的选项原样到达插件；并断言未设置 `features.inlineStyles` 时为 `false`，经 overrides、旧键 `experimental.inlineSSRStyles`、`test/inline-styles/nuxt.config.ts` 或 `test/inline-styles-rc/.nuxtrc` 显式设置时保留原值。

通用命令见根目录 [README.md](../../README.md) 的「常用命令」。
