<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { Toast } from '../index';
    import type { ToastHookApi } from '../interface';
    import { setReachable } from './reachable';
    import ReachableText from './reachable-text.svelte';

    let { onApi, reachable }: { onApi: (api: ToastHookApi, reachableContent: Snippet) => void; reachable?: string } = $props();

    const toast = Toast.useToast();

    // Both props are read once at setup, as the test hands them over before rendering
    untrack(() => {
        if (reachable !== undefined) setReachable(reachable);
        onApi(toast, reach);
    });
</script>

{#snippet reach()}<ReachableText />{/snippet}
