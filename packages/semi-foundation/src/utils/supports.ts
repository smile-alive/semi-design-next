// Parameter-level feature detection that cannot be polyfilled from outside. Every probe runs on first use (never at
// module load or render time, so SSR never touches the DOM) and is cached. Each one states the browser versions from
// which it, and its fallback, can be deleted.

let containerOption: boolean | undefined;
let focusVisibleOption: boolean | undefined;

/**
 * `scrollIntoView({ container: 'nearest' })` limits scrolling to the nearest scroller.
 * Removable once the oldest supported browsers are Chrome 140, Firefox and Safari (neither supports it yet).
 */
export function supportsScrollContainerOption() {
    if (containerOption === undefined) {
        containerOption = false;
        document.createElement('div').scrollIntoView({
            get container() {
                containerOption = true;
                return 'nearest';
            },
        } as ScrollIntoViewOptions);
    }
    return containerOption;
}

/** `focus({ focusVisible })`. Removable once the oldest supported browsers are Chrome 145, Firefox 104 and Safari 18.4. */
export function supportsFocusVisibleOption() {
    if (focusVisibleOption === undefined) {
        focusVisibleOption = false;
        document.createElement('div').focus({
            get focusVisible() {
                focusVisibleOption = true;
                return false;
            },
        } as FocusOptions);
    }
    return focusVisibleOption;
}

/** Where `el` has to land inside `scroller` along one axis, as the amount to scroll; same alignment names as scrollIntoView */
function alignDelta(elStart: number, elEnd: number, scrStart: number, scrEnd: number, align: ScrollLogicalPosition) {
    const toStart = elStart - scrStart;
    const toEnd = elEnd - scrEnd;
    switch (align) {
        case 'start':
            return toStart;
        case 'end':
            return toEnd;
        case 'center':
            return (toStart + toEnd) / 2;
        default:
            if ((toStart >= 0 && toEnd <= 0) || (toStart < 0 && toEnd > 0)) {
                return 0;
            }
            return Math.abs(toStart) < Math.abs(toEnd) ? toStart : toEnd;
    }
}

/**
 * Scrolls only `scroller` so that `el` is aligned as `scrollIntoView` would, never the page or other ancestors.
 * The fallback covers Firefox and Safari; see supportsScrollContainerOption for when it can go.
 */
export function scrollIntoViewWithin(el: Element, scroller: HTMLElement, { behavior, block = 'nearest', inline = 'nearest' }: ScrollIntoViewOptions = {}) {
    if (supportsScrollContainerOption()) {
        el.scrollIntoView({ behavior, block, inline, container: 'nearest' } as ScrollIntoViewOptions);
        return;
    }
    const elRect = el.getBoundingClientRect();
    const scrRect = scroller.getBoundingClientRect();
    // client box: borders and scrollbars are not scrollable room
    const scrLeft = scrRect.left + scroller.clientLeft;
    const scrTop = scrRect.top + scroller.clientTop;
    const rtl = getComputedStyle(scroller).direction === 'rtl';
    const flip = (align: ScrollLogicalPosition) => (rtl && align !== 'center' && align !== 'nearest' ? (align === 'start' ? 'end' : 'start') : align);
    // Firefox defers a smooth scroll of an unpainted scroller until it is painted, leaving the old position readable;
    // off screen nobody sees the animation. shortcut: only checks the viewport, not clipping by scrolled ancestors
    const offscreen = scrRect.bottom <= 0 || scrRect.top >= innerHeight || scrRect.right <= 0 || scrRect.left >= innerWidth;
    scroller.scrollTo({
        left: scroller.scrollLeft + alignDelta(elRect.left, elRect.right, scrLeft, scrLeft + scroller.clientWidth, flip(inline)),
        top: scroller.scrollTop + alignDelta(elRect.top, elRect.bottom, scrTop, scrTop + scroller.clientHeight, block),
        behavior: offscreen ? 'instant' : behavior,
    });
}

/**
 * Focuses `el` without drawing the :focus-visible ring (pointer-triggered programmatic focus).
 * The fallback marks the element with data-semi-pointer-focus, and the component styles skip the ring for marked
 * elements; like the native option, a later key press brings the ring back. Removable with supportsFocusVisibleOption.
 */
export function focusWithoutRing(el: HTMLElement, options: FocusOptions = {}) {
    if (supportsFocusVisibleOption()) {
        el.focus({ ...options, focusVisible: false } as FocusOptions);
        return;
    }
    const unmark = new AbortController();
    const clear = () => {
        el.removeAttribute('data-semi-pointer-focus');
        unmark.abort();
    };
    el.setAttribute('data-semi-pointer-focus', '');
    el.addEventListener('blur', clear, { signal: unmark.signal });
    el.addEventListener('keydown', clear, { signal: unmark.signal });
    el.focus(options);
    if (el.ownerDocument.activeElement !== el) {
        clear();
    }
}
