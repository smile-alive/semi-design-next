# @fibrae/semi-illustrations-react

Semi Design Next 的 React 插画组件，包括 Construction、Failure、Idle、NoAccess、NoContent、NoResult、NotFound、Success 等，每组有普通与 `Dark` 两个变体，常配合 `@fibrae/semi-ui-react` 的 `Empty` 使用。

## 安装

```shell
pnpm add @fibrae/semi-illustrations-react
```

peer 依赖：`react`。`@fibrae/semi-icons-core` 与 `@fibrae/semi-icons-react` 是普通依赖，随包安装。仅发布 ESM。

## 使用

```tsx
import { IllustrationIdle } from '@fibrae/semi-illustrations-react';

createRoot(container).render(<IllustrationIdle style={{ width: 150, height: 150 }} />);
```

- 导出名为 `Illustration` 加插画名，暗色变体加 `Dark` 后缀，如 `IllustrationIdleDark`。
- 每个插画是一个 `svg` 组件，props 为 `SVGProps<SVGSVGElement>`，默认宽高 200，默认装饰性（`aria-hidden`）。
- 渐变、mask、clipPath 的 id 按实例生成，同页多个实例互不影响。
- 配色使用 `var(--semi-color-*)`，页面需要已加载 Semi 主题样式（由 `semi-ui-react` 的样式提供），本包自身不含样式。

### 配合 Empty

```tsx
import { IllustrationIdle, IllustrationIdleDark } from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

createRoot(container).render(<Empty image={<IllustrationIdle />} darkModeImage={<IllustrationIdleDark />} />);
```

组件文档见 [website/content/show/empty](../../website/content/show/empty)。

## 与其他包的关系

- 依赖 `@fibrae/semi-icons-react` 的 `createSvgComponent`。
- 插画数据来自 `@fibrae/semi-icons-core/illustrations`，各框架的插画包读取同一份。
- Vue 对应包是 `@fibrae/semi-illustrations-vue`。

## 开发

- `src/illustrations` 是生成源码，不要手改。插画 SVG 在 `semi-icons-core` 的 `svgs/illustrations`，见 [semi-icons-core](../semi-icons-core/README.md#新增插画)；修改后在仓库根目录运行 `pnpm build:icon`，会同时更新各框架的插画包。
- 构建与测试命令见根目录 [README.md](../../README.md#常用命令)。
