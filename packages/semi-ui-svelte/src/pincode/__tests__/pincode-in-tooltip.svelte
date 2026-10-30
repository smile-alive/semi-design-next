<script lang="ts">
    import Tooltip from '../../tooltip/tooltip.svelte';
    import PinCode from '../pincode.svelte';
</script>

{#snippet content()}tip{/snippet}

<Tooltip {content} motion={false}>
    <PinCode count={2} />
</Tooltip>
