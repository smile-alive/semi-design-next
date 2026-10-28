<script setup lang="ts">
    import { ref, type Component } from 'vue';
    import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputReference as Reference } from '@fibrae/semi-ai-vue';
    import { IconClose, IconUpload, IconFile, IconFolder, IconBranch, IconTerminal, IconGlobeStroke, IconConnectionPoint2, IconTemplateStroked, IconSearch, IconGit, IconCode } from '@fibrae/semi-icons-vue';

    const { Configure } = AIChatInput;
    const radioButtonProps = [
        { label: '快速', value: 'fast' },
        { label: '深度思考', value: 'think' },
    ];
    const modeIcons: Record<string, Component> = { fast: IconTemplateStroked, think: IconSearch };
    const uploadProps = { action: 'https://api.semi.design/upload' };

    const references = ref<Reference[]>([
        {
            type: 'file',
            id: '1',
            name: 'horizontalScroller.tsx',
            path: 'packages/semi-ui-react/AIChatInput/horizontalScroller.tsx',
        },
        {
            type: 'folder',
            id: '2',
            name: 'AIChatInput',
            path: 'packages/semi-ui-react/AIChatInput',
        },
        {
            type: 'web',
            id: '3',
            name: 'web',
        },
        {
            type: 'change',
            id: '4',
            name: 'recentChange',
        },
        {
            type: 'branch',
            id: '5',
            name: 'Branch',
            detail: 'Diff with Main Branch',
            branch: 'feat/aichatinput',
            targetBranch: 'feat/targetBranch',
        },
        {
            type: 'terminal',
            id: '6',
            name: 'From 1-2',
            from: 1,
            to: 2,
        },
    ]);

    function isImageType(item: Attachment) {
        const PIC_PREFIX = 'image/';
        const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
        const { name = '', fileInstance } = item;
        const suffix = name.split('.').pop() ?? '';
        let result = false;
        const type = fileInstance?.type ?? '';
        if (type.startsWith(PIC_PREFIX)) {
            result = true;
        } else if (PIC_SUFFIX_ARRAY.includes(suffix)) {
            result = true;
        }
        return result;
    }

    const refTypeToIconMap: Record<string, Component> = {
        file: IconFile,
        folder: IconFolder,
        branch: IconBranch,
        terminal: IconTerminal,
        web: IconGlobeStroke,
        change: IconConnectionPoint2,
        git: IconGit,
        code: IconCode,
    };

    const onReferenceDelete = (reference: Reference) => {
        references.value = references.value.filter((item) => item.id !== reference.id);
    };
</script>

<template>
    <AIChatInput class="aiChatInput-customTopSlot" placeholder="自定义渲染顶部内容，可用于渲染上传内容、引用内容" :references="references" :showReference="false" :showUploadFile="false" style="margin: 12px" :uploadProps="uploadProps" @referenceDelete="onReferenceDelete">
        <template #topSlot="{ attachments, references: items, onReferenceDelete: deleteReference, onUploadFileDelete }">
            <div class="ai-chat-input-topSlot">
                <div v-for="item in items" :key="item.id" class="item">
                    <span class="item-icon">
                        <component :is="refTypeToIconMap[item.type ?? '']" v-if="item.type && refTypeToIconMap[item.type]" class="item-left item-icon" size="small" />
                        <button aria-label="删除" class="item-icon-delete" type="button" @click="deleteReference(item)">
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {{ item.name }}
                        <span v-if="item.type === 'branch'" class="detail">{{ item.detail }}</span>
                    </span>
                </div>
                <div v-for="item in attachments" :key="item.uid" class="item">
                    <span class="item-icon">
                        <img v-if="isImageType(item)" :alt="item.name" class="item-image item-left" :src="item.url" />
                        <IconUpload v-else class="item-left item-icon" size="small" />
                        <button aria-label="删除" class="item-icon-delete" type="button" @click="onUploadFileDelete(item)">
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">{{ item.name }}</span>
                </div>
            </div>
        </template>
        <template #configureArea>
            <Configure.RadioButton field="mode" initValue="fast" :options="radioButtonProps">
                <!-- the icon is the only label, so it carries the name -->
                <template #label="{ option }">
                    <component :is="modeIcons[String(option.value)]" :aria-label="option.label" />
                </template>
            </Configure.RadioButton>
        </template>
    </AIChatInput>
</template>
