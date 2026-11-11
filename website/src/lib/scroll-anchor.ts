// On a reload the router restores the old pixel offset, but the client:only demos keep committing for seconds
// afterwards and resize the content, so no pixel offset holds. Pin the heading or demo at the top of the view to its old
// position instead, again on every resize until the reader takes over; scroll anchoring alone fails when the pinned demo
// itself is still growing. Storage throws when disabled
const key = 'site-scroll-anchor';

export function setupScrollAnchor() {
    addEventListener('pagehide', () => {
        const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        const anchor = [...document.querySelectorAll('.doc :is(h2, h3, .demo)[id]')].findLast((el) => el.getBoundingClientRect().top <= line);
        try {
            sessionStorage.setItem(key, JSON.stringify(anchor && { href: location.href, id: anchor.id, top: anchor.getBoundingClientRect().top }));
        } catch {}
    });
    let saved: { href: string; id: string; top: number } | undefined;
    try {
        saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? undefined;
        sessionStorage.removeItem(key);
    } catch {}
    const { type } = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const anchor = saved?.href === location.href && type !== 'navigate' ? document.getElementById(saved.id) : null;
    const doc = document.querySelector('.doc');
    if (anchor && saved && doc) {
        const pin = () => scrollBy({ top: anchor.getBoundingClientRect().top - saved.top, behavior: 'instant' });
        const observer = new ResizeObserver(pin);
        observer.observe(doc);
        const release = () => observer.disconnect();
        for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(type, release, { once: true, passive: true });
    }
}
