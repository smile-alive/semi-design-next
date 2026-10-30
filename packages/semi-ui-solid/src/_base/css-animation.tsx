import { type Accessor, batch, createEffect, createMemo, createSignal, type JSX, on, onCleanup } from 'solid-js';

export interface CSSAnimationOptions {
    startClassName: Accessor<string | undefined>;
    endClassName?: Accessor<string | undefined>;
    motion?: Accessor<boolean>;
    /** A change replays the animation with the same start class */
    replayKey?: Accessor<string>;
    fillMode?: Accessor<'backwards' | 'both' | 'forwards' | 'none' | undefined>;
    onAnimationStart?: () => void;
    /** `stoppedByAnother` is true when a restart without motion ends the previous run */
    onAnimationEnd?: (stoppedByAnother: boolean) => void;
}

export interface CSSAnimation {
    className: Accessor<string>;
    style: Accessor<JSX.CSSProperties>;
    isAnimating: Accessor<boolean>;
    /** Put on the animated element: its own animation events end the run, and a run it does not animate ends at once */
    ref: (element: Element) => void;
}

interface Run {
    start?: string;
    replayKey: string;
    motion: boolean;
}

/**
 * Plays `startClassName` until the element's CSS animation ends, then shows `endClassName`. A new start class, replay
 * key or motion value starts a new run. Presence stays with the caller: it keeps the element mounted from its own
 * state and unmounts it on `onAnimationEnd`.
 */
export default function useCSSAnimation(options: CSSAnimationOptions): CSSAnimation {
    const [element, setElement] = createSignal<Element>();
    // a new object per run, so `ended` can tell which run finished
    const run = createMemo((): Run => ({ start: options.startClassName(), replayKey: options.replayKey?.() ?? '', motion: options.motion?.() ?? true }), undefined, { equals: (a, b) => a.start === b.start && a.replayKey === b.replayKey && a.motion === b.motion });
    const [ended, setEnded] = createSignal<Run>();

    const isAnimating = () => run().motion && ended() !== run();

    // native listeners are not batched; the end class and the caller's reaction commit together, as in React
    const end = (finished: Run) =>
        batch(() => {
            setEnded(finished);
            options.onAnimationEnd?.(false);
        });

    // Not deferred: the mount is a run too. Without motion it is a zero-duration animation, so both callbacks fire.
    createEffect(
        on(run, (current, previous) => {
            options.onAnimationStart?.();
            if (!current.motion) {
                options.onAnimationEnd?.(previous !== undefined);
            }
        })
    );

    // No animationend comes when the page cancels the animation (`animation: none`); getAnimations() flushes style, so
    // it lists the animation the start class started. Transitions are excluded: they never fire animationend. A user
    // effect runs after the class binding; the element may arrive later in the flush (Portal content), which reruns it.
    createEffect(
        on([run, element], ([current, el]) => {
            if (!current.motion || !el?.isConnected || ended() === current) {
                return;
            }
            if (!el.getAnimations().some((animation) => 'animationName' in animation)) {
                end(current);
            }
        })
    );

    createEffect(() => {
        const el = element();
        if (!el) {
            return;
        }
        const controller = new AbortController();
        // animation events bubble; a descendant's animation is not this run
        el.addEventListener(
            'animationstart',
            (e) => {
                if (e.target === el && run().motion) {
                    options.onAnimationStart?.();
                }
            },
            { signal: controller.signal }
        );
        el.addEventListener(
            'animationend',
            (e) => {
                if (e.target === el && run().motion) {
                    end(run());
                }
            },
            { signal: controller.signal }
        );
        onCleanup(() => controller.abort());
    });

    return {
        className: () => {
            if (!run().motion) {
                return '';
            }
            return (isAnimating() ? run().start : options.endClassName?.()) ?? '';
        },
        style: (): JSX.CSSProperties => (run().motion ? { 'animation-fill-mode': options.fillMode?.() } : {}),
        isAnimating,
        ref: (el) => setElement(el),
    };
}
