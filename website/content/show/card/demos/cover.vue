<script setup lang="ts">
    import { Card, CardMeta } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card :style="{ maxWidth: '300px' }">
        <template #cover>
            <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo2.jpeg" />
        </template>
        <CardMeta title="卡片封面" />
    </Card>
</template>
