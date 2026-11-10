<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

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

    const titleStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: '10px',
        padding: '5px 0px',
        width: 'fit-content',
    };

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
            content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用',
        },
    ]);

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            content: 'This is a mock response',
        };
        setTimeout(() => {
            message.value = [...message.value, newAssistantMessage];
        }, 200);
    };
</script>

<template>
    <Chat v-model:chats="message" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend">
        <template #fullChatBox="props">
            <div :class="props.class">
                <div
                    :style="{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: '4px',
                        alignItems: props.message.role === 'user' ? 'end' : undefined,
                    }"
                >
                    <span v-if="props.message.role !== 'user'" :style="titleStyle">
                        <Avatar alt="" shape="square" size="extra-small" :src="props.role.avatar" />
                        <component :is="props.defaultNodes.title" />
                    </span>
                    <div style="width: fit-content">
                        <component :is="props.defaultNodes.content" />
                    </div>
                    <component :is="props.defaultNodes.action" />
                </div>
            </div>
        </template>
    </Chat>
</template>
