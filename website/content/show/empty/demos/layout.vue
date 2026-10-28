<script setup lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-vue';
    import { Button, Empty } from '@fibrae/semi-ui-vue';

    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <Empty layout="horizontal" :style="{ width: '800px', margin: '0 auto' }" title="创建成功">
        <template #image>
            <IllustrationSuccess :style="imageStyle" />
        </template>
        <template #darkModeImage>
            <IllustrationSuccessDark :style="imageStyle" />
        </template>
        <template #description> 这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。 </template>
        <Button :style="{ padding: '6px 24px' }" theme="solid" type="primary">开始操作</Button>
    </Empty>
</template>
