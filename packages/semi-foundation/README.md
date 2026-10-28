# @fibrae/semi-foundation

Semi Design Next 中与框架无关的部分：组件逻辑（Foundation）、SCSS 样式、主题 token 和语言包。各框架的组件库共用它，使用方通常不直接依赖，而是经 UI 包间接使用。

## Foundation 与 Adapter

每个组件的 JavaScript 分成两部分，以便在不同框架间复用：

- Foundation：承载组件的业务逻辑，不引用任何 DOM。需要操作 DOM 的逻辑，委托给 Adapter。
- Adapter：Foundation 所需方法的接口，由各框架包用本框架的原生机制实现（如 React 的 hook、Vue 的 composable）。

因此本包不依赖任何框架和 UI 包。

## 安装

```sh
pnpm add @fibrae/semi-foundation
```

构建插件解析 `semi:` 地址时需要它，UI 包已把它作为依赖。

## 使用

本包没有根入口，只提供逐文件的深路径，与 `src/` 下的目录一一对应，同时提供类型声明：

```ts
import BaseFoundation from '@fibrae/semi-foundation/base/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { utcToZonedTime } from '@fibrae/semi-foundation/utils/date-fns-extra';
```

`exports` 还包含 `./*.css` 与 `./*.scss`：组件 CSS 是 `vp pack` 编译的产物；发布的 `.scss` 含有 `semi:` 地址，不能直接用 Sass 编译，需要经构建插件或 `@fibrae/semi-scss-compile`。

## 目录

`src/` 下每个组件一个目录，按需包含 `foundation.ts`、`constants.ts` 与 `*.scss`（`variables.scss`、`mixin.scss`、`rtl.scss` 等只按源文件发布）。公共目录：

| 目录      | 内容                                                                |
| --------- | ------------------------------------------------------------------- |
| `base/`   | `BaseFoundation` 与通用常量                                         |
| `theme/`  | 唯一的主题：全局 token、色板、mixin，组件 SCSS 经 `semi:theme` 加载 |
| `locale/` | 语言包与 `Locale` 类型                                              |
| `utils/`  | 焦点、层栈、日期、DOM 等工具                                        |

## 语言包

`src/locale/source/` 下有 57 个语言包，每个文件默认导出一个 `Locale`，类型在 `src/locale/interface.ts`：

- `code`：语言代码。
- `dateFnsLocale`：格式化和解析日期时使用的 date-fns locale 对象。
- `currency`：ISO 4217 货币代码，InputNumber 传给 `Intl.NumberFormat`。
- 其余键按组件分组，是组件的内置文案和可访问名称。含 `${名字}` 的值是占位符，翻译时不要替换占位符本身。

使用时把语言包传给 UI 包的 `LocaleProvider`：

```tsx
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import { LocaleProvider } from '@fibrae/semi-ui-react';

<LocaleProvider locale={en_GB}>
    <App />
</LocaleProvider>;
```

Vue 包的 `LocaleProvider` 同名，通过 `:locale` 传入。新增文案或可访问名称、补齐全部语言包的步骤见 [locale-text](../../.agents/skills/locale-text/SKILL.md)。

## 与其他包的关系

- 依赖 `@fibrae/semi-json-viewer-core`；Markdown、MDX、Lottie 与代码高亮等与框架无关的渲染逻辑也在本包。
- 被各框架的 UI 包、`@fibrae/semi-ai-foundation` 及 AI 组件包使用。

## 开发

`pnpm --filter @fibrae/semi-foundation build` 执行 `vp pack`：`src/**/*.ts` 逐文件输出 ESM 与类型声明，组件 SCSS 编译为 CSS，主题 token 编译进 `base/tokens.css`。各框架 UI 包的类型检查读取这里已构建的类型。

通用命令见根目录 [README.md](../../README.md#常用命令)。样式写法、`semi:` importer 与主题 token 协议见 [styles](../../.agents/references/styles.md) 的「组件 SCSS」「Sass 模块与 semi: importer」「主题 token 协议」等节。
