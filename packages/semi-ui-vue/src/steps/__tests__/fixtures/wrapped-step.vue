<script setup lang="ts">
    import { Step } from '../../index';

    defineProps<{ title: string }>();
</script>

<template>
    <Step>
        <template #title>{{ title }}</template>
    </Step>
</template>
