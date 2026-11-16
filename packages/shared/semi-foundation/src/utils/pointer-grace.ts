/**
 * Pointer grace (menu aim): a pointer leaving a hover trigger diagonally toward the popup it opened crosses other
 * triggers on the way. While it keeps heading for the popup inside the triangle between its exit point and the popup's
 * near edge, the popup stays open and the crossed triggers wait. Radix Menu's pointer grace, with its 300ms limit.
 */

export interface GracePoint {
    x: number;
    y: number;
}

export type GraceRect = Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>;

export type GraceSide = 'top' | 'right' | 'bottom' | 'left';

export const POINTER_GRACE_TIMEOUT = 300;

// The apex is pulled back past the exit point, so a pointer still at the edge it left from is inside
const BLEED = 5;

const AXES = { right: ['x', 1], left: ['x', -1], bottom: ['y', 1], top: ['y', -1] } as const;

export type GraceTriangle = [GracePoint, GracePoint, GracePoint];

const isInRect = (x: number, y: number, rect: GraceRect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

const cross = (x: number, y: number, a: GracePoint, b: GracePoint) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);

/** A point on an edge counts as inside. Runs on every pointermove, hence plain numbers and no allocation */
export function isPointInTriangle(x: number, y: number, [a, b, c]: GraceTriangle) {
    const ab = cross(x, y, a, b);
    const bc = cross(x, y, b, c);
    const ca = cross(x, y, c, a);
    return !((ab < 0 || bc < 0 || ca < 0) && (ab > 0 || bc > 0 || ca > 0));
}

/** The side of `from` that `to` lies beyond; horizontal sides first, as submenus open sideways. Null when they overlap */
export function getGraceSide(from: GraceRect, to: GraceRect): GraceSide | null {
    if (to.left >= from.right) {
        return 'right';
    }
    if (to.right <= from.left) {
        return 'left';
    }
    if (to.top >= from.bottom) {
        return 'bottom';
    }
    if (to.bottom <= from.top) {
        return 'top';
    }
    return null;
}

/** The triangle from the exit point to the two corners of `to` on its edge nearest the exit */
export function getGraceArea(exit: GracePoint, to: GraceRect, side: GraceSide): GraceTriangle {
    const [axis, sign] = AXES[side];
    const apex = { ...exit, [axis]: exit[axis] - sign * BLEED };
    if (axis === 'x') {
        const near = side === 'right' ? to.left : to.right;
        return [apex, { x: near, y: to.top }, { x: near, y: to.bottom }];
    }
    const near = side === 'bottom' ? to.top : to.bottom;
    return [apex, { x: to.left, y: near }, { x: to.right, y: near }];
}

/**
 * Starts a grace for a mouse that left `from` at `exit`, heading for `to`. Listens to document pointermove (mouse
 * only) until it ends: `onEnd(true, last)` once the pointer is in `to`; `onEnd(false, last)` once it leaves the
 * triangle, moves away from `to` along the side's axis, or after POINTER_GRACE_TIMEOUT. A move with no change along
 * that axis says nothing about direction. Returns the cancel function, which ends it without calling `onEnd`, or
 * null when no grace applies: `to` has no area, overlaps `from` or already holds the exit point, or the pointer left
 * past `from`'s far edge, away from `to`. `from` and `to` are read once here: the pointermove handler never touches
 * layout.
 */
export function trackPointerGrace(exit: GracePoint, from: GraceRect, to: GraceRect, onEnd: (reached: boolean, last: GracePoint) => void) {
    const side = getGraceSide(from, to);
    if (!side || to.right <= to.left || to.bottom <= to.top || isInRect(exit.x, exit.y, to)) {
        return null;
    }
    const [axis, sign] = AXES[side];
    const farEdge = { right: from.left, left: from.right, bottom: from.top, top: from.bottom }[side];
    if ((exit[axis] - farEdge) * sign < 0) {
        return null;
    }
    const area = getGraceArea(exit, to, side);
    const controller = new AbortController();
    let lastX = exit.x;
    let lastY = exit.y;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
        controller.abort();
        clearTimeout(timer);
    };
    const end = (reached: boolean) => {
        cancel();
        onEnd(reached, { x: lastX, y: lastY });
    };
    timer = setTimeout(() => end(false), POINTER_GRACE_TIMEOUT);
    document.addEventListener(
        'pointermove',
        (e) => {
            if (e.pointerType !== 'mouse') {
                return;
            }
            const { clientX: x, clientY: y } = e;
            const away = (axis === 'x' ? x - lastX : y - lastY) * sign < 0;
            lastX = x;
            lastY = y;
            if (isInRect(x, y, to)) {
                end(true);
            } else if (away || !isPointInTriangle(x, y, area)) {
                end(false);
            }
        },
        { signal: controller.signal }
    );
    return cancel;
}
