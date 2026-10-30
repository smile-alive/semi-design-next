<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import Input from '../input.svelte';
    import type { InputProps } from '../interface';

    type SlotName = 'prefix' | 'suffix' | 'addonBefore' | 'addonAfter' | 'insetLabel' | 'clearIcon';
    // 'icon' renders a Semi icon, 'node' a custom element, anything else is the text
    interface Case {
        props?: InputProps;
        slots?: Partial<Record<SlotName, string>>;
        // the component instance, for the handle methods
        handle?: { current?: ReturnType<typeof Input> };
    }

    let { store }: { store: Case } = $props();

    // A snippet is passed only when the case asks for it: an absent snippet is what leaves a slot out
    const slots = $derived({
        ...(store.slots?.prefix ? { prefix } : {}),
        ...(store.slots?.suffix ? { suffix } : {}),
        ...(store.slots?.addonBefore ? { addonBefore } : {}),
        ...(store.slots?.addonAfter ? { addonAfter } : {}),
        ...(store.slots?.insetLabel ? { insetLabel } : {}),
        ...(store.slots?.clearIcon ? { clearIcon } : {}),
    });
</script>

{#snippet content(kind: string | undefined)}
    {#if kind === 'icon'}
        <IconSearch />
    {:else if kind === 'node'}
        <b>x</b>
    {:else}
        {kind}
    {/if}
{/snippet}

{#snippet prefix()}{@render content(store.slots?.prefix)}{/snippet}
{#snippet suffix()}{@render content(store.slots?.suffix)}{/snippet}
{#snippet addonBefore()}{@render content(store.slots?.addonBefore)}{/snippet}
{#snippet addonAfter()}{@render content(store.slots?.addonAfter)}{/snippet}
{#snippet insetLabel()}{@render content(store.slots?.insetLabel)}{/snippet}
{#snippet clearIcon()}<span class="custom-clear-icon">X</span>{/snippet}

<Input bind:this={() => store.handle?.current, (instance) => store.handle && (store.handle.current = instance)} {...store.props} {...slots} />
