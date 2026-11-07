import { describe, expect, it, vi } from 'vite-plus/test';
import SwitchFoundation, { type SwitchAdapter, type SwitchBaseProps } from '../foundation';

function createFoundation(props: SwitchBaseProps) {
    const setState = vi.fn<(state: object) => void>();
    const notifyChange = vi.fn<SwitchAdapter['notifyChange']>();
    const adapter = {
        getProp: (key: keyof SwitchBaseProps) => props[key],
        getProps: () => props,
        setState,
        notifyChange,
    } as unknown as SwitchAdapter;
    return { foundation: new SwitchFoundation(adapter), setState, notifyChange };
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
        const { foundation, setState, notifyChange } = createFoundation({});
        foundation.handleChange(true, 'event');
        expect(setState).toHaveBeenCalledWith({ checked: true }, undefined);
        expect(notifyChange).toHaveBeenCalledWith(true, 'event');
    });

    it('受控时只通知，不写入状态', () => {
        const { foundation, setState, notifyChange } = createFoundation({ checked: false });
        foundation.handleChange(true, 'event');
        expect(setState).not.toHaveBeenCalled();
        expect(notifyChange).toHaveBeenCalledWith(true, 'event');
    });

    it('loading 时忽略变化', () => {
        const { foundation, setState, notifyChange } = createFoundation({ loading: true });
        foundation.handleChange(true, 'event');
        expect(setState).not.toHaveBeenCalled();
        expect(notifyChange).not.toHaveBeenCalled();
    });
});
