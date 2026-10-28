<script setup lang="ts">
    import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-vue';
    import { Empty } from '@fibrae/semi-ui-vue';

    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <Empty title="功能建设中">
        <template #image>
            <IllustrationConstruction :style="imageStyle" />
        </template>
        <template #darkModeImage>
            <IllustrationConstructionDark :style="imageStyle" />
        </template>
        <template #description>当前功能暂未开放，敬请期待。</template>
    </Empty>
</template>
