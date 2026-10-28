<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">打开全屏弹窗</Button>
    <Modal v-model:visible="visible" fullScreen title="全屏对话框标题" @ok="close">
        <p>This is a full screen modal</p>
        <p>More content...</p>
    </Modal>
</template>
