<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage, type ChatProps } from '@fibrae/semi-ai-vue';
    import { Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-vue';

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
            content: '给一个 Semi Design 的 Button 组件的使用示例',
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
        },
    ]);
    const mode = ref<RadioValue | undefined>('bubble');
    const align = ref<RadioValue | undefined>('leftRight');

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
    <span style="display: flex; flex-direction: column; row-gap: 8px">
        <span style="display: flex; align-items: center; column-gap: 10px">
            模式
            <RadioGroup v-model="mode" type="button">
                <Radio value="bubble">气泡</Radio>
                <Radio value="noBubble">非气泡</Radio>
                <Radio value="userBubble">用户会话气泡</Radio>
            </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
            会话布局方式
            <RadioGroup v-model="align" type="button">
                <Radio value="leftRight">左右分布</Radio>
                <Radio value="leftAlign">左对齐</Radio>
            </RadioGroup>
        </span>
    </span>
    <Chat :key="`${align}${mode}`" v-model:chats="message" :align="align as ChatProps['align']" :mode="mode as ChatProps['mode']" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageReset="onMessageReset" @messageSend="onMessageSend">
        <template #uploadTip>自定义上传按钮提示信息</template>
    </Chat>
</template>
