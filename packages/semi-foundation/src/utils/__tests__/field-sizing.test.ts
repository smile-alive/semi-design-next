import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { fitInputWidth, fitTextareaHeight, supportsFieldSizing } from '../field-sizing';

afterEach(() => {
    document.body.replaceChildren();
});

function mountTextarea(scrollHeight: number, css: string) {
    const textarea = document.createElement('textarea');
    textarea.style.cssText = css;
    document.body.append(textarea);
    // jsdom has no layout: the content height is whatever the test says it is
    vi.spyOn(textarea, 'scrollHeight', 'get').mockReturnValue(scrollHeight);
    return textarea;
}

describe('supportsFieldSizing', () => {
    it.each([true, false])('转发 CSS.supports 对 field-sizing 的结果 %s', (result) => {
        const supports = vi.fn<(property: string, value: string) => boolean>(() => result);
        vi.stubGlobal('CSS', { supports });
        expect(supportsFieldSizing()).toBe(result);
        expect(supports).toHaveBeenCalledWith('field-sizing', 'content');
    });
});

describe('fitTextareaHeight', () => {
    it('border-box 的高度是内容高度加上下边框', () => {
        const textarea = mountTextarea(60, 'box-sizing: border-box; border: 2px solid; padding: 8px');
        expect(fitTextareaHeight(textarea)).toBe(64);
        expect(textarea.style.height).toBe('64px');
    });

    it('content-box 的高度是内容高度减去上下内边距', () => {
        const textarea = mountTextarea(60, 'box-sizing: content-box; padding: 8px');
        expect(fitTextareaHeight(textarea)).toBe(44);
        expect(textarea.style.height).toBe('44px');
    });

    it('量完后保留滚动位置', () => {
        const textarea = mountTextarea(60, 'box-sizing: border-box');
        textarea.scrollTop = 12;
        fitTextareaHeight(textarea);
        expect(textarea.scrollTop).toBe(12);
    });
});

function mountInput(css: string, props: Partial<HTMLInputElement>) {
    const input = document.createElement('input');
    input.style.cssText = css;
    Object.assign(input, props);
    document.body.append(input);
    return input;
}

describe('fitInputWidth', () => {
    function stubTextWidth(width: number) {
        const measured: string[] = [];
        vi.spyOn(HTMLSpanElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLSpanElement) {
            measured.push(this.textContent);
            return { width } as DOMRect;
        });
        return measured;
    }

    it('宽度是文字宽度加内边距和边框', () => {
        stubTextWidth(40.2);
        const input = mountInput('box-sizing: border-box; padding: 0 6px; border: 1px solid', { value: 'abc' });
        expect(fitInputWidth(input)).toBe(41 + 12 + 2);
        expect(input.style.width).toBe('55px');
    });

    it('有值时量值，为空时量 placeholder', () => {
        const measured = stubTextWidth(10);
        fitInputWidth(mountInput('', { value: 'abc', placeholder: 'hint' }));
        fitInputWidth(mountInput('', { value: '', placeholder: 'hint' }));
        expect(measured).toEqual(['abc', 'hint']);
    });

    it('量完后不留下测量节点', () => {
        stubTextWidth(10);
        fitInputWidth(mountInput('', { value: 'abc' }));
        expect(document.body.querySelectorAll('span')).toHaveLength(0);
    });
});
