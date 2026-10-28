<script setup lang="ts">
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import { Button, ConfigProvider, Modal } from '@fibrae/semi-ui-vue';

    const [modal, Holder] = Modal.useModal();
    const config = { title: 'This is a success message', content: 'Context consumer' };
</script>

<template>
    <ConfigProvider :locale="en_GB">
        <div>
            <Button @click="modal.confirm(config)">Confirm Modal</Button>
        </div>
        <Holder />
    </ConfigProvider>
</template>
