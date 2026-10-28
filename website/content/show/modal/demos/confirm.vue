<script setup lang="ts">
    import { h } from 'vue';
    import { IconSend } from '@fibrae/semi-icons-vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const success = () => Modal.success({ title: 'This is a success message', content: 'bla bla bla...' });
    const info = () => Modal.info({ title: 'Here is some info', content: 'bla bla bla...' });
    const error = () => Modal.error({ title: 'Unfortunately, there is an error', content: 'bla bla bla...' });
    const warning = () => Modal.warning({ title: 'Warning: be cautious ahead', content: 'bla bla bla...' });
    const confirm = () => Modal.confirm({ title: 'Are you sure ?', content: 'bla bla bla...' });
    const custom = () =>
        Modal.info({
            title: 'This is a custom modal',
            content: 'bla bla bla...',
            icon: h(IconSend),
            cancelButtonProps: { theme: 'borderless' },
            okButtonProps: { theme: 'solid' },
        });
</script>

<template>
    <div>
        <Button @click="info">Info</Button>
        <br />
        <br />
        <Button @click="success">Success</Button>
        <br />
        <br />
        <Button type="danger" @click="error">Error</Button>
        <br />
        <br />
        <Button type="warning" @click="warning">Warning</Button>
        <br />
        <br />
        <Button type="primary" @click="confirm">Confirm</Button>
        <br />
        <br />
        <Button @click="custom">Custom</Button>
    </div>
</template>
