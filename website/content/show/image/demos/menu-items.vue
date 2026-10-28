<script setup lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-vue';
    import { Divider, Image, ImagePreview, Tooltip } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];
</script>

<template>
    <ImagePreview>
        <template #previewMenu="{ menuItems }">
            <div
                :style="{
                    display: 'flex',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    alignItems: 'center',
                    padding: '5px 16px',
                    borderRadius: '4px',
                }"
            >
                <component :is="item" v-for="(item, index) in menuItems.slice(0, 3)" :key="`a${index}`" />
                <Divider layout="vertical" />
                <component :is="item" v-for="(item, index) in menuItems.slice(3, 7)" :key="`b${index}`" />
                <Divider layout="vertical" />
                <component :is="item" v-for="(item, index) in menuItems.slice(7)" :key="`c${index}`" />
                <Divider layout="vertical" />
                <Tooltip content="我是一个自定义操作">
                    <IconInfoCircle size="large" />
                </Tooltip>
            </div>
        </template>
        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :width="200" />
    </ImagePreview>
</template>
