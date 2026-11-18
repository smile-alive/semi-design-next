<script lang="ts">
    import useHotKeys from '../use-hot-keys.svelte';

    let { store }: { store: { hotKeys: string[]; preventDefault: boolean; onHotKey: (e: KeyboardEvent) => void } } = $props();

    useHotKeys(
        () => store.hotKeys,
        (e) => store.onHotKey(e),
        () => ({ preventDefault: store.preventDefault })
    );
</script>
