<script lang="ts">
    import { getNavContext } from './context.js';
    import type { NavItemProps, NavWrapperArgs } from './interface.js';
    import ItemShell from './item-shell.svelte';
    import WrapperOutlet from './wrapper-outlet.svelte';

    // Left undefined when not passed, so `selectedItems` and `wrapper` carry only what the item was given
    let { disabled, indent, isCollapsed, itemKey, level: ownLevel, link, linkOptions, text, tooltipHideDelay, tooltipShowDelay, label, icon, toggleIcon, onClick, ...rest }: NavItemProps = $props();

    const ctx = getNavContext('Nav.Item');

    const level = $derived(ownLevel ?? ctx.level);
    const given: NavWrapperArgs['props'] = $derived(Object.fromEntries(Object.entries({ disabled, indent, isCollapsed, itemKey, level: ownLevel, link, linkOptions, text, tooltipHideDelay, tooltipShowDelay }).filter(([, value]) => value !== undefined)));

    // onSelect reports everything the item was given, snippets and the rest included
    const reported = $derived(Object.fromEntries(Object.entries({ ...given, label, icon, toggleIcon, onClick, ...rest }).filter(([, value]) => value !== undefined)));
</script>

{#snippet itemElement()}
    <ItemShell {...rest} {disabled} {icon} {indent} {isCollapsed} isInSubNav={ctx.isInSubNav} {itemKey} {label} {level} {link} {linkOptions} onItemClick={onClick} {reported} {text} {toggleIcon} {tooltipHideDelay} {tooltipShowDelay} />
{/snippet}

<WrapperOutlet isInSubNav={ctx.isInSubNav} isSubNav={false} {itemElement} itemProps={given} />
