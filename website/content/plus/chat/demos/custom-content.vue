<script setup lang="ts">
    import { ref } from 'vue';
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-vue';
    import { IconChevronUp } from '@fibrae/semi-icons-vue';
    import { Avatar, AvatarGroup, MarkdownRender } from '@fibrae/semi-ui-vue';

    interface Source {
        avatar: string;
        url: string;
        title: string;
        subTitle: string;
        content: string;
    }

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
        height: '500px',
    };

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const sourcesOf = (item: ChatMessage): Source[] | undefined => item.source;

    const message = ref<ChatMessage[]>([
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。它作为全面、易用、优质的现代应用 UI 解决方案，从字节跳动各业务线的复杂场景提炼而来，支撑近千计平台产品，服务内外部 10 万+ 用户。',
            source: [
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/zh-CN/start/introduction',
                    title: 'semi Design',
                    subTitle: 'Semi design website',
                    content: 'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。',
                },
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/dsm/landing',
                    subTitle: 'Semi DSM website',
                    title: 'Semi 设计系统',
                    content: '从 Semi Design，到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中',
                },
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/code/zh-CN/start/introduction',
                    subTitle: 'Semi D2C website',
                    title: '设计稿转代码',
                    content: 'Semi 设计稿转代码（Semi Design to Code，或简称 Semi D2C），是由抖音前端 Semi Design 团队推出的全新的提效工具',
                },
            ],
        },
    ]);
    // Only the first message carries sources, so one open state serves the whole list
    const collapsed = ref(true);

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

    const buttonReset = {
        border: 'none',
        background: 'var(--semi-color-tertiary-light-hover)',
        borderRadius: '16px',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
    };
</script>

<template>
    <Chat v-model:chats="message" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend">
        <template #content="{ message: item, class: contentClass }">
            <div :class="contentClass">
                <div
                    v-if="sourcesOf(item)"
                    :style="{
                        transition: collapsed ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease',
                        height: collapsed ? '30px' : '200px',
                        width: collapsed ? '190px' : '100%',
                        background: 'var(--semi-color-tertiary-light-hover)',
                        borderRadius: '16px',
                        boxSizing: 'border-box',
                        marginBottom: '10px',
                    }"
                >
                    <button
                        v-show="collapsed"
                        :style="{
                            ...buttonReset,
                            display: 'flex',
                            width: 'fit-content',
                            columnGap: '10px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: 'var(--semi-color-text-1)',
                        }"
                        type="button"
                        @click="collapsed = false"
                    >
                        <span>基于{{ sourcesOf(item)?.length }}个搜索来源</span>
                        <AvatarGroup size="extra-extra-small">
                            <Avatar v-for="(s, index) in sourcesOf(item)" :key="index" alt="" :src="s.avatar" />
                        </AvatarGroup>
                    </button>
                    <button
                        v-show="!collapsed"
                        :style="{
                            ...buttonReset,
                            width: '100%',
                            height: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px',
                            textAlign: 'start',
                            fontSize: 'inherit',
                            color: 'inherit',
                        }"
                        type="button"
                        @click="collapsed = true"
                    >
                        <span style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; column-gap: 10px; color: var(--semi-color-text-1)">
                            <span style="font-size: 14px; font-weight: 500">Source</span>
                            <IconChevronUp />
                        </span>
                        <span style="display: flex; flex-wrap: wrap; gap: 10px; overflow: scroll; padding: 5px 10px">
                            <span v-for="s in sourcesOf(item)" :key="s.url" style="display: flex; flex-direction: column; row-gap: 5px; flex-basis: 150px; flex-grow: 1; border: 1px solid var(--semi-color-border); border-radius: 12px; padding: 12px; font-size: 12px">
                                <span style="display: flex; column-gap: 5px; align-items: center">
                                    <Avatar alt="" shape="square" :src="s.avatar" style="width: 16px; height: 16px; flex-shrink: 0" />
                                    <span style="color: var(--semi-color-text-2); text-overflow: ellipsis">
                                        {{ s.title }}
                                    </span>
                                </span>
                                <span style="color: var(--semi-color-primary); font-size: 12px">{{ s.subTitle }}</span>
                                <span style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; text-overflow: ellipsis; overflow: hidden; color: var(--semi-color-text-2)">
                                    {{ s.content }}
                                </span>
                            </span>
                        </span>
                    </button>
                </div>
                <MarkdownRender :raw="typeof item.content === 'string' ? item.content : ''" />
            </div>
        </template>
    </Chat>
</template>
