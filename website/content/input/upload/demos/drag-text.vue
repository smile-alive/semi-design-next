<script setup lang="ts">
    import { IconBolt } from '@fibrae/semi-icons-vue';
    import { Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload accept="application/pdf,.jpeg" action="https://api.semi.design/upload" draggable style="margin-top: 10px">
        <template #dragIcon>
            <IconBolt />
        </template>
        <template #dragMainText>点击上传文件或拖拽文件到这里</template>
        <template #dragSubText>仅支持jpeg、pdf</template>
    </Upload>
</template>
