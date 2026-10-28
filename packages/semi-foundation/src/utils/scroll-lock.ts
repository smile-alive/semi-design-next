let lockCount = 0;
// body styles from before the first lock; null when the page had already hidden the overflow, which is then left alone
let restore: { overflow: string; paddingInlineEnd: string } | null = null;

/**
 * Stops the page from scrolling behind an overlay and returns the function that releases this lock. Locks are
 * counted, so stacked overlays release the page only when the last one closes. The body's end padding grows by the
 * scrollbar width, so the page does not shift sideways when its scrollbar disappears; padding rather than width keeps
 * the body's own margin and any width set by the page's stylesheet.
 */
export function lockBodyScroll() {
    if (lockCount === 0) {
        const { style } = document.body;
        if (style.overflow === 'hidden') {
            restore = null;
        } else {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            const padding = getComputedStyle(document.body).paddingInlineEnd;
            restore = { overflow: style.overflow, paddingInlineEnd: style.paddingInlineEnd };
            style.overflow = 'hidden';
            style.paddingInlineEnd = `calc(${padding} + ${scrollbarWidth}px)`;
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
            restore = null;
        }
    };
}
