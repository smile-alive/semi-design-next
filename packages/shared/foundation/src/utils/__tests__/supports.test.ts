import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

// the probes cache their result, so every test imports a fresh module
async function load() {
    vi.resetModules();
    return import('../supports');
}

// jsdom has no scrollIntoView; the tests install their own
afterEach(() => {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

type Options = boolean | ScrollIntoViewOptions | FocusOptions | undefined;

/** Stands in for a browser that reads `key` from the options (supports it) or ignores the options (does not) */
function probe(key: string, supported: boolean) {
    return vi.fn<(options?: Options) => void>(function (options) {
        if (supported) {
            void (options as Record<string, unknown> | undefined)?.[key];
        }
    });
}

function rect(left: number, top: number, width: number, height: number) {
    return { left, top, right: left + width, bottom: top + height, width, height } as DOMRect;
}

describe('supportsScrollContainerOption', () => {
    it.each([true, false])('探测 scrollIntoView 是否读取 container（%s），并缓存结果', async (supported) => {
        const scrollIntoView = probe('container', supported);
        Element.prototype.scrollIntoView = scrollIntoView;
        const { supportsScrollContainerOption } = await load();
        expect(supportsScrollContainerOption()).toBe(supported);
        expect(supportsScrollContainerOption()).toBe(supported);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
});

describe('supportsFocusVisibleOption', () => {
    it.each([true, false])('探测 focus 是否读取 focusVisible（%s），并缓存结果', async (supported) => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(probe('focusVisible', supported));
        const { supportsFocusVisibleOption } = await load();
        expect(supportsFocusVisibleOption()).toBe(supported);
        expect(supportsFocusVisibleOption()).toBe(supported);
        expect(focus).toHaveBeenCalledTimes(1);
    });
});

describe('scrollIntoViewWithin', () => {
    let scroller: HTMLElement;
    let el: HTMLElement;
    let scrollTo: ReturnType<typeof vi.fn>;

    // scroller occupies x 100..300 and y 50..150; el is placed by each case
    const place = (elRect: DOMRect) => {
        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(elRect);
        vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(rect(100, 50, 200, 100));
    };

    beforeEach(() => {
        scroller = document.createElement('div');
        el = document.createElement('span');
        scroller.append(el);
        document.body.append(scroller);
        Object.defineProperties(scroller, {
            clientWidth: { value: 200 },
            clientHeight: { value: 100 },
            scrollLeft: { value: 40, writable: true },
            scrollTop: { value: 10, writable: true },
        });
        scrollTo = vi.fn<(options: ScrollToOptions) => void>();
        scroller.scrollTo = scrollTo as unknown as typeof scroller.scrollTo;
    });

    afterEach(() => scroller.remove());

    it('支持 container 时交给浏览器，不自己滚动', async () => {
        const scrollIntoView = probe('container', true);
        Element.prototype.scrollIntoView = scrollIntoView;
        const { scrollIntoViewWithin } = await load();
        scrollIntoViewWithin(el, scroller, { behavior: 'auto', block: 'center', inline: 'start' });
        expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'center', inline: 'start', container: 'nearest' });
        expect(scrollTo).not.toHaveBeenCalled();
    });

    describe('不支持 container 时只滚动 scroller', () => {
        const unsupported = async () => {
            const scrollIntoView = probe('container', false);
            Element.prototype.scrollIntoView = scrollIntoView;
            const mod = await load();
            return { ...mod, scrollIntoView };
        };

        it('nearest：已完全可见则不动', async () => {
            const { scrollIntoViewWithin, scrollIntoView } = await unsupported();
            place(rect(150, 70, 50, 20));
            scrollIntoViewWithin(el, scroller, { behavior: 'smooth' });
            expect(scrollTo).toHaveBeenCalledWith({ left: 40, top: 10, behavior: 'smooth' });
            expect(scrollIntoView).toHaveBeenCalledTimes(1);
        });

        it('nearest：在右侧溢出则滚到末端对齐，在左侧溢出则滚到起点对齐', async () => {
            const { scrollIntoViewWithin } = await unsupported();
            place(rect(280, 70, 50, 20));
            scrollIntoViewWithin(el, scroller);
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 + 30, top: 10, behavior: undefined });
            place(rect(80, 70, 50, 20));
            scrollIntoViewWithin(el, scroller);
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 - 20, top: 10, behavior: undefined });
        });

        it('start、end、center 按边缘与中心对齐，block 与 inline 分别计算', async () => {
            const { scrollIntoViewWithin } = await unsupported();
            place(rect(150, 100, 40, 20));
            scrollIntoViewWithin(el, scroller, { inline: 'start', block: 'end' });
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 + 50, top: 10 + (120 - 150), behavior: undefined });
            scrollIntoViewWithin(el, scroller, { inline: 'end', block: 'start' });
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 + (190 - 300), top: 10 + 50, behavior: undefined });
            scrollIntoViewWithin(el, scroller, { inline: 'center', block: 'center' });
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 + (170 - 200), top: 10 + (110 - 100), behavior: undefined });
        });

        it('scroller 完全在视口外时 smooth 改为 instant，部分可见时保留', async () => {
            const { scrollIntoViewWithin } = await unsupported();
            place(rect(280, 70, 50, 20));
            vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(rect(100, innerHeight + 10, 200, 100));
            scrollIntoViewWithin(el, scroller, { behavior: 'smooth' });
            expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'instant' }));
            vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(rect(100, innerHeight - 10, 200, 100));
            scrollIntoViewWithin(el, scroller, { behavior: 'smooth' });
            expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
        });

        it('RTL 下 inline 的 start 与 end 对调', async () => {
            const { scrollIntoViewWithin } = await unsupported();
            scroller.style.direction = 'rtl';
            place(rect(150, 70, 40, 20));
            scrollIntoViewWithin(el, scroller, { inline: 'start' });
            expect(scrollTo).toHaveBeenLastCalledWith({ left: 40 + (190 - 300), top: 10, behavior: undefined });
        });
    });
});

describe('focusWithoutRing', () => {
    let input: HTMLInputElement;

    beforeEach(() => {
        input = document.createElement('input');
        document.body.append(input);
    });

    afterEach(() => input.remove());

    it('支持 focusVisible 时原样传入 focusVisible: false', async () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(probe('focusVisible', true));
        const { focusWithoutRing } = await load();
        focusWithoutRing(input, { preventScroll: true });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true, focusVisible: false });
        expect(input.hasAttribute('data-semi-pointer-focus')).toBe(false);
    });

    it('不支持时聚焦期间带 data-semi-pointer-focus，失焦后移除', async () => {
        vi.spyOn(HTMLElement.prototype, 'focus').mockImplementationOnce(probe('focusVisible', false));
        const { focusWithoutRing } = await load();
        focusWithoutRing(input, { preventScroll: true });
        expect(document.activeElement).toBe(input);
        expect(input.hasAttribute('data-semi-pointer-focus')).toBe(true);
        input.blur();
        expect(input.hasAttribute('data-semi-pointer-focus')).toBe(false);
    });

    it('不支持时聚焦后按键即恢复焦点环', async () => {
        vi.spyOn(HTMLElement.prototype, 'focus').mockImplementationOnce(probe('focusVisible', false));
        const { focusWithoutRing } = await load();
        focusWithoutRing(input);
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(input.hasAttribute('data-semi-pointer-focus')).toBe(false);
        expect(document.activeElement).toBe(input);
    });

    it('不支持且元素没能获得焦点时不留下标记', async () => {
        vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(probe('focusVisible', false));
        const { focusWithoutRing } = await load();
        focusWithoutRing(input);
        expect(input.hasAttribute('data-semi-pointer-focus')).toBe(false);
    });
});
