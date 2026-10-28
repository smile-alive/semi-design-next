<script setup lang="ts">
    import { ref } from 'vue';
    import Tag from '../../tag.vue';

    const visible = ref<boolean>(true);
</script>

<template>
    <Tag v-model:visible="visible" closable>semi</Tag>
    <span data-visible>{{ visible }}</span>
</template>
