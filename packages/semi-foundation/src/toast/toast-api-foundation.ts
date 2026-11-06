import StaticListWrapper from '../base/static-list-wrapper';
import { cssClasses, setPosition } from './constants';
import type { ConfigProps, ToastInstance, ToastType } from './toast-foundation';
import ToastListStore from './toast-list-foundation';

/** What the framework supplies to the static `Toast` */
export interface ToastApiHost {
    /** Throws outside a browser, naming the API */
    assertClient: () => void;
    readGlobalDefaults: () => Partial<ToastInstance>;
    /** Renders the toast list of `store` into `wrapper` and returns what unmounts it */
    mount: (wrapper: HTMLDivElement, store: ToastListStore) => () => void;
}

/** The static `Toast` (and `ToastFactory.create()`): one list in one wrapper, created by the first toast. `O` is the framework's toast options. */
export default class ToastApi<O extends object> {
    readonly #host: ToastApiHost;
    readonly #store: ToastListStore;
    readonly #wrapper = new StaticListWrapper(cssClasses.WRAPPER, 'toast-wrapper');

    constructor(host: ToastApiHost, initialConfig?: ConfigProps) {
        this.#host = host;
        // resetConfig returns to the config the factory was created with, which the caller may keep changing
        this.#store = new ToastListStore(initialConfig && { ...initialConfig });
    }

    #show(opts: Omit<O, 'type'> | string, type: ToastType) {
        return this.create({ ...(typeof opts === 'string' ? { content: opts } : opts), type } as O);
    }

    get defaultOpts() {
        return this.#store.defaults;
    }

    create = (opts: O) => {
        this.#host.assertClient();
        return this.#store.open(opts as ToastInstance, this.#host.readGlobalDefaults(), (merged) => {
            const wrapper = this.#wrapper.ensure(merged.getPopupContainer, (element) => this.#host.mount(element, this.#store));
            wrapper.style.zIndex = String(merged.zIndex);
            setPosition(wrapper, merged);
        });
    };

    close = (id: string) => {
        this.#store.remove(id);
    };

    destroyAll = () => {
        if (this.#wrapper.destroy()) {
            // unmounted first: the list no longer listens, so clearing renders nothing
            this.#store.clear();
        }
    };

    getWrapperId = (): string | null => this.#wrapper.id;

    info = (opts: Omit<O, 'type'> | string) => this.#show(opts, 'info');
    warning = (opts: Omit<O, 'type'> | string) => this.#show(opts, 'warning');
    error = (opts: Omit<O, 'type'> | string) => this.#show(opts, 'error');
    success = (opts: Omit<O, 'type'> | string) => this.#show(opts, 'success');

    config = (opts: ConfigProps) => {
        this.#store.config(opts);
    };

    resetConfig = () => {
        this.#store.resetConfig();
    };
}
