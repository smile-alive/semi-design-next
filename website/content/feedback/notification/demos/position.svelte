<script lang="ts">
    import { Button, ButtonGroup, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        duration: 3,
        position: 'topRight',
        content: 'semi-ui-notification',
        title: 'Hi bytedance',
    } as const;
</script>

<ButtonGroup>
    <Button onclick={() => Notification.info({ ...opts, position: 'top' })}>top</Button>
    <Button onclick={() => Notification.info({ ...opts, position: 'topLeft' })}>topLeft</Button>
    <Button onclick={() => Notification.info(opts)}>topRight</Button>
</ButtonGroup>
<br />
<br />
<ButtonGroup>
    <Button onclick={() => Notification.info({ ...opts, position: 'bottom' })}>bottom</Button>
    <Button onclick={() => Notification.info({ ...opts, position: 'bottomRight' })}>bottomRight</Button>
    <Button onclick={() => Notification.info({ ...opts, position: 'bottomLeft' })}>bottomLeft</Button>
</ButtonGroup>
