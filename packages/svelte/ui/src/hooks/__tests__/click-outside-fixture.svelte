<script lang="ts">
    import useClickOutside from '../use-click-outside.svelte';

    let { store }: { store: { enabled: boolean; log: string[] } } = $props();

    let target = $state<HTMLElement>();
    let popup = $state<HTMLElement>();

    useClickOutside(
        [() => target],
        (event) => store.log.push(`outside ${event instanceof MouseEvent}`),
        () => store.enabled,
        () => [popup]
    );
</script>

<div bind:this={target} data-testid="target"><span>inside</span></div>
<div bind:this={popup} data-testid="popup"><span>nested</span></div>
<p>outside</p>
