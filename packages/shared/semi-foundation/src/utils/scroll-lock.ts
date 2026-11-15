import { supportsScrollbarGutter } from './supports';

let lockCount = 0;
// page styles from before the first lock; null when the page had already hidden the overflow, which is then left alone
let restore: { overflow: string; paddingInlineEnd: string; scrollbarGutter: string } | null = null;

/**
 * Locks are counted, so stacked overlays release the page only when the last one closes. While the page shows a
 * scrollbar, the root keeps its gutter, so nothing shifts sideways when the scrollbar disappears, fixed elements
 * included. Without scrollbar-gutter the body's end padding grows by the scrollbar width instead, which fixed elements
 * do not follow; padding rather than width keeps the body's own margin and any width set by the page's stylesheet.
 */
export function lockBodyScroll() {
    if (lockCount === 0) {
        const { body, documentElement: root } = document;
        if (body.style.overflow === 'hidden') {
            restore = null;
        } else {
            const scrollbarWidth = window.innerWidth - root.clientWidth;
            restore = { overflow: body.style.overflow, paddingInlineEnd: body.style.paddingInlineEnd, scrollbarGutter: root.style.scrollbarGutter };
            body.style.overflow = 'hidden';
            if (scrollbarWidth > 0 && supportsScrollbarGutter()) {
                root.style.scrollbarGutter = 'stable';
            } else if (scrollbarWidth > 0) {
                body.style.paddingInlineEnd = `calc(${getComputedStyle(body).paddingInlineEnd} + ${scrollbarWidth}px)`;
            }
        }
    }
    lockCount++;
    let released = false;
    return () => {
        if (released) {
            return;
        }
        released = true;
        lockCount--;
        if (lockCount === 0 && restore) {
            document.body.style.overflow = restore.overflow;
            document.body.style.paddingInlineEnd = restore.paddingInlineEnd;
            document.documentElement.style.scrollbarGutter = restore.scrollbarGutter;
            restore = null;
        }
    };
}
