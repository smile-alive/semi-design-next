<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
    import { IconArrowRight } from '@fibrae/semi-icons-svelte';

    const hintStyle = 'border: 1px solid var(--semi-color-border); padding: 10px; border-radius: 10px; background-color: transparent; color: var(--semi-color-text-1); display: flex; justify-content: space-between; align-items: center; cursor: pointer; font: inherit; font-size: 14px';

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

    let messages = $state<Message[]>([
        {
            role: 'assistant',
            id: '1',
            createdAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
        },
    ]);
    let hints = $state(['Semi 组件库有哪些常用组件？', '能否展示一个使用 Semi 组件库构建的页面示例？', 'Semi 组件库有官方文档吗？']);
</script>

<AIChatDialogue align="leftRight" bind:chats={messages} {hints} mode="bubble" onHintClick={() => (hints = [])} {roleConfig}>
    {#snippet hintBox({ content, onHintClick })}
        <button style={hintStyle} type="button" onclick={onHintClick}>
            {content}
            <IconArrowRight style="margin-left: 10px" />
        </button>
    {/snippet}
</AIChatDialogue>
