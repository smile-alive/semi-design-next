<script setup lang="ts">
    import Checkbox from '../..';
    import type { CheckboxEvent } from '../../interface';

    const emit = defineEmits<{ change: [event: CheckboxEvent]; submit: [] }>();
</script>

<template>
    <form @submit.prevent="emit('submit')">
        <Checkbox @change="emit('change', $event)">agree</Checkbox>
        <button type="submit">submit</button>
    </form>
</template>
