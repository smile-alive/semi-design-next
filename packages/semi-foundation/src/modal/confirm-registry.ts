/**
 * The open dialogs of one framework's `Modal.confirm` family, which `Modal.destroyAll` closes. Each framework owns one
 * registry: packages of different frameworks on one page must not close each other's dialogs.
 */
export default class ConfirmRegistry {
    readonly #closers = new Set<() => void>();

    /** Returns what unregisters `close`, which the dialog calls once it is gone */
    register = (close: () => void) => {
        this.#closers.add(close);
        return () => {
            this.#closers.delete(close);
        };
    };

    destroyAll = () => {
        const closers = [...this.#closers];
        this.#closers.clear();
        for (const close of closers) {
            close();
        }
    };
}
