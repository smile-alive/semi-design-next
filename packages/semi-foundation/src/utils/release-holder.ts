/**
 * Keeps the release function of one resource an overlay takes while it is shown (body scroll lock, overlay layer).
 * Holding again releases the previous hold first, and releasing is idempotent.
 */
export default class ReleaseHolder {
    #release: (() => void) | null = null;

    hold(acquire: () => () => void) {
        this.release();
        this.#release = acquire();
    }

    release() {
        const release = this.#release;
        this.#release = null;
        release?.();
    }
}
