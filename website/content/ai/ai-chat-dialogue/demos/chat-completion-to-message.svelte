<script lang="ts">
    import { AIChatDialogue, chatCompletionToMessage } from '@fibrae/semi-ai-svelte';

    const CHAT_COMPLETION_DATA = {
        id: 'chatcmpl-B9MBs8CjcvOU2jLn4n570S5qMJKcT',
        object: 'chat.completion',
        created: 1741569952,
        model: 'gpt-4.1-2025-04-14',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Hello! How can I assist you today?',
                    refusal: null,
                    annotations: [],
                    tool_calls: [
                        {
                            id: 'call_abc123',
                            type: 'function',
                            function: {
                                name: 'get_current_weather',
                                arguments: '{\n"location": "Boston, MA"\n}',
                            },
                        },
                    ],
                },
                logprobs: null,
                finish_reason: 'stop',
            },
        ],
        // ...
    };

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

    let messages = $state(chatCompletionToMessage(CHAT_COMPLETION_DATA));
</script>

<AIChatDialogue align="leftRight" bind:chats={messages} mode="bubble" {roleConfig} />
