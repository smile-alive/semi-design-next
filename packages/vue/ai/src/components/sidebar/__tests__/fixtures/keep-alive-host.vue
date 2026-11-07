<script setup lang="ts">
    import Sidebar from '../..';

    const props = defineProps<{ shown: boolean }>();
    const emit = defineEmits<{ cancel: [event: MouseEvent | KeyboardEvent] }>();
</script>

<template>
    <KeepAlive>
        <Sidebar.Container v-if="props.shown" closeOnEsc :motion="false" visible @cancel="emit('cancel', $event)" />
    </KeepAlive>
</template>
