<script setup lang="ts">
    import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-vue';
    import { Button, Image, ImagePreview } from '@fibrae/semi-ui-vue';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];
</script>

<template>
    <ImagePreview>
        <template #previewMenu="{ ratio, disabledPrev, disabledNext, disabledZoomIn, disabledZoomOut, disableDownload, onDownload, onNext, onPrev, onRotateLeft, onRatioClick, onZoomIn, onZoomOut }">
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
                <Button aria-label="上一张" :disabled="disabledPrev" type="tertiary" @click="onPrev">
                    <template #icon>
                        <IconChevronLeft size="large" />
                    </template>
                </Button>
                <Button aria-label="下一张" :disabled="disabledNext" type="tertiary" @click="onNext">
                    <template #icon>
                        <IconChevronRight size="large" />
                    </template>
                </Button>
                <Button aria-label="缩小" :disabled="disabledZoomOut" type="tertiary" @click="onZoomOut">
                    <template #icon>
                        <IconMinus size="large" />
                    </template>
                </Button>
                <Button aria-label="放大" :disabled="disabledZoomIn" type="tertiary" @click="onZoomIn">
                    <template #icon>
                        <IconPlus size="large" />
                    </template>
                </Button>
                <Button :aria-label="ratio === 'adaptation' ? '原始尺寸' : '适应页面'" type="tertiary" @click="onRatioClick">
                    <template #icon>
                        <IconRealSizeStroked v-if="ratio === 'adaptation'" size="large" />
                        <IconWindowAdaptionStroked v-else size="large" />
                    </template>
                </Button>
                <Button aria-label="旋转" type="tertiary" @click="onRotateLeft">
                    <template #icon>
                        <IconRotate size="large" />
                    </template>
                </Button>
                <Button aria-label="下载" :disabled="disableDownload" type="tertiary" @click="onDownload">
                    <template #icon>
                        <IconDownload size="large" />
                    </template>
                </Button>
            </div>
        </template>
        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginRight: '5px' }" :width="200" />
    </ImagePreview>
</template>
