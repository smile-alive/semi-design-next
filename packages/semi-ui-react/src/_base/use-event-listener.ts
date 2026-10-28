import { type RefObject, useEffect, useEffectEvent } from 'react';

type Target = HTMLElement | Window | Document | RefObject<HTMLElement | null> | (() => EventTarget | null) | null;

type EventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;

interface Options extends Pick<AddEventListenerOptions, 'capture' | 'passive' | 'once'> {
    /** false removes the listeners, true adds them back */
    enabled?: boolean;
}

// Getters, since reading `document`/`window` during server render throws; a stable function avoids re-subscribing
export const getDocument = () => document;
export const getWindow = () => window;
export const getBody = () => document.body;

function resolveTarget(target: Target): EventTarget | null {
    if (target === null) {
        return null;
    }
    if (typeof target === 'function') {
        return target();
    }
    // not 'current' in target: id/name="current" elements become named properties of window and document
    return 'addEventListener' in target ? target : target.current;
}

/**
 * Listens to one or more events on `target` while `enabled`, and removes the listeners on unmount; `listener` always
 * sees the latest render's values. A ref or function target is read when the effect runs, so it must point at an
 * element that stays for the component's lifetime; pass the element itself (kept in state) when it can change. Global
 * targets go in as `getDocument`, `getWindow` or `getBody`.
 */
export default function useEventListener<K extends keyof EventMap>(target: Target, type: K | readonly K[], listener: (e: EventMap[K]) => void, { enabled = true, capture, passive, once }: Options = {}) {
    const handle = useEffectEvent(listener);
    const types = [type].flat().join(' ');

    useEffect(() => {
        const node = resolveTarget(target);
        if (!enabled || !node) {
            return undefined;
        }
        const controller = new AbortController();
        for (const name of types.split(' ')) {
            node.addEventListener(name, (e) => handle(e as EventMap[K]), {
                capture,
                passive,
                once,
                signal: controller.signal,
            });
        }
        return () => controller.abort();
    }, [target, types, enabled, capture, passive, once]);
}
