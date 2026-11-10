import { describe, expect, it, vi } from 'vite-plus/test';
import TimeInputFoundation, { type TimeInputAdapter, type TimeInputBaseProps } from '../input-foundation';

function createFoundation(props: TimeInputBaseProps, input: HTMLInputElement | null) {
    const adapter = { getProp: (key: keyof TimeInputBaseProps) => props[key], getProps: () => props, getInputNode: () => input } as unknown as TimeInputAdapter;
    return new TimeInputFoundation(adapter);
}

describe('TimeInputFoundation initOnce', () => {
    it('focusOnOpen 时挂载后聚焦并选中输入框文本，preventScroll 原样传给 focus', () => {
        const input = document.createElement('input');
        input.value = '12:00:00';
        document.body.append(input);
        const focus = vi.spyOn(input, 'focus');
        const select = vi.spyOn(input, 'select');

        const foundation = createFoundation({ focusOnOpen: true, preventScroll: true }, input);
        foundation.connect();
        foundation.init();

        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(select).toHaveBeenCalledTimes(1);
        foundation.init();
        expect(focus).toHaveBeenCalledTimes(1);
        input.remove();
    });

    it('没有 focusOnOpen 或没有输入框时什么都不做', () => {
        const input = document.createElement('input');
        const focus = vi.spyOn(input, 'focus');

        const foundation = createFoundation({}, input);
        foundation.connect();
        foundation.init();
        expect(focus).not.toHaveBeenCalled();

        const empty = createFoundation({ focusOnOpen: true }, null);
        empty.connect();
        expect(() => empty.init()).not.toThrow();
    });
});
