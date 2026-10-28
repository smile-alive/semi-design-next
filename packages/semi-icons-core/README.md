# @fibrae/semi-icons-core

Semi Design Next 的图标与插画数据、图标样式，与框架无关。各框架的图标包（`semi-icons-<框架>`）和插画包（`semi-illustrations-<框架>`）都读取这里的数据；需要自行渲染图标的使用者也可以直接使用。

## 安装

```shell
pnpm add @fibrae/semi-icons-core
```

仅发布 ESM，没有 peer 依赖。

## 使用

每个图标是一个 ESM 模块，导出 `IconData`，导出名与各框架的图标组件同名：

```ts
import { IconActivity } from '@fibrae/semi-icons-core';
import { IconAvatar } from '@fibrae/semi-icons-core/lab'; // 保留原色的彩色图标

IconActivity;
// {
//     name: 'activity', // 图标 type，渲染为 `semi-icon-activity` 类
//     attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
//     children: [['path', { 'fill-rule': 'evenodd', 'clip-rule': 'evenodd', d: '...', fill: 'currentColor' }]],
// }
```

- 节点是 `[tag, attrs, children?]`。属性名用 DOM 名（`fill-rule`、`class`，`style` 为字符串），框架可以原样透传，或映射一次（React 为 `fillRule`、`className` 和 style 对象）。
- 渲染时给根 `svg` 加上 `defaultAttrs`：`width` 与 `height` 为 `1em`，`focusable="false"`，`aria-hidden="true"`。
- 多色图标（`IconAI*Level2`、`IconAI*Level3`、`IconAILoading`）带 `fills`，表示由 `fill` 属性提供的颜色个数。属性值里有占位符：`{fillN}` 是 `getFillColor(fill, fills)` 的第 N 个颜色，`{uid}` 是每个渲染实例唯一的 id。用 `resolveValue(value, colors, uid)` 替换。其他图标把 `fill` 直接传给根 `svg`。

### 子路径入口

| 入口                                        | 内容                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@fibrae/semi-icons-core`                   | 全部 `IconXxx` 数据、类型 `IconData`、`IconNode`，工具 `defaultAttrs`、`getFillColor`、`resolveValue` |
| `@fibrae/semi-icons-core/lab`               | 保留原色的彩色图标数据                                                                                |
| `@fibrae/semi-icons-core/illustrations`     | 插画数据 `IllustrationXxx`，保留原色与默认宽高 200                                                    |
| `@fibrae/semi-icons-core/styles/icons.scss` | 图标样式，也提供编译后的 `.css`                                                                       |
| `@fibrae/semi-icons-core/*`                 | 其余深路径，如 `/utils`、`/types`                                                                     |

样式定义 `.{prefix}-icon`、`-extra-small`、`-small`、`-default`、`-large`、`-extra-large`、`-spinning` 及旋转动画，依赖 `semi:theme` 的 `$prefix`。各框架的图标包已自行引入，直接使用 core 时需要自己引入。

## 与其他包的关系

- 不依赖其他 Semi 包。
- 被各框架的图标包和插画包使用。

## 新增图标

- 单色图标：新增 `svgs/icons/<name>.svg`，并在 `svgs/icons/meta.json` 加条目（`category` 是图标页的分组名，沿用已有值，如 `Basic`、`Arrow`、`Interface`；AI 图标按颜色层级用 `One Color`、`Two Color`、`Multiple Color`）。颜色会转为 `currentColor`。
- 彩色图标：新增 `svgs/lab/<name>.svg`，并在 `svgs/lab/meta.json` 加条目。颜色保持原样。
- 文件名即图标 type，导出名是 `Icon` 加 PascalCase（`ai_` 变为 `AI`）。
- SVG 源文件里的 id 不手写 `{uid}`，生成器统一加前缀，渲染时按实例替换。
- 在仓库根目录运行 `pnpm build:icon`：先在本包写出 `src/icons`、`src/lab/icons` 与 `src/illustrations/icons`（`scripts/build-icon.ts`，svgo 使用固定配置以保持路径数据稳定），再依次生成各框架的图标与插画组件。不要手改生成文件。
- 运行 `pnpm site:dev`，打开[图标文档页](../../website/content/basic/icon)检查新图标。

## 新增插画

- 新增 `svgs/illustrations/<name>.svg`，暗色变体命名为 `<name>-dark.svg`。颜色与 `width`、`height` 保持原样，配色用 `var(--semi-color-*)`。
- 导出名是 `Illustration` 加 PascalCase，如 `noContent-dark` 为 `IllustrationNoContentDark`。
- id 同样不手写 `{uid}`；运行 `pnpm build:icon` 生成 `src/illustrations/icons` 与各框架的插画组件。

## 开发

- 构建：`vp pack`；通用命令见根目录 [README.md](../../README.md#常用命令)。
- 测试：`__tests__/data.test.ts` 检查所有图标与插画的 id 与引用。
