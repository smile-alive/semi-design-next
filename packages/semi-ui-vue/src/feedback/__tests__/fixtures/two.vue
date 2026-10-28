<script setup lang="ts">
    import Feedback from '../../feedback.vue';

    const emit = defineEmits<{ first: [value: unknown]; second: [value: unknown] }>();
</script>

<template>
    <Feedback title="First" visible @valueChange="emit('first', $event)" />
    <Feedback title="Second" visible @valueChange="emit('second', $event)" />
</template>
