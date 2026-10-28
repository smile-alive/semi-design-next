import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { EllipsisRuntime, canUseCSSEllipsis, getEllipsisOpt, getRenderText, isInsideWidgetItem, isOverflowing } from '../ellipsis';

const CHAR_WIDTH = 10;
const LINE_HEIGHT = 20;
const WIDTH = 100;
const TEXT = 'abcdefghijklmnopqrstuvwxyz';

// jsdom has no layout: text wraps at WIDTH with every character CHAR_WIDTH wide, so a row holds 10 characters
function mockLayout() {
    const computed = document.createElement('div').style;
    computed.lineHeight = `${LINE_HEIGHT}px`;
    computed.width = `${WIDTH}px`;
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computed);
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.offsetWidth;
    });
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return Math.ceil((this.textContent.length * CHAR_WIDTH) / this.offsetWidth) * LINE_HEIGHT;
    });
}

function textNode(text: string) {
    const node = document.createElement('span');
    node.textContent = text;
    return node;
}

const render = (content: string, { rows = 1, suffix = '', pos = 'end', expand = null as Node, copy = null as Node } = {}) => getRenderText(document.createElement('div'), rows, content, { expand, copy }, suffix, pos, false);

describe('getEllipsisOpt', () => {
    it('ellipsis 为 true 或 false 时取全部默认值', () => {
        const defaults = { rows: 1, expandable: false, pos: 'end', suffix: '', showTooltip: false, collapsible: false, expandText: undefined, collapseText: undefined };
        expect(getEllipsisOpt(true, '展开', '收起')).toEqual(defaults);
        expect(getEllipsisOpt(false, '展开', '收起')).toEqual(defaults);
    });

    it('显式 undefined 的字段取默认值', () => {
        const opt = getEllipsisOpt({ rows: undefined, pos: undefined, suffix: undefined, showTooltip: undefined, expandText: undefined }, '展开', '收起');
        expect(opt).toMatchObject({ rows: 1, pos: 'end', suffix: '', showTooltip: false, expandText: undefined });
    });

    it('可展开、可收起时文案默认取传入的文案，自带文案优先', () => {
        expect(getEllipsisOpt({ expandable: true, collapsible: true }, '展开', '收起')).toMatchObject({ expandText: '展开', collapseText: '收起' });
        expect(getEllipsisOpt({ expandable: true, expandText: 'EX' }, '展开', '收起')).toMatchObject({ expandText: 'EX', collapseText: undefined });
    });
});

describe('canUseCSSEllipsis', () => {
    const css = { expandable: false, expandText: undefined, pos: 'end', suffix: '' } as const;

    it('没有其他选项时可用 CSS 截断', () => {
        expect(canUseCSSEllipsis(css, false)).toBe(true);
    });

    it.each([{ expandable: true }, { expandText: 'EX' }, { pos: 'middle' }, { suffix: '!' }] as const)('%o 需要 JS 截断', (override) => {
        expect(canUseCSSEllipsis({ ...css, ...override }, false)).toBe(false);
    });

    it('可复制时需要 JS 截断', () => {
        expect(canUseCSSEllipsis(css, true)).toBe(false);
        expect(canUseCSSEllipsis(css, { content: 'x' })).toBe(false);
    });

    it('suffix 缺省时按空处理', () => {
        expect(canUseCSSEllipsis({ ...css, suffix: undefined }, false)).toBe(true);
    });
});

describe('isInsideWidgetItem', () => {
    const mount = (html: string) => {
        document.body.innerHTML = html;
        return document.body.firstElementChild as HTMLElement;
    };

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('纯文本不在 widget 内', () => {
        expect(isInsideWidgetItem(mount('<span>text</span>'), null)).toBe(false);
    });

    it('祖先是 widget item 时为 true', () => {
        const node = mount('<button><span id="t">text</span></button>').querySelector<HTMLElement>('#t');
        expect(isInsideWidgetItem(node, null)).toBe(true);
    });

    it('含可聚焦后代时为 true，复制按钮不算', () => {
        const node = mount('<span>text<button id="copy">c</button></span>');
        expect(isInsideWidgetItem(node, null)).toBe(true);
        expect(isInsideWidgetItem(node, node.querySelector('#copy'))).toBe(false);
    });
});

describe('getRenderText', () => {
    beforeEach(() => {
        mockLayout();
    });

    it('空内容返回空字符串', () => {
        expect(render('')).toBe('');
    });

    it('放得下时原样返回', () => {
        expect(render('abcdefghij')).toBe('abcdefghij');
    });

    it('pos 为 end 时保留开头并在末尾加省略号', () => {
        expect(render(TEXT)).toBe('abcdefg...');
    });

    it('pos 为 middle 时保留头尾', () => {
        expect(render(TEXT, { pos: 'middle' })).toBe('abc...xyz');
    });

    it('多行按高度截断', () => {
        expect(render(TEXT, { rows: 2 })).toBe('abcdefghijklmnopq...');
    });

    it('suffix 计入宽度但不出现在结果里', () => {
        expect(render(TEXT, { suffix: 'xx' })).toBe('abcde...');
    });

    it('截断时展开按钮与复制按钮计入宽度', () => {
        expect(render(TEXT, { expand: textNode('ab'), copy: textNode('c') })).toBe('abcd...');
    });

    it('展开按钮只在全文放不下时计入', () => {
        expect(render('abcdefghi', { expand: textNode('ab') })).toBe('abcdefghi');
    });

    it('测量容器对读屏隐藏、测完清空，并在 body 被清空后重建', () => {
        render(TEXT);
        const container = document.body.lastElementChild;
        expect(container).toHaveAttribute('aria-hidden', 'true');
        expect(container).toBeEmptyDOMElement();
        render(TEXT);
        expect(document.body.lastElementChild).toBe(container);

        document.body.innerHTML = '';
        expect(render(TEXT)).toBe('abcdefg...');
        expect(document.body.lastElementChild).not.toBe(container);
        expect(document.body.lastElementChild).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('isOverflowing', () => {
    it('rows 小于 1 时不算溢出', () => {
        const node = document.createElement('div');
        expect(isOverflowing(node, 0)).toBe(false);
        expect(isOverflowing(node, undefined)).toBe(false);
    });

    it('多行比较 scrollHeight 与 offsetHeight', () => {
        const node = document.createElement('div');
        node.style.height = '40px';
        const scrollHeight = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(40);
        expect(isOverflowing(node, 2)).toBe(false);
        scrollHeight.mockReturnValue(41);
        expect(isOverflowing(node, 2)).toBe(true);
    });

    it('单行比较内容宽度与扣除 padding、border 后的内容区宽度', () => {
        const node = document.createElement('div');
        node.style.width = '100px';
        node.append('text');
        const computed = document.createElement('div').style;
        computed.paddingLeft = '5px';
        computed.borderRightWidth = '5px';
        vi.spyOn(window, 'getComputedStyle').mockReturnValue(computed);
        const rangeWidth = vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 90));
        expect(isOverflowing(node, 1)).toBe(false);
        rangeWidth.mockReturnValue(new DOMRect(0, 0, 90.5));
        expect(isOverflowing(node, 1)).toBe(true);
    });
});

describe('EllipsisRuntime', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('schedule 在下一帧测量，同一帧内多次调度只测一次', () => {
        const runtime = new EllipsisRuntime();
        const measure = vi.fn<() => void>();
        runtime.connect(measure);
        runtime.schedule();
        runtime.schedule();
        expect(measure).not.toHaveBeenCalled();
        vi.advanceTimersToNextFrame();
        expect(measure).toHaveBeenCalledTimes(1);
    });

    it('首帧后的下一个 tick 之前忽略尺寸变化', () => {
        const runtime = new EllipsisRuntime();
        const measure = vi.fn<() => void>();
        runtime.connect(measure);
        runtime.handleResize();
        vi.advanceTimersToNextFrame();
        expect(measure).not.toHaveBeenCalled();

        // the fake clock gives a zero-delay timeout scheduled inside a frame callback a delay of 1ms
        vi.advanceTimersByTime(1);
        runtime.handleResize();
        vi.advanceTimersToNextFrame();
        expect(measure).toHaveBeenCalledTimes(1);
    });

    it('disconnect 取消待测量的帧并关闭尺寸监听', () => {
        const runtime = new EllipsisRuntime();
        const measure = vi.fn<() => void>();
        runtime.connect(measure);
        vi.advanceTimersToNextFrame();
        vi.advanceTimersByTime(1);
        runtime.schedule();
        runtime.disconnect();
        runtime.handleResize();
        vi.advanceTimersToNextFrame();
        expect(measure).not.toHaveBeenCalled();
    });
});
