<script setup lang="ts">
    import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-vue';
    import { Button, Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];
</script>

<template>
    <ImagePreview>
        <template #previewMenu="menu">
            <div
                :style="{
                    background: 'grey',
                    height: '40px',
                    width: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    borderRadius: '3px',
                }"
            >
                <Button aria-label="上一张" :disabled="menu.disabledPrev" type="tertiary" @click="menu.onPrev">
                    <template #icon>
                        <IconChevronLeft size="large" />
                    </template>
                </Button>
                <Button aria-label="下一张" :disabled="menu.disabledNext" type="tertiary" @click="menu.onNext">
                    <template #icon>
                        <IconChevronRight size="large" />
                    </template>
                </Button>
                <Button aria-label="缩小" :disabled="menu.disabledZoomOut" type="tertiary" @click="menu.onZoomOut">
                    <template #icon>
                        <IconMinus size="large" />
                    </template>
                </Button>
                <Button aria-label="放大" :disabled="menu.disabledZoomIn" type="tertiary" @click="menu.onZoomIn">
                    <template #icon>
                        <IconPlus size="large" />
                    </template>
                </Button>
                <Button :aria-label="menu.ratio === 'adaptation' ? '原始尺寸' : '适应页面'" type="tertiary" @click="menu.onRatioClick">
                    <template #icon>
                        <IconRealSizeStroked v-if="menu.ratio === 'adaptation'" size="large" />
                        <IconWindowAdaptionStroked v-else size="large" />
                    </template>
                </Button>
                <Button aria-label="旋转" type="tertiary" @click="menu.onRotateLeft">
                    <template #icon>
                        <IconRotate size="large" />
                    </template>
                </Button>
                <Button aria-label="下载" :disabled="menu.disableDownload" type="tertiary" @click="menu.onDownload">
                    <template #icon>
                        <IconDownload size="large" />
                    </template>
                </Button>
            </div>
        </template>
        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginInlineEnd: '5px' }" :width="200" />
    </ImagePreview>
</template>
