import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useIntersectionObserver from '../use-intersection-observer';

interface FakeObserver {
    callback: IntersectionObserverCallback;
    init: IntersectionObserverInit | undefined;
    targets: Element[];
    disconnected: boolean;
}

function stubIntersectionObserver() {
    const observers: FakeObserver[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            record: FakeObserver;
            constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
                this.record = { callback, init, targets: [], disconnected: false };
                observers.push(this.record);
            }
            observe(target: Element) {
                this.record.targets.push(target);
            }
            disconnect() {
                this.record.disconnected = true;
            }
        }
    );
    return observers;
}

describe('useIntersectionObserver', () => {
    it('观察全部目标并转发回调，没有目标时不创建观察器', () => {
        const observers = stubIntersectionObserver();
        const callback = vi.fn<IntersectionObserverCallback>();
        const [targets, setTargets] = createSignal<Element[]>([]);
        render(() => {
            useIntersectionObserver(targets, callback);
            return null;
        });
        expect(observers).toHaveLength(0);

        const a = document.createElement('div');
        const b = document.createElement('div');
        setTargets([a, b]);
        expect(observers).toHaveLength(1);
        expect(observers[0].targets).toEqual([a, b]);

        observers[0].callback([], {} as IntersectionObserver);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('目标数组或选项变化时重建观察器并断开旧的，卸载后断开', () => {
        const observers = stubIntersectionObserver();
        const el = document.createElement('div');
        const [targets, setTargets] = createSignal<Element[]>([el]);
        const [margin, setMargin] = createSignal('0px');
        const { unmount } = render(() => {
            useIntersectionObserver(
                targets,
                () => {},
                () => ({ rootMargin: margin() })
            );
            return null;
        });
        expect(observers[0].init).toEqual({ rootMargin: '0px' });

        setTargets([el]);
        expect(observers).toHaveLength(2);
        expect(observers[0].disconnected).toBe(true);

        setMargin('10px');
        expect(observers).toHaveLength(3);
        expect(observers[2].init).toEqual({ rootMargin: '10px' });

        unmount();
        expect(observers[2].disconnected).toBe(true);
    });
});
