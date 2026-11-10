import type { FocusableElement } from 'tabbable';
import FocusTrapHandle from '../../base/focus-handle';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import PopupLifecycle from '../../base/popup-lifecycle';
import ReleaseHolder from '../../base/release-holder';
import { openLayer, popupTriggerSelector } from '../../utils/layer';
import type { ArrayElement } from '../../utils/type';
import warning from '../../utils/warning';
import { adjustPosition } from './adjust-position';
import { numbers, strings, TRIGGER_EVENT_NAMES as eventNames } from './constants';

export interface TooltipAdapter<P extends TooltipBaseProps = TooltipBaseProps> extends DefaultAdapter<P, TooltipBaseState> {
    /** Reports a visibility change, or under a controlled `visible` a request the owner decides on */
    notifyVisibleChange(isVisible: boolean): void;
    /** Resolves, from the trigger, where the popup mounts and the color scheme around it; the foundation then inserts it */
    insertPortal(): Pick<TooltipBaseState, 'portalTarget' | 'colorScheme'>;
    /** Drops what the host renders into the popup itself (its content), right before the foundation unmounts the popup */
    removePortal(): void;
    /** Shows the popup in the top layer, unless it is still open (reopened during its exit animation) */
    showPopover(): void;
    hidePopover(): void;
    /**
     * Settles once the popup's running animations finish or are cancelled, read when called; null when none runs, so
     * the step finishes at once
     */
    waitAnimations(): Promise<unknown> | null;
    /** Once per opening, after the enter animation; not for an opening closed before it finishes */
    notifyAfterOpen(): void;
    /** Once per opening, after the popup left or when the component unmounts while it is shown */
    notifyAfterClose(): void;
    /** Binds `handler` to every mousedown in the window until `unregisterClickOutsideHandler` */
    registerClickOutsideHandler(handler: (e: MouseEvent) => void): void;
    unregisterClickOutsideHandler(): void;
    isEventInTrigger(e: MouseEvent): boolean;
    /** Whether the press went through the popup, or through a popup opened from its content */
    isEventInPopup(e: MouseEvent): boolean;
    notifyClickOutSide(e: MouseEvent): void;
    getPortalContainer(): HTMLElement | null;
    setInitialFocus(): void;
    /** The popup is shown and its enter transition has started; once per opening */
    notifyOpen(): void;
    notifyEscKeydown(event: KeyboardEvent): void;
    getTriggerNode(): any;
    getPopupId(): string;
    isTriggerHovered(): boolean;
    /** Viewport rect of the trigger, the union of its boxes; null while it renders none */
    getTriggerRect(): DOMRect | null;
    /** The element getTriggerRect measures; null while unknown, and then every scroll repositions the popup */
    getTriggerElement(): Element | null;
    observeTrigger(observer: ResizeObserver | IntersectionObserver): void;
    unobserveTrigger(observer: ResizeObserver | IntersectionObserver): void;
}

export type Position = ArrayElement<typeof strings.POSITION_SET>;

// The inline properties calcPosition owns on the popup. It writes them to the DOM, not through host state: scroll and
// observer callbacks run outside every framework's batching, and a re-render there would land a frame late. Hosts
// therefore leave `x-placement` and these properties out of what they render.
const POSITION_PROPERTIES = ['left', 'top', 'transform-origin', 'visibility', '--semi-tooltip-trigger-width', '--semi-tooltip-arrow-offset-x', '--semi-tooltip-arrow-offset-y'] as const;

type PositionStyle = Partial<Record<(typeof POSITION_PROPERTIES)[number], string>>;

type Viewport = { width: number; height: number };

type Layout = { placement: Position; style: PositionStyle; triggerRect: DOMRect; viewport: Viewport };

// the top layer's fixed containing block is the viewport without its scrollbars
const readViewport = (): Viewport => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });

// composed ancestors: a trigger in a shadow root still moves when the page around its host scrolls
function isInside(node: Node, target: EventTarget | null) {
    for (let current: Node | null = node; current; current = current instanceof ShadowRoot ? current.host : current.parentNode) {
        if (current === target) {
            return true;
        }
    }
    return false;
}

export interface TooltipBaseProps {
    arrowPointAtCenter?: boolean;
    autoAdjustOverflow?: boolean;
    clickToHide?: boolean;
    clickTriggerToHide?: boolean;
    closeOnEsc?: boolean;
    condition?: boolean;
    disableArrowKeyDown?: boolean;
    disableFocusListener?: boolean;
    guardFocus?: boolean;
    keepDOM?: boolean;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    position?: Position;
    preventScroll?: boolean;
    returnFocusOnClose?: boolean;
    showArrow?: unknown;
    spacing?: number | { x: number; y: number };
    trigger?: ArrayElement<typeof strings.TRIGGER_SET>;
    visible?: boolean;
}

export interface TooltipBaseState {
    isInsert: boolean;
    /** The popup's phase, which `syncPopup` acts on after each commit */
    transitionState: 'enter' | 'leave' | '';
    triggerEventSet: Record<string, any>;
    portalEventSet: Record<string, any>;
    visible: boolean;
    /** Where the popup mounts, resolved by the adapter's `insertPortal` from the trigger */
    portalTarget: HTMLElement | ShadowRoot | null;
    /** The color scheme class of the area around the trigger, resolved by the adapter's `insertPortal` */
    colorScheme: string | undefined;
}

export default class Tooltip<P extends TooltipBaseProps = TooltipBaseProps> extends BaseFoundation<TooltipAdapter<P>, P, TooltipBaseState> {
    // Open popups share one scroll and one resize listener. Affected popups are repositioned together in a frame
    // callback, all reads before all writes, so one popup's write never forces layout for the next one's read. Scroll
    // and resize events are dispatched before frame callbacks, so the popups still move in the frame that scrolled.
    static #tracking = new Set<Tooltip<any>>();
    static #pending = new Set<Tooltip<any>>();
    static #frame = 0;
    #timer: ReturnType<typeof setTimeout>;
    #mounted: boolean;
    #isClickToHide = false;
    // From show() until hide(), including before `#handleOpened`; `visible` only turns true after it
    #open = false;
    // a popup shown again after a hide (Activity, KeepAlive) runs #handleOpened again but is not a new opening
    #openReported = false;
    // #handleOpened runs once per showing, though a host may sync the same phase again (a new popup element)
    #openedHandled = false;
    readonly #lifecycle = new PopupLifecycle();
    // the non-modal overlay layer: takes Escape while on top, and a Modal opened before it leaves it interactive
    readonly #layer = new ReleaseHolder();
    // bumped by every syncPopup and by destroy: a wait or timer of an older phase is stale
    #syncStep = 0;
    #openTimer: ReturnType<typeof setTimeout> | undefined;
    #cursorTimer: ReturnType<typeof setTimeout> | undefined;
    #focusTrap: FocusTrapHandle | null = null;
    // the last request made to a controlled owner; applying it skips the hover or focus delay already waited out
    #requestedVisible: boolean | undefined;
    // decided when the click-outside listener is bound: a custom trigger only reports the press
    #hidesOnClickOutside = false;
    #stopTracking: (() => void) | null = null;
    #triggerVisible = true;
    #applied: Layout | null = null;
    // watches the trigger leave the rect it was last placed by, for moves no scroll or resize reports
    #moveWatch: { trigger: Element; rootMargin: string; observer: IntersectionObserver } | null = null;
    // the popup's border box from the resize observer: fractional and without the enter transition's scale()
    #popupSize: { width: number; height: number } | null = null;
    // The viewport's top band a fixed page header covers. The top layer paints over any z-index, so the popup instead
    // keeps out of the band and hides once its trigger is under it. Read once per opening.
    #insetTop = 0;
    static override readonly propKeys = ['trigger', 'clickToHide', 'visible', 'position', 'condition', 'mouseEnterDelay', 'mouseLeaveDelay'];

    constructor(adapter: TooltipAdapter<P>) {
        super(adapter);
        this.#timer = null;
    }

    static #handleScroll(event: Event) {
        for (const tooltip of Tooltip.#tracking) {
            const trigger = tooltip.adapter.getTriggerElement();
            // a scroll elsewhere (a Select's own list, another pane) leaves the trigger where it was
            if (!trigger || isInside(trigger, event.target)) {
                Tooltip.#pending.add(tooltip);
            }
        }
        Tooltip.#schedule();
    }

    static #handleResize() {
        for (const tooltip of Tooltip.#tracking) {
            Tooltip.#pending.add(tooltip);
        }
        Tooltip.#schedule();
    }

    static #schedule() {
        if (Tooltip.#pending.size && !Tooltip.#frame) {
            Tooltip.#frame = requestAnimationFrame(Tooltip.#flush);
        }
    }

    static #flush() {
        Tooltip.#frame = 0;
        const batch = [...Tooltip.#pending];
        Tooltip.#pending.clear();
        const viewport = readViewport();
        const layouts = batch.map((tooltip) => tooltip.#measure(viewport));
        batch.forEach((tooltip, i) => tooltip.#apply(layouts[i]));
    }

    // The host answers the trigger and popup checks separately: a press in a portaled popup reaches its logical ancestors differently in each framework.
    #handleClickOutside = (e: MouseEvent) => {
        if (!this.adapter.getPortalContainer() || this.adapter.isEventInTrigger(e) || this.adapter.isEventInPopup(e)) {
            return;
        }
        this.adapter.notifyClickOutSide(e);
        if (this.#hidesOnClickOutside) {
            this.hide();
        }
    };

    #bindEvent() {
        const trigger = this.getProp('trigger');
        this.setState(this.#generateEvent(trigger));
    }

    /** Regenerates the trigger and popup handlers, which depend on `trigger` and `clickToHide` */
    #rebindEvents() {
        this.#clearDelayTimer();
        this.#bindEvent();
    }

    #handleVisiblePropChange() {
        const visible = this.getProp('visible');
        // Known limit: a rejected request is only dropped by the next prop change, so an owner that later sets the
        // requested value on its own also skips the delay. Upgrade once owners need their own hover delay there.
        const answered = visible === this.#requestedVisible;
        this.#requestedVisible = undefined;
        const delayed = ['hover', 'focus'].includes(this.getProp('trigger')) && !answered;
        if (visible) {
            if (delayed) {
                this.delayShow();
            } else {
                this.show();
            }
        } else if (delayed) {
            this.delayHide();
        } else {
            this.hide();
        }
    }

    #removePortal() {
        this.adapter.removePortal();
        this.setState({ isInsert: false, transitionState: '' });
    }

    #warnLeaveDelay() {
        const { mouseEnterDelay, mouseLeaveDelay } = this.getProps();
        warning((mouseLeaveDelay ?? 0) < (mouseEnterDelay ?? 0), strings.LEAVE_DELAY_WARNING);
    }

    // Runs `step` once `wait` settles, unless a later sync or a destroy made this phase stale
    #afterAnimations(wait: Promise<unknown> | null, step: () => void) {
        const current = this.#syncStep;
        const run = () => {
            if (current === this.#syncStep) {
                step();
            }
        };
        if (wait) {
            void wait.then(run);
        } else {
            run();
        }
    }

    #updateStateIfCursorOnTrigger() {
        if (this.adapter.isTriggerHovered()) {
            this.getState('triggerEventSet')[eventNames.mouseEnter]?.();
        }
    }

    #handleShown() {
        if (!this.#stopTracking) {
            this.#startTracking();
        }
        this.calcPosition();
    }

    // Runs once per showing, again when a hidden popup is shown again; a hover popup can still back out here if the
    // pointer already left. The opening is reported only the first time.
    #handleOpened() {
        if (!this.#open) {
            return;
        }
        // a controlled owner that shows the popup decides when it closes, not where the pointer is
        if (this.getProp('trigger') === 'hover' && this.getProp('visible') !== true) {
            // a focus may already have moved on (ArrowDown into the popup) or still count as current;
            // disableFocusListener covers neither
            const activeElement = this.#getActiveElement();
            // the focus may be on a control inside the trigger element (the input of a Switch)
            const focusOpened = !this.getProp('disableFocusListener') && activeElement?.closest?.(popupTriggerSelector(this.adapter.getPopupId())) != null;
            const focusInPopup = Boolean(this.adapter.getPortalContainer()?.contains(activeElement));
            if (!this.adapter.isTriggerHovered() && !focusOpened && !focusInPopup) {
                this.hide();
                return;
            }
        }
        if (this.#openReported) {
            return;
        }
        this.#openReported = true;
        this.adapter.setInitialFocus();
        this.adapter.notifyOpen();
        this.#reportVisibleChange(true);
    }

    #enter() {
        // before showPopover(): the content mounts on beforetoggle and may take focus
        this.#layer.hold(() => openLayer({ element: this.adapter.getPortalContainer(), modal: false, onEscape: this.handleEscape }));
        this.adapter.showPopover();
        this.#handleShown();
        // read right after showPopover() to see the enter animation it started
        const entering = this.adapter.waitAnimations();
        // `:hover` is not updated yet in the mouseenter task, so the hover check of #handleOpened runs a task later
        this.#openTimer = setTimeout(() => {
            if (!this.#openedHandled) {
                this.#openedHandled = true;
                this.#handleOpened();
            }
            // a hover popup that backed out in #handleOpened, or one closed meanwhile, is leaving
            this.#afterAnimations(entering, () => {
                if (this.getState('transitionState') === 'enter') {
                    this.#lifecycle.entered(() => this.adapter.notifyAfterOpen());
                }
            });
        });
    }

    // The exit animation plays while the popup is still open, so it keeps the top layer; it hides once that ends.
    // Read right after the commit that dropped the show class; cancelled animations settle too.
    #leave() {
        // released at the commit, not at hide(): a close and a reopen in one task (focus moving from the trigger into
        // the popup) commit no leave, and the popup keeps its layer
        this.#layer.release();
        this.#afterAnimations(this.adapter.waitAnimations(), () => {
            if (this.getState('transitionState') !== 'leave') {
                return;
            }
            this.adapter.hidePopover();
            if (!this.getProp('keepDOM')) {
                this.#removePortal();
            }
            this.#lifecycle.ended(() => this.adapter.notifyAfterClose());
        });
    }

    // window-level: bound only while shown, or one click would fire every instance's handler
    #watchClickOutside() {
        const { trigger, clickTriggerToHide } = this.getProps();
        const hides = trigger === 'click' || clickTriggerToHide || trigger === 'contextMenu';
        if (hides || trigger === 'custom') {
            this.#hidesOnClickOutside = hides;
            this.adapter.registerClickOutsideHandler(this.#handleClickOutside);
        }
    }

    #generateEvent(types: ArrayElement<typeof strings.TRIGGER_SET>) {
        const triggerEventSet = {};
        let portalEventSet = {};
        switch (types) {
            case 'focus':
                triggerEventSet[eventNames.focus] = () => {
                    if (this.getProp('condition') !== false) {
                        this.delayShow();
                    }
                };
                triggerEventSet[eventNames.blur] = () => {
                    this.delayHide();
                };
                portalEventSet = { ...triggerEventSet };
                break;
            case 'click':
                triggerEventSet[eventNames.click] = () => {
                    if (this.getProp('condition') !== false) {
                        this.show();
                    }
                };
                portalEventSet = {};
                break;
            case 'hover':
                triggerEventSet[eventNames.mouseEnter] = () => {
                    this.#isClickToHide = false;
                    if (this.getProp('condition') !== false) {
                        this.delayShow();
                    }
                };
                triggerEventSet[eventNames.mouseLeave] = () => {
                    this.delayHide();
                };
                // a11y: also open on keyboard focus
                triggerEventSet[eventNames.focus] = () => {
                    const { disableFocusListener } = this.getProps();
                    if (this.getProp('condition') !== false && !disableFocusListener) {
                        this.delayShow();
                    }
                };
                triggerEventSet[eventNames.blur] = () => {
                    const { disableFocusListener } = this.getProps();
                    if (!disableFocusListener) {
                        this.delayHide();
                    }
                };

                portalEventSet = { ...triggerEventSet };
                if (this.getProp('clickToHide')) {
                    portalEventSet[eventNames.click] = () => {
                        this.#isClickToHide = true;
                        this.hide();
                    };

                    portalEventSet[eventNames.mouseEnter] = () => {
                        if (this.#isClickToHide) {
                            return;
                        }

                        if (this.getProp('condition') !== false) {
                            this.delayShow();
                        }
                    };
                }
                break;
            case 'custom':
                break;
            case 'contextMenu':
                triggerEventSet[eventNames.contextMenu] = (e: MouseEvent) => {
                    if (this.getProp('condition') === false) {
                        return;
                    }
                    e.preventDefault();
                    // anchored to the trigger box like hover/click; the cursor only decides when it opens
                    this.show();
                };
                break;
            default:
                break;
        }
        // the click-outside listener ignores the trigger: it runs on mousedown and the click that follows would reopen
        const openOnClick = triggerEventSet[eventNames.click];
        triggerEventSet[eventNames.click] = (event) => {
            if (this.getProp('clickTriggerToHide') && this.#open) {
                this.hide();
            } else {
                openOnClick?.(event);
            }
        };
        // trigger set only: the popup's own content keeps its arrow keys (inputs, lists)
        triggerEventSet[eventNames.keydown] = (event) => {
            this.#handleTriggerKeydown(event);
        };
        return { triggerEventSet, portalEventSet };
    }

    #shouldShow() {
        const visible = this.getProp('visible');
        if (visible) {
            this.show();
        }
    }

    #handleTriggerKeydown(event: Pick<KeyboardEvent, 'key' | 'preventDefault'>) {
        const key = event?.key;
        if (this.getProp('disableArrowKeyDown') || (key !== 'ArrowUp' && key !== 'ArrowDown')) {
            return;
        }
        const focusableElements = FocusTrapHandle.getFocusableElements(this.adapter.getPortalContainer());
        if (!focusableElements.length) {
            return;
        }
        if (key === 'ArrowUp') {
            this.#handleTriggerArrowUpKeydown(focusableElements, event);
        } else {
            this.#handleTriggerArrowDownKeydown(focusableElements, event);
        }
    }

    // the popup is portaled into the trigger's root, so either one gives the view of that tree
    #getActiveElement() {
        return FocusTrapHandle.getActiveElement(this.adapter.getPortalContainer() ?? this.adapter.getTriggerNode());
    }

    #handleTriggerArrowDownKeydown(focusableElements: FocusableElement[], event: Pick<KeyboardEvent, 'preventDefault'>) {
        const { preventScroll } = this.getProps();
        focusableElements[0].focus({ preventScroll });
        event.preventDefault();
    }

    #handleTriggerArrowUpKeydown(focusableElements: FocusableElement[], event: Pick<KeyboardEvent, 'preventDefault'>) {
        const { preventScroll } = this.getProps();
        focusableElements.at(-1).focus({ preventScroll });
        event.preventDefault();
    }

    #clearDelayTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    /** Under a controlled `visible` that differs, a trigger only asks the owner (D-1); returns whether it asked */
    #requestFromOwner(visible: boolean) {
        const controlled = this.getProp('visible');
        if (controlled === undefined || controlled === visible) {
            return false;
        }
        this.#requestedVisible = visible;
        this.adapter.notifyVisibleChange(visible);
        return true;
    }

    // a controlled owner hears only requests (D-1): it made every applied change itself
    #reportVisibleChange(visible: boolean) {
        if (this.getProp('visible') === undefined) {
            this.adapter.notifyVisibleChange(visible);
        }
    }

    #startTracking() {
        // observer callbacks run after frame callbacks, so they reposition at once: a frame callback would land a frame late
        const popup = this.adapter.getPortalContainer();
        this.#insetTop = popup ? Math.max(parseFloat(getComputedStyle(popup).getPropertyValue('--semi-tooltip-viewport-inset-top')) || 0, 0) : 0;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const { target, borderBoxSize } of entries) {
                // the popup keeps a horizontal writing mode, so its inline size is the width
                if (target === popup) {
                    this.#popupSize = { width: borderBoxSize[0].inlineSize, height: borderBoxSize[0].blockSize };
                }
            }
            this.calcPosition();
        });
        const visibleTriggers = new Set<Element>();
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                for (const { target, isIntersecting } of entries) {
                    if (isIntersecting) {
                        visibleTriggers.add(target);
                    } else {
                        visibleTriggers.delete(target);
                    }
                }
                this.#triggerVisible = visibleTriggers.size > 0;
                this.calcPosition();
            },
            { rootMargin: `${-this.#insetTop}px 0px 0px 0px` }
        );
        if (popup) {
            resizeObserver.observe(popup);
            // guardFocus is read once per opening
            if (this.getProp('guardFocus')) {
                this.#focusTrap = new FocusTrapHandle(popup, { preventScroll: this.getProp('preventScroll') });
            }
        }
        this.adapter.observeTrigger(resizeObserver);
        this.adapter.observeTrigger(intersectionObserver);
        if (!Tooltip.#tracking.size) {
            window.addEventListener('scroll', Tooltip.#handleScroll, { capture: true, passive: true });
            window.addEventListener('resize', Tooltip.#handleResize, { passive: true });
        }
        Tooltip.#tracking.add(this);
        this.#stopTracking = () => {
            this.#focusTrap?.destroy();
            this.#focusTrap = null;
            this.adapter.unobserveTrigger(resizeObserver);
            this.adapter.unobserveTrigger(intersectionObserver);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            Tooltip.#tracking.delete(this);
            Tooltip.#pending.delete(this);
            if (!Tooltip.#tracking.size) {
                window.removeEventListener('scroll', Tooltip.#handleScroll, { capture: true });
                window.removeEventListener('resize', Tooltip.#handleResize);
                cancelAnimationFrame(Tooltip.#frame);
                Tooltip.#frame = 0;
            }
        };
    }

    #endTracking() {
        this.#stopTracking?.();
        this.#stopTracking = null;
        this.#triggerVisible = true;
        this.#applied = null;
        this.#popupSize = null;
        this.#moveWatch?.observer.disconnect();
        this.#moveWatch = null;
    }

    #measure(viewport: Viewport): Layout | null {
        const popup = this.adapter.getPortalContainer();
        const triggerRect = this.adapter.getTriggerRect();
        if (!this.#stopTracking || !popup || !triggerRect) {
            return null;
        }
        // until the resize observer reports, offsetWidth/offsetHeight: whole pixels, but they ignore the enter
        // transition's scale(), which getBoundingClientRect includes
        const popupSize = this.#popupSize ?? { width: popup.offsetWidth, height: popup.offsetHeight };
        let placement: Position = this.getProp('position');
        let overflow: [boolean, boolean] = [false, false];
        if (this.getProp('autoAdjustOverflow')) {
            const adjusted = adjustPosition({
                position: placement,
                triggerRect,
                wrapperRect: popupSize,
                containerRect: { left: 0, top: 0, right: viewport.width, bottom: viewport.height },
                viewport,
                spacing: this.getProp('spacing') ?? numbers.SPACING,
                margin: { marginTop: this.#insetTop, marginRight: 0, marginBottom: 0, marginLeft: 0 },
            });
            // adjustPosition only flips sides or appends one, staying within POSITION_SET
            placement = adjusted.position as Position;
            overflow = [adjusted.isHeightOverFlow, adjusted.isWidthOverFlow];
        }
        const style = this.#calcPosStyle(placement, triggerRect, popupSize, viewport, overflow);
        if (!this.#triggerVisible) {
            style.visibility = 'hidden';
        }
        return { placement, style, triggerRect, viewport };
    }

    #apply(layout: Layout | null) {
        const popup = this.adapter.getPortalContainer();
        if (!layout || !popup) {
            return;
        }
        this.#watchMove(layout);
        const applied = this.#applied;
        if (applied && applied.placement === layout.placement && POSITION_PROPERTIES.every((name) => applied.style[name] === layout.style[name])) {
            return;
        }
        this.#applied = layout;
        // the attribute that picks arrow.scss's look, and the placement after autoAdjustOverflow
        popup.setAttribute('x-placement', layout.placement);
        for (const name of POSITION_PROPERTIES) {
            if (layout.style[name] === undefined) {
                popup.style.removeProperty(name);
            } else {
                popup.style.setProperty(name, layout.style[name]);
            }
        }
    }

    /**
     * Shrinks an intersection observer's root to the trigger's rect, so any move or resize of the trigger changes its
     * intersection ratio and reports, without polling every frame (Floating UI's autoUpdate does the same). The report
     * is a task after paint, so such a popup follows a frame late.
     * Known limit: a trigger clipped by a scrolling ancestor is watched at its clipped ratio, and a move that only
     * uncovers more of it goes unreported until the next scroll, resize or size change. Upgrade to comparing its rect
     * every frame while open if such a trigger is seen not following.
     */
    #watchMove({ triggerRect: rect, viewport }: Layout) {
        const trigger = this.adapter.getTriggerElement();
        const marginAround = (around: DOMRect) => [around.top, viewport.width - around.right, viewport.height - around.bottom, around.left].map((inset) => `${-Math.floor(inset)}px`).join(' ');
        const rootMargin = marginAround(rect);
        if (this.#moveWatch?.trigger === trigger && this.#moveWatch.rootMargin === rootMargin) {
            return;
        }
        this.#moveWatch?.observer.disconnect();
        this.#moveWatch = null;
        if (!trigger || !rect.width || !rect.height) {
            return;
        }
        const observe = (threshold: number, retried: boolean) => {
            let first = true;
            const observer = new IntersectionObserver(
                ([{ intersectionRatio }]) => {
                    if (!first) {
                        this.calcPosition();
                        return;
                    }
                    // the first report is a task after paint, so the trigger may have moved since the root was built
                    // around it, and the ratio then describes the new place; Floating UI's autoUpdate checks the rect too
                    const current = this.adapter.getTriggerRect();
                    if (current && marginAround(current) !== rootMargin) {
                        this.calcPosition();
                        return;
                    }
                    first = false;
                    // clipped or partly out of view, the trigger never fills the root; out of view, the visibility
                    // observer repositions it when it comes back
                    if (!retried && intersectionRatio > 0 && intersectionRatio !== threshold) {
                        observer.disconnect();
                        observe(intersectionRatio, true);
                    }
                },
                { root: trigger.ownerDocument, rootMargin, threshold }
            );
            observer.observe(trigger);
            this.#moveWatch = { trigger, rootMargin, observer };
        };
        observe(1, false);
    }

    /** left/top in the viewport, as the top layer's fixed position takes them */
    #calcPosStyle(position: Position, triggerRect: DOMRect, popupSize: { width: number; height: number }, viewport: { width: number; height: number }, [isHeightOverFlow, isWidthOverFlow]: [boolean, boolean]) {
        const rawSpacing = this.getProp('spacing') ?? numbers.SPACING;
        const { arrowPointAtCenter, showArrow } = this.getProps();
        const pointAtCenter = Boolean(showArrow) && arrowPointAtCenter;
        const isTopOrBottom = position.includes('top') || position.includes('bottom');
        // an { x, y } spacing: the axis along the placement is the gap, the other one shifts the popup
        const spacing = typeof rawSpacing === 'number' ? rawSpacing : isTopOrBottom ? rawSpacing.y : rawSpacing.x;
        const crossSpacing = typeof rawSpacing === 'number' ? 0 : isTopOrBottom ? rawSpacing.x : rawSpacing.y;
        const container = { left: 0, top: this.#insetTop, right: viewport.width, bottom: viewport.height };
        const inset = numbers.ARROW_CENTER_INSET;

        let left = 0;
        let top = 0;
        // the fraction of the popup's own size it is moved back by, as a translate() would
        let translateX = 0;
        let translateY = 0;

        const middleX = triggerRect.left + triggerRect.width / 2;
        const middleY = triggerRect.top + triggerRect.height / 2;
        const offsetHeight = Math.max(popupSize.height - (container.bottom - container.top), 0);
        const offsetWidth = Math.max(popupSize.width - viewport.width, 0);
        const isTriggerNearLeft = middleX < container.right - middleX;
        const isTriggerNearTop = middleY - container.top < container.bottom - middleY;
        const isPopupWiderThanViewport = popupSize.width > viewport.width;

        switch (position) {
            case 'top':
                left = isWidthOverFlow ? (isTriggerNearLeft ? container.left + popupSize.width / 2 : container.right - popupSize.width / 2 + offsetWidth) : middleX + crossSpacing;
                top = isHeightOverFlow ? container.top : triggerRect.top - spacing;
                translateX = -0.5;
                translateY = isHeightOverFlow ? 0 : -1;
                break;
            case 'topLeft':
                left = isWidthOverFlow ? (isPopupWiderThanViewport ? container.left : container.right - popupSize.width) : pointAtCenter ? middleX - inset + crossSpacing : triggerRect.left + crossSpacing;
                top = isHeightOverFlow ? container.top : triggerRect.top - spacing;
                translateY = isHeightOverFlow ? 0 : -1;
                break;
            case 'topRight':
                left = isWidthOverFlow ? container.right + offsetWidth : pointAtCenter ? middleX + inset + crossSpacing : triggerRect.right + crossSpacing;
                top = isHeightOverFlow ? container.top : triggerRect.top - spacing;
                translateX = -1;
                translateY = isHeightOverFlow ? 0 : -1;
                break;
            case 'left':
                left = isWidthOverFlow ? container.left : triggerRect.left - spacing;
                top = isHeightOverFlow ? (isTriggerNearTop ? container.top + popupSize.height / 2 : container.bottom - popupSize.height / 2 + offsetHeight) : middleY + crossSpacing;
                translateX = isWidthOverFlow ? 0 : -1;
                translateY = -0.5;
                break;
            case 'leftTop':
                left = isWidthOverFlow ? container.left : triggerRect.left - spacing;
                top = isHeightOverFlow ? container.top : pointAtCenter ? middleY - inset + crossSpacing : triggerRect.top + crossSpacing;
                translateX = isWidthOverFlow ? 0 : -1;
                break;
            case 'leftBottom':
                left = isWidthOverFlow ? container.left : triggerRect.left - spacing;
                top = isHeightOverFlow ? container.bottom : pointAtCenter ? middleY + inset + crossSpacing : triggerRect.bottom + crossSpacing;
                translateX = isWidthOverFlow ? 0 : -1;
                translateY = -1;
                break;
            case 'bottom':
                left = isWidthOverFlow ? (isTriggerNearLeft ? container.left + popupSize.width / 2 : container.right - popupSize.width / 2 + offsetWidth) : middleX + crossSpacing;
                top = isHeightOverFlow ? container.bottom : triggerRect.bottom + spacing;
                translateX = -0.5;
                translateY = isHeightOverFlow ? -1 : 0;
                break;
            case 'bottomLeft':
                left = isWidthOverFlow ? (isPopupWiderThanViewport ? container.left : container.right - popupSize.width) : pointAtCenter ? middleX - inset + crossSpacing : triggerRect.left + crossSpacing;
                top = isHeightOverFlow ? container.bottom : triggerRect.bottom + spacing;
                translateY = isHeightOverFlow ? -1 : 0;
                break;
            case 'bottomRight':
                left = isWidthOverFlow ? container.right + offsetWidth : pointAtCenter ? middleX + inset + crossSpacing : triggerRect.right + crossSpacing;
                top = isHeightOverFlow ? container.bottom : triggerRect.bottom + spacing;
                translateX = -1;
                translateY = isHeightOverFlow ? -1 : 0;
                break;
            case 'right':
                left = isWidthOverFlow ? container.right : triggerRect.right + spacing;
                top = isHeightOverFlow ? (isTriggerNearTop ? container.top + popupSize.height / 2 : container.bottom - popupSize.height / 2 + offsetHeight) : middleY + crossSpacing;
                translateX = isWidthOverFlow ? -1 : 0;
                translateY = -0.5;
                break;
            case 'rightTop':
                left = isWidthOverFlow ? container.right : triggerRect.right + spacing;
                top = isHeightOverFlow ? container.top : pointAtCenter ? middleY - inset + crossSpacing : triggerRect.top + crossSpacing;
                translateX = isWidthOverFlow ? -1 : 0;
                break;
            case 'rightBottom':
                left = isWidthOverFlow ? container.right : triggerRect.right + spacing;
                top = isHeightOverFlow ? container.bottom : pointAtCenter ? middleY + inset + crossSpacing : triggerRect.bottom + crossSpacing;
                translateX = isWidthOverFlow ? -1 : 0;
                translateY = -1;
                break;
            case 'leftTopOver':
                left = isWidthOverFlow ? container.left : triggerRect.left - spacing;
                top = isHeightOverFlow ? container.top : triggerRect.top - spacing;
                break;
            case 'rightTopOver':
                left = isWidthOverFlow ? container.right : triggerRect.right + spacing;
                top = isHeightOverFlow ? container.top : triggerRect.top - spacing;
                translateX = -1;
                break;
            case 'leftBottomOver':
                left = isWidthOverFlow ? container.left : triggerRect.left - spacing;
                top = isHeightOverFlow ? container.bottom : triggerRect.bottom + spacing;
                translateY = -1;
                break;
            case 'rightBottomOver':
                left = isWidthOverFlow ? container.right : triggerRect.right + spacing;
                top = isHeightOverFlow ? container.bottom : triggerRect.bottom + spacing;
                translateX = -1;
                translateY = -1;
                break;
            default:
                break;
        }

        // Kept inside the viewport when it fits (#1449): an "Over" placement reaches past a trigger at the edge
        const clamp = (value: number, size: number, min: number, max: number) => (size <= max - min ? Math.min(Math.max(value, min), max - size) : value);
        const popupLeft = clamp(left + translateX * popupSize.width, popupSize.width, container.left, container.right);
        const popupTop = clamp(top + translateY * popupSize.height, popupSize.height, container.top, container.bottom);
        const centerX = popupLeft + popupSize.width / 2;
        const centerY = popupTop + popupSize.height / 2;
        const style: PositionStyle = {
            left: `${popupLeft}px`,
            top: `${popupTop}px`,
            'transform-origin': `${-translateX * 100}% ${-translateY * 100}%`,
            '--semi-tooltip-trigger-width': `${Math.round(triggerRect.width)}px`,
        };

        // A centered arrow points at the trigger's center, or with arrowPointAtCenter={false} at the popup corner
        // nearest it, kept inside the popup
        if (showArrow && ['top', 'bottom', 'left', 'right'].includes(position)) {
            const percent = (offset: number, size: number) => `${(Math.min(Math.max(offset, inset), size - inset) / size) * 100}%`;
            if (isTopOrBottom && popupSize.width > 0) {
                const offset = arrowPointAtCenter ? middleX - centerX + popupSize.width / 2 : isTriggerNearLeft ? inset : popupSize.width - inset;
                style['--semi-tooltip-arrow-offset-x'] = percent(offset, popupSize.width);
            }
            if (!isTopOrBottom && popupSize.height > 0) {
                const offset = arrowPointAtCenter ? middleY - centerY + popupSize.height / 2 : isTriggerNearTop ? inset : popupSize.height - inset;
                style['--semi-tooltip-arrow-offset-y'] = percent(offset, popupSize.height);
            }
        }
        return style;
    }

    protected override initOnce() {
        this.#warnLeaveDelay();
    }

    static getInitialState(): TooltipBaseState {
        return { isInsert: false, transitionState: '', triggerEventSet: {}, portalEventSet: {}, visible: false, portalTarget: null, colorScheme: undefined };
    }

    override init() {
        this.#mounted = true;
        this.#bindEvent();
        this.#cursorTimer = setTimeout(() => this.#updateStateIfCursorOnTrigger());
        // shown again with the popup still open (StrictMode replay, Activity, KeepAlive): the host syncs the popup
        // again, and #handleOpened closes a hover popup the pointer left meanwhile
        this.#openedHandled = false;
        if (!this.#open) {
            this.#shouldShow();
            return;
        }
        // a controlled close or `condition` turned off while hidden reached handlePropsChange before this init
        if (this.getProp('visible') === false || this.getProp('condition') === false) {
            this.hide();
            return;
        }
        this.#watchClickOutside();
    }

    override destroy() {
        this.#syncStep++;
        clearTimeout(this.#openTimer);
        clearTimeout(this.#cursorTimer);
        this.#layer.release();
        // React's Activity hides a kept popup by disconnecting effects, and display:none alone would leave it open
        // in the top layer
        if (this.getState('isInsert')) {
            this.adapter.hidePopover();
        }
        // A hidden popup keeps its open state (the host hides it with the subtree); a leave cut short by hiding would
        // never remove it, so that is finished here.
        if (this.getState('transitionState') === 'leave' && !this.getProp('keepDOM')) {
            this.#removePortal();
        }
        this.#mounted = false;
        this.#requestedVisible = undefined;
        this.#endTracking();
        this.adapter.unregisterClickOutsideHandler();
        this.#clearDelayTimer();
    }

    override handlePropsChange(prev: Partial<P>) {
        // hidden and kept (Activity, KeepAlive): the next init reads trigger, visible and condition again
        if (!this.#mounted) {
            return;
        }
        const { trigger, clickToHide, visible, position, condition, mouseEnterDelay, mouseLeaveDelay } = this.getProps();
        if (prev.mouseEnterDelay !== mouseEnterDelay || prev.mouseLeaveDelay !== mouseLeaveDelay) {
            this.#warnLeaveDelay();
        }
        if (prev.trigger !== trigger || prev.clickToHide !== clickToHide) {
            this.#rebindEvents();
        }
        if (prev.visible !== visible) {
            this.#handleVisiblePropChange();
        }
        if (prev.position !== position) {
            this.calcPosition();
        }
        // triggers check `condition` only before opening, so an open or pending popup is closed here
        if (prev.condition !== condition && condition === false) {
            this.hide();
        }
    }

    /**
     * Hosts call this after every commit that changes `isInsert`, `transitionState` or the popup element, and again
     * when a hidden popup shows again (Activity, KeepAlive), with the popup in the document. Entering shows the
     * popover, positions it, checks a hover opening a task later and reports afterOpen once the enter animation ends;
     * leaving waits for the exit animation, hides the popover, unmounts it unless keepDOM and reports afterClose.
     */
    syncPopup = () => {
        this.#syncStep++;
        clearTimeout(this.#openTimer);
        if (!this.getState('isInsert') || !this.adapter.getPortalContainer()) {
            return;
        }
        const phase = this.getState('transitionState');
        if (phase === 'enter') {
            this.#enter();
        } else if (phase === 'leave') {
            this.#leave();
        }
    };

    /** Hosts call this when the component unmounts for good, not when it is only hidden: reports a close still owed */
    handleUnmount = () => {
        this.#lifecycle.ended(() => this.adapter.notifyAfterClose());
    };

    delayShow() {
        const mouseEnterDelay: number = this.getProp('mouseEnterDelay');

        this.#clearDelayTimer();

        if (mouseEnterDelay > 0) {
            this.#timer = setTimeout(() => {
                this.show();
                this.#clearDelayTimer();
            }, mouseEnterDelay);
        } else {
            this.show();
        }
    }

    show() {
        if (this.#open || this.#requestFromOwner(true)) {
            return;
        }
        this.#open = true;
        this.#openReported = false;
        this.#openedHandled = false;
        this.#lifecycle.show();
        this.#clearDelayTimer();
        this.setState({ isInsert: true, transitionState: 'enter', visible: true, ...this.adapter.insertPortal() });
        this.#watchClickOutside();
    }

    /** Positions an open popup beside its trigger at once, without waiting for a frame */
    calcPosition = () => {
        this.#apply(this.#measure(readViewport()));
    };

    delayHide() {
        const mouseLeaveDelay = this.getProp('mouseLeaveDelay');

        this.#clearDelayTimer();

        if (mouseLeaveDelay > 0) {
            this.#timer = setTimeout(() => {
                this.hide();
                this.#clearDelayTimer();
            }, mouseLeaveDelay);
        } else {
            this.hide();
        }
    }

    hide = () => {
        if (this.#mounted && this.getState('isInsert') && this.#requestFromOwner(false)) {
            this.#clearDelayTimer();
            return;
        }
        const wasOpen = this.#open;
        this.#open = false;
        this.#clearDelayTimer();
        if (!this.#mounted) {
            return;
        }
        // a press outside during the exit animation is not another close
        this.adapter.unregisterClickOutsideHandler();
        this.#endTracking();
        // a popup still leaving, or kept by keepDOM, is inserted but already closed
        if (wasOpen || this.getState('visible')) {
            this.setState({ transitionState: 'leave', visible: false });
            this.#reportVisibleChange(false);
        }
    };

    /**
     * Escape that reaches the popup through the overlay stack (utils/layer) while it is the top layer, wherever the
     * focus is. Returns whether the popup took the key; one that does not leaves it to the layer below.
     */
    handleEscape = (event: KeyboardEvent) => {
        const { trigger, closeOnEsc } = this.getProps();
        if (!closeOnEsc) {
            return false;
        }
        if (trigger !== 'custom') {
            // move focus before hiding, or a hover/focus popup reopens when focus returns to the trigger
            if (this.adapter.getPortalContainer()?.contains(this.#getActiveElement())) {
                this.focusTrigger();
            }
            this.hide();
        }
        this.adapter.notifyEscKeydown(event);
        return true;
    };

    /**
     * Focus the trigger. A 'focus' or 'hover' trigger binds onFocus to show the popup, so focusing it
     * reopens the popup; callers hide the popup right after.
     */
    focusTrigger = () => {
        const { trigger, returnFocusOnClose, preventScroll } = this.getProps();
        if (!returnFocusOnClose || trigger === 'custom') {
            return;
        }
        const before = this.#getActiveElement();
        this.adapter.getTriggerNode()?.focus?.({ preventScroll });
        // the first focusable element can be a wrapper with tabIndex -1 that only takes the pointer (around a
        // loading Button); the Tab stop is the control inside it
        const active = this.#getActiveElement();
        if (active !== before && active?.tabIndex < 0) {
            FocusTrapHandle.getFocusableElements(active)[0]?.focus({ preventScroll });
        }
    };
}
