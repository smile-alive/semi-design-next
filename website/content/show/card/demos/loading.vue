<script setup lang="ts">
    import { ref } from 'vue';
    import { Card, CardMeta, Switch } from '@fibrae/semi-ui-vue';

    const loading = ref(true);
</script>

<template>
    <Switch aria-label="显示内容" @change="(v) => (loading = !v)" />
    <br />
    <br />
    <Card :loading="loading" :style="{ maxWidth: '360px' }">
        <CardMeta title="Semi Doc">
            <template #description>全面、易用、优质</template>
        </CardMeta>
    </Card>
</template>
