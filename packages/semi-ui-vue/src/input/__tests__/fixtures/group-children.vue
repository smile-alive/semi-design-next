<script setup lang="ts">
    import Input, { InputGroup } from '../..';

    defineProps<{ keys: string[] }>();
</script>

<template>
    <InputGroup data-group="1">
        <Input v-for="key in keys" :key="key" :aria-label="key" />-{{ 2 }}
        <Input v-if="false" aria-label="hidden" />
        <Input aria-label="last" />
    </InputGroup>
</template>
