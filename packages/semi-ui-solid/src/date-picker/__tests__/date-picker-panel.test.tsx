import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker, { type DatePickerProps, type YearAndMonthProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import YearAndMonth from '../year-and-month';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${dp}`;

function renderDatePicker(initial: DatePickerProps = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <DatePicker {...props()} />);
    return { ...result, rerender: (next: DatePickerProps) => setProps(next) };
}

const yearAndMonthDefaultProps: YearAndMonthProps = {
    currentYear: { left: 2021, right: 2022 },
    currentMonth: { left: 6, right: 7 },
    onSelect: () => {},
    onBackToMain: () => {},
    locale: en_US.DatePicker,
    type: 'month',
};

function renderYearAndMonth(initial: Partial<YearAndMonthProps> = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <YearAndMonth {...yearAndMonthDefaultProps} {...props()} />);
    return { ...result, rerender: (next: Partial<YearAndMonthProps>) => setProps(next) };
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector) as HTMLElement;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const insetInputs = () => Array.from(getPopup().querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`));

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 年月面板', () => {
    it('month 类型的 startYear 与 endYear', () => {
        renderDatePicker({ type: 'month', defaultOpen: true, endYear: 2025, motion: false, startYear: 2020 });
        const years = within(getYMLists()[0])
            .getAllByRole('option')
            .map((option) => option.textContent?.replace('年', ''));
        expect(years).toEqual(['2020', '2021', '2022', '2023', '2024', '2025']);
    });

    it('month 类型 yearAndMonth 面板渲染与年月选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'month', defaultValue: new Date(2021, 5), defaultOpen: true, motion: false, onChange });
        expect(getPopup()).toHaveClass(`${dp}-panel-yam`);
        expect(getYMLists()).toHaveLength(2);
        expect(getYMSelected()).toEqual(['2021年', '6月']);

        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 5), '2023-06');
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '9月' }));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 8), '2023-09');
        expect(container.querySelector('input')).toHaveValue('2023-09');
    });

    it('monthRange 类型在 yearAndMonth 中渲染两个面板', () => {
        renderDatePicker({ type: 'monthRange', defaultValue: [new Date(2021, 2), new Date(2021, 8)], defaultOpen: true, motion: false });
        expect(getPopup().querySelector(`.${dp}-yearmonth-body`)).not.toBeNull();
        expect(getYMLists()).toHaveLength(4);
        expect(getYMSelected()).toEqual(['2021年', '3月', '2021年', '9月']);
    });

    it('YearAndMonth 通过 foundation 选择年份', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ currentYear: { left: 2023, right: 2022 }, currentMonth: { left: 6, right: 7 } });
    });

    it('YearAndMonth 通过 foundation 选择月份', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: 'March' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ currentYear: { left: 2021, right: 2022 }, currentMonth: { left: 3, right: 7 } });
    });

    it('YearAndMonth selectYear 在 monthRange 中 left 大于 right 时调整 right', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect, type: 'monthRange' });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2025' }));
        expect(onSelect).toHaveBeenCalledWith({ currentYear: { left: 2025, right: 2026 }, currentMonth: { left: 6, right: 7 } });
    });

    it('YearAndMonth selectYear 在 monthRange 中 right 同年时拒绝非法日期', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect, type: 'monthRange', currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 9, right: 3 } });
        await userEvent.click(within(getYMLists()[2]).getByRole('option', { name: '2021' }));
        expect(onSelect).toHaveBeenCalledWith({ currentYear: { left: 2020, right: 2021 }, currentMonth: { left: 9, right: 3 } });
    });

    it('YearAndMonth selectMonth 在 monthRange 中 left 大于 right 时调整', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect, type: 'monthRange', currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 3, right: 5 } });
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: 'October' }));
        expect(onSelect).toHaveBeenCalledWith({ currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 10, right: 10 } });
    });

    it('YearAndMonth 通过 foundation 返回主面板', async () => {
        const onBackToMain = vi.fn<NonNullable<YearAndMonthProps['onBackToMain']>>();
        renderYearAndMonth({ onBackToMain });
        screen.getByRole('button', { name: 'Select Date' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 noBackBtn', () => {
        const { container } = renderYearAndMonth({ noBackBtn: true });
        expect(container.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('YearAndMonth 的年、月文案来自语言包', () => {
        renderYearAndMonth({ locale: zh_CN.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        expect(within(getYMLists()[1]).getByRole('option', { name: '7月' })).toBeInTheDocument();
    });

    it('YearAndMonth 在 ja_JP 下显示语言包的年后缀和月份名', () => {
        renderYearAndMonth({ locale: ja_JP.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', ja_JP.DatePicker.fullMonths[6]]);
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022' })).toBeInTheDocument();
    });

    it('YearAndMonth 的 compact 密度', () => {
        renderYearAndMonth({ density: 'compact' });
        expect(screen.getByRole('button', { name: 'Select Date' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-size-small`);
    });

    it('YearAndMonth 的 presetPosition 为 left', () => {
        renderYearAndMonth({ presetPosition: 'left', renderQuickControls: () => <div data-testid="quick">Quick</div>, renderDateInput: () => <div data-testid="date-input">DateInput</div> });
        const quick = screen.getByTestId('quick');
        expect(screen.getByTestId('date-input')).toBeInTheDocument();
        expect(quick.compareDocumentPosition(getYMLists()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('YearAndMonth 的 presetPosition 为 right', () => {
        renderYearAndMonth({ presetPosition: 'right', renderQuickControls: () => <div data-testid="quick">Quick</div> });
        const quick = screen.getByTestId('quick');
        expect(quick.compareDocumentPosition(getYMLists()[1]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('YearAndMonth 的 autoSelectMonth 与 disabledDate', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect, type: 'monthRange', currentMonth: { left: 1, right: 7 }, disabledDate: (date) => (date as Date).getMonth() === 0 });
        expect(within(getYMLists()[1]).getByRole('option', { name: 'January' })).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(onSelect).toHaveBeenLastCalledWith({ currentYear: { left: 2021, right: 2022 }, currentMonth: { left: 2, right: 7 } });
    });

    it('YearAndMonth 随 props 更新年月', () => {
        const { rerender } = renderYearAndMonth();
        expect(getYMSelected()).toEqual(['2021', 'June']);
        rerender({ currentMonth: { left: 3, right: 9 }, currentYear: { left: 2023, right: 2024 } });
        expect(getYMSelected()).toEqual(['2023', 'March']);
    });

    it('YearAndMonth 点击返回主面板按钮', async () => {
        const onBackToMain = vi.fn<NonNullable<YearAndMonthProps['onBackToMain']>>();
        renderYearAndMonth({ onBackToMain, noBackBtn: false });
        await userEvent.click(screen.getByRole('button', { name: 'Select Date' }));
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 disabledDate，右侧面板年份禁用', () => {
        renderYearAndMonth({ type: 'monthRange', disabledDate: () => false });
        const rightYears = getYMLists()[2];
        expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
        expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        expect(getYMLists()[3].querySelectorAll('li[aria-disabled="true"]')).toHaveLength(0);
    });
});

describe('DatePicker 输入框', () => {
    it('dateInput handleChange 触发 onChange', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, onChange });
        fireEvent.input(container.querySelector('input') as HTMLInputElement, { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
    });

    it('dateInput handleEnterPress 处理回车', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.input(input, { target: { value: '2021-06-1' } });
        expect(input).toHaveValue('2021-06-1');
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue(ymd(baseDate));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('范围输入框聚焦时触发 handleRangeInputFocus', () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onFocus });
        inputs(container)[0].focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('范围输入框按 Enter 时触发 handleRangeInputEnterPress', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false, onChange });
        const [startInput, endInput] = inputs(container);
        fireEvent.input(startInput, { target: { value: '2021-06-0' } });
        expect(startInput).toHaveValue('2021-06-0');
        await userEvent.type(startInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('结束输入框按 Tab', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], defaultOpen: true, motion: false });
        const endInput = inputs(container)[1];
        endInput.focus();
        fireEvent.keyDown(endInput, { key: 'Tab' });
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
        expect(getPopup()).not.toBeNull();
    });

    it('不同类型下 dateInput formatShowText', () => {
        const { container: dateContainer } = renderDatePicker({ type: 'date', defaultValue: baseDate, motion: false });
        expect(dateContainer.querySelector('input')).toHaveValue('2019-09-08');

        const { container: dateTimeContainer } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, motion: false });
        expect(dateTimeContainer.querySelector('input')).toHaveValue('2019-09-08 08:08:08');

        const { container: monthContainer } = renderDatePicker({ type: 'month', defaultValue: new Date(2021, 3), defaultOpen: true, motion: false });
        expect(monthContainer.querySelector('input')).toHaveValue('2021-04');
    });

    it('dateTime 类型的 insetInput 渲染日期与时间输入框', () => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        expect(within(getPopup()).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
        expect(within(getPopup()).getByPlaceholderText('HH:mm:ss')).toHaveValue('08:08:08');
        expect(insetInputs()).toHaveLength(2);
        expect(container.querySelector('input')).toHaveAttribute('readonly');
    });

    it('dateTime 类型的 insetInput onChange', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, onChange });
        fireEvent.input(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-06-15 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2021-06-15 08:08:08');
    });

    it('12 小时制 format 的 insetInput 改日期后保留下午的时间', () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: new Date(2021, 0, 1, 15, 30), defaultOpen: true, format: 'yyyy-MM-dd hh:mm a', insetInput: true, motion: false, onChange });
        const [dateInput, timeInput] = insetInputs();
        expect(timeInput).toHaveValue('15:30');
        fireEvent.input(dateInput, { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 15, 30), '2021-06-15 03:30 下午');
    });

    it('dateTimeRange 类型的 insetInput', () => {
        renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], defaultOpen: true, insetInput: true, motion: false });
        const dateInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        const timeInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        for (const input of timeInputs) {
            expect(input).toBeEnabled();
        }
        expect(insetInputs().map((input) => input.value)).toEqual(['2021-06-01', '10:00:00', '2021-06-15', '18:00:00']);
    });

    it('dateRange 类型的 insetInput', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], defaultOpen: true, insetInput: true, motion: false });
        const dateInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(within(getPopup()).queryByPlaceholderText('HH:mm:ss')).toBeNull();
        expect(getPopup().querySelector(`.${dp}-inset-input-separator`)).toHaveTextContent('-');
        for (const input of inputs(container)) {
            expect(input).toHaveAttribute('readonly');
        }
    });

    it('foundation openPanel 与 closePanel', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, onOpenChange });
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation handleInputComplete 处理合法输入', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.clear(input);
        await userEvent.type(input, '2021-06-15{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(input).toHaveValue('2021-06-15');
    });

    it('foundation handleInputComplete 输入为空时使用当前日期', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue(ymd(new Date()));
    });
});
