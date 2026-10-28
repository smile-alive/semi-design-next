<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';
    import { IconForward, IconMoreStroked } from '@fibrae/semi-icons-vue';
    import { Button, Dropdown } from '@fibrae/semi-ui-vue';

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
        <template #action="{ defaultActions, class: actionClass }">
            <span :class="actionClass">
                <component :is="action" v-for="(action, index) in defaultActions" :key="index" />
                <Dropdown position="top" trigger="click">
                    <Button aria-label="更多" class="semi-chat-chatBox-action-btn" theme="borderless" type="tertiary">
                        <template #icon>
                            <IconMoreStroked />
                        </template>
                    </Button>
                    <template #content>
                        <Dropdown.Menu>
                            <Dropdown.Item>
                                <template #icon>
                                    <IconForward />
                                </template>
                                分享
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </template>
                </Dropdown>
            </span>
        </template>
    </Chat>
</template>
