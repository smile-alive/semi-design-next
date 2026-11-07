<script setup lang="ts">
    import { ref } from 'vue';
    import Chat from '../..';

    const show = ref(false);
</script>

<template>
    <button data-testid="toggle" type="button" @click="show = !show">toggle</button>
    <Chat :chats="[]">
        <template v-if="show" #uploadTip>tip text</template>
    </Chat>
</template>
