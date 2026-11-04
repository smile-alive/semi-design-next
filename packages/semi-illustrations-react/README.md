# @fibrae/semi-illustrations-react

[简体中文](README.zh-CN.md)

The React illustration components of Semi Design Next, including Construction, Failure, Idle, NoAccess, NoContent, NoResult, NotFound and Success. Each set has a regular and a `Dark` variant, and they often pair with `Empty` from `@fibrae/semi-ui-react`.

## Installation

```shell
pnpm add @fibrae/semi-illustrations-react
```

Peer dependency: `react`. `@fibrae/semi-icons-core` and `@fibrae/semi-icons-react` are regular dependencies and install with the package. Ships ESM only.

## Usage

```tsx
import { IllustrationIdle } from '@fibrae/semi-illustrations-react';

createRoot(container).render(<IllustrationIdle style={{ width: 150, height: 150 }} />);
```

- The export name is `Illustration` plus the illustration name, and dark variants add a `Dark` suffix, as in `IllustrationIdleDark`.
- Each illustration is an `svg` component with `SVGProps<SVGSVGElement>` as props, a default size of 200, and decorative by default (`aria-hidden`).
- Gradient, mask and clipPath ids are generated per instance, so multiple instances on a page do not interfere.
- Colors use `var(--semi-color-*)`, so the page must have the Semi theme styles loaded (provided by the styles of `semi-ui-react`). This package has no styles of its own.

### With Empty

```tsx
import { IllustrationIdle, IllustrationIdleDark } from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

createRoot(container).render(<Empty image={<IllustrationIdle />} darkModeImage={<IllustrationIdleDark />} />);
```

Component docs are in [website/content/show/empty](../../website/content/show/empty).

## Related packages

- Depends on `createSvgComponent` from `@fibrae/semi-icons-react`.
- Illustration data comes from `@fibrae/semi-icons-core/illustrations`, which the illustration packages of every framework read.
- The equivalent package for each framework is `@fibrae/semi-illustrations-<framework>`.

## Development

- `src/illustrations` is generated source, so do not edit it by hand. The illustration SVGs are in `svgs/illustrations` of `semi-icons-core`, as described in [semi-icons-core](../semi-icons-core/README.md#adding-illustrations). After changing them, run `pnpm build:icon` at the repository root, which updates the illustration packages of every framework.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
