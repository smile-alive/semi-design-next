<script setup lang="ts">
    import { ref } from 'vue';
    import Cropper from '../../cropper.vue';

    const props = defineProps<{ accept: boolean }>();
    const zoom = ref(1);
    const changes = ref<number[]>([]);
    const onZoomChange = (next: number) => {
        changes.value.push(next);
        if (props.accept) zoom.value = next;
    };
</script>

<template>
    <Cropper :rotate="0" src="https://example.com/a.png" :zoom="zoom" @zoomChange="onZoomChange" />
    <span data-testid="changes">{{ changes.join(',') }}</span>
    <span data-testid="zoom">{{ zoom }}</span>
</template>
