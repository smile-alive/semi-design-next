<script setup lang="ts">
    import Input, { InputGroup } from '../..';

    const props = defineProps<{ keys: string[] }>();
</script>

<template>
    <InputGroup>
        <Input v-for="key in props.keys" :key="key" :aria-label="key" />-{{ 2 }}
        <Input v-if="false" aria-label="hidden" />
        <Input aria-label="last" />
    </InputGroup>
</template>
