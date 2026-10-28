<script setup lang="ts">
    import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-vue';
    import { Button, Empty } from '@fibrae/semi-ui-vue';

    const imageStyle = { width: '150px', height: '150px' };
</script>

<template>
    <Empty title="空状态标题">
        <template #image>
            <IllustrationNoContent :style="imageStyle" />
        </template>
        <template #darkModeImage>
            <IllustrationNoContentDark :style="imageStyle" />
        </template>
        <template #description>开始创建你的第一个仪表盘吧！</template>
        <div>
            <Button :style="{ padding: '6px 24px', marginRight: '12px' }" type="primary">二级按钮</Button>
            <Button :style="{ padding: '6px 24px' }" theme="solid" type="primary">一级按钮</Button>
        </div>
    </Empty>
</template>
