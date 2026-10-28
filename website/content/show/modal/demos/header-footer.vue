<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
</script>

<template>
    <Button @click="visible = true">自定义页脚样式</Button>
    <Modal v-model:visible="visible" title="自定义页脚">
        <p>This is a modal with a customized footer.</p>
        <p>More content...</p>
        <template #footer>
            <Button type="primary" @click="visible = false">Yes, I Understand</Button>
        </template>
    </Modal>
</template>
