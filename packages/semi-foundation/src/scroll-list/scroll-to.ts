import { tween } from '../utils/tween';

/** Scrolls `element` to `to` over `duration` ms; returns a function that cancels the scroll */
export default function scrollTo(element: HTMLElement, to: number, duration: number, onEnd?: () => void) {
    return tween({
        from: element.scrollTop,
        to,
        duration,
        onFrame: (scrollTop) => {
            element.scrollTop = scrollTop;
        },
        onEnd,
    });
}
