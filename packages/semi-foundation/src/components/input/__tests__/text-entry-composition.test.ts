import { describe, expect, it, vi } from 'vite-plus/test';
import TextEntryFoundation, { type TextEntryAdapter, type TextEntryBaseProps, type TextEntryBaseState } from '../text-entry-foundation';

type Adapter = TextEntryAdapter<TextEntryBaseProps, TextEntryBaseState>;

function mount(props: TextEntryBaseProps = { value: '' }) {
    const notifyChange = vi.fn<Adapter['notifyChange']>();
    const adapter = { getProps: () => props, getProp: (key: keyof TextEntryBaseProps) => props[key], setState: vi.fn<Adapter['setState']>(), notifyChange, notifyCompositionEnd: vi.fn<Adapter['notifyCompositionEnd']>() } as unknown as Adapter;
    const foundation = new TextEntryFoundation(adapter);
    const input = document.createElement('input');
    const compositionEnd = (value: string) => {
        input.value = value;
        return foundation.handleCompositionEnd({ target: input });
    };
    return { foundation, notifyChange, compositionEnd };
}

describe('TextEntryFoundation.handleCompositionEnd 的返回值', () => {
    it('组合结束前最后一次输入事件已上报最终文本（Chrome 的顺序）时返回 true', () => {
        const { foundation, compositionEnd } = mount();
        foundation.handleChange('好', {});
        expect(compositionEnd('好')).toBe(true);
    });

    it('最终文本尚未上报（Firefox 的顺序，输入事件在组合结束之后）时返回 false', () => {
        const { foundation, compositionEnd } = mount();
        foundation.handleChange('hao', {});
        expect(compositionEnd('好')).toBe(false);
    });

    it('composition 模式在组合结束时自己上报，返回 true', () => {
        const { foundation, notifyChange, compositionEnd } = mount({ value: '', composition: true });
        foundation.handleChange('hao', {});
        expect(compositionEnd('好')).toBe(true);
        expect(notifyChange).toHaveBeenCalledWith('好', expect.anything());
    });

    it('getValueLength 截断后上报截断的文本，返回 true', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { foundation, notifyChange, compositionEnd } = mount({ value: '', maxLength: 2, getValueLength: (value) => value.length });
        foundation.handleChange('hao', {});
        expect(compositionEnd('haoo')).toBe(true);
        expect(notifyChange).toHaveBeenLastCalledWith('ha', expect.anything());
    });
});
