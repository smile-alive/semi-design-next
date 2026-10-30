# @fibrae/semi-icons-react

Semi Design Next 的 React 图标组件，含单色图标与彩色 lab 图标，供 React 应用和 `@fibrae/semi-ui-react` 使用。

## 安装

```shell
pnpm add @fibrae/semi-icons-react
```

peer 依赖：`react`。`@fibrae/semi-icons-core` 是普通依赖，随包安装。仅发布 ESM。

## 使用

```tsx
import { createRoot } from 'react-dom/client';
import { IconSend } from '@fibrae/semi-icons-react';

createRoot(container).render(<IconSend size="large" />);
```

- 样式随组件引入，不需要单独引入。
- `IconProps` 继承 `span` 的 HTML 属性，另有必填的 `svg`（`ReactNode`）和可选的 `size`（`inherit`、`extra-small`、`small`、`default`、`large`、`extra-large`，默认 `default`）、`spin`、`rotate`、`prefixCls`、`type`、`fill`（`string` 或 `string[]`）。
- 多色图标的 `fill` 按顺序给各部分上色；其他图标把 `fill` 传给根 `svg`。
- 图标默认是装饰性的（`aria-hidden`）。传 `aria-label`、`aria-labelledby` 或 `tabIndex >= 0` 时改为 `role="img"` 且不隐藏。

### 彩色图标

lab 图标保留自身颜色，不随文字颜色变化：

```tsx
import { IconAnchor } from '@fibrae/semi-icons-react/lab';
```

### 自定义图标

`Icon` 是默认导出，图形通过 `svg` 传入，如 `<Icon svg={<MySvg />} size="large" />`；`convertIcon(Svg, iconType)` 把自带的 svg 组件包成内置图标的形态，二者都带 `elementType: 'Icon'`，供 `semi-ui-react` 识别。

| 入口                                              | 内容                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `@fibrae/semi-icons-react`                        | 默认导出 `Icon`，具名导出 `IconXxx`、`convertIcon`、`IconProps`、`IconSize` |
| `@fibrae/semi-icons-react/lab`                    | 彩色图标                                                                    |
| `@fibrae/semi-icons-react/components/create-icon` | `createSvgComponent`，供插画包使用                                          |

组件文档见 [website/content/basic/icon](../../website/content/basic/icon)。

## 与其他包的关系

- 依赖 `@fibrae/semi-icons-core` 的图标数据与样式。
- 被 `@fibrae/semi-ui-react` 与 `@fibrae/semi-illustrations-react` 使用。
- Vue 对应包是 `@fibrae/semi-icons-vue`。

## 开发

- `src/icons`、`src/lab` 整个目录是生成源码，不要手改：每个模块把一个图标的数据交给 `createIcon`（`src/components/create-icon.ts`），渲染成 `Icon` 内的 `svg`。
- 新增图标：按 [semi-icons-core 的「新增图标」](../semi-icons-core/README.md#新增图标)添加 SVG，在仓库根目录运行 `pnpm build:icon` 重新生成本包组件，再用 `pnpm site:dev` 打开图标页检查。
- 构建与测试命令见根目录 [README.md](../../README.md#常用命令)。
