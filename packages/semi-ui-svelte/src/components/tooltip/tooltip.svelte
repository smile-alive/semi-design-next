<script lang="ts">
    import { onMount, tick, untrack } from 'svelte';
    import { type Attachment, createAttachmentKey } from 'svelte/attachments';
    import { SvelteMap, SvelteSet } from 'svelte/reactivity';
    import { FocusTrapHandle } from '@fibrae/semi-foundation/base';
    import { cssClasses as buttonClasses } from '@fibrae/semi-foundation/components/button/constants';
    import { COLOR_SCHEME_SELECTOR, canRoleCarryPopupState, colorSchemeOf, cssClasses, isBlockDisplay, numbers, popupTarget, strings, wrapsSpecialTrigger } from '@fibrae/semi-foundation/components/tooltip/constants';
    import TooltipFoundation, { type TooltipAdapter, type TooltipBaseProps, type TooltipBaseState } from '@fibrae/semi-foundation/components/tooltip/foundation';
    import { warnIfDialogUnnamed, isEventInside, POPUP_ID_ATTRIBUTE, warning } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/tooltip/tooltip.scss';
    import { PopupLayerProvider, useDefaultProps, useFoundation } from '../../base/index.js';
    import { teleport } from '../../utils/index.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { getTooltipPopupsContext, getTooltipPrefixContext, setTooltipPopupsContext, setTooltipPrefixContext, setTriggerContext, type TriggerBinding, type TriggerState } from './context.js';
    import type { FocusTarget, RenderContentProps, TooltipProps, TooltipTriggerProps } from './interface.js';
    import TriangleArrow from './triangle-arrow.svelte';

    type Foundation = TooltipFoundation<TooltipBaseProps>;
    type Adapter = TooltipAdapter<TooltipBaseProps>;

    const defaults = useDefaultProps('Tooltip');

    // No fallback on `visible`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        visible = $bindable(),
        children,
        child,
        content,
        arrow,
        class: className = defaults('class'),
        style = defaults('style'),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        arrowPointAtCenter = defaults('arrowPointAtCenter', true),
        trigger = defaults('trigger', 'hover'),
        position = defaults('position', 'top'),
        role = defaults('role', 'tooltip'),
        mouseEnterDelay = defaults('mouseEnterDelay', numbers.MOUSE_ENTER_DELAY),
        mouseLeaveDelay = defaults('mouseLeaveDelay', numbers.MOUSE_LEAVE_DELAY),
        spacing = defaults('spacing', numbers.SPACING),
        showArrow = defaults('showArrow', true),
        closeOnEsc = defaults('closeOnEsc', true),
        guardFocus = defaults('guardFocus', false),
        returnFocusOnClose = defaults('returnFocusOnClose', false),
        disableFocusListener = defaults('disableFocusListener', false),
        disableArrowKeyDown = defaults('disableArrowKeyDown', false),
        keepDOM = defaults('keepDOM', false),
        condition = defaults('condition', true),
        clickToHide = defaults('clickToHide'),
        clickTriggerToHide = defaults('clickTriggerToHide'),
        stopPropagation = defaults('stopPropagation'),
        preventScroll = defaults('preventScroll'),
        // an id shared by every Tooltip would break the popup's references, so the global default is not read
        wrapperId,
        classNames = defaults('classNames'),
        styles = defaults('styles'),
        wrapWhenSpecial = defaults('wrapWhenSpecial', true),
        'aria-label': ariaLabel = defaults('aria-label'),
        'aria-labelledby': ariaLabelledby = defaults('aria-labelledby'),
        'aria-describedby': ariaDescribedby = defaults('aria-describedby'),
        onVisibleChange,
        onClickOutSide,
        onEscKeyDown,
        onOpen,
        afterOpen,
        afterClose,
    }: TooltipProps = $props();

    const config = getConfigContext();

    // Popups are moved out of the DOM of the Tooltips they open from, and DOM events do not reach those ancestors as
    // React portal events do: every ancestor tracks all descendant popups, and focus changes inside one are handed up
    const parentPopups = getTooltipPopupsContext();

    const uid = $props.id();
    let triggerElement = $state.raw<HTMLElement | null>(null);
    let container = $state.raw<HTMLDivElement | null>(null);

    // Content mounts after showPopover(): autofocus content cannot focus inside a hidden popup
    let contentShown = $state(false);
    let focusableInside = $state(false);
    let textOnly = $state(false);
    let initialFocus: FocusTarget | undefined;
    let warnedFocusable = false;

    // The value this Tooltip last wrote to an uncontrolled `visible`: the foundation still sees it as uncontrolled, so
    // hiding and showing again in one task (focus moving between trigger and popup with a zero delay) stays
    // synchronous. A different value from the owner ends it, and the foundation then reacts to that value.
    let selfWritten: boolean | undefined;
    const descendants = new SvelteSet<() => HTMLElement | null>();
    const triggers = new SvelteMap<Element, () => TriggerState>();

    const attachmentKey = createAttachmentKey();

    const contentProps: RenderContentProps = {
        initialFocusRef: (focusTarget) => {
            initialFocus = focusTarget;
        },
    };

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: TooltipBaseProps = {
        get arrowPointAtCenter() {
            return arrowPointAtCenter;
        },
        get autoAdjustOverflow() {
            return autoAdjustOverflow;
        },
        get clickToHide() {
            return clickToHide;
        },
        get clickTriggerToHide() {
            return clickTriggerToHide;
        },
        get closeOnEsc() {
            return closeOnEsc;
        },
        get condition() {
            return condition;
        },
        get disableArrowKeyDown() {
            return disableArrowKeyDown;
        },
        get disableFocusListener() {
            return disableFocusListener;
        },
        get guardFocus() {
            return guardFocus;
        },
        get keepDOM() {
            return keepDOM;
        },
        get mouseEnterDelay() {
            return mouseEnterDelay;
        },
        get mouseLeaveDelay() {
            return mouseLeaveDelay;
        },
        get position() {
            return position;
        },
        get preventScroll() {
            return preventScroll;
        },
        get returnFocusOnClose() {
            return returnFocusOnClose;
        },
        get showArrow() {
            return showArrow;
        },
        get spacing() {
            return spacing;
        },
        get trigger() {
            return trigger;
        },
        get visible() {
            if (selfWritten !== undefined && visible !== selfWritten) {
                selfWritten = undefined;
            }
            return selfWritten === undefined ? visible : undefined;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TooltipBaseProps, TooltipBaseState>(
        TooltipFoundation,
        foundationProps,
        () => TooltipFoundation.getInitialState(),
        () => ({
            insertPortal: () => {
                const element = triggerElement;
                return {
                    portalTarget: popupTarget(element?.getRootNode(), (fullscreen) => Boolean(element && fullscreen.contains(element))),
                    colorScheme: colorSchemeOf(element?.closest(COLOR_SCHEME_SELECTOR)),
                };
            },
            removePortal: () => {
                contentShown = false;
            },
            notifyAfterOpen: () => afterOpen?.(),
            notifyAfterClose: () => afterClose?.(),
            notifyVisibleChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides
                // locally, and the foundation applies it as a `visible` change
                const uncontrolled = foundationProps.visible === undefined;
                visible = next;
                // an uncontrolled change was applied before this report: seen as a `visible` change it would only be
                // replayed, and its delayShow would cancel a hide scheduled meanwhile (a trigger blurred right after opening)
                selfWritten = uncontrolled && visible === next ? next : undefined;
                onVisibleChange?.(next);
            },
            isEventInTrigger: (event) => isEventInside(event, triggerElement),
            getNestedPopups: () => nestedPopups(),
            batch: (fn) => fn(),
            notifyClickOutSide: (event) => onClickOutSide?.(event),
            getPortalContainer: () => container,
            getTriggerNode: () => triggerElement,
            getTriggerRect: () => triggerElement?.getBoundingClientRect() ?? null,
            getTriggerElement: () => triggerElement,
            observeTrigger: (observer) => {
                if (triggerElement) observer.observe(triggerElement);
            },
            unobserveTrigger: (observer) => {
                if (triggerElement) observer.unobserve(triggerElement);
            },
            isTriggerHovered: () => [triggerElement, ...nestedPopups()].some((element) => element?.isConnected && element.matches(':hover')),
            setInitialFocus: () => initialFocus?.focus({ preventScroll }),
            notifyOpen: () => onOpen?.(),
            notifyEscKeydown: (event) => onEscKeyDown?.(event),
            getPopupId: () => popupId,
        }),
        { context: () => config }
    );

    const popupId = $derived(wrapperId || `${cssClasses.PREFIX}-${uid}`);

    // Compared by value: the show/hide effect runs once per change, not on every equal write of the foundation
    const phase = $derived(states().isInsert ? states().transitionState : '');

    // Compared by identity: a reopening writes the same target again, and moving the open popup would hide it
    const portalTarget = $derived(states().isInsert ? states().portalTarget : null);
    const vertical = $derived(position.startsWith('left') || position.startsWith('right'));
    const arrowColor = $derived(/(?:^|;)\s*background-color\s*:\s*([^;]+)/.exec(style ?? '')?.[1]?.trim());
    const describedBy = $derived(role === 'tooltip' && states().isInsert ? popupId : undefined);

    // ARIA forbids popup state on generic elements; unknown until the element mounts, so the server leaves it out
    const carriesPopupState = $derived.by(() => {
        const ownRole = triggerElement?.getAttribute('role');
        return ownRole ? canRoleCarryPopupState(ownRole) : Boolean(triggerElement?.matches('button, a[href]'));
    });

    // The one element the trigger element wraps, but not a Button's group line: a trigger component registers its root
    // once it has mounted, which is also when this is read again. A `child` snippet counts too: Dropdown renders its own
    // wrapper span there, and a disabled Button in it must pass the pointer to that span as it does in Tooltip's.
    const inner = $derived.by(() => {
        void triggers.size;
        const items = [...(triggerElement?.children ?? [])].filter((item) => !item.classList.contains(`${buttonClasses.PREFIX}-group-line`));
        return items.length === 1 ? (items[0] as HTMLElement) : undefined;
    });

    const triggerState = $derived(inner ? triggers.get(inner)?.() : undefined);

    const status = $derived.by(() => {
        if (!wrapWhenSpecial || !triggerState) {
            return false;
        }
        return triggerState.disabled ? strings.STATUS_DISABLED : triggerState.loading ? strings.STATUS_LOADING : false;
    });

    const wrapsSpecial = $derived(status !== false && wrapsSpecialTrigger(trigger, status === strings.STATUS_LOADING));

    // A loading Button keeps the description itself, as do components that route aria-describedby to their own control
    const describes = $derived(status === strings.STATUS_LOADING || Boolean(triggerState?.describes));
    const blockTrigger = $derived(Boolean(triggerState?.block || (inner && isBlockDisplay(inner.style.display))));

    // one string rather than style: directives, which would beat the caller's styles.wrapper
    const wrapperStyle = $derived([status === strings.STATUS_DISABLED && wrapsSpecial && 'cursor: not-allowed', !textOnly && 'display: inline-block', blockTrigger && 'width: 100%', styles?.wrapper].filter(Boolean).join('; ') || undefined);
    const spanTabindex = $derived(focusableInside || status === strings.STATUS_LOADING ? -1 : 0);

    // Popover and Dropdown hand their class prefix to this Tooltip only, not to Tooltips rendered in its trigger or content
    const prefixCls = getTooltipPrefixContext() ?? cssClasses.PREFIX;

    setTooltipPrefixContext(undefined);

    setTooltipPopupsContext({
        register: (popup) => {
            descendants.add(popup);
            const unregister = parentPopups?.register(popup);
            return () => {
                descendants.delete(popup);
                unregister?.();
            };
        },
        // React's bubbling reaches this popup only from a Tooltip rendered in its content, not from one in the trigger
        relayFocus: (event, from) => {
            if (from && container?.contains(from)) {
                states().portalEventSet[event.type]?.(event);
                relayFocus(event);
            }
        },
    });

    setTriggerContext({
        register: (element, state) => {
            triggers.set(element, state);
            return () => {
                if (triggers.get(element) === state) triggers.delete(element);
            };
        },
        bind: (element): TriggerBinding | undefined => {
            if (!element || element !== inner) {
                return undefined;
            }
            return {
                pointerEventsNone: status !== false && (wrapsSpecial || trigger === 'custom'),
                ...(describes ? { 'aria-describedby': describedBy } : {}),
                ...(role === 'dialog' && status === strings.STATUS_LOADING
                    ? {
                          'aria-expanded': states().visible ? ('true' as const) : ('false' as const),
                          'aria-haspopup': 'dialog' as const,
                          'aria-controls': states().isInsert ? popupId : undefined,
                      }
                    : {}),
            };
        },
    });

    const attachTrigger = (element: HTMLElement) => {
        triggerElement = element;
        return () => {
            if (triggerElement === element) triggerElement = null;
        };
    };

    const triggerProps: TooltipTriggerProps = $derived({
        [POPUP_ID_ATTRIBUTE]: popupId,
        tabindex: 0,
        'aria-describedby': describedBy,
        ...(role === 'dialog' && carriesPopupState
            ? {
                  'aria-expanded': states().visible ? 'true' : 'false',
                  'aria-haspopup': 'dialog',
                  'aria-controls': states().isInsert ? popupId : undefined,
              }
            : {}),
        [attachmentKey]: attachTrigger,
    });

    const nestedPopups = () => {
        return [...descendants].map((get) => get());
    };

    const relayFocus = (event: FocusEvent) => {
        parentPopups?.relayFocus(event, triggerElement);
    };

    // Runs inside Svelte's delegation at the document, after the content's own handlers: the immediate stop also keeps
    // document listeners registered after Svelte's from seeing the event. shortcut: listeners registered before
    // Svelte's still run; native handlers inside the content run before this, as they bubble to the popup first.
    const stopDelegated = (event: Event) => {
        if (stopPropagation) {
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    };

    // The foundation writes the position into element.style and does not write an unchanged layout again, so the `style`
    // prop is applied per property: setting the attribute as a whole would drop the position when `style` changes.
    const applyStyle: Attachment<HTMLDivElement> = (element) => {
        const declared = document.createElement('div');
        declared.style.cssText = style ?? '';
        const names = [...declared.style];
        for (const name of names) {
            element.style.setProperty(name, declared.style.getPropertyValue(name), declared.style.getPropertyPriority(name));
        }
        return () => {
            for (const name of names) element.style.removeProperty(name);
        };
    };

    // The popup div in the template must stay the only node of its `{#if}` block, see teleport.ts. The trigger and popup
    // blocks touch in the template: whitespace or a comment between them would leave a text node after the trigger.
    //
    // Native listeners on the element: the popup is moved out of the app root. Not for the events Svelte delegates to
    // the document (`click`, `mousedown`, `focusin`, `focusout`) with stopPropagation: a native stop here would starve
    // the content's own handlers; the `on*` attributes on the popup element stop them inside that delegation instead,
    // where inner handlers have already run.
    const listenPopup: Attachment<HTMLDivElement> = (element) => {
        const controller = new AbortController();
        const { signal } = controller;
        element.addEventListener(
            'beforetoggle',
            (event) => {
                if ((event as ToggleEvent).newState === 'open') contentShown = true;
            },
            { signal }
        );
        element.addEventListener(
            'click',
            () => {
                if (clickToHide && !states().portalEventSet.click) foundation.hide();
            },
            { signal }
        );
        element.addEventListener('focusin', relayFocus, { signal });
        element.addEventListener('focusout', relayFocus, { signal });
        return () => controller.abort();
    };

    $effect(() => {
        const element = triggerElement;
        if (!element) {
            return;
        }
        const controller = new AbortController();
        for (const [name, handler] of Object.entries(states().triggerEventSet)) {
            // capture: the tooltip's keydown runs before the trigger's own handler, which then sees its preventDefault
            element.addEventListener(name, handler, { signal: controller.signal, capture: name === 'keydown' });
        }
        return () => controller.abort();
    });

    $effect(() => {
        const element = container;
        if (!element) {
            return;
        }
        const controller = new AbortController();
        for (const [name, handler] of Object.entries(states().portalEventSet)) {
            element.addEventListener(name, handler, { signal: controller.signal });
        }
        return () => controller.abort();
    });

    $effect(() => {
        void phase;
        void container;
        // only the phase and the popup element drive it; what the sync reads (layout, props) must not.
        // shortcut: a leave set by a prop reaction (handlePropsChange runs in a host effect created before this one)
        // reaches the sync before the template drops the show class, so the animations are read after tick(). Read
        // them at once again when the host runs prop reactions after the component's effects.
        untrack(() => foundation.syncPopup(tick()));
    });

    // showPopover() ran its autofocus step before the content mounted; syncPopup measured the popup without its
    // content, and a top popup placed by a zero height would hang over the trigger and take the next click
    $effect(() => {
        if (!contentShown) {
            return;
        }
        untrack(() => {
            foundation.calcPosition();
            container?.querySelector<HTMLElement>('[autofocus]')?.focus({ preventScroll });
            if (role === 'dialog') warnIfDialogUnnamed(container, 'Popover');
        });
    });

    // Measured again when the trigger component's state changes: a disabled Button is not focusable, an enabled one is
    $effect(() => {
        void triggerState;
        const element = triggerElement;
        if (child || !element) {
            return;
        }
        // a text trigger stays inline; one Tab stop: a focusable child keeps it, and the description cannot reach it
        textOnly = !element.firstElementChild;
        focusableInside = FocusTrapHandle.getFocusableElements(element).length > 0;
        if (focusableInside && !describes && !warnedFocusable) {
            warnedFocusable = true;
            warning(true, '[Semi Tooltip] the trigger holds a focusable element the description cannot reach; render it with the child snippet');
        }
    });

    onMount(() => {
        const unregister = parentPopups?.register(() => container);
        return () => {
            unregister?.();
            // the foundation's destroy closed the popup without reporting it
            foundation.handleUnmount();
        };
    });

    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    export function focusTrigger() {
        foundation.focusTrigger();
    }

    export function getPopupId() {
        return popupId;
    }

    /** The popup element, null while it is not in the document */
    export function getPopup() {
        return container;
    }

    /** Hides now and reports onVisibleChange(false); under a controlled `visible` it only reports */
    export function hide() {
        foundation.hide();
    }

    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves */
    export function rePosition() {
        foundation.calcPosition();
    }
</script>

{#if child}
    {@render child({ props: triggerProps })}
{:else}
    <span {@attach attachTrigger} {...{ [POPUP_ID_ATTRIBUTE]: popupId }} aria-describedby={describes ? undefined : describedBy} class={[`${cssClasses.PREFIX}-trigger-wrapper`, classNames?.wrapper]} style={wrapperStyle} tabindex={spanTabindex}>
        {@render children?.()}
    </span>
{/if}{#if portalTarget}
    <div
        {@attach teleport(portalTarget)}
        {@attach applyStyle}
        {@attach listenPopup}
        aria-describedby={role === 'dialog' ? ariaDescribedby : undefined}
        aria-label={role === 'dialog' ? ariaLabel : undefined}
        aria-labelledby={role === 'dialog' ? ariaLabelledby : undefined}
        bind:this={container}
        class={[
            states().colorScheme,
            className,
            `${prefixCls}-wrapper`,
            {
                [`${prefixCls}-wrapper-show`]: states().visible,
                [`${prefixCls}-with-arrow`]: showArrow,
                [`${prefixCls}-point-at-center`]: showArrow && arrowPointAtCenter,
                [`${prefixCls}-no-motion`]: !motion,
            },
        ]}
        dir={config.direction}
        id={popupId}
        popover="manual"
        {role}
        tabindex="-1"
        onclick={stopDelegated}
        onfocusin={stopDelegated}
        onfocusout={stopDelegated}
        onmousedown={stopDelegated}
    >
        {#if contentShown}
            <div class={`${cssClasses.PREFIX}-content`}>
                <PopupLayerProvider>
                    {@render content?.(contentProps)}
                </PopupLayerProvider>
            </div>
        {/if}
        {#if showArrow}
            {#if arrow}
                {@render arrow()}
            {:else}
                <TriangleArrow class={`${prefixCls}-icon-arrow`} style={arrowColor ? `color: ${arrowColor}` : undefined} {vertical} />
            {/if}
        {/if}
    </div>
{/if}
