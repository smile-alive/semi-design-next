<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        content: 'Not auto close',
        title: 'Hi',
        duration: 0,
    };
    const ids: string[] = [];

    const show = () => {
        ids.push(Notification.info(opts));
    };

    const hide = () => {
        const first = ids.shift();
        if (first) {
            Notification.close(first);
        }
    };
</script>

<Button type="primary" onclick={show}>Show Notification</Button>
<br />
<br />
<Button type="primary" onclick={hide}>Hide Notification</Button>
