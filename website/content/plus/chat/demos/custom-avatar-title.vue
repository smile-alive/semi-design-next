<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';
    import { Avatar, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-vue';
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

    let id = 0;
    const getId = () => `id-${id++}`;

    function formatTime(createAt?: number) {
        const date = new Date(createAt ?? Date.now());
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${hours}:${minutes}`;
    }

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
            content: [
                {
                    type: 'text',
                    text: '这张图片里有什么？',
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: '/assets/root-web-sites/edit-bag.jpeg',
                    },
                },
            ],
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: '图片中是一个有卡通画像装饰的黄色背包。',
        },
    ]);
    const title = ref<RadioValue | undefined>('null');
    const avatar = ref<RadioValue | undefined>('null');

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
    <span style="display: flex; flex-direction: column; row-gap: 8px; margin-bottom: 5px">
        <span style="display: flex; align-items: center; column-gap: 10px">
            头像渲染模式
            <RadioGroup v-model="avatar" aria-label="头像渲染模式" type="button">
                <Radio value="default">默认头像</Radio>
                <Radio value="null">无头像</Radio>
                <Radio value="custom">自定义头像</Radio>
            </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
            标题渲染模式
            <RadioGroup v-model="title" aria-label="标题渲染模式" type="button">
                <Radio value="default">默认标题</Radio>
                <Radio value="null">无标题</Radio>
                <Radio value="custom">自定义标题</Radio>
            </RadioGroup>
        </span>
    </span>
    <Chat :key="`${avatar}${title}`" v-model:chats="message" class="component-chat-demo-custom-render" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend">
        <template v-if="avatar === 'custom'" #avatar="props">
            <Avatar shape="square" size="extra-small" style="flex-shrink: 0">{{ props.role.name }}</Avatar>
        </template>
        <template v-else-if="avatar === 'null'" #avatar />
        <template v-if="title === 'custom'" #title="props">
            <span class="title">
                {{ props.role.name }}
                <span class="time">{{ formatTime(props.message.createAt) }}</span>
            </span>
        </template>
        <template v-else-if="title === 'null'" #title />
    </Chat>
</template>
