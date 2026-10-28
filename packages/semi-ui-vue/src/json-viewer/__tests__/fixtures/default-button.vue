<script setup lang="ts">
    import JsonViewer from '../..';
</script>

<template>
    <JsonViewer modelValue="1">
        <template #searchButton="{ defaultButton }">
            <component :is="defaultButton" />
        </template>
    </JsonViewer>
</template>
