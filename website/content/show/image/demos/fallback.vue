<script setup lang="ts">
    import { IconUploadError } from '@fibrae/semi-icons-vue';
    import { Image } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ display: 'flex', alignItems: 'center', flexDirection: 'column' }">
        <span>加载失败默认样式</span>
        <Image alt="加载失败的图片" :height="200" src="https://load-error.jpeg" :width="200" />
        <br />
        <span>自定义加载失败占位图</span>
        <Image alt="加载失败的图片" :height="200" src="https://load-error.jpeg" :width="200">
            <template #fallback>
                <IconUploadError :style="{ fontSize: '50px' }" />
            </template>
        </Image>
    </div>
</template>
