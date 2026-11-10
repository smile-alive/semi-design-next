<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { IconForward, IconMoreStroked } from '@fibrae/semi-icons-svelte';
    import { Button, Dropdown, type DropdownMenuItem } from '@fibrae/semi-ui-svelte';

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

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const menu: DropdownMenuItem[] = [{ node: 'item', name: '分享' }];

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
            message = [...message, newAssistantMessage];
        }, 200);
    };
</script>

<Chat bind:chats={message} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps}>
    {#snippet action(props)}
        <span class={props.class}>
            {#each props.defaultActions as defaultAction, index (index)}
                {@render defaultAction()}
            {/each}
            <Dropdown {menu} position="top" trigger="click">
                {#snippet menuIcon()}
                    <IconForward />
                {/snippet}
                {#snippet child(childArgs)}
                    <Button {...childArgs.props} aria-label="更多" class="semi-chat-chatBox-action-btn" theme="borderless" type="tertiary">
                        {#snippet icon()}
                            <IconMoreStroked />
                        {/snippet}
                    </Button>
                {/snippet}
            </Dropdown>
        </span>
    {/snippet}
</Chat>
