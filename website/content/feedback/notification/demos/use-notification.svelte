<script lang="ts">
    import { getContext, setContext } from 'svelte';
    import { Button, Notification, Space } from '@fibrae/semi-ui-svelte';

    const reachableKey = Symbol('reachable');
    setContext(reachableKey, 'Light');

    const notification = Notification.useNotification();
    const ids: string[] = [];

    const show = () => {
        ids.push(notification.info({ title: 'Hook Notification', content: reachable, duration: 0 }));
    };

    const hide = () => {
        const first = ids.shift();
        if (first) {
            notification.close(first);
        }
    };
</script>

<!-- The snippet renders inside the list mounted with this component's contexts, so it reads the context set above -->
{#snippet reachable()}ReachableContext: {getContext(reachableKey)}{/snippet}

<Space>
    <Button onclick={show}>Show Notification</Button>
    <Button onclick={hide}>Hide Notification</Button>
</Space>
