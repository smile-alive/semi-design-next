<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { cloneDeep } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import ItemFoundation, { type ItemAdapter, type ItemKey, type ItemProps, countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { DropdownItem } from '../dropdown/index.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import { getNavContext } from './context.js';
    import type { NavIconArgs, NavLinkOptions, OnSelectedData, SelectedData } from './interface.js';

    // The li of a Nav.Item or Nav.Sub, or the Dropdown.Item that stands in for it inside a popup
    interface ItemShellProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
        isSubNav?: boolean;
        /** Resolved by the caller: a Sub provides its own context to the subtree, which includes this shell */
        isInSubNav: boolean;
        level: number;
        disabled?: boolean;
        indent?: boolean | number;
        /** Or'ed with the collapsed state of the Nav */
        isCollapsed?: boolean;
        itemKey?: ItemKey;
        link?: string;
        linkOptions?: NavLinkOptions;
        text?: string | number;
        tooltipHideDelay?: number;
        tooltipShowDelay?: number;
        /** What the item was given, reported in `selectedItems` */
        given: Record<string, unknown>;
        icon?: Snippet<[NavIconArgs]>;
        toggleIcon?: Snippet<[NavIconArgs]>;
        label?: Snippet;
        /** A Sub's title and list, in place of the control */
        content?: Snippet;
        onItemClick?: (data: SelectedData) => void;
    }

    type Foundation = ItemFoundation<ItemProps>;
    type Adapter = ItemAdapter<ItemProps>;

    let { isSubNav = false, isInSubNav, level, disabled, indent, isCollapsed: ownCollapsed, itemKey, link, linkOptions, text, tooltipHideDelay, tooltipShowDelay, given, icon, toggleIcon, label, content, onItemClick, ...rest }: ItemShellProps = $props();

    const ctx = getNavContext('Nav.Item');

    const prefix = cssClasses.PREFIX;
    const itemPrefix = `${prefix}-item`;
    const collapsed = $derived(Boolean(ownCollapsed) || ctx.isCollapsed);
    const horizontal = $derived(ctx.mode === strings.MODE_HORIZONTAL);
    const popup = $derived(isInSubNav && (collapsed || horizontal));
    const hasLink = $derived(typeof link === 'string');
    const selected = $derived(itemKey !== undefined && ctx.selectedKeys.includes(itemKey));

    // present in both states and only active while collapsed: swapping the wrapper would remount the focused control
    const tooltipped = $derived(!isSubNav && !isInSubNav && !horizontal);

    const foundationProps: ItemProps = {
        get disabled() {
            return disabled;
        },
        get isSubNav() {
            return isSubNav;
        },
        get itemKey() {
            return itemKey;
        },
        get text() {
            return text;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, ItemProps, object>(
        ItemFoundation,
        foundationProps,
        () => ({}),
        () => ({
            cloneDeep: <T>(_value: T) => cloneDeep(given) as T,
            selectSelf: () => ctx.updateSelectedKeys([itemKey as ItemKey]),
            getSelectedKeysIsControlled: () => ctx.selectedKeysIsControlled,
            notifyGlobalOnSelect: (data) => ctx.notifySelect(data as OnSelectedData),
            notifyGlobalOnClick: (data) => ctx.notifyClick(data),
            notifyClick: (data) => onItemClick?.(data),
            getSelected: () => selected,
        })
    );

    // the li is a plain list item: aria-* and tabindex describe the link or button that takes focus
    const attrs: { root: Record<string, unknown>; control: Record<string, unknown> } = $derived(isSubNav ? { root: rest, control: {} } : splitControlAttrs(rest, (key) => isAriaKey(key) || key === 'tabindex'));

    const placeholders = $derived(
        Array.from(
            {
                length: countPlaceholderIcons({
                    mode: ctx.mode,
                    limitIndent: ctx.limitIndent,
                    isCollapsed: collapsed,
                    hasIcon: Boolean(icon),
                    indent: indent ?? false,
                    level,
                }),
            },
            (_, n) => n
        )
    );

    const infoIconShown = $derived(Boolean(icon || indent || isInSubNav) && (!horizontal || Boolean(icon)));

    const stateClasses = $derived({
        [`${itemPrefix}-sub`]: isSubNav,
        [`${itemPrefix}-collapsed`]: collapsed,
        [`${itemPrefix}-disabled`]: disabled,
    });

    const handleClick = (event: MouseEvent) => foundation.handleClick(event);

    // Dropdown activates the li on Enter/Space; click the inner link instead so target and rel apply (it bubbles back here)
    const handlePopupClick = (event: MouseEvent & { currentTarget: HTMLLIElement }) => {
        rest.onclick?.(event);
        const li = event.currentTarget;
        const innerLink = event.target === li && hasLink ? li.querySelector('a') : null;
        if (innerLink) {
            innerLink.click();
            return;
        }
        handleClick(event);
    };

    const handleLinkClick = (event: MouseEvent & { currentTarget: HTMLAnchorElement }) => {
        linkOptions?.onclick?.(event);
        handleClick(event);
    };

    const iconClass = (toggle: boolean) => [`${itemPrefix}-icon`, toggle ? `${itemPrefix}-icon-toggle-${ctx.toggleIconPosition}` : `${itemPrefix}-icon-info`];

    const toggleShown = (position: 'left' | 'right') => ctx.toggleIconPosition === position && (!horizontal || Boolean(toggleIcon));
</script>

{#snippet shownText()}
    {#if label}
        {@render label()}
    {:else}
        {text}
    {/if}
{/snippet}

{#snippet body()}
    {#each placeholders as n (n)}
        <i class={iconClass(false)}></i>
    {/each}
    {#if toggleShown('left')}
        <i class={iconClass(true)} x-semi-prop="toggleIcon">{@render toggleIcon?.({ size: 'default' })}</i>
    {/if}
    {#if infoIconShown}
        <i class={iconClass(false)} x-semi-prop="icon">{@render icon?.({ size: 'large' })}</i>
    {/if}
    {#if text != null || label}
        <span class={`${prefix}-item-text`} x-semi-prop="label">{@render shownText()}</span>
    {/if}
    {#if toggleShown('right')}
        <i class={iconClass(true)} x-semi-prop="toggleIcon">{@render toggleIcon?.({ size: 'default' })}</i>
    {/if}
{/snippet}

<!-- tabindex follows the element: a link and a button are tabbable on their own, so the trigger's own tabindex does not apply -->
{#snippet control({ props }: { props: Partial<TooltipTriggerProps> })}
    {#if isSubNav}
        {@render content?.()}
    {:else if hasLink && popup}
        <a href={link} tabindex="-1" {...linkOptions} class={[`${prefix}-item-link`, linkOptions?.class]}>{@render body()}</a>
    {:else if hasLink}
        <a {...props} {...attrs.control} aria-current={selected ? 'page' : undefined} aria-disabled={disabled || undefined} href={link} {...linkOptions} class={[`${prefix}-item-link`, linkOptions?.class]} tabindex={attrs.control.tabindex as number | undefined} onclick={handleLinkClick}>
            {@render body()}
        </a>
    {:else if popup}
        {@render body()}
    {:else}
        <button {...props} {...attrs.control} aria-current={selected ? 'page' : undefined} aria-disabled={disabled || undefined} class={`${prefix}-item-button`} tabindex={attrs.control.tabindex as number | undefined} type="button" onclick={handleClick}>
            {@render body()}
        </button>
    {/if}
{/snippet}

{#snippet tip()}
    {@render shownText()}
{/snippet}

{#snippet inner()}
    {#if tooltipped}
        <Tooltip child={control} condition={collapsed} content={tip} mouseEnterDelay={tooltipShowDelay ?? ctx.tooltipShowDelay} mouseLeaveDelay={tooltipHideDelay ?? ctx.tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false} />
    {:else}
        {@render control({ props: {} })}
    {/if}
{/snippet}

{#if popup}
    <DropdownItem {...rest} active={selected} aria-current={selected && !isSubNav ? 'page' : undefined} class={[rest.class, itemPrefix, stateClasses, { [`${itemPrefix}-selected`]: selected }]} disabled={disabled ?? false} onclick={handlePopupClick}>
        {@render inner()}
    </DropdownItem>
{:else}
    <li
        {...attrs.root}
        class={[
            isSubNav ? rest.class : rest.class || `${itemPrefix}-normal`,
            itemPrefix,
            stateClasses,
            {
                [`${itemPrefix}-selected`]: selected && !isSubNav,
                [`${itemPrefix}-has-link`]: hasLink && !isSubNav,
                [`${itemPrefix}-has-button`]: !hasLink && !isSubNav,
            },
        ]}
    >
        {@render inner()}
    </li>
{/if}
