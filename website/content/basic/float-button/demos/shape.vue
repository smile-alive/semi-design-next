<script setup lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-vue';
    import { FloatButton } from '@fibrae/semi-ui-vue';

    const onClick = () => {
        console.log('float button clicked');
    };
</script>

<template>
    <span>方形：页面右下第三列 3</span>
    <FloatButton aria-label="AI 编辑" shape="square" style="bottom: 150px" @click="onClick">
        <template #icon>
            <IconAIEditLevel1 />
        </template>
    </FloatButton>
</template>
