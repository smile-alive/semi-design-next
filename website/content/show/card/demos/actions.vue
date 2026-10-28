<script setup lang="ts">
    import { Card, CardMeta, Rating } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card :headerLine="false" :style="{ maxWidth: '300px' }">
        <template #cover>
            <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
        </template>
        <template #actions>
            <Rating :defaultValue="4" size="small" />
        </template>
        <CardMeta title="Semi Doc">
            <template #description>全面、易用、优质</template>
        </CardMeta>
    </Card>
</template>
