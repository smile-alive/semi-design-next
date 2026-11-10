import type ConfirmRegistry from './confirm-registry';

export interface ConfirmInstanceHost<C> {
    /** Renders the dialog with `props` on every change after the first render, which the host does itself */
    render: (props: C) => void;
    /** Takes the dialog and its container down; called once */
    remove: () => void;
}

/**
 * One dialog of `Modal.confirm` or `useModal`: its latest config and the end of its life. The host renders `props`,
 * whose afterClose ends the dialog, and calls `handleMount` once the dialog exists. With a registry, `destroyAll` reaches
 * the dialog.
 */
export default class ConfirmInstance<C extends { visible?: boolean; afterClose?: () => void }> {
    #config: C;
    #mounted = false;
    #ended = false;
    readonly #host: ConfirmInstanceHost<C>;
    readonly #unregister?: () => void;

    constructor(config: C, host: ConfirmInstanceHost<C>, registry?: ConfirmRegistry) {
        this.#config = config;
        this.#host = host;
        this.#unregister = registry?.register(this.close);
    }

    #end() {
        if (this.#ended) {
            return;
        }
        this.#ended = true;
        this.#config.afterClose?.();
        this.#host.remove();
        this.#unregister?.();
    }

    /** What `Modal.confirm` and the `useModal` methods return */
    get handle() {
        return { destroy: this.close, update: this.update };
    }

    get props(): C {
        return { ...this.#config, afterClose: this.handleAfterClose };
    }

    // A dialog first rendered hidden never reports afterClose, so a close before the mount ends it without rendering
    close = () => {
        if (this.#mounted) {
            this.update({ visible: false } as Partial<C>);
        } else {
            this.#end();
        }
    };

    update = (change: Partial<C>) => {
        if (this.#ended) {
            return;
        }
        this.#config = { ...this.#config, ...change };
        this.#host.render(this.props);
    };

    handleMount = () => {
        this.#mounted = true;
    };

    handleAfterClose = () => this.#end();
}
