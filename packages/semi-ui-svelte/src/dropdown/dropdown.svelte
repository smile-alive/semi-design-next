<script lang="ts">
    import { onMount } from 'svelte';
    import { type Attachment, createAttachmentKey } from 'svelte/attachments';
    import { on } from 'svelte/events';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/dropdown/constants';
    import DropdownFoundation, { type DropdownAdapter, type DropdownBaseProps, type DropdownBaseState } from '@fibrae/semi-foundation/dropdown/foundation';
    import { canRoleCarryPopupState, cssClasses as tooltipClasses } from '@fibrae/semi-foundation/tooltip/constants';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/dropdown/dropdown.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { Tooltip, type RenderContentProps, type TooltipProps, type TooltipTriggerProps } from '../tooltip/index.js';
    import { type DropdownContext, getDropdownContext, menuContext, menuItems } from './context.js';
    import DropdownDivider from './dropdown-divider.svelte';
    import DropdownItem from './dropdown-item.svelte';
    import DropdownMenu from './dropdown-menu.svelte';
    import DropdownPopup from './dropdown-popup.svelte';
    import DropdownTitle from './dropdown-title.svelte';
    import type { DropDownMenuItem, DropdownProps, DropdownTriggerProps } from './interface.js';

    type Foundation = DropdownFoundation<DropdownBaseProps, DropdownBaseState>;
    type Adapter = DropdownAdapter<DropdownBaseProps, DropdownBaseState>;

    const defaults = useDefaultProps('Dropdown');

    // No fallback on `visible`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        visible = $bindable(),
        children,
        child,
        content,
        menuIcon,
        menu = defaults('menu'),
        class: className = defaults('class'),
        style = defaults('style'),
        contentClassName = defaults('contentClassName'),
        selectionMode = defaults('selectionMode'),
        showTick = defaults('showTick', false),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow'),
        trigger = defaults('trigger', 'hover'),
        position = defaults('position', 'bottom'),
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        // an interactive menu must not sit inside role="tooltip"
        role = defaults('role', 'presentation'),
        mouseEnterDelay = defaults('mouseEnterDelay'),
        mouseLeaveDelay = defaults('mouseLeaveDelay', strings.DEFAULT_LEAVE_DELAY),
        spacing = defaults('spacing'),
        closeOnEsc = defaults('closeOnEsc', true),
        returnFocusOnClose = defaults('returnFocusOnClose', true),
        guardFocus = defaults('guardFocus'),
        disableFocusListener = defaults('disableFocusListener'),
        keepDOM = defaults('keepDOM'),
        condition = defaults('condition'),
        clickToHide = defaults('clickToHide'),
        clickTriggerToHide = defaults('clickTriggerToHide'),
        stopPropagation = defaults('stopPropagation'),
        preventScroll = defaults('preventScroll'),
        wrapperId,
        wrapperClassName = defaults('wrapperClassName'),
        'aria-label': ariaLabel = defaults('aria-label'),
        'aria-labelledby': ariaLabelledby = defaults('aria-labelledby'),
        'aria-describedby': ariaDescribedby = defaults('aria-describedby'),
        onVisibleChange,
        onClickOutSide,
        onEscKeyDown,
        onOpen,
        afterOpen,
        afterClose,
    }: DropdownProps = $props();

    const parent = getDropdownContext();
    const config = getConfigContext();

    let tooltip = $state<Tooltip>();

    // the trigger element: the span below, or the element the `child` snippet spread the trigger props on
    let triggerElement = $state.raw<HTMLElement | null>(null);
    let popupElement = $state<HTMLDivElement>();
    let textOnly = $state(false);
    let focusableInside = $state(false);

    const triggerKey = createAttachmentKey();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: DropdownBaseProps = {
        get trigger() {
            return trigger;
        },
        get visible() {
            return visible;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, DropdownBaseProps, DropdownBaseState>(
        DropdownFoundation,
        foundationProps,
        () => ({ popVisible: false }),
        (base) => ({
            setPopVisible: (popVisible) => base.setState({ popVisible }),
            // Tooltip has already written the bindable `visible`
            notifyVisibleChange: (next) => onVisibleChange?.(next),
            getPopup: () => popupElement?.closest<HTMLElement>('[popover]') ?? null,
            hidePopup: () => tooltip?.hide(),
        }),
        { context: () => menuContext(parent, config.direction) }
    );

    const popVisible = $derived(visible ?? states().popVisible);
    const isSubmenu = $derived((parent?.view.menuDepth ?? 0) > 0);

    // ARIA allows aria-haspopup and aria-expanded only on a button, a link, a parent item or an element with such a role
    const menuButton = $derived.by(() => {
        const element = triggerElement;
        if (!element) {
            return false;
        }
        if (menuItems.has(element)) {
            return true;
        }
        const ownRole = element.getAttribute('role');
        return ownRole ? canRoleCarryPopupState(ownRole) : element.matches('button, a[href]');
    });

    // a disabled parent item opens no submenu
    const disabledItem = $derived(triggerElement ? Boolean(menuItems.get(triggerElement)?.()) : false);

    const tooltipProps: TooltipProps = $derived({
        class: className,
        motion,
        autoAdjustOverflow,
        trigger,
        position,
        prefixCls,
        role,
        mouseEnterDelay,
        mouseLeaveDelay,
        spacing: spacing ?? (isSubmenu ? numbers.NESTED_SPACING : numbers.SPACING),
        closeOnEsc,
        returnFocusOnClose,
        guardFocus,
        disableFocusListener,
        keepDOM,
        clickToHide,
        clickTriggerToHide,
        stopPropagation,
        preventScroll,
        wrapperId,
        wrapperClassName,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        onClickOutSide,
        onEscKeyDown,
        onOpen,
        afterOpen,
        afterClose,
        // the foundation handles Up and Down on the trigger, so focus moves once
        disableArrowKeyDown: true,
        showArrow: false,
    });

    const context: DropdownContext = {
        view: {
            get menuDepth() {
                return (parent?.view.menuDepth ?? 0) + 1;
            },
            get showTick() {
                return showTick;
            },
            get selectionMode() {
                return selectionMode;
            },
            get trigger() {
                return trigger;
            },
        },
        close: foundation.close,
        closeAll: () => {
            foundation.close();
            parent?.closeAll();
        },
        getPopupId: () => tooltip?.getPopupId() ?? '',
    };

    // Moves focus into the menu when Tooltip gives the popup its initial focus.
    const focusTarget = { focus: foundation.handleOpened };

    // The trigger's own onkeydown goes first: a trigger that clicks itself on Enter (Tag, Avatar) calls preventDefault,
    // which stops the foundation from clicking twice. Svelte delegates onkeydown to the root and runs a listener on the
    // element itself before it, so the listener sits on the document, whose `on` runs after the delegated handlers.
    // A parent item is the exception: it must take the key before the menu around it, which also acts on Enter.
    const attachTrigger: Attachment<HTMLElement> = (element) => {
        triggerElement = element;
        const handle = (event: KeyboardEvent) => foundation.handleKeyDown(event, menuButton);
        const offElement = on(element, 'keydown', (event) => {
            if (menuItems.has(element)) {
                handle(event);
            }
        });
        const offDocument = on(document, 'keydown', (event) => {
            if (!menuItems.has(element) && event.composedPath().includes(element)) {
                handle(event);
            }
        });
        return () => {
            offElement();
            offDocument();
            if (triggerElement === element) {
                triggerElement = null;
            }
        };
    };

    const triggerProps = (tooltipTrigger: TooltipTriggerProps): DropdownTriggerProps => {
        return {
            ...tooltipTrigger,
            class: popVisible ? `${prefixCls}-showing` : undefined,
            // undefined also drops a value the trigger set itself
            'aria-haspopup': menuButton ? 'menu' : undefined,
            'aria-expanded': menuButton ? popVisible : undefined,
            [triggerKey]: attachTrigger,
        };
    };

    const menuKey = (item: DropDownMenuItem, index: number) => `${item.node}${'name' in item ? (item.name ?? '') : ''}${index}`;

    const entryProps = (item: DropDownMenuItem) => {
        const { node: _node, name: _name, ...rest } = item as DropDownMenuItem & { name?: unknown };
        return rest;
    };

    onMount(() => {
        if (!child && triggerElement) {
            // a text trigger stays inline; one Tab stop: a focusable child keeps it
            textOnly = !triggerElement.firstElementChild;
            focusableInside = FocusTrapHandle.getFocusableElements(triggerElement).length > 0;
            warning(focusableInside, '[Semi Dropdown] the trigger holds a focusable element; render it with the child snippet');
        }
    });

    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    export function focusTrigger() {
        tooltip?.focusTrigger();
    }

    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves */
    export function rePosition() {
        tooltip?.rePosition();
    }
</script>

{#snippet triggerContent({ props: tooltipTrigger }: { props: TooltipTriggerProps })}
    {@const props = triggerProps(tooltipTrigger)}
    {#if child}
        {@render child({ props })}
    {:else}
        <!-- Tooltip's own span would be out of reach of the keydown listener -->
        <span {...props} class={[`${tooltipClasses.PREFIX}-trigger-wrapper`, wrapperClassName, props.class]} style:display={textOnly ? undefined : 'inline-block'} tabindex={focusableInside ? -1 : 0}>
            {@render children?.()}
        </span>
    {/if}
{/snippet}

{#snippet popup({ initialFocusRef }: RenderContentProps)}
    <DropdownPopup bind:element={popupElement} contentClass={contentClassName} {context} {focusTarget} {initialFocusRef} {prefixCls} {style}>
        {#if content}
            {@render content()}
        {:else if menu}
            <DropdownMenu>
                {#each menu as item, index (menuKey(item, index))}
                    {#if item.node === 'title'}
                        <DropdownTitle {...entryProps(item)}>{item.name}</DropdownTitle>
                    {:else if item.node === 'item'}
                        {#snippet itemIcon()}{@render menuIcon?.({ item, index })}{/snippet}
                        <DropdownItem {...entryProps(item)} icon={menuIcon ? itemIcon : undefined}>{item.name}</DropdownItem>
                    {:else if item.node === 'divider'}
                        <DropdownDivider {...entryProps(item)} />
                    {/if}
                {/each}
            </DropdownMenu>
        {/if}
    </DropdownPopup>
{/snippet}

<!-- `condition` stays out of tooltipProps: a parent item's `disabled` reads the trigger props, which read tooltipProps, and one derived holding both would be a cycle -->
<Tooltip bind:this={tooltip} bind:visible {...tooltipProps} child={triggerContent} condition={disabledItem ? false : condition} content={popup} onVisibleChange={foundation.handleVisibleChange} />
