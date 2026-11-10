import type React from 'react';
import { Fragment, cloneElement, isValidElement, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useState, type CSSProperties, type FragmentInstance } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { strings, cssClasses, numbers, TRIGGER_EVENT_NAMES, COLOR_SCHEME_SELECTOR, canRoleCarryPopupState, colorSchemeOf, isBlockDisplay, popupTarget, wrapsSpecialTrigger } from '@fibrae/semi-foundation/components/tooltip/constants';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseState, type Position } from '@fibrae/semi-foundation/components/tooltip/foundation';
import { joinIds, warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import { POPUP_ID_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/components/tooltip/tooltip.scss';
import type { BaseProps } from '../../base/base-props';
import { PopupLayerContext } from '../../base/popup-layer';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useRealUnmount from '../../hooks/use-real-unmount';
import { stopPropagation } from '../../utils';
import { useButtonGroupLooks } from '../button/context';
import { useConfigContext } from '../config-provider/context';
import { TooltipDescriptionContext } from './context';
import TriangleArrow from './triangle-arrow';
import TriangleArrowVertical from './triangle-arrow-vertical';

type Foundation = TooltipFoundation<TooltipProps>;
type Adapter = TooltipAdapter<TooltipProps>;

export type Trigger = ArrayElement<typeof strings.TRIGGER_SET>;
export type { Position } from '@fibrae/semi-foundation/components/tooltip/foundation';

// `any`: the ref may hold a DOM element or a component handle such as InputHandle; only focus() is called
export interface RenderContentProps<T = any> {
    initialFocusRef?: React.RefObject<T>;
}

export type RenderContent<T = any> = (props: RenderContentProps<T>) => React.ReactNode;

export interface TooltipHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
    getPopupId: () => string;
    /** The popup element, null while it is not in the document */
    getPopup: () => HTMLElement | null;
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
    /** Name and description of a role="dialog" popup (F12); ignored for other roles */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
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

class TooltipRuntime {
    readonly #triggerElements = new Set<Element>();
    // cached between the observer's reports; undefined once they change the set
    #firstTriggerElement: Element | null | undefined;
    // handed to `content` as initialFocusRef; not named *Ref, which the React Compiler would read as a ref
    readonly initialFocus: { current: { focus?: (options?: FocusOptions) => void } | null } = { current: null };
    trigger: FragmentInstance | null = null;
    container: HTMLDivElement | null = null;
    lastContainer: HTMLDivElement | null = null;
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
        if (node) {
            this.lastContainer = node;
        }
    }

    // Activity hides the popup but keeps it in the document; only a real unmount removes it
    isPopupRemoved() {
        return !this.lastContainer?.isConnected;
    }

    waitAnimations() {
        const animations = this.container?.getAnimations() ?? [];
        return animations.length ? Promise.allSettled(animations.map((animation) => animation.finished)) : null;
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
    const { wrapWhenSpecial, role, trigger, wrapperClassName, showArrow, prefixCls, style, content, motion, className: propClassName } = props;

    const context = useConfigContext();

    const [runtime] = useState(() => new TooltipRuntime());

    // Content mounts after showPopover(): autoFocus content cannot focus inside a hidden popup
    const [contentShown, setContentShown] = useState(false);
    let children = props.children;
    let extraStyle: React.CSSProperties = {};
    let wrapsFocusTarget = false;

    const buttonGroup = useButtonGroupLooks();

    const generatedId = useId();

    const [foundation, state] = useFoundation<Foundation, Adapter, TooltipProps, TooltipBaseState>(
        TooltipFoundation,
        props,
        () => TooltipFoundation.getInitialState(),
        (base) => {
            const adapter: Omit<TooltipAdapter<TooltipProps>, keyof typeof base> = {
                insertPortal: () => ({ portalTarget: runtime.getPortalTarget(), colorScheme: runtime.getColorScheme() }),
                removePortal: () => setContentShown(false),
                showPopover: () => {
                    if (!runtime.container?.matches(':popover-open')) {
                        runtime.container?.showPopover();
                    }
                },
                // the last element: Activity hides the popup through destroy, where the ref may already be detached
                hidePopover: () => runtime.lastContainer?.hidePopover(),
                waitAnimations: () => runtime.waitAnimations(),
                notifyAfterOpen: () => base.getProps().afterOpen?.(),
                notifyAfterClose: () => base.getProps().afterClose?.(),
                notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
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
                notifyClickOutSide: (e) => base.getProps().onClickOutSide?.(e),
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
                notifyEscKeydown: (event) => base.getProps().onEscKeyDown?.(event),
                getPopupId: () => popupIdOf(base.getProps().wrapperId, generatedId),
            };
            return adapter;
        },
        context
    );

    const popupId = popupIdOf(props.wrapperId, generatedId);
    const isOpen = state.isInsert && state.transitionState !== 'leave';

    // the name may point into the content, so check after it mounts
    const warnsUnnamedDialog = role === 'dialog';

    // wrappers keep the runtime out of a ref position, which the React Compiler would treat as a ref
    const setTrigger = useCallback((frag: FragmentInstance | null) => runtime.setTrigger(frag), [runtime]);

    const setContainer = useCallback((node: HTMLDivElement | null) => runtime.setContainer(node), [runtime]);

    const renderIcon = () => {
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
            // popover="manual" (T4): Semi drives open/close, not UA light dismiss
            <div
                ref={setContainer}
                className={className}
                style={style}
                aria-describedby={role === 'dialog' ? props['aria-describedby'] : undefined}
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

    // the effects remount when Activity shows a hidden popup again, which syncs it again
    useLayoutEffect(() => {
        foundation.syncPopup();
    }, [foundation, state.isInsert, state.transitionState]);

    // syncPopup measured the popup before its content mounted: a top popup placed by a zero height would hang over
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

    useRealUnmount(() => {
        if (runtime.isPopupRemoved()) {
            foundation.handleUnmount();
        }
    });

    useImperativeHandle(
        props.ref,
        () => ({
            focusTrigger: foundation.focusTrigger,
            getPopupId: () => popupId,
            getPopup: () => runtime.container,
            hide: foundation.hide,
            rePosition: foundation.calcPosition,
        }),
        [foundation, popupId, runtime]
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
        // some triggers such as Select set -1 or 0 themselves
        tabIndex: child.props.tabIndex || 0,
        [POPUP_ID_ATTRIBUTE]: popupId,
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
