---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ai-foundation': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ai-react': minor
'@fibrae/semi-ai-vue': minor
'@fibrae/semi-ai-solid': minor
'@fibrae/semi-ai-svelte': minor
'@fibrae/semi-icons-core': minor
'@fibrae/semi-icons-react': minor
'@fibrae/semi-icons-vue': minor
'@fibrae/semi-icons-solid': minor
'@fibrae/semi-icons-svelte': minor
'@fibrae/semi-illustrations-react': minor
'@fibrae/semi-illustrations-vue': minor
'@fibrae/semi-illustrations-solid': minor
'@fibrae/semi-illustrations-svelte': minor
'@fibrae/semi-animation': minor
---

深路径调整（破坏性），包入口的导出不变。foundation 的组件目录移入 `components/`，如 `@fibrae/semi-foundation/button/button.scss` 改为 `@fibrae/semi-foundation/components/button/button.scss`；UI 与 AI 包的组件深路径不变，`_base/*`、`_utils/*` 等子路径改为 `base/*`、`utils/*` 与各框架的 hook 目录，AI 组件的子组件移入 `widgets/`；单个图标与插画的深路径改为导出名的 kebab-case，如 `@fibrae/semi-icons-react/icons/IconHome` 改为 `@fibrae/semi-icons-react/icons/icon-home`、`@fibrae/semi-illustrations-react/IllustrationNoContent` 改为 `@fibrae/semi-illustrations-react/illustration-no-content`；`@fibrae/semi-animation/styles/viewTransition.css` 改为 `@fibrae/semi-animation/styles/view-transition.css`。完整列表见 `docs/release-notes.md`。
