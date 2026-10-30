import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { recordCaretTail, restoreCaretTail } from '../caret';

function createInput(value: string, caret: number) {
    const input = document.createElement('input');
    input.value = value;
    input.setSelectionRange(caret, caret);
    return input;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('InputNumber 光标尾部记录与恢复', () => {
    it('记录光标之后的文本', () => {
        expect(recordCaretTail(createInput('1234', 2))).toBe('34');
    });

    it('选区非空时从选区末尾之后记录', () => {
        const input = createInput('1234', 1);
        input.setSelectionRange(1, 3);
        expect(recordCaretTail(input)).toBe('4');
    });

    it('没有 input 时返回 undefined', () => {
        expect(recordCaretTail(null)).toBeUndefined();
    });

    it('格式化后光标回到原尾部之前', () => {
        const input = createInput('1234', 2);
        const tail = recordCaretTail(input);
        input.value = '1,234';
        restoreCaretTail(input, tail);
        expect(input.selectionStart).toBe(3);
        expect(input.selectionEnd).toBe(3);
    });

    it('完整尾部不再匹配时退而匹配它的后缀', () => {
        const input = createInput('1234', 1);
        const tail = recordCaretTail(input);
        input.value = '99.4';
        restoreCaretTail(input, tail);
        expect(input.selectionStart).toBe(3);
    });

    it('尾部为空时不移动光标', () => {
        const input = createInput('12', 2);
        const tail = recordCaretTail(input);
        input.value = '1,2';
        input.setSelectionRange(0, 0);
        restoreCaretTail(input, tail);
        expect(input.selectionStart).toBe(0);
    });

    it('没有记录或值为空时不改动光标', () => {
        const input = createInput('12', 1);
        const spy = vi.spyOn(input, 'setSelectionRange');
        restoreCaretTail(input, undefined);
        input.value = '';
        restoreCaretTail(input, '2');
        restoreCaretTail(null, '2');
        expect(spy).not.toHaveBeenCalled();
    });

    it('设置选区抛错时吞掉异常', () => {
        const input = createInput('1234', 2);
        const tail = recordCaretTail(input);
        input.value = '1,234';
        vi.spyOn(input, 'setSelectionRange').mockImplementation(() => {
            throw new DOMException('no selection', 'InvalidStateError');
        });
        expect(() => restoreCaretTail(input, tail)).not.toThrow();
    });
});
