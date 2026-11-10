<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够自定义主题吗？'];

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

    const uploadProps = { action: '/upload', customRequest: mockUpload };

    let id = 0;
    const getId = () => `id-${id++}`;

    const message = ref<Message[]>([
        {
            role: 'assistant',
            id: '1',
            createAt: 1715676751919,
            content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用，你可以向我提问任何关于 Semi 的问题。',
        },
    ]);
    const hints = ref(hintsExample);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            message.value = [...message.value, newAssistantMessage];
        }, 200);
    };
</script>

<template>
    <Chat v-model:chats="message" :hints="hints" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @clear="hints = []" @hintClick="hints = []" @messageSend="onMessageSend" />
</template>
