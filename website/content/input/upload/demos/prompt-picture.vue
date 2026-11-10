<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Upload, type FileItem, type PromptPositionType } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';
    const marginStyle: Partial<Record<PromptPositionType, string>> = {
        right: 'margin-inline-start: 10px',
    };
    const promptStyle = (pos: PromptPositionType) => `display: flex; align-items: center; color: var(--semi-color-text-2); height: 100%; ${marginStyle[pos] ?? ''}`;
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dy.jpeg',
            status: 'success',
            size: '130kb',
            url: '/assets/placeholder/avatar-a.svg',
        },
        {
            uid: '5',
            name: 'resso.jpeg',
            status: 'wait',
            percent: 50,
            size: '222kb',
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];
    const positions: PromptPositionType[] = ['right', 'bottom'];
</script>

<template>
    <template v-for="(pos, index) in positions" :key="pos">
        <div v-if="index" style="margin-block-end: 12px; margin-block-start: 12px; border-block-end: 1px solid var(--semi-color-border)" />
        <Upload :action="action" :customRequest="mockUpload" :defaultFileList="defaultFileList" listType="picture" :promptPosition="pos">
            <template #prompt>
                <div :style="promptStyle(pos)">请上传认证材料</div>
            </template>
            <IconPlus aria-label="上传图片" size="extra-large" />
        </Upload>
    </template>
</template>
