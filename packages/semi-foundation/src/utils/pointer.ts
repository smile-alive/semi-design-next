// Only the primary button (left mouse, touch contact, pen tip) drags. A middle or right press opens a browser menu or
// autoscroll, so its release may never arrive; a pen's barrel button and eraser are other tools, not a drag.
export function isSecondaryPress(e: Pick<PointerEvent, 'button'>) {
    return e.button !== 0;
}
