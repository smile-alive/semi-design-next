/** Delay before the text is written: a live region only announces changes made after it was registered. */
export const ANNOUNCE_DELAY = 100;
/** How long the text stays, so the same message announced again later still counts as a change. */
export const ANNOUNCE_HOLD = 1000;

/**
 * Whether a Toast or Notification of this type is an alert, which its own `role="alert"` announces; the list's
 * announcer skips it so it is not read twice.
 */
export function isAlertType(type?: string) {
    return type === 'warning' || type === 'error';
}

/**
 * The messages for the list's announcer: those new since `shownIds` (the ids of the previous render) or updated in
 * place, alerts excepted. The caller owns `shownIds` and replaces it with the current ids afterwards.
 */
export function pickFreshAnnouncements<T extends { id?: string; type?: string }>(items: readonly T[], shownIds: ReadonlySet<string | undefined>, updatedItems: readonly { id?: string }[]) {
    return items.filter((item) => (!shownIds.has(item.id) || updatedItems.some((updated) => updated.id === item.id)) && !isAlertType(item.type));
}

/** What a Notification announces: its title and content, without the icon and close button */
export function readNoticeText(notice: Element | null | undefined, prefixCls: string) {
    return Array.from(notice?.querySelectorAll(`.${prefixCls}-title, .${prefixCls}-content`) ?? [], (node) => node.textContent)
        .filter(Boolean)
        .join(' ');
}

/**
 * Feeds a persistent live region. Screen readers announce a status element that is inserted together with its text
 * only some of the time, so messages are written into a region that already exists, in a later task.
 */
export default class Announcer {
    #timer: ReturnType<typeof setTimeout> | undefined;
    #pending = new Map<string, () => string>();
    readonly #write: (text: string) => void;

    constructor(write: (text: string) => void) {
        this.#write = write;
    }

    /**
     * `read` runs at write time, when the message elements are in the document. Messages queued together are read as one;
     * a later call with the same `key` replaces the earlier one, so an in-place update is announced once.
     */
    announce(key: string, read: () => string) {
        this.#pending.set(key, read);
        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => {
            const text = Array.from(this.#pending.values(), (pending) => pending())
                .filter(Boolean)
                .join(' ');
            this.#pending.clear();
            this.#write(text);
            this.#timer = setTimeout(() => this.#write(''), ANNOUNCE_HOLD);
        }, ANNOUNCE_DELAY);
    }

    dispose() {
        clearTimeout(this.#timer);
        this.#pending.clear();
    }
}
