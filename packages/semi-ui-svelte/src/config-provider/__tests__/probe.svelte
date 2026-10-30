<script lang="ts">
    import { getConfigContext } from '../context';
    import type { ContextValue } from '../interface';

    let { onSeen }: { onSeen?: (value: ContextValue) => void } = $props();

    const config = getConfigContext();

    // spreading reads every field, so the effect re-runs whenever any of them changes
    $effect(() => {
        onSeen?.({ ...config });
    });
</script>

<span data-testid="config">{JSON.stringify({ ...config, getPopupContainer: undefined, onBreakpoint: undefined })}</span>
