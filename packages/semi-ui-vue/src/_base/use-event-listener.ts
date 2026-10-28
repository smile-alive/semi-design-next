import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue';

export const getDocument = () => document;
export const getWindow = () => window;
export const getBody = () => document.body;

type EventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;

interface Options extends Pick<AddEventListenerOptions, 'capture' | 'passive' | 'once'> {
    enabled?: MaybeRefOrGetter<boolean>;
}

export default function useEventListener<K extends keyof EventMap>(target: MaybeRefOrGetter<EventTarget | null | undefined>, type: K | readonly K[], listener: (event: EventMap[K]) => void, { enabled = true, capture, passive, once }: Options = {}) {
    watchEffect(
        (cleanup) => {
            if (!toValue(enabled)) {
                return;
            }
            const node = toValue(target);
            if (!node) {
                return;
            }
            const controller = new AbortController();
            for (const name of [type].flat()) {
                node.addEventListener(name, (event) => listener(event as EventMap[K]), {
                    capture,
                    passive,
                    once,
                    signal: controller.signal,
                });
            }
            cleanup(() => controller.abort());
        },
        { flush: 'post' }
    );
}
