<script setup lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-vue';
    import { Empty, Popover, Tag } from '@fibrae/semi-ui-vue';

    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <Popover>
        <Tag>悬停此处</Tag>
        <template #content>
            <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                <template #image>
                    <IllustrationSuccess :style="imageStyle" />
                </template>
                <template #darkModeImage>
                    <IllustrationSuccessDark :style="imageStyle" />
                </template>
                <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
            </Empty>
        </template>
    </Popover>
</template>
