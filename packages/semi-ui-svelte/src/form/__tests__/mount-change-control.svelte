<script lang="ts">
    import { onMount } from 'svelte';
    import watch from '../../_base/watch.svelte';

    // Reports a change from its onMount, before the field registers, and again whenever emittedValue changes
    let { value = $bindable(), emittedValue, onChange }: { value?: unknown; emittedValue: string; onChange?: (value: string) => void } = $props();

    watch(
        () => emittedValue,
        (next) => onChange?.(next)
    );

    onMount(() => onChange?.(emittedValue));
</script>

<input readonly value={(value as string | undefined) ?? ''} />
