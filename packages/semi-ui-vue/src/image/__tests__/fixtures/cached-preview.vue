<script setup lang="ts">
    import ImagePreview from '../../preview.vue';

    const props = withDefaults(defineProps<{ active: boolean; src: string[]; visible?: boolean }>(), { visible: true });
</script>

<template>
    <KeepAlive>
        <ImagePreview v-if="props.active" :src="props.src" :visible="props.visible" />
        <p v-else>other page</p>
    </KeepAlive>
</template>
