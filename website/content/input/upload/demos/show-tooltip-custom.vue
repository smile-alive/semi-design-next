<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Tooltip, Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload action="https://api.semi.design/upload" showTooltip>
        <template #ellipsisTooltip="{ content, trigger }">
            <Tooltip :content="content" position="bottom">
                <component :is="trigger" />
            </Tooltip>
        </template>
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
