<script lang="ts">
    import InputNumber from '../input-number.svelte';
    import type { InputNumberProps } from '../interface';

    let {
        store,
        onHandle,
    }: {
        store: { props: InputNumberProps; slots: boolean };
        onHandle?: (handle?: ReturnType<typeof InputNumber>) => void;
    } = $props();

    let handle = $state<ReturnType<typeof InputNumber>>();

    $effect(() => {
        onHandle?.(handle);
    });
</script>

{#snippet prefix()}$
{/snippet}
{#snippet suffix()}USD{/snippet}
{#snippet insetLabel()}Amount{/snippet}
{#snippet addonBefore()}before{/snippet}
{#snippet addonAfter()}after{/snippet}

{#if store.slots}
    <InputNumber {addonAfter} {addonBefore} bind:this={handle} {...store.props} {insetLabel} {prefix} {suffix} />
{:else}
    <InputNumber bind:this={handle} {...store.props} />
{/if}
