import { describe, expect, it, vi } from 'vite-plus/test';
import TagInputFoundation, { type TagInputAdapter } from '../foundation';

function mount(supported: boolean) {
    vi.stubGlobal('CSS', { supports: () => supported });
    const input = document.createElement('input');
    input.value = 'abcd';
    document.body.append(input);
    vi.spyOn(HTMLSpanElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 33 } as DOMRect);
    const foundation = new TagInputFoundation({ getInput: () => input } as unknown as TagInputAdapter);
    foundation.connect();
    foundation.init();
    return { foundation, input };
}

describe('TagInputFoundation input width without field-sizing', () => {
    it('挂载时按文字宽度写内联 width', () => {
        const { input } = mount(false);
        expect(input.style.width).toBe('33px');
    });

    it('文字变化后重新计算', () => {
        const { foundation, input } = mount(false);
        vi.spyOn(HTMLSpanElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 61 } as DOMRect);
        foundation.fitInputWidth();
        expect(input.style.width).toBe('61px');
    });

    it('支持 field-sizing 时不写内联 width', () => {
        const { foundation, input } = mount(true);
        foundation.fitInputWidth();
        expect(input.style.width).toBe('');
    });
});
