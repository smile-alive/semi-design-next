<script lang="ts">
    import { getConfigContext } from '../context';
    import type { ContextValue } from '../interface';

    let { onSeen }: { onSeen?: (value: ContextValue) => void } = $props();

    const config = getConfigContext();

    $effect(() => {
        onSeen?.({ ...config });
    });
</script>

<span data-testid="config">{JSON.stringify({ ...config, getPopupContainer: undefined, onBreakpoint: undefined })}</span>
