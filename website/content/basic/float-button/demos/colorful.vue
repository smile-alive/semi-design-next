<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <span>多彩按钮：页面右下第一列</span>
    <FloatButton aria-label="访问 Semi 官网" colorful href="https://semi.design" rel="noopener noreferrer" style="bottom: 110px; inset-inline-end: 150px" target="_blank">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
