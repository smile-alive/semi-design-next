import { isEqual } from 'es-toolkit';
import type lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';
import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { isDev } from '../../utils/index';

type LoadParams = Parameters<typeof lottie.loadAnimation>[0];

const needsFullBuild = (renderer: LoadParams['renderer']) => renderer === 'canvas' || renderer === 'html';

// An expression is stored as a string in the `x` field of a property object
function hasExpression(node: unknown): boolean {
    if (typeof node !== 'object' || node === null) {
        return false;
    }
    return Object.entries(node).some(([key, value]) => (key === 'x' && typeof value === 'string') || hasExpression(value));
}

export interface LottieAdapter<P extends LottieBaseProps = LottieBaseProps> extends DefaultAdapter<P, LottieBaseState> {
    /** The element the animation renders into when `params.container` is not given */
    getContainer: () => HTMLElement | null;
    notifyAnimationInstance: (animation: AnimationItem) => void;
    notifyLottie: (lottiePKG: typeof lottie) => void;
}

export interface LottieBaseProps {
    width?: string;
    height?: string;
    params: Partial<LoadParams>;
    getAnimationInstance?: (animation: AnimationItem) => void;
    getLottie?: (lottiePKG: typeof lottie) => void;
}

export interface LottieBaseState {}

export default class LottieFoundation<P extends LottieBaseProps = LottieBaseProps> extends BaseFoundation<LottieAdapter<P>, P, LottieBaseState> {
    // lottie-web is large, so it loads lazily; one import per build (light: svg only, no expressions, no unsafe-eval;
    // full: also canvas and html) is shared and a failed one is dropped so the next caller retries
    static #pending = new Map<boolean, Promise<typeof lottie>>();
    #animation: null | AnimationItem = null;
    // bumped by every load and by destroy: a load that finds it changed is stale
    #generation = 0;
    #lottieNotified = false;
    // WCAG 2.2.2: autoplay must not start for a user who asked the system for less motion
    #reducedMotion: MediaQueryList | null = null;
    static override readonly propKeys = ['params'];
    // params is usually a fresh literal, so it compares by content
    static override readonly propEquals = { params: isEqual };

    #getLoadParams() {
        const params = this.getProp('params');
        return {
            container: params.container ?? this.adapter.getContainer(),
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
            const params = this.getProp('params');
            if (isDev() && 'animationData' in params && hasExpression(params.animationData) && !needsFullBuild(params.renderer)) {
                console.warn('Warning: [Lottie] animationData contains expressions, which the default svg player (lottie_light) does not run. Set params.renderer to "canvas" or "html" to load the full lottie-web.');
            }
            const lottie = await LottieFoundation.getLottie(params.renderer);
            if (generation !== this.#generation) {
                return;
            }
            this.#animation = lottie.loadAnimation(this.#getLoadParams());
            this.adapter.notifyAnimationInstance(this.#animation);
            if (!this.#lottieNotified) {
                this.#lottieNotified = true;
                this.adapter.notifyLottie(lottie);
            }
        } catch (error) {
            // load() is not awaited, so this would otherwise be an unhandled rejection
            if (isDev()) {
                console.error(error);
            }
        }
    }

    static getLottie = (renderer?: LoadParams['renderer']) => {
        const full = needsFullBuild(renderer);
        let pending = LottieFoundation.#pending.get(full);
        if (!pending) {
            pending = (full ? import('lottie-web') : import('lottie-web/build/player/lottie_light'))
                .then((module) => module.default)
                .catch((error) => {
                    LottieFoundation.#pending.delete(full);
                    throw error;
                });
            LottieFoundation.#pending.set(full, pending);
        }
        return pending;
    };

    override init() {
        super.init();
        this.#lottieNotified = false;
        this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.#reducedMotion.addEventListener('change', this.#handleMotionChange, { signal: this.signal });
        void this.#load();
    }

    override handlePropsChange() {
        this.#animation?.destroy();
        this.#animation = null;
        void this.#load();
    }

    override destroy() {
        super.destroy();
        this.#generation++;
        this.#animation?.destroy();
        this.#animation = null;
    }
}
