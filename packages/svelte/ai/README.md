# @fibrae/semi-ai-svelte

[简体中文](README.zh-CN.md)

The Svelte AI components of Semi Design Next: `AIChatInput`, `AIChatDialogue`, `Chat` and `Sidebar`, for Svelte 5.57+ applications. The components build on `@fibrae/semi-ui-svelte`, take their logic from `@fibrae/semi-ai-foundation`, and behave the same as the AI packages of other frameworks.

## Installation

```sh
pnpm add svelte @fibrae/semi-ai-svelte @fibrae/semi-ui-svelte
```

Peer dependency: `svelte` ^5.57.0. `@fibrae/semi-ui-svelte` is a dependency of this package.

## Usage

```svelte
<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
</script>

<AIChatInput />
```

- Styles load with the components, with no manual import. To use the full stylesheet, turn on `omitCss` in `@fibrae/semi-vite-plugin`; otherwise the style imports inside the components are bundled a second time. Then import `@fibrae/semi-ui-svelte/styles.css` first and `@fibrae/semi-ai-svelte/styles.css` second. The latter holds only the AI component styles.
- The package ships `.svelte` source and `.d.ts` files, compiled for the application's target by `@sveltejs/vite-plugin-svelte`, as described in [@fibrae/semi-ui-svelte](../ui/README.md#entry-points). `@fibrae/semi-ai-svelte/<directory>/<file>` deep-imports any source file.
- Global defaults go through `semiGlobal` and can be set by component name.

Component docs and examples are in [website/content](../../../website/content):

- [AIChatInput](../../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../../website/content/ai/sidebar)
- [Chat](../../../website/content/plus/chat)
- [AI components overview](../../../website/content/ai/ai-component)

## Related packages

- Depends on `@fibrae/semi-ai-foundation` (logic and styles), `@fibrae/semi-foundation`, `@fibrae/semi-ui-svelte`, `@fibrae/semi-icons-svelte` and `@fibrae/semi-illustrations-svelte`.
- The input and the Sidebar file editor are built on tiptap (`@tiptap/core`). The framework-agnostic parts of the extensions live in the foundation, and this package connects them to Svelte.
- The equivalent package for each framework is `@fibrae/semi-ai-<framework>`.

## Development

`pnpm --filter @fibrae/semi-ai-svelte build` runs `scripts/svelte-package.ts --bundles ai` and produces `dist` (`.svelte` files as they are, `.ts` compiled to `.js` and `.d.ts`, and the full `styles.css`). For tests, lint and type checks, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
