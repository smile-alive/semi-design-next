<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';

    const opts = {
        title: 'Hi',
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        stack: true,
    };
</script>

<Button onclick={() => Notification.info(opts)}>Click multiple times</Button>
