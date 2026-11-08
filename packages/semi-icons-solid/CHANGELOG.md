# @fibrae/semi-icons-solid

## 0.5.0

### Minor Changes

- 26c215d: 插画并入图标包，不再发布 `@fibrae/semi-illustrations-*`：`@fibrae/semi-illustrations-<框架>` 改为 `@fibrae/semi-icons-<框架>/illustrations`，单个插画为 `@fibrae/semi-icons-<框架>/illustrations/illustration-<name>`，导出名不变。主题编译核心并入 `@fibrae/semi-scss-compile/core`。

### Patch Changes

- @fibrae/semi-icons-core@0.5.0

## 0.4.0

### Minor Changes

- 58996a3: 深路径调整（破坏性），包入口的导出不变。foundation 的组件目录移入 `components/`，如 `@fibrae/semi-foundation/button/button.scss` 改为 `@fibrae/semi-foundation/components/button/button.scss`；UI 与 AI 包的组件深路径不变，`_base/*`、`_utils/*` 等子路径改为 `base/*`、`utils/*` 与各框架的 hook 目录，AI 组件的子组件移入 `widgets/`；单个图标与插画的深路径改为导出名的 kebab-case，如 `@fibrae/semi-icons-react/icons/IconHome` 改为 `@fibrae/semi-icons-react/icons/icon-home`、`@fibrae/semi-illustrations-react/IllustrationNoContent` 改为 `@fibrae/semi-illustrations-react/illustration-no-content`；`@fibrae/semi-animation/styles/viewTransition.css` 改为 `@fibrae/semi-animation/styles/view-transition.css`。完整列表见 `docs/release-notes.md`。

### Patch Changes

- Updated dependencies [58996a3]
    - @fibrae/semi-icons-core@0.4.0

## 0.3.1

### Patch Changes

- @fibrae/semi-icons-core@0.3.1

## 0.3.0

### Patch Changes

- @fibrae/semi-icons-core@0.3.0

## 0.2.0

### Patch Changes

- @fibrae/semi-icons-core@0.2.0

## 0.1.1

### Patch Changes

- 65273a5: 补充 Solid 各包的 README；npm 发布附带 provenance。
- @fibrae/semi-icons-core@0.1.1
