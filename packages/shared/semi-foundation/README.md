# @fibrae/semi-foundation

[简体中文](README.zh-CN.md)

The framework-agnostic part of Semi Design Next: component logic (Foundation), SCSS styles, theme tokens and locale packs. The component libraries of every framework share it. Applications usually use it through a UI package rather than depending on it directly.

## Foundation and Adapter

The JavaScript of each component has two parts so it can be reused across frameworks:

- Foundation: holds the component's business logic and references no DOM. Logic that needs the DOM is delegated to the Adapter.
- Adapter: the interface of the methods a Foundation needs, implemented by each framework package with its native mechanism (such as a React hook or a Vue composable).

This is why the package depends on no framework or UI package.

## Installation

```sh
pnpm add @fibrae/semi-foundation
```

Build plugins need it to resolve `semi:` addresses, and the UI packages already depend on it.

## Usage

This package has no root entry. It offers only deep file paths, which map one-to-one to the directories under `src/` and come with type declarations:

```ts
import BaseFoundation from '@fibrae/semi-foundation/base/foundation';
import InputFoundation from '@fibrae/semi-foundation/components/input/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { utcToZonedTime } from '@fibrae/semi-foundation/utils/date-fns-extra';
```

`exports` also includes `./*.css` and `./*.scss`. The component CSS is compiled by `vp pack`. The published `.scss` contains `semi:` addresses and cannot be compiled by Sass directly; it goes through a build plugin or `@fibrae/semi-scss-compile`.

## Directories

| Directory     | Contents                                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/` | One directory per component, containing `foundation.ts`, `constants.ts` and `*.scss` as needed (`variables.scss`, `mixin.scss`, `rtl.scss` and similar ship only as source) |
| `base/`       | `BaseFoundation`, common constants and the stateful classes a foundation composes (focus scope, popup lifecycle, modal resources and similar)                               |
| `utils/`      | Stateless utilities: DOM, date, focus helpers, layer stack and similar                                                                                                      |
| `theme/`      | The one theme: global tokens, palettes and mixins, loaded by component SCSS through `semi:theme`                                                                            |
| `locale/`     | Locale packs and the `Locale` type                                                                                                                                          |

## Locale packs

`src/locale/source/` holds 57 locale packs. Each file default-exports a `Locale`, whose type is in `src/locale/interface.ts`:

- `code`: the language code.
- `dateFnsLocale`: the date-fns locale object used to format and parse dates.
- `currency`: the ISO 4217 currency code, passed by InputNumber to `Intl.NumberFormat`.
- The other keys are grouped by component and hold built-in text and accessible names. Values with `${name}` are placeholders; do not translate the placeholder itself.

To use a pack, pass it to the UI package's `LocaleProvider`:

```tsx
import { LocaleProvider } from '@fibrae/semi-ui-react';
import en_GB from '@fibrae/semi-ui-react/locale/source/en_GB';

<LocaleProvider locale={en_GB}>
    <App />
</LocaleProvider>;
```

The Vue package's `LocaleProvider` has the same name and takes `:locale`. For adding text or accessible names and filling in every locale pack, see [locale-text](../../../.agents/skills/locale-text/SKILL.md).

## Related packages

- Depends on `@fibrae/semi-json-viewer-core`. Framework-agnostic rendering logic for Markdown, MDX, Lottie and code highlighting also lives here.
- Used by the UI package of each framework, `@fibrae/semi-ai-foundation` and the AI component packages.

## Development

`pnpm --filter @fibrae/semi-foundation build` runs `vp pack`: `src/**/*.ts` emits ESM and type declarations file by file, component SCSS compiles to CSS, and theme tokens compile into `base/tokens.css`. Type checks in the UI packages read the types built here.

For general commands, see [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令) at the repository root. For how to write styles, the `semi:` importer and the theme token protocol, see the 「组件 SCSS」, 「Sass 模块与 semi: importer」 and 「主题 token 协议」 sections of [styles](../../../.agents/references/styles.md).
