import type lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

type LoadParams = Parameters<typeof lottie.loadAnimation>[0];

export interface LottieAdapter<P extends LottieBaseProps = LottieBaseProps, S extends LottieBaseState = LottieBaseState> extends DefaultAdapter<P, S> {
    /** The element the animation renders into when `params.container` is not given */
    getContainer: () => HTMLElement | null;
    notifyLoadError: (error: unknown) => void;
}

export interface LottieBaseProps {
    width?: string;
    height?: string;
    params: Partial<LoadParams>;
    getAnimationInstance?: (animation: AnimationItem) => void;
    getLottie?: (lottiePKG: typeof lottie) => void;
}

export interface LottieBaseState {}

export default class LottieFoundation<P extends LottieBaseProps = LottieBaseProps, S extends LottieBaseState = LottieBaseState> extends BaseFoundation<LottieAdapter<P, S>, P, S> {
    // lottie-web is large, so it loads lazily; one import is shared
    // and a failed one is dropped so the next caller retries
    static #pending: Promise<typeof lottie> | null = null;

    #animation: null | AnimationItem = null;

    // bumped by every load and by destroy: a load that finds it changed is stale
    #generation = 0;

    #lottieNotified = false;

    // WCAG 2.2.2: autoplay must not start for a user who asked the system for less motion
    #reducedMotion: MediaQueryList | null = null;

    #getLoadParams() {
        const params = this.getProp('params');
        return {
            container: params.container ?? this._adapter.getContainer(),
            renderer: 'svg',
            loop: true,
            autoplay: !this.#reducedMotion?.matches,
            ...params,
        } as LoadParams;
    }

    #handleMotionChange = (event: MediaQueryListEvent) => {
        if (this.getProp('params').autoplay !== undefined) {
            return;
        }
        if (event.matches) {
            this.#animation?.pause();
        } else {
            this.#animation?.play();
        }
    };

    async #load() {
        const generation = ++this.#generation;
        try {
            const lottie = await LottieFoundation.getLottie();
            if (generation !== this.#generation) {
                return;
            }
            this.#animation = lottie.loadAnimation(this.#getLoadParams());
            this.getProp('getAnimationInstance')?.(this.#animation);
            if (!this.#lottieNotified) {
                this.#lottieNotified = true;
                this.getProp('getLottie')?.(lottie);
            }
        } catch (error) {
            // load() is not awaited, so this would otherwise be an unhandled rejection
            this._adapter.notifyLoadError(error);
        }
    }

    static getLottie = () =>
        (LottieFoundation.#pending ??= import('lottie-web')
            .then((module) => module.default)
            .catch((error) => {
                LottieFoundation.#pending = null;
                throw error;
            }));

    override init() {
        super.init();
        this.#lottieNotified = false;
        this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.#reducedMotion.addEventListener('change', this.#handleMotionChange, { signal: this.signal });
        void this.#load();
    }

    handleParamsUpdate = () => {
        this.#animation?.destroy();
        this.#animation = null;
        void this.#load();
    };

    override destroy() {
        super.destroy();
        this.#generation++;
        this.#animation?.destroy();
        this.#animation = null;
    }
}
