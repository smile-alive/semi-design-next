<script setup lang="ts">
    import Chat from '../..';

    const chats = [{ role: 'assistant', id: '1', content: 'answer' }];
    const roleConfig = { assistant: { name: 'Assistant', avatar: 'https://semi.design/assistant.png' } };
</script>

<template>
    <Chat :chats="chats" :roleConfig="roleConfig">
        <template #avatar />
        <template #title="{ role }">
            <b class="custom-title">{{ role.name }}</b>
        </template>
    </Chat>
</template>
