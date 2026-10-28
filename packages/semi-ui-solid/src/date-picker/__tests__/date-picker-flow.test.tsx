import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker, { type DatePickerElement, type DatePickerProps } from '..';
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
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getWeekDays = (side: string, weekIndex: number) => getPanel(side).querySelectorAll(`.${dp}-week`)[weekIndex].querySelectorAll<HTMLElement>(`.${dp}-day`);
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const typeIn = (input: Element, value: string) => fireEvent.input(input, { target: { value } });
const panelButton = (side: string, label: 'nextMonth' | 'switchToTime') => getPanel(side).querySelector(`[aria-label="${zh_CN.DatePicker[label]}"]`) as HTMLElement;
const rangeValue: DatePickerProps['defaultValue'] = [new Date(2021, 5, 1), new Date(2021, 5, 15)];
const timeRangeValue: DatePickerProps['defaultValue'] = [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)];

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 选择流程', () => {
    it('dateInput handleRangeInputChange 方法', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        typeIn(startInput, '2021-06-02');
        typeIn(endInput, '2021-07-15');
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 2), new Date(2021, 6, 15)], ['2021-06-02', '2021-07-15']);
    });

    it('dateRange 自定义清空图标渲染', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, clearIcon: <span class="custom-clear-icon">X</span>, motion: false, showClear: true });
        const clearBtn = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clearBtn.querySelector('.custom-clear-icon')).toHaveTextContent('X');
    });

    it('monthRange placeholder 数组拼接', () => {
        renderDatePicker({ type: 'monthRange', placeholder: ['Start', 'End'], motion: false, rangeSeparator: ' - ' });
        expect(screen.getByPlaceholderText('Start - End')).toBeInTheDocument();
    });

    it('date 类型无时间的 insetInput', () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        const wrapper = getPopup().querySelector(`.${dp}-inset-input-wrapper`) as HTMLElement;
        expect(wrapper).toHaveAttribute('x-type', 'date');
        expect(wrapper.querySelectorAll('input')).toHaveLength(1);
        expect(wrapper.querySelector(`.${dp}-inset-input-separator`)).toBeNull();
    });

    it('insetInput 自定义 placeholder', () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, insetInput: { placeholder: { dateStart: 'Date Start', timeStart: 'Time Start' } }, motion: false });
        expect(within(getPopup()).getByPlaceholderText('Date Start')).toHaveValue('2019-09-08');
        expect(within(getPopup()).getByPlaceholderText('Time Start')).toHaveValue('08:08:08');
    });

    it('dateRange 的 insetInput 使用 compact 密度', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, density: 'compact', insetInput: true, motion: false });
        const separator = getPopup().querySelector(`.${dp}-inset-input-separator`);
        expect(separator).not.toBeNull();
        expect(separator).toBeEmptyDOMElement();
    });

    it('Month 日期元素悬停', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, motion: false });
        await userEvent.hover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).toHaveClass(`${dp}-day-inhover`);
        await userEvent.unhover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('点击禁用日期不改值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, disabledDate: (date) => (date as Date).getDate() === 15, motion: false, onChange });
        const disabledDay = getDay('2019-09-15');
        expect(disabledDay).toHaveClass(`${dp}-day-disabled`);
        expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(disabledDay);
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('weekStartsOn 为 0（周日）', () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, weekStartsOn: 0 });
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['日', '一', '二', '三', '四', '五', '六']);
        expect(getWeekDays('left', 0)[0]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('dateTime needConfirm 确认前只缓存选中值', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, needConfirm: true, onConfirm });
        await userEvent.click(getDay('2019-09-11'));
        expect(onConfirm).not.toHaveBeenCalled();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledWith(new Date(2019, 8, 11, 8, 8, 8, 8), '2019-09-11 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2019-09-11 08:08:08');
    });

    it('受控 value 下选择日期', async () => {
        const onChange = vi.fn<(date: Date | Date[]) => void>();
        const [value, setValue] = createSignal<Date>(baseDate);
        const { container } = render(() => (
            <DatePicker
                type="date"
                value={value()}
                defaultOpen
                motion={false}
                onChange={(date) => {
                    onChange(date);
                    setValue(date as Date);
                }}
            />
        ));
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 11));
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('范围不完整时禁用确认按钮', async () => {
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 10, 10), new Date(2021, 5, 20, 18)], motion: false, needConfirm: true });
        const [startInput, endInput] = inputs(container);
        await userEvent.click(endInput);
        expect(getFooterButtons()[1]).toBeEnabled();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(getFooterButtons()[1]).toBeDisabled();
    });

    it('非范围类型的确认按钮可用', () => {
        renderDatePicker({ type: 'dateTime', defaultOpen: true, motion: false, needConfirm: true });
        expect(getFooterButtons()[1]).toBeEnabled();
    });

    it('禁用时点击不打开，解除禁用后可打开', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container, rerender } = renderDatePicker({ type: 'date', disabled: true, motion: false, onOpenChange });
        fireEvent.click(container.querySelector(`.${dp}-input`) as HTMLElement);
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();

        rerender({ type: 'date', motion: false, onOpenChange });
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('输入禁用日期不通知，清空时通知', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', disabledDate: (date) => (date as Date).getDate() === 15, motion: false, onChange });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
        typeIn(input, '2021-06-10');
        expect(onChange).toHaveBeenCalledTimes(1);
        typeIn(input, '');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('dateTimeRange 输入后按 Enter', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        typeIn(endInput, '2021-06-20 18:00:00');
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
        expect(startInput).toHaveValue('2021-06-01 10:00:00');
        expect(endInput).toHaveValue('2021-06-20 18:00:00');
    });

    it('dateTimeRange 渲染两个面板', () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, motion: false });
        expect(getPopup().querySelectorAll(`.${dp}-navigation`)).toHaveLength(2);
        expect(getPanel('left').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-0110:00:00');
        expect(getPanel('right').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-1518:00:00');
    });

    it('dateTimeRange 的 insetInput 渲染内嵌输入框', () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, insetInput: true, motion: false });
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-insetinput', 'true');
        expect(getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(4);
        expect(getPopup().querySelector(`.${dp}-switch`)).toBeNull();
    });

    it('dateTimeRange 通过界面修改时间', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, motion: false, onChange });
        await userEvent.click(panelButton('right', 'switchToTime'));
        const [, rightMinutes] = getPanel('right').querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(rightMinutes).getAllByRole('option', { name: '30' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 18, 30)], ['2021-06-01 10:00:00', '2021-06-15 18:30:00']);
    });

    it('切换上一月与下一月时 autoSwitchDate 跟着改值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 9月');
        expect(onChange.mock.calls.map((args) => args[1])).toEqual(['2019-08-08', '2019-09-08']);
    });

    it('dateRange 范围类型下的 autoSwitchDate', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, autoSwitchDate: true, defaultOpen: true, motion: false, onChange });
        await userEvent.click(panelButton('left', 'nextMonth'));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(onChange).not.toHaveBeenCalled();
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('非法输入清空选中日期', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        const input = inputs(container)[0];
        typeIn(input, 'not-a-date');
        expect(getSelectedDays()).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('not-a-date');
    });

    it('点击外部关闭时还原未完成的输入', () => {
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-1');
        expect(input).toHaveValue('2021-06-1');
        fireEvent.mouseDown(document.body);
        expect(input).toHaveValue(ymd(baseDate));
    });

    it('多选追加日期', async () => {
        const { container } = renderDatePicker({ type: 'date', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], multiple: true, defaultOpen: true, motion: false });
        await userEvent.click(getDay('2021-06-20'));
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15,2021-06-20');
    });

    it('ref 的 open 与 close 方法', async () => {
        let picker!: DatePickerElement;
        render(() => <DatePicker ref={(el) => (picker = el)} type="date" motion={false} />);
        picker.open();
        expect(getPopup()).not.toBeNull();
        picker.close();
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('insetInput 面板打开时聚焦已获焦的范围输入框', async () => {
        let picker!: DatePickerElement;
        render(() => <DatePicker ref={(el) => (picker = el)} type="dateRange" defaultValue={rangeValue} insetInput motion={false} />);
        picker.focus('rangeEnd');
        picker.open();
        const [, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        await waitFor(() => expect(endDate).toHaveFocus());
    });

    it('左侧打开年月选择器后返回日期面板', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left').querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getPanel('right').querySelector(`.${dp}-yam`)).toBeNull();
        expect(getYMSelected(getPanel('left'))).toEqual(['2021年', '6月']);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
    });

    it('dateTime 的切换按钮显示已选日期与时间', () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate })).toHaveTextContent('2019-09-08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');
    });

    it('dateTimeRange 两侧分别切换时间面板', async () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, motion: false });
        await userEvent.click(panelButton('left', 'switchToTime'));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(panelButton('right', 'switchToTime'));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup().querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToDate}"]`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
    });

    it('点击范围后缀聚焦起始输入框', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, motion: false });
        await userEvent.click(container.querySelector(`.${dp}-range-input-suffix`) as HTMLElement);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('weekStartsOn 为 1 时的首周', () => {
        renderDatePicker({ type: 'date', defaultValue: new Date(2021, 0, 1), defaultOpen: true, motion: false, weekStartsOn: 1 });
        expect(getPopup().querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(31);
        expect(getWeekDays('left', 0)[4]).toHaveAttribute('aria-label', '2021-01-01');
    });

    it('date 与 time 输入框的 insetInput onChange 回调', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, insetInput: true, motion: false, onChange });
        const [startDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        const [startTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        typeIn(startDate, '2021-06-10');
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        typeIn(startTime, '11:00:00');
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 11), new Date(2021, 5, 15, 18)], ['2021-06-10 11:00:00', '2021-06-15 18:00:00']);
    });

    it('范围类型下周行数随右侧月份变化', async () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 1, 1), new Date(2021, 2, 15)], defaultOpen: true, motion: false });
        const weekRows = (side: string) => getPanel(side).querySelectorAll(`.${dp}-week`);
        expect(getNavTitle('right')).toBe('2021年 3月');
        expect(weekRows('right')).toHaveLength(5);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        await userEvent.click(panelButton('right', 'nextMonth'));
        await userEvent.click(panelButton('right', 'nextMonth'));
        expect(getNavTitle('right')).toBe('2021年 5月');
        expect(weekRows('right')).toHaveLength(6);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
    });

    it('年月选择器的返回按钮回到日期面板', async () => {
        renderDatePicker({ type: 'date', defaultValue: new Date(2021, 5, 1), defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left').querySelector(`.${dp}-navigation`)).toBeNull();
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('year 类型', () => {
        renderDatePicker({ type: 'year', defaultOpen: true, motion: false });
        expect(getPopup()).toHaveAttribute('x-type', 'year');
        expect(getPopup()).toHaveClass(`${dp}-panel-yam`);
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toBeNull();
        expect(getPopup().querySelector(`.${dp}-month`)).toBeNull();
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`).length).toBeGreaterThan(0);
    });

    it('输入框聚焦触发 onFocus，失焦不触发 onBlur', () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { container } = renderDatePicker({ type: 'date', motion: false, onBlur, onFocus });
        const input = inputs(container)[0];
        input.focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        input.blur();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('范围输入框渲染后缀图标', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, motion: false });
        expect(container.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar`)).not.toBeNull();
        const { container: dateTime } = renderDatePicker({ type: 'dateTimeRange', motion: false });
        expect(dateTime.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar_clock`)).not.toBeNull();
    });

    it('点击起始输入框外层聚焦 rangeStart', () => {
        const { container } = renderDatePicker({ type: 'dateRange', motion: false });
        fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-start`) as HTMLElement);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('点击结束输入框外层聚焦 rangeEnd', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, motion: false });
        fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-end`) as HTMLElement);
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('结束输入框按 Enter 时还原未完成的输入', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        typeIn(endInput, '2021-06-1');
        await userEvent.type(endInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateTimeRange 的 insetInput 结束日期聚焦后点击日期改结束值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, insetInput: true, motion: false, onChange });
        const [, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        endDate.focus();
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('monthRange 当前月禁用时向后查找可用月份', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'monthRange', defaultValue: ['2021-06', '2021-08'], defaultOpen: true, disabledDate: (date) => Boolean(date) && (date as Date).getMonth() === 5, motion: false, onChange });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 6), new Date(2023, 7)], ['2022-07', '2023-08']);
    });

    it('dateTimeRange 同一天的时间面板', async () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 15, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, motion: false });
        await userEvent.click(panelButton('left', 'switchToTime'));
        await userEvent.click(panelButton('right', 'switchToTime'));
        expect(getPopup().querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        expect(panelButton('left', 'switchToTime')).toHaveTextContent('10:00:00');
        expect(panelButton('right', 'switchToTime')).toHaveTextContent('18:00:00');
    });

    it('点击范围前缀聚焦起始输入框', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, prefix: 'Date:' });
        await userEvent.click(container.querySelector(`.${dp}-range-input-prefix`) as HTMLElement);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('聚焦内嵌时间与日期输入框时切换面板', () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: timeRangeValue, defaultOpen: true, insetInput: true, motion: false });
        const [startDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        const [startTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        startTime.focus();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        startDate.focus();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
    });

    it('两侧面板的周行数', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: rangeValue, defaultOpen: true, motion: false });
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        expect(getPanel('right').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
    });

    it('选中范围的 offset 悬停样式', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateRange', defaultPickerValue: '2021-06-01', endDateOffset: (date) => addDays(date as Date, 1), motion: false, open: true, startDateOffset: (date) => addDays(date as Date, -1), onChange });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange.mock.calls[0][1]).toEqual(['2021-06-09', '2021-06-11']);
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-selectedrange-hover`);
        await userEvent.unhover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).not.toHaveClass(`${dp}-day-selectedrange-hover`);
    });

    it('时间面板选择分钟', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: new Date(2021, 5, 1, 10, 30), defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [, minuteList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(minuteList).getAllByRole('option', { name: '45' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 1, 10, 45), '2021-06-01 10:45:00');
    });

    it('年月选择器切换面板但不改值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: new Date(2021, 5, 1), autoSwitchDate: false, defaultOpen: true, motion: false, onChange });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(yearList).getByRole('option', { name: '2022' }));
        await userEvent.click(within(monthList).getByRole('option', { name: '3月' }));
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2022年 3月');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('单选日期上 mouseenter 与 mouseleave 不改样式', () => {
        renderDatePicker({ type: 'date', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        const day = getDay('2021-06-10');
        const className = day.className;
        fireEvent.mouseEnter(day);
        expect(day.className).toBe(className);
        fireEvent.mouseLeave(day);
        expect(day.className).toBe(className);
    });

    it('切换月份时周行数更新', async () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        for (let i = 0; i < 3; i++) {
            await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        }
        expect(getNavTitle('left')).toBe('2019年 6月');
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(6);
    });

    it('monthRange 只有一个可用月份', () => {
        const disabledDate = (date?: Date) => Boolean(date) && (date as Date).getFullYear() === 2022 && (date as Date).getMonth() > 0;
        renderDatePicker({ type: 'monthRange', defaultValue: ['2022-06', '2022-08'], defaultOpen: true, disabledDate, motion: false });
        const leftMonths = within(getYMLists()[1]).getAllByRole('option');
        const enabledMonths = leftMonths.filter((option) => option.getAttribute('aria-disabled') === 'false');
        expect(enabledMonths).toHaveLength(1);
        expect(enabledMonths[0]).toHaveTextContent('1');
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022年' })).toHaveAttribute('aria-disabled', 'false');
    });

    it.each([
        {
            name: '两个面板都禁用时找到可用月份',
            disabled: [5, 7],
            expected: [
                [new Date(2022, 6), new Date(2022, 6)],
                ['2022-07', '2022-07'],
            ],
        },
        {
            name: '仅对侧面板禁用',
            disabled: [7],
            expected: [
                [new Date(2022, 5), new Date(2022, 5)],
                ['2022-06', '2022-06'],
            ],
        },
    ])('monthRange $name', async ({ disabled, expected }) => {
        const onChange = vi.fn<ChangeHandler>();
        const disabledDate = (date?: Date) => Boolean(date) && (date as Date).getFullYear() === 2022 && disabled.includes((date as Date).getMonth());
        renderDatePicker({ type: 'monthRange', defaultValue: ['2022-06', '2022-08'], defaultOpen: true, disabledDate, motion: false, onChange });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022年' }));
        expect(onChange).toHaveBeenLastCalledWith(...expected);
    });

    it('monthRange 在当前索引之前查找可用月份', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const disabledDate = (date?: Date) => Boolean(date) && (date as Date).getFullYear() === 2023 && (date as Date).getMonth() >= 5;
        renderDatePicker({ type: 'monthRange', defaultValue: ['2023-06', '2023-08'], defaultOpen: true, disabledDate, motion: false, onChange });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2023, 0), new Date(2023, 0)], ['2023-01', '2023-01']);
    });
});
