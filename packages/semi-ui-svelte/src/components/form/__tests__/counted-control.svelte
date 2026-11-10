<script lang="ts">
    import { watch } from '@fibrae/semi-ui-svelte/hooks/index';

    let { value = $bindable(), onUpdate }: { value?: unknown; onUpdate?: (value: unknown) => void } = $props();

    watch(
        () => value,
        (next) => onUpdate?.(next)
    );
</script>

<input readonly value={(value as string | undefined) ?? ''} />
