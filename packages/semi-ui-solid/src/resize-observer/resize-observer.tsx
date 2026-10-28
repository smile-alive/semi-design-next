import { children, createEffect, createMemo, onCleanup, onMount, type JSX } from 'solid-js';
import { isServer } from 'solid-js/web';

/** The subset of `ResizeObserverEntry` that callbacks receive. */
export interface ResizeEntry {
    contentRect: DOMRectReadOnly;
    target: Element;
}

export const ObserverProperty = {
    Width: 'width',
    Height: 'height',
    All: 'all',
} as const;
export type ObserverProperty = (typeof ObserverProperty)[keyof typeof ObserverProperty];

export interface SolidResizeObserverProps {
    /** Renders as given; the first element it produces is the one observed */
    children: JSX.Element;
    onResize?: (entries: ResizeEntry[]) => void;
    observeParent?: boolean;
    observerProperty?: ObserverProperty;
    /** Not read, kept so props written for the React component still type-check */
    delayTick?: number;
}

export default function SolidResizeObserver(props: SolidResizeObserverProps) {
    const formerValue = new WeakMap<Element, number>();
    let observer!: ResizeObserver;

    const resolved = children(() => props.children);
    const first = createMemo(() => (isServer ? undefined : resolved.toArray().find((node): node is Element => node instanceof Element)));

    // runs inside the observer's effect, after the element is in the document and has a parent
    const parent = () => {
        const node = props.observeParent ? first()?.parentNode : null;
        const view = node?.ownerDocument?.defaultView;
        return view && node instanceof view.HTMLElement ? node : null;
    };

    const changed = (entry: ResizeEntry, property: 'width' | 'height') => {
        const value = entry.contentRect[property];
        if (formerValue.get(entry.target) === value) {
            return false;
        }
        formerValue.set(entry.target, value);
        return true;
    };

    const handleResize = (entries: ResizeEntry[]) => {
        const property = props.observerProperty ?? ObserverProperty.All;
        if (property === ObserverProperty.All) {
            props.onResize?.(entries);
            return;
        }
        const final = entries.filter((entry) => changed(entry, property));
        if (final.length > 0) {
            props.onResize?.(final);
        }
    };

    const observe = (element?: Element | null) => {
        if (element) {
            observer.observe(element);
            onCleanup(() => observer.unobserve(element));
        }
    };

    // one observer for child and parent, so a frame that resizes both reports them in a single onResize call; created on
    // mount, ahead of the effects below, since the server has no ResizeObserver and still runs onCleanup
    onMount(() => {
        observer = new ResizeObserver((entries) => handleResize(entries));
        onCleanup(() => observer.disconnect());
    });

    createEffect(() => observe(first()));
    createEffect(() => observe(parent()));

    return <>{resolved()}</>;
}
