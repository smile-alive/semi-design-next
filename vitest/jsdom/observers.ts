export function setupObservers() {
    global.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
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
}
