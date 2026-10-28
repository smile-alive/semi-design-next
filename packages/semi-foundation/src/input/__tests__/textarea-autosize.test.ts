import { describe, expect, it, vi } from 'vite-plus/test';
import TextAreaFoundation, { type TextAreaAdapter, type TextAreaBaseProps } from '../textarea-foundation';

function mount(options: { supported: boolean; autosize: boolean }) {
    vi.stubGlobal('CSS', { supports: () => options.supported });
    const textarea = document.createElement('textarea');
    document.body.append(textarea);
    vi.spyOn(textarea, 'scrollHeight', 'get').mockReturnValue(50);
    const props: TextAreaBaseProps = { autosize: options.autosize };
    const foundation = new TextAreaFoundation({ getProps: () => props, getTextarea: () => textarea } as unknown as TextAreaAdapter);
    foundation.connect();
    foundation.init();
    return { foundation, textarea, props };
}

describe('TextAreaFoundation autosize without field-sizing', () => {
    it('挂载时按内容高度写内联 height', () => {
        const { textarea } = mount({ supported: false, autosize: true });
        expect(textarea.style.height).toBe('50px');
    });

    it('内容变化后重新计算', () => {
        const { foundation, textarea } = mount({ supported: false, autosize: true });
        vi.spyOn(textarea, 'scrollHeight', 'get').mockReturnValue(90);
        foundation.fitAutosize();
        expect(textarea.style.height).toBe('90px');
    });

    it('autosize 关闭后清除内联 height', () => {
        const { foundation, textarea, props } = mount({ supported: false, autosize: true });
        props.autosize = false;
        foundation.fitAutosize();
        expect(textarea.style.height).toBe('');
    });

    it('字体加载完成后重新计算', () => {
        // jsdom has no FontFaceSet
        const fonts = new EventTarget();
        Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
        try {
            const { textarea } = mount({ supported: false, autosize: true });
            vi.spyOn(textarea, 'scrollHeight', 'get').mockReturnValue(70);
            fonts.dispatchEvent(new Event('loadingdone'));
            expect(textarea.style.height).toBe('70px');
        } finally {
            Reflect.deleteProperty(document, 'fonts');
        }
    });

    it('未开启 autosize 时不写 height', () => {
        const { textarea } = mount({ supported: false, autosize: false });
        expect(textarea.style.height).toBe('');
    });
});

describe('TextAreaFoundation autosize with field-sizing', () => {
    it('支持时不写内联 height', () => {
        const { foundation, textarea } = mount({ supported: true, autosize: true });
        foundation.fitAutosize();
        expect(textarea.style.height).toBe('');
    });
});
