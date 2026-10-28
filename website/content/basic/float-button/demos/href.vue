<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <span>点击跳转：页面右下第三列 4</span>
    <FloatButton aria-label="访问 Semi 官网" href="https://semi.design" rel="noopener noreferrer" style="bottom: 100px" target="_blank">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
