# @fibrae/semi-ai-vue

[简体中文](README.zh-CN.md)

The Vue AI components of Semi Design Next: `AIChatInput`, `AIChatDialogue`, `Chat` and `Sidebar`, for Vue 3.5+ applications. The components build on `@fibrae/semi-ui-vue`, take their logic from `@fibrae/semi-ai-foundation`, and behave the same as the AI packages of other frameworks.

## Installation

```sh
pnpm add @fibrae/semi-ai-vue @fibrae/semi-ui-vue
```

Peer dependency: `vue` (3.5+). `@fibrae/semi-ui-vue` is a dependency of this package.

## Usage

```vue
<script setup lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-vue';
</script>

<template>
    <AIChatInput />
</template>
```

- Styles load with the components, with no manual import. To use the full stylesheet, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. Then import `@fibrae/semi-ui-vue/styles.css` first and `@fibrae/semi-ai-vue/styles.css` second. The latter holds only the AI component styles, not the UI component styles.
- The package ships ESM only. `@fibrae/semi-ai-vue/<directory>/<file>` deep-imports any source file, including the compiled output of `.vue` files.
- Props carry data only, and custom DOM comes through scoped slots. Types are exported as `*Props`, `*Emits`, `*Slots` and `*SlotProps`, for example `ChatSlots` and `AIChatDialogueSlots`.
- Global defaults go through `semiGlobal` and can be set by component name.

Component docs and examples are in [website/content/ai](../../website/content/ai):

- [AIChatInput](../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../website/content/ai/sidebar)
- [AI components overview](../../website/content/ai/ai-component)

## Related packages

- Depends on `@fibrae/semi-ai-foundation` (logic and styles), `@fibrae/semi-foundation`, `@fibrae/semi-ui-vue`, `@fibrae/semi-icons-vue` and `@fibrae/semi-illustrations-vue`.
- The input is built on tiptap (`@tiptap/vue-3`). The framework-agnostic parts of the extensions live in the foundation, and this package connects them to Vue.
- The equivalent package for each framework is `@fibrae/semi-ai-<framework>`.

## Development

`pnpm build` runs `vp pack` in this package directory and produces `dist` (file-by-file ESM, type declarations and `styles.css`). The `CONFIGURATION_FIELD_CONFLICT` warning during the build is expected. For tests, lint and type checks, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
