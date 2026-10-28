import { type Accessor, createEffect, onCleanup } from 'solid-js';

type EventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;

interface Options extends Pick<AddEventListenerOptions, 'capture' | 'passive'> {
    /** false removes the listener, true adds it back */
    enabled?: Accessor<boolean>;
}

/**
 * Listens to `type` on the target `target` returns while `enabled`, follows the target when it changes, and removes
 * the listener on disposal. Global targets go in as `() => window` or `() => document.body`.
 *
 * Delegated handlers are not batched (S-H1): turning `enabled` on from a delegated handler of the same event adds the
 * listener mid-dispatch, and it receives that event too. `useClickOutside` guards this for `mousedown`. Do not turn
 * `enabled` on from a delegated handler of the same event type.
 */
export default function useEventListener<K extends keyof EventMap>(target: Accessor<EventTarget | null | undefined>, type: K, listener: (event: EventMap[K]) => void, { enabled = () => true, capture, passive }: Options = {}) {
    createEffect(() => {
        const node = target();
        if (!enabled() || !node) {
            return;
        }
        const controller = new AbortController();
        node.addEventListener(type, (event) => listener(event as EventMap[K]), { capture, passive, signal: controller.signal });
        onCleanup(() => controller.abort());
    });
}
