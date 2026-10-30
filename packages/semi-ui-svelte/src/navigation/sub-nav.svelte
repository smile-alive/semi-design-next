<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import { countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
    import SubNavFoundation, { type SubNavAdapter, type SubNavBaseProps } from '@fibrae/semi-foundation/navigation/sub-nav-foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { IconChevronDown, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { Collapsible } from '../collapsible/index.js';
    import { Dropdown, DropdownMenu, type DropdownProps, type DropdownTriggerProps } from '../dropdown/index.js';
    import { Tooltip } from '../tooltip/index.js';
    import { type NavContextValue, getNavContext, setNavContext } from './context.js';
    import type { ItemKey, NavClickData, NavOpenChangeData, NavWrapperArgs, SubNavProps } from './interface.js';
    import ItemShell from './item-shell.svelte';
    import WrapperOutlet from './wrapper-outlet.svelte';

    type Foundation = SubNavFoundation<SubNavBaseProps>;
    type Adapter = SubNavAdapter<SubNavBaseProps>;

    // the title takes the trigger props of a Dropdown, of a Tooltip, or none
    type TitleTriggerProps = Omit<Partial<DropdownTriggerProps>, 'aria-haspopup' | 'aria-expanded'> & { 'aria-haspopup'?: 'menu' | 'dialog'; 'aria-expanded'?: boolean | 'true' | 'false' };

    // Left undefined when not passed, so `wrapper` receives only what the Sub was given
    let { disabled, dropdownProps, dropdownStyle, indent, itemKey, level: ownLevel, subDropdownProps, text, children, label, icon, expandIcon, ...rest }: SubNavProps = $props();

    const outer = getNavContext('Nav.Sub');

    const uid = $props.id();

    // Collapsing or expanding the nav swaps the title's wrapper (inline disclosure button <-> popup trigger), which
    // remounts it; focus follows to the new title
    let titleElement: HTMLElement | undefined;
    let handoverFocus = false;

    const prefix = cssClasses.PREFIX;
    const subListId = `${uid}-list`;

    const foundationProps: SubNavBaseProps = {
        get disabled() {
            return disabled;
        },
        get itemKey() {
            return itemKey;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, SubNavBaseProps, object>(
        SubNavFoundation,
        foundationProps,
        () => ({}),
        () => ({
            getOpenKeys: () => outer.openKeys,
            getOpenKeysIsControlled: () => outer.openKeysIsControlled,
            updateOpen: (open) => (open ? outer.addOpenKey : outer.removeOpenKey)(itemKey as ItemKey),
            notifyGlobalOpenChange: (data) => outer.notifyOpenChange(data as NavOpenChangeData),
            notifyGlobalOnClick: (data) => outer.notifyClick(data as NavClickData),
            getIsOpen: () => isOpen,
        })
    );

    const level = $derived(ownLevel ?? outer.level);
    const isOpen = $derived(itemKey !== undefined && outer.openKeys.includes(itemKey));
    const isSelected = $derived(itemKey !== undefined && outer.selectedKeys.includes(itemKey));
    const horizontal = $derived(outer.mode === strings.MODE_HORIZONTAL);
    const isPopup = $derived(outer.isCollapsed || horizontal);

    // inside a popup menu the title is the menuitem that opens a submenu
    const menuTitle = $derived(isPopup && outer.isInSubNav);

    // A disabled Sub opens no Dropdown; collapsed, it shows its hidden text in a tooltip instead
    const titleWrapper = $derived(outer.isCollapsed && disabled ? 'tooltip' : isPopup && !disabled ? 'dropdown' : 'none');

    // Defaults first: user dropdownProps win, dropdownStyle beats their style, our onVisibleChange runs first
    const dropdown: DropdownProps = $derived.by(() => {
        const user = dropdownProps ?? subDropdownProps;
        return {
            mouseEnterDelay: outer.subNavOpenDelay,
            mouseLeaveDelay: outer.subNavCloseDelay,
            position: horizontal && !outer.isInSubNav ? 'bottomLeft' : 'rightTop',
            trigger: 'hover',
            ...user,
            class: [outer.isCollapsed ? `${prefix}-popover` : undefined, user?.class].filter(Boolean).join(' ') || undefined,
            style: dropdownStyle ?? user?.style,
            onVisibleChange: (visible: boolean) => {
                foundation.handleDropdownVisibleChange(visible);
                user?.onVisibleChange?.(visible);
            },
        };
    });

    const given: NavWrapperArgs['props'] = $derived(Object.fromEntries(Object.entries({ disabled, dropdownProps, dropdownStyle, indent, itemKey, level: ownLevel, subDropdownProps, text }).filter(([, value]) => value !== undefined)));

    // aria-* describe the title, which takes focus; the rest reaches the wrapper li
    const attrs = $derived(splitControlAttrs(rest, isAriaKey));

    const placeholders = $derived(
        Array.from(
            {
                length: countPlaceholderIcons({
                    mode: outer.mode,
                    limitIndent: outer.limitIndent,
                    isCollapsed: outer.isCollapsed,
                    hasIcon: Boolean(icon),
                    indent: indent ?? false,
                    level,
                }),
            },
            (_, n) => n
        )
    );

    const infoIconShown = $derived(Boolean(icon) || Boolean(indent) || (outer.isInSubNav && !horizontal));
    const DefaultToggle = $derived(outer.isCollapsed ? (outer.isInSubNav ? IconChevronRight : null) : horizontal && outer.isInSubNav ? IconChevronRight : expandIcon ? null : IconChevronDown);
    const customToggle = $derived(!outer.isCollapsed && !(horizontal && outer.isInSubNav) && Boolean(expandIcon));
    const rotateClass = $derived(!outer.isCollapsed && !horizontal && outer.subNavMotion ? `${prefix}-icon-rotate-${isOpen ? '180' : '0'}` : undefined);

    // the title is a button (or a menuitem div); a disabled one stays focusable so that it can be found
    const inlineAttrs = $derived(isPopup ? {} : { 'aria-controls': isOpen ? subListId : undefined, 'aria-expanded': isOpen });

    // the child context: the Sub's own title and list are below it
    setNavContext(
        Object.create(outer, {
            isInSubNav: { get: () => true },
            level: { get: () => level + 1 },
        }) as NavContextValue
    );

    const handleClick = (event: MouseEvent) => (isPopup ? foundation.handlePopupClick(event) : foundation.handleClick(event));

    const titleClass = (triggerClass?: string): ClassValue => [
        triggerClass,
        `${prefix}-sub-title`,
        {
            [`${prefix}-sub-title-selected`]: isSelected,
            [`${prefix}-sub-title-disabled`]: disabled,
        },
    ];

    const iconClass = (toggle: boolean) => [`${prefix}-item-icon`, toggle ? `${prefix}-item-icon-toggle-${outer.toggleIconPosition}` : `${prefix}-item-icon-info`];

    const trackTitle: Attachment<HTMLElement> = (element) => {
        titleElement = element;
        if (handoverFocus) {
            handoverFocus = false;
            element.focus();
        }
        return () => {
            if (titleElement === element) {
                titleElement = undefined;
            }
        };
    };

    // runs before the DOM changes, while the old title still holds focus
    $effect.pre(() => {
        void titleWrapper;
        void menuTitle;
        handoverFocus = Boolean(titleElement?.contains(document.activeElement));
    });
</script>

{#snippet shownText()}
    {#if label}
        {@render label()}
    {:else}
        {text}
    {/if}
{/snippet}

{#snippet toggle()}
    <i class={iconClass(true)} x-semi-prop="expandIcon">
        {#if customToggle}
            {@render expandIcon?.({ size: 'default', class: rotateClass })}
        {:else if DefaultToggle}
            <DefaultToggle class={rotateClass} />
        {/if}
    </i>
{/snippet}

<!-- a span: the title is a button, which only takes phrasing content -->
{#snippet titleContent()}
    <span class={`${prefix}-item-inner`}>
        {#each placeholders as n (n)}
            <i class={iconClass(false)}></i>
        {/each}
        {#if outer.toggleIconPosition === 'left'}
            {@render toggle()}
        {/if}
        {#if infoIconShown}
            <i class={iconClass(false)} x-semi-prop="icon">{@render icon?.({ size: 'large' })}</i>
        {/if}
        <span class={`${prefix}-item-text`} x-semi-prop="label">{@render shownText()}</span>
        {#if outer.toggleIconPosition === 'right'}
            {@render toggle()}
        {/if}
    </span>
{/snippet}

<!-- Dropdown adds aria-haspopup and aria-expanded to a popup title, and moves focus to it with the arrow keys -->
{#snippet titleElementSnippet({ props }: { props: TitleTriggerProps })}
    {#if menuTitle}
        <div {...props} {...attrs.control} {@attach trackTitle} aria-disabled={disabled ?? false} class={titleClass(props.class)} role="menuitem" tabindex="-1" onclick={handleClick}>
            {@render titleContent()}
        </div>
    {:else}
        <button {...props} {...attrs.control} {...inlineAttrs} {@attach trackTitle} aria-disabled={disabled || undefined} class={titleClass(props.class)} tabindex={undefined} type="button" onclick={handleClick}>
            {@render titleContent()}
        </button>
    {/if}
{/snippet}

{#snippet popupContent()}
    <DropdownMenu>{@render children?.()}</DropdownMenu>
{/snippet}

{#snippet subList()}
    {#if !outer.isCollapsed && (outer.subNavMotion || isOpen)}
        <ul class={[`${prefix}-sub`, { [`${prefix}-sub-open`]: isOpen, [`${prefix}-sub-popover`]: isPopup }]} id={subListId}>
            {@render children?.()}
        </ul>
    {/if}
{/snippet}

{#snippet content()}
    {#if titleWrapper === 'tooltip'}
        <Tooltip child={titleElementSnippet} content={shownText} mouseEnterDelay={outer.tooltipShowDelay} mouseLeaveDelay={outer.tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false} />
    {:else if titleWrapper === 'dropdown'}
        <Dropdown {...dropdown} child={titleElementSnippet} content={popupContent} />
    {:else}
        {@render titleElementSnippet({ props: {} })}
    {/if}
    {#if !horizontal}
        {#if outer.subNavMotion}
            <Collapsible fade {isOpen} keepDOM={false} motion>
                {@render subList()}
            </Collapsible>
        {:else}
            {@render subList()}
        {/if}
    {/if}
{/snippet}

{#snippet itemElement()}
    <ItemShell {...attrs.root} class={[attrs.root.class as ClassValue, { [`${prefix}-sub-wrap`]: !(outer.isInSubNav && isPopup) }]} {content} {disabled} given={{}} isCollapsed={outer.isCollapsed} isInSubNav={outer.isInSubNav} isSubNav {itemKey} {level} {text} />
{/snippet}

<WrapperOutlet isInSubNav={outer.isInSubNav} isSubNav {itemElement} itemProps={given} />
