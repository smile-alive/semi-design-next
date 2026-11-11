# @fibrae/semi-animation

[简体中文](README.zh-CN.md)

Easing and spring presets from Semi Design Next for [Motion](https://motion.dev), plus framework-agnostic View Transition preset classes. Semi does not wrap Motion, so you install it yourself.

## Installation

```sh
pnpm add motion @fibrae/semi-animation
```

`motion` (`^14`) is an optional peer dependency. You do not need it if you only use the View Transition preset classes.

## Easings

`easings` provides Penner easings by name, and the values work directly as Motion's `ease`. Cubic Bezier curves are four-element tuples. Elastic easings overshoot the end point, so they are functions.

```js
import { animate } from 'motion';
import { easings } from '@fibrae/semi-animation';

animate(el, { opacity: [0, 1], transform: ['translateY(8px)', 'none'] }, { duration: 0.2, ease: easings.easeOutCubic });
```

```jsx
import { motion } from 'motion/react';

<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: easings.easeInOutQuart }} />;
```

Names: `linear` and `ease{In,Out,InOut}{Quad,Cubic,Quart,Quint,Sine,Expo,Circ,Back,Elastic}`. Bezier easings also work in CSS: `` `cubic-bezier(${easings.easeOutCubic.join(', ')})` ``.

## Springs

`springs` provides spring transitions: `default`, `gentle`, `wobbly`, `stiff`, `slow` and `molasses`.

```js
animate(el, { scale: [0.9, 1] }, springs.wobbly);
```

```jsx
<motion.div animate={{ x: 100 }} transition={springs.gentle} />
```

```html
<!-- Vue, with motion-v -->
<motion.div :animate="{ x: 100 }" :transition="springs.gentle" />
```

Each preset is `{ type: 'spring', stiffness, damping }`. Spread it to add Motion options: `{ ...springs.stiff, delay: 0.1 }`.

## Performance

Motion hands `opacity` and full `transform` strings to the browser, which animates them off the main thread. The independent `x`, `y`, `scale` and `rotate` go through CSS variables and run on the main thread (see the [Motion docs](https://motion.dev/docs/performance)). Prefer `transform` when there are many elements or the page is busy.

## View Transition preset classes

```js
import '@fibrae/semi-animation/styles/view-transition.css';
```

Classes for the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API). One class covers every trigger: an appearing element enters, a disappearing element exits, and a kept (or shared) element does both.

| Class              | Enter                         | Exit                           |
| ------------------ | ----------------------------- | ------------------------------ |
| `semi-fade`        | Fade in                       | Fade out                       |
| `semi-zoom`        | Scale up from 85% and fade in | Scale down to 85% and fade out |
| `semi-slide-up`    | Enter from below              | Exit upward                    |
| `semi-slide-down`  | Enter from above              | Exit downward                  |
| `semi-slide-left`  | Enter from the right          | Exit to the left               |
| `semi-slide-right` | Enter from the left           | Exit to the right              |

In React, pass the classes to `<ViewTransition enter exit update share>` and update state inside `startTransition`:

```jsx
import { ViewTransition, startTransition } from 'react';

<ViewTransition enter="semi-slide-up" exit="semi-fade">
    <Panel />
</ViewTransition>;

startTransition(() => setShown(true));
```

Without a framework, or in Vue, give the element a unique `view-transition-name`, put the class in `view-transition-class`, and change the DOM inside `document.startViewTransition()`:

```html
<script setup>
    import { nextTick, ref } from 'vue';
    import '@fibrae/semi-animation/styles/view-transition.css';

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

Adjust with custom properties. View Transition pseudo-elements hang off `html`, not your element, so set them on `:root`, or on a selector such as `::view-transition-group(.semi-fade)` to affect one class:

- `--semi-view-transition-duration`: duration, `250ms` by default.
- `--semi-view-transition-easing`: easing, `cubic-bezier(0.2, 0, 0, 1)` by default.
- `--semi-view-transition-offset`: slide distance, `100%` of the element size by default.

Under `prefers-reduced-motion: reduce`, every class falls back to a fade. The styles sit in the `semi` cascade layer, so unlayered application styles win.

## Development

`pnpm build` runs `vp pack` in this package directory and compiles `src/styles/view-transition.scss` to `dist/styles/view-transition.css` (the `.scss` also ships). Tests are in `__tests__/`. For commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
