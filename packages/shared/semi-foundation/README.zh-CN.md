# @fibrae/semi-foundation

[English](README.md)

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
import InputFoundation from '@fibrae/semi-foundation/components/input/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { utcToZonedTime } from '@fibrae/semi-foundation/utils/date-fns-extra';
```

`exports` 还包含 `./*.css` 与 `./*.scss`：组件 CSS 是 `vp pack` 编译的产物；发布的 `.scss` 含有 `semi:` 地址，不能直接用 Sass 编译，需要经构建插件或 `@fibrae/semi-scss-compile`。

## 目录

| 目录          | 内容                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `components/` | 每个组件一个目录，按需包含 `foundation.ts`、`constants.ts` 与 `*.scss`（`variables.scss`、`mixin.scss`、`rtl.scss` 等只按源文件发布） |
| `base/`       | `BaseFoundation`、通用常量，以及 foundation 组合使用的有状态类（焦点范围、弹层生命周期、模态资源等）                                  |
| `utils/`      | 无状态工具：DOM、日期、焦点辅助、层栈等                                                                                               |
| `theme/`      | 唯一的主题：全局 token、色板、mixin，组件 SCSS 经 `semi:theme` 加载                                                                   |
| `locale/`     | 语言包、`Locale` 与 `LocaleInput` 类型，以及各框架共用的语言解析                                                                      |

## 语言包

`src/locale/source/` 下有 `zh_CN`、`en_US` 两个内置语言包，每个文件默认导出一个 `Locale`，类型在 `src/locale/interface.ts`：

- `code`：语言代码。日期组件按它取 date-fns locale（`src/utils/date-fns-locale.ts` 只内置 zh-CN、en-US，其余由 ConfigProvider 的 `dateFnsLocale` 传入）。
- `currency`：ISO 4217 货币代码，InputNumber 传给 `Intl.NumberFormat`。
- 其余键按组件分组，是组件的内置文案和可访问名称。含 `${名字}` 的值是占位符，翻译时不要替换占位符本身。

各 UI 包的包根入口导出 `zh_CN`、`en_US`，传给 UI 包的 `LocaleProvider` 或 `ConfigProvider`：

```tsx
import { en_US, LocaleProvider } from '@fibrae/semi-ui-react';

<LocaleProvider locale={en_US}>
    <App />
</LocaleProvider>;
```

两个 provider 也接受 `LocaleInput` 类型的自定义语言包：只有 `code` 必填，没写的文案和 `currency` 取 `en_US`。`src/locale/resolve-locale.ts` 对同一个语言包对象只补齐一次并复用结果，所以语言包只创建一次（放在模块顶层或做 memo），要改就换一个新对象，不要原地修改。

Vue 包的 `LocaleProvider` 同名，通过 `:locale` 传入。给两个内置语言包新增文案或可访问名称的步骤见 [locale-text](../../../.agents/skills/locale-text/SKILL.md)。

## 与其他包的关系

- 依赖 `@fibrae/semi-json-viewer-core`；Markdown、MDX、Lottie 与代码高亮等与框架无关的渲染逻辑也在本包。
- 被各框架的 UI 包、`@fibrae/semi-ai-foundation` 及 AI 组件包使用。

## 开发

`pnpm --filter @fibrae/semi-foundation build` 执行 `vp pack`：`src/**/*.ts` 逐文件输出 ESM 与类型声明，组件 SCSS 编译为 CSS，主题 token 编译进 `base/tokens.css`。各框架 UI 包的类型检查读取这里已构建的类型。

通用命令见根目录 [CONTRIBUTING.md](../../../CONTRIBUTING.md#常用命令)。样式写法、`semi:` importer 与主题 token 协议见 [styles](../../../.agents/references/styles.md) 的「组件 SCSS」「Sass 模块与 semi: importer」「主题 token 协议」等节。
