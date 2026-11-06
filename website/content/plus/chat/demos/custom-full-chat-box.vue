<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';

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
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统',
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
