<script lang="ts">
    import Portal from '../portal.svelte';
    import PortalEffectChild from './portal-effect-child.svelte';

    let { container, runs }: { container: HTMLElement; runs: boolean[] } = $props();
</script>

<Portal getPopupContainer={() => container}>
    <PortalEffectChild {container} {runs} />
</Portal>
