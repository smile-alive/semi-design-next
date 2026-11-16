<script setup lang="ts">
    import { Step } from '../../index';

    const props = defineProps<{ title: string }>();
</script>

<template>
    <Step>
        <template #title>{{ props.title }}</template>
    </Step>
</template>
