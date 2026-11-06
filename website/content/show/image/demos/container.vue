<script setup lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

    const getPopupContainer = () => {
        const node = document.getElementById('container') as HTMLElement;
        return node;
    };
</script>

<template>
    <div id="container" :style="{ height: '400px', position: 'relative' }">
        <ImagePreview :getPopupContainer="getPopupContainer" :style="{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginInlineEnd: '5px' }" :width="200" />
        </ImagePreview>
    </div>
</template>
