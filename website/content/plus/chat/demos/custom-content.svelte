<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { IconChevronUp } from '@fibrae/semi-icons-svelte';
    import { Avatar, AvatarGroup, MarkdownRender } from '@fibrae/semi-ui-svelte';

    interface Source {
        avatar: string;
        url: string;
        title: string;
        subTitle: string;
        content: string;
    }

    const roleConfig = {
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

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const sourcesOf = (item: ChatMessage): Source[] | undefined => item.source;

    let messages = $state<ChatMessage[]>([
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
    let collapsed = $state(true);

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            content: 'This is a mock response',
        };
        setTimeout(() => {
            messages = [...messages, newAssistantMessage];
        }, 200);
    };

    const buttonReset = 'border: none; background: var(--semi-color-tertiary-light-hover); border-radius: 16px; font-family: inherit; line-height: inherit';
</script>

<Chat bind:chats={messages} {onMessageSend} {roleConfig} style="border: 1px solid var(--semi-color-border); border-radius: 16px; height: 500px" {uploadProps}>
    {#snippet content({ message, class: contentClass })}
        {@const sources = sourcesOf(message)}
        <div class={contentClass}>
            {#if sources}
                <div style="transition: {collapsed ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease'}; height: {collapsed ? '30px' : '200px'}; width: {collapsed ? '190px' : '100%'}; background: var(--semi-color-tertiary-light-hover); border-radius: 16px; box-sizing: border-box; margin-bottom: 10px">
                    {#if collapsed}
                        <button style="{buttonReset}; display: flex; width: fit-content; column-gap: 10px; padding: 5px 10px; cursor: pointer; font-size: 14px; color: var(--semi-color-text-1)" type="button" onclick={() => (collapsed = false)}>
                            <span>基于{sources.length}个搜索来源</span>
                            <AvatarGroup items={sources.map((source) => ({ alt: '', src: source.avatar }))} size="extra-extra-small" />
                        </button>
                    {:else}
                        <button style="{buttonReset}; width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; padding: 12px; text-align: start; font-size: inherit; color: inherit" type="button" onclick={() => (collapsed = true)}>
                            <span style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; column-gap: 10px; color: var(--semi-color-text-1)">
                                <span style="font-size: 14px; font-weight: 500">Source</span>
                                <IconChevronUp />
                            </span>
                            <span style="display: flex; flex-wrap: wrap; gap: 10px; overflow: scroll; padding: 5px 10px">
                                {#each sources as source (source.url)}
                                    <span style="display: flex; flex-direction: column; row-gap: 5px; flex-basis: 150px; flex-grow: 1; border: 1px solid var(--semi-color-border); border-radius: 12px; padding: 12px; font-size: 12px">
                                        <span style="display: flex; column-gap: 5px; align-items: center">
                                            <Avatar alt="" shape="square" src={source.avatar} style="width: 16px; height: 16px; flex-shrink: 0" />
                                            <span style="color: var(--semi-color-text-2); text-overflow: ellipsis">
                                                {source.title}
                                            </span>
                                        </span>
                                        <span style="color: var(--semi-color-primary); font-size: 12px">{source.subTitle}</span>
                                        <span style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; text-overflow: ellipsis; overflow: hidden; color: var(--semi-color-text-2)">
                                            {source.content}
                                        </span>
                                    </span>
                                {/each}
                            </span>
                        </button>
                    {/if}
                </div>
            {/if}
            <MarkdownRender raw={typeof message.content === 'string' ? message.content : ''} />
        </div>
    {/snippet}
</Chat>
