import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker, { type DatePickerProps } from '..';
import semiGlobal from '../../_utils/semi-global';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${dp}`;

function renderDatePicker(initial: DatePickerProps = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <DatePicker {...props()} />);
    return { ...result, rerender: (next: DatePickerProps) => setProps(next) };
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector) as HTMLElement;
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const typeIn = (input: Element, value: string) => fireEvent.input(input, { target: { value } });
const panelButton = (side: string, label: 'prevYear' | 'nextYear' | 'prevMonth' | 'nextMonth' | 'switchToTime') => getPanel(side).querySelector(`[aria-label="${zh_CN.DatePicker[label]}"]`) as HTMLElement;
const timeLists = (root: ParentNode = getPopup()) => root.querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 内嵌输入框', () => {
    it('inputFoundation getInsetInputPlaceholder 处理 date', () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        const insetInputs = getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM-dd');
    });

    it('inputFoundation concatInsetInputValue 处理 dateTime 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, onChange });
        typeIn(within(getPopup()).getByPlaceholderText('HH:mm:ss'), '10:30:00');
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 10, 30), '2019-09-08 10:30:00');
    });

    it('inputFoundation getInsetInputValue 传入对象形式的 insetInputValue', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, onChange });
        const insetInput = within(getPopup()).getByPlaceholderText('yyyy-MM-dd');
        typeIn(insetInput, '2019-09-1');
        expect(insetInput).toHaveValue('2019-09-1');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('inputFoundation getInsetInputValue 不传对象形式的 insetInputValue', async () => {
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        typeIn(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), '2019-09-1');
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        expect(within(getPopup()).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
    });

    it('inputFoundation handleInsetInputChange 处理 dateTime', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultOpen: true, defaultPickerValue: new Date(2021, 5, 1, 9, 30, 0), insetInput: true, motion: false, onChange });
        const timeInput = within(getPopup()).getByPlaceholderText('HH:mm:ss');
        expect(timeInput).toBeDisabled();
        typeIn(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), '2021-06-15');
        expect(timeInput).toHaveValue('09:30:00');
        expect(timeInput).toBeEnabled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 9, 30), '2021-06-15 09:30:00');
    });

    it('inputFoundation _autoFillTimeToInsetInputValue 的 monthRight 分支', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultOpen: true, defaultPickerValue: [new Date(2021, 5, 1, 10, 0, 0), new Date(2021, 6, 1, 18, 0, 0)], insetInput: true, motion: false, onChange });
        const [startDate, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        typeIn(startDate, '2021-06-01');
        typeIn(endDate, '2021-06-20');
        const timeInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('inputFoundation concatInsetInputValue 处理 dateRange 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, insetInput: true, motion: false, onChange });
        const [startDate, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        typeIn(startDate, '2021-06-01');
        expect(onChange).not.toHaveBeenCalled();
        typeIn(endDate, '2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('inputFoundation concatInsetInputValue 处理 dateTimeRange 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, insetInput: true, motion: false, onChange });
        const [, endTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        typeIn(endTime, '20:00:00');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);
    });

    it('inputFoundation getInsetInputPlaceholder 处理 monthRange', () => {
        renderDatePicker({ type: 'monthRange', defaultOpen: true, insetInput: true, motion: false });
        const insetInputs = getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM ~ yyyy-MM');
    });

    it('inputFoundation formatShowText 处理 dateRange', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], format: 'yyyy/MM/dd', motion: false });
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021/06/01');
        expect(endInput).toHaveValue('2021/06/15');
    });

    it('inputFoundation formatShowText 处理 monthRange', () => {
        const { container } = renderDatePicker({ type: 'monthRange', defaultValue: [new Date(2021, 2), new Date(2021, 8)], motion: false });
        expect(inputs(container)).toHaveLength(1);
        expect(container.querySelector('input')).toHaveValue('2021-03 ~ 2021-09');
    });

    it('dateInput renderRangeSuffix 与分隔符', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, rangeSeparator: ' - ' });
        const separator = container.querySelector(`.${dp}-range-input-separator`);
        expect(separator).toHaveTextContent('-');
        expect(separator).toHaveClass(`${dp}-range-input-separator-active`);
        expect(container.querySelector(`.${dp}-range-input-suffix svg`)).not.toBeNull();
    });

    it('dateInput 的 inputReadOnly', () => {
        const { container } = renderDatePicker({ defaultValue: baseDate, inputReadOnly: true, motion: false });
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        expect(container.querySelector(`.${dp}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, inputReadOnly: true, motion: false, showClear: true, onChange });
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        await userEvent.hover(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement);
        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('范围选择的 inputReadOnly 锁定两个输入框', () => {
        const { container } = renderDatePicker({ type: 'dateRange', inputReadOnly: true, motion: false });
        expect(inputs(container)).toHaveLength(2);
        for (const input of inputs(container)) {
            expect(input).toHaveAttribute('readonly');
        }
    });

    it('dateInput 的 prefix', () => {
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, prefix: <span class="test-prefix">Prefix</span> });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix .test-prefix`)).toHaveTextContent('Prefix');
    });
});

describe('DatePicker 月份网格', () => {
    it('monthsGrid foundation showTimePicker 与 showDatePanel', async () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false });
        const switchDate = screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const switchTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        await userEvent.click(switchTime);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(switchTime).toHaveClass(`${dp}-switch-date-active`);
        expect(switchDate).not.toHaveClass(`${dp}-switch-date-active`);
        await userEvent.click(switchDate);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(switchDate).toHaveClass(`${dp}-switch-date-active`);
    });

    it('monthsGrid foundation showTimePicker 与 disabledTimePicker', async () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, disabledTimePicker: true, motion: false });
        const switchTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(switchTime).toHaveClass(`${dp}-switch-time-disabled`);
        await userEvent.click(switchTime);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPopup().querySelector(`.${dp}-tpk`)).toBeNull();
    });

    it('monthsGrid foundation handleDayClick 处理 dateTimeRange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, motion: false, onChange });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        expect(inputs(container)[0]).toHaveValue('2021-06-10 10:00:00');
    });

    it('monthsGrid foundation handleTimeChange 处理 dateTime', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = timeLists();
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 选择小时时 onChange 只触发一次，带有值时的毫秒', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = timeLists();
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 无值时选择小时 onChange 只触发一次，且不带旧时间', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = timeLists();
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(14);
    });

    it('monthsGrid foundation handleTimeChange 处理 dateTimeRange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, motion: false, onChange });
        await userEvent.click(panelButton('right', 'switchToTime'));
        const [rightHours] = timeLists(getPanel('right'));
        await userEvent.click(within(rightHours).getAllByRole('option', { name: '20' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);

        await userEvent.click(panelButton('left', 'switchToTime'));
        const [leftHours] = timeLists(getPanel('left'));
        await userEvent.click(within(leftHours).getAllByRole('option', { name: '08' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 8), new Date(2021, 5, 15, 20)], ['2021-06-01 08:00:00', '2021-06-15 20:00:00']);
    });

    it('monthsGrid foundation handleDayHover', async () => {
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        await userEvent.click(getDay('2021-06-08'));
        const hoverCls = `${dp}-day-hoverday-around-singleselected`;
        await userEvent.hover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).toHaveClass(hoverCls);
        await userEvent.unhover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).not.toHaveClass(hoverCls);
    });

    it('monthsGrid foundation handleDayHover 带 offset', async () => {
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', endDateOffset: (d) => addDays(d as Date, 2), motion: false, startDateOffset: (d) => addDays(d as Date, -2) });
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-hoverday`);
        expect(getDay('2021-06-08')).toHaveClass(`${dp}-day-offsetrange-start`);
        expect(getDay('2021-06-12')).toHaveClass(`${dp}-day-offsetrange-end`);
        expect(getDay('2021-06-09')).toHaveClass(`${dp}-day-inoffsetrange`);
        expect(getDay('2021-06-13')).not.toHaveClass(`${dp}-day-inoffsetrange`);
    });

    it('monthsGrid foundation handleSwitchMonthOrYear 带 syncSwitchMonth', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false, syncSwitchMonth: true, onPanelChange });
        await userEvent.click(panelButton('left', 'nextMonth'));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-07-01', '2021-08-15']);
    });

    it('范围选择器切换右面板时 onPanelChange 报告两侧实际面板日期', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false, onPanelChange });
        await userEvent.click(panelButton('right', 'nextMonth'));
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-06-01', '2021-08-15']);
    });

    it('defaultPickerValue 按 format 解析且数组形式的变化会移动面板', () => {
        const { rerender } = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '01/02/2021', format: 'dd/MM/yyyy', motion: false });
        expect(getNavTitle('left')).toBe('2021年 2月');
        expect(getNavTitle('right')).toBe('2021年 3月');
        rerender({ type: 'dateRange', defaultOpen: true, defaultPickerValue: [new Date(2022, 4, 1), new Date(2022, 7, 1)], format: 'dd/MM/yyyy', motion: false });
        expect(getNavTitle('left')).toBe('2022年 5月');
        expect(getNavTitle('right')).toBe('2022年 8月');
        rerender({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '10.03.2021', format: 'dd.MM.yyyy', motion: false });
        expect(getNavTitle('left')).toBe('2021年 3月');
    });

    it('面板挂载时 topSlot 就改了 defaultPickerValue，面板移到新月份', () => {
        const [pickerValue, setPickerValue] = createSignal('2021-02-01');
        // the slot mounts before the months grid, so its onMount runs before the grid's own effects
        function Slot() {
            onMount(() => setPickerValue('2022-05-01'));
            return <span>slot</span>;
        }
        render(() => <DatePicker type="date" defaultOpen defaultPickerValue={pickerValue()} motion={false} topSlot={<Slot />} />);
        expect(getNavTitle('left')).toBe('2022年 5月');
    });

    it('monthsGrid foundation prevYear 与 nextYear', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false });
        await userEvent.click(panelButton('left', 'prevYear'));
        expect(getNavTitle('left')).toBe('2020年 6月');
        await userEvent.click(panelButton('right', 'nextYear'));
        expect(getNavTitle('right')).toBe('2022年 7月');
    });

    it('monthsGrid foundation handleRangeSelected 带 offset', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', endDateOffset: (d) => addDays(d as Date, 2), motion: false, startDateOffset: (d) => addDays(d as Date, -2), onChange });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 8), new Date(2021, 5, 12)], ['2021-06-08', '2021-06-12']);
    });

    it('monthsGrid foundation toMonth 与 toYear', async () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(monthList).getByRole('option', { name: '4月' }));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2023年 4月');
    });

    it('monthsGrid foundation _autoAdjustMonth', () => {
        const { unmount } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], defaultOpen: true, motion: false });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
        unmount();

        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 8, 1), new Date(2021, 5, 15)], defaultOpen: true, motion: false });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-09-01')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('monthsGrid foundation getValidTimeFormat', () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, format: 'yyyy-MM-dd HH:mm', motion: false });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).not.toHaveTextContent('08:08:08');
    });

    it('monthsGrid foundation updateDateAfterChangeYM', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, autoSwitchDate: true, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(ymd(onChange.mock.calls[0][0] as Date)).toBe('2019-10-08');
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08');
        expect(container.querySelector('input')).toHaveValue('2019-10-08');
        expect(getPopup()).not.toBeNull();
    });

    it('Month 日期渲染与选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        expect(getPopup().querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(30);
        expect(getDay('2019-09-08')).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 11), '2019-09-11');
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
    });

    it('dateRange 同时选择起止日期后触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false, onChange });
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getDay('2021-06-30'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 30)], ['2021-06-01', '2021-06-30']);
    });

    it('dateTimeRange 选择日期后走范围选择流程', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false, needConfirm: true, onConfirm });
        await userEvent.click(getDay('2021-06-01'));
        await userEvent.click(getDay('2021-06-30'));
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-30')).toHaveClass(`${dp}-day-selected-end`);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`)[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect((onConfirm.mock.calls[0][1] as string[]).map((v) => v.slice(0, 10))).toEqual(['2021-06-01', '2021-06-30']);
        const [startInput, endInput] = inputs(container);
        expect(startInput.value.startsWith('2021-06-01')).toBe(true);
        expect(endInput.value.startsWith('2021-06-30')).toBe(true);
    });

    it('monthsGrid foundation _isNeedSwap', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 15), new Date(2021, 5, 1)], defaultOpen: true, motion: false });
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-inrange`);
    });

    it('monthsGrid foundation toYearMonth', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 2), new Date(2021, 8)], defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        expect(getNavTitle('left')).toBe('2023年 3月');
        await userEvent.click(within(monthList).getByRole('option', { name: '6月' }));
        expect(getNavTitle('left')).toBe('2023年 6月');
    });

    it('monthsGrid getYAMOpenType 右侧打开', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false });
        const monthGrid = getPopup().querySelector(`.${dp}-month-grid`);
        await userEvent.click(getPanel('right').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'right');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'both');
    });

    it('dateRange 的 rangeEnd 早于 rangeStart 时重置起始值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 10), new Date(2021, 5, 20)], motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        await userEvent.click(endInput);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-05');
        expect(getDay('2021-06-05')).toHaveClass(`${dp}-day-selected-end`);
        expect(onChange).not.toHaveBeenCalled();
        await waitFor(() => expect(startInput).toHaveFocus());
    });

    it('foundation handleInputChange 带 insetInput 的 dateTime', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, onChange });
        typeIn(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), '2021-06-1');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('Month 的 renderDay 使用 renderDate 属性', () => {
        renderDatePicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            renderDate: (dayNumber, fullDate) => (
                <span class="custom-day" title={fullDate}>
                    {dayNumber}
                </span>
            ),
        });
        const customDay = getDay('2019-09-08').querySelector('.custom-day');
        expect(customDay).toHaveAttribute('title', '2019-09-08');
        expect(customDay).toHaveTextContent('8');
        expect(getDay('2019-09-08')).toHaveClass(`${dp}-day-selected`);
    });

    it('Month 高亮今天', () => {
        renderDatePicker({ type: 'date', defaultOpen: true, motion: false });
        const today = getPopup().querySelectorAll(`.${dp}-day-today`);
        expect(today).toHaveLength(1);
        expect(today[0]).toHaveAttribute('aria-label', ymd(new Date()));
    });

    it('范围输入框失焦不提交输入', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], defaultOpen: true, motion: false, onChange });
        const [startInput] = inputs(container);
        typeIn(startInput, '2021-06-0');
        fireEvent.focusOut(startInput);
        expect(startInput).toHaveValue('2021-06-0');
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('输入框失焦不提交输入，也不触发 onBlur', () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { container } = renderDatePicker({ type: 'date', defaultOpen: true, motion: false, onBlur });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-1');
        fireEvent.focusOut(input);
        expect(onBlur).not.toHaveBeenCalled();
        expect(input).toHaveValue('2021-06-1');
        expect(getPopup()).not.toBeNull();
    });

    it('monthsGrid foundation handleSyncChangeMonths 右侧面板与左侧同月', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(monthList).getByRole('option', { name: '7月' }));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('monthsGrid updateDateAfterChangeYM 处理 dateTime 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, autoSwitchDate: true, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08 08:08:08');
    });

    it('monthsGrid updateDateAfterChangeYM 带 disabledDate', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, autoSwitchDate: true, defaultOpen: true, disabledDate: () => true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });
});

describe('DatePicker 范围输入框', () => {
    it('dateRange 带 prefix 时渲染范围前缀', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, prefix: <span class="dp-prefix">P</span> });
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-prefix`)).toHaveTextContent('P');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('dateRange 带 insetLabel 时渲染范围前缀', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], insetLabel: <span class="dp-inset-label">Label</span>, motion: false });
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-inset-label`)).toHaveTextContent('Label');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('dateRange renderRangeClearBtn 带 showClearIgnoreDisabled', () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], disabled: true, insetInput: true, motion: false, showClear: true, onClear });
        for (const input of inputs(container)) {
            expect(input).toBeDisabled();
        }
        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('dateInput formatText 空值返回空字符串', () => {
        const { container } = renderDatePicker({ type: 'date', motion: false });
        expect(container.querySelector('input')).toHaveValue('');
        const { container: rangeContainer } = renderDatePicker({ type: 'dateRange', value: null, motion: false });
        for (const input of inputs(rangeContainer)) {
            expect(input).toHaveValue('');
        }
    });

    it('dateInput isRenderMultipleInputs 返回正确结果', () => {
        expect(inputs(renderDatePicker({ type: 'dateRange', motion: false }).container)).toHaveLength(2);
        expect(inputs(renderDatePicker({ type: 'monthRange', motion: false }).container)).toHaveLength(1);
        expect(inputs(renderDatePicker({ type: 'date', motion: false }).container)).toHaveLength(1);
    });

    it('dateInput 通过 formatText 自定义文本格式', () => {
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, format: 'yyyy年MM月dd日', motion: false });
        expect(container.querySelector('input')).toHaveValue('2019年09月08日');
    });

    it('dateInput renderRangeSeparator 同时有起止值', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false });
        expect(container.querySelector(`.${dp}-range-input-separator`)).toHaveClass(`${dp}-range-input-separator-active`);
        const { container: empty } = renderDatePicker({ type: 'dateRange', motion: false });
        expect(empty.querySelector(`.${dp}-range-input-separator`)).not.toHaveClass(`${dp}-range-input-separator-active`);
    });

    it('dateRange 的 size 为 large 时使用范围默认尺寸', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, size: 'large' });
        expect(container.querySelector(`.${dp}-range-input`)).toHaveClass(`${dp}-range-input-large`);
        for (const wrapper of container.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper`)) {
            expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-default`);
        }
    });

    it('dateRange 禁用时点击分隔符不触发聚焦', () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], disabled: true, motion: false, onFocus });
        fireEvent.click(container.querySelector(`.${dp}-range-input-separator`) as HTMLElement);
        expect(onFocus).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });
});
