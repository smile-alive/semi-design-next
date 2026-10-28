import { Children, Fragment, useCallback, useEffectEvent, useLayoutEffect, useState, type FragmentInstance, type ReactElement } from 'react';

/** The subset of `ResizeObserverEntry` that callbacks receive. */
export interface ResizeEntry {
    contentRect: DOMRectReadOnly;
    target: Element;
}

export interface ReactResizeObserverProps {
    /** A single element: `Children.only` throws on anything else */
    children: ReactElement;
    onResize?: (entries: ResizeEntry[]) => void;
    observeParent?: boolean;
    observerProperty?: ObserverProperty;
    delayTick?: number;
}

export const ObserverProperty = {
    Width: 'width',
    Height: 'height',
    All: 'all',
} as const;
export type ObserverProperty = (typeof ObserverProperty)[keyof typeof ObserverProperty];

/** Holds the observer, the observed elements and the last size per target. */
class ObserverRuntime {
    readonly #children = new Set<Element>();
    #first: Element | null = null;
    #parent: Element | null = null;

    #observer: ResizeObserver | null = null;
    #fragment: FragmentInstance | null = null;
    #observeParent = false;
    readonly #formerPropertyValue = new WeakMap<Element, number>();
    #observe: (target: Element) => void = () => {};
    #unobserve: (target: Element) => void = () => {};

    #update() {
        let first: Element | null = null;
        for (const child of this.#children) {
            if (!first || first.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_PRECEDING) {
                first = child;
            }
        }
        if (first !== this.#first) {
            if (this.#first) {
                this.#unobserve(this.#first);
            }
            this.#first = first;
            if (first) {
                this.#observe(first);
            }
        }
        const parent = this.#observeParent ? first?.parentNode : null;
        const view = parent?.ownerDocument?.defaultView;
        const observedParent = view && parent instanceof view.HTMLElement ? parent : null;
        if (observedParent !== this.#parent) {
            if (this.#parent) {
                this.#unobserve(this.#parent);
            }
            this.#parent = observedParent;
            if (observedParent) {
                this.#observe(observedParent);
            }
        }
    }

    connect(observeParent: boolean, onEntries: (entries: ResizeEntry[]) => void) {
        this.#observeParent = observeParent;
        const observer = new ResizeObserver(onEntries);
        this.#observe = observer.observe.bind(observer);
        this.#unobserve = observer.unobserve.bind(observer);
        // React calls observe/unobserve per first-level DOM child; recording them finds the children.
        // Only the first child (and its parent) is actually observed.
        observer.observe = (target: Element) => {
            this.#children.add(target);
            this.#update();
        };
        observer.unobserve = (target: Element) => {
            this.#children.delete(target);
            this.#update();
        };
        this.#observer = observer;
        this.#fragment?.observeUsing(observer);
    }

    disconnect() {
        if (this.#observer) {
            this.#fragment?.unobserveUsing(this.#observer);
            this.#observer.disconnect();
        }
        this.#observer = null;
        this.#children.clear();
        this.#first = null;
        this.#parent = null;
    }

    setFragment(frag: FragmentInstance) {
        this.#fragment = frag;
        if (this.#observer) {
            frag.observeUsing(this.#observer);
        }
        return () => {
            if (this.#observer) {
                frag.unobserveUsing(this.#observer);
            }
            this.#fragment = null;
        };
    }

    changed(entry: ResizeEntry, property: 'width' | 'height') {
        const value = entry.contentRect[property];
        if (this.#formerPropertyValue.has(entry.target) && this.#formerPropertyValue.get(entry.target) === value) {
            return false;
        }
        this.#formerPropertyValue.set(entry.target, value);
        return true;
    }
}

export default function ReactResizeObserver({ children, onResize, observeParent = false, observerProperty = 'all' }: ReactResizeObserverProps) {
    const [runtime] = useState(() => new ObserverRuntime());

    const child = Children.only(children);

    const setFragment = useCallback((frag: FragmentInstance) => runtime.setFragment(frag), [runtime]);

    const handleEntries = useEffectEvent((entries: ResizeEntry[]) => {
        if (observerProperty === ObserverProperty.All) {
            onResize?.(entries);
            return;
        }
        const finalEntries = entries.filter((entry) => runtime.changed(entry, observerProperty));
        if (finalEntries.length > 0) {
            onResize?.(finalEntries);
        }
    });

    // layout phase so the first report arrives before paint
    useLayoutEffect(() => {
        runtime.connect(observeParent, (entries) => handleEntries(entries));
        return () => runtime.disconnect();
    }, [runtime, observeParent]);

    return <Fragment ref={setFragment}>{child}</Fragment>;
}
