<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
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

    const defaultMessages: Message[] = [
        {
            role: 'system',
            id: '1',
            createdAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
        {
            role: 'user',
            id: '2',
            createdAt: 1715676751919,
            content: '给一个 Semi Design 的 Button 组件的使用示例',
        },
        {
            role: 'assistant',
            id: '3',
            createdAt: 1715676751919,
            content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
        },
    ];

    let messages = $state<Message[]>(defaultMessages);
</script>

<AIChatDialogue align="leftRight" bind:chats={messages} mode="bubble" {roleConfig}>
    {#snippet title(title)}
        <div class="semi-ai-chat-dialogue-title">My-{title.role?.name}</div>
    {/snippet}
    {#snippet avatar(avatar)}
        <Avatar alt="" shape="square" size="extra-small" src={avatar.role?.avatar} />
    {/snippet}
    {#snippet action(action)}
        <div class={action.class}>
            {@render action.defaultActions[0]?.()}
        </div>
    {/snippet}
</AIChatDialogue>
