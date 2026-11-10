import { describe, expect, it, vi } from 'vite-plus/test';
import { cssClasses } from '../constants';
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
        blurFocusedElement: vi.fn<TimePickerAdapter['blurFocusedElement']>(),
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

describe('TimePickerFoundation focus and blur', () => {
    it('focus 与 blur 分别交给 adapter 的 setTriggerFocus 与 blurFocusedElement', () => {
        const { foundation, adapter } = createFoundation();
        foundation.focus();
        foundation.blur();
        expect(adapter.setTriggerFocus).toHaveBeenCalledTimes(1);
        expect(adapter.blurFocusedElement).toHaveBeenCalledTimes(1);
    });
});

describe('TimePickerFoundation.getPanelClassNames', () => {
    const prefixCls = 'semi-timepicker';

    it('三列齐全时不窄，宽度类按列数', () => {
        expect(TimePickerFoundation.getPanelClassNames({ prefixCls, format: 'HH:mm:ss' })).toEqual([`${prefixCls}-panel`, `${prefixCls}-panel-column-3`]);
    });

    it('缺列且非 12 小时制时加 narrow，范围选择器加 range 类', () => {
        const names = TimePickerFoundation.getPanelClassNames({ prefixCls, format: 'HH:mm', type: 'timeRange' });
        expect(names).toContain(`${prefixCls}-panel-narrow`);
        expect(names).toContain(`${prefixCls}-panel-column-2`);
        expect(names).toContain(cssClasses.RANGE_PICKER);
    });

    it('12 小时制把上下午列计入列数且不窄', () => {
        expect(TimePickerFoundation.getPanelClassNames({ prefixCls, use12Hours: true })).toEqual([`${prefixCls}-panel`, `${prefixCls}-panel-column-4`]);
        expect(TimePickerFoundation.getPanelClassNames({ prefixCls, use12Hours: true, format: 'a h:mm' })).toEqual([`${prefixCls}-panel`, `${prefixCls}-panel-column-3`]);
    });
});
