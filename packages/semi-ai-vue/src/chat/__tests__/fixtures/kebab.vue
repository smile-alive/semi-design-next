<script setup lang="ts">
    import Chat from '../..';

    const chats = [
        { role: 'user', id: '1', content: 'question' },
        { role: 'assistant', id: '2', content: 'answer', status: 'loading' as const },
    ];
    const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
</script>

<template>
    <Chat :chats="chats" :enable-upload="false" :role-config="roleConfig" show-clear-context show-stop-generate />
</template>
