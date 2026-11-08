import { describe, expect, it, vi } from 'vite-plus/test';
import BreakpointObserver, { noScreens } from '../breakpoint-observer';
import type { BreakpointScreens, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '../responsive-types';

const map = { xs: '(max-width: 1px)', sm: '(max-width: 2px)', md: '(max-width: 3px)' };

type Handler = (event: { matches: boolean }) => void;

function stubMatchMedia(matching: string[]) {
    const handlers: Record<string, Handler[]> = {};
    vi.stubGlobal(
        'matchMedia',
        vi.fn<typeof window.matchMedia>((media) => {
            const list = {
                media,
                matches: matching.includes(media),
                addEventListener: (_: string, handler: Handler) => (handlers[media] ??= []).push(handler),
                removeEventListener: (_: string, handler: Handler) => {
                    handlers[media] = (handlers[media] ?? []).filter((item) => item !== handler);
                },
            };
            return list as unknown as MediaQueryList;
        })
    );
    return {
        live: () => Object.values(handlers).reduce((sum, list) => sum + list.length, 0),
        fire: (media: string, matches: boolean) => handlers[media]?.forEach((handler) => handler({ matches })),
    };
}

function create(responsiveObserve = true) {
    const render = vi.fn<(screens: BreakpointScreens) => void>();
    const observer = new BreakpointObserver({ responsiveObserve, responsiveMap: map as never }, render);
    return { observer, render };
}

describe('BreakpointObserver', () => {
    it('订阅时先用当前匹配结果回调，之后随媒体查询变化推送', () => {
        const media = stubMatchMedia([map.sm]);
        const { observer, render } = create();
        const callback = vi.fn<OnBreakpointScreensCallback>();
        observer.subscribe(callback);
        expect(callback).toHaveBeenLastCalledWith({ ...noScreens, sm: true });
        expect(render).toHaveBeenCalledWith({ ...noScreens, sm: true });

        media.fire(map.md, true);
        expect(callback).toHaveBeenLastCalledWith({ ...noScreens, sm: true, md: true });
    });

    it('按断点订阅时只收到指定断点的变化，并先收到当前值', () => {
        const media = stubMatchMedia([map.xs]);
        const { observer } = create();
        const callback = vi.fn<OnBreakpointChangeCallback>();
        observer.subscribe(['xs', 'md'], callback);
        expect(callback.mock.calls).toEqual([
            ['xs', true],
            ['md', false],
        ]);

        callback.mockClear();
        media.fire(map.sm, true);
        expect(callback).not.toHaveBeenCalled();
        media.fire(map.md, true);
        expect(callback).toHaveBeenCalledWith('md', true);
    });

    it('最后一个订阅者取消后注销媒体查询监听', () => {
        const media = stubMatchMedia([]);
        const { observer } = create();
        const off = observer.subscribe(vi.fn<OnBreakpointScreensCallback>());
        expect(media.live()).toBe(3);
        off();
        expect(media.live()).toBe(0);
    });

    it('responsiveObserve 为 false 时不监听，且只警告一次', () => {
        const media = stubMatchMedia([]);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { observer } = create(false);
        observer.subscribe(vi.fn<OnBreakpointScreensCallback>());
        observer.subscribe(['xs'], vi.fn<OnBreakpointChangeCallback>());
        expect(media.live()).toBe(0);
        expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('sync 加 commit 在开启 responsiveObserve 后注册，关闭后注销', () => {
        const media = stubMatchMedia([]);
        const { observer } = create(false);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        observer.subscribe(vi.fn<OnBreakpointScreensCallback>());

        observer.sync({ responsiveObserve: true, responsiveMap: map as never });
        observer.commit();
        expect(media.live()).toBe(3);

        observer.sync({ responsiveObserve: false, responsiveMap: map as never });
        observer.commit();
        expect(media.live()).toBe(0);
    });

    it('responsiveMap 变化时重新注册', () => {
        const media = stubMatchMedia([]);
        const { observer } = create();
        observer.subscribe(vi.fn<OnBreakpointScreensCallback>());
        observer.sync({ responsiveObserve: true, responsiveMap: { xs: '(max-width: 9px)' } as never });
        observer.commit();
        expect(media.live()).toBe(1);
    });

    it('开启 responsiveObserve 后注册得到的匹配结果通知已有订阅者', () => {
        stubMatchMedia([map.sm]);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { observer } = create(false);
        const screensCallback = vi.fn<OnBreakpointScreensCallback>();
        const changeCallback = vi.fn<OnBreakpointChangeCallback>();
        observer.subscribe(screensCallback);
        observer.subscribe(['sm', 'md'], changeCallback);
        screensCallback.mockClear();
        changeCallback.mockClear();

        observer.sync({ responsiveObserve: true, responsiveMap: map as never });
        observer.commit();
        expect(screensCallback.mock.calls).toEqual([[{ ...noScreens, sm: true }]]);
        expect(changeCallback.mock.calls).toEqual([['sm', true]]);
    });

    it('responsiveMap 变化使匹配结果不同时通知订阅者，结果相同时不通知', () => {
        stubMatchMedia([map.sm, '(max-width: 9px)']);
        const { observer } = create();
        const screensCallback = vi.fn<OnBreakpointScreensCallback>();
        const changeCallback = vi.fn<OnBreakpointChangeCallback>();
        observer.subscribe(screensCallback);
        observer.subscribe(['xs', 'sm'], changeCallback);
        screensCallback.mockClear();
        changeCallback.mockClear();

        observer.sync({ responsiveObserve: true, responsiveMap: { ...map, xs: '(max-width: 9px)' } as never });
        observer.commit();
        expect(screensCallback.mock.calls).toEqual([[{ ...noScreens, xs: true, sm: true }]]);
        expect(changeCallback.mock.calls).toEqual([['xs', true]]);

        screensCallback.mockClear();
        changeCallback.mockClear();
        observer.sync({ responsiveObserve: true, responsiveMap: { ...map, xs: '(max-width: 9px)', md: '(max-width: 8px)' } as never });
        observer.commit();
        expect(screensCallback).not.toHaveBeenCalled();
        expect(changeCallback).not.toHaveBeenCalled();
    });

    it('destroy 注销监听并清空订阅者', () => {
        const media = stubMatchMedia([]);
        const { observer } = create();
        const callback = vi.fn<OnBreakpointScreensCallback>();
        observer.subscribe(callback);
        observer.destroy();
        expect(media.live()).toBe(0);
        callback.mockClear();
        media.fire(map.sm, true);
        expect(callback).not.toHaveBeenCalled();
    });
});
