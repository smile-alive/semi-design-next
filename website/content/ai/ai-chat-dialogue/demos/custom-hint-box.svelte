<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
    import { IconArrowRight } from '@fibrae/semi-icons-svelte';

    const commonHintStyle = 'border: 1px solid var(--semi-color-border); padding: 10px; border-radius: 10px; background-color: transparent; color: var(--semi-color-text-1); display: flex; justify-content: space-between; align-items: center; cursor: pointer; font: inherit; font-size: 14px';

    const defaultMessages: Message[] = [
        {
            role: 'assistant',
            id: '1',
            createdAt: 1715676751919,
            content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用，你可以向我提问任何关于 Semi 的问题。',
        },
    ];

    const hintsExample = ['Semi 组件库有哪些常用组件？', '能否展示一个使用 Semi 组件库构建的页面示例？', 'Semi 组件库有官方文档吗？'];

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

    let messages = $state<Message[]>(defaultMessages);
    let hints = $state(hintsExample);
</script>

<AIChatDialogue align="leftRight" bind:chats={messages} {hints} mode="bubble" onHintClick={() => (hints = [])} {roleConfig}>
    {#snippet hintBox(hintBox)}
        <button style={commonHintStyle} type="button" onclick={hintBox.onHintClick}>
            {hintBox.content}
            <IconArrowRight style="margin-inline-start: 10px" />
        </button>
    {/snippet}
</AIChatDialogue>
