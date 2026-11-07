<script lang="ts">
    import { Progress } from '../index';
    import type { ProgressProps } from '../interface';

    type Props = ProgressProps & { withFormat?: boolean };

    let { store }: { store: Props } = $props();

    const view: Props = $derived(store);
</script>

{#snippet points({ percent }: { percent: number })}
    <span>{percent} pts</span>
{/snippet}

<Progress {...view} format={view.withFormat ? points : undefined} />
