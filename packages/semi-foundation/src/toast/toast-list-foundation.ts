import { omitBy } from 'es-toolkit';
import ListStore, { type ListStoreState } from '../base/list-store';
import type { ConfigProps, ToastInstance } from '../toast/toast-foundation';
import { createId } from '../utils/uuid';
import { builtInOpts, numbers, positions, strings } from './constants';

export interface ToastListState extends ListStoreState<ToastInstance> {
    list: ToastInstance[];
    // 0 never stacks
    stack: number;
}

export interface ToastListProps {
    store: ToastListStore;
}

/** Toasts of one list, shown at the end; `defaults` are the options of the static API that owns the list */
export default class ToastListStore {
    #items = new ListStore<ToastInstance, 'list', ToastListState>('list', 'end', { list: [], removedItems: [], updatedItems: [], order: [], stack: 0 });
    // ToastFactory.create(config): resetConfig returns to this, not to the built-in options
    readonly #initialConfig: ConfigProps | undefined;
    defaults: ToastInstance;

    constructor(initialConfig?: ConfigProps) {
        this.#initialConfig = initialConfig;
        this.resetConfig();
    }

    subscribe = (listener: () => void) => this.#items.subscribe(listener);

    getSnapshot = () => this.#items.getSnapshot();

    /** Shows a toast at the end, or updates the shown one with the same id in place */
    add = (toast: ToastInstance) => {
        this.#items.add(toast);
    };

    /**
     * Shows a toast with `opts` over the list's defaults and the global defaults, which is where the global defaults
     * take effect: an explicit undefined replaces nothing. `beforeShow` gets the merged options before the toast is
     * added, so a static API can place its wrapper by them. Returns the id.
     */
    open = (opts: ToastInstance, globalDefaults: Partial<ToastInstance>, beforeShow?: (merged: ToastInstance) => void) => {
        const merged: ToastInstance = { ...this.defaults, ...globalDefaults, ...omitBy(opts, (value) => value === undefined) };
        const id = merged.id ?? createId('toast');
        beforeShow?.(merged);
        this.setStack(merged.stack);
        this.add({ ...merged, id });
        return id;
    };

    remove = (id: string) => {
        this.#items.remove(id);
    };

    finishLeave = (id: string) => {
        this.#items.finishLeave(id);
    };

    clear = () => {
        this.#items.clear();
    };

    setStack = (option?: boolean | number) => {
        const stack = option === true ? numbers.stackThreshold : typeof option === 'number' ? Math.max(option, 0) : 0;
        const { stack: current, updatedItems } = this.#items.getSnapshot();
        if (stack !== current) {
            this.#items.set({ stack, updatedItems });
        }
    };

    config = (opts: ConfigProps) => {
        for (const pos of positions) {
            if (pos in opts) {
                this.defaults[pos] = opts[pos];
            }
        }
        if (typeof opts.theme === 'string' && strings.themes.includes(opts.theme)) {
            this.defaults.theme = opts.theme;
        }
        if (typeof opts.zIndex === 'number') {
            this.defaults.zIndex = opts.zIndex;
        }
        if (typeof opts.duration === 'number') {
            this.defaults.duration = opts.duration;
        }
        if (typeof opts.getPopupContainer === 'function') {
            this.defaults.getPopupContainer = opts.getPopupContainer;
        }
    };

    resetConfig = () => {
        this.defaults = { ...builtInOpts };
        if (this.#initialConfig) {
            this.config(this.#initialConfig);
        }
    };
}
