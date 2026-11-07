<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import type { ToastHandle } from '../../interface';
    import ToastItem from '../../toast.vue';

    const props = defineProps<{ onHandle: (handle: ToastHandle) => void }>();
    const emit = defineEmits<{ remove: [id: string] }>();
    const item = useTemplateRef<ToastHandle>('item');
    onMounted(() => {
        if (item.value) props.onHandle(item.value);
    });
</script>

<template>
    <ToastItem id="r" ref="item" content="ref" :duration="1" @remove="emit('remove', $event)" />
</template>
