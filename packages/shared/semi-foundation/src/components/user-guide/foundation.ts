import { BaseFoundation, type DefaultAdapter, ModalResources } from '../../base/index';
import { coversPage, warning } from '../../utils/index';
import { numbers } from './constants';

/** What the guide reads around it: ConfigProvider's popup container, which the guide's own prop overrides */
export interface UserGuideContext {
    getPopupContainer?: () => HTMLElement;
}

export interface UserGuideAdapter<P extends UserGuideBaseProps = UserGuideBaseProps> extends DefaultAdapter<P, UserGuideBaseState, UserGuideContext> {
    notifyChange: (current: number) => void;
    notifyPrev: (current: number) => void;
    notifyNext: (current: number) => void;
    notifySkip: () => void;
    notifyFinish: () => void;
    /** The card of a popup step; null while none is rendered */
    getPopup: () => HTMLElement | null | undefined;
    /** A host that binds `current` (Svelte) clears a value only the guide wrote; it runs right before a hide resets the step */
    clearWrittenCurrent?: () => void;
}

export interface UserGuideStepBase {
    target?: Element | (() => Element | null | undefined) | null;
    spotlightPadding?: number;
    mask?: boolean;
}

export interface UserGuideBaseProps {
    visible?: boolean;
    current?: number;
    spotlightPadding?: number;
    steps: UserGuideStepBase[];
    mode?: 'popup' | 'modal';
    mask?: boolean;
    getPopupContainer?: () => HTMLElement;
}

export interface UserGuideBaseState {
    current: number;
    spotlightRect: DOMRect | null;
}

export default class UserGuideFoundation<P extends UserGuideBaseProps = UserGuideBaseProps> extends BaseFoundation<UserGuideAdapter<P>, P, UserGuideBaseState> {
    readonly #resources = new ModalResources();
    #stopFrames: (() => void) | null = null;
    // what #sync last applied to the page, updated in place so a nested #sync is seen by the outer one
    readonly #applied: { visible: boolean; measured: number | null; lock: string | null; popupShown: boolean } = { visible: false, measured: null, lock: null, popupShown: false };
    static override readonly propKeys = ['visible', 'current', 'mode', 'mask', 'steps'];

    #getCurrent() {
        return UserGuideFoundation.deriveCurrent(this.getProps(), this.getStates());
    }

    // Only a step change scrolls, so a user scroll is followed, not fought
    #measure(scrollIntoView: boolean) {
        const { steps, spotlightPadding } = this.getProps();
        const current = this.#getCurrent();
        const next = UserGuideFoundation.measure(steps[current], spotlightPadding, scrollIntoView);
        // only on the step change, not every frame
        warning(scrollIntoView && Boolean(steps[current]) && !next, `[Semi UserGuide] the target of step ${current} resolved to null; the step stays hidden until its target exists`);
        if (!UserGuideFoundation.isSameRect(this.getState('spotlightRect'), next)) {
            this.setState({ spotlightRect: next });
            this.#sync();
        }
    }

    /**
     * Brings the page in line with the props and state, touching only what changed: per-frame measuring while a popup
     * guide is visible, the scroll lock and focus while a step is on screen, and the step reset after a hide. Only a
     * popup guide covers the page with its mask and locks scroll, and records focus; a modal guide gets both from Modal.
     * The guide is never modal.
     */
    #sync() {
        const { visible, mode, mask, steps, getPopupContainer } = this.getProps();
        const applied = this.#applied;
        if (visible && mode === 'popup') {
            this.#stopFrames ??= UserGuideFoundation.trackFrames(() => this.#measure(false));
            const current = this.#getCurrent();
            if (applied.measured !== current) {
                applied.measured = current;
                // may run #sync again with the new rect; the rest below then finds nothing left to change
                this.#measure(true);
            }
        } else {
            this.#stopFrames?.();
            this.#stopFrames = null;
            applied.measured = null;
        }

        const step = steps[this.#getCurrent()];
        const showMask = Boolean(step?.mask ?? mask);
        // nothing rendered (popup target not measured yet) must not lock the page or take focus
        const shown = Boolean(visible && step && (mode === 'modal' || this.getState('spotlightRect')));
        const popupShown = shown && mode === 'popup';
        const lock = shown ? `${mode}:${showMask}` : null;

        if (popupShown && !applied.popupShown) {
            this.#resources.record();
        }
        if (lock !== applied.lock) {
            if (lock) {
                const lockScroll = mode === 'popup' && showMask && coversPage(getPopupContainer ?? this.getContext('getPopupContainer'));
                this.#resources.hold({ modal: false, lockScroll, preventScroll: true });
            } else {
                this.#resources.release();
            }
        }
        // only if focus is still on the card (or lost with it), so a user who clicked elsewhere stays there
        if (!popupShown && applied.popupShown) {
            this.#resources.restoreFocus(this.adapter.getPopup());
        }
        const hidden = applied.visible && !visible;
        applied.visible = Boolean(visible);
        applied.lock = lock;
        applied.popupShown = popupShown;
        if (hidden) {
            this.adapter.clearWrittenCurrent?.();
            // a controlled current stays: the parent decides where the next show starts
            this.setState({ current: this.getProp('current') ?? numbers.DEFAULT_CURRENT });
        }
    }

    #goTo(newCurrent: number) {
        if (!this.getIsControlledComponent()) {
            // measured once the new step is rendered
            this.setState({ current: newCurrent }, () => this.#sync());
        }
    }

    protected getIsControlledComponent() {
        return this.isControlledComponent('current');
    }

    static getInitialState({ current }: Pick<UserGuideBaseProps, 'current'>): UserGuideBaseState {
        return { current: current ?? numbers.DEFAULT_CURRENT, spotlightRect: null };
    }

    static deriveCurrent(props: { current?: number }, state: { current: number }) {
        return props.current === undefined ? state.current : props.current;
    }

    // 0 is a valid padding
    static getSpotlightPadding(step?: { spotlightPadding?: number }, spotlightPadding?: number) {
        if (typeof step?.spotlightPadding === 'number') {
            return step.spotlightPadding;
        }
        return typeof spotlightPadding === 'number' ? spotlightPadding : numbers.DEFAULT_SPOTLIGHT_PADDING;
    }

    static getTarget(step?: { target?: Element | (() => Element | null | undefined) | null }) {
        return typeof step?.target === 'function' ? step.target() : step?.target;
    }

    // Only a step change scrolls, so a user scroll is followed, not fought. Null means the step has no target (yet).
    static measure(step: { target?: Element | (() => Element | null | undefined) | null; spotlightPadding?: number } | undefined, spotlightPadding: number | undefined, scrollIntoView: boolean): DOMRect | null {
        const target = UserGuideFoundation.getTarget(step);
        if (!target) {
            return null;
        }
        if (scrollIntoView) {
            const { top, left, bottom, right } = target.getBoundingClientRect();
            const inViewport = top >= 0 && left >= 0 && bottom <= (window.innerHeight || document.documentElement.clientHeight) && right <= (window.innerWidth || document.documentElement.clientWidth);
            if (!inViewport) {
                target.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
        const rect = target.getBoundingClientRect();
        const padding = UserGuideFoundation.getSpotlightPadding(step, spotlightPadding);
        return new DOMRect(rect.x - padding, rect.y - padding, rect.width + padding * 2, rect.height + padding * 2);
    }

    // scroll fires every frame; an unchanged rect must not render again
    static isSameRect(a?: DOMRect | null, b?: DOMRect | null) {
        if (!a || !b) {
            return a === b;
        }
        return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
    }

    // A target can move or appear with no event or reactive change here (sibling layout, transforms), so only polling every frame sees it
    static trackFrames(callback: () => void) {
        let id = 0;
        const loop = () => {
            callback();
            id = requestAnimationFrame(loop);
        };
        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }

    override init() {
        this.#sync();
    }

    // Undoes the page holds without writing state or resetting the step; the next init applies them again
    override destroy() {
        this.#stopFrames?.();
        this.#stopFrames = null;
        this.#resources.release();
        if (this.#applied.popupShown) {
            this.#resources.restoreFocus(this.adapter.getPopup());
        }
        Object.assign(this.#applied, { visible: false, measured: null, lock: null, popupShown: false });
    }

    // state mirrors a controlled current, so going uncontrolled continues from the last controlled step
    override handlePropsChange() {
        const { current } = this.getProps();
        if (current !== undefined) {
            this.setState({ current });
        }
        this.#sync();
    }

    handlePrev = () => {
        const newCurrent = this.#getCurrent() - 1;
        this.adapter.notifyChange(newCurrent);
        this.adapter.notifyPrev(newCurrent);
        this.#goTo(newCurrent);
    };

    handleNext = () => {
        const { steps } = this.getProps();
        const current = this.#getCurrent();
        if (current === steps.length - 1) {
            this.adapter.notifyFinish();
        } else {
            const newCurrent = current + 1;
            this.adapter.notifyChange(newCurrent);
            this.adapter.notifyNext(newCurrent);
            this.#goTo(newCurrent);
        }
    };

    handleSkip = () => {
        this.adapter.notifySkip();
    };
}
