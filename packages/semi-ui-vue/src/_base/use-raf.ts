import { onBeforeUnmount } from 'vue';

/** Returns a scheduler for the next frame: a new call replaces the frame still pending, and unmount cancels it. */
export default function useRaf() {
    let frame = 0;

    onBeforeUnmount(() => cancelAnimationFrame(frame));

    return (callback: FrameRequestCallback) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(callback);
    };
}
