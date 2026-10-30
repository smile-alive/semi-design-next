<script lang="ts">
    import { IconHome } from '@fibrae/semi-icons-svelte';
    import type { NavProps, NavWrapperArgs } from '../interface';
    import Nav from '../nav.svelte';

    // `snippets` turns on the per-entry content snippets of `items`
    let { store }: { store: { props: NavProps; snippets: boolean; wrap: boolean } } = $props();
</script>

{#snippet icon({ level, size }: { level: number; size: 'large' | 'default' | 'small' | 'extra-small' | 'extra-large' | 'inherit' })}
    {#if level === 0}
        <IconHome data-testid="icon" {size} />
    {/if}
{/snippet}

{#snippet text({ item, level }: { item: { text?: string | number }; level: number })}
    <b data-level={level}>{item.text}!</b>
{/snippet}

{#snippet toggleIcon()}
    <u data-testid="toggle"></u>
{/snippet}

{#snippet expandIcon({ class: className }: { class?: string })}
    <s class={className} data-testid="expand"></s>
{/snippet}

{#snippet wrapper({ itemElement, isSubNav, isInSubNav, props }: NavWrapperArgs)}
    <div data-in-sub={isInSubNav} data-props={JSON.stringify(props)} data-sub={isSubNav} data-testid="wrapped">{@render itemElement()}</div>
{/snippet}

<Nav {...store.props} expandIcon={store.snippets ? expandIcon : undefined} icon={store.snippets ? icon : undefined} text={store.snippets ? text : undefined} toggleIcon={store.snippets ? toggleIcon : undefined} wrapper={store.wrap ? wrapper : undefined} />
