<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        title: 'Hi, Bytedance',
        content: 'Hi, Bytedance dance dance',
        duration: 3,
        theme: 'light',
    } as const;
</script>

<Button onclick={() => Notification.info(opts)}>Info</Button>
<br />
<br />
<Button onclick={() => Notification.success(opts)}>Success</Button>
<br />
<br />
<Button type="warning" onclick={() => Notification.warning(opts)}>Warning</Button>
<br />
<br />
<Button type="danger" onclick={() => Notification.error(opts)}>Error</Button>
