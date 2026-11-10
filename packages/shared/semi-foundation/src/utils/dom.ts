/**
 * Whether the event passed through any of `nodes`. The composed path is fixed when dispatch starts, so it still
 * lists the old ancestors of a target that an earlier listener removed, and it crosses shadow roots.
 */
export function isEventInside(e: Event, ...nodes: (Node | null | undefined)[]) {
    const path = e.composedPath();
    return nodes.some((node) => node != null && path.includes(node));
}

// Returns a plain boolean: an inferred `obj is HTMLElement` predicate would wrongly narrow callers' Element types.
// Also called during SSR (e.g. Tooltip), where HTMLElement does not exist.
export function isHTMLElement(obj: any) {
    return typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement;
}

export interface RegisterMediaQueryOption {
    match?: (e: MediaQueryList | MediaQueryListEvent) => void;
    unmatch?: (e: MediaQueryList | MediaQueryListEvent) => void;
    callInInit?: boolean;
}

export function registerMediaQuery(media: string, { match, unmatch, callInInit = true }: RegisterMediaQueryOption) {
    if (typeof window !== 'undefined') {
        const mediaQueryList = window.matchMedia(media);
        const handlerMediaChange = (e: MediaQueryList | MediaQueryListEvent) => {
            if (e.matches) {
                match?.(e);
            } else {
                unmatch?.(e);
            }
        };
        if (callInInit) {
            handlerMediaChange(mediaQueryList);
        }
        mediaQueryList.addEventListener('change', handlerMediaChange);
        return () => mediaQueryList.removeEventListener('change', handlerMediaChange);
    }
    return () => undefined;
}

/** Outside the fullscreen element nothing is shown or clickable, so a popup opened during fullscreen goes into it */
export function defaultPopupContainer() {
    return (document.fullscreenElement as HTMLElement | null) ?? document.body;
}

/**
 * Whether an overlay rendered through `getPopupContainer` covers the page: no container, or one that resolves to body
 * or to the fullscreen element, which is the whole visible page. Only such an overlay locks body scroll and is modal;
 * one confined to another element leaves the page usable. Known limitation: the fullscreen element is read when
 * called, so an overlay left in it after fullscreen ends counts as confined; upgrade if keepDOM overlays must keep
 * their modality across a fullscreen change.
 */
export function coversPage(getPopupContainer?: () => HTMLElement | null) {
    if (!getPopupContainer) {
        return true;
    }
    const container = getPopupContainer();
    return container != null && (container === container.ownerDocument.body || container === container.ownerDocument.fullscreenElement);
}

/**
 * The container a popup renders into: the result of `get` (the component's own getPopupContainer, else
 * ConfigProvider's), `fallback` without one. A chosen getter returning null (a template ref not set yet) fails loud
 * instead of quietly falling back to body, where the popup would render somewhere the caller did not ask for.
 */
export function resolvePopupContainer(get?: () => HTMLElement | null, fallback: HTMLElement = defaultPopupContainer()) {
    const container = get ? get() : fallback;
    if (!container) {
        throw new Error('[Semi Portal] getPopupContainer returned no element; it must return a node that exists when the popup renders');
    }
    return container;
}

/** Scrolls `scroller` so `node` sits in its middle; scrollIntoView is avoided because it can also scroll the page */
export function centerInScroller(node: HTMLElement, scroller: HTMLElement) {
    scroller.scrollTop = node.offsetTop - scroller.offsetTop - scroller.clientHeight / 2 + node.clientHeight / 2;
}

/** A number means px: React's style adds the unit itself, Vue and Solid style bindings do not */
export function toCssLength(value?: number | string | null): string | undefined {
    return typeof value === 'number' ? `${value}px` : (value ?? undefined);
}
