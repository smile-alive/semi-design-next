import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { DayStatusType, RangeInput } from '@fibrae/semi-foundation/components/date-picker/foundation';
import type { DateInputFoundationProps } from '@fibrae/semi-foundation/components/date-picker/input-foundation';
import type { DateInputProps, DatePickerProps, MonthsGridProps, TriggerRenderProps } from '..';

// The assertions are checked by typecheck; the runtime bodies only keep the file a valid test.
describe('DatePicker 回调类型与运行时入参一致', () => {
    it('onChange 的参数固定为 (date, dateString)，没有 onChangeWithDateFirst', () => {
        const props: DatePickerProps = {
            type: 'date',
            onChange: (date, dateString) => {
                expectTypeOf(date).toEqualTypeOf<Date>();
                expectTypeOf(dateString).toEqualTypeOf<string>();
            },
        };
        // @ts-expect-error onChangeWithDateFirst is removed; the order is always (date, dateString)
        const reordered: DatePickerProps = { onChangeWithDateFirst: false };
        expect([typeof props.onChange, reordered.type]).toEqual(['function', undefined]);
    });

    it('onChange 按 type 与 multiple 联合：单值拿 Date 与 string，范围与 multiple 拿数组', () => {
        const month: DatePickerProps = { type: 'month', multiple: false, onChange: (...args) => expectTypeOf(args).toEqualTypeOf<[Date, string]>() };
        const range: DatePickerProps = { type: 'dateTimeRange', onChange: (...args) => expectTypeOf(args).toEqualTypeOf<[Date[], string[]]>() };
        const multiple: DatePickerProps = { type: 'date', multiple: true, onChange: (...args) => expectTypeOf(args).toEqualTypeOf<[Date[], string[]]>() };
        const monthMultiple: DatePickerProps = { type: 'month', multiple: true, onChange: (...args) => expectTypeOf(args).toEqualTypeOf<[Date, string]>() };
        // @ts-expect-error a range type never gets a single Date
        const wrong: DatePickerProps = { type: 'dateRange', onChange: (date: Date) => date };
        expect([month, range, multiple, monthMultiple, wrong]).toHaveLength(5);
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
        expectTypeOf<Parameters<NonNullable<DatePickerProps['onFocus']>>>().toEqualTypeOf<[e: FocusEvent | MouseEvent | KeyboardEvent, rangeType?: RangeInput | false]>();
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

describe('DateInput 属性类型', () => {
    it('DateInputProps 与 foundation 属性没有索引签名，清除回调只有 onRangeClear 一个名字', () => {
        expectTypeOf<string extends keyof DateInputProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<string extends keyof DateInputFoundationProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<DateInputProps>().toHaveProperty('onRangeClear');
        expectTypeOf<DateInputFoundationProps>().toHaveProperty('onRangeClear');
        expectTypeOf<DateInputFoundationProps>().not.toHaveProperty('onRangeInputClear');
        expectTypeOf<DateInputProps>().not.toHaveProperty('onRangeBlur');
        expect(true).toBe(true);
    });

    it('onFocus 收到 FocusEvent 或 MouseEvent，rangeType 可选', () => {
        expectTypeOf<Parameters<NonNullable<DateInputProps['onFocus']>>[0]>().toEqualTypeOf<FocusEvent | MouseEvent>();
        expectTypeOf<Parameters<NonNullable<DateInputProps['onFocus']>>[1]>().toEqualTypeOf<'rangeStart' | 'rangeEnd' | undefined>();
        expect(true).toBe(true);
    });
});
