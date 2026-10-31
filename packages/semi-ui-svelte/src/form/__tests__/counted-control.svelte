<script lang="ts">
    import watch from '../../_base/watch.svelte';

    let { value = $bindable(), onUpdate }: { value?: unknown; onUpdate?: (value: unknown) => void } = $props();

    watch(
        () => value,
        (next) => onUpdate?.(next)
    );
</script>

<input readonly value={(value as string | undefined) ?? ''} />
