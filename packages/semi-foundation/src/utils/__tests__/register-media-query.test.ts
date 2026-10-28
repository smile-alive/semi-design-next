import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { registerMediaQuery, type RegisterMediaQueryOption } from '../dom';

describe('registerMediaQuery', () => {
    const original = window.matchMedia;
    afterEach(() => {
        window.matchMedia = original;
    });

    // like a browser, where addEventListener is inherited from the prototype rather than an own property
    function installProtoMatchMedia(matches: boolean) {
        type Handler = (e: { matches: boolean }) => void;
        const proto = {
            handlers: [] as Handler[],
            addEventListener(_: string, handler: Handler) {
                this.handlers.push(handler);
            },
            removeEventListener(_: string, handler: Handler) {
                this.handlers = this.handlers.filter((h) => h !== handler);
            },
        };
        const list = Object.create(proto);
        Object.assign(list, { matches, addListener: vi.fn<() => void>(), removeListener: vi.fn<() => void>() });
        window.matchMedia = vi.fn<typeof window.matchMedia>(() => list);
        return list;
    }

    it('通过继承的 addEventListener 监听，而不是已弃用的 addListener', () => {
        const list = installProtoMatchMedia(false);
        const match = vi.fn<NonNullable<RegisterMediaQueryOption['match']>>();
        const unmatch = vi.fn<NonNullable<RegisterMediaQueryOption['unmatch']>>();
        const unregister = registerMediaQuery('(min-width: 1px)', { match, unmatch, callInInit: false });
        expect(list.addListener).not.toHaveBeenCalled();
        expect(list.handlers).toHaveLength(1);

        list.handlers[0]({ matches: true });
        expect(match).toHaveBeenCalledTimes(1);
        list.handlers[0]({ matches: false });
        expect(unmatch).toHaveBeenCalledTimes(1);

        unregister();
        expect(list.handlers).toHaveLength(0);
        expect(list.removeListener).not.toHaveBeenCalled();
    });
});
