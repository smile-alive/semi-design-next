<script setup lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-vue/illustrations';
    import { Empty, Popover, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Popover>
        <Tag>悬停此处</Tag>
        <template #content>
            <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                <template #image>
                    <IllustrationSuccess :style="{ width: '150px', height: '150px' }" />
                </template>
                <template #darkModeImage>
                    <IllustrationSuccessDark :style="{ width: '150px', height: '150px' }" />
                </template>
                <template #description>一套组件，四个框架原生可用</template>
            </Empty>
        </template>
    </Popover>
</template>
