<script lang="ts">
    import { IconSend } from '@fibrae/semi-icons-svelte';
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    const success = () => Modal.success({ title: 'This is a success message', content: 'bla bla bla...' });
    const info = () => Modal.info({ title: 'Here is some info', content: 'bla bla bla...' });
    const error = () => Modal.error({ title: 'Unfortunately, there is an error', content: 'bla bla bla...' });
    const warning = () => Modal.warning({ title: 'Warning: be cautious ahead', content: 'bla bla bla...' });
    const confirm = () => Modal.confirm({ title: 'Are you sure ?', content: 'bla bla bla...' });
    const custom = () =>
        Modal.info({
            title: 'This is a custom modal',
            content: 'bla bla bla...',
            icon: sendIcon,
            cancelButtonProps: { theme: 'borderless' },
            okButtonProps: { theme: 'solid' },
        });
</script>

{#snippet sendIcon()}
    <IconSend />
{/snippet}

<div>
    <Button onclick={info}>Info</Button>
    <br />
    <br />
    <Button onclick={success}>Success</Button>
    <br />
    <br />
    <Button type="danger" onclick={error}>Error</Button>
    <br />
    <br />
    <Button type="warning" onclick={warning}>Warning</Button>
    <br />
    <br />
    <Button type="primary" onclick={confirm}>Confirm</Button>
    <br />
    <br />
    <Button onclick={custom}>Custom</Button>
</div>
