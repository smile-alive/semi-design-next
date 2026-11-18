import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';

/**
 * Stops the page from scrolling while `locked()` is true, without shifting the layout when the scrollbar goes away.
 * Shares one count with Modal and SideSheet, so the page scrolls again only once every lock is released.
 */
export default function useScrollLock(locked: () => boolean) {
    $effect(() => (locked() ? lockBodyScroll() : undefined));
}
