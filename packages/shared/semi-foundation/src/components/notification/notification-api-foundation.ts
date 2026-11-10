import { type ListStore, StaticListWrapper } from '../../base/index';
import { cssClasses } from './constants';
import type { NoticeInstance } from './notification-foundation';
import { builtInDefaults, type ConfigProps, createNotificationListStore } from './notification-list-foundation';

/** What the framework supplies to the static `Notification` */
export interface NotificationApiHost {
    /** Throws outside a browser, naming the API */
    assertClient: () => void;
    readGlobalDefaults: () => Partial<NoticeInstance>;
    /** Renders the notification list of `store` into `wrapper` and returns what unmounts it */
    mount: (wrapper: HTMLDivElement, store: ListStore<NoticeInstance>) => () => void;
}

/**
 * The static `Notification`: one list in one wrapper, created by the first notification. It is not a component: a second
 * list rendering its store would show every notice twice. `O` is the framework's notification options.
 */
export default class NotificationApi<O extends object> {
    readonly #host: NotificationApiHost;
    readonly #store = createNotificationListStore();
    readonly #wrapper = new StaticListWrapper(cssClasses.WRAPPER);

    constructor(host: NotificationApiHost) {
        this.#host = host;
    }

    addNotice = (notice: O) => {
        this.#host.assertClient();
        return this.#store.open(notice as NoticeInstance, this.#host.readGlobalDefaults(), (merged) => {
            const wrapper = this.#wrapper.ensure(merged.getPopupContainer, (element) => this.#host.mount(element, this.#store));
            wrapper.style.zIndex = String(typeof merged.zIndex === 'number' ? merged.zIndex : this.#store.defaults.zIndex);
        });
    };

    removeNotice = (id: string) => {
        this.#store.remove(id);
        return id;
    };

    open = (opts: O) => this.addNotice({ ...opts, type: 'default' });
    info = (opts: O) => this.addNotice({ ...opts, type: 'info' });
    success = (opts: O) => this.addNotice({ ...opts, type: 'success' });
    warning = (opts: O) => this.addNotice({ ...opts, type: 'warning' });
    error = (opts: O) => this.addNotice({ ...opts, type: 'error' });
    close = (id: string) => this.removeNotice(id);

    destroyAll = () => {
        if (this.#wrapper.destroy()) {
            // unmounted first: the list no longer listens, so clearing renders nothing
            this.#store.clear();
        }
    };

    config = (opts: ConfigProps) => {
        const defaults: NoticeInstance & ConfigProps = this.#store.defaults;
        for (const pos of ['top', 'left', 'bottom', 'right'] as const) {
            if (pos in opts) {
                defaults[pos] = opts[pos];
            }
        }
        if (typeof opts.zIndex === 'number') {
            defaults.zIndex = opts.zIndex;
        }
        if (typeof opts.duration === 'number') {
            defaults.duration = opts.duration;
        }
        if (typeof opts.position === 'string') {
            defaults.position = opts.position;
        }
        if ('stack' in opts) {
            defaults.stack = opts.stack;
        }
    };

    resetConfig = () => {
        this.#store.defaults = { ...builtInDefaults };
    };
}
