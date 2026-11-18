import { type Accessor, createEffect, onCleanup } from 'solid-js';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';

/**
 * Stops the page from scrolling while `locked()`, without shifting the layout when the scrollbar goes away. Shares one
 * count with Modal and SideSheet, so the page scrolls again only once every lock is released.
 */
export default function useScrollLock(locked: Accessor<boolean>) {
    createEffect(() => {
        if (locked()) {
            onCleanup(lockBodyScroll());
        }
    });
}
