<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { NavItemType } from '@fibrae/semi-foundation/navigation/foundation';
    import type { NavExpandIconArgs, NavIconArgs, NavItemConfig, NavItemRenderProps, SubDropdownProps } from './interface.js';
    import NavItem from './nav-item.svelte';
    // the template recurses through its own file
    import NavItems from './nav-items.svelte';
    import SubNav from './sub-nav.svelte';

    interface NavItemsProps {
        items: NavItemType[];
        level: number;
        subDropdownProps?: SubDropdownProps;
        icon?: Snippet<[NavItemRenderProps & NavIconArgs]>;
        text?: Snippet<[NavItemRenderProps]>;
        toggleIcon?: Snippet<[NavItemRenderProps & NavIconArgs]>;
        expandIcon?: Snippet<[NavItemRenderProps & NavExpandIconArgs]>;
    }

    let { items, level, subDropdownProps, icon, text, toggleIcon, expandIcon }: NavItemsProps = $props();

    const ITEM_KEYS = new Set(['itemKey', 'text', 'disabled', 'indent', 'link', 'linkOptions', 'tooltipShowDelay', 'tooltipHideDelay']);
    const SUB_KEYS = new Set(['itemKey', 'text', 'disabled', 'indent', 'dropdownStyle', 'dropdownProps']);
    const LI_KEYS = new Set(['class', 'style', 'onmouseenter', 'onmouseleave']);

    // An entry may carry app data (e.g. `path`); only the declared keys, li attributes, data-* and aria-* reach the item
    const pick = (item: NavItemType, keys: ReadonlySet<string>) => Object.fromEntries(Object.entries(item).filter(([key]) => keys.has(key) || LI_KEYS.has(key) || /^(data|aria)-/.test(key)));

    const isSub = (item: NavItemType) => Array.isArray(item.items) && item.items.length > 0;

    // 0 and '' are valid keys; the prefix keeps an entry without one from colliding with a real key
    const keyOf = (item: NavItemType, index: number) => (item.itemKey == null ? `index:${index}` : `key:${typeof item.itemKey}:${item.itemKey}`);
</script>

{#each items as item, index (keyOf(item, index))}
    {@const data = { item: item as NavItemConfig, level }}
    {#snippet entryIcon(args: NavIconArgs)}
        {@render icon?.({ ...data, ...args })}
    {/snippet}
    {#snippet entryToggleIcon(args: NavIconArgs)}
        {@render toggleIcon?.({ ...data, ...args })}
    {/snippet}
    {#snippet entryExpandIcon(args: NavExpandIconArgs)}
        {@render expandIcon?.({ ...data, ...args })}
    {/snippet}
    {#snippet entryText()}
        {@render text?.(data)}
    {/snippet}
    {#if isSub(item)}
        <SubNav {...pick(item, SUB_KEYS)} expandIcon={expandIcon ? entryExpandIcon : undefined} icon={icon ? entryIcon : undefined} label={text ? entryText : undefined} {subDropdownProps}>
            <NavItems {expandIcon} {icon} items={item.items!} level={level + 1} {subDropdownProps} {text} {toggleIcon} />
        </SubNav>
    {:else}
        <NavItem {...pick(item, ITEM_KEYS)} icon={icon ? entryIcon : undefined} label={text ? entryText : undefined} toggleIcon={toggleIcon ? entryToggleIcon : undefined} />
    {/if}
{/each}
