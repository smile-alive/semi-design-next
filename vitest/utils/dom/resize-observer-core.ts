import { vi } from 'vite-plus/test';

interface RecordedObserver {
    callback: (entries: unknown[], observer: RecordedObserver) => void;
    targets: Element[];
}

/**
 * Entries pass through as given, so a test supplies only the members the component reads.
 *
 * `onObserve` reports synchronously from `observe()` like a browser's initial size; return undefined to stay silent.
 */
export function mockResizeObserverCore(options: { onObserve?: (target: Element) => unknown[] | undefined } = {}) {
    const observers: RecordedObserver[] = [];
    vi.stubGlobal(
        'ResizeObserver',
        class {
            callback: RecordedObserver['callback'];
            targets: Element[] = [];

            constructor(callback: ResizeObserverCallback) {
                this.callback = callback as unknown as RecordedObserver['callback'];
                observers.push(this);
            }

            observe(target: Element) {
                this.targets.push(target);
                const entries = options.onObserve?.(target);
                if (entries) {
                    this.callback(entries, this);
                }
            }

            unobserve(target: Element) {
                this.targets = this.targets.filter((item) => item !== target);
            }

            disconnect() {
                this.targets = [];
            }
        }
    );
    const live = () => observers.filter((observer) => observer.targets.length > 0);
    return {
        observers,
        /** Every element under observation across observers; a node observed twice shows up twice */
        observed: () => observers.flatMap((observer) => observer.targets),
        live,
        fire(target: Element, entries: unknown[]) {
            observers.filter((observer) => observer.targets.includes(target)).forEach((observer) => observer.callback(entries, observer));
        },
        fireLive(makeEntry: (target: Element) => unknown) {
            live().forEach((observer) => observer.callback([makeEntry(observer.targets[0])], observer));
        },
    };
}
