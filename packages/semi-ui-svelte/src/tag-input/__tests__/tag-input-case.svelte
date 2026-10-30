<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import type { TagInputProps } from '../interface';
    import TagInput from '../tag-input.svelte';

    type SlotName = 'prefix' | 'suffix' | 'insetLabel';
    // 'icon' renders a Semi icon, 'node' a custom element, anything else is the text
    interface Case {
        props?: TagInputProps;
        slots?: Partial<Record<SlotName, string>>;
        clearIcon?: boolean;
        // 'text' replaces a tag with a span, 'button' with a button that closes it, 'none' with nothing
        tag?: 'text' | 'button' | 'none';
        // the component instance, for the handle methods
        handle?: { current?: ReturnType<typeof TagInput> };
        // a button after the input, to move the focus out
        after?: boolean;
    }

    let { store }: { store: Case } = $props();

    // A snippet is passed only when the case asks for it: an absent snippet is what leaves a slot out
    const slots = $derived({
        ...(store.slots?.prefix ? { prefix } : {}),
        ...(store.slots?.suffix ? { suffix } : {}),
        ...(store.slots?.insetLabel ? { insetLabel } : {}),
        ...(store.clearIcon ? { clearIcon } : {}),
        ...(store.tag ? { tag } : {}),
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
{#snippet insetLabel()}{@render content(store.slots?.insetLabel)}{/snippet}
{#snippet clearIcon()}<span class="custom-clear-icon">X</span>{/snippet}

{#snippet tag({ value, index, onClose }: { value: string; index: number; onClose: (event?: Event) => void })}
    {#if store.tag === 'text'}
        <span class="custom-tag-item">{value}</span>
    {:else if store.tag === 'button'}
        <button type="button" onclick={onClose}>{index}:{value}</button>
    {/if}
{/snippet}

<TagInput bind:this={() => store.handle?.current, (instance) => store.handle && (store.handle.current = instance)} {...store.props} {...slots} />
{#if store.after}
    <button type="button">after</button>
{/if}
