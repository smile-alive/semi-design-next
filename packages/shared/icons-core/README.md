# @fibrae/semi-icons-core

[简体中文](README.zh-CN.md)

Framework-agnostic icon and illustration data, plus icon styles, for Semi Design Next. The icon packages (`semi-icons-<framework>`) and illustration packages (`semi-illustrations-<framework>`) of every framework read this data. You can also use it directly to render icons yourself.

## Installation

```shell
pnpm add @fibrae/semi-icons-core
```

Ships ESM only, with no peer dependencies.

## Usage

Each icon is an ESM module that exports `IconData`, under the same name as the icon component in each framework:

```ts
import { IconActivity } from '@fibrae/semi-icons-core';
import { IconAvatar } from '@fibrae/semi-icons-core/lab'; // color icon that keeps its original colors

IconActivity;
// {
//     name: 'activity', // icon type, rendered as the `semi-icon-activity` class
//     attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
//     children: [['path', { 'fill-rule': 'evenodd', 'clip-rule': 'evenodd', d: '...', fill: 'currentColor' }]],
// }
```

- A node is `[tag, attrs, children?]`. Attribute names are DOM names (`fill-rule`, `class`, with `style` as a string), so a framework can pass them through as they are or map them once (React uses `fillRule`, `className` and a style object).
- When rendering, add `defaultAttrs` to the root `svg`: `width` and `height` of `1em`, `focusable="false"`, `aria-hidden="true"`.
- Multi-color icons (`IconAI*Level2`, `IconAI*Level3`, `IconAILoading`) carry `fills`, the number of colors supplied through the `fill` prop. Attribute values contain placeholders: `{fillN}` is the Nth color of `getFillColor(fill, fills)`, and `{uid}` is an id unique to each rendered instance. Replace them with `resolveValue(value, colors, uid)`. Other icons pass `fill` straight to the root `svg`.

### Subpath entries

| Entry                                       | Contents                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-core`                   | All `IconXxx` data, the types `IconData` and `IconNode`, and the utilities `defaultAttrs`, `getFillColor` and `resolveValue` |
| `@fibrae/semi-icons-core/lab`               | Data for color icons that keep their original colors                                                                         |
| `@fibrae/semi-icons-core/illustrations`     | Illustration data `IllustrationXxx`, keeping original colors and a default size of 200                                       |
| `@fibrae/semi-icons-core/styles/icons.scss` | Icon styles, also available as compiled `.css`                                                                               |
| `@fibrae/semi-icons-core/*`                 | Other deep paths, such as `/utils` and `/types`                                                                              |

The styles define `.{prefix}-icon`, `-extra-small`, `-small`, `-default`, `-large`, `-extra-large`, `-spinning` and the spin animation, and depend on `$prefix` from `semi:theme`. The framework icon packages already import them; import them yourself when using core directly.

## Related packages

- Depends on no other Semi package.
- Used by the icon and illustration packages of each framework.

## Adding icons

- Monochrome icon: add `svgs/icons/<name>.svg` and an entry in `svgs/icons/meta.json`. `category` is the group name on the icon page and reuses existing values such as `Basic`, `Arrow` and `Interface`; AI icons use `One Color`, `Two Color` and `Multiple Color` by color level. Colors become `currentColor`.
- Color icon: add `svgs/lab/<name>.svg` and an entry in `svgs/lab/meta.json`. Colors stay as they are.
- The SVG file name is the icon type, the export name is `Icon` plus PascalCase (`ai_` becomes `AI`), and the generated module file name is the export name in kebab-case (`IconAIBellLevel2` becomes `icon-ai-bell-level-2.ts`).
- Do not hand-write `{uid}` for ids in the SVG source. The generator adds the prefix, and rendering replaces it per instance.
- Run `pnpm build:icon` at the repository root. It first writes `src/icons`, `src/lab` and `src/illustrations` in this package (`scripts/build-icon.ts`, with a fixed svgo config to keep path data stable), then generates the icon and illustration components of each framework. Do not edit generated files by hand.
- Run `pnpm site:dev` and open the [icon docs page](../../../website/content/basic/icon) to check the new icon.

## Adding illustrations

- Add `svgs/illustrations/<name>.svg`, and name the dark variant `<name>-dark.svg`. Colors, `width` and `height` stay as they are, with colors written as `var(--semi-color-*)`.
- The export name is `Illustration` plus PascalCase, so `noContent-dark` becomes `IllustrationNoContentDark`.
- Ids also skip the hand-written `{uid}`. Run `pnpm build:icon` to generate `src/illustrations` and the illustration components of each framework.

## Development

- Build: `vp pack`. For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root.
- Tests: `__tests__/data.test.ts` checks the ids and references of all icons and illustrations.
