import type { MockInstance } from 'vite-plus/test';

/**
 * jsdom runs no CSS animations, so a popup leaving with motion waits for an animationend that never comes.
 * Call inside `waitFor` before asserting the popup is gone.
 */
export function endLeaveAnimations() {
    document.querySelectorAll('[class*="-animation-hide"]').forEach((el) => el.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true })));
}

type ListenerSpy = MockInstance<EventTarget['addEventListener']>;

/**
 * Counts the `type` listeners recorded by spies on addEventListener and removeEventListener that are still attached:
 * a listener goes away through removeEventListener or by aborting the signal it was added with.
 */
export function countLiveListeners(add: ListenerSpy, remove: ListenerSpy, type: string) {
    const removed = new Set(remove.mock.calls.filter(([name]) => name === type).map(([, listener]) => listener));
    return add.mock.calls.filter(([name, listener, options]) => name === type && !removed.has(listener) && !(typeof options === 'object' && options.signal?.aborted)).length;
}
