import { beforeEach, vi } from 'vite-plus/test';

class ResizeObserver {
    observe() {
        // do nothing
    }
    unobserve() {
        // do nothing
    }
    disconnect() {
        // do nothing
    }
}

global.ResizeObserver = ResizeObserver;

// jsdom has no checkVisibility, which the focus trap queries; all elements count as visible
Element.prototype.checkVisibility = () => true;
Element.prototype.scrollIntoView = () => {};
Element.prototype.scrollTo = () => {};
Element.prototype.getAnimations = () => [];
// jsdom runs no animations: one started for a fallback path never ends, and tests end the motion with its DOM event
Element.prototype.animate = () => ({ finished: new Promise(() => {}), playState: 'running', cancel() {} }) as unknown as Animation;
// jsdom has no FontFaceSet; on the prototype so a test can shadow it on `document` and delete its own again
const fonts = new EventTarget() as FontFaceSet;
Object.defineProperty(Document.prototype, 'fonts', { configurable: true, get: () => fonts });
// jsdom has no TextTrack; each track element gets one object that only carries the mode
const textTracks = new WeakMap<HTMLTrackElement, TextTrack>();
Object.defineProperty(HTMLTrackElement.prototype, 'track', {
    configurable: true,
    get(this: HTMLTrackElement) {
        let track = textTracks.get(this);
        if (!track) {
            track = { mode: 'disabled' } as TextTrack;
            textTracks.set(this, track);
        }
        return track;
    },
});
// jsdom lays nothing out and returns no client rects; one zero box per element, as getBoundingClientRect does, lets a
// popup position against its trigger
Element.prototype.getClientRects = function getClientRects(this: Element) {
    return [this.getBoundingClientRect()] as unknown as DOMRectList;
};
// jsdom reports a 0 x 0 viewport through documentElement, which would clamp every popup to its top-left corner
Object.defineProperties(document.documentElement, {
    clientWidth: { configurable: true, get: () => window.innerWidth },
    clientHeight: { configurable: true, get: () => window.innerHeight },
});

// jsdom never matches `:popover-open`, so its UA rule hides every popover; an inline `display` beats it, which
// focus-trap/tabbable (`displayCheck: 'full-native'`) need. Production code must not set it.
// A real UA fires `beforetoggle` synchronously before the state changes; jsdom has no ToggleEvent.
if (!('showPopover' in HTMLElement.prototype)) {
    const openPopovers = new WeakSet<HTMLElement>();
    const beforeToggle = (el: HTMLElement, newState: 'open' | 'closed') => el.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState, oldState: newState === 'open' ? 'closed' : 'open' }));
    Object.assign(HTMLElement.prototype, {
        showPopover(this: HTMLElement) {
            if (openPopovers.has(this)) {
                return;
            }
            beforeToggle(this, 'open');
            openPopovers.add(this);
            this.style.setProperty('display', 'block');
        },
        hidePopover(this: HTMLElement) {
            if (!openPopovers.has(this)) {
                return;
            }
            beforeToggle(this, 'closed');
            openPopovers.delete(this);
            this.style.removeProperty('display');
        },
        togglePopover(this: HTMLElement, force?: boolean) {
            const next = force ?? !openPopovers.has(this);
            if (next) {
                this.showPopover();
            } else {
                this.hidePopover();
            }
            return next;
        },
    });
}

// jsdom has no pointer capture; tests fire a captured pointer's events on the capturing element.
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
Element.prototype.hasPointerCapture = () => false;

// Freeze Date only; re-applied per test because vi.useRealTimers() also drops this mock.
function freezeDate() {
    vi.setSystemTime(new Date('2019-08-08 12:00:00'));
}
freezeDate();
beforeEach(freezeDate);

// Seeded Math.random (mulberry32); assigned, not spied, so restoreMocks keeps it as the baseline.
let randomSeed = 20190808;
Math.random = () => {
    randomSeed = (randomSeed + 0x6d2b79f5) | 0;
    let t = Math.imul(randomSeed ^ (randomSeed >>> 15), 1 | randomSeed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

global.IntersectionObserver = class IntersectionObserver {
    root: Element | Document | null = null;
    rootMargin = '';
    scrollMargin = '';
    thresholds: readonly number[] = [];

    disconnect() {}

    observe() {}

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }

    unobserve() {}
};

global.matchMedia = (media) => {
    const min = /min-width:\s*(\d+)px/.exec(media);
    const max = /max-width:\s*(\d+)px/.exec(media);
    return {
        media,
        // user preferences are off unless a test mocks them
        matches: !media.includes('prefers-') && (!min || window.innerWidth >= Number(min[1])) && (!max || window.innerWidth <= Number(max[1])),
        onchange: null,
        dispatchEvent: () => false,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
    };
};

global.HTMLElement.prototype.getBoundingClientRect = function () {
    return new DOMRect(parseFloat(this.style.marginLeft) || 0, parseFloat(this.style.marginTop) || 0, parseFloat(this.style.width) || 0, parseFloat(this.style.height) || 0);
};

global.Range.prototype.getBoundingClientRect = () => new DOMRect();
global.Range.prototype.getClientRects = () => Object.assign([] as DOMRect[], { item: (): DOMRect | null => null });

Object.defineProperties(global.HTMLElement.prototype, {
    offsetWidth: {
        get() {
            return parseFloat(this.style.width) || 0;
        },
    },
    offsetHeight: {
        get() {
            return parseFloat(this.style.height) || 0;
        },
    },
    offsetTop: {
        get() {
            return parseFloat(this.style.marginTop) || 0;
        },
    },
    offsetLeft: {
        get() {
            return parseFloat(this.style.marginLeft) || 0;
        },
    },
});
