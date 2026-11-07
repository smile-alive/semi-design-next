import { onBeforeUnmount } from 'vue';

/** Returns a timeout scheduler: a new call replaces the timer still pending, and unmount clears it. */
export default function useTimeout() {
    let timer: ReturnType<typeof setTimeout> | undefined;

    onBeforeUnmount(() => clearTimeout(timer));

    return (callback: () => void, delay?: number) => {
        clearTimeout(timer);
        timer = setTimeout(callback, delay);
    };
}
