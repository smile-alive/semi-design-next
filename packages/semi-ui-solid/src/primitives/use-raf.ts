import { onCleanup } from 'solid-js';

/**
 * Returns a scheduler for the next frame: a new call replaces the frame still pending, and disposal cancels it. Call it
 * at the component's top level, not inside `onMount`, so the cancellation belongs to the component.
 */
export default function useRaf() {
    let frame = 0;

    // Only a scheduled frame needs cancelling; a server render disposes without one and has no cancelAnimationFrame
    onCleanup(() => {
        if (frame) {
            cancelAnimationFrame(frame);
        }
    });

    return (callback: FrameRequestCallback) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(callback);
    };
}
