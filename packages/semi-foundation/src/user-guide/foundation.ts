import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { numbers } from './constants';

export interface UserGuideAdapter<P extends UserGuideBaseProps = UserGuideBaseProps, S extends UserGuideBaseState = UserGuideBaseState> extends DefaultAdapter<P, S> {
    notifyChange: (current: number) => void;
    notifyPrev: (current: number) => void;
    notifyNext: (current: number) => void;
    notifySkip: () => void;
    notifyFinish: () => void;
    setCurrent: (current: number) => void;
    disabledBodyScroll: () => void;
    enabledBodyScroll: () => void;
}

/** The props the foundation reads */
export interface UserGuideBaseProps {
    current?: number;
    steps: unknown[];
}

/** The state the foundation reads */
export interface UserGuideBaseState {
    current: number;
}

export default class UserGuideFoundation<P extends UserGuideBaseProps = UserGuideBaseProps, S extends UserGuideBaseState = UserGuideBaseState> extends BaseFoundation<UserGuideAdapter<P, S>, P, S> {
    #getCurrent() {
        return UserGuideFoundation.deriveCurrent(this.getProps(), this.getStates());
    }

    protected getIsControlledComponent() {
        return this._isControlledComponent('current');
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

    override destroy() {
        this._adapter.enabledBodyScroll();
    }

    beforeShow() {
        this._adapter.disabledBodyScroll();
    }

    // the scroll lock follows whether a step is on screen, which can end while the guide is still visible
    releaseScroll() {
        this._adapter.enabledBodyScroll();
    }

    afterHide() {
        this.releaseScroll();
        this._adapter.setCurrent(numbers.DEFAULT_CURRENT);
    }

    handlePrev = () => {
        const newCurrent = this.#getCurrent() - 1;
        this._adapter.notifyChange(newCurrent);
        this._adapter.notifyPrev(newCurrent);
        if (!this.getIsControlledComponent()) {
            this._adapter.setCurrent(newCurrent);
        }
    };

    handleNext = () => {
        const { steps } = this.getProps();
        const current = this.#getCurrent();
        if (current === steps.length - 1) {
            this._adapter.notifyFinish();
        } else {
            const newCurrent = current + 1;
            this._adapter.notifyChange(newCurrent);
            this._adapter.notifyNext(newCurrent);
            if (!this.getIsControlledComponent()) {
                this._adapter.setCurrent(newCurrent);
            }
        }
    };

    handleSkip = () => {
        this._adapter.notifySkip();
    };
}
