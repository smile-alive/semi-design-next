<script setup lang="ts">
    import { Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload action="https://api.semi.design/upload" draggable>
        <template #dragMainText>点击上传文件或拖拽文件到这里</template>
        <template #dragSubText>支持任意类型文件</template>
    </Upload>
</template>
