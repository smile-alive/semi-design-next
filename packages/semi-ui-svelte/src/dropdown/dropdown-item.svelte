<script lang="ts">
    import { untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import { getItemRole } from '@fibrae/semi-foundation/dropdown/menu-foundation';
    import { IconTick } from '@fibrae/semi-icons-svelte';
    import { getDropdownContext, menuItems } from './context.js';
    import type { DropdownItemProps } from './interface.js';

    let { active = false, disabled = false, showTick, type, icon, children, ...rest }: DropdownItemProps = $props();

    const ctx = getDropdownContext();

    const prefix = cssClasses.PREFIX;
    const realShowTick = $derived(ctx ? ctx.view.showTick : showTick);
    const role = $derived(getItemRole(ctx?.view.selectionMode, realShowTick));
    const topLevel = $derived(ctx?.view.menuDepth === 1);

    // a disabled item takes no hover, context menu or click-like listener; the others (mousedown, keydown) stay
    const attrs = $derived.by(() => {
        const { onclick: _click, onmousedown: _mousedown, ...others } = rest;
        if (!disabled) {
            return others;
        }
        const { onmouseenter: _enter, onmouseleave: _leave, oncontextmenu: _menu, ...enabledOnly } = others;
        return Object.fromEntries(Object.entries(enabledOnly).filter(([key]) => !key.startsWith('onclick')));
    });

    // untracked: SvelteMap.set reads the map's version, and this effect would rerun on its own write
    const register: Attachment<HTMLElement> = (element) => {
        untrack(() => menuItems.set(element, () => disabled));
        return () => untrack(() => menuItems.delete(element));
    };

    // Nested or standalone items click on mousedown: a click-triggered outer popup closes on it, unmounting the submenu
    // before the click.
    const handleMouseDown = (event: MouseEvent & { currentTarget: HTMLLIElement }) => {
        rest.onmousedown?.(event);
        if (!disabled && !topLevel && event.button === 0) {
            rest.onclick?.(event);
        }
    };

    // detail 0: activated from the keyboard
    const handleClick = (event: MouseEvent & { currentTarget: HTMLLIElement }) => {
        if (!disabled && (topLevel || event.detail === 0)) {
            rest.onclick?.(event);
        }
    };
</script>

<li
    {...attrs}
    {@attach register}
    aria-checked={role === 'menuitem' ? undefined : active}
    aria-disabled={disabled}
    class={[
        `${prefix}-item`,
        rest.class,
        {
            [`${prefix}-item-disabled`]: disabled,
            [`${prefix}-item-withTick`]: realShowTick,
            [`${prefix}-item-${type}`]: type,
            [`${prefix}-item-active`]: active,
        },
    ]}
    {role}
    tabindex={-1}
    onclick={handleClick}
    onmousedown={handleMouseDown}
>
    <!-- every item renders a tick (transparent when inactive), so it stays out of the item's name -->
    {#if realShowTick}
        <IconTick style={active ? undefined : 'color: transparent'} />
    {/if}
    {#if icon}
        <div class={`${prefix}-item-icon`}>{@render icon()}</div>
    {/if}
    {@render children?.()}
</li>
