export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;

export const easeInOutCubic: Easing = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export interface TweenOptions {
    from: number;
    to: number;
    /** ms */
    duration: number;
    easing?: Easing;
    onFrame: (value: number) => void;
    onEnd?: () => void;
}

/** Animates a number from `from` to `to` once per frame; returns a function that cancels it */
export function tween({ from, to, duration, easing = linear, onFrame, onEnd }: TweenOptions) {
    let start: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
        start ??= now;
        const progress = duration > 0 ? Math.min((now - start) / duration, 1) : 1;
        onFrame(from + (to - from) * easing(progress));
        if (progress < 1) {
            frame = requestAnimationFrame(step);
        } else {
            onEnd?.();
        }
    });
    return () => cancelAnimationFrame(frame);
}
