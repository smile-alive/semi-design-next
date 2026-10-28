# @fibrae/semi-animation

Semi Design Next 提供给 [Motion](https://motion.dev) 使用的缓动（easings）与弹簧（springs）预设，加上框架无关的 View Transition 预设类样式。Semi 不封装 Motion，需要使用方自行安装。

## 安装

```sh
pnpm add motion @fibrae/semi-animation
```

`motion`（`^14`）是可选 peer 依赖：只用 View Transition 预设类时不需要它。

## 缓动

`easings` 按名称提供 Penner 缓动，值可直接用于 Motion 的 `ease`：三次贝塞尔曲线为四元组，弹性（Elastic）缓动会越过终点，是函数。

```js
import { animate } from 'motion';
import { easings } from '@fibrae/semi-animation';

animate(el, { opacity: [0, 1], transform: ['translateY(8px)', 'none'] }, { duration: 0.2, ease: easings.easeOutCubic });
```

```jsx
import { motion } from 'motion/react';

<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: easings.easeInOutQuart }} />;
```

名称：`linear` 与 `ease{In,Out,InOut}{Quad,Cubic,Quart,Quint,Sine,Expo,Circ,Back,Elastic}`。贝塞尔缓动同样适用于 CSS：`` `cubic-bezier(${easings.easeOutCubic.join(', ')})` ``。

## 弹簧

`springs` 提供弹簧过渡：`default`、`gentle`、`wobbly`、`stiff`、`slow`、`molasses`。

```js
animate(el, { scale: [0.9, 1] }, springs.wobbly);
```

```jsx
<motion.div animate={{ x: 100 }} transition={springs.gentle} />
```

```html
<!-- Vue，配合 motion-v -->
<motion.div :animate="{ x: 100 }" :transition="springs.gentle" />
```

每个预设是 `{ type: 'spring', stiffness, damping }`，需要附加 Motion 选项时展开即可：`{ ...springs.stiff, delay: 0.1 }`。

## 性能

Motion 把 `opacity` 和完整的 `transform` 字符串交给浏览器，在主线程之外执行动画；而独立的 `x`、`y`、`scale`、`rotate` 经 CSS 变量，在主线程运行（见 [Motion 文档](https://motion.dev/docs/performance)）。元素多或页面繁忙时，优先使用 `transform`。

## View Transition 预设类

```js
import '@fibrae/semi-animation/styles/viewTransition.css';
```

用于 [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) 的类。一个类同时覆盖所有触发场景：出现的元素进入，消失的元素退出，保留的元素（或共享元素）两者都做。

| 类                 | 进入              | 退出              |
| ------------------ | ----------------- | ----------------- |
| `semi-fade`        | 淡入              | 淡出              |
| `semi-zoom`        | 从 85% 放大并淡入 | 缩小到 85% 并淡出 |
| `semi-slide-up`    | 从下方进入        | 向上方退出        |
| `semi-slide-down`  | 从上方进入        | 向下方退出        |
| `semi-slide-left`  | 从右侧进入        | 向左侧退出        |
| `semi-slide-right` | 从左侧进入        | 向右侧退出        |

React 中把类传给 `<ViewTransition enter exit update share>`，并在 `startTransition` 里更新状态：

```jsx
import { ViewTransition, startTransition } from 'react';

<ViewTransition enter="semi-slide-up" exit="semi-fade">
    <Panel />
</ViewTransition>;

startTransition(() => setShown(true));
```

不用框架或在 Vue 中，给元素设置唯一的 `view-transition-name`，把类写进 `view-transition-class`，并在 `document.startViewTransition()` 里修改 DOM：

```html
<script setup>
    import '@fibrae/semi-animation/styles/viewTransition.css';
    import { nextTick, ref } from 'vue';

    const shown = ref(false);
    const toggle = () =>
        document.startViewTransition(async () => {
            shown.value = !shown.value;
            await nextTick();
        });
</script>

<template>
    <button @click="toggle">toggle</button>
    <div v-if="shown" style="view-transition-name: panel; view-transition-class: semi-slide-up">panel</div>
</template>
```

用自定义属性调整。View Transition 伪元素挂在 `html` 上而不是你的元素上，所以要设置在 `:root`，或设置在 `::view-transition-group(.semi-fade)` 这样的选择器上以只作用于某个类：

- `--semi-view-transition-duration`：时长，默认 `250ms`。
- `--semi-view-transition-easing`：缓动，默认 `cubic-bezier(0.2, 0, 0, 1)`。
- `--semi-view-transition-offset`：滑动距离，默认元素尺寸的 `100%`。

设置了 `prefers-reduced-motion: reduce` 时，所有类都退化为淡入淡出。样式位于 `semi` cascade layer 中，未分层的应用样式优先级更高。

## 开发

`pnpm build` 在本包目录运行 `vp pack`，并把 `src/styles/viewTransition.scss` 编译为 `dist/styles/viewTransition.css`（同时保留 `.scss`）。测试在 `__tests__/`，命令见根目录 [README.md](../../README.md) 的「常用命令」。
