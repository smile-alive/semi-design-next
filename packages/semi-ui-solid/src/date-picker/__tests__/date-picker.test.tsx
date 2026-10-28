import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { add, addDays, addWeeks, endOfWeek, format, parse, set, startOfWeek } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { toIANA, zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import DatePicker, { type DatePickerProps, type PresetType } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import Popover from '../../popover';
import TimePicker from '../../time-picker';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseYear = 2019;
const baseDay = 8;
const baseMon = 8;
const baseDate = new Date(baseYear, baseMon, baseDay, 8, 8, 8, 8);

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
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const nthNext = (from: Element, n: number) => Array.from({ length: n }).reduce<Element>((cur) => cur.nextElementSibling as Element, from);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const getPopoverWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const navButton = (side: string, label: 'prevYear' | 'nextYear' | 'prevMonth' | 'nextMonth') => getPanel(side).querySelector(`[aria-label="${zh_CN.DatePicker[label]}"]`) as HTMLElement;

function getRandomIANATimeZone(): [string, number] {
    const offset = Math.floor(Math.random() * 26) - 11;
    return [toIANA(offset) as string, offset];
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker', () => {
    it('外观', () => {
        const { container } = renderDatePicker({ defaultValue: new Date() });
        expect(container.querySelectorAll(`.${dp}`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-clearable`)).toHaveLength(1);
    });

    it('defaultOpen 默认展开', async () => {
        renderDatePicker({ defaultValue: new Date(), defaultOpen: true, motion: false });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        fireEvent.mouseDown(document);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('open 展开状态', async () => {
        const defaultValue = new Date();
        const { rerender } = renderDatePicker({ defaultValue, motion: false, open: true });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await userEvent.click(document.body);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        rerender({ defaultValue, motion: false, open: false });
        await userEvent.click(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('presets 预设', async () => {
        const dayOffset = 1;
        const presets = [
            { text: 'Today', start: new Date(baseDate), end: new Date(baseDate) },
            { text: 'Next Day', start: addDays(new Date(baseDate), dayOffset), end: addDays(new Date(baseDate), dayOffset) },
        ];
        const defaultValue = addDays(new Date(baseDate), -dayOffset);

        const { container } = renderDatePicker({ defaultValue, motion: false, open: true, presets });
        const input = container.querySelector('input');
        const btns = getPresetButtons();

        await userEvent.click(btns[1]);
        expect(input).toHaveValue(ymd(addDays(defaultValue, dayOffset * 2)));
        expect(getSelectedDays()).toEqual([ymd(addDays(defaultValue, dayOffset * 2))]);

        await userEvent.click(btns[0]);
        expect(input).toHaveValue(ymd(baseDate));
        expect(getSelectedDays()).toEqual([ymd(baseDate)]);
    });

    it('value 值', async () => {
        const currentValue = new Date(baseDate);
        const dayOffset = 3;
        const onChange = vi.fn<ChangeHandler>();
        const [value, setValue] = createSignal<Date>(currentValue);

        const { container } = render(() => (
            <DatePicker
                value={value()}
                motion={false}
                open
                onChange={(date, str) => {
                    onChange(date, str);
                    setValue(date as Date);
                }}
            />
        ));
        expect(getSelectedDays()).toEqual([ymd(currentValue)]);

        await userEvent.click(getDay(ymd(addDays(currentValue, dayOffset))));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(currentValue.getDate() + dayOffset);
        expect(getSelectedDays()).toEqual([ymd(addDays(currentValue, dayOffset))]);
        expect(container.querySelector('input')).toHaveValue(ymd(addDays(currentValue, dayOffset)));
    });

    it('父组件挂载时就改了 value，之后改回原值时输入框跟随', () => {
        const first = new Date(2021, 0, 1);
        const second = new Date(2021, 1, 2);
        const [value, setValue] = createSignal(first);
        function Demo() {
            onMount(() => setValue(second));
            return <DatePicker value={value()} open motion={false} />;
        }
        const { container } = render(() => <Demo />);
        const input = container.querySelector('input');
        expect(input).toHaveValue(ymd(second));
        expect(getSelectedDays()).toEqual([ymd(second)]);
        setValue(first);
        expect(input).toHaveValue(ymd(first));
        expect(getSelectedDays()).toEqual([ymd(first)]);
    });

    it('needConfirm 需确认', async () => {
        const currentValue = new Date(baseDate);
        const dayOffset = 3;
        const nextDay = addDays(currentValue, dayOffset);
        const valueFormat = strings.FORMAT_DATE_TIME;
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();

        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: currentValue, motion: false, needConfirm: true, open: true, onConfirm });
        const input = container.querySelector('input');
        const btns = getFooterButtons();
        expect(btns).toHaveLength(2);

        await userEvent.click(getDay(ymd(nextDay)));
        expect(getSelectedDays()).toEqual([ymd(nextDay)]);
        expect(onConfirm).not.toHaveBeenCalled();

        await userEvent.click(btns[0]);
        expect(input).toHaveValue(format(currentValue, valueFormat));
        await waitFor(() => expect(getSelectedDays()).toEqual([ymd(currentValue)]));

        await userEvent.click(btns[1]);
        expect(input).toHaveValue(format(currentValue, valueFormat));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect((onConfirm.mock.calls[0][0] as Date).getDate()).toBe(currentValue.getDate());

        await userEvent.click(getDay(ymd(nextDay)));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        await userEvent.click(btns[1]);
        expect(onConfirm).toHaveBeenCalledTimes(2);
        expect((onConfirm.mock.calls[1][0] as Date).getDate() - currentValue.getDate()).toBe(dayOffset);
        expect(input).toHaveValue(format(nextDay, valueFormat));
    });

    it('事件', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const onChange = vi.fn<ChangeHandler>();

        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: new Date(baseDate), motion: false, needConfirm: true, onChange, onOpenChange });

        await userEvent.click(document.body);
        expect(onOpenChange).not.toHaveBeenCalled();

        const inputWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement;
        await userEvent.click(inputWrapper.parentElement as HTMLElement);
        expect(onOpenChange).toHaveBeenCalledWith(true);

        fireEvent.input(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`) as HTMLInputElement, { target: { value: '2019-10-02 08:30:02' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-02 08:30:02');
    });

    it('范围选择器', async () => {
        const dayOffset = 3;
        const leftPrevClickTimes = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];
        const onChange = vi.fn<ChangeHandler>();

        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: currentValue, defaultOpen: true, motion: false, needConfirm: false, onChange });

        const startDayDom = document.querySelector(`.${dp}-day-selected-start`) as Element;
        const endDayDom = document.querySelector(`.${dp}-day-selected-end`);
        expect(nthNext(startDayDom, dayOffset)).toBe(endDayDom);

        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        for (let i = 0; i < leftPrevClickTimes; i++) {
            await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        }

        const [startInput, endInput] = inputs(container);
        startInput.focus();
        await userEvent.click(getWeekDays('left', 1)[0]);
        endInput.focus();
        await userEvent.click(getWeekDays('left', 1)[dayOffset]);

        const value = onChange.mock.calls[onChange.mock.calls.length - 1][0] as Date[];
        const startDay = 2;
        expect(value[0].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[0].getDate()).toBe(startDay);
        expect(value[1].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[1].getDate()).toBe(startDay + dayOffset);
        expect(startInput.value.startsWith('2019-06-02')).toBe(true);
        expect(endInput.value.startsWith('2019-06-05')).toBe(true);
    });

    it('范围类型传 role 时落在根元素，不被 group 覆盖', () => {
        const { container } = renderDatePicker({ type: 'dateRange', 'aria-label': '期间', role: 'toolbar' });
        expect(container.firstElementChild).toHaveAttribute('role', 'toolbar');
        expect(container.querySelector('[role="group"]')).toBeNull();
    });

    it('范围选择器中切换面板', async () => {
        const dayOffset = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];

        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: currentValue, defaultOpen: true, motion: false, needConfirm: false });
        const [startInput, endInput] = inputs(container);

        startInput.focus();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.click(getWeekDays('left', 1)[dayOffset]);
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('起始值大于结束值时，范围选择器切换面板', async () => {
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + 3)];

        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: currentValue, defaultOpen: true, motion: false, needConfirm: false });
        const [startInput, endInput] = inputs(container);

        startInput.focus();
        await userEvent.click(getWeekDays('left', 2)[0]);
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2019-09-15');
        expect(endInput).toHaveValue('');
    });

    it('年份或月份选择器', async () => {
        const monOffset = 2;
        const yearOffset = 3;
        const onChange = vi.fn<ChangeHandler>();

        const { container } = renderDatePicker({ type: 'month', defaultValue: new Date(baseDate), defaultOpen: true, motion: false, onChange });

        const [yearList, monthList] = getYMLists();
        const currentSelectedYear = yearList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element;
        await userEvent.click(nthNext(currentSelectedYear, yearOffset));

        const currentSelectedMon = monthList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element;
        await userEvent.click(nthNext(currentSelectedMon, monOffset));

        const value = onChange.mock.calls[onChange.mock.calls.length - 1][0] as Date;
        expect(value.getFullYear()).toBe(baseYear + yearOffset);
        expect(value.getMonth()).toBe(baseMon + monOffset);
        expect(container.querySelector('input')).toHaveValue(format(new Date(baseYear + yearOffset, baseMon + monOffset), 'yyyy-MM'));
    });

    it('周选择', async () => {
        const { container } = renderDatePicker({
            type: 'dateRange',
            defaultOpen: true,
            endDateOffset: (date) => endOfWeek(date as Date, { weekStartsOn: 1 }),
            startDateOffset: (date) => startOfWeek(date as Date, { weekStartsOn: 1 }),
            weekStartsOn: 1,
        });

        await userEvent.click(getWeekDays('left', 1)[3]);

        const now = new Date();
        const monthFirstDay = add(new Date(now.getFullYear(), 0, 1, 0, 0, 0), { months: now.getMonth() });
        const clickDay = addDays(startOfWeek(addWeeks(monthFirstDay, 1), { weekStartsOn: 1 }), 3);
        const [startInput, endInput] = inputs(container);

        expect(startInput).toHaveValue(ymd(startOfWeek(clickDay, { weekStartsOn: 1 })));
        expect(endInput).toHaveValue(ymd(endOfWeek(clickDay, { weekStartsOn: 1 })));
    });

    it('周选择在 UTC 以西时区点击周三得到完整的一周', async () => {
        const originalTZ = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            const { container } = renderDatePicker({
                type: 'dateRange',
                defaultOpen: true,
                defaultPickerValue: '2021-06-01',
                endDateOffset: (date) => endOfWeek(date as Date, { weekStartsOn: 1 }),
                motion: false,
                startDateOffset: (date) => startOfWeek(date as Date, { weekStartsOn: 1 }),
                weekStartsOn: 1,
            });
            await userEvent.click(getDay('2021-06-16'));
            const [startInput, endInput] = inputs(container);
            expect(startInput).toHaveValue('2021-06-14');
            expect(endInput).toHaveValue('2021-06-20');
        } finally {
            process.env.TZ = originalTZ;
        }
    });

    it('autofocus 自动聚焦', () => {
        const { container } = renderDatePicker({ autofocus: true, motion: false });
        const { container: container2 } = renderDatePicker({ autofocus: false, motion: false });

        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(1);
        expect(container2.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(0);
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('自定义 dropdownClassName 与 dropdownStyle', () => {
        renderDatePicker({ dropdownClassName: 'my-datePicker', dropdownStyle: { color: 'red' }, defaultOpen: true, motion: false });
        const dropdown = document.querySelector('.my-datePicker');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('onClear', () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container } = renderDatePicker({ defaultOpen: true, motion: false, autofocus: true, defaultValue: baseDate, showClear: true, onClear });
        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('输入禁用日期不触发 onChange', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({
            defaultOpen: true,
            motion: false,
            value: '2021-04-12',
            onChange,
            disabledDate: (date) => (date as Date).getDate() === 15,
        });
        const input = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`) as HTMLInputElement;
        fireEvent.input(input, { target: { value: '2021-04-15' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.input(input, { target: { value: '2021-04-13' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-04-13');
    });

    it('点击预设的禁用日期不触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = '2021-04-12';
        const notDisabledValue = '2021-04-30';
        const defaultDate = new Date(`${defaultValue} 00:00:00`);
        const notDisabledDate = new Date(`${notDisabledValue} 00:00:00`);
        const { container } = renderDatePicker({
            open: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (date) => (date as Date).getDate() === 15,
            presets: [
                { text: 'disabled date', start: new Date('2021-04-15 00:00:00') },
                { text: 'valid date', start: notDisabledValue },
            ],
        });
        const input = container.querySelector('input');
        const btns = getPresetButtons();

        await userEvent.click(btns[0]);
        expect(input).toHaveValue(ymd(defaultDate));
        expect(getSelectedDays()).toEqual([ymd(defaultDate)]);
        expect(onChange).not.toHaveBeenCalled();

        await userEvent.click(btns[1]);
        expect(input).toHaveValue(ymd(notDisabledDate));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getDate()).toEqual(notDisabledDate.getDate());
    });

    it('切换 timeZone 时 inputValue 正确', async () => {
        const today = set(new Date(), { hours: 22, minutes: 0, seconds: 0 });
        const [originZone, originOffset] = getRandomIANATimeZone();
        const [newZone, newOffset] = getRandomIANATimeZone();
        const [timeZone, setTimeZone] = createSignal(originZone);

        const { container } = render(() => (
            <ConfigProvider timeZone={timeZone()}>
                <DatePicker type="dateTime" defaultOpen defaultPickerValue={today} motion={false} />
            </ConfigProvider>
        ));

        const days = document.querySelectorAll(`.${dp}-day`);
        await userEvent.click(days[6]);
        expect(document.querySelectorAll(`.${dp}-day-selected`)).toHaveLength(1);
        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
        const selectedDay = parse(input.value, strings.FORMAT_DATE_TIME, new Date());
        expect(ymd(selectedDay)).toBe(days[6].getAttribute('aria-label'));
        expect(format(selectedDay, 'HH:mm:ss')).toBe('22:00:00');
        setTimeZone(newZone);
        expect(input.value).toEqual(format(add(selectedDay, { hours: newOffset - originOffset }), strings.FORMAT_DATE_TIME));
    });

    it('受控模式下切换 timeZone 时 inputValue 正确', () => {
        const now = new Date();
        const [originZone, originOffset] = getRandomIANATimeZone();
        const [newZone, newOffset] = getRandomIANATimeZone();
        const [timeZone, setTimeZone] = createSignal(originZone);
        const value = zonedTimeToUtc(now, originZone);

        const { container } = render(() => (
            <ConfigProvider timeZone={timeZone()}>
                <DatePicker type="dateTime" value={value} defaultOpen motion={false} />
            </ConfigProvider>
        ));

        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
        expect(input.value).toEqual(format(now, strings.FORMAT_DATE_TIME));
        setTimeZone(newZone);
        expect(input.value).toEqual(format(add(now, { hours: newOffset - originOffset }), strings.FORMAT_DATE_TIME));
    });

    it('默认 locale 格式', () => {
        const localeFormat = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');

        const { container } = renderDatePicker({ defaultValue, format: localeFormat });
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(format(defaultValue, localeFormat, { locale: zhCN }));
    });

    it('enUS locale 格式', () => {
        const localeFormat = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');

        const { container } = render(() => (
            <LocaleProvider locale={en_US}>
                <DatePicker defaultValue={defaultValue} format={localeFormat} />
            </LocaleProvider>
        ));
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(format(defaultValue, localeFormat, { locale: enUS }));
    });

    it('onPresetClick', async () => {
        const presets = [
            { text: 'Today', start: new Date(baseDate), end: new Date(baseDate) },
            { text: 'Next Day', start: addDays(new Date(baseDate), 1), end: addDays(new Date(baseDate), 1) },
        ];
        const handlePresetClick = vi.fn<(item: PresetType, e: MouseEvent) => string>((_item, e) => e.type);

        renderDatePicker({ defaultValue: addDays(new Date(baseDate), -1), motion: false, open: true, presets, onPresetClick: handlePresetClick });

        const btns = getPresetButtons();
        await userEvent.click(btns[0]);
        await userEvent.click(btns[1]);
        expect(handlePresetClick).toHaveBeenCalledTimes(2);
        expect(handlePresetClick.mock.calls[0][0]).toEqual(presets[0]);
        expect(handlePresetClick.mock.calls[1][0]).toEqual(presets[1]);
        expect(handlePresetClick.mock.results.map((r) => r.value)).toEqual(['click', 'click']);
    });

    it('范围类型点击一个日期时不触发 notifyChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const [value, setValue] = createSignal<DatePickerProps['value']>(undefined);
        const { container } = render(() => (
            <DatePicker
                type="dateRange"
                value={value()}
                defaultOpen
                defaultPickerValue="2021-08-13"
                motion={false}
                onChange={(date, str) => {
                    onChange(date, str);
                    setValue(date);
                }}
            />
        ));
        const [startInput, endInput] = inputs(container);

        startInput.focus();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).not.toHaveBeenCalled();
        endInput.focus();
        await userEvent.click(getWeekDays('left', 1)[2]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [rangeStart, rangeEnd] = onChange.mock.calls[0][0] as Date[];
        expect(ymd(rangeStart)).toBe('2021-08-08');
        expect(ymd(rangeEnd)).toBe('2021-08-10');
        expect(startInput).toHaveValue('2021-08-08');
        expect(endInput).toHaveValue('2021-08-10');
    });

    // a range end outside the disabled month (August) stays selectable
    it('rangeStart 禁用时仍可选择 rangeEnd', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = ['2021-08-06', '2021-08-15'];
        const { container } = renderDatePicker({
            type: 'dateRange',
            defaultOpen: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (date) => (date as Date).getMonth() === 7,
            style: { width: '300px' },
        });
        const [startInput, endInput] = inputs(container);

        endInput.focus();
        // 2021-09-10
        await userEvent.click(getWeekDays('right', 1)[5]);

        expect(onChange).toHaveBeenCalledTimes(1);
        const value = onChange.mock.calls[0][0] as Date[];
        expect(value[0].getMonth()).toBe(7);
        expect(value[0].getDate()).toBe(6);
        expect(value[1].getMonth()).toBe(8);
        expect(value[1].getDate()).toBe(10);
        expect(startInput).toHaveValue(defaultValue[0]);
        expect(endInput).toHaveValue('2021-09-10');
    });

    it('禁用的多选', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({
            type: 'date',
            multiple: true,
            defaultOpen: true,
            motion: false,
            defaultValue: ['2021-08-06', '2021-08-15'],
            onChange,
            disabledDate: (date) => (date as Date).getDate() > 20 && (date as Date).getDate() < 25,
            style: { width: '300px' },
        });
        const input = container.querySelector('input');

        await userEvent.click(getWeekDays('left', 1)[2]);

        expect(getSelectedDays()).toEqual(['2021-08-06', '2021-08-10', '2021-08-15']);
        const value = onChange.mock.calls[0][0] as Date[];
        expect(value.length).toBe(3);
        expect(value[2].getMonth()).toBe(7);
        expect(value[2].getDate()).toBe(10);
        expect(input).toHaveValue('2021-08-06,2021-08-15,2021-08-10');
        expect(onChange).toHaveBeenCalledTimes(1);

        await userEvent.click(getWeekDays('left', 2)[6]);

        expect(getSelectedDays()).toEqual(['2021-08-06', '2021-08-10', '2021-08-15']);
        expect(input).toHaveValue('2021-08-06,2021-08-15,2021-08-10');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('禁用时间的回调', async () => {
        const disabledTime = vi.fn<(date?: Date | Date[], panelType?: string) => { disabledHours: () => number[] }>((_date, panelType) => ({
            disabledHours: () => (panelType === 'left' ? [17, 18] : [12, 13, 14, 15, 16, 17, 18]),
        }));
        const props: DatePickerProps = {
            type: 'dateTimeRange',
            defaultValue: ['2021-09-08', '2021-10-03'],
            defaultOpen: true,
            motion: false,
            disabledTime,
            style: { width: '400px' },
            timePickerOpts: { scrollItemProps: { cycled: false } },
        };
        const { rerender } = renderDatePicker(props);
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`) as HTMLElement);
        const args = disabledTime.mock.lastCall as Parameters<typeof disabledTime>;
        expect((args[0] as Date[]).length).toBe(2);
        expect(args[1]).toBe('left');

        rerender({ ...props, type: 'dateTime' });
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`) as HTMLElement);
        const args2 = disabledTime.mock.lastCall as Parameters<typeof disabledTime>;
        expect(Array.isArray(args2[0])).toBe(false);
        expect(args2[1]).toBe('left');
    });

    it('rangeSeparator 分隔符', () => {
        const props: DatePickerProps = { type: 'dateRange', motion: false, defaultValue: ['2021-08-06', '2021-08-15'], style: { width: '300px' }, rangeSeparator: '-' };
        render(() => (
            <div>
                <DatePicker {...props} />
                <DatePicker {...props} type="dateTimeRange" />
            </div>
        ));
        const allSeparators = document.querySelectorAll(`.${dp}-range-input-separator`);
        expect(allSeparators[0].textContent?.trim()).toBe('-');
        expect(allSeparators[1].textContent?.trim()).toBe('-');
    });

    it('输入年份长度超过 4 位', () => {
        const handleChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, defaultOpen: true, defaultValue: '2021-12-21', onChange: handleChange });

        fireEvent.input(container.querySelector('input') as HTMLInputElement, { target: { value: '20221-12-21' } });
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('点击上一年与下一年按钮', async () => {
        renderDatePicker({ type: 'dateRange', motion: false, style: { width: '300px' }, defaultPickerValue: new Date('2021-12-01'), defaultOpen: true });

        await userEvent.click(navButton('left', 'prevYear'));
        expect(getNavTitle('left')).toBe('2020年 12月');
        await userEvent.click(navButton('left', 'nextYear'));
        expect(getNavTitle('left')).toBe('2021年 12月');

        await userEvent.click(navButton('right', 'nextYear'));
        expect(getNavTitle('right')).toBe('2023年 1月');
        await userEvent.click(navButton('right', 'prevYear'));
        expect(getNavTitle('right')).toBe('2022年 1月');
    });

    it.each(['dateRange', 'dateTimeRange'] as const)('%s 类型下月份同步切换', async (type) => {
        renderDatePicker({ type, motion: false, style: { width: '300px' }, defaultPickerValue: new Date('2021-12-01'), defaultOpen: true });

        await userEvent.click(navButton('left', 'nextMonth'));
        expect(getNavTitle('left')).toBe('2022年 1月');
        expect(getNavTitle('right')).toBe('2022年 2月');
        await userEvent.click(navButton('right', 'prevMonth'));
        expect(getNavTitle('left')).toBe('2021年 12月');
        expect(getNavTitle('right')).toBe('2022年 1月');

        await userEvent.click(navButton('left', 'prevMonth'));
        expect(getNavTitle('left')).toBe('2021年 11月');
    });

    it('预设值为 null', async () => {
        const handleChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({
            presets: [{ text: 'Today', start: null, end: null }],
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            type: 'dateRange',
            onChange: handleChange,
        });

        await userEvent.click(getPresetButtons()[0]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect((handleChange.mock.calls[0][0] as Date[]).length).toEqual(0);
        await waitFor(() => expect(getPopup()).toBeNull());
        for (const input of inputs(container)) {
            expect(input).toHaveValue('');
        }
    });

    it('预设值为 null 且 needConfirm', async () => {
        const handleChange = vi.fn<ChangeHandler>();
        const handleConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        renderDatePicker({
            presets: [{ text: 'Today', start: null, end: null }],
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            type: 'dateTimeRange',
            needConfirm: true,
            onChange: handleChange,
            onConfirm: handleConfirm,
        });

        await userEvent.click(getPresetButtons()[0]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect((handleChange.mock.calls[0][0] as Date[]).length).toBe(0);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getFooterButtons()[1]);
        expect(handleConfirm).toHaveBeenCalledTimes(1);
        expect((handleConfirm.mock.calls[0][0] as Date[]).length).toBe(0);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('dateRange 的 triggerRender 点击后打开面板，选完两端后关闭', async () => {
        renderDatePicker({ type: 'dateRange', motion: false, triggerRender: (p) => <button type="button">{p.placeholder}</button> });
        await userEvent.click(screen.getByRole('button'));
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('right', 1)[0]);

        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('month 类型', () => {
        renderDatePicker({ type: 'month', defaultOpen: true, motion: false });

        expect(getPopup()).toHaveAttribute('x-type', 'month');
        expect(getYMLists()).toHaveLength(2);
    });

    it('disabled 属性', () => {
        const { container } = renderDatePicker({ disabled: true, defaultValue: baseDate, motion: false });

        expect(container.querySelector('input')).toBeDisabled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
    });

    it('placeholder 属性', () => {
        renderDatePicker({ placeholder: '请选择日期', motion: false });
        expect(screen.getByPlaceholderText('请选择日期')).toBeInTheDocument();
    });

    it('prefix 与 insetLabel', () => {
        const { container } = renderDatePicker({ prefix: <span class="custom-prefix">前缀</span>, insetLabel: '日期', motion: false });

        expect(container.querySelector('.custom-prefix')).toHaveTextContent('前缀');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).not.toBeNull();
    });

    it('范围类型的 prefix 为 0 时照常渲染', () => {
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, prefix: 0 });
        expect(container.querySelector(`.${dp}-range-input-prefix`)?.textContent).toBe('0');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('borderless 属性', () => {
        const { container } = renderDatePicker({ borderless: true, defaultValue: baseDate, motion: false });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
    });

    it('validateStatus', () => {
        const { container } = renderDatePicker({ validateStatus: 'error', defaultValue: baseDate, motion: false });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
    });

    it('size 属性', () => {
        const { container } = renderDatePicker({ size: 'small', defaultValue: baseDate, motion: false });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
    });

    it('多选', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'date', multiple: true, defaultOpen: true, motion: false, onChange, defaultPickerValue: '2021-08-01' });

        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);

        await userEvent.click(getWeekDays('left', 1)[1]);
        expect(onChange).toHaveBeenCalledTimes(2);

        expect((onChange.mock.calls[1][0] as Date[]).length).toBe(2);
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
        expect(container.querySelector('input')).toHaveValue('2021-08-08,2021-08-09');
        expect(getPopup()).not.toBeNull();
    });

    it('format 不含时间标记时，dateTime 降级为 date', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, format: 'yyyy-MM-dd', motion: false, onChange });
        expect(getPopup()).toHaveAttribute('x-type', 'date');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('format 不含时间标记时，dateTimeRange 降级为 dateRange', () => {
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(baseDate), addDays(new Date(baseDate), 5)], defaultOpen: true, format: 'yyyy-MM-dd', motion: false });
        expect(getPopup()).toHaveAttribute('x-type', 'dateRange');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue(ymd(baseDate));
        expect(endInput).toHaveValue(ymd(addDays(baseDate, 5)));
    });

    it('format 含时间标记时保留 dateTime 类型', () => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, format: 'yyyy-MM-dd HH:mm', motion: false });
        expect(getPopup()).toHaveAttribute('x-type', 'dateTime');
        expect(getPopup()?.querySelector(`.${dp}-switch-time`)).not.toBeNull();
        expect(container.querySelector('input')).toHaveValue(format(baseDate, 'yyyy-MM-dd HH:mm'));
    });

    it('insetInput 设置默认位置', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', strings.POSITION_INLINE_INPUT);
    });

    it('position 含 Over 时 insetInput 设置间距', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, position: 'leftTopOver' });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'leftTopOver');
    });

    it('position 不含 Over 时的 insetInput', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false, position: 'bottomLeft' });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('rangeSeparator 去除首尾空白', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(baseDate), addDays(new Date(baseDate), 5)], defaultOpen: true, motion: false, rangeSeparator: ' - ', onChange });
        expect(container.querySelector(`.${dp}-range-input-separator`)?.textContent).toBe(' - ');
        const [startInput, endInput] = inputs(container);
        fireEvent.input(endInput, { target: { value: ymd(addDays(baseDate, 6)) } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(baseDate), ymd(addDays(baseDate, 6))]);
        expect(startInput).toHaveValue(ymd(baseDate));
    });

    it('monthRange 类型', () => {
        renderDatePicker({ type: 'monthRange', defaultOpen: true, motion: false });
        expect(getPopup()).toHaveAttribute('x-type', 'monthRange');
        expect(getYMLists()).toHaveLength(4);
    });

    it('month 类型的默认值与选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ type: 'month', defaultValue: new Date(2021, 5), defaultOpen: true, motion: false, onChange });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '3月' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-03');
        expect(getYMSelected()).toEqual(['2021年', '3月']);
        expect(container.querySelector('input')).toHaveValue('2021-03');
    });

    it('dateRange 的 defaultValue', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)], defaultOpen: true, motion: false });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inrange`);
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('dateTimeRange 的 defaultValue', () => {
        const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue: [new Date(2021, 7, 1, 10, 0, 0), new Date(2021, 7, 15, 18, 0, 0)], defaultOpen: true, motion: false });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('2021-08-01 10:00:00');
        expect(endInput).toHaveValue('2021-08-15 18:00:00');
    });

    it('切换上一月与下一月', async () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getNavTitle('left')).toBe('2019年 9月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
    });

    it('点击年月文字打开年月选择器', async () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        expect(getPopup()?.querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getYMSelected()).toEqual(['2019年', '9月']);
        // the clicked navigation is removed from the DOM, which must not count as a click outside
        expect(getPopup()).not.toBeNull();
    });

    it('打开年月选择器与返回日期面板的点击仍传到 document 的 click 监听', async () => {
        const onDocumentClick = vi.fn<(e: MouseEvent) => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            // Popover stops click propagation unless stopPropagation is false
            renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, stopPropagation: false });
            await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
            expect(onDocumentClick).toHaveBeenCalledTimes(1);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.selectDate }));
            expect(onDocumentClick).toHaveBeenCalledTimes(2);
            expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        } finally {
            document.removeEventListener('click', onDocumentClick);
        }
    });

    it('dateTime 类型显示时间选择器', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');

        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getPopup()).not.toBeNull();

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup()?.querySelector(`.${dp}-tpk`)).not.toBeNull();
    });

    it('disabledDate 属性', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, disabledDate: (date) => (date as Date).getDay() === 0 || (date as Date).getDay() === 6, motion: false });

        expect(getDay('2019-09-07')).toHaveClass(`${dp}-day-disabled`);
        expect(getDay('2019-09-07')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-09')).not.toHaveClass(`${dp}-day-disabled`);
        expect(getPopup()?.querySelectorAll(`.${dp}-day-disabled`)).toHaveLength(9);
    });

    it('点击外部关闭面板时 onBlur 收到原生 mousedown 事件', async () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const onClickOutSide = vi.fn<NonNullable<DatePickerProps['onClickOutSide']>>();
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onBlur, onClickOutSide });
        fireEvent.mouseDown(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        const [blurEvent] = onBlur.mock.calls[0];
        expect(blurEvent).toBeInstanceOf(MouseEvent);
        expect(blurEvent?.type).toBe('mousedown');
        const [outsideEvent] = onClickOutSide.mock.calls[0];
        expect(outsideEvent).toBeInstanceOf(MouseEvent);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('stopPropagation 为 false 时，在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        render(() => (
            <DatePicker
                defaultOpen
                motion={false}
                stopPropagation={false}
                topSlot={
                    <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} stopPropagation={false} trigger="click">
                        <button type="button">nested trigger</button>
                    </Popover>
                }
            />
        ));
        fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('stopPropagation 为 false 时，在面板内 TimePicker 的面板内按下鼠标不关闭 DatePicker', async () => {
        render(() => <DatePicker defaultOpen motion={false} stopPropagation={false} topSlot={<TimePicker aria-label="nested time" defaultOpen motion={false} stopPropagation={false} />} />);
        const timePanel = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-timepicker-panel`);
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });
        fireEvent.mouseDown(timePanel);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('Esc 或选中日期关闭面板时 onBlur 没有事件参数', async () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { unmount } = renderDatePicker({ defaultValue: new Date(2019, 8, 11), defaultOpen: true, motion: false, onBlur });
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        expect(onBlur.mock.calls).toEqual([[undefined]]);
        unmount();

        onBlur.mockClear();
        renderDatePicker({ defaultValue: new Date(2019, 8, 11), defaultOpen: true, motion: false, onBlur });
        await userEvent.click(getDay('2019-09-12'));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onBlur.mock.calls).toEqual([[undefined]]);
    });

    it('onClear 回调', () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, motion: false, onChange, onClear });

        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('compact 密度', () => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, density: 'compact', motion: false });
        expect(getPopup()).toHaveClass(`${dp}-compact`);
    });

    it('needConfirm 的取消按钮', async () => {
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        renderDatePicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, needConfirm: true, onCancel });

        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toEqual(baseDate);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('受控 panelShow 与 onOpenChange', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { rerender } = renderDatePicker({ defaultValue: baseDate, motion: false, open: false, onOpenChange });

        expect(getPopup()).toBeNull();

        rerender({ defaultValue: baseDate, motion: false, open: true, onOpenChange });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        rerender({ defaultValue: baseDate, motion: false, open: false, onOpenChange });
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('triggerRender 属性', async () => {
        const { container } = renderDatePicker({
            motion: false,
            triggerRender: (p) => (
                <button type="button" class="custom-trigger">
                    {p.placeholder || 'Select Date'}
                </button>
            ),
        });

        expect(container.querySelector('.custom-trigger')).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();

        await userEvent.click(container.querySelector('.custom-trigger') as HTMLElement);
        expect(getPopup()).not.toBeNull();
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
        renderDatePicker({
            motion: false,
            triggerRender: () => (
                <div class="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onPress} />
                </div>
            ),
        });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopup()).toBeNull();
    });

    it.each(['{Enter}', ' '])('triggerRender 自带可聚焦按钮时，Tab 到按钮后按 %j 打开面板', async (key) => {
        renderDatePicker({ motion: false, triggerRender: () => <button type="button">pick</button> });

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.keyboard(key);
        expect(getPopup()).not.toBeNull();
    });

    it('dateRange 的 triggerRender 替换两个范围输入框', () => {
        const { container } = renderDatePicker({
            type: 'dateRange',
            motion: false,
            triggerRender: (p) => (
                <button type="button" class="custom-range-trigger">
                    {p.placeholder || 'Select Range'}
                </button>
            ),
        });

        expect(container.querySelector('.custom-range-trigger')).not.toBeNull();
        expect(container.querySelector(`.${dp}-range-input`)).toBeNull();
        expect(container.querySelector('input')).toBeNull();
    });

    it('onChange 的参数依次为 date 与 dateString', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ defaultOpen: true, defaultPickerValue: '2021-08-01', motion: false, onChange });

        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
        expect(onChange.mock.calls[0][1]).toBe('2021-08-08');
    });

    it.each(['left', 'right'] as const)('presetPosition 为 %s', (presetPosition) => {
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, presetPosition, presets: [{ text: 'Today', start: new Date(), end: new Date() }] });
        expect(getPopup()?.querySelector(`.${dp}-quick-control-${presetPosition}`)).toHaveTextContent('Today');
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', presetPosition);
    });

    it('输入合法日期时 input 值变化', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, onChange });

        fireEvent.input(container.querySelector('input') as HTMLInputElement, { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-08-15');
    });

    it('输入非法日期时 input 值变化', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, onChange });

        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.input(input, { target: { value: 'invalid-date' } });
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('invalid-date');
    });

    it('dateRange 输入框聚焦', () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)], defaultOpen: true, motion: false });
        const [startInput, endInput] = inputs(container);
        const startWrapper = container.querySelector(`.${dp}-range-input-wrapper-start`);
        const endWrapper = container.querySelector(`.${dp}-range-input-wrapper-end`);

        startInput.focus();
        expect(startWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        endInput.focus();
        expect(startWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('monthRange 的 defaultValue', () => {
        const { container } = renderDatePicker({ type: 'monthRange', defaultValue: [new Date(2021, 0), new Date(2021, 6)], defaultOpen: true, motion: false });
        expect(getYMSelected()).toEqual(['2021年', '1月', '2021年', '7月']);
        expect(container.querySelector('input')).toHaveValue('2021-01 ~ 2021-07');
    });

    it('多选与 max 属性', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ type: 'date', max: 2, multiple: true, defaultOpen: true, defaultPickerValue: '2021-08-01', motion: false, onChange });

        const days = getWeekDays('left', 1);
        await userEvent.click(days[0]);
        await userEvent.click(days[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        await userEvent.click(days[2]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
    });

    it('dateRange 的 startDateOffset 与 endDateOffset', async () => {
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-08-01',
            endDateOffset: (date) => endOfWeek(date as Date),
            motion: false,
            startDateOffset: (date) => startOfWeek(date as Date),
            onChange,
        });

        await userEvent.click(getWeekDays('left', 2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2021-08-15', '2021-08-21']);
    });

    it('showClear 属性', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container, rerender } = renderDatePicker({ defaultValue: baseDate, motion: false, showClear: true, onClear });
        const inputWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement;
        await userEvent.hover(inputWrapper);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();

        rerender({ defaultValue: baseDate, motion: false, showClear: false, onClear });
        await userEvent.hover(inputWrapper);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('autoSwitchDate 为 false', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, autoSwitchDate: false, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });
});
