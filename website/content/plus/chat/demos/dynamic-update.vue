<script setup lang="ts">
    import { onBeforeUnmount, ref } from 'vue';
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
        height: '600px',
    };

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const message = ref<Message[]>([
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
            content: '介绍一下 Semi design',
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: `
Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户[[1]](https://semi.design/zh-CN/start/introduction)。

Semi Design的特点包括：

1. 设计简洁、现代化。
2. 提供主题方案，可深度样式定制。
3. 提供明暗色两套模式，切换方便。
4. 国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
5. 采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。

---
Learn more:
1. [Introduction 介绍 - Semi Design](https://semi.design/zh-CN/start/introduction)
2. [Getting Started 快速开始 - Semi Design](https://semi.design/zh-CN/start/getting-started)
3. [Semi D2C 设计稿转代码的演进之路 - 知乎](https://zhuanlan.zhihu.com/p/667189184)
`,
        },
    ]);

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const generateMockResponse = (content: string) => {
        const id = setInterval(() => {
            const lastMessage = message.value[message.value.length - 1];
            let newMessage: Message = { ...lastMessage };
            if (lastMessage.status === 'loading') {
                newMessage = {
                    ...newMessage,
                    content: `mock Response for ${content} \n`,
                    status: 'incomplete',
                };
            } else if (lastMessage.status === 'incomplete') {
                if ((lastMessage.content?.length ?? 0) > 200) {
                    clearInterval(id);
                    intervalId = null;
                    newMessage = {
                        ...newMessage,
                        content: `${lastMessage.content} mock stream message`,
                        status: 'complete',
                    };
                } else {
                    newMessage = {
                        ...newMessage,
                        content: `${lastMessage.content} mock stream message`,
                    };
                }
            }
            message.value = [...message.value.slice(0, -1), newMessage];
        }, 400);
        intervalId = id;
    };

    const onMessageSend = (content: string) => {
        message.value = [
            ...message.value,
            {
                role: 'assistant',
                status: 'loading',
                createAt: Date.now(),
                id: getId(),
            },
        ];
        generateMockResponse(content);
    };

    const onStopGenerator = () => {
        if (intervalId) {
            clearInterval(intervalId);
            const lastMessage = message.value[message.value.length - 1];
            if (lastMessage.status && lastMessage.status !== 'complete') {
                let newMessage: Message = { ...lastMessage };
                newMessage.status = 'complete';
                message.value = [...message.value.slice(0, -1), newMessage];
            }
        }
    };

    onBeforeUnmount(() => {
        if (intervalId) clearInterval(intervalId);
    });
</script>

<template>
    <Chat v-model:chats="message" :roleConfig="roleInfo" showStopGenerate :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend" @stopGenerator="onStopGenerator" />
</template>
