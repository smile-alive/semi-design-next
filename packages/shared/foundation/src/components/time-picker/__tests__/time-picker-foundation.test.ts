import { describe, expect, it, vi } from 'vite-plus/test';
import TimePickerFoundation, { type TimePickerAdapter, type TimePickerBaseProps } from '../foundation';

// Only the adapter members the closing paths call; keyboard focus is always reported as in the panel
function createFoundation(props: TimePickerBaseProps = {}) {
    const setState = vi.fn<(state: object) => void>();
    const adapter = {
        getProp: (key: string) => props[key as keyof TimePickerBaseProps],
        getProps: () => props,
        setState,
        notifyOpenChange: vi.fn<TimePickerAdapter['notifyOpenChange']>(),
        notifyBlur: vi.fn<TimePickerAdapter['notifyBlur']>(),
        isKeyboardFocusInPanel: () => true,
        setTriggerFocus: vi.fn<TimePickerAdapter['setTriggerFocus']>(),
    } as unknown as TimePickerAdapter;
    return { foundation: new TimePickerFoundation(adapter), adapter, setState };
}

describe('TimePickerFoundation close', () => {
    it('只关闭面板并上报 openChange(false)，不回焦、不 blur', () => {
        const { foundation, adapter, setState } = createFoundation();
        foundation.close();
        expect(setState).toHaveBeenCalledWith({ open: false }, undefined);
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
        expect(adapter.setTriggerFocus).not.toHaveBeenCalled();
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
    });

    it('受控 open 只上报 openChange(false)，由使用方决定是否关闭', () => {
        const { foundation, adapter, setState } = createFoundation({ open: true });
        foundation.close();
        expect(setState).not.toHaveBeenCalled();
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
    });
});
