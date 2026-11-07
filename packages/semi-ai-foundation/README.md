# @fibrae/semi-ai-foundation

[简体中文](README.zh-CN.md)

The framework-agnostic part of the Semi Design Next AI components: foundation logic, SCSS styles and tiptap editor plugins. The AI package for each framework (`semi-ai-<framework>`) connects through an adapter, so applications rarely depend on this package directly.

## Installation

```sh
pnpm add @fibrae/semi-ai-foundation
```

It depends on no framework or UI package.

## Usage

This package has no `.` entry. You cannot import the bare package name, only specific paths:

```ts
import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
```

| Entry                                           | Description                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `@fibrae/semi-ai-foundation/<directory>/<file>` | Maps to `dist/<directory>/<file>.js`                                               |
| `@fibrae/semi-ai-foundation/<path>.css`         | Compiled styles                                                                    |
| `@fibrae/semi-ai-foundation/<path>.scss`        | SCSS source; `rtl.scss`, `variables.scss` and `animation.scss` ship only as source |

`components/` holds `ai-chat-dialogue`, `ai-chat-input`, `chat` and `sidebar`; `base/` holds the foundations several components extend (`message-list-foundation`, `action-bar-foundation`); `utils/` holds stateless helpers. The tiptap extensions live in `components/ai-chat-input/extension/`, and each framework package provides node views with its own `.extend({ addNodeView })`.

## Related packages

- Depends on `@fibrae/semi-foundation`, `@tiptap/*` and `es-toolkit`.
- Used by the AI package of each framework, which combines the styles into its own `styles.css`.

## Development

`pnpm build` runs `vp pack` in this package directory: it emits ESM and type declarations file by file, and compiles SCSS to CSS in the same directory. For tests, lint and type checks, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
