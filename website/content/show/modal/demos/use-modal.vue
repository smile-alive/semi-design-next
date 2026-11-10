<script setup lang="ts">
    import { Button, ConfigProvider, Modal } from '@fibrae/semi-ui-vue';
    import { en_US } from '@fibrae/semi-ui-vue/locale';

    const [modal, Holder] = Modal.useModal();
    const config = { title: 'This is a success message', content: 'Context consumer' };
</script>

<template>
    <ConfigProvider :locale="en_US">
        <div>
            <Button @click="modal.confirm(config)">Confirm Modal</Button>
        </div>
        <Holder />
    </ConfigProvider>
</template>
