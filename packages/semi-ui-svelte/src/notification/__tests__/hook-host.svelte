<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { Notification } from '../index';
    import type { NotificationHookApi } from '../interface';
    import { setReachable } from './reachable';
    import ReachableText from './reachable-text.svelte';

    let { onApi, reachable }: { onApi: (api: NotificationHookApi, reachableContent: Snippet) => void; reachable?: string } = $props();

    const notification = Notification.useNotification();

    // Both props are read once at setup, as the test hands them over before rendering
    untrack(() => {
        if (reachable !== undefined) setReachable(reachable);
        onApi(notification, reach);
    });
</script>

{#snippet reach()}<ReachableText />{/snippet}
