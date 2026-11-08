# @fibrae/semi-icons-react

[简体中文](README.zh-CN.md)

The React icon and illustration components of Semi Design Next, with monochrome icons, color lab icons and illustrations, for React applications and `@fibrae/semi-ui-react`.

## Installation

```shell
pnpm add @fibrae/semi-icons-react
```

Peer dependency: `react`. `@fibrae/semi-icons-core` is a regular dependency and installs with the package. Ships ESM only.

## Usage

```tsx
import { createRoot } from 'react-dom/client';
import { IconSend } from '@fibrae/semi-icons-react';

createRoot(container).render(<IconSend size="large" />);
```

- Styles load with the components, with no separate import.
- `IconProps` extends the HTML attributes of `span`, plus the required `svg` (`ReactNode`) and the optional `size` (`inherit`, `extra-small`, `small`, `default`, `large` or `extra-large`, `default` by default), `spin`, `rotate`, `prefixCls`, `type` and `fill` (`string` or `string[]`).
- On multi-color icons, `fill` colors each part in order. Other icons pass `fill` to the root `svg`.
- Icons are decorative by default (`aria-hidden`). With `aria-label`, `aria-labelledby` or `tabIndex >= 0`, they become `role="img"` and are no longer hidden.

### Color icons

Lab icons keep their own colors and do not follow the text color:

```tsx
import { IconAnchor } from '@fibrae/semi-icons-react/lab';
```

### Illustrations

Construction, Failure, Idle, NoAccess, NoContent, NoResult, NotFound and Success, each with a regular and a `Dark` variant, often paired with `Empty` from `@fibrae/semi-ui-react`:

```tsx
import { IllustrationIdle, IllustrationIdleDark } from '@fibrae/semi-icons-react/illustrations';
import { Empty } from '@fibrae/semi-ui-react';

createRoot(container).render(<Empty image={<IllustrationIdle />} darkModeImage={<IllustrationIdleDark />} />);
```

- The export name is `Illustration` plus the illustration name, and dark variants add a `Dark` suffix, as in `IllustrationIdleDark`.
- Each illustration is an `svg` component with `SVGProps<SVGSVGElement>` as props, a default size of 200, and decorative by default (`aria-hidden`).
- Gradient, mask and clipPath ids are generated per instance, so multiple instances on a page do not interfere.
- Colors use `var(--semi-color-*)`, so the page must have the Semi theme styles loaded (provided by the styles of `semi-ui-react`).

### Custom icons

`Icon` is the default export and takes the graphic through `svg`, as in `<Icon svg={<MySvg />} size="large" />`. `convertIcon(Svg, iconType)` wraps your own svg component in the shape of a built-in icon. Both carry `elementType: 'Icon'` so `semi-ui-react` can recognize them.

| Entry                                             | Contents                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-react`                        | Default export `Icon`, named exports `IconXxx`, `convertIcon`, `IconProps` and `IconSize` |
| `@fibrae/semi-icons-react/lab`                    | Color icons                                                                               |
| `@fibrae/semi-icons-react/illustrations`          | Illustrations `IllustrationXxx` and `IllustrationXxxDark`                                 |
| `@fibrae/semi-icons-react/components/create-icon` | `createSvgComponent`, which renders icon or illustration data as a plain `svg`            |

Component docs are in [website/content/basic/icon](../../website/content/basic/icon) and [website/content/show/empty](../../website/content/show/empty).

## Related packages

- Depends on the icon and illustration data and the icon styles of `@fibrae/semi-icons-core`.
- Used by `@fibrae/semi-ui-react` and `@fibrae/semi-ai-react`.
- The equivalent package for each framework is `@fibrae/semi-icons-<framework>`.

## Development

- `src/icons`, `src/lab` and `src/illustrations` are generated source, so do not edit them by hand. Each icon module hands one icon's data to `createIcon` (`src/components/create-icon.ts`), which renders it as the `svg` inside `Icon`; each illustration module hands its data to `createSvgComponent` from the same file.
- To add an icon, add the SVG as described in [Adding icons in semi-icons-core](../shared/semi-icons-core/README.md#adding-icons), run `pnpm build:icon` at the repository root to regenerate this package's components, then open the icon page with `pnpm site:dev` to check it. Illustrations follow [Adding illustrations](../shared/semi-icons-core/README.md#adding-illustrations) the same way.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
