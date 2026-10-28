import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { DayStatusType, RangeInput } from '@fibrae/semi-foundation/date-picker/foundation';
import type { DatePickerProps, MonthsGridProps, TriggerRenderProps } from '../index';

describe('DatePicker 回调类型与运行时入参一致', () => {
    it('onChange 的参数固定为 (date, dateString)，没有 onChangeWithDateFirst', () => {
        const props: DatePickerProps = {
            onChange: (date, dateString) => {
                expectTypeOf(date).toEqualTypeOf<Date | Date[]>();
                expectTypeOf(dateString).toEqualTypeOf<string | string[]>();
            },
        };
        // @ts-expect-error onChangeWithDateFirst is removed; the order is always (date, dateString)
        const reordered: DatePickerProps = { onChangeWithDateFirst: false };
        expect([typeof props.onChange, reordered.type]).toEqual(['function', undefined]);
    });

    it('timePickerOpts 只接受 Combobox 的数据属性，不接受会覆盖面板内部值的 onChange、format、timeStampValue', () => {
        const ok: DatePickerProps['timePickerOpts'] = {
            use12Hours: true,
            hourStep: 2,
            minuteStep: 5,
            secondStep: 10,
            defaultIsAM: false,
            scrollItemProps: { motion: false },
        };
        // @ts-expect-error the panel wires onChange to update the selected date
        const withOnChange: DatePickerProps['timePickerOpts'] = { onChange: () => {} };
        // @ts-expect-error the panel passes the DatePicker format
        const withFormat: DatePickerProps['timePickerOpts'] = { format: 'HH' };
        // @ts-expect-error the panel passes the picked date
        const withValue: MonthsGridProps['timePickerOpts'] = { timeStampValue: 0 };
        expect([ok, withOnChange, withFormat, withValue]).toHaveLength(4);
    });

    it('onBlur 只在点击外部关闭时收到原生 MouseEvent，onClickOutSide 收到原生 MouseEvent', () => {
        expectTypeOf<Parameters<NonNullable<DatePickerProps['onBlur']>>>().toEqualTypeOf<[e?: MouseEvent]>();
        expectTypeOf<Parameters<NonNullable<DatePickerProps['onClickOutSide']>>>().toEqualTypeOf<[e: MouseEvent]>();
        expect(true).toBe(true);
    });

    it('onFocus 收到输入框的 focus 事件或触发器的点击、按键事件，rangeType 可选', () => {
        expectTypeOf<Parameters<NonNullable<DatePickerProps['onFocus']>>>().toEqualTypeOf<[e: React.FocusEvent | React.MouseEvent | React.KeyboardEvent, rangeType?: RangeInput | false]>();
        expect(true).toBe(true);
    });

    it('triggerRender 收到 TriggerRenderProps，未标注的参数可读 inputValue 与 rangeInputFocus', () => {
        expectTypeOf<Parameters<NonNullable<DatePickerProps['triggerRender']>>>().toEqualTypeOf<[props: TriggerRenderProps]>();
        const props: DatePickerProps = {
            triggerRender: ({ inputValue, rangeInputFocus }) => `${inputValue}${String(rangeInputFocus)}`,
        };
        expect(typeof props.triggerRender).toBe('function');
    });

    it('TriggerRenderProps.inputValue 在没有输入文本时为 null', () => {
        expectTypeOf<TriggerRenderProps['inputValue']>().toEqualTypeOf<string | null | undefined>();
        expect(true).toBe(true);
    });

    it('MonthsGrid 的渲染函数按 Month 的调用签名声明', () => {
        expectTypeOf<Parameters<NonNullable<MonthsGridProps['renderDate']>>>().toEqualTypeOf<[dayNumber?: number, fullDate?: string]>();
        expectTypeOf<Parameters<NonNullable<MonthsGridProps['renderFullDate']>>>().toEqualTypeOf<[dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType]>();
        expect(true).toBe(true);
    });

    it('MonthsGridProps 没有从不读取的 navPrev、navNext', () => {
        expectTypeOf<Extract<keyof MonthsGridProps, 'navPrev' | 'navNext'>>().toBeNever();
        expect(true).toBe(true);
    });

    it('yearAndMonthOpts 不接受会覆盖内部必填项的 list、onSelect、selectedIndex、type', () => {
        const ok: DatePickerProps['yearAndMonthOpts'] = { motion: false, cycled: true };
        // @ts-expect-error onSelect is wired by the panel and would break year and month selection
        const withOnSelect: DatePickerProps['yearAndMonthOpts'] = { onSelect: () => {} };
        // @ts-expect-error list is built by the panel
        const withList: MonthsGridProps['yearAndMonthOpts'] = { list: [] };
        expect([ok, withOnSelect, withList]).toHaveLength(3);
    });
});
