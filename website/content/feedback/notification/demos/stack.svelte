<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';
</script>

<Button
    onclick={() => {
        Notification.info({ title: 'Hi', content: 'Hi, Semi dance dance', duration: 10, stack: true });
    }}
>
    Click multiple times
</Button>
