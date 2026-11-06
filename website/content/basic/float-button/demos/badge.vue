<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <span>带徽章：页面右下第二列</span>
    <FloatButton aria-label="AI 编辑" :badge="{ dot: true, type: 'danger' }" disabled style="inset-block-end: 270px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑，999+" :badge="{ count: 1000, overflowCount: 999 }" size="large" style="inset-block-end: 210px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑" :badge="{ dot: true }" colorful style="inset-block-end: 170px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑，VIP" :badge="{ count: 'VIP', type: 'danger' }" colorful size="large" style="inset-block-end: 110px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
