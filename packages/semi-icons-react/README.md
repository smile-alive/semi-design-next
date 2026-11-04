# @fibrae/semi-icons-react

[简体中文](README.zh-CN.md)

The React icon components of Semi Design Next, with monochrome icons and color lab icons, for React applications and `@fibrae/semi-ui-react`.

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

### Custom icons

`Icon` is the default export and takes the graphic through `svg`, as in `<Icon svg={<MySvg />} size="large" />`. `convertIcon(Svg, iconType)` wraps your own svg component in the shape of a built-in icon. Both carry `elementType: 'Icon'` so `semi-ui-react` can recognize them.

| Entry                                             | Contents                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-react`                        | Default export `Icon`, named exports `IconXxx`, `convertIcon`, `IconProps` and `IconSize` |
| `@fibrae/semi-icons-react/lab`                    | Color icons                                                                               |
| `@fibrae/semi-icons-react/components/create-icon` | `createSvgComponent`, used by the illustration package                                    |

Component docs are in [website/content/basic/icon](../../website/content/basic/icon).

## Related packages

- Depends on the icon data and styles of `@fibrae/semi-icons-core`.
- Used by `@fibrae/semi-ui-react` and `@fibrae/semi-illustrations-react`.
- The equivalent package for each framework is `@fibrae/semi-icons-<framework>`.

## Development

- `src/icons` and all of `src/lab` are generated source, so do not edit them by hand. Each module hands one icon's data to `createIcon` (`src/components/create-icon.ts`), which renders it as the `svg` inside `Icon`.
- To add an icon, add the SVG as described in [Adding icons in semi-icons-core](../semi-icons-core/README.md#adding-icons), run `pnpm build:icon` at the repository root to regenerate this package's components, then open the icon page with `pnpm site:dev` to check it.
- For build and test commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root.
