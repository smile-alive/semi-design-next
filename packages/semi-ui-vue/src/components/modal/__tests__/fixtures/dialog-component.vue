<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import Modal from '../../modal.vue';

    const visible = ref(false);
    const hide = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">show dialog</Button>
    <Modal v-model:visible="visible" :onOk="hide" title="对话框标题">
        <input aria-label="name" autofocus />
        <p>basic modal</p>
        <Button @click="hide">hide dialog</Button>
    </Modal>
</template>
