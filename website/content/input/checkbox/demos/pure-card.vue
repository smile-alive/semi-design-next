<script setup lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" :defaultValue="['1', '3']" direction="vertical" type="pureCard">
        <Checkbox disabled style="width: 280px" value="1">
            单选框标题
            <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
        </Checkbox>
        <Checkbox disabled style="width: 280px" value="2">
            单选框标题
            <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
        </Checkbox>
        <Checkbox style="width: 280px" value="3">
            单选框标题
            <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
        </Checkbox>
        <Checkbox style="width: 280px" value="4">
            单选框标题
            <template #extra>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用</template>
        </Checkbox>
    </CheckboxGroup>
</template>
