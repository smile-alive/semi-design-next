<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Checkbox from '../..';

    const emit = defineEmits<{ confirm: [] }>();
    const confirm = useTemplateRef<HTMLButtonElement>('confirm');
</script>

<template>
    <Checkbox @change="confirm?.focus()">agree</Checkbox>
    <button ref="confirm" type="button" @click="emit('confirm')">confirm</button>
</template>
