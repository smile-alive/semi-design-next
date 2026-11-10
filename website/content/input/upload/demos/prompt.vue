<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type PromptPositionType } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';
    const marginStyle: Partial<Record<PromptPositionType, string>> = {
        left: 'margin-inline-end: 10px',
        right: 'margin-inline-start: 10px',
    };
    const promptStyle = (pos: PromptPositionType) => `display: flex; align-items: center; color: var(--semi-color-text-2); height: 32px; ${marginStyle[pos] ?? ''}`;
    const positions: PromptPositionType[] = ['right', 'left', 'bottom'];
</script>

<template>
    <template v-for="(pos, index) in positions" :key="pos">
        <div v-if="index" style="margin-block-end: 12px; margin-block-start: 12px; border-block-end: 1px solid var(--semi-color-border)" />
        <Upload :action="action" :customRequest="mockUpload" :promptPosition="pos">
            <template #prompt>
                <div :style="promptStyle(pos)">请上传资格认证材料</div>
            </template>
            <Button theme="light">
                <template #icon>
                    <IconUpload />
                </template>
                点击上传
            </Button>
        </Upload>
    </template>
</template>
