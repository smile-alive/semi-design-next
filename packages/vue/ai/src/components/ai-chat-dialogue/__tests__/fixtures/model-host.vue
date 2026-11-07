<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import AIChatDialogue from '../..';
    import type { Message } from '../../interface';

    const chats = ref<Message[]>([
        { id: '1', role: 'user', content: 'hello', status: 'completed' },
        { id: '2', role: 'assistant', content: 'world', status: 'completed' },
    ]);
    const shown = reactive({ avatar: false, title: true, content: false, action: false, fullDialogue: false });
    const parts = Object.keys(shown) as (keyof typeof shown)[];
    const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
</script>

<template>
    <button v-for="part in parts" :key="part" type="button" @click="shown[part] = !shown[part]">
        {{ `toggle ${part}` }}
    </button>
    <span data-testid="count">{{ chats.length }}</span>
    <AIChatDialogue v-model:chats="chats" :hints="['hint']" :roleConfig="roleConfig">
        <template v-if="shown.avatar" #avatar="{ message }">
            <span class="custom-avatar">{{ message.id }}</span>
        </template>
        <template v-if="shown.title" #title="{ message }">
            <span class="custom-title">{{ message.id }}</span>
        </template>
        <template v-if="shown.content" #content="{ message }">
            <span class="custom-content">{{ message.id }}</span>
        </template>
        <template v-if="shown.action" #action="{ message }">
            <span class="custom-action">{{ message.id }}</span>
        </template>
        <template v-if="shown.fullDialogue" #fullDialogue="{ message }">
            <div class="custom-full">{{ message.id }}</div>
        </template>
        <template #messageText="{ text }">
            <em class="custom-text">{{ text }}</em>
        </template>
    </AIChatDialogue>
</template>
