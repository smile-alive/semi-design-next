<script lang="ts">
    import { onMount } from 'svelte';
    import type { NoticeHandle } from '../interface';
    import Notice from '../notice.svelte';

    let { onHandle, onRemove }: { onHandle: (handle: NoticeHandle) => void; onRemove: (id: string) => void } = $props();

    let item = $state<NoticeHandle>();

    onMount(() => {
        if (item) onHandle(item);
    });
</script>

<Notice bind:this={item} close={onRemove} duration={1} id="r" placement="topRight" title="ref" />
