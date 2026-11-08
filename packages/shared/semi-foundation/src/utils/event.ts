type Listener = (...args: any[]) => void;

export default class Event {
    #eventMap = new Map<string, Listener[]>();

    on(event: string, callback: Listener) {
        if (event && typeof callback === 'function') {
            if (!this.#eventMap.has(event)) {
                this.#eventMap.set(event, []);
            }

            this.#eventMap.get(event).push(callback);
        }
        return this;
    }

    once(event: string, callback: Listener) {
        if (event && typeof callback === 'function') {
            const fn: Listener = (...args) => {
                callback(...args);
                this.off(event, fn);
            };

            this.on(event, fn);
        }
        return this;
    }

    off(event: string, callback?: null | Listener) {
        if (event) {
            if (typeof callback === 'function') {
                const callbacks = this.#eventMap.get(event);
                if (Array.isArray(callbacks) && callbacks.length) {
                    this.#eventMap.set(
                        event,
                        callbacks.filter((cb) => cb !== callback)
                    );
                }
            } else if (callback == null) {
                this.#eventMap.delete(event);
            }
        }
        return this;
    }

    emit(event: string, ...args: any[]) {
        if (!this.#eventMap.has(event)) {
            return false;
        }
        const callbacks = [...this.#eventMap.get(event)];
        // iterate a copy: a callback may unregister itself (e.g. once) while we loop
        callbacks.forEach((callback) => callback(...args));
        return true;
    }
}
