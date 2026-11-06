/** A countdown that restarts on every `start` and ignores starts while unmounted, such as a copy that resolves late */
export class ResetTimer {
    #id: ReturnType<typeof setTimeout> | undefined;
    // mount and unmount pair up so StrictMode's replayed effect re-enables it
    #mounted = false;

    get isMounted() {
        return this.#mounted;
    }

    mount() {
        this.#mounted = true;
    }

    unmount() {
        this.#mounted = false;
        this.clear();
    }

    start(ms: number, onEnd: () => void) {
        if (!this.#mounted) {
            return;
        }
        this.clear();
        this.#id = setTimeout(() => {
            this.#id = undefined;
            onEnd();
        }, ms);
    }

    clear() {
        clearTimeout(this.#id);
        this.#id = undefined;
    }
}
