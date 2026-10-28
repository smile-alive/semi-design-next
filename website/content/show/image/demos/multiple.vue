<script setup lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];
</script>

<template>
    <ImagePreview>
        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginRight: '5px' }" :width="200" />
    </ImagePreview>
</template>
