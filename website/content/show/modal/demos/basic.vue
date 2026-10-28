<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const handleOk = () => {
        visible.value = false;
        console.log('Ok button clicked');
    };
    const handleCancel = () => {
        console.log('Cancel button clicked');
    };
    const handleAfterClose = () => {
        console.log('After Close callback executed');
    };
</script>

<template>
    <Button @click="visible = true">打开弹窗</Button>
    <Modal v-model:visible="visible" closeOnEsc title="基本对话框" @afterClose="handleAfterClose" @cancel="handleCancel" @ok="handleOk">
        This is the content of a basic modal.
        <br />
        More content...
    </Modal>
</template>
