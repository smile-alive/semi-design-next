<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <span>带徽章：页面右下第二列</span>
    <FloatButton aria-label="AI 编辑" :badge="{ dot: true, type: 'danger' }" disabled style="bottom: 270px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑，999+" :badge="{ count: 1000, overflowCount: 999 }" size="large" style="bottom: 210px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑" :badge="{ dot: true }" colorful style="bottom: 170px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
    <FloatButton aria-label="AI 编辑，VIP" :badge="{ count: 'VIP', type: 'danger' }" colorful size="large" style="bottom: 110px; inset-inline-end: 100px">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
