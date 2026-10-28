<script setup lang="ts">
    import Chat from '../..';

    // Type cases only: vue-tsc checks which listeners uploadProps accepts; no test mounts it
    const onSuccess = (_body: unknown) => undefined;
    const onError = (_error: unknown) => undefined;
</script>

<template>
    <Chat :chats="[]" :uploadProps="{ action: 'https://semi.design/upload', onError, onSuccess }" />
    <!-- @vue-expect-error not an Upload prop or listener -->
    <Chat :chats="[]" :uploadProps="{ onUnknown: onSuccess }" />
</template>
