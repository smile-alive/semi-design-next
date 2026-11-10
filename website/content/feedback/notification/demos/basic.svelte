<script lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-svelte';
</script>

<Button
    onclick={() =>
        Notification.open({
            title: 'Hi, Semi',
            content: 'ies dance dance dance',
            duration: 3,
        })}
>
    Display Notification
</Button>
