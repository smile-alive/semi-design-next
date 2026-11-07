<script setup lang="ts">
    import { ref } from 'vue';
    import Chat from '../..';
    import type { ChatMessage } from '../../interface';

    const chats = ref<ChatMessage[]>([
        { role: 'user', id: '1', content: 'question' },
        { role: 'assistant', id: '2', content: 'answer' },
    ]);
    const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
</script>

<template>
    <span data-testid="like">{{ String(chats[1]?.like ?? false) }}</span>
    <Chat v-model:chats="chats" :roleConfig="roleConfig" />
</template>
