<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';

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
            content: '请求成功',
        },
        {
            id: 'loading',
            role: 'assistant',
            status: 'in_progress', // renders like queued
        },
        {
            role: 'assistant',
            id: 'error',
            content: '请求错误',
            status: 'failed', // renders like cancelled
        },
    ]);
</script>

<AIChatDialogue bind:chats={messages} {roleConfig} />
