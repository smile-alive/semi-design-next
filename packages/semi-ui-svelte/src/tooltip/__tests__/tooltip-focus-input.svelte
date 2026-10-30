<script lang="ts">
    import { Input } from '../../input';
    import Tooltip from '../tooltip.svelte';

    let input = $state<Input>();
</script>

<!-- a component hands over its handle, as a React ref does; an attachment on a component never reaches its control -->
{#snippet content({ initialFocusRef }: { initialFocusRef: (target: { focus: () => void }) => void })}
    <button type="button">first</button>
    <Input aria-label="inner" bind:this={input} />
    <i {@attach () => input && initialFocusRef(input)} hidden></i>
{/snippet}

<Tooltip {content} motion={false} trigger="click">trigger</Tooltip>
