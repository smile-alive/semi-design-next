import { KEEP_INTERACTIVE_ATTRIBUTE } from './layer';

/** Delay before the text is written: a live region only announces changes made after it was registered. */
export const ANNOUNCE_DELAY = 100;
/** How long the text stays, so the same message announced again later still counts as a change. */
export const ANNOUNCE_HOLD = 1000;

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
    announce = (key: string, read: () => string) => {
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
    };

    dispose = () => {
        clearTimeout(this.#timer);
        this.#pending.clear();
    };
}

export type Politeness = 'polite' | 'assertive';

const pageAnnouncers = new Map<Politeness, { region: HTMLElement; announcer: Announcer }>();
let messageId = 0;

function getPageAnnouncer(politeness: Politeness) {
    let entry = pageAnnouncers.get(politeness);
    if (!entry) {
        const region = document.createElement('div');
        region.setAttribute('aria-live', politeness);
        region.setAttribute('aria-atomic', 'true');
        // a modal dialog makes the rest of the page inert, and an inert live region is not announced
        region.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        region.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';
        entry = {
            region,
            announcer: new Announcer((text) => {
                region.textContent = text;
            }),
        };
        pageAnnouncers.set(politeness, entry);
    }
    // a page that replaces the body content (tests, a router that swaps <body>) takes the region with it
    if (!entry.region.isConnected) {
        document.body.append(entry.region);
    }
    return entry.announcer;
}

/**
 * Has screen readers read `message` through a hidden live region at the end of `<body>`, shared by the whole page.
 * `assertive` interrupts what is being read; keep it for errors that need attention at once.
 */
export function announce(message: string, politeness: Politeness = 'polite') {
    getPageAnnouncer(politeness).announce(String(messageId++), () => message);
}
