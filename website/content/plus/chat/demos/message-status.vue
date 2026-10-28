<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-vue';

    const roleInfo = {
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

    const commonOuterStyle = {
        border: '1px solid var(--semi-color-border)',
        borderRadius: '16px',
        height: '400px',
    };

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const messages = ref<Message[]>([
        {
            role: 'assistant',
            id: '1',
            createAt: 1715676751919,
            content: '请求成功',
        },
        {
            id: 'loading',
            role: 'assistant',
            status: 'loading',
        },
        {
            role: 'assistant',
            id: 'error',
            content: '请求错误',
            status: 'error',
        },
    ]);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            messages.value = [...messages.value, newAssistantMessage];
        }, 200);
    };
</script>

<template>
    <Chat v-model:chats="messages" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend" />
</template>
