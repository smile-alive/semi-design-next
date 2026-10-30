<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
    };
</script>

<Button onclick={() => Notification.info(opts)}>Close After 10s</Button>
