import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../../base/foundation';
import { numbers } from './constants';

export interface CarouselAdapter<P extends CarouselBaseProps = CarouselBaseProps> extends DefaultAdapter<P, CarouselState, DirectionContext> {
    notifyChange: (activeIndex: number, preIndex: number) => void;
    getSlideCount: () => number;
}

export type CarouselAutoPlay = boolean | { interval?: number; hoverToPause?: boolean };

export interface CarouselBaseProps {
    activeIndex?: number;
    autoPlay?: CarouselAutoPlay;
    speed?: number;
}

export interface CarouselState {
    activeIndex: number;
    preIndex: number;
    isReverse: boolean;
    isInit: boolean;
    rotating: boolean;
}

export default class CarouselFoundation<P extends CarouselBaseProps = CarouselBaseProps> extends BaseFoundation<CarouselAdapter<P>, P, CarouselState> {
    #interval = null;
    #forcePlay = false;
    #pausedByHover = false;
    #keyboardFocusWithin = false;
    #resumeOnFocusLeave = false;
    // set by the consumer's ref.stop(), so only ref.play() starts playback again
    #stoppedByUser = false;
    #pointerInside = false;

    static override readonly propKeys = ['activeIndex', 'autoPlay'];
    // autoPlay is often a fresh object literal on every render; only switching it on or off matters
    static override readonly propEquals = { autoPlay: (a: CarouselAutoPlay, b: CarouselAutoPlay) => CarouselFoundation.isAutoPlayOn(a) === CarouselFoundation.isAutoPlayOn(b) };

    // debounced so a pointer crossing between slides and arrows does not flicker the pause
    readonly #hoverEnter = debounce(() => this.#pauseForHover(), numbers.HOVER_DELAY);
    readonly #hoverLeave = debounce(() => this.#resumeAfterHover(), numbers.HOVER_DELAY);

    #unregisterInterval() {
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = null;
            this.setState({ rotating: false });
        }
    }

    #getActiveIndex() {
        return CarouselFoundation.deriveActiveIndex(this.getProps(), this.getStates(), this.adapter.getSlideCount());
    }

    #restartAfterManualSwitch() {
        if (!this.#pausedByHover) {
            this.handleAutoPlay();
        }
    }

    #notifyChange(activeIndex: number) {
        const { isInit } = this.getStates();
        const stateActiveIndex = this.#getActiveIndex();
        if (stateActiveIndex !== activeIndex) {
            // a switch to the current index must not animate, so isInit stays until the index changes
            if (isInit) {
                this.setState({ isInit: false });
            }
            this.setState({ preIndex: stateActiveIndex });
            this.adapter.notifyChange(activeIndex, stateActiveIndex);
        }
    }

    #play(interval: number) {
        if (this.#interval) {
            clearInterval(this.#interval);
        }
        this.#interval = setInterval(() => {
            this.next();
        }, interval);
        this.setState({ rotating: true });
    }

    // only playback paused by hover resumes on leave, so a hover never starts a stopped carousel
    #pauseForHover() {
        const { autoPlay } = this.getProps();
        const hoverToPause = typeof autoPlay === 'object' && autoPlay !== null ? (autoPlay.hoverToPause ?? true) : true;
        if (this.#interval && hoverToPause) {
            this.stop();
            this.#pausedByHover = true;
        }
    }

    #resumeAfterHover() {
        if (this.#pausedByHover) {
            this.#pausedByHover = false;
            this.handleAutoPlay();
        }
    }

    protected getValidIndex(index: number) {
        const total = this.adapter.getSlideCount();
        return total === 0 ? 0 : ((index % total) + total) % total;
    }

    protected getSwitchingTime() {
        const { autoPlay, speed } = this.getProps();
        if (typeof autoPlay === 'boolean') {
            return numbers.DEFAULT_INTERVAL + speed;
        }
        if (CarouselFoundation.isAutoPlayOn(autoPlay)) {
            return (autoPlay.interval ?? numbers.DEFAULT_INTERVAL) + speed;
        }
        return speed;
    }

    protected getIsControlledComponent() {
        return this.isControlledComponent('activeIndex');
    }

    protected handleNewActiveIndex(activeIndex: number) {
        if (this.#getActiveIndex() !== activeIndex) {
            this.setState({ activeIndex });
        }
    }

    static isAutoPlayOn(autoPlay: CarouselAutoPlay) {
        return autoPlay === true || (typeof autoPlay === 'object' && autoPlay !== null);
    }

    static getDefaultActiveIndex(props: { activeIndex?: number; defaultActiveIndex?: number }) {
        return props.activeIndex === undefined ? props.defaultActiveIndex : props.activeIndex;
    }

    static getInitialState(props: { activeIndex?: number; defaultActiveIndex?: number }): CarouselState {
        const activeIndex = CarouselFoundation.getDefaultActiveIndex(props) ?? numbers.DEFAULT_ACTIVE_INDEX;
        return { activeIndex, preIndex: activeIndex, isReverse: false, isInit: true, rotating: false };
    }

    // clamps to the last slide when slides are fewer than the index; state is left alone so a controlled index stays
    static deriveActiveIndex(props: { activeIndex?: number }, state: { activeIndex: number }, total: number) {
        const index = props.activeIndex === undefined ? state.activeIndex : props.activeIndex;
        return Math.min(index, Math.max(total - 1, 0));
    }

    override init() {
        if (!this.getIsControlledComponent()) {
            this.handleAutoPlay();
        }
    }

    // the consumer's ref.play(): starts rotation even with autoPlay off or reduced motion
    play = () => {
        this.#forcePlay = true;
        this.#stoppedByUser = false;
        this.handleAutoPlay();
    };

    stopByUser = () => {
        this.#forcePlay = false;
        this.#stoppedByUser = true;
        this.stop();
    };

    stop = () => {
        this.#pausedByHover = false;
        this.#resumeOnFocusLeave = false;
        this.#unregisterInterval();
    };

    handlePointerEnter = () => {
        this.#pointerInside = true;
        this.#hoverEnter();
    };

    handlePointerLeave = () => {
        this.#pointerInside = false;
        this.#hoverLeave();
    };

    // mouseleave never arrives for a carousel taken out of the page, so its pending hover is dropped
    resetPointer = () => {
        this.#hoverEnter.cancel();
        this.#hoverLeave.cancel();
        this.#pointerInside = false;
    };

    // Slides arriving after mount start autoplay like a mount with them; a controlled carousel waits for its first
    // switch, and a pointer under hoverToPause keeps the pause
    handleSlideCountChange = (previous: number, count: number) => {
        if (previous <= 1 && count > 1 && !this.getIsControlledComponent()) {
            this.handleAutoPlay();
            if (this.#pointerInside) {
                this.#pauseForHover();
            }
        }
    };

    // APG carousel pattern: focus inside pauses rotation regardless of hoverToPause. Only keyboard focus counts: a
    // mouse click on an arrow focuses it too.
    handleFocusIn = ({ target }: Pick<FocusEvent, 'target'>) => {
        if (!(target instanceof Element && target.matches(':focus-visible'))) {
            return;
        }
        this.#keyboardFocusWithin = true;
        if (this.#interval) {
            this.#unregisterInterval();
            this.#resumeOnFocusLeave = true;
        }
    };

    handleFocusOut = ({ currentTarget, relatedTarget }: Pick<FocusEvent, 'currentTarget' | 'relatedTarget'>) => {
        if (relatedTarget instanceof Node && (currentTarget as Node).contains(relatedTarget)) {
            return;
        }
        this.#keyboardFocusWithin = false;
        if (this.#resumeOnFocusLeave) {
            this.#resumeOnFocusLeave = false;
            this.handleAutoPlay();
        }
    };

    // unlike next/prev (called by the timer, which re-arm it), a jump keeps the running timer's schedule
    goTo = (activeIndex: number) => {
        const stateActiveIndex = this.#getActiveIndex();
        const targetIndex = this.getValidIndex(activeIndex);
        this.setState({ isReverse: stateActiveIndex > targetIndex });
        this.#notifyChange(targetIndex);
        if (!this.getIsControlledComponent()) {
            this.handleNewActiveIndex(targetIndex);
        }
    };

    next = () => {
        this.#unregisterInterval();
        const targetIndex = this.getValidIndex(this.#getActiveIndex() + 1);
        this.setState({ isReverse: false });
        this.#notifyChange(targetIndex);
        if (!this.getIsControlledComponent()) {
            this.handleNewActiveIndex(targetIndex);
        }
        this.#restartAfterManualSwitch();
    };

    prev = () => {
        this.#unregisterInterval();
        const targetIndex = this.getValidIndex(this.#getActiveIndex() - 1);
        this.setState({ isReverse: true });
        this.#notifyChange(targetIndex);
        if (!this.getIsControlledComponent()) {
            this.handleNewActiveIndex(targetIndex);
        }
        this.#restartAfterManualSwitch();
    };

    // A hidden carousel is out of the page, so it must not keep switching slides, and mouseleave and focusout never
    // reach it: the hover and focus pauses are dropped and init restarts the configured autoplay.
    override destroy() {
        this.resetPointer();
        this.#keyboardFocusWithin = false;
        this.stop();
    }

    handleAutoPlay = () => {
        const { autoPlay } = this.getProps();
        if (this.#stoppedByUser) {
            return;
        }
        // rotation that starts by itself is motion the user opted out of; ref.play() is an explicit request
        const reduceMotion = !this.#forcePlay && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.adapter.getSlideCount() > 1 && !reduceMotion && (CarouselFoundation.isAutoPlayOn(autoPlay) || this.#forcePlay)) {
            // a keyboard switch must not restart rotation while focus is inside
            if (this.#keyboardFocusWithin) {
                this.#resumeOnFocusLeave = true;
            } else {
                this.#play(this.getSwitchingTime());
            }
        }
    };

    // APG tabs keys for the indicator tablist; returns whether the key was handled
    handleKeyDown = (event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'>) => {
        // browser and OS shortcuts such as Alt+Left (history back) stay theirs
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return false;
        }
        const isRtl = this.adapter.getContext('direction') === 'rtl';
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                if ((event.key === 'ArrowRight') !== isRtl) {
                    this.next();
                } else {
                    this.prev();
                }
                break;
            case 'Home':
                this.goTo(0);
                break;
            case 'End':
                this.goTo(this.adapter.getSlideCount() - 1);
                break;
            default:
                return false;
        }
        event.preventDefault();
        return true;
    };

    onIndicatorChange = (activeIndex: number) => {
        this.setState({ isReverse: this.#getActiveIndex() > activeIndex });
        this.#notifyChange(activeIndex);
        if (!this.getIsControlledComponent()) {
            this.handleNewActiveIndex(activeIndex);
        }
    };

    override handlePropsChange(prev: Partial<P>) {
        const { activeIndex, autoPlay } = this.getProps();
        // an activeIndex that goes back to undefined keeps the last controlled index, which later switches continue from
        if (prev.activeIndex !== activeIndex && activeIndex !== undefined && activeIndex !== this.getState('activeIndex')) {
            this.setState({ activeIndex });
        }
        if (!CarouselFoundation.isAutoPlayOn(autoPlay) && CarouselFoundation.isAutoPlayOn(prev.autoPlay) && !this.#forcePlay) {
            this.stop();
        }
    }
}
