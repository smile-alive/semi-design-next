<script lang="ts">
    import type { Snippet } from 'svelte';

    // Lists the props it receives besides its own, to show which of the field's props reach the wrapped component
    let { value = $bindable(), onChange, children, suffix, ...others }: { value?: string; onChange?: (value: string) => void; children?: Snippet; suffix?: Snippet; [key: string]: unknown } = $props();
</script>

<div class="slotted" data-value={value ?? ''}>
    {@render children?.()}
    {@render suffix?.()}
</div>
<output data-testid="received">{Object.keys(others).toSorted().join(',')}</output>
