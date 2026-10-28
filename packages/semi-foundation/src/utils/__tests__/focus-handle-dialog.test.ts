import { afterEach, describe, expect, it } from 'vite-plus/test';
import FocusTrapHandle from '../focus-handle';

const mount = (html: string) => {
    document.body.innerHTML = html;
    return document.getElementById('dialog') as HTMLElement;
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('FocusTrapHandle.shouldRestoreFocus', () => {
    const html = '<button id="outside">o</button><div id="dialog" tabindex="-1"><button id="inside">i</button></div>';

    it('模态层无论焦点在哪里都归还', () => {
        const dialog = mount(html);
        document.getElementById('outside')?.focus();
        expect(FocusTrapHandle.shouldRestoreFocus(dialog, true)).toBe(true);
    });

    it('非模态层：焦点在页面其他位置时不归还', () => {
        const dialog = mount(html);
        document.getElementById('outside')?.focus();
        expect(FocusTrapHandle.shouldRestoreFocus(dialog, false)).toBe(false);
    });

    it('非模态层：焦点在层内时归还', () => {
        const dialog = mount(html);
        document.getElementById('inside')?.focus();
        expect(FocusTrapHandle.shouldRestoreFocus(dialog, false)).toBe(true);
    });

    it('非模态层：焦点已落在 body 时归还', () => {
        const dialog = mount(html);
        expect(document.activeElement).toBe(document.body);
        expect(FocusTrapHandle.shouldRestoreFocus(dialog, false)).toBe(true);
    });

    it('非模态层：没有容器且焦点在页面其他位置时不归还', () => {
        mount(html);
        document.getElementById('outside')?.focus();
        expect(FocusTrapHandle.shouldRestoreFocus(null, false)).toBe(false);
    });

    it('非模态层：焦点在 shadow root 内的层中时归还', () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<div id="dialog" tabindex="-1"><button id="inside">i</button></div>';
        const dialog = shadow.getElementById('dialog') as HTMLElement;
        shadow.getElementById('inside')?.focus();
        expect(FocusTrapHandle.shouldRestoreFocus(dialog, false)).toBe(true);
    });
});

describe('FocusTrapHandle.pickInitialFocus', () => {
    const html = `<div id="dialog" tabindex="-1">
        <button id="first">a</button>
        <input id="auto" autofocus />
        <div id="footer"><button id="ok" data-type="primary">ok</button></div>
    </div>`;
    const footer = () => document.getElementById('footer');
    const pick = (options: Parameters<typeof FocusTrapHandle.pickInitialFocus>[1]) => FocusTrapHandle.pickInitialFocus(document.getElementById('dialog') as HTMLElement, options)?.id;

    it('无任何偏好时取第一个可聚焦元素', () => {
        mount(html);
        expect(pick({})).toBe('first');
    });

    it('initialFocus 指向的页脚按钮优先于第一个可聚焦元素', () => {
        mount(html);
        expect(pick({ footer: footer(), initialFocus: 'primary' })).toBe('ok');
    });

    it('initialFocus 找不到对应按钮时退回第一个可聚焦元素', () => {
        mount(html);
        expect(pick({ footer: footer(), initialFocus: 'missing' })).toBe('first');
    });

    it('开启 autofocus 时 autofocus 元素优先于页脚按钮', () => {
        mount(html);
        expect(pick({ footer: footer(), initialFocus: 'primary', autofocus: true })).toBe('auto');
    });

    it('未开启 autofocus 时忽略 autofocus 元素', () => {
        mount(html);
        expect(pick({ autofocus: false })).toBe('first');
    });

    it('记住的元素仍在文档中时优先于其他候选', () => {
        mount(html);
        expect(pick({ remembered: document.getElementById('first'), footer: footer(), initialFocus: 'primary', autofocus: true })).toBe('first');
    });

    it('记住的元素已脱离文档时被忽略', () => {
        mount(html);
        const detached = document.createElement('button');
        detached.id = 'detached';
        expect(pick({ remembered: detached, footer: footer(), initialFocus: 'primary' })).toBe('ok');
    });
});

describe('FocusTrapHandle.findAutofocus', () => {
    it('找到带 autofocus 属性的可聚焦元素', () => {
        const dialog = mount('<div id="dialog"><button>a</button><button id="auto" autofocus>b</button></div>');
        expect(FocusTrapHandle.findAutofocus(dialog)?.id).toBe('auto');
    });

    it('没有 autofocus 元素时返回 undefined', () => {
        const dialog = mount('<div id="dialog"><button>a</button></div>');
        expect(FocusTrapHandle.findAutofocus(dialog)).toBeUndefined();
    });
});
