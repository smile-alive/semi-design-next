# @fibrae/semi-icons-solid

[English](README.md)

Semi Design Next 的 Solid 图标与插画组件，与其他框架的图标包共用 `@fibrae/semi-icons-core` 的数据和样式，供 Solid 应用和 `@fibrae/semi-ui-solid` 使用。

## 安装

```shell
pnpm add @fibrae/semi-icons-solid
```

peer 依赖：`solid-js`。`@fibrae/semi-icons-core` 是普通依赖，随包安装。仅发布 ESM。

## 使用

```tsx
import { IconSend } from '@fibrae/semi-icons-solid';

<IconSend size="large" spin />;
```

- 样式随组件引入，不需要单独引入。
- 单个图标没有自己的 props，所有属性透传给 `Icon`。`Icon` 的 props：`size`（`inherit`、`extra-small`、`small`、`default`、`large`、`extra-large`，默认 `default`）、`spin`、`rotate`、`prefixCls`、`type`、`fill`（`string` 或 `string[]`）。
- 多色图标的 `fill` 按顺序给各部分上色；其他图标把 `fill` 传给根 `svg`。
- 图标默认是装饰性的（`aria-hidden`）。传 `aria-label`、`aria-labelledby` 或 `tabIndex >= 0` 时改为 `role="img"` 且不隐藏。
- 自定义图标：默认导出的 `Icon` 通过 `svg` prop 接收 `svg` 节点。

### 彩色图标

```ts
import { IconAnchor } from '@fibrae/semi-icons-solid/lab';
```

### 插画

```tsx
import { IllustrationIdle, IllustrationIdleDark } from '@fibrae/semi-icons-solid/illustrations';
import { Empty } from '@fibrae/semi-ui-solid';

<Empty image={<IllustrationIdle style={{ width: '150px', height: '150px' }} />} darkModeImage={<IllustrationIdleDark style={{ width: '150px', height: '150px' }} />} />;
```

- 导出名为 `Illustration` 加插画名，暗色变体加 `Dark` 后缀。
- 每个插画是一个 `svg` 组件，属性透传给根 `svg`，默认宽高 200，默认装饰性（`aria-hidden`）。
- 渐变、mask、clipPath 的 id 按实例生成，同页多个实例互不影响。
- 配色使用 `var(--semi-color-*)`，页面需要已加载 Semi 主题样式（由 `semi-ui-solid` 的样式提供）。

### 入口

| 入口                                              | 内容                                                         |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `@fibrae/semi-icons-solid`                        | 默认导出 `Icon`，具名导出 `IconXxx`、类型 `IconProps` 等     |
| `@fibrae/semi-icons-solid/lab`                    | 彩色图标                                                     |
| `@fibrae/semi-icons-solid/illustrations`          | 插画 `IllustrationXxx` 与 `IllustrationXxxDark`              |
| `@fibrae/semi-icons-solid/components/create-icon` | `createSvgComponent`，把图标或插画数据渲染成不带外壳的 `svg` |

每个入口有 DOM 版与 `solid` 条件下保留 JSX 的版本，说明见 [@fibrae/semi-ui-solid](../semi-ui-solid/README.zh-CN.md#入口)。

组件文档见 [website/content/basic/icon](../../website/content/basic/icon) 与 [website/content/show/empty](../../website/content/show/empty)。

## 与其他包的关系

- 依赖 `@fibrae/semi-icons-core` 的图标与插画数据、图标样式。
- 被 `@fibrae/semi-ui-solid` 与 `@fibrae/semi-ai-solid` 使用。
- 各框架的对应包是 `@fibrae/semi-icons-<框架>`。

## 开发

- `src/icons`、`src/lab`、`src/illustrations` 整个目录是生成源码，不要手改。新增图标或插画按 semi-icons-core 的[「新增图标」](../shared/semi-icons-core/README.zh-CN.md#新增图标)或[「新增插画」](../shared/semi-icons-core/README.zh-CN.md#新增插画)操作，在仓库根目录运行 `pnpm build:icon` 重新生成。
- 构建与测试命令见根目录 [CONTRIBUTING.md](../../CONTRIBUTING.md#常用命令)。
