# @fibrae/semi-ui-solid

[简体中文](README.zh-CN.md)

The Solid component library of Semi Design Next, for Solid 1.9.17+ applications. It is a community fork of [Semi Design](https://github.com/DouyinFE/semi-design), unaffiliated with ByteDance and the Semi Design team, and shares the logic and styles of one foundation with the UI packages of other frameworks.

## Installation

```sh
pnpm add solid-js @fibrae/semi-ui-solid @fibrae/semi-icons-solid
```

Peer dependency: `solid-js` ^1.9.17. For browser, module format, Node.js and build plugin requirements, see the [requirements in Getting Started](../../website/content/start/getting-started/index.en-US.mdx#requirements).

## Usage

```tsx
import { Button, Toast } from '@fibrae/semi-ui-solid';

export default function App() {
    return <Button onClick={() => Toast.warning({ content: 'welcome' })}>Hello Semi</Button>;
}
```

Styles and theme tokens load with the components. You do not need to import base styles or reset.css.

### Entry points

| Entry                                     | Description                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-ui-solid`                   | All components and types, `ConfigProvider`, `LocaleProvider`, `LocaleConsumer`, `useLocale` and `semiGlobal`                                      |
| `@fibrae/semi-ui-solid/locale`            | The built-in locale packs `zh_CN` and `en_US`, and the `Locale` and `LocaleInput` types                                                           |
| `@fibrae/semi-ui-solid/<directory>/index` | Deep file paths that map one-to-one to the directories under `src/components/`                                                                    |
| `@fibrae/semi-ui-solid/tokens`            | Theme tokens and base rules. Import it first in the application entry so tokens still load with the entry when the first component is lazy-loaded |
| `@fibrae/semi-ui-solid/styles.css`        | The full stylesheet, for loading all component styles at once                                                                                     |
| `@fibrae/semi-ui-solid/tailwind.css`      | The Tailwind v4 `@theme inline` mapping                                                                                                           |

Each entry ships twice: a compiled DOM build under the default condition, and a version that keeps JSX under the `solid` condition. `vite-plugin-solid` (SolidStart, Vike, TanStack Start) and `unplugin-solid` pick the latter through the `solid` condition and recompile it for the target (DOM or server).

To use the full `styles.css`, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. The full stylesheet already includes tokens, and under `omitCss` the `tokens` entry is removed along with the component styles.

When using `@fibrae/semi-ai-solid` with the full stylesheet, import `@fibrae/semi-ai-solid/styles.css` after `styles.css`.

### Customizing styles

Override `--semi-*` CSS variables to change global colors, radii, font sizes and spacing. Semi's styles sit in `@layer semi`, so unlayered CSS rules in your application always win. There are no theme packages and no compile-time Sass overrides. The published `.scss` contains `semi:` addresses and must go through a build plugin (such as `@fibrae/semi-vite-plugin`) or `@fibrae/semi-scss-compile`.

### Internationalization

The default locale is `zh_CN`. The built-in packs `zh_CN` and `en_US` come from the `locale` entry. Pass a locale pack with `LocaleProvider`. `useLocale(componentName)` returns an accessor for that component's text in the current locale:

```tsx
import { LocaleProvider } from '@fibrae/semi-ui-solid';
import { en_US } from '@fibrae/semi-ui-solid/locale';

<LocaleProvider locale={en_US}>
    <App />
</LocaleProvider>;
```

For any other language, pass your own pack typed `LocaleInput`: `code` is required, and every text it leaves out falls back to `en_US`. For the structure of a locale pack, see [@fibrae/semi-foundation](../shared/semi-foundation/README.md#locale-packs).

### Server rendering

Components render on the server with `renderToString` and others from `solid-js/web`, and the browser hydrates with `hydrate`. Keep in mind:

- Overlays that open by default (`defaultOpen`, `visible` and so on) are not in the server HTML and open after hydration.
- The "today" marker of Calendar appears only after mount, so pass `displayValue` during server rendering. The server and browser time zones must match, or be unified with `timeZone` on `ConfigProvider`.
- Imperative APIs such as `Toast`, `Notification` and `Modal.confirm` can only be called in the browser, and throw an error explaining when to call them on the server. To inherit context, use the holder returned by the hook form.
- Set `semiGlobal.config` only at application startup. The server and browser use the same config.

### Documentation

Component docs are in [website/content](../../website/content). To get started, read [Getting Started](../../website/content/start/getting-started/index.en-US.mdx).

## Related packages

- Depends on `@fibrae/semi-foundation` (logic and styles) and `@fibrae/semi-icons-solid`.
- Used by `@fibrae/semi-ai-solid` and the docs site `website`.
- The UI package of each framework (`semi-ui-<framework>`) shares the same foundation.

## Development

`pnpm --filter @fibrae/semi-ui-solid build` runs `vp pack` in two passes: the TS and TSX under `src` compile file by file to DOM ESM with type declarations, then `.jsx` is emitted with `jsx: preserve` for the `solid` condition. It also produces component CSS and the full `styles.css` and `tailwind.css`.

For general commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root. For how to write components, see [components](../../.agents/references/solid/components.md). For changes relative to upstream, see [release-notes](../../docs/release-notes.md).
