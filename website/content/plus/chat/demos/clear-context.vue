<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';

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
        margin: '8px 16px',
        height: '550px',
    };

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const message = ref<ChatMessage[]>([
        {
            role: 'system',
            id: '1',
            createAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
        {
            role: 'user',
            id: '2',
            createAt: 1715676751919,
            content: '介绍一下 semi design',
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统',
        },
    ]);

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            message.value = [...message.value, newAssistantMessage];
        }, 200);
    };

    const onMessageReset = () => {
        setTimeout(() => {
            const lastMessage = message.value[message.value.length - 1];
            const newLastMessage: ChatMessage = {
                ...lastMessage,
                status: 'complete',
                content: 'This is a mock reset message.',
            };
            message.value = [...message.value.slice(0, -1), newLastMessage];
        }, 200);
    };
</script>

<template>
    <Chat v-model:chats="message" :roleConfig="roleInfo" showClearContext :style="commonOuterStyle" :uploadProps="uploadProps" @messageReset="onMessageReset" @messageSend="onMessageSend">
        <template #uploadTip>自定义上传按钮提示信息</template>
    </Chat>
</template>
