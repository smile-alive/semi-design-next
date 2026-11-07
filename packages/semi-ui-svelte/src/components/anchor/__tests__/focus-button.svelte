<script lang="ts">
    import Anchor from '../anchor.svelte';

    const { onConfirm }: { onConfirm: () => void } = $props();

    let button: HTMLButtonElement | undefined = $state();
</script>

<Anchor links={[{ href: '#nowhere', title: 'Section A' }]} onClick={() => button?.focus()} />
<button bind:this={button} type="button" onclick={() => onConfirm()}>confirm</button>
