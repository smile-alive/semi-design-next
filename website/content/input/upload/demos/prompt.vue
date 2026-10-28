<script setup lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type PromptPositionType } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
    const marginStyle: Partial<Record<PromptPositionType, string>> = {
        left: 'margin-right: 10px',
        right: 'margin-left: 10px',
    };
    const promptStyle = (pos: PromptPositionType) => `display: flex; align-items: center; color: var(--semi-color-text-2); height: 32px; ${marginStyle[pos] ?? ''}`;
    const positions: PromptPositionType[] = ['right', 'left', 'bottom'];
</script>

<template>
    <template v-for="(pos, index) in positions" :key="pos">
        <div v-if="index" style="margin-bottom: 12px; margin-top: 12px; border-bottom: 1px solid var(--semi-color-border)" />
        <Upload :action="action" :promptPosition="pos">
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
