import type { Page } from 'playwright';

const QUIET_MS = 500;
const MAX_WAIT_MS = 5000;

/** Waits until nothing under `selector` mutated for 500 ms, at most 5 s, so demos that loop forever still end up compared */
export function settle(page: Page, selector: string) {
    // Runs in the browser: stays self-contained (no module variables) and limited to Chrome 120 / Firefox 125 / Safari 17.2 APIs.
    return page.evaluate(
        ([selector, quietMs, maxWaitMs]) =>
            new Promise<void>((resolve) => {
                const done = () => {
                    observer.disconnect();
                    resolve();
                };
                let timer = setTimeout(done, quietMs);
                const observer = new MutationObserver(() => {
                    clearTimeout(timer);
                    timer = setTimeout(done, quietMs);
                });
                for (const target of document.querySelectorAll(selector)) {
                    observer.observe(target, { subtree: true, childList: true, attributes: true, characterData: true });
                }
                setTimeout(done, maxWaitMs);
            }),
        [selector, QUIET_MS, MAX_WAIT_MS] as const
    );
}
