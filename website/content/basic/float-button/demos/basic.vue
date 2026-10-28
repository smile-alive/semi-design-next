<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';

    const onClick = () => {
        console.log('float button clicked');
    };
</script>

<template>
    <span>基本使用：页面右下第三列 1 </span>
    <FloatButton aria-label="AI 编辑" style="bottom: 270px" @click="onClick">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
