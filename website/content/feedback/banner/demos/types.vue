<script setup lang="ts">
    import { Banner } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Banner type="info">
        <template #description>Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码</template>
    </Banner>
    <br />
    <Banner type="warning">
        <template #description>当前使用 Figma UI Kit 为旧版，可能无法支持完整的 Design to code 能力</template>
    </Banner>
    <br />
    <Banner type="danger">
        <template #description>当前使用 API 已过期，请尽快升级</template>
    </Banner>
    <br />
    <Banner type="success">
        <template #description>Semi DSM, Make Semi Design to Any Design</template>
    </Banner>
</template>
