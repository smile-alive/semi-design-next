import type React from 'react';
import { Fragment, cloneElement, isValidElement, useCallback, useEffect, useEffectEvent, useId, useImperativeHandle, useLayoutEffect, useState, type CSSProperties, type FragmentInstance } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { strings, cssClasses, numbers, TRIGGER_EVENT_NAMES, COLOR_SCHEME_SELECTOR, canRoleCarryPopupState, colorSchemeOf, isBlockDisplay, popupTarget, wrapsSpecialTrigger } from '@fibrae/semi-foundation/tooltip/constants';
import TooltipFoundation, { type TooltipAdapter, type Position } from '@fibrae/semi-foundation/tooltip/foundation';
import { joinIds, warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/tooltip/tooltip.scss';
import type { BaseProps } from '../_base/base-component';
import { PopupLayerContext } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useRealUnmount from '../_base/use-real-unmount';
import { stopPropagation } from '../_utils';
import { useButtonGroupLooks } from '../button/context';
import { useConfigContext } from '../config-provider/context';
import { TooltipDescriptionContext } from './context';
import TriangleArrow from './triangle-arrow';
import TriangleArrowVertical from './triangle-arrow-vertical';

export type Trigger = ArrayElement<typeof strings.TRIGGER_SET>;
export type { Position } from '@fibrae/semi-foundation/tooltip/foundation';

// `any`: the ref may hold a DOM element or a component handle such as InputHandle; only focus() is called
export interface RenderContentProps<T = any> {
    initialFocusRef?: React.RefObject<T>;
}

export type RenderContent<T = any> = (props: RenderContentProps<T>) => React.ReactNode;

export interface TooltipHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
    getPopupId: () => string;
    /** Hides the popup now without moving focus and reports onVisibleChange(false); with `visible` controlled it only reports, and the popup closes once the owner sets `visible` to false */
    hide: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

export interface TooltipProps extends BaseProps {
    children?: React.ReactNode;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    trigger?: Trigger;
    className?: string;
    clickToHide?: boolean;
    visible?: boolean;
    style?: React.CSSProperties;
    content?: React.ReactNode | RenderContent;
    prefixCls?: string;
    onVisibleChange?: (visible: boolean) => void;
    /** The click-outside listener sits on the window, so this gets the native mousedown event */
    onClickOutSide?: (e: MouseEvent) => void;
    spacing?: number | { x: number; y: number };
    showArrow?: boolean | React.ReactNode;
    role?: string;
    /** Name of a role="dialog" popup (F12); ignored for other roles */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    arrowPointAtCenter?: boolean;
    wrapWhenSpecial?: boolean;
    stopPropagation?: boolean;
    clickTriggerToHide?: boolean;
    wrapperClassName?: string;
    closeOnEsc?: boolean;
    guardFocus?: boolean;
    returnFocusOnClose?: boolean;
    /** Escape is handled on the document, so this gets the native event */
    onEscKeyDown?: (e: KeyboardEvent) => void;
    disableArrowKeyDown?: boolean;
    wrapperId?: string;
    preventScroll?: boolean;
    disableFocusListener?: boolean;
    /** Called once per opening when the popup is shown, as its enter transition starts */
    onOpen?: () => void;
    /** Called once per opening after the enter transition, not for an opening closed before it finishes */
    afterOpen?: () => void;
    afterClose?: () => void;
    keepDOM?: boolean;
    /**
     * When false, the tooltip does not show when triggered; turning false closes an open popup (only reports the close when `visible` is controlled)
     * @default true
     */
    condition?: boolean;
}

interface TooltipState {
    visible: boolean;
    transitionState: 'enter' | 'leave' | '';
    triggerEventSet: Record<string, any>;
    portalEventSet: Record<string, any>;
    isInsert: boolean;
    portalTarget: HTMLElement | ShadowRoot | null;
    colorScheme?: string;
}

const prefix = cssClasses.PREFIX;
const popupIdOf = (wrapperId: string | undefined, generatedId: string) => wrapperId || `${prefix}-${generatedId}`;

// FragmentInstance listens with DOM event names; the popup takes React props
const reactEventProps: Record<string, string> = {
    mouseenter: 'onMouseEnter',
    mouseleave: 'onMouseLeave',
    mouseout: 'onMouseOut',
    mouseover: 'onMouseOver',
    click: 'onClick',
    focusin: 'onFocus',
    focusout: 'onBlur',
    keydown: 'onKeyDown',
    contextmenu: 'onContextMenu',
};
function toReactEventProps(eventSet: Record<string, any>) {
    return Object.fromEntries(Object.entries(eventSet).map(([name, handler]) => [reactEventProps[name] ?? name, handler]));
}

const defaultProps = {
    autoAdjustOverflow: true,
    arrowPointAtCenter: true,
    trigger: 'hover',
    position: 'top',
    prefixCls: prefix,
    role: 'tooltip',
    mouseEnterDelay: numbers.MOUSE_ENTER_DELAY,
    mouseLeaveDelay: numbers.MOUSE_LEAVE_DELAY,
    motion: true,
    onVisibleChange: noop,
    onClickOutSide: noop,
    spacing: numbers.SPACING,
    showArrow: true,
    wrapWhenSpecial: true,
    closeOnEsc: true,
    guardFocus: false,
    returnFocusOnClose: false,
    onEscKeyDown: noop,
    disableFocusListener: false,
    disableArrowKeyDown: false,
    keepDOM: false,
    condition: true,
} satisfies Partial<TooltipProps>;

/**
 * The trigger FragmentInstance, popup node and adapter-managed listeners; one per Tooltip
 */
class TooltipRuntime {
    readonly #triggerElements = new Set<Element>();
    // cached between the observer's reports; undefined once they change the set
    #firstTriggerElement: Element | null | undefined;
    // inserted and afterOpen, afterClose not yet reported
    #openPending = false;
    #closePending = false;
    // handed to `content` as initialFocusRef; not named *Ref, which the React Compiler would read as a ref
    readonly initialFocus: { current: { focus?: (options?: FocusOptions) => void } | null } = { current: null };
    trigger: FragmentInstance | null = null;
    container: HTMLDivElement | null = null;
    clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    // last mousedown through the popup in the React tree, nested popups' portals included
    pressedInside: Event | null = null;
    readonly layer = Symbol('semi-popup-layer');

    setTrigger(frag: FragmentInstance | null) {
        if (!frag) {
            return undefined;
        }
        this.trigger = frag;
        const observer = new ResizeObserver((entries) => {
            // the Fragment also reports popups the trigger renders (a Select's list), which leave the document on close
            for (const el of this.#triggerElements) {
                if (!el.isConnected) {
                    this.#triggerElements.delete(el);
                }
            }
            for (const { target } of entries) {
                this.#triggerElements.add(target);
            }
            this.#firstTriggerElement = undefined;
        });
        frag.observeUsing(observer);
        return () => {
            frag.unobserveUsing(observer);
            observer.disconnect();
            this.#triggerElements.clear();
            this.#firstTriggerElement = undefined;
            this.trigger = null;
        };
    }

    // The first root in tree order (F1), never a popup the trigger renders (a Select's list)
    getTriggerElement() {
        if (this.#firstTriggerElement === undefined || !this.#firstTriggerElement?.isConnected) {
            const [first] = [...this.#triggerElements].filter((el) => el.isConnected && !el.hasAttribute('popover')).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
            this.#firstTriggerElement = first ?? null;
        }
        return this.#firstTriggerElement;
    }

    getTriggerRect() {
        // the observer reports the elements a frame after mount; a popup open from the start is positioned before that
        return this.getTriggerElement()?.getBoundingClientRect() ?? this.trigger?.getClientRects()[0] ?? null;
    }

    getPortalTarget() {
        const frag = this.trigger as (FragmentInstance & Pick<Node, 'compareDocumentPosition'>) | null;
        return popupTarget(
            frag?.getRootNode() as Document | ShadowRoot | undefined,
            // the Fragment's own host child is not "contained" by it, so check reactFragments
            (fullscreen) => Boolean(frag && (frag.compareDocumentPosition(fullscreen) & Node.DOCUMENT_POSITION_CONTAINS || (fullscreen as Node & { reactFragments?: Set<FragmentInstance> }).reactFragments?.has(frag)))
        );
    }

    getColorScheme(): string | undefined {
        // @types/react-dom 19.3 lacks compareDocumentPosition on FragmentInstance; drop the intersection once it has it
        const frag = this.trigger as (FragmentInstance & Pick<Node, 'compareDocumentPosition'>) | null;
        if (!frag) {
            return undefined;
        }
        const root = frag.getRootNode() as Document | ShadowRoot;
        // A FragmentInstance has no closest(), so the areas containing it are filtered from the root
        return colorSchemeOf([...root.querySelectorAll(COLOR_SCHEME_SELECTOR)].filter((el) => frag.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINS).at(-1));
    }

    setContainer(node: HTMLDivElement | null) {
        this.container = node;
    }

    markOpened() {
        this.#openPending = true;
        this.#closePending = true;
    }

    takePendingOpen() {
        const pending = this.#openPending;
        this.#openPending = false;
        return pending;
    }

    takePendingClose() {
        const pending = this.#closePending;
        this.#closePending = false;
        return pending;
    }

    isInTrigger(node: Node | null) {
        const frag = this.trigger;
        for (let current = node; frag && current; current = current.parentNode ?? (current as ShadowRoot).host) {
            if ((current as Node & { reactFragments?: Set<FragmentInstance> }).reactFragments?.has(frag)) {
                return true;
            }
        }
        return false;
    }

    isTriggerHovered() {
        // a Fragment ref reaches into portals, so hovering a popup the trigger renders counts
        const elements = [...this.#triggerElements].filter((el) => el.isConnected);
        if (elements.length) {
            return elements.some((el) => el.matches(':hover'));
        }
        const root = (this.trigger?.getRootNode() ?? document) as Document | ShadowRoot;
        const hovered = root.querySelectorAll(':hover');
        return this.isInTrigger(hovered[hovered.length - 1] ?? null);
    }
}

type SpecialStatus = typeof strings.STATUS_DISABLED | typeof strings.STATUS_LOADING | false;

/** `groupDisabled`: a Button without its own `disabled` takes the enclosing ButtonGroup's */
function getSpecialStatus(elem: React.ReactNode, groupDisabled?: boolean): SpecialStatus {
    if (!isValidElement<{ disabled?: boolean; loading?: boolean }>(elem)) {
        return false;
    }
    const elementType = (elem.type as { elementType?: string })?.elementType;
    const isButton = elementType === 'Button' || elementType === 'IconButton';
    if (elem.props?.disabled ?? (isButton && groupDisabled)) {
        return strings.STATUS_DISABLED;
    }
    return elem.props?.loading && isButton ? strings.STATUS_LOADING : false;
}

/** `focusInside`: the wrapped element keeps the Tab stop, so the span only takes the pointer events */
export function wrapSpan(elem: React.ReactNode, wrapperClassName?: string, focusInside = false) {
    const elementProps = isValidElement<{ style?: CSSProperties; block?: boolean }>(elem) ? elem.props : undefined;
    const style: React.CSSProperties = {};
    if (typeof elem !== 'string') {
        style.display = 'inline-block';
    }
    if (elementProps?.block || isBlockDisplay(elementProps?.style?.display)) {
        style.width = '100%';
    }
    return (
        <span className={clsx(`${prefix}-trigger-wrapper`, wrapperClassName)} style={style} tabIndex={focusInside ? -1 : undefined}>
            {elem}
        </span>
    );
}

/** Whether a trigger can carry the popup state attributes: a generic one (a Tag, a div, an icon) cannot */
export function canCarryPopupState(child: React.ReactElement<Record<string, any>>) {
    const { role } = child.props;
    if (role) {
        return canRoleCarryPopupState(role);
    }
    if (typeof child.type === 'string') {
        return child.type === 'button' || (child.type === 'a' && Boolean(child.props.href));
    }
    const elementType = (child.type as { elementType?: string }).elementType;
    return elementType === 'Button' || elementType === 'IconButton';
}

export default function Tooltip(rawProps: TooltipProps & { ref?: React.Ref<TooltipHandle> }) {
    const props = useDefaultProps('Tooltip', rawProps, defaultProps);
    const { mouseEnterDelay, mouseLeaveDelay } = props;
    const { wrapWhenSpecial, role, trigger, wrapperClassName } = props;

    const context = useConfigContext();

    const [runtime] = useState(() => new TooltipRuntime());

    // Content mounts after showPopover(): autoFocus content cannot focus inside a hidden popup
    const [contentShown, setContentShown] = useState(false);
    let children = props.children;
    let extraStyle: React.CSSProperties = {};
    let wrapsFocusTarget = false;

    const buttonGroup = useButtonGroupLooks();

    const generatedId = useId();

    const [foundation, state] = useFoundation<TooltipFoundation<TooltipProps, TooltipState>, TooltipAdapter<TooltipProps, TooltipState>, TooltipProps, TooltipState>(
        TooltipFoundation,
        props,
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
            const adapter: Omit<TooltipAdapter<TooltipProps, TooltipState>, keyof typeof base> = {
                insertPortal: () => {
                    runtime.markOpened();
                    base.setState({
                        isInsert: true,
                        transitionState: 'enter',
                        visible: true,
                        portalTarget: runtime.getPortalTarget(),
                        colorScheme: runtime.getColorScheme(),
                    });
                },
                closePopup: () => {
                    base.setState({ transitionState: 'leave', visible: false });
                },
                removePortal: () => {
                    setContentShown(false);
                    base.setState({ isInsert: false, transitionState: '' });
                },
                registerTriggerEvent: (triggerEventSet) => base.setState({ triggerEventSet }),
                registerPortalEvent: (portalEventSet) => base.setState({ portalEventSet }),
                notifyVisibleChange: (visible) => base.getProps().onVisibleChange(visible),
                registerClickOutsideHandler: (handler) => {
                    adapter.unregisterClickOutsideHandler();
                    runtime.clickOutsideHandler = handler;
                    window.addEventListener('mousedown', handler);
                },
                unregisterClickOutsideHandler: () => {
                    if (runtime.clickOutsideHandler) {
                        window.removeEventListener('mousedown', runtime.clickOutsideHandler);
                        runtime.clickOutsideHandler = null;
                    }
                },
                isEventInTrigger: (e) => runtime.isInTrigger(e.composedPath()[0] as Node),
                // a nested popup is portaled outside this DOM, but onMouseDownCapture sees it first
                isEventInPopup: (e) => isEventInside(e, runtime.container) || runtime.pressedInside === e,
                notifyClickOutSide: (e) => base.getProps().onClickOutSide(e),
                getPortalContainer: () => runtime.container,
                getTriggerNode: () => runtime.trigger,
                isTriggerHovered: () => runtime.isTriggerHovered(),
                getTriggerRect: () => runtime.getTriggerRect(),
                getTriggerElement: () => runtime.getTriggerElement(),
                observeTrigger: (observer) => runtime.trigger?.observeUsing(observer),
                unobserveTrigger: (observer) => runtime.trigger?.unobserveUsing(observer),
                setInitialFocus: () => {
                    const focusRefNode = runtime.initialFocus.current;
                    if (focusRefNode && 'focus' in focusRefNode) {
                        focusRefNode.focus({ preventScroll: base.getProps().preventScroll });
                    }
                },
                notifyOpen: () => base.getProps().onOpen?.(),
                notifyEscKeydown: (event) => base.getProps().onEscKeyDown(event),
                getPopupId: () => popupIdOf(base.getProps().wrapperId, generatedId),
            };
            return adapter;
        },
        context
    );

    const popupId = popupIdOf(props.wrapperId, generatedId);

    // Non-modal layer: takes Escape while on top, and a Modal opened before it leaves it interactive. Registered from
    // insertion so it exists before the content mounts and takes focus.
    const isOpen = state.isInsert && state.transitionState !== 'leave';

    // the name may point into the content, so check after it mounts
    const warnsUnnamedDialog = props.role === 'dialog';

    // wrappers keep the runtime out of a ref position, which the React Compiler would treat as a ref
    const setTrigger = useCallback((frag: FragmentInstance | null) => runtime.setTrigger(frag), [runtime]);

    const setContainer = useCallback((node: HTMLDivElement | null) => runtime.setContainer(node), [runtime]);

    const didOpen = useEffectEvent(() => {
        if (runtime.takePendingOpen()) {
            props.afterOpen?.();
        }
    });

    const didLeave = useEffectEvent(() => {
        if (!props.keepDOM) {
            foundation.removePortal();
        }
        if (runtime.takePendingClose()) {
            props.afterClose?.();
        }
    });

    const renderIcon = () => {
        const { showArrow, prefixCls, style } = props;
        if (!showArrow) {
            return null;
        }
        if (isValidElement(showArrow)) {
            return showArrow;
        }
        const ArrowIcon = props.position.includes('left') || props.position.includes('right') ? TriangleArrowVertical : TriangleArrow;
        return <ArrowIcon className={`${prefixCls}-icon-arrow`} style={{ color: style?.backgroundColor, fill: 'currentColor' }} />;
    };

    const renderPortal = () => {
        const { visible, portalEventSet } = state;
        const { prefixCls, content, showArrow, style, motion, role, className: propClassName } = props;
        const contentNode = typeof content === 'function' ? content({ initialFocusRef: runtime.initialFocus }) : content;
        const pointAtCenter = Boolean(showArrow) && props.arrowPointAtCenter;
        const className = clsx(state.colorScheme, propClassName, {
            [`${prefixCls}-wrapper`]: true,
            [`${prefixCls}-wrapper-show`]: visible,
            [`${prefixCls}-with-arrow`]: Boolean(showArrow),
            [`${prefixCls}-point-at-center`]: pointAtCenter,
            [`${prefixCls}-no-motion`]: !motion,
        });
        // the popup's own handlers below run these too, so stopPropagation still applies
        const { onBlur: portalBlur, onClick: portalClick, onFocus: portalFocus, ...portalEvents } = toReactEventProps(portalEventSet);
        const stop = (e: React.MouseEvent | React.FocusEvent<HTMLElement>) => props.stopPropagation && stopPropagation(e);

        return (
            // tabIndex -1 keeps it out of the tab order; popover="manual" (T4):
            // Semi drives open/close, not UA light dismiss. The foundation writes x-placement and the position.
            <div
                ref={setContainer}
                className={className}
                style={style}
                aria-label={role === 'dialog' ? props['aria-label'] : undefined}
                aria-labelledby={role === 'dialog' ? props['aria-labelledby'] : undefined}
                dir={context.direction}
                role={role}
                tabIndex={-1}
                popover="manual"
                onBeforeToggle={(e) => {
                    if (e.newState === 'open') {
                        setContentShown(true);
                    }
                }}
                {...portalEvents}
                id={popupId}
                onBlur={(e) => {
                    portalBlur?.(e);
                    stop(e);
                }}
                onClick={(e) => {
                    // a hover popup's click handler already hides it for clickToHide
                    if (portalClick) {
                        portalClick(e);
                    } else if (props.clickToHide) {
                        foundation.hide();
                    }
                    stop(e);
                }}
                onFocus={(e) => {
                    portalFocus?.(e);
                    stop(e);
                }}
                onKeyDown={foundation.handleContainerKeydown}
                onMouseDown={stop}
                onMouseDownCapture={(e) => {
                    runtime.pressedInside = e.nativeEvent;
                }}
            >
                {contentShown && (
                    <div className={`${prefix}-content`}>
                        <PopupLayerContext value={runtime.layer}>
                            {/* the portal sits under an outer trigger's provider, whose id must not reach this content */}
                            <TooltipDescriptionContext value={undefined}>{contentNode}</TooltipDescriptionContext>
                        </PopupLayerContext>
                    </div>
                )}
                {renderIcon()}
            </div>
        );
    };

    // Popover is a dialog trigger, Tooltip describes it; other popups (a combobox list) are wired by their owner
    // Generic triggers get no popup state: ARIA forbids it
    const getAriaAttribute = (target: React.ReactElement<Record<string, any>>) => {
        // an IDREF to a popup not in the document points at nothing
        if (role === 'tooltip') {
            const own = target.props['aria-describedby'];
            return state.isInsert ? { 'aria-describedby': joinIds(own, popupId) } : {};
        }
        return role === 'dialog' && canCarryPopupState(target)
            ? {
                  'aria-expanded': state.visible ? 'true' : 'false',
                  'aria-haspopup': 'dialog',
                  ...(state.isInsert && { 'aria-controls': popupId }),
              }
            : {};
    };

    // the child's own values win, but its own description is joined with the popup's; an explicit undefined opts
    // out (Slider describes its input itself)
    const withAria = (target: React.ReactElement<Record<string, any>>) => {
        const aria = getAriaAttribute(target);
        const joinsDescription = Boolean(target.props['aria-describedby']) && 'aria-describedby' in aria;
        return { ...aria, ...target.props, ...(joinsDescription && { 'aria-describedby': aria['aria-describedby'] }) };
    };

    // keydown is excluded; it is merged into the trigger's onKeyDown below
    useLayoutEffect(() => {
        const frag = runtime.trigger;
        if (!frag) {
            return undefined;
        }
        const listeners = Object.entries(state.triggerEventSet).filter(([name]) => name !== TRIGGER_EVENT_NAMES.keydown) as [string, EventListener][];
        for (const [name, handler] of listeners) {
            frag.addEventListener(name, handler);
        }
        return () => {
            for (const [name, handler] of listeners) {
                frag.removeEventListener(name, handler);
            }
        };
    }, [runtime, state.triggerEventSet]);

    // Activity hides a kept popup by disconnecting effects, so the leave below never runs; display:none alone would
    // leave it open in the top layer. Keyed on insertion only: entering or leaving must not hide it.
    useLayoutEffect(() => {
        const el = runtime.container;
        if (!el || !state.isInsert) {
            return undefined;
        }
        return () => el.hidePopover();
    }, [runtime, state.isInsert]);

    // Top layer enter/leave runs after commit so the container ref is attached
    useLayoutEffect(() => {
        const el = runtime.container;
        if (!el || !state.isInsert) {
            return undefined;
        }
        if (state.transitionState === 'enter') {
            // reopened during its exit animation, it is still shown
            if (!el.matches(':popover-open')) {
                el.showPopover();
            }
            foundation.handleShown();
            // read right after showPopover() to see the enter animation it started
            const entering = el.getAnimations();
            let cancelled = false;
            // `:hover` is not updated yet in the mouseenter task; handleOpened's hover check runs a task later
            const timer = setTimeout(() => {
                foundation.handleOpened();
                void Promise.allSettled(entering.map((animation) => animation.finished)).then(() => {
                    // a hover popup that backed out in handleOpened, or one closed meanwhile, is leaving
                    if (!cancelled && foundation.getState('transitionState') === 'enter') {
                        didOpen();
                    }
                });
            });
            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }
        if (state.transitionState !== 'leave') {
            return undefined;
        }
        // The exit animation plays while the popup is still open, so it keeps the top layer; it hides once that ends.
        // Read right after the commit that dropped the show class; cancelled ones settle too.
        const exits = el.getAnimations();
        if (!exits.length) {
            // An Activity reveal commits the 'leave' rendered while hidden, after useFoundation's effect has already
            // run init -> show; that popup is opening, not closing
            if (foundation.getState('transitionState') === 'leave') {
                el.hidePopover();
                didLeave();
            }
            return undefined;
        }
        let reopened = false;
        void Promise.allSettled(exits.map((animation) => animation.finished)).then(() => {
            // show() moves the foundation state to 'enter' at once, but `reopened` only at the commit, which a
            // timer-driven show() leaves to a later task; the exits can settle in between
            if (!reopened && foundation.getState('transitionState') === 'leave') {
                el.hidePopover();
                didLeave();
            }
        });
        return () => {
            reopened = true;
        };
    }, [runtime, foundation, state.isInsert, state.transitionState]);

    useLayoutEffect(() => {
        if (!isOpen) {
            return undefined;
        }
        return openLayer({ element: runtime.container, modal: false, onEscape: foundation.handleEscape });
    }, [isOpen, runtime, foundation]);

    // handleShown measured the popup before its content mounted: a top popup placed by a zero height would hang over
    // the trigger and take the next click until the resize observer runs
    useLayoutEffect(() => {
        if (contentShown) {
            foundation.calcPosition();
        }
    }, [contentShown, foundation]);

    useEffect(() => {
        if (isOpen && contentShown && warnsUnnamedDialog) {
            warnIfDialogUnnamed(runtime.container, 'Popover');
        }
    }, [isOpen, contentShown, warnsUnnamedDialog, runtime]);

    useEffect(() => {
        const timer = setTimeout(foundation.updateStateIfCursorOnTrigger);
        return () => clearTimeout(timer);
    }, [foundation]);

    useEffect(() => {
        warning(mouseLeaveDelay < mouseEnterDelay, strings.LEAVE_DELAY_WARNING);
    }, [mouseEnterDelay, mouseLeaveDelay]);

    useDidUpdate(props.trigger, foundation.rebindEvents);
    useDidUpdate(props.clickToHide, foundation.rebindEvents);
    useDidUpdate(props.visible, foundation.handleVisiblePropChange);
    useDidUpdate(props.position, foundation.calcPosition);

    // triggers check `condition` only before opening, so an open or pending popup is closed here
    useDidUpdate(props.condition, (condition) => {
        if (condition === false) {
            foundation.hide();
        }
    });

    useRealUnmount(() => {
        if (runtime.takePendingClose()) {
            props.afterClose?.();
        }
    });

    useImperativeHandle(
        props.ref,
        () => ({
            focusTrigger: foundation.focusTrigger,
            getPopupId: () => popupId,
            hide: foundation.hide,
            rePosition: foundation.calcPosition,
        }),
        [foundation, popupId]
    );

    if (wrapWhenSpecial) {
        const special = getSpecialStatus(children, buttonGroup?.disabled);
        if (special) {
            const element = children as React.ReactElement<{ style?: CSSProperties }>;
            // a loading Button ignores the pointer and a disabled one gets no click (F4), so a wrapper takes those
            const needsWrapper = wrapsSpecialTrigger(trigger, special === strings.STATUS_LOADING);
            if (needsWrapper || trigger === 'custom') {
                children = cloneElement(element, { style: { ...element.props.style, pointerEvents: 'none' } });
            }
            if (needsWrapper) {
                wrapsFocusTarget = special === strings.STATUS_LOADING;
                if (wrapsFocusTarget) {
                    const inner = children as React.ReactElement<Record<string, any>>;
                    children = cloneElement(inner, withAria(inner));
                }
                children = wrapSpan(children, wrapperClassName, wrapsFocusTarget);
                if (special === strings.STATUS_DISABLED) {
                    extraStyle = { cursor: 'not-allowed' };
                }
            }
        }
    }

    if (!isValidElement(children)) {
        // text gets no pointer events through the Fragment (G1)
        children = wrapSpan(children, wrapperClassName);
    }

    const child = children as React.ReactElement<Record<string, any>>;

    // runs before the trigger's own onKeyDown, which sees its preventDefault
    const tooltipKeyDown = state.triggerEventSet[TRIGGER_EVENT_NAMES.keydown];
    const ownKeyDown = child.props.onKeyDown;

    const triggerChild = cloneElement(child, {
        ...(wrapsFocusTarget ? child.props : withAria(child)),
        onKeyDown: tooltipKeyDown
            ? (e: React.KeyboardEvent) => {
                  tooltipKeyDown(e);
                  ownKeyDown?.(e);
              }
            : ownKeyDown,
        style: { ...child.props.style, ...extraStyle },
        className: clsx(child.props.className),
        // keyboard access; some triggers such as Select set -1 or 0 themselves
        tabIndex: child.props.tabIndex || 0,
        'data-popupid': popupId,
    });

    const describedInside = role === 'tooltip' && state.isInsert && 'aria-describedby' in child.props && child.props['aria-describedby'] === undefined;

    return (
        <>
            {/* always provided, so an outer Tooltip's id does not reach this trigger's subtree */}
            <TooltipDescriptionContext value={describedInside ? popupId : undefined}>
                <Fragment ref={setTrigger}>{triggerChild}</Fragment>
            </TooltipDescriptionContext>
            {state.isInsert && state.portalTarget && createPortal(renderPortal(), state.portalTarget)}
        </>
    );
}
