<script setup lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Checkbox aria-label="Checkbox 示例">
        Semi Design
        <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
    </Checkbox>
    <br />
    <Checkbox aria-label="Checkbox 示例" style="width: 280px">
        Semi Design
        <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
    </Checkbox>
</template>
