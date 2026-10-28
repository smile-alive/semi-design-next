import { describe, expect, it } from 'vite-plus/test';
import ComboboxFoundation from '../combox-foundation';
import TimePickerFoundation from '../foundation';

const at = (h: number, m = 0, s = 0) => new Date(2024, 0, 1, h, m, s);
const hms = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds()];
const values = (column: { list: { value: string; disabled: boolean }[] }) => column.list.map((o) => o.value);
const disabled = (column: { list: { value: string; disabled: boolean }[] }) => column.list.filter((o) => o.disabled).map((o) => o.value);

describe('ComboboxFoundation', () => {
    it('getColumns 按 format 决定显示哪些列', () => {
        expect(ComboboxFoundation.getColumns('HH:mm:ss')).toEqual({
            showHour: true,
            showMinute: true,
            showSecond: true,
        });
        expect(ComboboxFoundation.getColumns('a h:mm')).toEqual({
            showHour: true,
            showMinute: true,
            showSecond: false,
        });
        expect(ComboboxFoundation.getColumns('mm:ss')).toEqual({ showHour: false, showMinute: true, showSecond: true });
    });

    it('applyItem 在 12 小时制下按当前半天换算小时，12 点落在半天的 0 点', () => {
        expect(hms(ComboboxFoundation.applyItem(at(9, 5), 'hour', '12', true, true))).toEqual([0, 5, 0]);
        expect(hms(ComboboxFoundation.applyItem(at(21, 5), 'hour', '12', true, false))).toEqual([12, 5, 0]);
        expect(hms(ComboboxFoundation.applyItem(at(21, 5), 'hour', '03', true, false))).toEqual([15, 5, 0]);
        expect(hms(ComboboxFoundation.applyItem(at(21, 5), 'hour', '03', false, false))).toEqual([3, 5, 0]);
    });

    it('applyItem 切换上下午只在跨到另一半天时移动 12 小时', () => {
        expect(hms(ComboboxFoundation.applyItem(at(11, 30), 'ampm', 'PM', true, true))).toEqual([23, 30, 0]);
        expect(hms(ComboboxFoundation.applyItem(at(12, 30), 'ampm', 'AM', true, false))).toEqual([0, 30, 0]);
        expect(hms(ComboboxFoundation.applyItem(at(13), 'ampm', 'PM', true, false))).toEqual([13, 0, 0]);
        expect(hms(ComboboxFoundation.applyItem(undefined, 'ampm', 'PM', true, true))).toEqual([12, 0, 0]);
    });

    it('applyItem 设置分钟与秒，无值时从 0 点开始', () => {
        expect(hms(ComboboxFoundation.applyItem(at(8, 1, 2), 'minute', '45', false, true))).toEqual([8, 45, 2]);
        expect(hms(ComboboxFoundation.applyItem(undefined, 'second', '07', false, true))).toEqual([0, 0, 7]);
    });

    it('getOptions 的 12 小时列按当前半天标记禁用并选中对应小时', () => {
        const { isAM, hour } = ComboboxFoundation.getOptions({
            timeStampValue: at(14),
            use12Hours: true,
            disabledHours: () => [0, 13],
        });
        expect(isAM).toBe(false);
        expect(values(hour)[0]).toBe('12');
        expect(disabled(hour)).toEqual(['01']);
        expect(values(hour)[hour.selectedIndex]).toBe('02');
    });

    it('getOptions 在 hourStep 与 hideDisabledOptions 组合下只列出未禁用的步进小时', () => {
        const { hour } = ComboboxFoundation.getOptions({
            timeStampValue: at(9),
            use12Hours: true,
            hourStep: 3,
            hideDisabledOptions: true,
            disabledHours: () => [0, 6, 15],
        });
        expect(values(hour)).toEqual(['03', '09']);
        expect(values(hour)[hour.selectedIndex]).toBe('09');
    });

    it('getOptions 无值时分钟与秒按 0 点询问禁用项', () => {
        const { minute, second } = ComboboxFoundation.getOptions({
            disabledMinutes: (h) => (h === 0 ? [5] : []),
            disabledSeconds: (h, m) => (h === 0 && m === 0 ? [7] : []),
        });
        expect(disabled(minute)).toEqual(['05']);
        expect(disabled(second)).toEqual(['07']);
    });

    it.each([
        ['hourStep', 1.5],
        ['hourStep', NaN],
        ['minuteStep', 1.5],
        ['secondStep', NaN],
        ['hourStep', 0],
        ['minuteStep', -1],
        ['secondStep', 0],
    ])('getOptions 在 %s 为 %s 时抛出带属性名的错误', (name, step) => {
        expect(() => ComboboxFoundation.getOptions({ [name]: step })).toThrow(name);
    });
});

describe('TimePickerFoundation.getDisabledTimeFns', () => {
    const top = { disabledHours: () => [1], disabledMinutes: () => [2], disabledSeconds: () => [3] };
    const rightHours = () => [20];
    const disabledTime = (_: Date[], panelType: string) => (panelType === 'right' ? { disabledHours: rightHours } : null);

    it('范围模式下 disabledTime 的结果优先，缺项回退到顶层属性', () => {
        const fns = TimePickerFoundation.getDisabledTimeFns({ ...top, disabledTime }, [], 'right', true);
        expect(fns).toEqual({ ...top, disabledHours: rightHours });
        expect(TimePickerFoundation.getDisabledTimeFns({ ...top, disabledTime }, [], 'left', true)).toEqual(top);
    });

    it('单选模式忽略 disabledTime', () => {
        expect(TimePickerFoundation.getDisabledTimeFns({ ...top, disabledTime }, [], 'right', false)).toEqual(top);
    });
});
