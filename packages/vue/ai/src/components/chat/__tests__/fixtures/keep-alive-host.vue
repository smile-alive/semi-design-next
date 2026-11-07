<script setup lang="ts">
    import { ref } from 'vue';
    import Chat from '../..';

    const shown = ref(true);
    const chats = [
        { role: 'user', id: '1', content: 'question' },
        { role: 'assistant', id: '2', content: 'answer' },
    ];
    const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
</script>

<template>
    <button type="button" @click="shown = !shown">toggle</button>
    <KeepAlive>
        <Chat v-if="shown" :chats="chats" :roleConfig="roleConfig" />
        <span v-else>away</span>
    </KeepAlive>
</template>
