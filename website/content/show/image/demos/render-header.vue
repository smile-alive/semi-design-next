<script setup lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg'];
</script>

<template>
    <ImagePreview>
        <template #title="{ title }">
            <div
                :style="{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }"
            >
                <span :style="{ background: 'black', padding: '0 10px' }">自定义标题：{{ title }}</span>
            </div>
        </template>
        <div>
            <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :preview="{ previewTitle: `lamp${index + 1}` }" :src="src" :style="{ marginRight: '5px' }" :width="200" />
        </div>
    </ImagePreview>
</template>
