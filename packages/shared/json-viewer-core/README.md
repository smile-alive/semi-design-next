# @fibrae/semi-json-viewer-core

[简体中文](README.zh-CN.md)

The framework-agnostic editor core behind JsonViewer in Semi Design Next, derived from the JSON viewing and editing implementation in VS Code. Given a container element and JSON text, it provides rendering, editing, search and replace, completion and formatting. Most users reach it through the JsonViewer in each framework's UI package, and the JsonViewer foundation in `@fibrae/semi-foundation` depends on this package.

## Installation

```sh
pnpm add @fibrae/semi-json-viewer-core
```

It has no peer or runtime dependencies (`jsonc-parser` is bundled into `dist`). The package has no styles; the JsonViewer component provides them.

## Usage

```ts
import { JsonViewer } from '@fibrae/semi-json-viewer-core';

const viewer = new JsonViewer(container, '{"name": "semi"}', { readOnly: true });
viewer.layout();
// release when no longer needed
viewer.dispose();
```

Constructor: `new JsonViewer(container: HTMLElement, value: string, options?: JsonViewerOptions)`.

| Option              | Description                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `lineHeight`        | Line height                                                                                                                           |
| `autoWrap`          | Whether to wrap lines automatically                                                                                                   |
| `readOnly`          | Whether the content is read-only                                                                                                      |
| `formatOptions`     | Formatting, with `tabSize`, `insertSpaces` and `eol`                                                                                  |
| `completionOptions` | Completion, with `staticCompletions`                                                                                                  |
| `customRenderRule`  | Array of custom render rules `{ match, render }`, where `match` is a string, a `RegExp` or `(value, pathChain, tokenType) => boolean` |
| `prefixCls`         | Class name prefix                                                                                                                     |
| `ariaLabel`         | The name of the scroll region when read-only, and of the textbox when editable                                                        |

Instance methods: `layout()`, `resetMeasuredHeights()`, `getModel()`, `getSearchWidget()`, `format()` and `dispose()`, plus the public property `emitter`. Each instance isolates its events and worker in its own namespace, so you must call `dispose()` when done.

Exported types: `JsonViewerOptions`, `CompletionOptions`, `FormattingOptions`, `TokenRenderType` and `CustomRenderRule`. Component docs are in [website/content/plus/json-viewer](../../../website/content/plus/json-viewer).

## Internals

`src/tokens` handles lexical analysis and highlighting of JSON text:

- `tokenize.ts` recognizes delimiters, keywords, strings, numbers and comments, and records bracket nesting depth.
- `tokenizationJsonModelPart.ts` holds the token state of the whole document and marks affected lines when content changes.
- `jsonModelToken.ts` does incremental analysis, recomputing only what changed and finishing in the background during idle time through `IdleDeadline`.
- `offsetRange.ts` provides merge, intersection, shift and containment operations on offset ranges, used to bound what needs recomputing.

The language service runs in a Web Worker. At build time a plugin in `vite.semi.ts` inlines the worker source, and at runtime it starts from a blob URL.

## Related packages

Depended on by `@fibrae/semi-foundation`. Depends on no other Semi package.

## Development

`pnpm build` runs `vp pack` in this package directory and emits a single-entry ESM file with type declarations. For tests, lint and type checks, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
