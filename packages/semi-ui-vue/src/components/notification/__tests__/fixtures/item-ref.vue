<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import type { NoticeHandle } from '../../interface';
    import Notice from '../../notice.vue';

    const props = defineProps<{ onHandle: (handle: NoticeHandle) => void }>();
    const emit = defineEmits<{ remove: [id: string] }>();
    const item = useTemplateRef<NoticeHandle>('item');
    onMounted(() => {
        if (item.value) props.onHandle(item.value);
    });
</script>

<template>
    <Notice id="r" ref="item" content="ref" :duration="1" placement="topRight" @remove="emit('remove', $event)" />
</template>
