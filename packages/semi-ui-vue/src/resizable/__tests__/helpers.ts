import { nextTick } from 'vue';
import { vi } from 'vite-plus/test';

type Axis = 'width' | 'height';

// jsdom has no layout: an element's size comes from its inline width/height (px, % or `calc(a% - bpx)` of the
// parent), a group handler is 10px, a Resizable without a size is 300 x 200, anything else fills its parent,
// and the document is 1000 x 800
const ROOT = { width: 1000, height: 800 };

function measure(el: HTMLElement, prop: Axis): number {
    const value = el.style?.[prop] ?? '';
    const parentSize = () => (el.parentElement ? measure(el.parentElement, prop) : ROOT[prop]);
    if (value.endsWith('px')) {
        return parseFloat(value);
    }
    if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * parentSize();
    }
    const calc = /^calc\(([\d.]+)% - ([\d.]+)px\)$/.exec(value);
    if (calc) {
        return (Number(calc[1]) / 100) * parentSize() - Number(calc[2]);
    }
    if (el.classList?.contains('semi-resizable-resizable')) {
        return prop === 'width' ? 300 : 200;
    }
    if (el.classList?.contains('semi-resizable-handler')) {
        return 10;
    }
    return parentSize();
}

export function mockLayout() {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return measure(this, 'width');
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return measure(this, 'height');
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const width = measure(this, 'width');
        const height = measure(this, 'height');
        return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height } as DOMRect;
    });
}

// Events are dispatched directly: Testing Library's fireEvent waits on a setTimeout, which fake timers never run.
// jsdom has no pointer capture, so the moves and the release the browser would send to the pressed handle go to it.
let pressed: Element;
const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', ...init }));
const point = ([clientX, clientY]: number[]) => ({ clientX, clientY });

// a mouse right or middle button, a pen's barrel button and its eraser
export const nonPrimaryPresses = [
    ['mouse', 1],
    ['mouse', 2],
    ['pen', 2],
    ['pen', 5],
] as const;

export async function down(target: Element, from: number[], init: PointerEventInit = {}) {
    pressed = target;
    pointer(target, 'pointerdown', { ...point(from), ...init });
    await nextTick();
}

export async function move(to: number[]) {
    pointer(pressed, 'pointermove', point(to));
    await nextTick();
}

export async function up(to = [0, 0]) {
    pointer(pressed, 'pointerup', point(to));
    pointer(pressed, 'lostpointercapture', point(to));
    await nextTick();
}

export async function drag(target: Element, from: number[], to: number[]) {
    await down(target, from);
    await move(to);
    await up(to);
}

/** Returns whether the key press went through without preventDefault */
export async function key(target: Element, name: string, init: KeyboardEventInit = {}) {
    const notPrevented = target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name, ...init }));
    await nextTick();
    return notPrevented;
}
