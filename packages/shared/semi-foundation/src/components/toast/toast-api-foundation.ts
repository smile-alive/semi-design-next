import { type ListStore, StaticListWrapper } from '../../base/index';
import { builtInOpts, cssClasses, positions, setPosition, strings } from './constants';
import type { ConfigProps, ToastInstance, ToastType } from './toast-foundation';
import { createToastListStore } from './toast-list-foundation';

/** What the framework supplies to the static `Toast` */
export interface ToastApiHost {
    /** Throws outside a browser, naming the API */
    assertClient: () => void;
    readGlobalDefaults: () => Partial<ToastInstance>;
    /** Renders the toast list of `store` into `wrapper` and returns what unmounts it */
    mount: (wrapper: HTMLDivElement, store: ListStore<ToastInstance>) => () => void;
}

/** The static `Toast` (and `ToastFactory.create()`): one list in one wrapper, created by the first toast. `O` is the framework's toast options. */
export default class ToastApi<O extends object> {
    readonly #host: ToastApiHost;
    readonly #store = createToastListStore();
    readonly #wrapper = new StaticListWrapper(cssClasses.WRAPPER, 'toast-wrapper');
    // ToastFactory.create(config): resetConfig returns to this, not to the built-in options
    readonly #initialConfig: ConfigProps | undefined;

    constructor(host: ToastApiHost, initialConfig?: ConfigProps) {
        this.#host = host;
        // the caller may keep changing the config object it passed
        this.#initialConfig = initialConfig && { ...initialConfig };
        this.resetConfig();
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
        const defaults = this.#store.defaults;
        for (const pos of positions) {
            if (pos in opts) {
                defaults[pos] = opts[pos];
            }
        }
        if (typeof opts.theme === 'string' && strings.themes.includes(opts.theme)) {
            defaults.theme = opts.theme;
        }
        if (typeof opts.zIndex === 'number') {
            defaults.zIndex = opts.zIndex;
        }
        if (typeof opts.duration === 'number') {
            defaults.duration = opts.duration;
        }
        if (typeof opts.getPopupContainer === 'function') {
            defaults.getPopupContainer = opts.getPopupContainer;
        }
    };

    resetConfig = () => {
        this.#store.defaults = { ...builtInOpts };
        if (this.#initialConfig) {
            this.config(this.#initialConfig);
        }
    };
}
