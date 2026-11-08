# @fibrae/semi-ai-react

[简体中文](README.zh-CN.md)

The React AI components of Semi Design Next: `AIChatInput`, `AIChatDialogue`, `Chat` and `Sidebar`, for building conversational interfaces in React 19 applications. The components build on `@fibrae/semi-ui-react`, take their logic from `@fibrae/semi-ai-foundation`, and behave the same as the AI packages of other frameworks.

## Installation

```sh
pnpm add @fibrae/semi-ai-react @fibrae/semi-ui-react
```

Peer dependencies: `react` and `react-dom` (React 19). `@fibrae/semi-ui-react` is a dependency of this package.

## Usage

```tsx
import { AIChatInput, AIChatDialogue, Chat, Sidebar } from '@fibrae/semi-ai-react';

export default function App() {
    return <AIChatInput />;
}
```

- Styles load with the components, with no manual import. To use the full stylesheet, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. For Next.js, use `omitCss: true` in `@fibrae/semi-next` (off by default). Then import `@fibrae/semi-ui-react/styles.css` first and `@fibrae/semi-ai-react/styles.css` second. The latter holds only the AI component styles, not the UI component styles.
- The package ships ESM only. `@fibrae/semi-ai-react/<directory>/<file>` deep-imports any source file, and the matching `.css` of the same name loads with the output.
- Code block highlighting bundles no languages. Register the shiki grammars you need with `CodeHighlight.register({ languages: [...] })` from `@fibrae/semi-ui-react`.
- Global defaults go through `semiGlobal`. `AIChatDialogue`, `AIChatInput`, `Annotation`, `Chat`, `MCPConfigure` and `Sidebar` can each be set by component name.

Component docs and examples are in [website/content/ai](../../website/content/ai):

- [AIChatInput](../../website/content/ai/ai-chat-input)
- [AIChatDialogue](../../website/content/ai/ai-chat-dialogue)
- [Sidebar](../../website/content/ai/sidebar)
- [AI components overview](../../website/content/ai/ai-component)

Known issues are in the AIChatInput section of [docs/component-issues.md](../../docs/component-issues.md).

## Related packages

- Depends on `@fibrae/semi-ai-foundation` (logic and styles), `@fibrae/semi-foundation`, `@fibrae/semi-ui-react`, `@fibrae/semi-icons-react` and `@fibrae/semi-icons-react/illustrations`.
- The input is built on tiptap. The framework-agnostic parts of the rich text extensions live in the foundation, and this package connects them to React with `addNodeView`.
- The equivalent package for each framework is `@fibrae/semi-ai-<framework>`.

## Development

`pnpm build` runs `vp pack` in this package directory and produces `dist` (file-by-file ESM, type declarations and `styles.css`). For tests, lint and type checks, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
