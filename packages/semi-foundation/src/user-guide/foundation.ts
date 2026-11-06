import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { coversPage } from '../utils/dom';
import ModalResources from '../utils/modal-resources';
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
}

export interface UserGuideStepBase {
    target?: Element | (() => Element | null | undefined) | null;
    spotlightPadding?: number;
    mask?: boolean;
}

export interface UserGuideBaseProps {
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
    static override readonly propKeys = ['current'];

    #getCurrent() {
        return UserGuideFoundation.deriveCurrent(this.getProps(), this.getStates());
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

    override destroy() {
        this.#resources.release();
    }

    // state mirrors a controlled current, so going uncontrolled continues from the last controlled step
    override handlePropsChange() {
        const { current } = this.getProps();
        if (current !== undefined) {
            this.setState({ current });
        }
    }

    /** Measures the current step's target; unchanged rects set no state. Only a step change scrolls, so a user scroll is followed, not fought */
    measureSpotlight = (scrollIntoView: boolean) => {
        const { steps, spotlightPadding } = this.getProps();
        const next = UserGuideFoundation.measure(steps[this.#getCurrent()], spotlightPadding, scrollIntoView);
        if (!UserGuideFoundation.isSameRect(this.getState('spotlightRect'), next)) {
            this.setState({ spotlightRect: next });
        }
    };

    /**
     * Hosts call this while a step is on screen, again when the step's mask or the mode changes. Only a popup guide
     * covers the page with its mask and locks scroll; a modal guide is locked by its Modal. The guide is never modal.
     */
    beforeShow = () => {
        const { mode, mask, steps, getPopupContainer } = this.getProps();
        const showMask = steps[this.#getCurrent()]?.mask ?? mask;
        const lockScroll = mode === 'popup' && Boolean(showMask) && coversPage(getPopupContainer ?? this.getContext('getPopupContainer'));
        this.#resources.hold({ modal: false, lockScroll, preventScroll: true });
    };

    // the scroll lock follows whether a step is on screen, which can end while the guide is still visible
    releaseScroll = () => {
        this.#resources.release();
    };

    /** Remembers the element to return focus to when a popup step leaves the screen; a modal guide gets this from Modal */
    recordFocus = () => {
        this.#resources.record();
    };

    /** Returns focus only if it is still on the card (or lost with it), so a user who clicked elsewhere stays there */
    restoreFocus = () => {
        this.#resources.restoreFocus(this.adapter.getPopup());
    };

    afterHide = () => {
        this.releaseScroll();
        // a controlled current stays: the parent decides where the next show starts
        this.setState({ current: this.getProp('current') ?? numbers.DEFAULT_CURRENT });
    };

    handlePrev = () => {
        const newCurrent = this.#getCurrent() - 1;
        this.adapter.notifyChange(newCurrent);
        this.adapter.notifyPrev(newCurrent);
        if (!this.getIsControlledComponent()) {
            this.setState({ current: newCurrent });
        }
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
            if (!this.getIsControlledComponent()) {
                this.setState({ current: newCurrent });
            }
        }
    };

    handleSkip = () => {
        this.adapter.notifySkip();
    };
}
