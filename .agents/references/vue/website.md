# Vue 文档站

共享规则见 [website](../website.md)。

- Vue 路由随该页全部 demo 迁移完成而启用。
- Vue demo 使用 SFC（`demos/<id>.vue`），`<script setup lang="ts">`，`website/tsconfig.vue.json` 经 vue-tsc 检查。
- Vue API 的说明写在 `api.vue.json`，`gen-vue-api.ts` 从直接组件定义提取类型，生成的双语片段只由生成命令更新；缺说明或过时说明都报错。
- 基线回落：Vue 页面缺少基线时回落到 React 的基线（见 [check-pages](../../skills/check-pages/SKILL.md)）。
