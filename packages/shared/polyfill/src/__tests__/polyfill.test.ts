import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const original = { any: AbortSignal.any, checkVisibility: Element.prototype.checkVisibility };

afterEach(() => {
    AbortSignal.any = original.any;
    Element.prototype.checkVisibility = original.checkVisibility;
});

describe('abort-signal-any', () => {
    beforeEach(async () => {
        delete (AbortSignal as Partial<typeof AbortSignal>).any;
        vi.resetModules();
        await import('../abort-signal-any');
    });

    it('缺失时安装', () => {
        expect(AbortSignal.any).not.toBe(original.any);
    });

    it('以最先中止的来源的 reason 中止', () => {
        const [a, b] = [new AbortController(), new AbortController()];
        const signal = AbortSignal.any([a.signal, b.signal]);
        expect(signal.aborted).toBe(false);
        b.abort('b');
        a.abort('a');
        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe('b');
    });

    it('有来源已中止时立即中止', () => {
        const a = new AbortController();
        a.abort('done');
        const signal = AbortSignal.any([new AbortController().signal, a.signal]);
        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe('done');
    });
});

describe('check-visibility', () => {
    const load = async () => {
        delete (Element.prototype as Partial<Element>).checkVisibility;
        vi.resetModules();
        await import('../check-visibility');
    };
    const mount = () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.append(child);
        document.body.append(parent);
        return { parent, child };
    };

    it('不替换原生实现', async () => {
        const native = vi.fn<() => boolean>(() => true);
        Element.prototype.checkVisibility = native;
        vi.resetModules();
        await import('../check-visibility');
        expect(Element.prototype.checkVisibility).toBe(native);
    });

    it('脱离文档或没有盒子的元素返回 false', async () => {
        await load();
        expect(document.createElement('div').checkVisibility()).toBe(false);
        const { child } = mount();
        expect(child.checkVisibility()).toBe(true);
        vi.spyOn(child, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        expect(child.checkVisibility()).toBe(false);
    });

    it('仅在传入 checkVisibilityCSS 或 visibilityProperty 时读取 visibility', async () => {
        await load();
        const { parent, child } = mount();
        parent.style.visibility = 'hidden';
        expect(child.checkVisibility()).toBe(true);
        expect(child.checkVisibility({ checkVisibilityCSS: true })).toBe(false);
        expect(child.checkVisibility({ visibilityProperty: true } as CheckVisibilityOptions)).toBe(false);
    });

    it('仅在传入 checkOpacity 或 opacityProperty 时读取元素及其祖先的 opacity', async () => {
        await load();
        const { parent, child } = mount();
        parent.style.opacity = '0';
        expect(child.checkVisibility()).toBe(true);
        expect(child.checkVisibility({ checkOpacity: true })).toBe(false);
        expect(child.checkVisibility({ opacityProperty: true } as CheckVisibilityOptions)).toBe(false);
    });

    it('位于 content-visibility: hidden 的祖先之下时返回 false', async () => {
        await load();
        const { parent, child } = mount();
        // jsdom's getComputedStyle does not know content-visibility
        const real = window.getComputedStyle.bind(window);
        vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) => (element === parent ? ({ getPropertyValue: () => 'hidden', opacity: '1', visibility: 'visible' } as unknown as CSSStyleDeclaration) : real(element)));
        expect(child.checkVisibility()).toBe(false);
        expect(parent.checkVisibility()).toBe(true);
    });
});
