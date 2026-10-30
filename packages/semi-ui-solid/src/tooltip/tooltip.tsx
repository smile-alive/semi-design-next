import { type Accessor, type JSX, type Ref, Show, batch, children, createEffect, createMemo, createSignal, createUniqueId, getOwner, mergeProps, on, onCleanup, onMount, runWithOwner, splitProps, untrack } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import clsx from 'clsx';
import { COLOR_SCHEME_SELECTOR, TRIGGER_EVENT_NAMES, canRoleCarryPopupState, colorSchemeOf, cssClasses, isBlockDisplay, numbers, popupTarget, strings, wrapsSpecialTrigger } from '@fibrae/semi-foundation/tooltip/constants';
import TooltipFoundation, { type Position, type TooltipAdapter, type TooltipBaseProps } from '@fibrae/semi-foundation/tooltip/foundation';
import { joinIds, warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/tooltip/tooltip.scss';
import autofocus from '../_base/autofocus';
import { PopupLayerContext } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import { SpecialTriggerContext, type SpecialTriggerState, TooltipDescriptionContext, type TooltipPopups, TooltipPopupsContext, useSpecialTriggers, useTooltipPopups } from './context';
import TriangleArrow from './triangle-arrow';
import TriangleArrowVertical from './triangle-arrow-vertical';

export type Trigger = (typeof strings.TRIGGER_SET)[number];
export type { Position };

export interface FocusTarget {
    focus: (options?: FocusOptions) => void;
}

export interface RenderContentProps {
    /** A ref callback: `<input ref={initialFocusRef} />`, or a handle with focus(); focused once the popup has opened */
    initialFocusRef: (target: FocusTarget) => void;
}

export type RenderContent = (props: RenderContentProps) => JSX.Element;

/**
 * What Tooltip puts on the trigger element; every key is a live getter. A type alias, not an interface, so the result
 * can be passed on as another Tooltip's `own` (an interface has no implicit index signature).
 */
export type TooltipTriggerProps = {
    ref: (element: HTMLElement) => void;
    tabIndex?: number | string;
    'data-popupid'?: string;
    'aria-describedby'?: string;
    'aria-expanded'?: boolean | 'true' | 'false';
    'aria-haspopup'?: JSX.AriaAttributes['aria-haspopup'];
    'aria-controls'?: string;
};

/**
 * The trigger element's own props, merged under Tooltip's rules:
 * - a value other than undefined wins; undefined means not passed;
 * - `null` leaves the attribute out; `'aria-describedby': null` also opts out of the description, whose id then
 *   reaches descendants through useTooltipDescription (Typography, Slider);
 * - a string `aria-describedby` / `data-popupid` is joined with Tooltip's id (space separated);
 * - `ref` is merged; `tabindex` is folded into `tabIndex`; other keys (handlers, class, style) pass through untouched.
 */
export interface TriggerOwnProps {
    ref?: (element: never) => void;
    role?: string;
    tabIndex?: number | string | null;
    tabindex?: number | string | null;
    'data-popupid'?: string;
    'aria-describedby'?: string | null;
    'aria-expanded'?: boolean | 'true' | 'false' | null;
    'aria-haspopup'?: JSX.AriaAttributes['aria-haspopup'] | null;
    'aria-controls'?: string | null;
    [key: string]: unknown;
}

// const: own literals such as `type: 'button'` keep their literal type, which the element's attribute types require
export type GetTriggerProps = <const P extends TriggerOwnProps = Record<never, never>>(own?: P) => Omit<P, keyof TooltipTriggerProps | 'tabindex'> & TooltipTriggerProps;

export interface TooltipHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
    getPopupId: () => string;
    /** Hides now and reports onVisibleChange(false); under a controlled `visible` it only reports */
    hide: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

// No ElementProps: Tooltip has no root DOM, so undeclared props are dropped (F11)
export interface TooltipProps extends TooltipBaseProps {
    /** A function (declare its parameter) gets getTriggerProps for the element that takes focus; anything else is wrapped in Tooltip's span */
    children?: JSX.Element | ((getTriggerProps: GetTriggerProps) => JSX.Element);
    content?: JSX.Element | RenderContent;
    /** On the popup */
    class?: string;
    /** On the popup, before the positioning declarations; the arrow color reads `background-color` of an object style only */
    style?: JSX.CSSProperties | string;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    prefixCls?: string;
    spacing?: number | { x: number; y: number };
    showArrow?: boolean | JSX.Element;
    role?: string;
    /** Name of a role="dialog" popup (F12); ignored for other roles */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    arrowPointAtCenter?: boolean;
    wrapWhenSpecial?: boolean;
    stopPropagation?: boolean;
    wrapperClassName?: string;
    wrapperId?: string;
    onVisibleChange?: (visible: boolean) => void;
    /** Native mousedown from the window listener */
    onClickOutSide?: (e: MouseEvent) => void;
    /** Native keydown from the overlay stack */
    onEscKeyDown?: (e: KeyboardEvent) => void;
    /** Called once per opening when the popup is shown, as its enter transition starts */
    onOpen?: () => void;
    /** Called once per opening after the enter transition, not for an opening closed before it finishes */
    afterOpen?: () => void;
    afterClose?: () => void;
}

interface TooltipState {
    visible: boolean;
    transitionState: 'enter' | 'leave' | '';
    triggerEventSet: Record<string, (event: Event) => void>;
    portalEventSet: Record<string, (event: Event) => void>;
    isInsert: boolean;
    portalTarget: HTMLElement | ShadowRoot | null;
    colorScheme?: string;
}

type Foundation = TooltipFoundation<TooltipProps, TooltipState>;
type Adapter = TooltipAdapter<TooltipProps, TooltipState>;
type SpecialStatus = typeof strings.STATUS_DISABLED | typeof strings.STATUS_LOADING | false;

const defaultProps = {
    autoAdjustOverflow: true,
    arrowPointAtCenter: true,
    trigger: 'hover',
    position: 'top',
    prefixCls: cssClasses.PREFIX,
    role: 'tooltip',
    mouseEnterDelay: numbers.MOUSE_ENTER_DELAY,
    mouseLeaveDelay: numbers.MOUSE_LEAVE_DELAY,
    motion: true,
    spacing: numbers.SPACING,
    showArrow: true,
    wrapWhenSpecial: true,
    closeOnEsc: true,
    guardFocus: false,
    returnFocusOnClose: false,
    disableFocusListener: false,
    disableArrowKeyDown: false,
    keepDOM: false,
    condition: true,
} satisfies Partial<TooltipProps>;

const prefix = cssClasses.PREFIX;
const OWN_KEYS = ['ref', 'tabIndex', 'tabindex', 'data-popupid', 'aria-describedby', 'aria-expanded', 'aria-haspopup', 'aria-controls'] as const;
// null is an explicit "leave it out"; the trigger's attribute is removed either way, and undefined types on any element
const ownValue = <T,>(value: T | null) => (value === null ? undefined : value);

/**
 * Whether a trigger element may carry aria-haspopup and aria-expanded, which ARIA forbids on generic elements. The
 * role a component sets on its own root is not in the DOM yet when the trigger props are first read, so callers pass
 * the role they know.
 */
export function canCarryPopupState(element?: Element, role?: unknown) {
    const resolved = typeof role === 'string' ? role : element?.getAttribute('role');
    return resolved ? canRoleCarryPopupState(resolved) : Boolean(element?.matches('button, a[href]'));
}

/**
 * Renders a `content` prop where it is inserted. JSX that compiles to a memo (For, Show, a component returning one) is
 * a function as well, so any function is called in a tracked scope, as insert() does with a function child: reads in
 * its body re-create the content, reads in the returned JSX update in place. The getter is read once per change and
 * under this owner, since every read creates JSX content again and resolves its context here.
 */
export function PopupContent(props: { content: TooltipProps['content']; renderProps: RenderContentProps }) {
    const content = createMemo(() => props.content);

    const view = () => {
        const value = content();
        return typeof value === 'function' ? value(props.renderProps) : value;
    };

    return <>{view()}</>;
}

export default function Tooltip(rawProps: TooltipProps & { ref?: Ref<TooltipHandle> }) {
    const props = useDefaultProps('Tooltip', rawProps, defaultProps);

    const config = useConfig();
    const outerTriggers = useSpecialTriggers();
    const outerPopups = useTooltipPopups();

    const id = createUniqueId();
    const [ownElement, setOwnElement] = createSignal<HTMLElement>();
    const [wrapper, setWrapper] = createSignal<HTMLElement>();
    const [container, setContainer] = createSignal<HTMLDivElement>();
    const [focusableInside, setFocusableInside] = createSignal(false);
    let isRender = false;
    let clickOutside: AbortController | undefined;
    let initialFocus: FocusTarget | undefined;

    // Content mounts after showPopover(): autofocus content cannot focus inside a hidden popup
    const [contentShown, setContentShown] = createSignal(false);

    // read lazily by describedInside; a plain variable, since getTriggerProps runs while the trigger renders
    let lastOwn: TriggerOwnProps | undefined;

    // the consumer's element: the spread target (function children) or the single resolved element (Tooltip's span)
    let inner: Accessor<HTMLElement | undefined> = ownElement;

    // last mousedown through the popup's delegated handler: also a press in any portal the content renders, as
    // React's portal events count it, not only the Tooltip popups registered in `descendants`
    let pressedInside: Event | undefined;

    // the popups of the Tooltips rendered in this trigger or content, at any depth
    const descendants = new Set<Accessor<HTMLElement | undefined>>();

    // only those rendered in the content: as React's enter and leave events through portals, moving onto one stays in
    // this popup, while moving onto a popup the trigger renders leaves the trigger
    const contentDescendants = new Set<Accessor<HTMLElement | undefined>>();

    // inserted and afterOpen, afterClose not yet reported
    let openPending = false;
    let closePending = false;

    const layer = Symbol('semi-popup-layer');
    const contentProps: RenderContentProps = { initialFocusRef: (focusTarget) => (initialFocus = focusTarget) };
    const isDialog = createMemo(() => props.role === 'dialog');
    const ref = props.ref;

    // nested Tooltips share one table, so both see the same Button
    const specialTriggers = outerTriggers ?? new WeakMap<object, Accessor<SpecialTriggerState>>();

    // One function for every getTriggerProps call, which a spread may repeat on each prop read: on the server, where
    // no ref runs, a trigger component registers this ref in place of its element
    const triggerRef = (element: HTMLElement) => {
        (lastOwn?.ref as ((element: HTMLElement) => void) | undefined)?.(element);
        setOwnElement(element);
    };

    // listeners and the position reference are the wrapper span when there is one
    const target = () => wrapper() ?? ownElement();

    const popupId = () => props.wrapperId || `${prefix}-${id}`;

    const nestedPopups = (popups = descendants) => [...popups].map((popup) => popup());

    // Reading `showArrow` from props creates its JSX again; the foundation only needs to know whether an arrow shows
    const foundationProps = mergeProps(props, {
        get showArrow() {
            return Boolean(arrowChild());
        },
    }) as TooltipProps;

    const { foundation, state } = useFoundation<Foundation, Adapter, TooltipProps, TooltipState>(
        TooltipFoundation,
        foundationProps,
        () => ({
            visible: false,
            transitionState: '',
            triggerEventSet: {},
            portalEventSet: {},
            isInsert: false,
            portalTarget: null,
            colorScheme: undefined,
        }),
        (base) => {
            const adapter: Omit<Adapter, keyof typeof base> = {
                insertPortal: () => {
                    const el = target();
                    openPending = true;
                    closePending = true;
                    base.setState({
                        isInsert: true,
                        transitionState: 'enter',
                        visible: true,
                        portalTarget: popupTarget(el?.getRootNode(), (fullscreen) => Boolean(el && fullscreen.contains(el))),
                        colorScheme: colorSchemeOf(el?.closest(COLOR_SCHEME_SELECTOR)),
                    });
                },
                closePopup: () => base.setState({ transitionState: 'leave', visible: false }),
                removePortal: () =>
                    batch(() => {
                        setContentShown(false);
                        base.setState({ isInsert: false, transitionState: '' });
                    }),
                registerTriggerEvent: (triggerEventSet) => base.setState({ triggerEventSet }),
                registerPortalEvent: (portalEventSet) => base.setState({ portalEventSet }),
                notifyVisibleChange: (visible) => props.onVisibleChange?.(visible),
                registerClickOutsideHandler: (handler) => {
                    adapter.unregisterClickOutsideHandler();
                    clickOutside = new AbortController();
                    // opening from a delegated mousedown handler registers mid-dispatch (S-H1); that press must not close it
                    const openingPress = window.event;
                    // the handler is the foundation's own closure, outside the batching proxy
                    window.addEventListener('mousedown', (e) => e !== openingPress && batch(() => handler(e)), { signal: clickOutside.signal });
                },
                unregisterClickOutsideHandler: () => {
                    clickOutside?.abort();
                    clickOutside = undefined;
                },
                isEventInTrigger: (e) => isEventInside(e, target()),
                // operating a popup opened from the trigger or the content keeps this one open (D5, F3)
                isEventInPopup: (e) => pressedInside === e || isEventInside(e, container(), ...nestedPopups()),
                notifyClickOutSide: (e) => props.onClickOutSide?.(e),
                getPortalContainer: () => container() ?? null,
                getTriggerNode: () => target(),
                getTriggerRect: () => target()?.getBoundingClientRect() ?? null,
                getTriggerElement: () => target() ?? null,
                observeTrigger: (observer) => {
                    const el = target();
                    if (el) {
                        observer.observe(el);
                    }
                },
                unobserveTrigger: (observer) => {
                    const el = target();
                    if (el) {
                        observer.unobserve(el);
                    }
                },
                isTriggerHovered: () => [target(), ...nestedPopups()].some((el) => el?.isConnected && el.matches(':hover')),
                setInitialFocus: () => initialFocus?.focus({ preventScroll: props.preventScroll }),
                notifyOpen: () => props.onOpen?.(),
                notifyEscKeydown: (event) => props.onEscKeyDown?.(event),
                getPopupId: popupId,
            };
            return adapter;
        }
    );

    // an equal write still notifies: the effects these drive show the popover and register the layer once per change
    const phase = createMemo(() => (state().isInsert ? state().transitionState : ''));
    const isOpen = createMemo(() => state().isInsert && state().transitionState !== 'leave');

    // created when the popup first mounts, then kept across reopening: JSX created during hydration has no node in the
    // server HTML to claim
    const mounted = createMemo<boolean>((prev) => prev || Boolean(state().isInsert && state().portalTarget), false);
    const arrowChild = children(() => (mounted() ? (props.showArrow as JSX.Element) : undefined));
    const handle: TooltipHandle = { focusTrigger: foundation.focusTrigger, getPopupId: popupId, hide: foundation.hide, rePosition: foundation.calcPosition };

    // moving between the trigger, the popup and the popups opened from its content does not leave this Tooltip;
    // checked before the handler runs, since a zero mouseLeaveDelay hides at once
    const stays = (e: Event) => {
        const to = (e as MouseEvent | FocusEvent).relatedTarget;
        return (e.type === TRIGGER_EVENT_NAMES.mouseLeave || e.type === TRIGGER_EVENT_NAMES.blur) && to instanceof Node && [target(), container(), ...nestedPopups(contentDescendants)].some((el) => el?.contains(to));
    };

    const triggerState = () => {
        const key = isServer ? triggerRef : inner();
        return key && specialTriggers.get(key)?.();
    };

    const special = (): SpecialStatus => {
        const status = props.wrapWhenSpecial ? triggerState() : undefined;
        return status?.disabled ? strings.STATUS_DISABLED : status?.loading ? strings.STATUS_LOADING : false;
    };

    const wrapsSpecial = () => special() !== false && wrapsSpecialTrigger(props.trigger, special() === strings.STATUS_LOADING);

    const wrapped = () => isRender && wrapsSpecial();

    // a loading Button ignores the pointer and a disabled one gets no click (F4)
    const blocksPointer = () => special() !== false && (wrapsSpecial() || props.trigger === 'custom');

    const block = () => {
        const el = inner();
        return Boolean(triggerState()?.block || (el && isBlockDisplay(el.style.display)));
    };

    const describedInside = () => (props.role === 'tooltip' && state().isInsert && lastOwn?.['aria-describedby'] === null ? popupId() : undefined);

    // Merges the trigger element's own props; the last call wins, so it serves one element
    const getTriggerProps: GetTriggerProps = (own = {} as never) => {
        lastOwn = own;
        const [local, rest] = splitProps(own as TriggerOwnProps, OWN_KEYS);
        // a disabled trigger wrapped for click hands every attribute to the wrapper span (F4)
        const carries = () => !wrapped() || special() === strings.STATUS_LOADING;
        // Popover is a dialog trigger; ARIA forbids popup state on generic elements
        const popupState = <K extends 'aria-expanded' | 'aria-haspopup' | 'aria-controls'>(key: K, value: TooltipTriggerProps[K]) => {
            if (local[key] !== undefined) {
                return ownValue(local[key]);
            }
            return carries() && props.role === 'dialog' && canCarryPopupState(ownElement(), own.role) ? value : undefined;
        };
        return mergeProps(rest, {
            ref: triggerRef,
            get tabIndex() {
                const value = local.tabIndex !== undefined ? local.tabIndex : local.tabindex;
                // keyboard access for a non-focusable trigger (an icon, a span)
                return value !== undefined ? ownValue(value) : carries() ? 0 : undefined;
            },
            get 'data-popupid'() {
                return wrapped() ? local['data-popupid'] : joinIds(local['data-popupid'], popupId());
            },
            // an IDREF to a popup not in the document points at nothing
            get 'aria-describedby'() {
                const value = local['aria-describedby'];
                return value === null ? undefined : joinIds(value, carries() && props.role === 'tooltip' && state().isInsert ? popupId() : undefined);
            },
            get 'aria-expanded'() {
                return popupState('aria-expanded', state().visible ? 'true' : 'false');
            },
            get 'aria-haspopup'() {
                return popupState('aria-haspopup', 'dialog');
            },
            get 'aria-controls'() {
                return popupState('aria-controls', state().isInsert ? popupId() : undefined);
            },
        }) as never;
    };

    const trackWrapper = (node: HTMLSpanElement) => {
        setWrapper(node);
        onCleanup(() => setWrapper(undefined));
    };

    const renderTrigger = () => {
        const resolved = children(() => props.children as JSX.Element);
        // untracked: renderTrigger runs in the Provider's children memo, so a tracked read would rebuild the children,
        // and the child components with their state, whenever their output changes
        const render = untrack(resolved) as unknown;
        // children() expands zero-arity functions only, so a function that is still here takes getTriggerProps
        if (typeof render === 'function') {
            isRender = true;
            const output = children(() => untrack(() => (render as (get: GetTriggerProps) => JSX.Element)(getTriggerProps)));
            // the nodes move into the span only after the parent has reconciled its children, which removes every
            // old node missing from the new list wherever it sits, so the trigger keeps its identity across wrapping;
            // nothing else inserts later output while the span is shown, and holes (undefined, false) must not become text
            createEffect(on([wrapper, output.toArray], ([span, nodes]) => span?.replaceChildren(...nodes.flatMap((node: unknown): (Node | string)[] => (node instanceof Node ? [node] : typeof node === 'string' || typeof node === 'number' ? [String(node)] : [])))));
            return (
                <Show when={wrapped()} fallback={output()}>
                    <span
                        ref={trackWrapper}
                        class={clsx(`${prefix}-trigger-wrapper`, props.wrapperClassName)}
                        style={{ display: 'inline-block', width: block() ? '100%' : undefined, cursor: special() === strings.STATUS_DISABLED ? 'not-allowed' : undefined }}
                        tabIndex={special() === strings.STATUS_LOADING ? -1 : 0}
                        data-popupid={popupId()}
                        aria-describedby={special() === strings.STATUS_DISABLED && props.role === 'tooltip' && state().isInsert ? popupId() : undefined}
                    >
                        {/* Exception to "isServer does not decide the markup": the effect above runs in the browser only, and inserting
                            the output here as well would let the parent's reconcile remove it when the span replaces the fallback.
                            Both sides end with the output inside the span; the hydrating button claims its markup in here */}
                        {isServer && output()}
                    </span>
                </Show>
            );
        }
        inner = () => {
            const nodes = resolved.toArray();
            // the server's markup has neither the inline style nor the registration a ref callback makes
            return nodes.length === 1 && !isServer && nodes[0] instanceof HTMLElement ? nodes[0] : undefined;
        };
        // a text node only reaches here in the browser; the server gives text as strings
        const textOnly = () => resolved.toArray().every((node) => typeof node === 'string' || typeof node === 'number' || (!isServer && node instanceof Text));
        // A generic span: no popup state attributes, which ARIA forbids on it
        return (
            <span
                ref={trackWrapper}
                class={clsx(`${prefix}-trigger-wrapper`, props.wrapperClassName)}
                style={{ display: textOnly() ? undefined : 'inline-block', width: block() ? '100%' : undefined, cursor: special() === strings.STATUS_DISABLED && wrapsSpecial() ? 'not-allowed' : undefined }}
                tabIndex={focusableInside() ? -1 : 0}
                data-popupid={popupId()}
                aria-describedby={props.role === 'tooltip' && state().isInsert ? popupId() : undefined}
            >
                {resolved()}
            </span>
        );
    };

    const runPortal = (e: Event) => {
        const handler = state().portalEventSet[e.type];
        if (handler && !stays(e)) {
            batch(() => handler(e));
        }
    };

    // a mouseenter or mouseleave on this popup or one opened from its content, handed on to the enclosing Tooltips
    const relay = (e: Event) => {
        runPortal(e);
        outerPopups?.relay(e);
    };

    const popupsIn = (inContent: boolean): TooltipPopups => ({
        register: (popup) => {
            descendants.add(popup);
            if (inContent) {
                contentDescendants.add(popup);
            }
            const unregister = outerPopups?.register(popup);
            return () => {
                descendants.delete(popup);
                contentDescendants.delete(popup);
                unregister?.();
            };
        },
        relay: inContent ? relay : (e) => outerPopups?.relay(e),
    });

    const triggerPopups = popupsIn(false);
    const contentPopups = popupsIn(true);

    const stop = (e: Event) => {
        if (props.stopPropagation) {
            e.stopPropagation();
        }
    };

    const arrow = (value: JSX.Element) => {
        if (value !== true) {
            return value === false ? undefined : value;
        }
        const Arrow = props.position.startsWith('left') || props.position.startsWith('right') ? TriangleArrowVertical : TriangleArrow;
        const style = props.style;
        return <Arrow class={`${props.prefixCls}-icon-arrow`} style={{ color: typeof style === 'object' ? style['background-color'] : undefined, fill: 'currentColor' }} />;
    };

    // Native listeners: delegated handlers would also get events a Portal inside the trigger bubbles up through its
    // logical parent, and Solid's delegation skips a disabled element
    createEffect(() => {
        const el = target();
        if (!el) {
            return;
        }
        const controller = new AbortController();
        for (const [name, handler] of Object.entries(state().triggerEventSet)) {
            // the foundation's closures write on the raw instance, outside the batching proxy; keydown in capture
            // runs before the trigger's own onKeyDown, which then sees its preventDefault
            el.addEventListener(
                name,
                (event) => {
                    if (!stays(event)) {
                        batch(() => handler(event));
                    }
                },
                { signal: controller.signal, capture: name === TRIGGER_EVENT_NAMES.keydown }
            );
        }
        onCleanup(() => controller.abort());
    });

    createEffect(() => {
        const el = inner();
        if (!el || !blocksPointer()) {
            return;
        }
        const previous = el.style.pointerEvents;
        el.style.pointerEvents = 'none';
        onCleanup(() => {
            el.style.pointerEvents = previous;
        });
    });

    // Portal's own effect runs before user effects, so the container is in the document here
    createEffect(
        on([phase, container], ([current, el]) => {
            if (!el) {
                return;
            }
            if (current === 'enter') {
                // reopened during its exit animation, it is still shown
                if (!el.matches(':popover-open')) {
                    el.showPopover();
                }
                foundation.handleShown();
                // read right after showPopover() to see the enter animation it started
                const entering = el.getAnimations();
                let cancelled = false;
                // a prop getter compiled from a conditional creates a memo, which needs this effect as its owner
                const owner = getOwner();
                // `:hover` is not updated yet in the mouseenter task; handleOpened's hover check runs a task later
                const timer = setTimeout(() => {
                    runWithOwner(owner, foundation.handleOpened);
                    void Promise.allSettled(entering.map((animation) => animation.finished)).then(() => {
                        // a hover popup that backed out in handleOpened, or one closed meanwhile, is leaving
                        if (!cancelled && openPending && foundation.getState('transitionState') === 'enter') {
                            openPending = false;
                            props.afterOpen?.();
                        }
                    });
                });
                onCleanup(() => {
                    cancelled = true;
                    clearTimeout(timer);
                });
            } else if (current === 'leave') {
                // The exit animation plays while the popup is still open, so it keeps the top layer; it hides once that
                // ends. Read right after the update that dropped the show class; cancelled ones settle too.
                const exits = el.getAnimations();
                let reopened = false;
                // always settles in a microtask: a hide() from the foundation's own timer commits unbatched, and
                // afterClose must follow its onVisibleChange(false)
                void Promise.allSettled(exits.map((animation) => animation.finished)).then(() => {
                    if (reopened || foundation.getState('transitionState') !== 'leave') {
                        return;
                    }
                    el.hidePopover();
                    if (!props.keepDOM) {
                        foundation.removePortal();
                    }
                    if (closePending) {
                        closePending = false;
                        props.afterClose?.();
                    }
                });
                onCleanup(() => {
                    reopened = true;
                });
            }
        })
    );

    // Non-modal layer: takes Escape while on top, and a Modal opened before it leaves it interactive. Registered from
    // insertion so it exists before the content mounts and takes focus.
    createEffect(() => {
        const el = container();
        if (isOpen() && el) {
            onCleanup(openLayer({ element: el, modal: false, onEscape: foundation.handleEscape }));
        }
    });

    // The name may point into the content, so check after it mounts. Only contentShown is tracked: an effect that
    // isOpen also queued in the same flush would run before the content is inserted.
    createEffect(on(contentShown, (shown) => shown && isDialog() && warnIfDialogUnnamed(container() ?? null, 'Popover'), { defer: true }));

    // handleShown measured the popup without its content: a top popup placed by a zero height would hang over the
    // trigger and take the next click until the resize observer runs
    createEffect(on(contentShown, (shown) => shown && foundation.calcPosition(), { defer: true }));

    // showPopover() ran its autofocus step before the content mounted
    createEffect(on(contentShown, (shown) => autofocus(shown, container()?.querySelector<HTMLElement>('[autofocus]'), { preventScroll: props.preventScroll }), { defer: true }));

    createEffect(
        on(
            createMemo(() => props.mouseLeaveDelay < props.mouseEnterDelay),
            (leavesFirst) => warning(leavesFirst, strings.LEAVE_DELAY_WARNING)
        )
    );

    // init reads trigger, clickToHide and visible in onMount, earlier in the same flush, and no effect between writes a
    // prop, so the deferred baseline is the value init read; a `previous === undefined` first-run check would also
    // skip a real change from undefined
    createEffect(
        on(
            createMemo(() => props.trigger),
            foundation.rebindEvents,
            { defer: true }
        )
    );

    createEffect(
        on(
            createMemo(() => props.clickToHide),
            foundation.rebindEvents,
            { defer: true }
        )
    );

    createEffect(
        on(
            createMemo(() => props.visible),
            foundation.handleVisiblePropChange,
            { defer: true }
        )
    );

    useWatch(() => props.position, foundation.calcPosition);

    // triggers check `condition` only before opening, so an open or pending popup is closed here; init opens a
    // controlled popup without checking it, so a change made before init counts too
    useWatch(
        () => props.condition,
        (condition) => {
            if (condition === false) {
                foundation.hide();
            }
        }
    );

    onMount(() => {
        if (isRender) {
            warning(!ownElement(), '[Semi Tooltip] spread getTriggerProps(own) on the trigger element and pass own ref through it');
            return;
        }
        // one Tab stop: a focusable child keeps it, and the description cannot reach it from the span
        const el = wrapper();
        const inside = Boolean(el && FocusTrapHandle.getFocusableElements(el).length);
        setFocusableInside(inside);
        warning(inside, '[Semi Tooltip] the trigger holds a focusable element the description cannot reach; pass children as (getTriggerProps) => JSX');
    });

    onMount(() => {
        const timer = setTimeout(foundation.updateStateIfCursorOnTrigger);
        onCleanup(() => clearTimeout(timer));
    });

    onMount(() => onCleanup(outerPopups?.register(container) ?? noop));

    // runs on unmount, after the foundation's destroy (registered in onMount, so owned and cleaned first), which closes the popup without reporting a close
    onCleanup(() => {
        if (closePending) {
            closePending = false;
            props.afterClose?.();
        }
    });

    // delivered once while created, like an element ref; the methods read the foundation and DOM only when called
    if (typeof ref === 'function') {
        ref(handle);
    }

    return (
        <>
            <SpecialTriggerContext.Provider value={specialTriggers}>
                <TooltipPopupsContext.Provider value={triggerPopups}>
                    {/* always provided, so an outer Tooltip's id does not reach this trigger's subtree */}
                    <TooltipDescriptionContext.Provider value={describedInside}>{renderTrigger()}</TooltipDescriptionContext.Provider>
                </TooltipPopupsContext.Provider>
            </SpecialTriggerContext.Provider>
            <Show when={state().isInsert ? state().portalTarget : null}>
                {(mount) => (
                    <Portal mount={mount()}>
                        <div
                            ref={(node) => {
                                setContainer(node);
                                onCleanup(() => setContainer(undefined));
                            }}
                            id={popupId()}
                            popover="manual"
                            tabIndex={-1}
                            // a consumer's role may be any string, e.g. Dropdown's presentation
                            role={props.role as JSX.HTMLAttributes<HTMLDivElement>['role']}
                            dir={config().direction}
                            aria-label={props.role === 'dialog' ? props['aria-label'] : undefined}
                            aria-labelledby={props.role === 'dialog' ? props['aria-labelledby'] : undefined}
                            class={clsx(state().colorScheme, props.class, `${props.prefixCls}-wrapper`, {
                                [`${props.prefixCls}-wrapper-show`]: state().visible,
                                [`${props.prefixCls}-with-arrow`]: Boolean(arrowChild()),
                                [`${props.prefixCls}-point-at-center`]: Boolean(arrowChild()) && props.arrowPointAtCenter,
                                [`${props.prefixCls}-no-motion`]: !props.motion,
                            })}
                            style={props.style}
                            onBeforeToggle={(e) => {
                                if (e.newState === 'open') {
                                    setContentShown(true);
                                }
                            }}
                            onMouseEnter={relay}
                            onMouseLeave={relay}
                            // delegated: a focus change in a popup opened from the content arrives here too
                            onFocusIn={(e) => {
                                runPortal(e);
                                stop(e);
                            }}
                            onFocusOut={(e) => {
                                runPortal(e);
                                stop(e);
                            }}
                            onClick={(e) => {
                                // a hover popup's click handler already hides it for clickToHide
                                if (state().portalEventSet[TRIGGER_EVENT_NAMES.click]) {
                                    runPortal(e);
                                } else if (props.clickToHide) {
                                    foundation.hide();
                                }
                                stop(e);
                            }}
                            onKeyDown={foundation.handleContainerKeydown}
                            onMouseDown={(e) => {
                                pressedInside = e;
                                stop(e);
                            }}
                        >
                            <Show when={contentShown()}>
                                <div class={`${prefix}-content`}>
                                    <PopupLayerContext.Provider value={layer}>
                                        <TooltipPopupsContext.Provider value={contentPopups}>
                                            {/* the portal sits under an outer trigger's provider, whose id must not reach this content */}
                                            <TooltipDescriptionContext.Provider value={undefined}>
                                                <PopupContent content={props.content} renderProps={contentProps} />
                                            </TooltipDescriptionContext.Provider>
                                        </TooltipPopupsContext.Provider>
                                    </PopupLayerContext.Provider>
                                </div>
                            </Show>
                            {arrow(arrowChild())}
                        </div>
                    </Portal>
                )}
            </Show>
        </>
    );
}
