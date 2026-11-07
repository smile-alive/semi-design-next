# @fibrae/semi-polyfill

[简体中文](README.zh-CN.md)

Optional polyfills for Semi Design Next. Component code uses native APIs directly, and this package fills in the APIs missing from some versions of the target browsers.

## Target browsers

Chrome 120, Firefox 125, Safari 17.2 and later. Chrome and Firefox support everything in this package natively, so only Safari 17.2 and 17.3 need it. If you target only the other browsers, you do not need to install it.

## Installation and usage

```sh
pnpm add @fibrae/semi-polyfill
```

Import it first in the application entry so the APIs are ready before component code runs:

```js
import '@fibrae/semi-polyfill';
```

If you need only one shim, import its own entry. Each shim installs only when the native API is missing, and does nothing during server rendering, where the matching global does not exist.

## Entry points

| Entry | API | Native support | Notes |
| --- | --- | --- | --- |
| `@fibrae/semi-polyfill` | All of the below |  | Imports every shim |
| `@fibrae/semi-polyfill/abort-signal-any` | `AbortSignal.any` | Safari 17.4 | The result aborts when any source signal aborts, with the reason of the first one to abort. It aborts immediately if a source has already aborted |
| `@fibrae/semi-polyfill/check-visibility` | `Element.prototype.checkVisibility` | Safari 17.4 | Supports `checkOpacity`, `checkVisibilityCSS` and the old names `opacityProperty` and `visibilityProperty`. Rendering is judged by `getClientRects().length > 0`, and an ancestor with `content-visibility: hidden` counts as invisible. `contentVisibilityAuto` is not supported and is ignored |
