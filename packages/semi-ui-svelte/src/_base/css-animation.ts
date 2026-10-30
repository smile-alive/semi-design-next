import type { TransitionConfig } from 'svelte/transition';

/** The longest `animation-duration` + `animation-delay` pair on `node`, in ms */
function animationTime(node: Element) {
    const style = getComputedStyle(node);
    const seconds = (value: string) => value.split(',').map((item) => (item.trim().endsWith('ms') ? parseFloat(item) / 1000 : parseFloat(item)) || 0);
    const durations = seconds(style.animationDuration);
    const delays = seconds(style.animationDelay);
    return Math.max(0, ...durations.map((duration, index) => duration + (delays[index % delays.length] ?? 0))) * 1000;
}

/**
 * A Svelte transition that plays a keyframe animation the foundation SCSS attaches to `className`, so the SCSS stays the
 * one source of the motion. Svelte keeps an outroing node in the DOM for the returned duration.
 */
export default function cssAnimation(node: Element, { className, motion = true }: { className: string; motion?: boolean }): TransitionConfig {
    if (!motion) {
        return { duration: 0 };
    }
    node.classList.add(className);
    return {
        duration: animationTime(node),
        tick: (t) => {
            // `in` ends at t = 1, `out` at t = 0; only `in` must drop its class, an outroed node is removed
            if (t === 1) {
                node.classList.remove(className);
            }
        },
    };
}
