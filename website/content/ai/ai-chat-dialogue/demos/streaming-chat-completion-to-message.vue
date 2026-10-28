<script setup lang="ts">
    import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
    import { AIChatDialogue, streamingChatCompletionToMessage, type AIChatDialogueMessage as Message, type StreamingChatState } from '@fibrae/semi-ai-vue';

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

    const STREAMING_CHAT_COMPLETION_DATA = [
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { role: 'assistant', content: '', refusal: null }, finish_reason: null }],
            obfuscation: 'ahPqlzj6DD',
        },
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { content: '' }, finish_reason: null }],
            obfuscation: 'i2PXRIwvc3D',
        },
        // index 0: output text delta
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { content: '我正在使用 ' }, finish_reason: null }],
            obfuscation: '3sslO5QylW',
        },
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { content: 'streamingChatCompletionToMessage' }, finish_reason: null }],
            obfuscation: '3sslO5QylW',
        },

        // index 1: tool call delta (function_call / tool_calls)
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011845,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [
                {
                    index: 1,
                    delta: {
                        tool_calls: [{ index: 0, id: 'call_1', function: { name: 'searchWeather', arguments: '{"city":"北京"' } }],
                    },
                    finish_reason: null,
                },
            ],
            obfuscation: 'T1',
        },
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011846,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [
                {
                    index: 1,
                    delta: { tool_calls: [{ index: 0, function: { arguments: ',"day":"today"}' } }] },
                    finish_reason: null,
                },
            ],
            obfuscation: 'T2',
        },

        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011844,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { content: ' 转换 Chat Completion Chunks' }, finish_reason: null }],
            obfuscation: 'X1',
        },
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011844,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: { content: ' 🥳' }, finish_reason: null }],
            obfuscation: 'X2',
        },

        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
            obfuscation: 'n13SLf',
        },
        {
            id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT',
            object: 'chat.completion.chunk',
            created: 1760011843,
            model: 'o3-mini-2025-01-31',
            service_tier: 'default',
            system_fingerprint: 'fp_6c43dcef8c',
            choices: [{ index: 1, delta: {}, finish_reason: 'stop' }],
            obfuscation: 'jt9rDb',
        },
    ];

    const messages = shallowRef<Message[]>([]);
    let timer: ReturnType<typeof setInterval> | undefined;

    onMounted(() => {
        const total = STREAMING_CHAT_COMPLETION_DATA.length;
        let i = 1;
        let state: StreamingChatState | undefined;

        timer = setInterval(() => {
            if (i > total) {
                clearInterval(timer);
                return;
            }

            const slice = STREAMING_CHAT_COMPLETION_DATA.slice(0, i);
            const { messages: partialMessages, state: nextState } = streamingChatCompletionToMessage(slice, state);
            state = nextState;

            messages.value = [partialMessages[0]];

            i += 1;
        }, 100);
    });

    onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
    <AIChatDialogue v-model:chats="messages" align="leftRight" mode="bubble" :roleConfig="roleConfig" />
</template>
