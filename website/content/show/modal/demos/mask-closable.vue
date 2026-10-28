<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">点击遮罩层不可关闭</Button>
    <Modal v-model:visible="visible" :maskClosable="false" title="对话框标题" @ok="close">
        <p>This is a modal that cannot be closed by clicking on the mask.</p>
        <p>More content...</p>
    </Modal>
</template>
