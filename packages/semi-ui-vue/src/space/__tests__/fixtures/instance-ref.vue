<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Space from '../../space.vue';

    const emit = defineEmits<{ el: [el: Element] }>();
    const space = useTemplateRef('space');
    onMounted(() => emit('el', space.value?.$el));
</script>

<template>
    <Space ref="space" />
</template>
