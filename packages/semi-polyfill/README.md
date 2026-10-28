# @fibrae/semi-polyfill

Semi Design Next 的可选 polyfill。组件代码直接使用原生 API，目标浏览器中个别版本缺少的 API 由本包补齐。

## 目标浏览器

Chrome 120、Firefox 125、Safari 17.2 及以上。Chrome 与 Firefox 已原生支持本包的全部内容，只有 Safari 17.2 与 17.3 需要它；只面向其余浏览器时不必安装。

## 安装与使用

```sh
pnpm add @fibrae/semi-polyfill
```

在应用入口最先导入，保证组件代码运行前 API 已就绪：

```js
import '@fibrae/semi-polyfill';
```

只需要其中一项时导入单项入口。每个 shim 只在原生缺失时安装；服务端渲染时没有对应全局，什么都不做。

## 入口

| 入口 | 补齐的 API | 原生支持 | 说明 |
| --- | --- | --- | --- |
| `@fibrae/semi-polyfill` | 下面全部 |  | 引入所有 shim |
| `@fibrae/semi-polyfill/abort-signal-any` | `AbortSignal.any` | Safari 17.4 | 任一源 signal abort 时结果 abort，reason 取先 abort 的源；源已 abort 时立即 abort |
| `@fibrae/semi-polyfill/check-visibility` | `Element.prototype.checkVisibility` | Safari 17.4 | 支持 `checkOpacity`、`checkVisibilityCSS` 与旧名 `opacityProperty`、`visibilityProperty`；渲染以 `getClientRects().length > 0` 判断，祖先 `content-visibility: hidden` 视为不可见。不支持 `contentVisibilityAuto`，该选项被忽略 |
