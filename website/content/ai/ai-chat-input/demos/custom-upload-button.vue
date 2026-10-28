<script setup lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-vue';
    import { IconUpload } from '@fibrae/semi-icons-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };
</script>

<template>
    <AIChatInput placeholder="自定义上传按钮（仍支持粘贴上传）" style="margin: 12px" :uploadProps="uploadProps">
        <template #uploadButton="{ onOpenFileDialog, disabled }">
            <button aria-label="上传" class="semi-button semi-button-borderless" :disabled="disabled" type="button" @click.stop="onOpenFileDialog">
                <IconUpload />
            </button>
        </template>
    </AIChatInput>
</template>
