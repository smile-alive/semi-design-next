# @fibrae/semi-ui-react

[简体中文](README.zh-CN.md)

The React component library of Semi Design Next, for React 19 applications. It is a community fork of [Semi Design](https://github.com/DouyinFE/semi-design), unaffiliated with ByteDance and the Semi Design team. It does not sync with upstream or keep backward compatibility.

## Installation

```sh
pnpm add @fibrae/semi-ui-react
```

Peer dependencies: `react` and `react-dom` ^19.3.0. For browser, module format, Node.js and build plugin requirements, see the [requirements in Getting Started](../../website/content/start/getting-started/index.en-US.mdx#requirements).

## Usage

```tsx
import { Button, Toast } from '@fibrae/semi-ui-react';

export function App() {
    return <Button onClick={() => Toast.warning({ content: 'welcome' })}>Hello Semi</Button>;
}
```

Styles and theme tokens load with the components, from both the root entry and deep paths. You do not need to import base styles or reset.css.

### Entry points

| Entry                                     | Description                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@fibrae/semi-ui-react`                   | All components and types, `LocaleProvider`, `LocaleConsumer` and `BaseFoundation`                                                                      |
| `@fibrae/semi-ui-react/locale`            | The built-in locale packs `zh_CN` and `en_US`, and the `Locale` and `LocaleInput` types. Not marked `'use client'`, so Server Components can import it |
| `@fibrae/semi-ui-react/<directory>/index` | Deep file paths that map one-to-one to the directories under `src/components/`, for example `button/index`                                             |
| `@fibrae/semi-ui-react/tokens`            | Theme tokens and base rules. Import it first in the application entry so tokens still load with the entry when the first component is lazy-loaded      |
| `@fibrae/semi-ui-react/styles.css`        | The full stylesheet, for loading all component styles at once                                                                                          |
| `@fibrae/semi-ui-react/tailwind.css`      | The Tailwind v4 `@theme inline` mapping                                                                                                                |

To use the full `styles.css`, turn on `omitCss` in the Semi build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin` or `@fibrae/semi-rspack-plugin`); otherwise the style imports inside the components are bundled a second time. For Next.js, use `omitCss: true` in `@fibrae/semi-next` (off by default). The full stylesheet already includes tokens, and under `omitCss` the `tokens` entry is removed along with the component styles.

With Tailwind, declare `@layer theme, base, semi, components, utilities;` first and keep the build plugin's `cssLayer` at its default of `true`.

### Customizing styles

Override `--semi-*` CSS variables to change global colors, radii, font sizes and spacing. Semi's styles sit in `@layer semi`, so unlayered CSS rules in your application always win. There are no theme packages and no compile-time Sass overrides.

The published `.scss` contains `semi:` addresses and cannot be compiled by Sass directly. Use it through a build plugin (`@fibrae/semi-vite-plugin`, `@fibrae/semi-webpack-plugin`, `@fibrae/semi-rspack-plugin` or `@fibrae/semi-next`) or `@fibrae/semi-scss-compile`.

### Internationalization

The default locale is `zh_CN`. The built-in packs `zh_CN` and `en_US` come from the `locale` entry. Pass a locale pack with `LocaleProvider`:

```tsx
import { LocaleProvider } from '@fibrae/semi-ui-react';
import { en_US } from '@fibrae/semi-ui-react/locale';

<LocaleProvider locale={en_US}>
    <App />
</LocaleProvider>;
```

Without `locale`, it inherits from the outer provider. For any other language, pass your own pack typed `LocaleInput`: `code` is required, and every text it leaves out falls back to `en_US`. For the structure of a locale pack, see [@fibrae/semi-foundation](../shared/semi-foundation/README.md#locale-packs).

### Server rendering

Components support server rendering such as `renderToString` and `prerender`, and `hydrateRoot`:

- Imperative APIs such as `Toast`, `Notification` and `Modal.confirm` are called only on the client (event handlers, effects) and throw on the server. To output with the render, use the holders returned by `Toast.useToast()`, `Notification.useNotification()` and `Modal.useModal()`.
- Set `semiGlobal.config` only at application startup. The server and client use the same config, and it does not change during rendering.
- Overlays open after hydration, and the server HTML has no overlay content. The "today" marker of Calendar and the DatePicker panel appears only after hydration. Pass `displayValue` to fix the date Calendar shows during server rendering.
- Dates format in the runtime time zone. When the server and browser time zones differ, unify them with `timeZone` on `ConfigProvider`, or the date text in the server HTML will not match hydration.
- In a Server Component, import flat exports (such as `Button`) and named exports such as `TypographyTitle` directly. Dot-notation subcomponents (such as `Typography.Title` and `Select.Option`) are `undefined` in a Server Component, so use them only in `'use client'` files.

### Documentation

Component docs are in [website/content](../../website/content). To get started, read [Getting Started](../../website/content/start/getting-started/index.en-US.mdx).

## Related packages

- Depends on `@fibrae/semi-foundation` (logic and styles), `@fibrae/semi-icons-react` and `@fibrae/semi-icons-react/illustrations`.
- Used by `@fibrae/semi-ai-react` and the docs site `website`.
- The UI package of each framework (`semi-ui-<framework>`) shares the same foundation.

## Development

`pnpm --filter @fibrae/semi-ui-react build` runs `vp pack`: the TS/TSX under `src` emits ESM and type declarations file by file into `dist`, along with component CSS and the full `styles.css` and `tailwind.css`. Type checks in this package read the types built in the foundation, so build it first.

For general commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令) at the repository root. For how to write components, see [components](../../.agents/references/react/components.md). For the bug fix process, see [fix-component-bug](../../.agents/skills/fix-component-bug/SKILL.md). For changes relative to upstream, see [release-notes](../../docs/release-notes.md). For the time zone contract of DatePicker and TimePicker, see [time-zone.md](../shared/semi-foundation/src/components/date-picker/time-zone.md).
