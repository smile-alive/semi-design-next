<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { Modal } from '../index';
    import type { ModalHookApi } from '../interface';
    import { setReachable } from './reachable';
    import ReachableText from './reachable-text.svelte';

    let { onApi, reachable }: { onApi: (api: ModalHookApi, reachableContent: Snippet) => void; reachable?: string } = $props();

    // Read once at setup: useModal takes the contexts as they are when it is called
    untrack(() => {
        if (reachable !== undefined) setReachable(reachable);
    });

    const modal = Modal.useModal();

    untrack(() => onApi(modal, reach));
</script>

{#snippet reach()}<ReachableText />{/snippet}
