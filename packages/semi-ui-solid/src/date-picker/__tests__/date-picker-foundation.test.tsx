import { catchError, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import DatePicker, { type DatePickerElement, type DatePickerProps, type DisabledDateType } from '..';
import semiGlobal from '../../_utils/semi-global';
import { LocaleProvider } from '../../locale';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

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
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const typeIn = (input: Element, value: string) => fireEvent.input(input, { target: { value } });
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker foundation 行为', () => {
    it('foundation handleInputComplete 范围类型输入为空', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        await userEvent.type(startInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(new Date()), ymd(new Date())]);
        expect(startInput).toHaveValue(ymd(new Date()));
        expect(endInput).toHaveValue(ymd(new Date()));
    });

    it('foundation parseInput 处理 dateRange 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onChange });
        typeIn(inputs(container)[1], '2021-06-20');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 20)], ['2021-06-01', '2021-06-20']);
    });

    it('foundation parseInput 处理 dateTime 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, motion: false, onChange });
        typeIn(inputs(container)[0], '2021-06-15 10:30:00');
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 10, 30), '2021-06-15 10:30:00');
        typeIn(inputs(container)[0], '2021-06-16');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('foundation parseInput 处理 month 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'month', defaultValue: new Date(2021, 5), defaultOpen: true, motion: false, onChange });
        typeIn(inputs(container)[0], '2021-08');
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 7), '2021-08');
        expect(getYMSelected()).toEqual(['2021年', '8月']);
    });

    it('foundation formatDates 处理不同类型', async () => {
        const { container, unmount } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false });
        let [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        unmount();

        const startOnly = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        [startInput, endInput] = inputs(startOnly.container);
        startInput.focus();
        await userEvent.click(getDay('2021-06-01'));
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('');
        startOnly.unmount();

        const endOnly = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        [startInput, endInput] = inputs(endOnly.container);
        endInput.focus();
        await userEvent.click(getDay('2021-06-15'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('foundation formatMultipleDates', () => {
        const { container } = renderDatePicker({ type: 'date', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], multiple: true, motion: false });
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15');
    });

    it('foundation handleRangeInputClear', () => {
        const onChange = vi.fn<ChangeHandler>();
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container } = renderDatePicker({ type: 'dateRange', value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onChange, onClear });
        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('foundation handlePresetClick 处理 date 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultOpen: true, motion: false, presets: [{ text: 'Today', start: new Date() }], onChange });
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue(ymd(new Date()));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation handlePresetClick 处理函数值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const start = vi.fn<() => Date>(() => new Date(2021, 5, 1));
        const { container } = renderDatePicker({ type: 'date', defaultOpen: true, motion: false, presets: [{ text: 'Lazy', start }], onChange });
        await userEvent.click(screen.getByRole('button', { name: 'Lazy' }));
        expect(start).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 1), '2021-06-01');
        expect(container.querySelector('input')).toHaveValue('2021-06-01');
    });

    it('foundation handleConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, motion: false, needConfirm: true, onConfirm });
        const [startInput, endInput] = inputs(container);
        startInput.focus();
        await userEvent.click(getDay('2021-06-03'));
        endInput.focus();
        await userEvent.click(getDay('2021-06-10'));
        expect(getFooterButtons()[1]).toBeEnabled();
        expect(onConfirm).not.toHaveBeenCalled();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect((onConfirm.mock.calls[0][1] as string[]).map((v) => v.slice(0, 10))).toEqual(['2021-06-03', '2021-06-10']);
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(startInput.value.startsWith('2021-06-03')).toBe(true);
        expect(endInput.value.startsWith('2021-06-10')).toBe(true);
    });

    it('foundation handleCancel', async () => {
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, needConfirm: true, onCancel });
        await userEvent.click(getDay(ymd(addDays(baseDate, 2))));
        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledWith(baseDate, format(baseDate, strings.FORMAT_DATE_TIME));
        expect(container.querySelector('input')).toHaveValue(format(baseDate, strings.FORMAT_DATE_TIME));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation _parseValue 处理各种输入', () => {
        const inputValueOf = (defaultValue: DatePickerProps['defaultValue']) => {
            const { container, unmount } = renderDatePicker({ defaultValue, motion: false });
            const value = (container.querySelector('input') as HTMLInputElement).value;
            unmount();
            return value;
        };
        expect(inputValueOf(new Date(2021, 5, 1))).toBe('2021-06-01');
        expect(inputValueOf('2021-06-01')).toBe('2021-06-01');
        expect(inputValueOf(new Date(2021, 5, 1).getTime())).toBe('2021-06-01');
        expect(inputValueOf(null as unknown as DatePickerProps['defaultValue'])).toBe('');
        const invalidValue = {} as unknown as DatePickerProps['defaultValue'];
        const errors: unknown[] = [];
        render(() =>
            catchError(
                () => <DatePicker defaultValue={invalidValue} motion={false} />,
                (error) => errors.push(error)
            )
        );
        expect(errors[0]).toBeInstanceOf(TypeError);
    });

    it('foundation handleTriggerWrapperClick 处理范围类型', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onOpenChange });
        await userEvent.click(container.querySelector(`.${dp}-range-input`) as HTMLElement);
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(inputs(container)[0]).toHaveFocus());
    });

    it('foundation handleTriggerWrapperClick 禁用时', () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = renderDatePicker({ type: 'dateRange', disabled: true, motion: false, onOpenChange });
        fireEvent.click(container.querySelector(`.${dp}-range-input`) as HTMLElement);
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });

    it('foundation handleYMSelectedChange 处理 monthRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'monthRange', defaultValue: [new Date(2021, 2), new Date(2021, 8)], defaultOpen: true, motion: false, onChange });
        const [, leftMonths, , rightMonths] = getYMLists();
        await userEvent.click(within(rightMonths).getByRole('option', { name: '10月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 2), new Date(2021, 9)], ['2021-03', '2021-10']);
        await userEvent.click(within(leftMonths).getByRole('option', { name: '2月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 1), new Date(2021, 9)], ['2021-02', '2021-10']);
        expect(container.querySelector('input')).toHaveValue('2021-02 ~ 2021-10');
    });

    it('foundation disposeCallbackArgs 处理时区', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', defaultValue: baseDate, motion: false, timeZone: 'Asia/Tokyo', onChange });
        typeIn(inputs(container)[0], '2021-06-10');
        const [date, dateString] = onChange.mock.calls[0] as [Date, string];
        expect(date).toEqual(zonedTimeToUtc(new Date(2021, 5, 10), 'Asia/Tokyo'));
        expect(dateString).toBe(format(date, 'yyyy-MM-dd'));
    });

    it('foundation disposeCallbackArgs 处理多选日期类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: [new Date(2021, 5, 1)], multiple: true, defaultOpen: true, motion: false, onChange });
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
    });

    it('foundation disposeCallbackArgs 处理 dateRange 类型', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onChange });
        typeIn(inputs(container)[0], '2021-06-02');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 2), new Date(2021, 5, 15)], ['2021-06-02', '2021-06-15']);
    });

    it('needConfirm 下 foundation initFromProps', () => {
        const props: DatePickerProps = { type: 'dateTime', needConfirm: true, motion: false, defaultOpen: true };
        const { container, rerender } = renderDatePicker({ ...props, value: baseDate });
        rerender({ ...props, value: new Date(2021, 5, 15, 10, 30) });
        expect(container.querySelector('input')).toHaveValue('2021-06-15 10:30:00');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
    });

    it('foundation parseWithTimezone 处理合法时区', () => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, motion: false, timeZone: 'Asia/Shanghai' });
        // the test environment runs in Asia/Shanghai
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('foundation parseWithTimezone 处理 prevTimeZone', () => {
        const { container, rerender } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, motion: false, timeZone: 'Asia/Shanghai' });
        rerender({ type: 'dateTime', defaultValue: baseDate, motion: false, timeZone: 'Asia/Tokyo' });
        expect(container.querySelector('input')).toHaveValue('2019-09-08 09:08:08');
    });

    it('foundation handlePanelVisibleChange', async () => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, insetInput: true, motion: false });
        const triggerInput = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(triggerInput);
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(triggerInput).toBeDisabled());
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(triggerInput).toBeEnabled());
    });

    it('triggerRender 且值为空时 foundation initRangeInputFocus', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [], motion: false, triggerRender: (p) => <div data-testid="trigger">{String(p.rangeInputFocus)}</div> });
        expect(screen.getByTestId('trigger')).toHaveTextContent('rangeStart');
    });

    it('triggerRender 的范围类型下 foundation handleTriggerWrapperClick', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, triggerRender: (p) => <div class="custom-trigger">{String(p.rangeInputFocus)}</div> });
        const trigger = container.querySelector('.custom-trigger') as HTMLElement;
        expect(trigger).toHaveTextContent('undefined');
        await userEvent.click(trigger);
        expect(getPopup()).not.toBeNull();
        expect(trigger).toHaveTextContent('rangeStart');
    });

    it('foundation getLooseDateFromInput', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        typeIn(inputs(container)[0], '2021-06-01');
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(document.querySelector(`.${dp}-day-selected-end`)).toBeNull();
    });

    it('foundation parseInputLoose 处理 date 类型', () => {
        const { container } = renderDatePicker({ type: 'date', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-15');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
        typeIn(input, 'invalid');
        expect(getSelectedDays()).toEqual([]);
        typeIn(input, '');
        expect(getSelectedDays()).toEqual([]);
    });

    it('foundation parseInputLoose 处理 dateRange 类型', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        const [startInput, endInput] = inputs(container);
        typeIn(startInput, '2021-06-01');
        typeIn(endInput, '2021-06-15');
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('foundation parseMultipleInput', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', multiple: true, motion: false, onChange });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-01,2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        typeIn(input, 'invalid,2021-06-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('invalid,2021-06-15');
    });

    it('foundation parseMultipleInput 带 max', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', max: 1, multiple: true, motion: false, onChange });
        typeIn(inputs(container)[0], '2021-06-01,2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选输入按 Enter 时去除重复日期', async () => {
        const { container } = renderDatePicker({ type: 'date', multiple: true, motion: false });
        const input = inputs(container)[0];
        typeIn(input, '2021-06-01,2021-06-15,2021-06-01');
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue('2021-06-01,2021-06-15');
    });

    it('foundation parseMultipleInputLoose', () => {
        const { container } = renderDatePicker({ type: 'date', multiple: true, defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        typeIn(inputs(container)[0], '2021-06-01,2021-06-1');
        expect(getSelectedDays()).toEqual(['2021-06-01']);
    });

    it('多选的 insetInput 按内嵌格式解析输入', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', multiple: true, defaultOpen: true, format: 'yyyy-MM-dd EEEE', insetInput: true, motion: false, onChange });
        typeIn(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2021-06-01,2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01 星期二', '2021-06-15 星期二']);
    });

    it('multiple 只对 date 生效，dateTime 忽略 multiple 按单选交出值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', multiple: true, defaultOpen: true, defaultPickerValue: new Date(2021, 5, 1, 10, 0, 0), motion: false, onChange });
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15, 10, 0, 0), '2021-06-15 10:00:00');
    });

    it('foundation _someDateDisabled 处理范围类型', () => {
        const disabledDate = vi.fn<DisabledDateType>(() => false);
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], disabledDate, motion: false, onChange });
        typeIn(inputs(container)[1], '2021-06-10');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(disabledDate).toHaveBeenCalledWith(new Date(2021, 5, 10), expect.objectContaining({ rangeStart: '2021-06-01', rangeEnd: '2021-06-10' }));
    });

    it('foundation disposeDateFn', () => {
        const disabledDate = vi.fn<DisabledDateType>((date) => (date as Date).getDate() === 10);
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, disabledDate, motion: false });
        expect(disabledDate.mock.calls.every(([date]) => date instanceof Date)).toBe(true);
        expect(getDay('2019-09-10')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-11')).toHaveAttribute('aria-disabled', 'false');
    });

    it('monthsGrid 通过 foundation 显示年份选择器', async () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        const popup = getPopup() as HTMLElement;
        expect(popup.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'none');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(popup.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'left');
        expect(getPanel('left')).toHaveClass(`${dp}-yam-showing`);
        expect(getPanel('left').querySelector(`.${dp}-month`)).toBeNull();
    });

    it('monthsGrid 的 dateRange 类型显示两个面板', () => {
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)], defaultOpen: true, motion: false });
        expect(getPopup()?.querySelectorAll(`.${dp}-month`)).toHaveLength(2);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
    });

    it('monthsGrid 上一年与下一年按钮', async () => {
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevYear }));
        expect(getNavTitle('left')).toBe('2018年 9月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        expect(getNavTitle('left')).toBe('2020年 9月');
    });

    it('受控 value 更新', async () => {
        const [value, setValue] = createSignal<Date>(baseDate);
        render(() => (
            <div>
                <DatePicker value={value()} motion={false} onChange={(date) => setValue(date as Date)} />
                <button type="button" onClick={() => setValue(new Date(2022, 0, 1))}>
                    Update
                </button>
            </div>
        ));
        expect(screen.getByRole('combobox')).toHaveValue(ymd(baseDate));
        await userEvent.click(screen.getByRole('button', { name: 'Update' }));
        expect(screen.getByRole('combobox')).toHaveValue('2022-01-01');
    });

    it('受控 open', async () => {
        const [open, setOpen] = createSignal(false);
        render(() => (
            <div>
                <DatePicker defaultValue={baseDate} motion={false} open={open()} onOpenChange={setOpen} />
                <button type="button" onClick={() => setOpen(true)}>
                    Open
                </button>
                <button type="button" onClick={() => setOpen(false)}>
                    Close
                </button>
            </div>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(getPopup()).not.toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('disabledTime', async () => {
        const disabledTime = () => ({ disabledHours: () => [0, 1, 2, 3], disabledMinutes: () => [0, 15, 30, 45], disabledSeconds: () => [0] });
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, disabledTime, motion: false });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const disabledTexts = (list: Element) => [...new Set(Array.from(list.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent))];
        const [hours, minutes, seconds] = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk ul[role="listbox"]`);
        expect(disabledTexts(hours)).toEqual(['00', '01', '02', '03']);
        expect(disabledTexts(minutes)).toEqual(['00', '15', '30', '45']);
        expect(disabledTexts(seconds)).toEqual(['00']);
    });

    it('ref 的 focus 与 blur 方法', () => {
        let picker!: DatePickerElement;
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="date" defaultValue={baseDate} motion={false} />);
        const input = container.querySelector('input');
        picker.focus();
        expect(input).toHaveFocus();
        picker.blur();
        expect(input).not.toHaveFocus();
    });

    it('ref 在范围类型下的 focus 与 blur', () => {
        let picker!: DatePickerElement;
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        const [startInput, endInput] = inputs(container);
        picker.focus('rangeStart');
        expect(startInput).toHaveFocus();
        picker.blur();
        expect(startInput).not.toHaveFocus();
        picker.focus('rangeEnd');
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        picker.blur();
        expect(endInput).not.toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('foundation handleInputFocus 处理范围类型', () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, onFocus });
        const [startInput, endInput] = inputs(container);
        startInput.focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        endInput.focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('foundation handleRangeEndTabPress', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', motion: false });
        inputs(container)[1].focus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.tab();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('多选达到 max 上限', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], max: 2, multiple: true, defaultOpen: true, motion: false, onChange });
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-15']);
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1)], ['2021-06-01']);
        await userEvent.click(getDay('2021-06-20'));
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-20']);
    });

    it('format 与 locale', () => {
        const { container } = render(() => (
            <LocaleProvider locale={en_US}>
                <DatePicker defaultValue={baseDate} format="MM/dd/yyyy" motion={false} />
            </LocaleProvider>
        ));
        expect(container.querySelector('input')).toHaveValue('09/08/2019');
    });

    it('foundation handleSelectedChange 处理 dateRange 值为 null 的不完整值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false, onChange });
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(inputs(container)[0]).toHaveValue('2021-06-01');
    });

    it('foundation handleSelectedChange 带 insetInput', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', defaultPickerValue: '2021-06-01', insetInput: true, motion: false, open: true, onChange });
        const insetInput = within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd');
        expect(insetInput).toHaveValue('');
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(insetInput).toHaveValue('2021-06-15');
    });

    it('受控时预设只通知不改值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', value: baseDate, defaultOpen: true, motion: false, presets: [{ text: 'Preset', start: new Date(2021, 5, 15) }], onChange });
        await userEvent.click(screen.getByRole('button', { name: 'Preset' }));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('切到下一月时调用一次 onPanelChange', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        renderDatePicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onPanelChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toBe('2019-10-08');
    });

    it('inputFoundation getInsetInputPlaceholder 处理 dateTime', () => {
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, format: 'yyyy/MM/dd HH:mm', insetInput: true, motion: false });
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy/MM/dd')).toHaveValue('2019/09/08');
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('HH:mm')).toHaveValue('08:08');
    });
});
