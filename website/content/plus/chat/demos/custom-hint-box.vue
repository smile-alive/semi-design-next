<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-vue';
    import { IconArrowRight } from '@fibrae/semi-icons-vue';

    const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够通过 DSM 定制自己的主题吗？'];

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

    const commonHintStyle = {
        border: '1px solid var(--semi-color-border)',
        padding: '10px',
        borderRadius: '10px',
        background: 'none',
        color: 'var( --semi-color-text-1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: 'inherit',
    } as const;

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const messages = ref<Message[]>([
        {
            role: 'assistant',
            id: '1',
            createAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
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
            messages.value = [...messages.value, newAssistantMessage];
        }, 200);
        hints.value = [];
    };
</script>

<template>
    <Chat v-model:chats="messages" :hints="hints" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @clear="hints = []" @hintClick="hints = []" @messageSend="onMessageSend">
        <template #hintBox="{ content, onHintClick }">
            <button :style="commonHintStyle" type="button" @click="onHintClick">
                {{ content }}
                <IconArrowRight :style="{ marginLeft: '10px' }" />
            </button>
        </template>
    </Chat>
</template>
