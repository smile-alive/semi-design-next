# @fibrae/semi-ai-solid

[简体中文](README.zh-CN.md)

The Solid AI components of Semi Design Next: `AIChatInput`, `AIChatDialogue`, `Chat` and `Sidebar`, for Solid 1.9.17+ applications. The components build on `@fibrae/semi-ui-solid`, take their logic from `@fibrae/semi-ai-foundation`, and behave the same as the AI packages of other frameworks.

## For coding agents

This package ships documentation for coding agents that matches the installed version. Start with `node_modules/@fibrae/semi-ai-solid/docs/llms.txt`: it lists the rules for using the library, then one Markdown page per component with props, types, defaults and runnable examples. The same docs are online at https://semi-design-next.pages.dev/en-US/solid/llms.txt.

## Installation

```sh
pnpm add @fibrae/semi-ai-solid @fibrae/semi-ui-solid
```

Peer dependency: `solid-js` ^1.9.17. `@fibrae/semi-ui-solid` is a dependency of this package.

## Usage

```tsx
import { AIChatInput } from '@fibrae/semi-ai-solid';

export default function App() {
    return <AIChatInput />;
}
```

- Styles load with the components, with no manual import. To use the full stylesheet, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. Then import `@fibrae/semi-ui-solid/styles.css` first and `@fibrae/semi-ai-solid/styles.css` second. The latter holds only the AI component styles, not the UI component styles.
- The package ships ESM only. Each entry has a DOM build and a version that keeps JSX under the `solid` condition, as described in [@fibrae/semi-ui-solid](https://github.com/smile-alive/semi-design-next/blob/release/packages/semi-ui-solid/README.md#entry-points). `@fibrae/semi-ai-solid/<directory>/<file>` deep-imports any source file.
- Global defaults go through `semiGlobal` and can be set by component name.

Component docs and examples are in [AI components](https://semi-design-next.pages.dev/en-US/solid/ai/ai-component/):

- [AIChatInput](https://semi-design-next.pages.dev/en-US/solid/ai/ai-chat-input/)
- [AIChatDialogue](https://semi-design-next.pages.dev/en-US/solid/ai/ai-chat-dialogue/)
- [Sidebar](https://semi-design-next.pages.dev/en-US/solid/ai/sidebar/)
- [AI components overview](https://semi-design-next.pages.dev/en-US/solid/ai/ai-component/)

## Related packages

- Depends on `@fibrae/semi-ai-foundation` (logic and styles), `@fibrae/semi-foundation`, `@fibrae/semi-ui-solid`, `@fibrae/semi-icons-solid` and `@fibrae/semi-icons-solid/illustrations`.
- The input is built on tiptap (`@tiptap/core`). The framework-agnostic parts of the extensions live in the foundation, and this package connects them to Solid.
- The equivalent package for each framework is `@fibrae/semi-ai-<framework>`.

## Development

`pnpm build` runs `vp pack` in this package directory and produces `dist` (file-by-file DOM ESM, `.jsx` for the `solid` condition, type declarations and `styles.css`). For tests, lint and type checks, see [CONTRIBUTING.md](https://github.com/smile-alive/semi-design-next/blob/release/CONTRIBUTING.md#常用命令) at the repository root.
