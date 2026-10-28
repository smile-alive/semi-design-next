<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

    const container = useTemplateRef<HTMLDivElement>('container');
    // called when the preview opens, after the container is mounted
    const getPopupContainer = () => container.value as HTMLElement;
</script>

<template>
    <div ref="container" :style="{ height: '400px', position: 'relative' }">
        <ImagePreview :getPopupContainer="getPopupContainer" :style="{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginRight: '5px' }" :width="200" />
        </ImagePreview>
    </div>
</template>
