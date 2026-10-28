<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">自定义按钮文字</Button>
    <Modal v-model:visible="visible" cancelText="No, thanks." okText="Sounds great!" title="自定义按钮文字" @ok="close">
        <p>This is a modal with customized button texts.</p>
        <p>More content...</p>
    </Modal>
</template>
