<script lang="ts">
    import useScrollLock from '../use-scroll-lock.svelte';

    let { store }: { store: { locked: boolean } } = $props();

    useScrollLock(() => store.locked);
</script>
