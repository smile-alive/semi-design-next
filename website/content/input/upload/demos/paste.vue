<script setup lang="ts">
    import { Toast, Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload action="https://api.semi.design/upload" addOnPasting draggable @pastingError="Toast.error('读取剪贴板中的文件失败')">
        <template #dragMainText>复制截图或文件后，在页面上按 Ctrl/Cmd + V</template>
        <template #dragSubText>也可以点击或拖拽上传</template>
    </Upload>
</template>
