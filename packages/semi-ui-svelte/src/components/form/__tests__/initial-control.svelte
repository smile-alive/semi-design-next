<script lang="ts">
    import { untrack } from 'svelte';

    let { value = $bindable(), onCreate }: { value?: unknown; onCreate?: (value: unknown) => void } = $props();

    untrack(() => onCreate?.(value));
</script>

<input data-value={JSON.stringify(value)} readonly />
