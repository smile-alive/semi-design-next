import type { GlobalEvents } from './emitter-events';
import { getCurrentNameSpaceId } from './name-space';

type EventHandler<T> = (event: T) => void;

const emitterMap = new Map<string, Emitter<GlobalEvents>>();

export class Emitter<Events extends Record<string, any>> {
    listeners: { [K in keyof Events]?: EventHandler<Events[K]>[] } = {};

    constructor() {}

    on<K extends keyof Events>(event: K, listener: EventHandler<Events[K]>) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]?.push(listener);
    }

    off<K extends keyof Events>(event: K, listener: EventHandler<Events[K]>) {
        if (!this.listeners[event]) return;

        this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
    }

    dispose() {
        this.listeners = {};
    }

    removeAllListeners() {
        this.listeners = {};
    }

    emit<K extends keyof Events>(event: K, data: Events[K]) {
        if (!this.listeners[event]) return;

        for (const listener of this.listeners[event]) {
            listener(data);
        }
    }
}

export function getEmitter() {
    const currentNameSpaceId = getCurrentNameSpaceId();
    if (!currentNameSpaceId) {
        throw new Error('currentNameSpaceId is not set');
    }
    let emitter = emitterMap.get(currentNameSpaceId);
    if (!emitter) {
        emitter = new Emitter<GlobalEvents>();
        emitterMap.set(currentNameSpaceId, emitter);
    }
    return emitter;
}

export function disposeEmitter(id: string) {
    const emitter = emitterMap.get(id);
    if (emitter) {
        emitter.dispose();
        emitterMap.delete(id);
    }
}
