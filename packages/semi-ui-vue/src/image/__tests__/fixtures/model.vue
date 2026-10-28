<script setup lang="ts">
    import { shallowRef } from 'vue';
    import Button from '../../../button';
    import ImagePreview from '../../preview.vue';

    const props = defineProps<{ src: string[] }>();
    const visible = shallowRef(false);
    const currentIndex = shallowRef(0);
</script>

<template>
    <Button @click="visible = true">open</Button>
    <output aria-label="state" data-testid="state">{{ visible }}:{{ currentIndex }}</output>
    <ImagePreview v-model:currentIndex="currentIndex" v-model:visible="visible" :src="props.src" />
</template>
