<script lang="ts">
    import type { ComponentProps } from 'svelte';
    import ContractProbe from './contract-probe.svelte';

    let { store, hooks }: { store: { label: string; theme: string }; hooks: ComponentProps<typeof ContractProbe>['hooks'] } = $props();
</script>

<ContractProbe {hooks} label={store.label} theme={store.theme} />
