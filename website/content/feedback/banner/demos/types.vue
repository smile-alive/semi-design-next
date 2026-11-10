<script setup lang="ts">
    import { Banner } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Banner type="info">
        <template #description>一套组件，四个框架原生可用，随时查阅对应的前端代码</template>
    </Banner>
    <br />
    <Banner type="warning">
        <template #description>当前使用的 UI Kit 为旧版，可能无法支持完整的组件能力</template>
    </Banner>
    <br />
    <Banner type="danger">
        <template #description>当前使用 API 已过期，请尽快升级</template>
    </Banner>
    <br />
    <Banner type="success">
        <template #description>Semi Design Next themes through --semi-* variables</template>
    </Banner>
</template>
