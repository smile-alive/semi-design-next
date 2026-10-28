import { describe, expect, it, vi } from 'vite-plus/test';
import SwitchFoundation, { type SwitchAdapter, type SwitchBaseProps } from '../foundation';

function createFoundation(props: SwitchBaseProps) {
    const setChecked = vi.fn<SwitchAdapter['setChecked']>();
    const notifyChange = vi.fn<SwitchAdapter['notifyChange']>();
    const adapter = {
        getProp: (key: keyof SwitchBaseProps) => props[key],
        getProps: () => props,
        setChecked,
        notifyChange,
    } as unknown as SwitchAdapter;
    return { foundation: new SwitchFoundation(adapter), setChecked, notifyChange };
}

describe('SwitchFoundation 初始状态', () => {
    it('checked 为 false 时优先于 defaultChecked', () => {
        expect(SwitchFoundation.getInitialState({ checked: false, defaultChecked: true }).checked).toBe(false);
    });

    it('没有 checked 时取 defaultChecked', () => {
        expect(SwitchFoundation.getInitialState({ defaultChecked: true }).checked).toBe(true);
    });
});

describe('SwitchFoundation.handleChange', () => {
    it('非受控时写入状态并通知', () => {
        const { foundation, setChecked, notifyChange } = createFoundation({});
        foundation.handleChange(true, 'event');
        expect(setChecked).toHaveBeenCalledWith(true);
        expect(notifyChange).toHaveBeenCalledWith(true, 'event');
    });

    it('受控时只通知，不写入状态', () => {
        const { foundation, setChecked, notifyChange } = createFoundation({ checked: false });
        foundation.handleChange(true, 'event');
        expect(setChecked).not.toHaveBeenCalled();
        expect(notifyChange).toHaveBeenCalledWith(true, 'event');
    });

    it('loading 时忽略变化', () => {
        const { foundation, setChecked, notifyChange } = createFoundation({ loading: true });
        foundation.handleChange(true, 'event');
        expect(setChecked).not.toHaveBeenCalled();
        expect(notifyChange).not.toHaveBeenCalled();
    });
});
