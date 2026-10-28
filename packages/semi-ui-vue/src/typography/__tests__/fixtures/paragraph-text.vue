<script setup lang="ts">
    import Paragraph from '../../paragraph.vue';

    withDefaults(defineProps<{ text: string; tick?: number }>(), { tick: 0 });
</script>

<template>
    <Paragraph :data-tick="tick">{{ text }}</Paragraph>
</template>
