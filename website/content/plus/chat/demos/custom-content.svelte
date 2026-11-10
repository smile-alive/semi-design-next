<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { IconChevronUp } from '@fibrae/semi-icons-svelte';
    import { Avatar, AvatarGroup, MarkdownRender } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

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

    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 500px';

    const uploadProps = { action: '/upload', customRequest: mockUpload };

    let id = 0;
    const getId = () => `id-${id++}`;

    let message = $state<ChatMessage[]>([
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。它作为全面、易用、优质的现代应用 UI 解决方案。',
            source: [
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/zh-CN/svelte/start/introduction',
                    title: 'semi Design',
                    subTitle: 'Semi design website',
                    content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。',
                },
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/zh-CN/svelte/start/getting-started',
                    subTitle: 'Semi theme website',
                    title: 'Semi 主题',
                    content: '用 --semi-* 变量定制主题，从 Semi Design 到 Any Design，并应用在设计稿和代码中',
                },
                {
                    avatar: '/assets/placeholder/logo.svg',
                    url: '/zh-CN/svelte/start/overview',
                    subTitle: 'Semi framework website',
                    title: '多框架',
                    content: '一套组件，四个框架原生可用，React、Vue、Solid、Svelte 共用同一套 foundation 逻辑',
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
            message = [...message, newAssistantMessage];
        }, 200);
    };
</script>

<Chat bind:chats={message} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps}>
    {#snippet content(props)}
        <div class={props.class}>
            {#if props.message.source}
                <div style="transition: {collapsed ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease'}; height: {collapsed ? '30px' : '200px'}; width: {collapsed ? '190px' : '100%'}; background: var(--semi-color-tertiary-light-hover); border-radius: 16px; box-sizing: border-box; margin-bottom: 10px">
                    <button
                        style="display: {collapsed
                            ? 'flex'
                            : 'none'}; width: fit-content; column-gap: 10px; border: none; background: var(--semi-color-tertiary-light-hover); border-radius: 16px; padding: 5px 10px; cursor: pointer; font-family: inherit; font-size: 14px; line-height: inherit; color: var(--semi-color-text-1)"
                        type="button"
                        onclick={() => (collapsed = false)}
                    >
                        <span>基于{props.message.source.length}个搜索来源</span>
                        <AvatarGroup items={props.message.source.map((source: Source) => ({ alt: '', src: source.avatar }))} size="extra-extra-small" />
                    </button>
                    <button
                        style="width: 100%; height: 100%; box-sizing: border-box; display: {collapsed
                            ? 'none'
                            : 'flex'}; flex-direction: column; border: none; background: var(--semi-color-tertiary-light-hover); border-radius: 16px; padding: 12px; text-align: left; font-family: inherit; font-size: inherit; line-height: inherit; color: inherit"
                        type="button"
                        onclick={() => (collapsed = true)}
                    >
                        <span style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; column-gap: 10px; color: var(--semi-color-text-1)">
                            <span style="font-size: 14px; font-weight: 500">Source</span>
                            <IconChevronUp />
                        </span>
                        <span style="display: flex; flex-wrap: wrap; gap: 10px; overflow: scroll; padding: 5px 10px">
                            {#each props.message.source as source (source.url)}
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
                </div>
            {/if}
            <MarkdownRender raw={typeof props.message.content === 'string' ? props.message.content : ''} />
        </div>
    {/snippet}
</Chat>
