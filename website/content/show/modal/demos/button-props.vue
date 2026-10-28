<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">自定义按钮属性</Button>
    <Modal v-model:visible="visible" :cancelButtonProps="{ size: 'small', disabled: true }" :okButtonProps="{ size: 'small', type: 'warning' }" title="自定义按钮属性" @ok="close">
        <p>This is a modal with customized button props.</p>
        <p>More content...</p>
    </Modal>
</template>
