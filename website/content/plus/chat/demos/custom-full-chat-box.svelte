<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { Avatar } from '@fibrae/semi-ui-svelte';

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
    const titleStyle = 'display: flex; align-items: center; justify-content: center; column-gap: 10px; padding: 5px 0px; width: fit-content';

    let id = 0;
    const getId = () => `id-${id++}`;

    let messages = $state<ChatMessage[]>([
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
            messages = [...messages, newAssistantMessage];
        }, 200);
    };
</script>

<Chat bind:chats={messages} {onMessageSend} {roleConfig} style="border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px" {uploadProps}>
    {#snippet fullChatBox({ role, message, defaultNodes, class: boxClass })}
        <div class={boxClass}>
            <div style="display: flex; flex-direction: column; row-gap: 4px;{message.role === 'user' ? ' align-items: end' : ''}">
                {#if message.role !== 'user'}
                    <span style={titleStyle}>
                        <Avatar alt="" shape="square" size="extra-small" src={role.avatar} />
                        {@render defaultNodes.title()}
                    </span>
                {/if}
                <div style="width: fit-content">
                    {@render defaultNodes.content()}
                </div>
                {@render defaultNodes.action()}
            </div>
        </div>
    {/snippet}
</Chat>
