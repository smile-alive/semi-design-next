<script lang="ts">
    import type { RadioGroupProps } from '../interface';
    import RadioGroup from '../radio-group.svelte';
    import Radio from '../radio.svelte';

    // A group of radios A, B, C whose props come from a store; `snippets` switches to options with label and extra snippets
    let { store, snippets = false }: { store: { props: RadioGroupProps }; snippets?: boolean } = $props();
</script>

{#snippet label({ option, index }: { option: { label?: string | number }; index: number })}<i>{index}:{option.label}</i>{/snippet}
{#snippet extra({ option }: { option: { value?: unknown } })}<b>extra-{String(option.value)}</b>{/snippet}

{#if snippets}
    <RadioGroup {...store.props} {extra} {label} />
{:else}
    <RadioGroup {...store.props}>
        <Radio value="A">A</Radio>
        <Radio value="B">B</Radio>
        <Radio value="C">C</Radio>
    </RadioGroup>
{/if}
