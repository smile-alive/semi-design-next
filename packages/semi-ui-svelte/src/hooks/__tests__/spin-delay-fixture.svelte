<script lang="ts">
    import useSpinDelay from '../use-spin-delay.svelte';

    let { store }: { store: { loading: boolean } } = $props();

    const spin = useSpinDelay(() => store.loading);
</script>

<p>{spin.visible ? 'spinner' : 'idle'}</p>
