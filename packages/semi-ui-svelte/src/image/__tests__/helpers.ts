import { flushSync } from 'svelte';
import { fireEvent } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';

export const prefixCls = `${BASE_CLASS_PREFIX}-image`;
export const previewCls = `${prefixCls}-preview`;
export const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];

export const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
export const getPreview = () => $(`div.${previewCls}`);
export const previewImg = () => $(`.${previewCls}-image-img`) as HTMLImageElement;
export const pageInfo = () => $(`.${previewCls}-footer-page`)?.textContent?.trim();
export const footerIcon = (name: string) => $(`.${previewCls}-footer .${BASE_CLASS_PREFIX}-icon-${name}`) as HTMLElement;
export const thumbs = () => document.querySelectorAll<HTMLImageElement>(`.${prefixCls}-img`);
export const arrow = (side: 'prev' | 'next') => $(`.${previewCls}-${side}`) as HTMLElement;

/** Runs the event, then lets Svelte commit what the handlers changed */
export async function fire(action: Promise<unknown>) {
    await action;
    flushSync();
}

export async function clickMask(x = 10, y = 10) {
    await fire(fireEvent.mouseDown(getPreview() as HTMLElement, { clientX: x, clientY: y }));
    await fire(fireEvent.mouseUp(getPreview() as HTMLElement, { clientX: x, clientY: y }));
}

// a real key press starts at the focused element and bubbles through the document
export const pressEsc = () => fire(fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' }));

// testing-library's fireEvent does not return whether the default was prevented
export function dispatch<E extends Event>(target: EventTarget, event: E) {
    target.dispatchEvent(event);
    flushSync();
    return event;
}

export const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.activeElement ?? window) => dispatch(target, new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));

export const click = (el: Element) => dispatch(el, new MouseEvent('click', { bubbles: true, cancelable: true }));

// jsdom has no layout: give the preview container and the preview image the sizes the zoom math reads
export function mockLayout({ container = [1000, 800], natural = [2000, 1000] } = {}) {
    const sized = (el: HTMLElement) => el.classList?.contains(`${previewCls}-image`);
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get(this: HTMLElement) {
            return sized(this) ? container[0] : 0;
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement) {
            return sized(this) ? container[1] : 0;
        },
    });
    const naturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    const naturalHeight = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight');
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => natural[0] });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get: () => natural[1] });
    return () => {
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
        delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
        Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidth as PropertyDescriptor);
        Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', naturalHeight as PropertyDescriptor);
    };
}

export function stubFailingFetch() {
    const fetchMock = vi.fn<(src: string) => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

/** A `Image` stand-in recording the preloads the foundation starts with `new Image()` */
export function stubPreloadImage() {
    const created: { requested: string[]; onload: () => void; onerror: () => void }[] = [];
    vi.stubGlobal(
        'Image',
        class {
            #src = '';
            requested: string[] = [];
            constructor() {
                created.push(this);
            }
            onload = () => {};
            onerror = () => {};
            set src(value: string) {
                this.requested.push(value);
                this.#src = value;
            }
            get src() {
                return this.#src;
            }
        }
    );
    return created;
}

/** Observers that still watch an element; the stub never fires on its own, `fire` reports an intersection */
export function stubIntersectionObserver() {
    interface Stub {
        callback: (entries: { target: Element; isIntersecting: boolean }[]) => void;
        options: IntersectionObserverInit;
        elements: Set<Element>;
    }
    const observers: Stub[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            elements = new Set<Element>();
            callback: Stub['callback'];
            options: IntersectionObserverInit;
            constructor(callback: (entries: Parameters<Stub['callback']>[0], observer: unknown) => void, options: IntersectionObserverInit) {
                // the platform passes the observer as the second argument
                this.callback = (entries) => callback(entries, this);
                this.options = options;
                observers.push(this);
            }
            observe(el: Element) {
                this.elements.add(el);
            }
            unobserve(el: Element) {
                this.elements.delete(el);
            }
            disconnect() {
                this.elements.clear();
            }
        }
    );
    return {
        live: () => observers.filter((o) => o.elements.size > 0),
        watching: (el: Element) => observers.find((o) => o.elements.has(el)),
    };
}
