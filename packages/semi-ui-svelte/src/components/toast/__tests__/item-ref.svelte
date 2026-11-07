<script lang="ts">
    import { onMount } from 'svelte';
    import ToastItem from '../toast.svelte';

    let { onHandle, onRemove }: { onHandle: (handle: { restartCloseTimer: () => void }) => void; onRemove: (id: string) => void } = $props();

    let item = $state<ReturnType<typeof ToastItem>>();

    onMount(() => {
        if (item) onHandle(item);
    });
</script>

<ToastItem bind:this={item} close={onRemove} content="ref" duration={1} id="r" />
