<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { Avatar } from '@fibrae/semi-ui-svelte';
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

    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px';
    const uploadProps = { action: '/upload', customRequest: mockUpload };
    const titleStyle = 'display: flex; align-items: center; justify-content: center; column-gap: 10px; padding: 5px 0px; width: fit-content';

    let id = 0;
    const getId = () => `id-${id++}`;

    let message = $state<ChatMessage[]>([
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
            message = [...message, newAssistantMessage];
        }, 200);
    };
</script>

<Chat bind:chats={message} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps}>
    {#snippet fullChatBox(props)}
        <div class={props.class}>
            <div style="display: flex; flex-direction: column; row-gap: 4px;{props.message.role === 'user' ? ' align-items: end' : ''}">
                {#if props.message.role !== 'user'}
                    <span style={titleStyle}>
                        <Avatar alt="" shape="square" size="extra-small" src={props.role.avatar} />
                        {@render props.defaultNodes.title()}
                    </span>
                {/if}
                <div style="width: fit-content">
                    {@render props.defaultNodes.content()}
                </div>
                {@render props.defaultNodes.action()}
            </div>
        </div>
    {/snippet}
</Chat>
