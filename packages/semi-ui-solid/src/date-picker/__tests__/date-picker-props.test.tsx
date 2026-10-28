import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker, { type DatePickerProps } from '..';
import semiGlobal from '../../_utils/semi-global';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const baseMon = 8;

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${dp}`;

function renderDatePicker(initial: DatePickerProps = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <DatePicker {...props()} />);
    return { ...result, rerender: (next: DatePickerProps) => setProps(next) };
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector);
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getPresetButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getWeekDays = (side: string, weekIndex: number) => getPanel(side).querySelectorAll(`.${dp}-week`)[weekIndex].querySelectorAll<HTMLElement>(`.${dp}-day`);
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const getTimeLists = () => (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
const findOption = (list: HTMLElement, prefix: string) =>
    within(list)
        .getAllByRole('option')
        .find((li) => li.textContent?.startsWith(prefix)) as HTMLElement;
const switchToTime = () => userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 属性', () => {
    it('dateRange 的 syncSwitchMonth', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 7, 1), new Date(2021, 8, 15)], defaultOpen: true, motion: false, syncSwitchMonth: true });
        expect(getNavTitle('left')).toBe('2021年 8月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`)).toHaveStyle({ visibility: 'hidden' });
        expect(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`)).toHaveStyle({ visibility: 'hidden' });

        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('dateRange 的 showClearIgnoreDisabled', () => {
        const undeclared = { showClearIgnoreDisabled: true } as DatePickerProps;
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)], disabled: true, motion: false, ...undeclared });

        for (const input of inputs(container)) {
            expect(input).toBeDisabled();
        }
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('切到上一月时 onPanelChange 收到新面板的日期与原值字符串', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onPanelChange });

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        const [date, dateStr] = onPanelChange.mock.calls[0] as [Date, string];
        expect(date.getMonth()).toBe(baseMon - 1);
        expect(dateStr).toBe('2019-08-08');
    });

    it('topSlot 与 bottomSlot', () => {
        renderDatePicker({ defaultValue: baseDate, bottomSlot: <div class="custom-bottom-slot">Bottom</div>, defaultOpen: true, motion: false, topSlot: <div class="custom-top-slot">Top</div> });
        expect(getPopup()?.querySelector(`.${dp}-topSlot .custom-top-slot`)).toHaveTextContent('Top');
        expect(getPopup()?.querySelector(`.${dp}-bottomSlot .custom-bottom-slot`)).toHaveTextContent('Bottom');
    });

    it('renderDate 属性', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, renderDate: (dayNumber) => <span class="custom-day">{dayNumber}</span> });
        expect(document.querySelectorAll('.custom-day')).toHaveLength(30);
        expect(getDay('2019-09-08').querySelector('.custom-day')).toHaveTextContent('8');
    });

    it('renderFullDate 属性', () => {
        renderDatePicker({
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            renderFullDate: (dayNumber, _fullDate, dayStatus) => <div class={`custom-full-day ${dayStatus?.isSelected ? 'is-selected' : ''}`}>{dayNumber}</div>,
        });
        expect(document.querySelectorAll('.custom-full-day')).toHaveLength(30);
        expect(getDay('2019-09-08')).not.toHaveClass(`${dp}-day-selected`);
        expect(getDay('2019-09-08').querySelector('.custom-full-day')).toHaveClass('is-selected');
    });

    it('dateRange 悬停效果', async () => {
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-08-01', motion: false });

        const days = getWeekDays('left', 1);
        await userEvent.click(days[0]);

        await userEvent.hover(days[3]);
        expect(getDay('2021-08-09')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-12')).not.toHaveClass(`${dp}-day-inhover`);

        await userEvent.unhover(days[3]);
        expect(getDay('2021-08-09')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('字符串形式的 defaultPickerValue', () => {
        renderDatePicker({ defaultOpen: true, defaultPickerValue: '2020-01-01', motion: false });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getSelectedDays()).toEqual([]);
    });

    it('Date 形式的 defaultPickerValue', () => {
        const { rerender } = renderDatePicker({ defaultOpen: true, defaultPickerValue: new Date(2020, 0, 1), motion: false });
        expect(getNavTitle('left')).toBe('2020年 1月');
        rerender({ defaultOpen: true, defaultPickerValue: new Date(2021, 4, 1), motion: false });
        expect(getNavTitle('left')).toBe('2021年 5月');
    });

    it('dateRange 的 defaultPickerValue', () => {
        renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: ['2020-01-01', '2020-02-01'], motion: false });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getNavTitle('right')).toBe('2020年 2月');
    });

    it('dateTime 的 disabledTime 属性', async () => {
        const disabledTime = () => ({ disabledHours: () => [0, 1, 2, 3, 4, 5], disabledMinutes: () => [], disabledSeconds: () => [] });
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, disabledTime, motion: false });
        await switchToTime();
        const [hourList] = getTimeLists();
        const disabledHours = new Set(Array.from(hourList.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent));
        expect([...disabledHours]).toEqual(['00', '01', '02', '03', '04', '05']);
    });

    it('weekStartsOn 属性', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, weekStartsOn: 1 });
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['一', '二', '三', '四', '五', '六', '日']);
        expect(getWeekDays('left', 0)[6]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('dateTime 与 needConfirm 的 onConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, needConfirm: true, onCancel, onConfirm });

        const [cancelBtn, confirmBtn] = getFooterButtons();
        expect(cancelBtn).toHaveTextContent('取消');
        expect(confirmBtn).toHaveTextContent('确定');
        await userEvent.click(confirmBtn);
        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0]).toEqual([baseDate, format(baseDate, strings.FORMAT_DATE_TIME)]);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('输入框按 Enter 完成选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, onChange });

        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.input(input, { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2021-08-15');
    });

    it('时间戳形式的 value', () => {
        const { container } = renderDatePicker({ defaultValue: new Date(2021, 7, 15).getTime(), motion: false });
        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('字符串形式的 value', () => {
        const { container } = renderDatePicker({ defaultValue: '2021-08-15', motion: false });
        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('范围输入框清空', () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)], motion: false, onChange, onClear });

        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        for (const input of inputs(container)) {
            expect(input).toHaveValue('');
        }
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('范围输入框按 Enter', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, motion: false, onChange });

        const [startInput, endInput] = inputs(container);
        fireEvent.input(startInput, { target: { value: '2021-08-01' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.input(endInput, { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 7, 1), new Date(2021, 7, 15)], ['2021-08-01', '2021-08-15']);
        await userEvent.type(startInput, '{Enter}');
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('范围输入框按 Tab', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, motion: false });

        const [, endInput] = inputs(container);
        endInput.focus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        fireEvent.keyDown(endInput, { key: 'Tab' });
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('month 类型 yearAndMonth 与 noBackBtn', () => {
        renderDatePicker({ type: 'month', defaultValue: new Date(2021, 5), defaultOpen: true, motion: false });
        expect(getYMLists()).toHaveLength(2);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
    });

    it('自定义 format 字符串', () => {
        const { container } = renderDatePicker({ defaultValue: new Date(2021, 7, 15), format: 'dd/MM/yyyy', motion: false });
        expect(container.querySelector('input')).toHaveValue('15/08/2021');
    });

    it('dateRange 与 presets', async () => {
        const presets = [{ text: 'This Week', start: startOfWeek(new Date(baseDate)), end: endOfWeek(new Date(baseDate)) }];
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, motion: false, presets, onChange });

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2019-09-08', '2019-09-14']);
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2019-09-08');
        expect(endInput).toHaveValue('2019-09-14');
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('month 类型与 presets', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'month', defaultOpen: true, motion: false, presets: [{ text: 'Jan', start: new Date(2021, 0) }], onChange });

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-01');
        expect(container.querySelector('input')).toHaveValue('2021-01');
    });

    it('dateTimeRange 的 needConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 7, 1, 10, 0), new Date(2021, 7, 15, 18, 0)], defaultOpen: true, motion: false, needConfirm: true, onCancel, onConfirm });
        const [cancelBtn, confirmBtn] = getFooterButtons();
        expect(cancelBtn).toBeEnabled();
        expect(confirmBtn).toBeEnabled();
        await userEvent.click(confirmBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0][1]).toEqual(['2021-08-01 10:00:00', '2021-08-15 18:00:00']);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('timePickerOpts', async () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, timePickerOpts: { use12Hours: true } });
        await switchToTime();
        expect(getTimeLists()).toHaveLength(4);
    });

    it('timePickerOpts.use12Hours 下上午的时间点小时仍保持在上午', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, timePickerOpts: { use12Hours: true }, onChange });
        await switchToTime();
        const [ampmList, hourList] = getTimeLists();
        expect(within(ampmList).getAllByRole('option')[0]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(findOption(hourList, '09'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(9);
    });

    it('timePickerOpts.use12Hours 下下午的时间点小时仍保持在下午', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: new Date(2019, 8, 8, 15, 8, 8), defaultOpen: true, motion: false, timePickerOpts: { use12Hours: true }, onChange });
        await switchToTime();
        const [ampmList, hourList] = getTimeLists();
        expect(within(ampmList).getAllByRole('option')[1]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(findOption(hourList, '04'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(16);
    });

    it('timePickerOpts 里的 onChange、format、timeStampValue 不覆盖面板内部的值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const timePickerOpts = { onChange: vi.fn<() => void>(), format: 'mm', timeStampValue: 0 } as unknown as DatePickerProps['timePickerOpts'];
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, timePickerOpts, onChange });
        await switchToTime();
        const [hourList] = getTimeLists();
        await userEvent.click(findOption(hourList, '09'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(9);
    });
});
