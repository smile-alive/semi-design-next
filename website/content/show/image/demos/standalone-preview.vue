<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

    const visible1 = ref(false);
    const visible2 = ref(false);
</script>

<template>
    <Button @click="visible1 = true">Preview single Image</Button>
    <ImagePreview v-model:visible="visible1" src="/assets/root-web-sites/sky.jpg" />
    <br />
    <Button :style="{ marginTop: '20px' }" @click="visible2 = true">Preview multiple Images</Button>
    <ImagePreview v-model:visible="visible2" previewTitle="Scenery" :src="srcList" />
</template>
