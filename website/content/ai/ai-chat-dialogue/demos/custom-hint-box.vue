<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-vue';
    import { IconArrowRight } from '@fibrae/semi-icons-vue';

    const hintStyle = {
        border: '1px solid var(--semi-color-border)',
        padding: '10px',
        borderRadius: '10px',
        backgroundColor: 'transparent',
        color: 'var(--semi-color-text-1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: '14px',
    };

    const roleConfig = {
        user: {
            name: 'User',
            avatar: '/assets/docs-icon.png',
        },
        assistant: {
            name: 'Assistant',
            avatar: '/assets/placeholder/logo.svg',
        },
        system: {
            name: 'System',
            avatar: '/assets/placeholder/logo.svg',
        },
    };

    const messages = shallowRef<Message[]>([
        {
            role: 'assistant',
            id: '1',
            createdAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
        },
    ]);
    const hints = shallowRef(['Semi 组件库有哪些常用组件？', '能否展示一个使用 Semi 组件库构建的页面示例？', 'Semi 组件库有官方文档吗？']);
</script>

<template>
    <AIChatDialogue v-model:chats="messages" align="leftRight" :hints="hints" mode="bubble" :roleConfig="roleConfig" @hintClick="hints = []">
        <template #hintBox="{ content, onHintClick }">
            <button :style="hintStyle" type="button" @click="onHintClick">
                {{ content }}
                <IconArrowRight :style="{ marginLeft: '10px' }" />
            </button>
        </template>
    </AIChatDialogue>
</template>
