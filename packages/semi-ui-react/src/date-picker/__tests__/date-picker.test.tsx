import React, { StrictMode, useState } from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, startOfWeek, endOfWeek, add, format, addWeeks, set, parse } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import * as formatterModule from '@fibrae/semi-foundation/date-picker/_utils/formatter';
import * as getDefaultPickerDateModule from '@fibrae/semi-foundation/date-picker/_utils/get-default-picker-date';
import * as getFullDateOffsetModule from '@fibrae/semi-foundation/date-picker/_utils/get-full-date-offset';
import * as getInsetInputValueFromInsetInputStrModule from '@fibrae/semi-foundation/date-picker/_utils/get-inset-input-value-from-inset-input-str';
import * as getYearsModule from '@fibrae/semi-foundation/date-picker/_utils/get-years';
import * as isAfterModule from '@fibrae/semi-foundation/date-picker/_utils/is-after';
import * as isBeforeModule from '@fibrae/semi-foundation/date-picker/_utils/is-before';
import * as isBetweenModule from '@fibrae/semi-foundation/date-picker/_utils/is-between';
import * as isSameDayModule from '@fibrae/semi-foundation/date-picker/_utils/is-same-day';
import * as parserModule from '@fibrae/semi-foundation/date-picker/_utils/parser';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import DatePickerFoundation from '@fibrae/semi-foundation/date-picker/foundation';
import MonthFoundation from '@fibrae/semi-foundation/date-picker/month-foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { toIANA, zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import { Form } from '@fibrae/semi-ui-react/form';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import Popover from '@fibrae/semi-ui-react/popover';
import Tabs from '@fibrae/semi-ui-react/tabs';
import TimePicker from '@fibrae/semi-ui-react/time-picker';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import { countLiveListeners } from '@test/utils/react';
import DatePicker, { type DatePickerHandle, type DatePickerProps, type DisabledDateType, type PresetType, type TriggerRenderProps, type YearAndMonthProps } from '../index';
import * as yearAndMonthModule from '../year-and-month';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseYear = 2019;
const baseDay = 8;
const baseMon = 8;
const baseDate = new Date(baseYear, baseMon, baseDay, 8, 8, 8, 8);

const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${BASE_CLASS_PREFIX}-datepicker`;
const dp = `${BASE_CLASS_PREFIX}-datepicker`;

const getPopup = () => document.querySelector<HTMLElement>(popupSelector);
// jsdom has no layout: Tooltip reports the panel visible only after a 100ms fallback timer.
// call watchPanelVisible before opening, then await settled() so focus changes land before asserting
const watchPanelVisible = () => {
    const spy = vi.spyOn(DatePickerFoundation.prototype, 'handlePanelVisibleChange');
    return {
        settled: () => waitFor(() => expect(spy).toHaveBeenCalledWith(true)),
        restore: () => spy.mockRestore(),
    };
};
const getPopoverWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`);
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getPresetButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`);
const getWeekDays = (side: string, weekIndex: number) => getPanel(side).querySelectorAll(`.${dp}-week`)[weekIndex].querySelectorAll<HTMLElement>(`.${dp}-day`);
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`).textContent;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);

const createDatePickerFoundation = (props, states = {}, adapter = {}) =>
    new DatePickerFoundation({
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => states[key],
        getStates: () => states,
        ...adapter,
    } as unknown as ConstructorParameters<typeof DatePickerFoundation>[0]);

const YearAndMonth = yearAndMonthModule.default;
const yearAndMonthDefaultProps = {
    currentYear: { left: 2021, right: 2022 },
    currentMonth: { left: 6, right: 7 },
    onSelect: () => {},
    onBackToMain: () => {},
    locale: en_US.DatePicker,
    type: 'month' as const,
};
const renderYearAndMonth = (props: Partial<YearAndMonthProps> = {}) => render(<YearAndMonth {...yearAndMonthDefaultProps} {...props} />);

const getRandomIANATimeZone = function (): [string, number] {
    const TIME_ZONE = Array.from({ length: 26 }).map((_, index) => index - 11);
    const offset = Math.floor(Math.random() * TIME_ZONE.length);
    const timeZone = toIANA(TIME_ZONE[offset]);
    return [timeZone, offset];
};

describe(`DatePicker`, () => {
    it(`外观`, () => {
        const defaultValue = new Date();

        const { container } = render(<DatePicker defaultValue={defaultValue} />);
        expect(container.querySelectorAll(`.${dp}`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-clearable`)).toHaveLength(1);
    });

    it(`defaultOpen 默认展开`, async () => {
        const defaultValue = new Date();

        render(<DatePicker defaultValue={defaultValue} defaultOpen motion={false} />);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        fireEvent.mouseDown(document);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it(`open 展开状态`, async () => {
        const defaultValue = new Date();

        const { rerender } = render(<DatePicker defaultValue={defaultValue} motion={false} open />);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await userEvent.click(document.body);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        rerender(<DatePicker defaultValue={defaultValue} motion={false} open={false} />);
        await userEvent.click(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it(`presets 预设`, async () => {
        const dayOffset = 1;
        const presets = [
            {
                text: 'Today',
                start: new Date(baseDate),
                end: new Date(baseDate),
            },
            {
                text: 'Next Day',
                start: addDays(new Date(baseDate), dayOffset),
                end: addDays(new Date(baseDate), dayOffset),
            },
        ];
        const defaultValue = new Date(addDays(new Date(baseDate), -dayOffset));

        const { container } = render(<DatePicker defaultValue={defaultValue} motion={false} open presets={presets} />);
        const input = container.querySelector('input');
        const btns = getPresetButtons();

        await userEvent.click(btns[1]);
        expect(input).toHaveValue(ymd(addDays(defaultValue, dayOffset * 2)));
        expect(getSelectedDays()).toEqual([ymd(addDays(defaultValue, dayOffset * 2))]);

        await userEvent.click(btns[0]);
        expect(input).toHaveValue(ymd(baseDate));
        expect(getSelectedDays()).toEqual([ymd(baseDate)]);
    });

    it(`value 值`, async () => {
        const currentValue = new Date(baseDate);
        const dayOffset = 3;
        const onChange = vi.fn<ChangeHandler>();

        function Controlled() {
            const [value, setValue] = useState(currentValue);
            return (
                <DatePicker
                    value={value}
                    motion={false}
                    open
                    onChange={(date, str) => {
                        onChange(date, str);
                        setValue(date as Date);
                    }}
                />
            );
        }
        const { container } = render(<Controlled />);
        expect(getSelectedDays()).toEqual([ymd(currentValue)]);

        await userEvent.click(getDay(ymd(addDays(currentValue, dayOffset))));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(currentValue.getDate() + dayOffset);
        expect(getSelectedDays()).toEqual([ymd(addDays(currentValue, dayOffset))]);
        expect(container.querySelector('input')).toHaveValue(ymd(addDays(currentValue, dayOffset)));
    });

    it(`needConfirm 需确认`, async () => {
        const currentValue = new Date(baseDate);
        const dayOffset = 3;
        const nextDay = addDays(currentValue, dayOffset);
        const valueFormat = strings.FORMAT_DATE_TIME;
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();

        const { container } = render(<DatePicker type="dateTime" defaultValue={currentValue} motion={false} needConfirm open onConfirm={onConfirm} />);
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

    it(`事件`, async () => {
        const currentValue = new Date(baseDate);
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const onChange = vi.fn<ChangeHandler>();

        const { container } = render(<DatePicker type="dateTime" defaultValue={currentValue} motion={false} needConfirm onChange={onChange} onOpenChange={onOpenChange} />);

        await userEvent.click(document.body);
        expect(onOpenChange).not.toHaveBeenCalled();

        const inputWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`);
        await userEvent.click(inputWrapper.parentElement);
        expect(onOpenChange).toHaveBeenCalledWith(true);

        fireEvent.change(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`), {
            target: { value: '2019-10-02 08:30:02' },
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-02 08:30:02');
    });

    it(`范围选择器`, async () => {
        const dayOffset = 3;
        const leftPrevClickTimes = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];
        const onChange = vi.fn<ChangeHandler>();

        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={currentValue} defaultOpen motion={false} needConfirm={false} onChange={onChange} />);

        const startDayDom = document.querySelector(`.${dp}-day-selected-start`);
        const endDayDom = document.querySelector(`.${dp}-day-selected-end`);

        expect(Array.from({ length: dayOffset }).reduce<Element>((cur) => cur.nextElementSibling, startDayDom)).toBe(endDayDom);

        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));

        for (let i = 0; i < leftPrevClickTimes; i++) {
            await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`));
        }

        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.focus(startInput);
        await userEvent.click(getWeekDays('left', 1)[0]);
        fireEvent.focus(endInput);
        await userEvent.click(getWeekDays('left', 1)[dayOffset]);

        const value = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        const startDay = 2;
        expect(value[0].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[0].getDate()).toBe(startDay);
        expect(value[1].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[1].getDate()).toBe(startDay + dayOffset);
        expect(startInput.value.startsWith('2019-06-02')).toBe(true);
        expect(endInput.value.startsWith('2019-06-05')).toBe(true);
    });

    it(`范围类型传 role 时落在根元素，不被 group 覆盖`, () => {
        const { container } = render(<DatePicker type="dateRange" aria-label="期间" role="toolbar" />);
        expect(container.firstElementChild).toHaveAttribute('role', 'toolbar');
        expect(container.querySelector('[role="group"]')).toBeNull();
    });

    it(`范围选择器中切换面板`, async () => {
        const dayOffset = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];

        const { container } = render(<DatePicker type="dateRange" defaultValue={currentValue} defaultOpen motion={false} needConfirm={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        const startIndex = 0;

        fireEvent.focus(startInput);
        await userEvent.click(getWeekDays('left', 1)[startIndex]);
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.click(getWeekDays('left', 1)[startIndex + dayOffset]);
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it(`起始值大于结束值时，范围选择器切换面板`, async () => {
        const dayOffset = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];

        const { container } = render(<DatePicker type="dateRange" defaultValue={currentValue} defaultOpen motion={false} needConfirm={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        const startIndex = 0;

        fireEvent.focus(startInput);
        await userEvent.click(getWeekDays('left', 2)[startIndex]);
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2019-09-15');
        expect(endInput).toHaveValue('');
    });

    it(`年份或月份选择器`, async () => {
        const monOffset = 2;
        const yearOffset = 3;
        const currentValue = new Date(baseDate);
        const onChange = vi.fn<ChangeHandler>();

        const { container } = render(<DatePicker type="month" defaultValue={currentValue} defaultOpen motion={false} onChange={onChange} />);

        const [yearList, monthList] = getYMLists();
        const currentSelectedYear = yearList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(Array.from({ length: yearOffset }).reduce<Element>((cur) => cur.nextElementSibling, currentSelectedYear));

        const currentSelectedMon = monthList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(Array.from({ length: monOffset }).reduce<Element>((cur) => cur.nextElementSibling, currentSelectedMon));

        const value = onChange.mock.calls[onChange.mock.calls.length - 1][0] as Date;
        expect(value.getFullYear()).toBe(baseYear + yearOffset);
        expect(value.getMonth()).toBe(baseMon + monOffset);
        expect(container.querySelector('input')).toHaveValue(format(new Date(baseYear + yearOffset, baseMon + monOffset), 'yyyy-MM'));
    });

    it('周选择', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultOpen endDateOffset={(date) => endOfWeek(date, { weekStartsOn: 1 })} startDateOffset={(date) => startOfWeek(date, { weekStartsOn: 1 })} weekStartsOn={1} />);
        const startIndex = 3;

        await userEvent.click(getWeekDays('left', 1)[startIndex]);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthFirstDay = add(new Date(year, 0, 1, 0, 0, 0), { months: month });
        const clickDay = addDays(startOfWeek(addWeeks(monthFirstDay, 1), { weekStartsOn: 1 }), 3);
        const [startInput, endInput] = container.querySelectorAll('input');

        expect(startInput).toHaveValue(ymd(startOfWeek(clickDay, { weekStartsOn: 1 })));
        expect(endInput).toHaveValue(ymd(endOfWeek(clickDay, { weekStartsOn: 1 })));
    });

    it('周选择在 UTC 以西时区点击周三得到完整的一周', async () => {
        const originalTZ = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            const { container } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" endDateOffset={(date) => endOfWeek(date, { weekStartsOn: 1 })} motion={false} startDateOffset={(date) => startOfWeek(date, { weekStartsOn: 1 })} weekStartsOn={1} />);
            await userEvent.click(getDay('2021-06-16'));
            const [startInput, endInput] = container.querySelectorAll('input');
            expect(startInput).toHaveValue('2021-06-14');
            expect(endInput).toHaveValue('2021-06-20');
        } finally {
            process.env.TZ = originalTZ;
        }
    });

    it('autoFocus 自动聚焦', async () => {
        const { container } = render(<DatePicker autoFocus motion={false} />);
        const { container: container2 } = render(<DatePicker autoFocus={false} motion={false} />);

        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(1);
        expect(container2.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(0);
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('自定义 dropdownClassName 与 dropdownStyle', async () => {
        let props = {
            dropdownClassName: 'my-datePicker',
            dropdownStyle: {
                color: 'red',
            },
            defaultOpen: true,
            motion: false,
        };
        render(<DatePicker {...props} />);
        const dropdown = document.querySelector('.my-datePicker');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('onClear', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        let props = {
            defaultOpen: true,
            motion: false,
            autoFocus: true,
            defaultValue: baseDate,
            showClear: true,
            onClear: onClear,
        };
        const { container } = render(<DatePicker {...props} />);
        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('输入禁用日期不触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = '2021-04-12';
        const disabeldDate = '2021-04-15';
        const notDisabledDate = '2021-04-13';
        let props = {
            defaultOpen: true,
            motion: false,
            value: defaultValue,
            onChange,
            disabledDate: (dateStr) => {
                const date = new Date(dateStr);
                const day = date.getDate();
                if (day === 15) {
                    return true;
                }
                return false;
            },
        };
        const { container } = render(<DatePicker {...props} />);
        const input = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`);
        fireEvent.change(input, { target: { value: disabeldDate } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: notDisabledDate } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe(notDisabledDate);
    });

    it('点击预设的禁用日期不触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = '2021-04-12';
        const disabledValue = '2021-04-15';
        const notDisabledValue = '2021-04-30';
        const defaultDate = new Date(`${defaultValue} 00:00:00`);
        const disableDate = new Date(`${disabledValue} 00:00:00`);
        const notDisabledDate = new Date(`${notDisabledValue} 00:00:00`);
        let props = {
            open: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (date) => {
                const day = date.getDate();
                if (day === 15) {
                    return true;
                }
                return false;
            },
            presets: [
                {
                    text: 'disabled date',
                    start: disableDate,
                },
                {
                    text: 'valid date',
                    start: notDisabledValue,
                },
            ],
        };
        const { container } = render(<DatePicker {...props} />);
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
        const renderWithZone = (timeZone) => (
            <ConfigProvider timeZone={timeZone}>
                <DatePicker type="dateTime" defaultOpen defaultPickerValue={today} motion={false} />
            </ConfigProvider>
        );

        const { container, rerender } = render(renderWithZone(originZone));

        const days = document.querySelectorAll(`.${dp}-day`);
        await userEvent.click(days[6]);
        expect(document.querySelectorAll(`.${dp}-day-selected`)).toHaveLength(1);
        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`);
        const selectedDay = parse(input.value, strings.FORMAT_DATE_TIME, new Date());
        expect(ymd(selectedDay)).toBe(days[6].getAttribute('aria-label'));
        expect(format(selectedDay, 'HH:mm:ss')).toBe('22:00:00');
        rerender(renderWithZone(newZone));
        const newZoneDate = add(selectedDay, { hours: newOffset - originOffset });
        const formatNewZoneDate = format(newZoneDate, strings.FORMAT_DATE_TIME);
        expect(input.value).toEqual(formatNewZoneDate);
    });

    it('受控模式下切换 timeZone 时 inputValue 正确', async () => {
        const now = new Date();
        const [originZone, originOffset] = getRandomIANATimeZone();
        const [newZone, newOffset] = getRandomIANATimeZone();

        const originZoneDate = zonedTimeToUtc(now, originZone);
        const renderWithZone = (timeZone) => (
            <ConfigProvider timeZone={timeZone}>
                <DatePicker type="dateTime" value={originZoneDate} defaultOpen motion={false} />
            </ConfigProvider>
        );
        const { container, rerender } = render(renderWithZone(originZone));

        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`);
        const originFormatDate = format(now, strings.FORMAT_DATE_TIME);
        expect(input.value).toEqual(originFormatDate);
        rerender(renderWithZone(newZone));
        const newZoneDate = add(now, { hours: newOffset - originOffset });
        const formatNewZoneDate = format(newZoneDate, strings.FORMAT_DATE_TIME);
        expect(input.value).toEqual(formatNewZoneDate);
    });

    it(`默认 locale 格式`, () => {
        const localeFormatten = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');
        const localeValue = format(defaultValue, localeFormatten, { locale: zhCN });

        const { container } = render(<DatePicker defaultValue={defaultValue} format={localeFormatten} />);
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(localeValue);
    });

    it(`enUS locale 格式`, () => {
        const localeFormatten = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');
        const localeValue = format(defaultValue, localeFormatten, { locale: enUS });

        const { container } = render(
            <LocaleProvider locale={en_US}>
                <DatePicker defaultValue={defaultValue} format={localeFormatten} />
            </LocaleProvider>
        );
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(localeValue);
    });

    it(`onPresetClick`, async () => {
        const dayOffset = 1;
        const presets = [
            {
                text: 'Today',
                start: new Date(baseDate),
                end: new Date(baseDate),
            },
            {
                text: 'Next Day',
                start: addDays(new Date(baseDate), dayOffset),
                end: addDays(new Date(baseDate), dayOffset),
            },
        ];
        const defaultValue = new Date(addDays(new Date(baseDate), -dayOffset));
        const handlePresetClick = vi.fn<(item: PresetType, e: React.MouseEvent<HTMLDivElement>) => string>((_item, e) => e.type);

        render(<DatePicker defaultValue={defaultValue} motion={false} open presets={presets} onPresetClick={handlePresetClick} />);

        const btns = getPresetButtons();

        await userEvent.click(btns[0]);
        await userEvent.click(btns[1]);
        expect(handlePresetClick).toHaveBeenCalledTimes(2);
        const args0 = handlePresetClick.mock.calls[0];
        const args1 = handlePresetClick.mock.calls[1];
        expect(args0[0]).toEqual(presets[0]);
        expect(args1[0]).toEqual(presets[1]);
        expect(handlePresetClick.mock.results.map((r) => r.value)).toEqual(['click', 'click']);
    });

    it(`范围类型点击一个日期时不触发 notifyChange`, async () => {
        const onChange = vi.fn<ChangeHandler>();
        function Controlled() {
            const [value, setValue] = useState(undefined);
            return (
                <DatePicker
                    type="dateRange"
                    value={value}
                    defaultOpen
                    defaultPickerValue="2021-08-13"
                    motion={false}
                    onChange={(date, str) => {
                        onChange(date, str);
                        setValue(date);
                    }}
                />
            );
        }
        const { container } = render(<Controlled />);
        const startIndex = 0;
        const endIndex = 2;
        const [startInput, endInput] = container.querySelectorAll('input');

        fireEvent.focus(startInput);
        await userEvent.click(getWeekDays('left', 1)[startIndex]);
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.focus(endInput);
        await userEvent.click(getWeekDays('left', 1)[endIndex]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [rangeStart, rangeEnd] = onChange.mock.calls[0][0] as Date[];
        expect(ymd(rangeStart)).toBe('2021-08-08');
        expect(ymd(rangeEnd)).toBe('2021-08-10');
        expect(startInput).toHaveValue('2021-08-08');
        expect(endInput).toHaveValue('2021-08-10');
    });

    /**
     * A range end outside the disabled month (August) stays selectable.
     */
    it('rangeStart 禁用时仍可选择 rangeEnd', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = ['2021-08-06', '2021-08-15'];
        let props = {
            type: 'dateRange' as const,
            defaultOpen: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (dateStr) => {
                const date = new Date(dateStr);
                const month = date.getMonth();
                if (month === 7) {
                    return true;
                }
                return false;
            },
            style: { width: 300 },
        };
        const { container } = render(<DatePicker {...props} />);
        const [startInput, endInput] = container.querySelectorAll('input');

        fireEvent.focus(endInput);
        const endIndex = 5; // 2021-09-10
        await userEvent.click(getWeekDays('right', 1)[endIndex]);

        expect(onChange).toHaveBeenCalledTimes(1);
        const value = onChange.mock.calls[0][0];
        expect(value[0].getMonth()).toBe(7);
        expect(value[0].getDate()).toBe(6);
        expect(value[1].getMonth()).toBe(8);
        expect(value[1].getDate()).toBe(10);
        expect(startInput).toHaveValue(defaultValue[0]);
        expect(endInput).toHaveValue('2021-09-10');
    });

    it('禁用的多选', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const defaultValue = ['2021-08-06', '2021-08-15'];
        let props = {
            type: 'date' as const,
            multiple: true,
            defaultOpen: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (dateStr) => {
                const date = new Date(dateStr);
                const day = date.getDate();
                if (day > 20 && day < 25) {
                    return true;
                }
                return false;
            },
            style: { width: 300 },
        };
        const { container } = render(<DatePicker {...props} />);
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
        expect(onChange).toHaveBeenCalledTimes(1); // still calledOnce
    });

    it('禁用时间的回调', async () => {
        const disabledTime = vi.fn<(date: Date | Date[], panelType: string) => { disabledHours: () => number[] }>((_date, panelType) => {
            if (panelType === 'left') {
                return { disabledHours: () => [17, 18] };
            } else {
                return { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] };
            }
        });
        let props = {
            type: 'dateTimeRange' as const,
            defaultValue: ['2021-09-08', '2021-10-03'],
            defaultOpen: true,
            motion: false,
            disabledTime,
            style: { width: 400 },
            timePickerOpts: {
                scrollItemProps: { cycled: false },
            },
        };
        const { rerender } = render(<DatePicker {...props} />);
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`));
        const args = disabledTime.mock.lastCall;
        expect((args[0] as Date[]).length).toBe(2);
        expect(args[1]).toBe('left');

        rerender(<DatePicker {...props} type="dateTime" />);
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`));
        const args2 = disabledTime.mock.lastCall;
        expect(Array.isArray(args2[0])).toBe(false);
        expect(args2[1]).toBe('left');
    });

    it('rangeSeparator 分隔符', async () => {
        const rangeSeparator = '-';
        const defaultValue = ['2021-08-06', '2021-08-15'];
        let props = {
            type: 'dateRange' as const,
            motion: false,
            defaultValue,
            style: { width: 300 },
            rangeSeparator,
        };
        render(
            <div>
                <DatePicker {...props} />
                <DatePicker {...props} type="dateTimeRange" />
            </div>
        );
        const allSeparators = document.querySelectorAll(`.${dp}-range-input-separator`);
        expect(allSeparators[0].textContent.trim()).toBe(rangeSeparator);
        expect(allSeparators[1].textContent.trim()).toBe(rangeSeparator);
    });

    it('输入年份长度超过 4 位', async () => {
        const props = {
            motion: false,
            defaultOpen: true,
            defaultValue: '2021-12-21',
        };
        const handleChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker {...props} onChange={handleChange} />);

        fireEvent.change(container.querySelector('input'), { target: { value: '20221-12-21' } });
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('点击上一年与下一年按钮', async () => {
        let props = {
            type: 'dateRange' as const,
            motion: false,
            style: { width: 300 },
            defaultPickerValue: new Date('2021-12-01'),
            defaultOpen: true,
        };
        render(<DatePicker {...props} />);
        const navNames = {
            'Previous year': zh_CN.DatePicker.prevYear,
            'Next year': zh_CN.DatePicker.nextYear,
            'Previous month': zh_CN.DatePicker.prevMonth,
            'Next month': zh_CN.DatePicker.nextMonth,
        };
        const navButton = (side, label) => getPanel(side).querySelector(`[aria-label="${navNames[label]}"]`);

        await userEvent.click(navButton('left', 'Previous year'));
        expect(getNavTitle('left')).toBe('2020年 12月');
        await userEvent.click(navButton('left', 'Next year'));
        expect(getNavTitle('left')).toBe('2021年 12月');

        await userEvent.click(navButton('right', 'Next year'));
        expect(getNavTitle('right')).toBe('2023年 1月');
        await userEvent.click(navButton('right', 'Previous year'));
        expect(getNavTitle('right')).toBe('2022年 1月');
    });

    const expectMonthSyncChange = async (type) => {
        let props = {
            type,
            motion: false,
            style: { width: 300 },
            defaultPickerValue: new Date('2021-12-01'),
            defaultOpen: true,
        };
        render(<DatePicker {...props} />);
        const navNames = {
            'Previous year': zh_CN.DatePicker.prevYear,
            'Next year': zh_CN.DatePicker.nextYear,
            'Previous month': zh_CN.DatePicker.prevMonth,
            'Next month': zh_CN.DatePicker.nextMonth,
        };
        const navButton = (side, label) => getPanel(side).querySelector(`[aria-label="${navNames[label]}"]`);

        await userEvent.click(navButton('left', 'Next month'));
        expect(getNavTitle('left')).toBe('2022年 1月');
        expect(getNavTitle('right')).toBe('2022年 2月');
        await userEvent.click(navButton('right', 'Previous month'));
        expect(getNavTitle('left')).toBe('2021年 12月');
        expect(getNavTitle('right')).toBe('2022年 1月');

        await userEvent.click(navButton('left', 'Previous month'));
        expect(getNavTitle('left')).toBe('2021年 11月');
    };

    it('dateRange 类型下月份同步切换', async () => {
        await expectMonthSyncChange('dateRange');
    });
    it('dateTimeRange 类型下月份同步切换', async () => {
        await expectMonthSyncChange('dateTimeRange');
    });

    it(`预设值为 null`, async () => {
        const props = {
            presets: [
                {
                    text: 'Today',
                    start: null,
                    end: null,
                },
            ],
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            type: 'dateRange' as const,
        };
        const handleChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker {...props} onChange={handleChange} />);

        await userEvent.click(getPresetButtons()[0]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        const args = handleChange.mock.calls[0];
        expect((args[0] as Date[]).length).toEqual(0);
        await waitFor(() => expect(getPopup()).toBeNull());
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
    });

    it(`预设值为 null 且 needConfirm`, async () => {
        const props = {
            presets: [
                {
                    text: 'Today',
                    start: null,
                    end: null,
                },
            ],
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            type: 'dateTimeRange' as const,
            needConfirm: true,
        };
        const handleChange = vi.fn<ChangeHandler>();
        const handleConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        render(<DatePicker {...props} onChange={handleChange} onConfirm={handleConfirm} />);

        await userEvent.click(getPresetButtons()[0]);
        expect(handleChange).toHaveBeenCalledTimes(1);
        const argsChange = handleChange.mock.calls[0];
        expect((argsChange[0] as Date[]).length).toBe(0);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getFooterButtons()[1]);
        expect(handleConfirm).toHaveBeenCalledTimes(1);
        const argsConfirm = handleConfirm.mock.calls[0];
        expect((argsConfirm[0] as Date[]).length).toBe(0);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('dateRange 的 triggerRender 点击后打开面板，选完两端后关闭', async () => {
        render(<DatePicker type="dateRange" motion={false} triggerRender={({ placeholder }) => <button>{placeholder}</button>} />);
        await userEvent.click(screen.getByRole('button'));
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('right', 1)[0]);

        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('month 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const props = {
            type: 'month' as const,
            defaultOpen: true,
            motion: false,
            onChange,
        };
        render(<DatePicker {...props} />);

        expect(getPopup()).toHaveAttribute('x-type', 'month');
        expect(getYMLists()).toHaveLength(2);
    });

    it('disabled 属性', async () => {
        const props = {
            disabled: true,
            defaultValue: baseDate,
            motion: false,
        };
        const { container } = render(<DatePicker {...props} />);

        expect(container.querySelector('input')).toBeDisabled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
    });

    it('placeholder 属性', async () => {
        const placeholder = '请选择日期';
        const props = {
            placeholder,
            motion: false,
        };
        render(<DatePicker {...props} />);

        expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    it('prefix 与 insetLabel', async () => {
        const prefix = <span className="custom-prefix">前缀</span>;
        const insetLabel = '日期';
        const props = {
            prefix,
            insetLabel,
            motion: false,
        };
        const { container } = render(<DatePicker {...props} />);

        expect(container.querySelector('.custom-prefix')).toHaveTextContent('前缀');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).not.toBeNull();
    });

    it('范围类型的 prefix 为 0 时照常渲染', () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} prefix={0} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-datepicker-range-input-prefix`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-datepicker-range-input-wrapper-start`)).toHaveClass(`${BASE_CLASS_PREFIX}-datepicker-range-input-wrapper-start-with-prefix`);
    });

    it('borderless 属性', async () => {
        const props = {
            borderless: true,
            defaultValue: baseDate,
            motion: false,
        };
        const { container } = render(<DatePicker {...props} />);

        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
    });

    it('validateStatus', async () => {
        const errorProps = {
            validateStatus: 'error' as const,
            defaultValue: baseDate,
            motion: false,
        };
        const { container } = render(<DatePicker {...errorProps} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
    });

    it('size 属性', async () => {
        const smallProps = {
            size: 'small' as const,
            defaultValue: baseDate,
            motion: false,
        };
        const { container } = render(<DatePicker {...smallProps} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
    });

    it('多选', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const props = {
            type: 'date' as const,
            multiple: true,
            defaultOpen: true,
            motion: false,
            onChange,
            defaultPickerValue: '2021-08-01',
        };
        const { container } = render(<DatePicker {...props} />);

        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);

        await userEvent.click(getWeekDays('left', 1)[1]);
        expect(onChange).toHaveBeenCalledTimes(2);

        const value = onChange.mock.calls[1][0] as Date[];
        expect(value.length).toBe(2);
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
        expect(container.querySelector('input')).toHaveValue('2021-08-08,2021-08-09');
        expect(getPopup()).not.toBeNull();
    });

    it('format 不含时间标记时，dateTime 降级为 date', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen format="yyyy-MM-dd" motion={false} onChange={onChange} />);
        expect(getPopup()).toHaveAttribute('x-type', 'date');
        expect(getPopup().querySelector(`.${dp}-switch`)).toBeNull();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('format 不含时间标记时，dateTimeRange 降级为 dateRange', async () => {
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[new Date(baseDate), addDays(new Date(baseDate), 5)]} defaultOpen format="yyyy-MM-dd" motion={false} />);
        expect(getPopup()).toHaveAttribute('x-type', 'dateRange');
        expect(getPopup().querySelector(`.${dp}-switch`)).toBeNull();
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue(ymd(baseDate));
        expect(endInput).toHaveValue(ymd(addDays(baseDate, 5)));
    });

    it('format 含时间标记时保留 dateTime 类型', async () => {
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen format="yyyy-MM-dd HH:mm" motion={false} />);
        expect(getPopup()).toHaveAttribute('x-type', 'dateTime');
        expect(getPopup().querySelector(`.${dp}-switch-time`)).not.toBeNull();
        expect(container.querySelector('input')).toHaveValue(format(baseDate, 'yyyy-MM-dd HH:mm'));
    });

    it('insetInput 设置默认位置', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen insetInput motion={false} />);
        expect(getPopup().querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', strings.POSITION_INLINE_INPUT);
    });

    it('position 含 Over 时 insetInput 设置间距', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen insetInput motion={false} position="leftTopOver" />);
        expect(getPopup().querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'leftTopOver');
    });

    it('position 不含 Over 时的 insetInput', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen insetInput motion={false} position="bottomLeft" />);
        expect(getPopup().querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('rangeSeparator 去除首尾空白', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(baseDate), addDays(new Date(baseDate), 5)]} defaultOpen motion={false} rangeSeparator=" - " onChange={onChange} />);
        expect(container.querySelector(`.${dp}-range-input-separator`).textContent).toBe(' - ');
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(endInput, { target: { value: ymd(addDays(baseDate, 6)) } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(baseDate), ymd(addDays(baseDate, 6))]);
        expect(startInput).toHaveValue(ymd(baseDate));
    });

    it('monthRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultOpen motion={false} onChange={onChange} />);
        expect(getPopup()).toHaveAttribute('x-type', 'monthRange');
        expect(getYMLists()).toHaveLength(4);
    });

    it('month 类型的默认值与选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" defaultValue={new Date(2021, 5)} defaultOpen motion={false} onChange={onChange} />);
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '3月' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-03');
        expect(getYMSelected()).toEqual(['2021年', '3月']);
        expect(container.querySelector('input')).toHaveValue('2021-03');
    });

    it('dateRange 的 defaultValue', async () => {
        const startDate = new Date(2021, 7, 1);
        const endDate = new Date(2021, 7, 15);
        const { container } = render(<DatePicker type="dateRange" defaultValue={[startDate, endDate]} defaultOpen motion={false} />);
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inrange`);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('dateTimeRange 的 defaultValue', async () => {
        const startDate = new Date(2021, 7, 1, 10, 0, 0);
        const endDate = new Date(2021, 7, 15, 18, 0, 0);
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[startDate, endDate]} defaultOpen motion={false} />);
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-08-01 10:00:00');
        expect(endInput).toHaveValue('2021-08-15 18:00:00');
    });

    it('切换上一月与下一月', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} />);
        expect(getNavTitle('left')).toBe('2019年 9月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
    });

    it('点击年月文字打开年月选择器', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} />);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        expect(getPopup().querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getYMSelected()).toEqual(['2019年', '9月']);
        // the clicked navigation is removed from the DOM, which must not count as a click outside
        expect(getPopup()).not.toBeNull();
    });

    it('打开年月选择器与返回日期面板的点击仍传到 document 的 click 监听', async () => {
        const onDocumentClick = vi.fn<(e: MouseEvent) => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            // Popover stops click propagation unless stopPropagation is false
            render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} stopPropagation={false} />);
            await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
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
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');

        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getPopup()).not.toBeNull();

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup().querySelector(`.${dp}-tpk`)).not.toBeNull();
    });

    it('disabledDate 属性', async () => {
        const disabledDate = (date) => date.getDay() === 0 || date.getDay() === 6;
        render(<DatePicker defaultValue={baseDate} defaultOpen disabledDate={disabledDate} motion={false} />);

        expect(getDay('2019-09-07')).toHaveClass(`${dp}-day-disabled`);
        expect(getDay('2019-09-07')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-09')).not.toHaveClass(`${dp}-day-disabled`);
        expect(getPopup().querySelectorAll(`.${dp}-day-disabled`)).toHaveLength(9);
    });

    it('点击外部关闭面板时 onBlur 收到原生 mousedown 事件', async () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const onClickOutSide = vi.fn<NonNullable<DatePickerProps['onClickOutSide']>>();
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} onBlur={onBlur} onClickOutSide={onClickOutSide} />);
        fireEvent.mouseDown(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        const [blurEvent] = onBlur.mock.calls[0];
        expect(blurEvent).toBeInstanceOf(MouseEvent);
        expect(blurEvent.type).toBe('mousedown');
        const [outsideEvent] = onClickOutSide.mock.calls[0];
        expect(outsideEvent).toBeInstanceOf(MouseEvent);
        expect(outsideEvent).not.toHaveProperty('nativeEvent');
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('stopPropagation 为 false 时，在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        const nested = (
            <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} stopPropagation={false} trigger="click">
                <button type="button">nested trigger</button>
            </Popover>
        );
        render(<DatePicker defaultOpen motion={false} stopPropagation={false} topSlot={nested} />);
        fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('stopPropagation 为 false 时，在面板内 TimePicker 的面板内按下鼠标不关闭 DatePicker', async () => {
        render(<DatePicker defaultOpen motion={false} stopPropagation={false} topSlot={<TimePicker aria-label="nested time" defaultOpen motion={false} stopPropagation={false} />} />);
        const timePanel = await waitFor(() => {
            const panel = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-timepicker-panel`);
            expect(panel).not.toBeNull();
            return panel;
        });
        fireEvent.mouseDown(timePanel);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('Esc 或选中日期关闭面板时 onBlur 没有事件参数', async () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { unmount } = render(<DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} onBlur={onBlur} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        expect(onBlur.mock.calls).toEqual([[undefined]]);
        unmount();

        onBlur.mockClear();
        render(<DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} onBlur={onBlur} />);
        await userEvent.click(getDay('2019-09-12'));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onBlur.mock.calls).toEqual([[undefined]]);
    });

    it('onClear 回调', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} onChange={onChange} onClear={onClear} />);

        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('compact 密度', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen density="compact" motion={false} />);
        expect(getPopup()).toHaveClass(`${dp}-compact`);
    });

    it('needConfirm 的取消按钮', async () => {
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} needConfirm onCancel={onCancel} />);

        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toEqual(baseDate);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('受控 panelShow 与 onOpenChange', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { rerender } = render(<DatePicker defaultValue={baseDate} motion={false} open={false} onOpenChange={onOpenChange} />);

        expect(getPopup()).toBeNull();

        rerender(<DatePicker defaultValue={baseDate} motion={false} open onOpenChange={onOpenChange} />);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        rerender(<DatePicker defaultValue={baseDate} motion={false} open={false} onOpenChange={onOpenChange} />);
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('triggerRender 属性', async () => {
        const { container } = render(<DatePicker motion={false} triggerRender={({ placeholder }) => <button className="custom-trigger">{placeholder || 'Select Date'}</button>} />);

        expect(container.querySelector('.custom-trigger')).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();

        await userEvent.click(container.querySelector('.custom-trigger'));
        expect(getPopup()).not.toBeNull();
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
        render(
            <DatePicker
                motion={false}
                triggerRender={() => (
                    <div className="custom-trigger">
                        <button type="button" aria-label="清除" onClick={onPress} />
                    </div>
                )}
            />
        );

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopup()).toBeNull();
    });

    it.each(['{Enter}', ' '])('triggerRender 自带可聚焦按钮时，Tab 到按钮后按 %j 打开面板', async (key) => {
        render(<DatePicker motion={false} triggerRender={() => <button type="button">pick</button>} />);

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.keyboard(key);
        expect(getPopup()).not.toBeNull();
    });

    it('dateRange 的 triggerRender 替换两个范围输入框', async () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} triggerRender={({ placeholder }) => <button className="custom-range-trigger">{placeholder || 'Select Range'}</button>} />);

        expect(container.querySelector('.custom-range-trigger')).not.toBeNull();
        expect(container.querySelector(`.${dp}-range-input`)).toBeNull();
        expect(container.querySelector('input')).toBeNull();
    });

    it('onChange 的参数依次为 date 与 dateString', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker defaultOpen defaultPickerValue="2021-08-01" motion={false} onChange={onChange} />);

        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const args = onChange.mock.calls[0];
        expect(args[0]).toBeInstanceOf(Date);
        expect(args[1]).toBe('2021-08-08');
    });

    it('presetPosition 为 left', async () => {
        const presets = [{ text: 'Today', start: new Date(), end: new Date() }];
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} presetPosition="left" presets={presets} />);
        expect(getPopup().querySelector(`.${dp}-quick-control-left`)).toHaveTextContent('Today');
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', 'left');
    });

    it('presetPosition 为 right', async () => {
        const presets = [{ text: 'Today', start: new Date(), end: new Date() }];
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} presetPosition="right" presets={presets} />);
        expect(getPopup().querySelector(`.${dp}-quick-control-right`)).toHaveTextContent('Today');
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', 'right');
    });

    it('输入合法日期时 input 值变化', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker motion={false} onChange={onChange} />);

        fireEvent.change(container.querySelector('input'), { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-08-15');
    });

    it('输入非法日期时 input 值变化', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker motion={false} onChange={onChange} />);

        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: 'invalid-date' } });
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('invalid-date');
    });

    it('dateRange 输入框聚焦', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 7, 1), new Date(2021, 7, 15)]} defaultOpen motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        const startWrapper = container.querySelector(`.${dp}-range-input-wrapper-start`);
        const endWrapper = container.querySelector(`.${dp}-range-input-wrapper-end`);

        fireEvent.focus(startInput);
        expect(startWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        fireEvent.focus(endInput);
        expect(startWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('monthRange 的 defaultValue', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="monthRange" defaultValue={[new Date(2021, 0), new Date(2021, 6)]} defaultOpen motion={false} onChange={onChange} />);
        expect(getYMSelected()).toEqual(['2021年', '1月', '2021年', '7月']);
        expect(container.querySelector('input')).toHaveValue('2021-01 ~ 2021-07');
    });

    it('多选与 max 属性', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" max={2} multiple defaultOpen defaultPickerValue="2021-08-01" motion={false} onChange={onChange} />);

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
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-08-01" endDateOffset={(date) => endOfWeek(date)} motion={false} startDateOffset={(date) => startOfWeek(date)} onChange={onChange} />);

        await userEvent.click(getWeekDays('left', 2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2021-08-15', '2021-08-21']);
    });

    it('showClear 属性', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container, rerender } = render(<DatePicker defaultValue={baseDate} motion={false} showClear onClear={onClear} />);
        const inputWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`);
        await userEvent.hover(inputWrapper);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();

        rerender(<DatePicker defaultValue={baseDate} motion={false} showClear={false} onClear={onClear} />);
        await userEvent.hover(inputWrapper);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('autoSwitchDate 为 false', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} autoSwitchDate={false} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('dateRange 的 syncSwitchMonth', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 7, 1), new Date(2021, 8, 15)]} defaultOpen motion={false} syncSwitchMonth />);
        expect(getNavTitle('left')).toBe('2021年 8月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`)).toHaveStyle({
            visibility: 'hidden',
        });
        expect(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`)).toHaveStyle({
            visibility: 'hidden',
        });

        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('dateRange 的 showClearIgnoreDisabled', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const undeclared = { showClearIgnoreDisabled: true };
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 7, 1), new Date(2021, 7, 15)]} disabled motion={false} {...undeclared} onClear={onClear} />);

        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('切到上一月时 onPanelChange 收到新面板的日期与原值字符串', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} onPanelChange={onPanelChange} />);

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        const [date, dateStr] = onPanelChange.mock.calls[0] as [Date, string];
        expect(date.getMonth()).toBe(baseMon - 1);
        expect(dateStr).toBe('2019-08-08');
    });

    it('topSlot 与 bottomSlot', async () => {
        render(<DatePicker defaultValue={baseDate} bottomSlot={<div className="custom-bottom-slot">Bottom</div>} defaultOpen motion={false} topSlot={<div className="custom-top-slot">Top</div>} />);
        expect(getPopup().querySelector(`.${dp}-topSlot .custom-top-slot`)).toHaveTextContent('Top');
        expect(getPopup().querySelector(`.${dp}-bottomSlot .custom-bottom-slot`)).toHaveTextContent('Bottom');
    });

    it('renderDate 属性', async () => {
        const renderDate = (dayNumber) => {
            return <span className="custom-day">{dayNumber}</span>;
        };
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} renderDate={renderDate} />);
        const customDays = document.querySelectorAll('.custom-day');
        expect(customDays).toHaveLength(30);
        expect(getDay('2019-09-08').querySelector('.custom-day')).toHaveTextContent('8');
    });

    it('renderFullDate 属性', async () => {
        const renderFullDate = (dayNumber, _fullDate, dayStatus) => {
            return <div className={`custom-full-day ${dayStatus.isSelected ? 'is-selected' : ''}`}>{dayNumber}</div>;
        };
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} renderFullDate={renderFullDate} />);
        expect(document.querySelectorAll('.custom-full-day')).toHaveLength(30);
        expect(getDay('2019-09-08')).not.toHaveClass(`${dp}-day-selected`);
        expect(getDay('2019-09-08').querySelector('.custom-full-day')).toHaveClass('is-selected');
    });

    it('dateRange 悬停效果', async () => {
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-08-01" motion={false} />);

        const days = getWeekDays('left', 1);
        await userEvent.click(days[0]);

        await userEvent.hover(days[3]);
        expect(getDay('2021-08-09')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-12')).not.toHaveClass(`${dp}-day-inhover`);

        await userEvent.unhover(days[3]);
        expect(getDay('2021-08-09')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('字符串形式的 defaultPickerValue', async () => {
        render(<DatePicker defaultOpen defaultPickerValue="2020-01-01" motion={false} />);
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getSelectedDays()).toEqual([]);
    });

    it('Date 形式的 defaultPickerValue', async () => {
        const { rerender } = render(<DatePicker defaultOpen defaultPickerValue={new Date(2020, 0, 1)} motion={false} />);
        expect(getNavTitle('left')).toBe('2020年 1月');
        rerender(<DatePicker defaultOpen defaultPickerValue={new Date(2021, 4, 1)} motion={false} />);
        expect(getNavTitle('left')).toBe('2021年 5月');
    });

    it('dateRange 的 defaultPickerValue', async () => {
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue={['2020-01-01', '2020-02-01']} motion={false} />);
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getNavTitle('right')).toBe('2020年 2月');
    });

    it('dateTime 的 disabledTime 属性', async () => {
        const disabledTime = () => ({
            disabledHours: () => [0, 1, 2, 3, 4, 5],
            disabledMinutes: () => [],
            disabledSeconds: () => [],
        });
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen disabledTime={disabledTime} motion={false} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        const disabledHours = new Set(Array.from(hourList.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent));
        expect([...disabledHours]).toEqual(['00', '01', '02', '03', '04', '05']);
    });

    it('weekStartsOn 属性', async () => {
        render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} weekStartsOn={1} />);
        const weekdays = screen.getAllByRole('columnheader').map((header) => header.textContent);
        expect(weekdays).toEqual(['一', '二', '三', '四', '五', '六', '日']);
        expect(getWeekDays('left', 0)[6]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('dateTime 与 needConfirm 的 onConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} needConfirm onCancel={onCancel} onConfirm={onConfirm} />);

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
        const { container } = render(<DatePicker motion={false} onChange={onChange} />);

        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2021-08-15');
    });

    it('时间戳形式的 value', async () => {
        const timestamp = new Date(2021, 7, 15).getTime();
        const { container } = render(<DatePicker defaultValue={timestamp} motion={false} />);

        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('字符串形式的 value', async () => {
        const { container } = render(<DatePicker defaultValue="2021-08-15" motion={false} />);

        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('范围输入框清空', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 7, 1), new Date(2021, 7, 15)]} motion={false} onChange={onChange} onClear={onClear} />);

        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('范围输入框按 Enter', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultOpen motion={false} onChange={onChange} />);

        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(startInput, { target: { value: '2021-08-01' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(endInput, { target: { value: '2021-08-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 7, 1), new Date(2021, 7, 15)], ['2021-08-01', '2021-08-15']);
        await userEvent.type(startInput, '{Enter}');
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('范围输入框按 Tab', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultOpen motion={false} />);

        const [, endInput] = container.querySelectorAll('input');
        fireEvent.focus(endInput);
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        fireEvent.keyDown(endInput, { key: 'Tab' });
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('month 类型 yearAndMonth 与 noBackBtn', async () => {
        render(<DatePicker type="month" defaultValue={new Date(2021, 5)} defaultOpen motion={false} />);
        expect(getYMLists()).toHaveLength(2);
        expect(getPopup().querySelector(`.${dp}-yearmonth-header`)).toBeNull();
    });

    it('自定义 format 字符串', async () => {
        const { container } = render(<DatePicker defaultValue={new Date(2021, 7, 15)} format="dd/MM/yyyy" motion={false} />);

        expect(container.querySelector('input')).toHaveValue('15/08/2021');
    });

    it('dateRange 与 presets', async () => {
        const presets = [
            {
                text: 'This Week',
                start: startOfWeek(new Date(baseDate)),
                end: endOfWeek(new Date(baseDate)),
            },
        ];
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultOpen motion={false} presets={presets} onChange={onChange} />);

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2019-09-08', '2019-09-14']);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2019-09-08');
        expect(endInput).toHaveValue('2019-09-14');
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('month 类型与 presets', async () => {
        const presets = [{ text: 'Jan', start: new Date(2021, 0) }];
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" defaultOpen motion={false} presets={presets} onChange={onChange} />);

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-01');
        expect(container.querySelector('input')).toHaveValue('2021-01');
    });

    it('dateTimeRange 的 needConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 7, 1, 10, 0), new Date(2021, 7, 15, 18, 0)]} defaultOpen motion={false} needConfirm onCancel={onCancel} onConfirm={onConfirm} />);
        const [cancelBtn, confirmBtn] = getFooterButtons();
        expect(cancelBtn).toBeEnabled();
        expect(confirmBtn).toBeEnabled();
        await userEvent.click(confirmBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0][1]).toEqual(['2021-08-01 10:00:00', '2021-08-15 18:00:00']);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('timePickerOpts', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} timePickerOpts={{ use12Hours: true }} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPopup().querySelectorAll(`.${dp}-tpk ul[role="listbox"]`)).toHaveLength(4);
    });

    it('timePickerOpts.use12Hours 下上午的时间点小时仍保持在上午', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} timePickerOpts={{ use12Hours: true }} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [ampmList, hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        expect(within(ampmList).getAllByRole('option')[0]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(
            within(hourList)
                .getAllByRole('option')
                .find((li) => li.textContent.startsWith('09'))
        );
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(9);
    });

    it('timePickerOpts.use12Hours 下下午的时间点小时仍保持在下午', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={new Date(2019, 8, 8, 15, 8, 8)} defaultOpen motion={false} timePickerOpts={{ use12Hours: true }} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [ampmList, hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        expect(within(ampmList).getAllByRole('option')[1]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(
            within(hourList)
                .getAllByRole('option')
                .find((li) => li.textContent.startsWith('04'))
        );
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(16);
    });

    it('timePickerOpts 里的 onChange、format、timeStampValue 不覆盖面板内部的值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const timePickerOpts = {
            onChange: vi.fn<() => void>(),
            format: 'mm',
            timeStampValue: 0,
        } as unknown as DatePickerProps['timePickerOpts'];
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} timePickerOpts={timePickerOpts} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(
            within(hourList)
                .getAllByRole('option')
                .find((li) => li.textContent.startsWith('09'))
        );
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(9);
    });

    it('month 类型的 startYear 与 endYear', async () => {
        render(<DatePicker type="month" defaultOpen endYear={2025} motion={false} startYear={2020} />);
        const years = within(getYMLists()[0])
            .getAllByRole('option')
            .map((option) => option.textContent.replace('年', ''));
        expect(years).toEqual(['2020', '2021', '2022', '2023', '2024', '2025']);
    });

    it('month 类型 yearAndMonth 面板渲染与年月选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" defaultValue={new Date(2021, 5)} defaultOpen motion={false} onChange={onChange} />);
        expect(getPopup()).toHaveClass(`${dp}-panel-yam`);
        expect(getYMLists()).toHaveLength(2);
        expect(getYMSelected()).toEqual(['2021年', '6月']);

        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 5), '2023-06');
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '9月' }));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 8), '2023-09');
        expect(container.querySelector('input')).toHaveValue('2023-09');
    });

    it('monthRange 类型在 yearAndMonth 中渲染两个面板', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultValue={[new Date(2021, 2), new Date(2021, 8)]} defaultOpen motion={false} onChange={onChange} />);
        expect(getPopup().querySelector(`.${dp}-yearmonth-body`)).not.toBeNull();
        expect(getYMLists()).toHaveLength(4);
        expect(getYMSelected()).toEqual(['2021年', '3月', '2021年', '9月']);
    });

    it('YearAndMonth 通过 foundation 选择年份', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2023, right: 2022 },
            currentMonth: { left: 6, right: 7 },
        });
    });

    it('YearAndMonth 通过 foundation 选择月份', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: 'March' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2021, right: 2022 },
            currentMonth: { left: 3, right: 7 },
        });
    });

    it('YearAndMonth selectYear 在 monthRange 中 left 大于 right 时调整 right', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({ onSelect, type: 'monthRange' });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2025' }));
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2025, right: 2026 },
            currentMonth: { left: 6, right: 7 },
        });
    });

    it('YearAndMonth selectYear 在 monthRange 中 right 同年时拒绝非法日期', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({
            onSelect,
            type: 'monthRange',
            currentYear: { left: 2021, right: 2021 },
            currentMonth: { left: 9, right: 3 },
        });
        await userEvent.click(within(getYMLists()[2]).getByRole('option', { name: '2021' }));
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2020, right: 2021 },
            currentMonth: { left: 9, right: 3 },
        });
    });

    it('YearAndMonth selectMonth 在 monthRange 中 left 大于 right 时调整', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({
            onSelect,
            type: 'monthRange',
            currentYear: { left: 2021, right: 2021 },
            currentMonth: { left: 3, right: 5 },
        });
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: 'October' }));
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2021, right: 2021 },
            currentMonth: { left: 10, right: 10 },
        });
    });

    it('YearAndMonth 通过 foundation 返回主面板', async () => {
        const onBackToMain = vi.fn<NonNullable<YearAndMonthProps['onBackToMain']>>();
        renderYearAndMonth({ onBackToMain });
        screen.getByRole('button', { name: 'Select Date' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 noBackBtn', async () => {
        const { container } = renderYearAndMonth({ noBackBtn: true });
        expect(container.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('YearAndMonth 的年、月文案来自语言包', async () => {
        renderYearAndMonth({ locale: zh_CN.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        expect(within(getYMLists()[1]).getByRole('option', { name: '7月' })).toBeInTheDocument();
    });

    it('YearAndMonth 在 ja_JP 下显示语言包的年后缀和月份名', async () => {
        renderYearAndMonth({ locale: ja_JP.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', ja_JP.DatePicker.fullMonths[6]]);
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022' })).toBeInTheDocument();
    });

    it('YearAndMonth 的 compact 密度', async () => {
        renderYearAndMonth({ density: 'compact' });
        expect(screen.getByRole('button', { name: 'Select Date' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-size-small`);
    });

    it('YearAndMonth 的 presetPosition 为 left', async () => {
        renderYearAndMonth({
            presetPosition: 'left',
            renderQuickControls: <div data-testid="quick">Quick</div>,
            renderDateInput: <div data-testid="date-input">DateInput</div>,
        });
        const quick = screen.getByTestId('quick');
        expect(screen.getByTestId('date-input')).toBeInTheDocument();
        expect(quick.compareDocumentPosition(getYMLists()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('YearAndMonth 的 presetPosition 为 right', async () => {
        renderYearAndMonth({
            presetPosition: 'right',
            renderQuickControls: <div data-testid="quick">Quick</div>,
        });
        const quick = screen.getByTestId('quick');
        expect(quick.compareDocumentPosition(getYMLists()[1]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('YearAndMonth 的 autoSelectMonth 与 disabledDate', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        const disabledDate = (date) => date.getMonth() === 0;
        renderYearAndMonth({
            onSelect,
            type: 'monthRange',
            currentMonth: { left: 1, right: 7 },
            disabledDate,
        });
        expect(within(getYMLists()[1]).getByRole('option', { name: 'January' })).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(onSelect).toHaveBeenLastCalledWith({
            currentYear: { left: 2021, right: 2022 },
            currentMonth: { left: 2, right: 7 },
        });
    });

    it('YearAndMonth getDerivedStateFromProps 更新年月', async () => {
        const { rerender } = renderYearAndMonth();
        expect(getYMSelected()).toEqual(['2021', 'June']);
        rerender(<YearAndMonth {...yearAndMonthDefaultProps} currentMonth={{ left: 3, right: 9 }} currentYear={{ left: 2023, right: 2024 }} />);
        expect(getYMSelected()).toEqual(['2023', 'March']);
    });

    it('YearAndMonth 点击返回主面板按钮', async () => {
        const onBackToMain = vi.fn<NonNullable<YearAndMonthProps['onBackToMain']>>();
        renderYearAndMonth({ onBackToMain, noBackBtn: false });
        await userEvent.click(screen.getByRole('button', { name: 'Select Date' }));
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 disabledDate，右侧面板年份禁用', async () => {
        renderYearAndMonth({ type: 'monthRange', disabledDate: () => false });
        const rightYears = getYMLists()[2];
        expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
        expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        expect(getYMLists()[3].querySelectorAll('li[aria-disabled="true"]')).toHaveLength(0);
    });

    it('dateInput handleChange 触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
    });

    it('dateInput handleEnterPress 处理回车', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-1' } });
        expect(input).toHaveValue('2021-06-1');
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue(ymd(baseDate));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('范围输入框聚焦时触发 handleRangeInputFocus', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} onFocus={onFocus} />);
        act(() => container.querySelectorAll('input')[0].focus());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('范围输入框按 Enter 时触发 handleRangeInputEnterPress', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(startInput, { target: { value: '2021-06-0' } });
        expect(startInput).toHaveValue('2021-06-0');
        await userEvent.type(startInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('结束输入框按 Tab', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        const endInput = container.querySelectorAll('input')[1];
        fireEvent.focus(endInput);
        fireEvent.keyDown(endInput, { key: 'Tab' });
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
        expect(getPopup()).not.toBeNull();
    });

    it('不同类型下 dateInput formatShowText', async () => {
        const { container: dateContainer } = render(<DatePicker type="date" defaultValue={baseDate} motion={false} />);
        expect(dateContainer.querySelector('input')).toHaveValue('2019-09-08');

        const { container: dateTimeContainer } = render(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} />);
        expect(dateTimeContainer.querySelector('input')).toHaveValue('2019-09-08 08:08:08');

        const { container: monthContainer } = render(<DatePicker type="month" defaultValue={new Date(2021, 3)} defaultOpen motion={false} />);
        expect(monthContainer.querySelector('input')).toHaveValue('2021-04');
    });

    it('dateTime 类型的 insetInput 渲染日期与时间输入框', async () => {
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen insetInput motion={false} />);
        expect(within(getPopup()).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
        expect(within(getPopup()).getByPlaceholderText('HH:mm:ss')).toHaveValue('08:08:08');
        expect(getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(2);
        expect(container.querySelector('input')).toHaveAttribute('readonly');
    });

    it('dateTime 类型的 insetInput onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen insetInput motion={false} onChange={onChange} />);
        fireEvent.change(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-06-15 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2021-06-15 08:08:08');
    });

    it('12 小时制 format 的 insetInput 改日期后保留下午的时间', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={new Date(2021, 0, 1, 15, 30)} defaultOpen format="yyyy-MM-dd hh:mm a" insetInput motion={false} onChange={onChange} />);
        const [dateInput, timeInput] = getPopup().querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(timeInput).toHaveValue('15:30');
        fireEvent.change(dateInput, { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 15, 30), '2021-06-15 03:30 下午');
    });

    it('dateTimeRange 类型的 insetInput', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} />);
        const dateInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        const timeInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        timeInputs.forEach((input) => expect(input).toBeEnabled());
        const insetInputs = getPopup().querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2021-06-01', '10:00:00', '2021-06-15', '18:00:00']);
    });

    it('dateRange 类型的 insetInput', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen insetInput motion={false} />);
        const dateInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(within(getPopup()).queryByPlaceholderText('HH:mm:ss')).toBeNull();
        expect(getPopup().querySelector(`.${dp}-inset-input-separator`)).toHaveTextContent('-');
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('foundation openPanel 与 closePanel', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} onOpenChange={onOpenChange} />);
        await userEvent.click(container.querySelector('input'));
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation handleInputComplete 处理合法输入', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        await userEvent.clear(input);
        await userEvent.type(input, '2021-06-15{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(input).toHaveValue('2021-06-15');
    });

    it('foundation handleInputComplete 输入为空时使用当前日期', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue(ymd(new Date()));
    });

    it('foundation handleInputComplete 范围类型输入为空', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.type(startInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(new Date()), ymd(new Date())]);
        expect(startInput).toHaveValue(ymd(new Date()));
        expect(endInput).toHaveValue(ymd(new Date()));
    });

    it('foundation parseInput 处理 dateRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelectorAll('input')[1], { target: { value: '2021-06-20' } });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 20)], ['2021-06-01', '2021-06-20']);
    });

    it('foundation parseInput 处理 dateTime 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-15 10:30:00' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 10, 30), '2021-06-15 10:30:00');
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-16' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('foundation parseInput 处理 month 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" defaultValue={new Date(2021, 5)} defaultOpen motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-08' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 7), '2021-08');
        expect(getYMSelected()).toEqual(['2021年', '8月']);
    });

    it('foundation formatDates 处理不同类型', async () => {
        const { container, unmount } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        let [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        unmount();

        const { container: startOnly, unmount: unmountStartOnly } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        [startInput, endInput] = startOnly.querySelectorAll('input');
        fireEvent.focus(startInput);
        await userEvent.click(getDay('2021-06-01'));
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('');
        unmountStartOnly();

        const { container: endOnly } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        [startInput, endInput] = endOnly.querySelectorAll('input');
        fireEvent.focus(endInput);
        await userEvent.click(getDay('2021-06-15'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('foundation formatMultipleDates', async () => {
        const { container } = render(<DatePicker type="date" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} multiple motion={false} />);
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15');
    });

    it('foundation handleRangeInputClear', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const value = [new Date(2021, 5, 1), new Date(2021, 5, 15)];
        const { container } = render(<DatePicker type="dateRange" value={value} motion={false} onChange={onChange} onClear={onClear} />);
        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('foundation handlePresetClick 处理 date 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultOpen motion={false} presets={[{ text: 'Today', start: new Date() }]} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue(ymd(new Date()));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation handlePresetClick 处理函数值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const start = vi.fn<() => Date>(() => new Date(2021, 5, 1));
        const { container } = render(<DatePicker type="date" defaultOpen motion={false} presets={[{ text: 'Lazy', start }]} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: 'Lazy' }));
        expect(start).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 1), '2021-06-01');
        expect(container.querySelector('input')).toHaveValue('2021-06-01');
    });

    it('foundation handleConfirm', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} needConfirm onConfirm={onConfirm} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.focus(startInput);
        await userEvent.click(getDay('2021-06-03'));
        fireEvent.focus(endInput);
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
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} needConfirm onCancel={onCancel} />);
        await userEvent.click(getDay(ymd(addDays(baseDate, 2))));
        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledWith(baseDate, format(baseDate, strings.FORMAT_DATE_TIME));
        expect(container.querySelector('input')).toHaveValue(format(baseDate, strings.FORMAT_DATE_TIME));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation _parseValue 处理各种输入', async () => {
        const inputValueOf = (defaultValue) => {
            const { container, unmount } = render(<DatePicker defaultValue={defaultValue} motion={false} />);
            const value = container.querySelector('input').value;
            unmount();
            return value;
        };
        expect(inputValueOf(new Date(2021, 5, 1))).toBe('2021-06-01');
        expect(inputValueOf('2021-06-01')).toBe('2021-06-01');
        expect(inputValueOf(new Date(2021, 5, 1).getTime())).toBe('2021-06-01');
        expect(inputValueOf(null)).toBe('');
        // silence the expected error reports of React and jsdom
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const preventReport = (e) => e.preventDefault();
        window.addEventListener('error', preventReport);
        const invalidValue = {} as unknown as DatePickerProps['defaultValue'];
        expect(() => render(<DatePicker defaultValue={invalidValue} motion={false} />)).toThrow(TypeError);
        window.removeEventListener('error', preventReport);
        consoleError.mockRestore();
    });

    it('foundation handleTriggerWrapperClick 处理范围类型', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} onOpenChange={onOpenChange} />);
        await userEvent.click(container.querySelector(`.${dp}-range-input`));
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(container.querySelectorAll('input')[0]).toHaveFocus());
    });

    it('foundation handleTriggerWrapperClick 禁用时', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = render(<DatePicker type="dateRange" disabled motion={false} onOpenChange={onOpenChange} />);
        fireEvent.click(container.querySelector(`.${dp}-range-input`));
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });

    it('foundation handleYMSelectedChange 处理 monthRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="monthRange" defaultValue={[new Date(2021, 2), new Date(2021, 8)]} defaultOpen motion={false} onChange={onChange} />);
        const [, leftMonths, , rightMonths] = getYMLists();
        await userEvent.click(within(rightMonths).getByRole('option', { name: '10月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 2), new Date(2021, 9)], ['2021-03', '2021-10']);
        await userEvent.click(within(leftMonths).getByRole('option', { name: '2月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 1), new Date(2021, 9)], ['2021-02', '2021-10']);
        expect(container.querySelector('input')).toHaveValue('2021-02 ~ 2021-10');
    });

    it('foundation disposeCallbackArgs 处理时区', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} motion={false} timeZone="Asia/Tokyo" onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-10' } });
        const [date, dateString] = onChange.mock.calls[0] as [Date, string];
        expect(date).toEqual(zonedTimeToUtc(new Date(2021, 5, 10), 'Asia/Tokyo'));
        expect(dateString).toBe(format(date, 'yyyy-MM-dd'));
    });

    it('foundation disposeCallbackArgs 处理多选日期类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={[new Date(2021, 5, 1)]} multiple defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
    });

    it('foundation disposeCallbackArgs 处理 dateRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelectorAll('input')[0], { target: { value: '2021-06-02' } });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 2), new Date(2021, 5, 15)], ['2021-06-02', '2021-06-15']);
    });

    it('needConfirm 下 foundation initFromProps', async () => {
        const props = { type: 'dateTime' as const, needConfirm: true, motion: false, defaultOpen: true };
        const { container, rerender } = render(<DatePicker {...props} value={baseDate} />);
        rerender(<DatePicker {...props} value={new Date(2021, 5, 15, 10, 30)} />);
        expect(container.querySelector('input')).toHaveValue('2021-06-15 10:30:00');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
    });

    it('foundation parseWithTimezone 处理合法时区', async () => {
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} timeZone="Asia/Shanghai" />);
        // the test environment runs in Asia/Shanghai
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('foundation parseWithTimezone 处理 prevTimeZone', async () => {
        const { container, rerender } = render(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} timeZone="Asia/Shanghai" />);
        rerender(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} timeZone="Asia/Tokyo" />);
        expect(container.querySelector('input')).toHaveValue('2019-09-08 09:08:08');
    });

    it('foundation handlePanelVisibleChange', async () => {
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} insetInput motion={false} />);
        const triggerInput = container.querySelector('input');
        await userEvent.click(triggerInput);
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(triggerInput).toBeDisabled());
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(triggerInput).toBeEnabled());
    });

    it('triggerRender 且值为空时 foundation initRangeInputFocus', async () => {
        render(<DatePicker type="dateRange" defaultValue={[]} motion={false} triggerRender={({ rangeInputFocus }) => <div data-testid="trigger">{String(rangeInputFocus)}</div>} />);
        expect(screen.getByTestId('trigger')).toHaveTextContent('rangeStart');
    });

    it('triggerRender 的范围类型下 foundation handleTriggerWrapperClick', async () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} triggerRender={({ rangeInputFocus }) => <div className="custom-trigger">{String(rangeInputFocus)}</div>} />);
        const trigger = container.querySelector('.custom-trigger');
        expect(trigger).toHaveTextContent('undefined');
        await userEvent.click(trigger);
        expect(getPopup()).not.toBeNull();
        expect(trigger).toHaveTextContent('rangeStart');
    });

    it('foundation getLooseDateFromInput', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        fireEvent.change(container.querySelectorAll('input')[0], { target: { value: '2021-06-01' } });
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(document.querySelector(`.${dp}-day-selected-end`)).toBeNull();
    });

    it('foundation parseInputLoose 处理 date 类型', async () => {
        const { container } = render(<DatePicker type="date" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-15' } });
        expect(getSelectedDays()).toEqual(['2021-06-15']);
        fireEvent.change(input, { target: { value: 'invalid' } });
        expect(getSelectedDays()).toEqual([]);
        fireEvent.change(input, { target: { value: '' } });
        expect(getSelectedDays()).toEqual([]);
    });

    it('foundation parseInputLoose 处理 dateRange 类型', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(startInput, { target: { value: '2021-06-01' } });
        fireEvent.change(endInput, { target: { value: '2021-06-15' } });
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('foundation parseMultipleInput', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" multiple motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-01,2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        fireEvent.change(input, { target: { value: 'invalid,2021-06-15' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('invalid,2021-06-15');
    });

    it('foundation parseMultipleInput 带 max', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" max={1} multiple motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-01,2021-06-15' } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选输入按 Enter 时去除重复日期', async () => {
        const { container } = render(<DatePicker type="date" multiple motion={false} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-01,2021-06-15,2021-06-01' } });
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue('2021-06-01,2021-06-15');
    });

    it('foundation parseMultipleInputLoose', async () => {
        const { container } = render(<DatePicker type="date" multiple defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2021-06-01,2021-06-1' } });
        expect(getSelectedDays()).toEqual(['2021-06-01']);
    });

    it('多选的 insetInput 按内嵌格式解析输入', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" multiple defaultOpen format="yyyy-MM-dd EEEE" insetInput motion={false} onChange={onChange} />);
        fireEvent.change(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), {
            target: { value: '2021-06-01,2021-06-15' },
        });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01 星期二', '2021-06-15 星期二']);
    });

    it('multiple 只对 date 生效，dateTime 忽略 multiple 按单选交出值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" multiple defaultOpen defaultPickerValue={new Date(2021, 5, 1, 10, 0, 0)} motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15, 10, 0, 0), '2021-06-15 10:00:00');
    });

    it('foundation _someDateDisabled 处理范围类型', async () => {
        const disabledDate = vi.fn<DisabledDateType>(() => false);
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} disabledDate={disabledDate} motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelectorAll('input')[1], { target: { value: '2021-06-10' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(disabledDate).toHaveBeenCalledWith(new Date(2021, 5, 10), expect.objectContaining({ rangeStart: '2021-06-01', rangeEnd: '2021-06-10' }));
    });

    it('foundation disposeDateFn', async () => {
        const disabledDate = vi.fn<DisabledDateType>((date) => date.getDate() === 10);
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen disabledDate={disabledDate} motion={false} />);
        expect(disabledDate.mock.calls.every(([date]) => date instanceof Date)).toBe(true);
        expect(getDay('2019-09-10')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-11')).toHaveAttribute('aria-disabled', 'false');
    });

    it('monthsGrid 通过 foundation 显示年份选择器', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} />);
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'none');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'left');
        expect(getPanel('left')).toHaveClass(`${dp}-yam-showing`);
        expect(getPanel('left').querySelector(`.${dp}-month`)).toBeNull();
    });

    it('monthsGrid 的 dateRange 类型显示两个面板', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} />);
        expect(getPopup().querySelectorAll(`.${dp}-month`)).toHaveLength(2);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
    });

    it('monthsGrid 上一年与下一年按钮', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevYear }));
        expect(getNavTitle('left')).toBe('2018年 9月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        expect(getNavTitle('left')).toBe('2020年 9月');
    });

    it('getDefaultPickerDate 工具函数', () => {
        const getDefaultPickerDate = (options: object) => getDefaultPickerDateModule.default(options as Parameters<typeof getDefaultPickerDateModule.default>[0]);
        const result1 = getDefaultPickerDate({});
        expect(result1.nowDate).toBeInstanceOf(Date);
        expect(result1.nextDate).toBeInstanceOf(Date);
        const result2 = getDefaultPickerDate({ defaultPickerValue: [new Date(2021, 5, 1), new Date(2021, 6, 1)] });
        expect(result2.nowDate).toBeInstanceOf(Date);
        const result3 = getDefaultPickerDate({ defaultPickerValue: new Date(2021, 5, 1) });
        expect(result3.nowDate).toBeInstanceOf(Date);
        const result4 = getDefaultPickerDate({ defaultPickerValue: '2021-06-01', format: 'yyyy-MM-dd' });
        expect(result4.nowDate).toBeInstanceOf(Date);
    });

    it('getFullDateOffset 工具函数', () => {
        const getFullDateOffset = getFullDateOffsetModule.default;
        const result = getFullDateOffset((d) => addDays(d, -3), new Date(2021, 5, 15));
        expect(result).toBeTruthy();
        const result2 = getFullDateOffset(undefined, new Date(2021, 5, 15));
        expect(result2).toBeTruthy();
        const result3 = getFullDateOffset((d) => d, '');
        expect(result3).toBe('');
    });

    it('getFullDateOffset 在 UTC 以西时区按本地日期解析字符串', () => {
        const originalTZ = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            const getFullDateOffset = getFullDateOffsetModule.default;
            expect(getFullDateOffset(undefined, '2021-06-16')).toBe('2021-06-16');
            expect(getFullDateOffset(startOfWeek, '2021-06-13')).toBe('2021-06-13');
            expect(getFullDateOffset(endOfWeek, '2021-06-13')).toBe('2021-06-19');
        } finally {
            process.env.TZ = originalTZ;
        }
    });

    it('parser compatibleParse', () => {
        const { compatibleParse } = parserModule;
        const d1 = compatibleParse('2021-06-15', 'yyyy-MM-dd');
        expect(d1).toBeInstanceOf(Date);
        const d2 = compatibleParse('2021-06-15', 'yyyy-MM-dd', new Date());
        expect(d2).toBeInstanceOf(Date);
        const d3 = compatibleParse('not-a-date', 'yyyy-MM-dd');
        expect(d3 === null || d3 instanceof Date).toBe(true);
    });

    it('isAfter、isBefore、isBetween 与 isSameDay 工具函数', () => {
        const isAfter = isAfterModule.default;
        const isBefore = isBeforeModule.default;
        const isBetween = isBetweenModule.default;
        const isSameDay = isSameDayModule.default;

        const d1 = new Date(2021, 5, 1);
        const d2 = new Date(2021, 5, 15);
        const d3 = new Date(2021, 5, 10);

        expect(isAfter(d2, d1)).toBe(true);
        expect(isAfter(d1, d2)).toBe(false);
        expect(isAfter('2021-06-15', '2021-06-01')).toBe(true);

        expect(isBefore(d1, d2)).toBe(true);
        expect(isBefore(d2, d1)).toBe(false);
        expect(isBefore('2021-06-01', '2021-06-15')).toBe(true);

        expect(isBetween(d3, { start: d1, end: d2 })).toBe(true);
        expect(isBetween(d1, { start: d1, end: d2 })).toBe(false);
        expect(isBetween('2021-06-10', { start: '2021-06-01', end: '2021-06-15' })).toBe(true);

        expect(isSameDay(d1, d1)).toBe(true);
        expect(isSameDay(d1, d2)).toBe(false);
        expect(isSameDay('2021-06-01', '2021-06-01')).toBe(true);
    });

    it('受控 value 更新', async () => {
        const Wrapper = () => {
            const [value, setValue] = React.useState(baseDate);
            return (
                <div>
                    <DatePicker value={value} motion={false} onChange={(date) => setValue(date as Date)} />
                    <button id="update" onClick={() => setValue(new Date(2022, 0, 1))}>
                        Update
                    </button>
                </div>
            );
        };
        render(<Wrapper />);
        expect(screen.getByRole('combobox')).toHaveValue(ymd(baseDate));
        await userEvent.click(screen.getByRole('button', { name: 'Update' }));
        expect(screen.getByRole('combobox')).toHaveValue('2022-01-01');
    });

    it('受控 open', async () => {
        const Wrapper = () => {
            const [open, setOpen] = React.useState(false);
            return (
                <div>
                    <DatePicker defaultValue={baseDate} motion={false} open={open} onOpenChange={setOpen} />
                    <button id="open" onClick={() => setOpen(true)}>
                        Open
                    </button>
                    <button id="close" onClick={() => setOpen(false)}>
                        Close
                    </button>
                </div>
            );
        };
        render(<Wrapper />);
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
        const disabledTime = () => ({
            disabledHours: () => [0, 1, 2, 3],
            disabledMinutes: () => [0, 15, 30, 45],
            disabledSeconds: () => [0],
        });
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen disabledTime={disabledTime} motion={false} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const disabledTexts = (list: Element) => [...new Set(Array.from(list.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent))];
        const [hours, minutes, seconds] = getPopup().querySelectorAll(`.${dp}-tpk ul[role="listbox"]`);
        expect(disabledTexts(hours)).toEqual(['00', '01', '02', '03']);
        expect(disabledTexts(minutes)).toEqual(['00', '15', '30', '45']);
        expect(disabledTexts(seconds)).toEqual(['00']);
    });

    it('foundation focus 与 blur 方法', async () => {
        const ref = React.createRef<DatePickerHandle>();
        const { container } = render(<DatePicker ref={ref} type="date" defaultValue={baseDate} motion={false} />);
        const input = container.querySelector('input');
        act(() => ref.current.focus());
        expect(input).toHaveFocus();
        act(() => ref.current.blur());
        expect(input).not.toHaveFocus();
    });

    it('foundation 范围类型的 focus 与 blur', async () => {
        const ref = React.createRef<DatePickerHandle>();
        const { container } = render(<DatePicker ref={ref} type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        act(() => ref.current.focus('rangeStart'));
        expect(startInput).toHaveFocus();
        act(() => ref.current.blur());
        expect(startInput).not.toHaveFocus();
        act(() => ref.current.focus('rangeEnd'));
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        act(() => ref.current.blur());
        expect(endInput).not.toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('foundation handleInputFocus 处理范围类型', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = render(<DatePicker type="dateRange" motion={false} onFocus={onFocus} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        act(() => startInput.focus());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        act(() => endInput.focus());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('foundation handleRangeEndTabPress', async () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} />);
        const endInput = container.querySelectorAll('input')[1];
        act(() => endInput.focus());
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.tab();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('多选达到 max 上限', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} max={2} multiple defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-15']);
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1)], ['2021-06-01']);
        await userEvent.click(getDay('2021-06-20'));
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-20']);
    });

    it('format 与 locale', async () => {
        const { container } = render(
            <LocaleProvider locale={en_US}>
                <DatePicker defaultValue={baseDate} format="MM/dd/yyyy" motion={false} />
            </LocaleProvider>
        );
        expect(container.querySelector('input')).toHaveValue('09/08/2019');
    });

    it('foundation handleSelectedChange 处理 dateRange 值为 null 的不完整值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(container.querySelectorAll('input')[0]).toHaveValue('2021-06-01');
    });

    it('foundation handleSelectedChange 带 insetInput', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultPickerValue="2021-06-01" insetInput motion={false} open onChange={onChange} />);
        const insetInput = within(getPopup()).getByPlaceholderText('yyyy-MM-dd');
        expect(insetInput).toHaveValue('');
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(insetInput).toHaveValue('2021-06-15');
    });

    it('受控时预设只通知不改值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" value={baseDate} defaultOpen motion={false} presets={[{ text: 'Preset', start: new Date(2021, 5, 15) }]} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: 'Preset' }));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('切到下一月时调用一次 onPanelChange', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} onPanelChange={onPanelChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toBe('2019-10-08');
    });

    it('inputFoundation getInsetInputPlaceholder 处理 dateTime', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen format="yyyy/MM/dd HH:mm" insetInput motion={false} />);
        expect(within(getPopup()).getByPlaceholderText('yyyy/MM/dd')).toHaveValue('2019/09/08');
        expect(within(getPopup()).getByPlaceholderText('HH:mm')).toHaveValue('08:08');
    });

    it('inputFoundation getInsetInputPlaceholder 处理 date', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen insetInput motion={false} />);
        const insetInputs = getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM-dd');
    });

    it('inputFoundation concatInsetInputValue 处理 dateTime 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen insetInput motion={false} onChange={onChange} />);
        fireEvent.change(within(getPopup()).getByPlaceholderText('HH:mm:ss'), { target: { value: '10:30:00' } });
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 10, 30), '2019-09-08 10:30:00');
    });

    it('inputFoundation getInsetInputValue 传入对象形式的 insetInputValue', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen insetInput motion={false} onChange={onChange} />);
        const insetInput = within(getPopup()).getByPlaceholderText('yyyy-MM-dd');
        fireEvent.change(insetInput, { target: { value: '2019-09-1' } });
        expect(insetInput).toHaveValue('2019-09-1');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('inputFoundation getInsetInputValue 不传对象形式的 insetInputValue', async () => {
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} defaultOpen insetInput motion={false} />);
        fireEvent.change(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), { target: { value: '2019-09-1' } });
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(container.querySelector('input'));
        expect(within(getPopup()).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
    });

    it('inputFoundation handleInsetInputChange 处理 dateTime', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultOpen defaultPickerValue={new Date(2021, 5, 1, 9, 30, 0)} insetInput motion={false} onChange={onChange} />);
        const timeInput = within(getPopup()).getByPlaceholderText('HH:mm:ss');
        expect(timeInput).toBeDisabled();
        fireEvent.change(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), { target: { value: '2021-06-15' } });
        expect(timeInput).toHaveValue('09:30:00');
        expect(timeInput).toBeEnabled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 9, 30), '2021-06-15 09:30:00');
    });

    it('inputFoundation _autoFillTimeToInsetInputValue 的 monthRight 分支', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultOpen defaultPickerValue={[new Date(2021, 5, 1, 10, 0, 0), new Date(2021, 6, 1, 18, 0, 0)]} insetInput motion={false} onChange={onChange} />);
        const [startDate, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        fireEvent.change(startDate, { target: { value: '2021-06-01' } });
        fireEvent.change(endDate, { target: { value: '2021-06-20' } });
        const timeInputs = within(getPopup()).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('inputFoundation concatInsetInputValue 处理 dateRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultOpen insetInput motion={false} onChange={onChange} />);
        const [startDate, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        fireEvent.change(startDate, { target: { value: '2021-06-01' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(endDate, { target: { value: '2021-06-15' } });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('inputFoundation concatInsetInputValue 处理 dateTimeRange 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} onChange={onChange} />);
        const [, endTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        fireEvent.change(endTime, { target: { value: '20:00:00' } });
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);
    });

    it('inputFoundation getInsetInputPlaceholder 处理 monthRange', async () => {
        render(<DatePicker type="monthRange" defaultOpen insetInput motion={false} />);
        const insetInputs = getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM ~ yyyy-MM');
    });

    it('inputFoundation formatShowText 处理 dateRange', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} format="yyyy/MM/dd" motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021/06/01');
        expect(endInput).toHaveValue('2021/06/15');
    });

    it('inputFoundation formatShowText 处理 monthRange', async () => {
        const { container } = render(<DatePicker type="monthRange" defaultValue={[new Date(2021, 2), new Date(2021, 8)]} motion={false} />);
        expect(container.querySelectorAll('input')).toHaveLength(1);
        expect(container.querySelector('input')).toHaveValue('2021-03 ~ 2021-09');
    });

    it('dateInput renderRangeSuffix 与分隔符', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} rangeSeparator=" - " />);
        const separator = container.querySelector(`.${dp}-range-input-separator`);
        expect(separator).toHaveTextContent('-');
        expect(separator).toHaveClass(`${dp}-range-input-separator-active`);
        expect(container.querySelector(`.${dp}-range-input-suffix svg`)).not.toBeNull();
    });

    it('dateInput 的 inputReadOnly', async () => {
        const { container } = render(<DatePicker defaultValue={baseDate} inputReadOnly motion={false} />);
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        expect(container.querySelector(`.${dp}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={baseDate} inputReadOnly motion={false} showClear onChange={onChange} />);
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        await userEvent.hover(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`));
        fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('范围选择的 inputReadOnly 锁定两个输入框', () => {
        const { container } = render(<DatePicker type="dateRange" inputReadOnly motion={false} />);
        const inputs = container.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        inputs.forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('dateInput 的 prefix', async () => {
        const { container } = render(<DatePicker defaultValue={baseDate} motion={false} prefix={<span className="test-prefix">Prefix</span>} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix .test-prefix`)).toHaveTextContent('Prefix');
    });

    it('monthsGrid foundation showTimePicker 与 showDatePanel', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} />);
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
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen disabledTimePicker motion={false} />);
        const switchTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(switchTime).toHaveClass(`${dp}-switch-time-disabled`);
        await userEvent.click(switchTime);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPopup().querySelector(`.${dp}-tpk`)).toBeNull();
    });

    it('monthsGrid foundation handleDayClick 处理 dateTimeRange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        expect(container.querySelectorAll('input')[0]).toHaveValue('2021-06-10 10:00:00');
    });

    it('monthsGrid foundation handleTimeChange 处理 dateTime', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 选择小时时 onChange 只触发一次，带有值时的毫秒', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 无值时选择小时 onChange 只触发一次，且不带旧时间', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(hourList).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(14);
    });

    it('monthsGrid foundation handleTimeChange 处理 dateTimeRange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        const [rightHours] = getPanel('right').querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(rightHours).getAllByRole('option', { name: '20' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);

        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        const [leftHours] = getPanel('left').querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(leftHours).getAllByRole('option', { name: '08' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 8), new Date(2021, 5, 15, 20)], ['2021-06-01 08:00:00', '2021-06-15 20:00:00']);
    });

    it('monthsGrid foundation handleDayHover', async () => {
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        await userEvent.click(getDay('2021-06-08'));
        const hoverCls = `${dp}-day-hoverday-around-singleselected`;
        await userEvent.hover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).toHaveClass(hoverCls);
        await userEvent.unhover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).not.toHaveClass(hoverCls);
    });

    it('monthsGrid foundation handleDayHover 带 offset', async () => {
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" endDateOffset={(d) => addDays(d, 2)} motion={false} startDateOffset={(d) => addDays(d, -2)} />);
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-hoverday`);
        expect(getDay('2021-06-08')).toHaveClass(`${dp}-day-offsetrange-start`);
        expect(getDay('2021-06-12')).toHaveClass(`${dp}-day-offsetrange-end`);
        expect(getDay('2021-06-09')).toHaveClass(`${dp}-day-inoffsetrange`);
        expect(getDay('2021-06-13')).not.toHaveClass(`${dp}-day-inoffsetrange`);
    });

    it('monthsGrid foundation handleSwitchMonthOrYear 带 syncSwitchMonth', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} syncSwitchMonth onPanelChange={onPanelChange} />);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-07-01', '2021-08-15']);
    });

    it('范围选择器切换右面板时 onPanelChange 报告两侧实际面板日期', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} onPanelChange={onPanelChange} />);
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-06-01', '2021-08-15']);
    });

    it('defaultPickerValue 按 format 解析且数组形式的变化会移动面板', () => {
        const { rerender } = render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="01/02/2021" format="dd/MM/yyyy" motion={false} />);
        expect(getNavTitle('left')).toBe('2021年 2月');
        expect(getNavTitle('right')).toBe('2021年 3月');
        rerender(<DatePicker type="dateRange" defaultOpen defaultPickerValue={[new Date(2022, 4, 1), new Date(2022, 7, 1)]} format="dd/MM/yyyy" motion={false} />);
        expect(getNavTitle('left')).toBe('2022年 5月');
        expect(getNavTitle('right')).toBe('2022年 8月');
        rerender(<DatePicker type="dateRange" defaultOpen defaultPickerValue="10.03.2021" format="dd.MM.yyyy" motion={false} />);
        expect(getNavTitle('left')).toBe('2021年 3月');
    });

    it('monthsGrid foundation prevYear 与 nextYear', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevYear}"]`));
        expect(getNavTitle('left')).toBe('2020年 6月');
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextYear}"]`));
        expect(getNavTitle('right')).toBe('2022年 7月');
    });

    it('monthsGrid foundation handleRangeSelected 带 offset', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" endDateOffset={(d) => addDays(d, 2)} motion={false} startDateOffset={(d) => addDays(d, -2)} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 8), new Date(2021, 5, 12)], ['2021-06-08', '2021-06-12']);
    });

    it('monthsGrid foundation toMonth 与 toYear', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(monthList).getByRole('option', { name: '4月' }));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`));
        expect(getNavTitle('left')).toBe('2023年 4月');
    });

    it('monthsGrid foundation _autoAdjustMonth', async () => {
        const { unmount } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
        unmount();

        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 8, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-09-01')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('monthsGrid foundation getValidTimeFormat', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen format="yyyy-MM-dd HH:mm" motion={false} />);
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).not.toHaveTextContent('08:08:08');
    });

    it('monthsGrid foundation updateDateAfterChangeYM', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} autoSwitchDate defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(ymd(onChange.mock.calls[0][0] as Date)).toBe('2019-10-08');
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08');
        expect(container.querySelector('input')).toHaveValue('2019-10-08');
        expect(getPopup()).not.toBeNull();
    });

    it('month.tsx 日期渲染与选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        expect(getPopup().querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(30);
        expect(getDay('2019-09-08')).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 11), '2019-09-11');
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
    });

    it('dateRange 同时选择起止日期后触发 onChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getDay('2021-06-30'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 30)], ['2021-06-01', '2021-06-30']);
    });

    it('dateTimeRange 选择日期后走范围选择流程', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = render(<DatePicker type="dateTimeRange" defaultOpen defaultPickerValue="2021-06-01" motion={false} needConfirm onChange={onChange} onConfirm={onConfirm} />);
        await userEvent.click(getDay('2021-06-01'));
        await userEvent.click(getDay('2021-06-30'));
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-30')).toHaveClass(`${dp}-day-selected-end`);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect((onConfirm.mock.calls[0][1] as string[]).map((v) => v.slice(0, 10))).toEqual(['2021-06-01', '2021-06-30']);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput.value.startsWith('2021-06-01')).toBe(true);
        expect(endInput.value.startsWith('2021-06-30')).toBe(true);
    });

    it('monthsGrid foundation _isNeedSwap', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 15), new Date(2021, 5, 1)]} defaultOpen motion={false} />);
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-inrange`);
    });

    it('monthsGrid foundation toYearMonth', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 2), new Date(2021, 8)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        const [yearList, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        expect(getNavTitle('left')).toBe('2023年 3月');
        await userEvent.click(within(monthList).getByRole('option', { name: '6月' }));
        expect(getNavTitle('left')).toBe('2023年 6月');
    });

    it('monthsGrid getYAMOpenType 右侧打开', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} />);
        const monthGrid = getPopup().querySelector(`.${dp}-month-grid`);
        await userEvent.click(getPanel('right').querySelector(`.${dp}-navigation-month button`));
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'right');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'both');
    });

    it('dateRange 的 rangeEnd 早于 rangeStart 时重置起始值', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 10), new Date(2021, 5, 20)]} motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(endInput);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-05');
        expect(getDay('2021-06-05')).toHaveClass(`${dp}-day-selected-end`);
        expect(onChange).not.toHaveBeenCalled();
        await waitFor(() => expect(startInput).toHaveFocus());
    });

    it('foundation handleInputChange 带 insetInput 的 dateTime', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen insetInput motion={false} onChange={onChange} />);
        fireEvent.change(within(getPopup()).getByPlaceholderText('yyyy-MM-dd'), { target: { value: '2021-06-1' } });
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('month.tsx renderDay 使用 renderDate 属性', async () => {
        const renderDate = (dayNumber, fullDate) => (
            <span className="custom-day" title={fullDate}>
                {dayNumber}
            </span>
        );
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} renderDate={renderDate} />);
        const customDay = getDay('2019-09-08').querySelector('.custom-day');
        expect(customDay).toHaveAttribute('title', '2019-09-08');
        expect(customDay).toHaveTextContent('8');
        expect(getDay('2019-09-08')).toHaveClass(`${dp}-day-selected`);
    });

    it('month.tsx 高亮今天', async () => {
        render(<DatePicker type="date" defaultOpen motion={false} />);
        const today = getPopup().querySelectorAll(`.${dp}-day-today`);
        expect(today).toHaveLength(1);
        expect(today[0]).toHaveAttribute('aria-label', ymd(new Date()));
    });

    it('foundation handleRangeInputBlur（空方法）', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} onChange={onChange} />);
        const [startInput] = container.querySelectorAll('input');
        fireEvent.change(startInput, { target: { value: '2021-06-0' } });
        fireEvent.blur(startInput);
        expect(startInput).toHaveValue('2021-06-0');
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('foundation handleInputBlur（空方法）', async () => {
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { container } = render(<DatePicker type="date" defaultOpen motion={false} onBlur={onBlur} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-1' } });
        fireEvent.blur(input);
        expect(onBlur).not.toHaveBeenCalled();
        expect(input).toHaveValue('2021-06-1');
        expect(getPopup()).not.toBeNull();
    });

    it('parser compatibleParse 带 locale', () => {
        const { compatibleParse } = parserModule;
        const d1 = compatibleParse('2021-06-15', 'yyyy-MM-dd', undefined, enUS);
        expect(d1).toBeInstanceOf(Date);
    });

    it('monthsGrid foundation handleSyncChangeMonths 右侧面板与左侧同月', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        const [, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(monthList).getByRole('option', { name: '7月' }));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('monthsGrid updateDateAfterChangeYM 处理 dateTime 类型', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={baseDate} autoSwitchDate defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08 08:08:08');
    });

    it('monthsGrid updateDateAfterChangeYM 带 disabledDate', async () => {
        const disabledDate = () => true;
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} autoSwitchDate defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('getDefaultPickerDate 处理字符串数组', () => {
        const getDefaultPickerDate = getDefaultPickerDateModule.default;
        const result = getDefaultPickerDate({
            defaultPickerValue: ['2021-06-01', '2021-09-01'],
            format: 'yyyy-MM-dd',
            dateFnsLocale: enUS,
        });
        expect(result.nowDate).toBeInstanceOf(Date);
        expect(result.nextDate).toBeInstanceOf(Date);
    });

    it('getYears 结束年份小于起始年份时交换', () => {
        const getYears = getYearsModule.default;
        const years = getYears(2025, 2020);
        expect(years[0]).toBe(2020);
        expect(years[years.length - 1]).toBe(2025);
        expect(years.length).toBe(6);
    });

    it('getInsetInputValueFromInsetInputStr 处理 month 类型', () => {
        const fn = getInsetInputValueFromInsetInputStrModule.default;
        const result = fn({ inputValue: '2021-06', rangeSeparator: ' ~ ', type: 'month' });
        expect(result.monthLeft.dateInput).toBe('2021-06');
    });

    it('getInsetInputValueFromInsetInputStr 处理 monthRange 类型', () => {
        const fn = getInsetInputValueFromInsetInputStrModule.default;
        const result = fn({ inputValue: '2021-06', rangeSeparator: ' ~ ', type: 'monthRange' });
        expect(result.monthLeft.dateInput).toBe('2021-06');
    });

    it('getInsetInputValueFromInsetInputStr 处理 dateRange 类型', () => {
        const fn = getInsetInputValueFromInsetInputStrModule.default;
        const result = fn({ inputValue: '2021-06-01 ~ 2021-06-15', rangeSeparator: ' ~ ', type: 'dateRange' });
        expect(result.monthLeft.dateInput).toBe('2021-06-01');
        expect(result.monthRight.dateInput).toBe('2021-06-15');
    });

    it('getInsetInputValueFromInsetInputStr 处理 dateTime 类型', () => {
        const fn = getInsetInputValueFromInsetInputStrModule.default;
        const result = fn({ inputValue: '2021-06-01 10:00:00', rangeSeparator: ' ~ ', type: 'dateTime' });
        expect(result.monthLeft.dateInput).toBe('2021-06-01');
        expect(result.monthLeft.timeInput).toBe('10:00:00');
    });

    it('getInsetInputValueFromInsetInputStr 处理 dateTimeRange 类型', () => {
        const fn = getInsetInputValueFromInsetInputStrModule.default;
        const result = fn({
            inputValue: '2021-06-01 10:00:00 ~ 2021-06-15 18:00:00',
            rangeSeparator: ' ~ ',
            type: 'dateTimeRange',
        });
        expect(result.monthLeft.dateInput).toBe('2021-06-01');
        expect(result.monthLeft.timeInput).toBe('10:00:00');
        expect(result.monthRight.dateInput).toBe('2021-06-15');
        expect(result.monthRight.timeInput).toBe('18:00:00');
    });

    it('dateRange 带 prefix 时渲染范围前缀', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} prefix={<span className="dp-prefix">P</span>} />);
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-prefix`)).toHaveTextContent('P');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('dateRange 带 insetLabel 时渲染范围前缀', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} insetLabel={<span className="dp-inset-label">Label</span>} motion={false} />);
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-inset-label`)).toHaveTextContent('Label');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('dateRange renderRangeClearBtn 带 showClearIgnoreDisabled', async () => {
        const onClear = vi.fn<NonNullable<DatePickerProps['onClear']>>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} disabled insetInput motion={false} showClear onClear={onClear} />);
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
        fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('dateInput formatText 空值返回空字符串', async () => {
        const { container } = render(<DatePicker type="date" motion={false} />);
        expect(container.querySelector('input')).toHaveValue('');
        const { container: rangeContainer } = render(<DatePicker type="dateRange" value={null} motion={false} />);
        rangeContainer.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
    });

    it('dateInput isRenderMultipleInputs 返回正确结果', async () => {
        const { container: rangeContainer } = render(<DatePicker type="dateRange" motion={false} />);
        expect(rangeContainer.querySelectorAll('input')).toHaveLength(2);

        const { container: monthRangeContainer } = render(<DatePicker type="monthRange" motion={false} />);
        expect(monthRangeContainer.querySelectorAll('input')).toHaveLength(1);

        const { container: dateContainer } = render(<DatePicker type="date" motion={false} />);
        expect(dateContainer.querySelectorAll('input')).toHaveLength(1);
    });

    it('dateInput 通过 formatText 自定义文本格式', async () => {
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} format="yyyy年MM月dd日" motion={false} />);
        expect(container.querySelector('input')).toHaveValue('2019年09月08日');
    });

    it('dateInput renderRangeSeparator 同时有起止值', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        expect(container.querySelector(`.${dp}-range-input-separator`)).toHaveClass(`${dp}-range-input-separator-active`);
        const { container: empty } = render(<DatePicker type="dateRange" motion={false} />);
        expect(empty.querySelector(`.${dp}-range-input-separator`)).not.toHaveClass(`${dp}-range-input-separator-active`);
    });

    it('dateRange 的 size 为 large 时使用范围默认尺寸', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} size="large" />);
        expect(container.querySelector(`.${dp}-range-input`)).toHaveClass(`${dp}-range-input-large`);
        container.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper`).forEach((wrapper) => expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-default`));
    });

    it('dateRange 禁用时点击分隔符不触发聚焦', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} disabled motion={false} onFocus={onFocus} />);
        fireEvent.click(container.querySelector(`.${dp}-range-input-separator`));
        expect(onFocus).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });

    it('dateInput handleRangeInputChange 方法', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(startInput, { target: { value: '2021-06-02' } });
        fireEvent.change(endInput, { target: { value: '2021-07-15' } });
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 2), new Date(2021, 6, 15)], ['2021-06-02', '2021-07-15']);
    });

    it('dateRange 自定义清空图标渲染', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} clearIcon={<span className="custom-clear-icon">X</span>} motion={false} showClear />);
        const clearBtn = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clearBtn.querySelector('.custom-clear-icon')).toHaveTextContent('X');
    });

    it('monthRange placeholder 数组拼接', async () => {
        render(<DatePicker type="monthRange" placeholder={['Start', 'End']} motion={false} rangeSeparator=" - " />);
        expect(screen.getByPlaceholderText('Start - End')).toBeInTheDocument();
    });

    it('date 类型无时间的 insetInput', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen insetInput motion={false} />);
        const wrapper = getPopup().querySelector(`.${dp}-inset-input-wrapper`);
        expect(wrapper).toHaveAttribute('x-type', 'date');
        expect(wrapper.querySelectorAll('input')).toHaveLength(1);
        expect(wrapper.querySelector(`.${dp}-inset-input-separator`)).toBeNull();
    });

    it('insetInput 自定义 placeholder', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen insetInput={{ placeholder: { dateStart: 'Date Start', timeStart: 'Time Start' } }} motion={false} />);
        expect(within(getPopup()).getByPlaceholderText('Date Start')).toHaveValue('2019-09-08');
        expect(within(getPopup()).getByPlaceholderText('Time Start')).toHaveValue('08:08:08');
    });

    it('dateRange 的 insetInput 使用 compact 密度', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen density="compact" insetInput motion={false} />);
        const separator = getPopup().querySelector(`.${dp}-inset-input-separator`);
        expect(separator).not.toBeNull();
        expect(separator).toBeEmptyDOMElement();
    });

    it('formatter formatDateValues', () => {
        const { formatDateValues } = formatterModule;
        const r1 = formatDateValues([], 'yyyy-MM-dd', {}, enUS);
        expect(r1).toBe('');
        const r2 = formatDateValues([new Date(2021, 5, 15)], 'yyyy-MM-dd', {}, enUS);
        expect(r2).toBe('2021-06-15');
        const r3 = formatDateValues([new Date(2021, 5, 1), new Date(2021, 5, 15)], 'yyyy-MM-dd', { groupSize: 2, groupInnerSeparator: ' ~ ' }, enUS);
        expect(r3).toBe('2021-06-01 ~ 2021-06-15');
        const r4 = formatDateValues([new Date(2021, 5, 1), null], 'yyyy-MM-dd', { groupSize: 2, groupInnerSeparator: ' ~ ' }, enUS);
        expect(r4).toContain('2021-06-01');
        const r5 = formatDateValues([new Date(2021, 5, 1)], 'yyyy-MM-dd', { groupSize: 0 }, enUS);
        expect(r5).toBe('2021-06-01');
    });

    it('month.tsx 日期元素悬停', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        await userEvent.hover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).toHaveClass(`${dp}-day-inhover`);
        await userEvent.unhover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('monthFoundation renderDay 处理禁用日期', async () => {
        const disabledDate = (date) => {
            return date.getDate() === 15;
        };
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        const disabledDay = getDay('2019-09-15');
        expect(disabledDay).toHaveClass(`${dp}-day-disabled`);
        expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(disabledDay);
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('monthFoundation weekStartsOn = 0（周日）', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} weekStartsOn={0} />);
        const weekdays = screen.getAllByRole('columnheader').map((header) => header.textContent);
        expect(weekdays).toEqual(['日', '一', '二', '三', '四', '五', '六']);
        expect(getWeekDays('left', 0)[0]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('foundation handleSelectedChange 的 dateTime needConfirm 使用 cachedSelectedValue', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        const { container } = render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} needConfirm onConfirm={onConfirm} />);
        await userEvent.click(getDay('2019-09-11'));
        expect(onConfirm).not.toHaveBeenCalled();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledWith(new Date(2019, 8, 11, 8, 8, 8, 8), '2019-09-11 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2019-09-11 08:08:08');
    });

    it('foundation handleSelectedChange 带受控 value', async () => {
        const onChange = vi.fn<(date: Date | Date[]) => void>();
        const TestWrapper = () => {
            const [value, setValue] = React.useState(baseDate);
            return (
                <DatePicker
                    type="date"
                    value={value}
                    defaultOpen
                    motion={false}
                    onChange={(date) => {
                        onChange(date);
                        setValue(date as Date);
                    }}
                />
            );
        };
        const { container } = render(<TestWrapper />);
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 11));
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation _isRangeValueComplete 处理完整范围', async () => {
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 10, 10), new Date(2021, 5, 20, 18)]} motion={false} needConfirm />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(endInput);
        expect(getFooterButtons()[1]).toBeEnabled();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(getFooterButtons()[1]).toBeDisabled();
    });

    it('foundation _isRangeValueComplete 处理非范围类型', async () => {
        render(<DatePicker type="dateTime" defaultOpen motion={false} needConfirm />);
        expect(getFooterButtons()[1]).toBeEnabled();
    });

    it('foundation handleOpenPanel 处理不同状态', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container, rerender } = render(<DatePicker type="date" disabled motion={false} onOpenChange={onOpenChange} />);
        fireEvent.click(container.querySelector(`.${dp}-input`));
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();

        rerender(<DatePicker type="date" motion={false} onOpenChange={onOpenChange} />);
        await userEvent.click(container.querySelector('input'));
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('foundation _someDateDisabled', async () => {
        const disabledDate = (date) => date.getDate() === 15;
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" disabledDate={disabledDate} motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-15' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: '2021-06-10' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        fireEvent.change(input, { target: { value: '' } });
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('foundation handleInputComplete 处理 dateTimeRange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(endInput, { target: { value: '2021-06-20 18:00:00' } });
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
        expect(startInput).toHaveValue('2021-06-01 10:00:00');
        expect(endInput).toHaveValue('2021-06-20 18:00:00');
    });

    it('monthsGrid 的 dateTimeRange 渲染两个面板', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} />);
        expect(getPopup().querySelectorAll(`.${dp}-navigation`)).toHaveLength(2);
        expect(getPanel('left').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-0110:00:00');
        expect(getPanel('right').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-1518:00:00');
    });

    it('monthsGrid 带 dateTimeRange 的 insetInput 渲染内嵌输入框', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} />);
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-insetinput', 'true');
        expect(getPopup().querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(4);
        expect(getPopup().querySelector(`.${dp}-switch`)).toBeNull();
    });

    it('monthsGrid 的 dateTimeRange 通过界面修改时间', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        const [, rightMinutes] = getPanel('right').querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(rightMinutes).getAllByRole('option', { name: '30' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 18, 30)], ['2021-06-01 10:00:00', '2021-06-15 18:30:00']);
    });

    it('monthsGrid foundation handleSwitchMonthOrYear 切换上一月', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 9月');
        expect(onChange.mock.calls.map((args) => args[1])).toEqual(['2019-08-08', '2019-09-08']);
    });

    it('dateRange 范围类型下的 autoSwitchDate', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} autoSwitchDate defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(onChange).not.toHaveBeenCalled();
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('foundation getLooseDateFromInput 处理非法输入', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: 'not-a-date' } });
        expect(getSelectedDays()).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('not-a-date');
    });

    // isCachedSelectedValueValid is not called by the component, so it is tested on the foundation directly
    it('foundation clearInputValue', async () => {
        const { container } = render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} />);
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021-06-1' } });
        expect(input).toHaveValue('2021-06-1');
        fireEvent.mouseDown(document.body);
        expect(input).toHaveValue(ymd(baseDate));
    });

    it('foundation formatMultipleDates 带分隔符', async () => {
        const { container } = render(<DatePicker type="date" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} multiple defaultOpen motion={false} />);
        await userEvent.click(getDay('2021-06-20'));
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15,2021-06-20');
    });

    // the trigger has no multiple range input, so range grouping is tested on the foundation directly
    it('foundation formatMultipleDates 处理 dateRange 类型', async () => {
        const foundation = createDatePickerFoundation({ type: 'dateRange', rangeSeparator: ' ~ ' });
        // formatMultipleDates is protected; bracket access reaches it without a cast
        const result = foundation['formatMultipleDates']([new Date(2021, 5, 1), new Date(2021, 5, 15), new Date(2021, 6, 1), new Date(2021, 6, 15)]);
        expect(result).toBe('2021-06-01 ~ 2021-06-15,2021-07-01 ~ 2021-07-15');
    });

    it('datePicker 的 open 与 close 方法', async () => {
        const ref = React.createRef<DatePickerHandle>();
        render(<DatePicker ref={ref} type="date" motion={false} />);
        act(() => ref.current.open());
        expect(getPopup()).not.toBeNull();
        act(() => ref.current.close());
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('insetInput 面板打开时聚焦已获焦的范围输入框', async () => {
        const ref = React.createRef<DatePickerHandle>();
        render(<DatePicker ref={ref} type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} insetInput motion={false} />);
        act(() => ref.current.focus('rangeEnd'));
        act(() => ref.current.open());
        const [, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        await waitFor(() => expect(endDate).toHaveFocus());
    });

    it('monthsGrid renderYearMonthPanel（showYearPicker）', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 6, 15)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(getPanel('left').querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getPanel('right').querySelector(`.${dp}-yam`)).toBeNull();
        expect(getYMSelected(getPanel('left'))).toEqual(['2021年', '6月']);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-yearmonth-header button`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
    });

    it('monthsGrid renderSwitch 处理带已选日期的 dateTime', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} defaultOpen motion={false} />);
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate })).toHaveTextContent('2019-09-08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');
    });

    it('monthsGrid renderTimePicker 处理 dateTimeRange', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup().querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToDate}"]`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
    });

    it('dateInput adapter 方法：handleRangeStartFocus', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        await userEvent.click(container.querySelector(`.${dp}-range-input-suffix`));
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('monthFoundation weeklyData 指定 weekStartsOn', async () => {
        render(<DatePicker type="date" defaultValue={new Date(2021, 0, 1)} defaultOpen motion={false} weekStartsOn={1} />);
        expect(getPopup().querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(31);
        expect(getWeekDays('left', 0)[4]).toHaveAttribute('aria-label', '2021-01-01');
    });

    it('date 与 time 输入框的 insetInput onChange 回调', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} onChange={onChange} />);
        const [startDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        const [startTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        fireEvent.change(startDate, { target: { value: '2021-06-10' } });
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        fireEvent.change(startTime, { target: { value: '11:00:00' } });
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 11), new Date(2021, 5, 15, 18)], ['2021-06-10 11:00:00', '2021-06-15 18:00:00']);
    });

    it('monthsGrid handleWeeksRowNumChange 在范围类型下触发', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 1, 1), new Date(2021, 2, 15)]} defaultOpen motion={false} />);
        const weekRows = (side) => getPanel(side).querySelectorAll(`.${dp}-week`);
        expect(getNavTitle('right')).toBe('2021年 3月');
        expect(weekRows('right')).toHaveLength(5);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
        expect(getNavTitle('right')).toBe('2021年 5月');
        expect(weekRows('right')).toHaveLength(6);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
    });

    it('monthsGrid renderYearAndMonth 的 onBackToMain 回调', async () => {
        render(<DatePicker type="date" defaultValue={new Date(2021, 5, 1)} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        expect(getPanel('left').querySelector(`.${dp}-navigation`)).toBeNull();
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('monthsGrid 渲染 year 类型', async () => {
        render(<DatePicker type="year" defaultOpen motion={false} />);
        expect(getPopup()).toHaveAttribute('x-type', 'year');
        expect(getPopup()).toHaveClass(`${dp}-panel-yam`);
        expect(getPopup().querySelector(`.${dp}-month-grid`)).toBeNull();
        expect(getPopup().querySelector(`.${dp}-month`)).toBeNull();
        expect(getYMLists().length).toBeGreaterThan(0);
    });

    it('dateInput adapter notifyClick 与 notifyChange', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { container } = render(<DatePicker type="date" motion={false} onBlur={onBlur} onFocus={onFocus} />);
        const input = container.querySelector('input');
        fireEvent.focus(input);
        expect(onFocus).toHaveBeenCalledTimes(1);
        fireEvent.blur(input);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('dateRange 输入框渲染后缀图标', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultOpen motion={false} />);
        expect(container.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar`)).not.toBeNull();
        const { container: dateTime } = render(<DatePicker type="dateTimeRange" motion={false} />);
        expect(dateTime.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar_clock`)).not.toBeNull();
    });

    it('dateRange 输入框外层点击触发聚焦', async () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} />);
        fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-start`));
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('dateRange 结束输入框外层点击触发 rangeEnd 聚焦', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-end`));
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('dateRange 输入框 rangeEnd onEnterPress', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} onChange={onChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        fireEvent.change(endInput, { target: { value: '2021-06-1' } });
        await userEvent.type(endInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateTimeRange 的 insetInput rangeEnd 日期聚焦', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} onChange={onChange} />);
        const [, endDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        act(() => endDate.focus());
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('yearAndMonth autoSelectMonth 当前月禁用时向后查找可用月份', async () => {
        const disabledDate = (date) => {
            if (!date) return false;
            return date.getMonth() === 5; // Disable June in all years
        };
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultValue={['2021-06', '2021-08']} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 6), new Date(2023, 7)], ['2022-07', '2023-08']);
    });

    it('monthsGrid renderTimePicker dateTimeRange 同一天的边界情况', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 15, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen motion={false} />);
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`));
        expect(getPopup().querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        expect(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`)).toHaveTextContent('10:00:00');
        expect(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`)).toHaveTextContent('18:00:00');
    });

    it('dateRange 启用且无 rangeInputFocus 时 prefix 的 onClick', async () => {
        const { container } = render(<DatePicker type="dateRange" motion={false} prefix="Date:" />);
        await userEvent.click(container.querySelector(`.${dp}-range-input-prefix`));
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('foundation handleInsetDateFocus 与 handleInsetTimeFocus', async () => {
        render(<DatePicker type="dateTimeRange" defaultValue={[new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)]} defaultOpen insetInput motion={false} />);
        const [startDate] = within(getPopup()).getAllByPlaceholderText('yyyy-MM-dd');
        const [startTime] = within(getPopup()).getAllByPlaceholderText('HH:mm:ss');
        act(() => startTime.focus());
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        act(() => startDate.focus());
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
    });

    it('month.tsx 按 weeksRowNum 渲染高度样式', async () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} defaultOpen motion={false} />);
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        expect(getPanel('right').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
    });

    it('month.tsx 悬停范围下的 startDateOffset 与 endDateOffset', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateRange" defaultPickerValue="2021-06-01" endDateOffset={(date) => addDays(date, 1)} motion={false} open startDateOffset={(date) => addDays(date, -1)} onChange={onChange} />);
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange.mock.calls[0][1]).toEqual(['2021-06-09', '2021-06-11']);
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-selectedrange-hover`);
        await userEvent.unhover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).not.toHaveClass(`${dp}-day-selectedrange-hover`);
    });

    it('monthsGrid timePicker onChange 触发 handleTimeChange', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="dateTime" defaultValue={new Date(2021, 5, 1, 10, 30)} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [, minuteList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(minuteList).getAllByRole('option', { name: '45' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 1, 10, 45), '2021-06-01 10:45:00');
    });

    it('monthsGrid yearAndMonth onSelect 触发 toYearMonth', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="date" defaultValue={new Date(2021, 5, 1)} autoSwitchDate={false} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(yearList).getByRole('option', { name: '2022' }));
        await userEvent.click(within(monthList).getByRole('option', { name: '3月' }));
        await userEvent.click(getPopup().querySelector(`.${dp}-yearmonth-header button`));
        expect(getNavTitle('left')).toBe('2022年 3月');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('month.tsx 在可用日期上 mouseleave 触发 handleHover（参数为 undefined）', async () => {
        render(<DatePicker type="date" defaultOpen defaultPickerValue="2021-06-01" motion={false} />);
        const day = getDay('2021-06-10');
        const className = day.className;
        fireEvent.mouseEnter(day);
        expect(day.className).toBe(className);
        fireEvent.mouseLeave(day);
        expect(day.className).toBe(className);
    });

    it('monthFoundation 初始 weeksRowNum 为 null 时 setWeeksRowNum', async () => {
        render(<DatePicker type="date" defaultValue={baseDate} defaultOpen motion={false} />);
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        for (let i = 0; i < 3; i++) {
            await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        }
        expect(getNavTitle('left')).toBe('2019年 6月');
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(6);
    });

    it('yearAndMonth autoSelectMonth 所有月份禁用', async () => {
        const disabledDate = (date) => {
            if (!date) return false;
            const year = date.getFullYear();
            const month = date.getMonth();
            if (year === 2022 && month > 0) return true; // Only January is valid
            return false;
        };
        render(<DatePicker type="monthRange" defaultValue={['2022-06', '2022-08']} defaultOpen disabledDate={disabledDate} motion={false} />);
        const leftMonths = within(getYMLists()[1]).getAllByRole('option');
        const enabledMonths = leftMonths.filter((option) => option.getAttribute('aria-disabled') === 'false');
        expect(enabledMonths).toHaveLength(1);
        expect(enabledMonths[0]).toHaveTextContent('1');
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022年' })).toHaveAttribute('aria-disabled', 'false');
    });

    it('yearAndMonth autoSelectMonth 两个面板都禁用时找到可用月份', async () => {
        const disabledDate = (date) => {
            if (!date) return false;
            const year = date.getFullYear();
            const month = date.getMonth();
            if (year === 2022 && (month === 5 || month === 7)) return true;
            return false;
        };
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultValue={['2022-06', '2022-08']} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 6), new Date(2022, 6)], ['2022-07', '2022-07']);
    });

    it('yearAndMonth autoSelectMonth 仅对侧面板禁用', async () => {
        const disabledDate = (date) => {
            if (!date) return false;
            const year = date.getFullYear();
            const month = date.getMonth();
            if (year === 2022 && month === 7) return true;
            return false;
        };
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultValue={['2022-06', '2022-08']} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 5), new Date(2022, 5)], ['2022-06', '2022-06']);
    });

    it('yearAndMonth autoSelectMonth 在当前索引之前查找可用月份', async () => {
        const disabledDate = (date) => {
            if (!date) return false;
            const year = date.getFullYear();
            const month = date.getMonth();
            if (year === 2023 && month >= 5) return true;
            return false;
        };
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker type="monthRange" defaultValue={['2023-06', '2023-08']} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2023, 0), new Date(2023, 0)], ['2023-01', '2023-01']);
    });

    describe('story 回归用例', () => {
        const getSwitchTexts = () => Array.from(document.querySelectorAll(`.${dp}-switch-text`)).map((el) => el.textContent);

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('fix #1982 Fix1982：左月大于右月时，右侧 monthRange 面板保持左侧年份可选', async () => {
            const { container } = render(<DatePicker type="monthRange" defaultValue={['2021-09', '2022-03']} motion={false} />);
            await userEvent.click(container.querySelector('input'));
            const rightYears = getYMLists()[2];
            expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
            expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        });

        describe('Fix2567：切换年份后 monthRange 修正非法范围', () => {
            const disabledDate = (date) => {
                const deadDate = new Date('2025/3/1 00:00:00');
                const startDate = new Date('2024/11/1 00:00:00');
                return date.getTime() < startDate.getTime() || date.getTime() > deadDate.getTime();
            };
            const cases = [
                { defaultValue: ['2024-11', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
                { defaultValue: ['2024-12', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
                { defaultValue: ['2024-11', '2025-01'], listIndex: 0, year: '2025', expected: '2025-01 ~ 2025-01' },
            ];
            it.each(cases)('$defaultValue，在列表 $listIndex 中选择 $year', async ({ defaultValue, listIndex, year, expected }) => {
                const { container } = render(<DatePicker type="monthRange" defaultValue={defaultValue} disabledDate={disabledDate} motion={false} />);
                const input = container.querySelector('input');
                await userEvent.click(input);
                await userEvent.click(within(getYMLists()[listIndex]).getByRole('option', { name: year }));
                expect(input).toHaveValue(expected);
            });
        });

        describe('FixNeedConfirm：dateTimeRange 与 needConfirm 下恢复或提交输入', () => {
            const defaultValue = ['2021-12-27 10:37:13', '2022-01-28 10:37:13'];
            const renderAndPick = async () => {
                const utils = render(<DatePicker type="dateTimeRange" defaultValue={defaultValue} motion={false} needConfirm />);
                const inputs = utils.container.querySelectorAll('input');
                await userEvent.click(inputs[0]);
                await userEvent.click(getDay('2021-12-15'));
                await userEvent.click(getDay('2022-01-20'));
                return inputs;
            };

            it('选择后取消', async () => {
                const [startInput, endInput] = await renderAndPick();
                await userEvent.click(getFooterButtons()[0]);
                await waitFor(() => expect(getPopup()).toBeNull());
                expect(startInput).toHaveValue(defaultValue[0]);
                expect(endInput).toHaveValue(defaultValue[1]);
            });

            it('选择后确认', async () => {
                const [startInput, endInput] = await renderAndPick();
                await userEvent.click(getFooterButtons()[1]);
                await waitFor(() => expect(getPopup()).toBeNull());
                expect(startInput).toHaveValue('2021-12-15 10:37:13');
                expect(endInput).toHaveValue('2022-01-20 10:37:13');
            });
        });

        it('fix #528 FixInputRangeFocus：受控打开的范围选择器在面板内关闭时，清除输入框焦点状态', async () => {
            function Demo() {
                const [visible, setVisible] = useState(false);
                return <DatePicker type="dateTimeRange" bottomSlot={<button onClick={() => setVisible(false)}>close</button>} defaultPickerValue="2022-02-01" motion={false} open={visible} showClear onFocus={() => setVisible(true)} />;
            }
            const watch = watchPanelVisible();
            const { container } = render(<Demo />);
            await userEvent.click(container.querySelector('input'));
            await watch.settled();
            watch.restore();
            expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
            await userEvent.click(getDay('2022-02-10'));
            await userEvent.click(getDay('2022-02-15'));
            await userEvent.click(screen.getByRole('button', { name: 'close' }));
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
            expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        });

        describe('fix #735 FixDefaultPickerValue：数字形式的 defaultPickerValue 定位面板', () => {
            it('dateTime', async () => {
                const { container } = render(<DatePicker type="dateTime" defaultPickerValue={new Date('2021-03-15 00:00:00').valueOf()} motion={false} />);
                await userEvent.click(container.querySelector('input'));
                expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00']);
            });

            it('dateTimeRange', async () => {
                const { container } = render(<DatePicker type="dateTimeRange" defaultPickerValue={[new Date('2021-03-15 00:00:00').valueOf(), new Date('2021-05-15 23:59:59').valueOf()]} motion={false} />);
                await userEvent.click(container.querySelector('input'));
                expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00', '2021-05-15', '23:59:59']);
            });

            it('1970 年之前', async () => {
                const { container } = render(<DatePicker type="dateTime" defaultPickerValue={new Date('1910-01-01 13:00:00')} motion={false} />);
                await userEvent.click(container.querySelector('input'));
                expect(getSwitchTexts()).toEqual(['1910-01-01', '13:00:00']);
            });
        });

        it('fix #676 FixedTriggerRender：空的受控 value 将范围选择重置为起始日期', async () => {
            const onChange = vi.fn<(date: Date | Date[]) => void>();
            function Demo() {
                const [date, setDate] = useState<DatePickerProps['value']>([]);
                return (
                    <DatePicker
                        type="dateTimeRange"
                        value={date}
                        defaultPickerValue="2022-07-01"
                        motion={false}
                        triggerRender={() => (
                            <div>
                                <button>trigger</button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDate(null);
                                    }}
                                >
                                    clear
                                </button>
                            </div>
                        )}
                        onChange={(v) => {
                            onChange(v);
                            setDate(v);
                        }}
                    />
                );
            }
            render(<Demo />);
            await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
            await userEvent.click(getDay('2022-07-10'));
            await userEvent.click(getDay('2022-07-15'));
            expect((onChange.mock.lastCall[0] as Date[]).map(ymd)).toEqual(['2022-07-10', '2022-07-15']);

            await userEvent.click(screen.getByRole('button', { name: 'clear' }));
            await userEvent.click(getDay('2022-07-20'));
            await userEvent.click(getDay('2022-07-25'));
            expect((onChange.mock.lastCall[0] as Date[]).map(ymd)).toEqual(['2022-07-20', '2022-07-25']);
        });

        it('fix #520 FixDisabledMonth：切换到该月份被禁用的年份时，选中最近的可用月份', async () => {
            const disabledDate = (date) => {
                const isBefore = date < set(date, { year: 2021, month: 10 });
                const isAfter = date > set(date, { year: 2022, month: 10 });
                return isBefore || isAfter;
            };
            const { container } = render(<DatePicker type="month" defaultValue={new Date('2022-11')} disabledDate={disabledDate} motion={false} yearAndMonthOpts={{ motion: false }} />);
            const input = container.querySelector('input');
            await userEvent.click(input);

            await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '10月' }));
            await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
            expect(getYMSelected()).toEqual(['2021年', '11月']);
            expect(input).toHaveValue('2021-11');

            await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '12月' }));
            await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022' }));
            expect(getYMSelected()).toEqual(['2022年', '1月']);
            expect(input).toHaveValue('2022-01');
        });

        describe('fix #1221 FixRangePanelShift：范围面板不发生偏移', () => {
            it.each(['dateRange', 'dateTimeRange'] as const)('%s：在右侧面板选择时保持两个月份', async (type) => {
                const { container } = render(<DatePicker type={type} defaultPickerValue="2019-07-01" motion={false} />);
                await userEvent.click(container.querySelector('input'));
                await userEvent.click(getDay('2019-08-20'));
                expect(getNavTitle('left')).toBe('2019年 7月');
                expect(getNavTitle('right')).toBe('2019年 8月');
            });

            it.each(['dateRange', 'dateTimeRange'] as const)('%s：跨月的 defaultValue 打开时定位到起止月份', async (type) => {
                const { container } = render(<DatePicker type={type} defaultValue={['2019-07-01', '2019-08-02']} motion={false} />);
                await userEvent.click(container.querySelector('input'));
                expect(getNavTitle('left')).toBe('2019年 7月');
                expect(getNavTitle('right')).toBe('2019年 8月');
                expect(getPanel('left').querySelector(`.${dp}-day-selected-start`)).toHaveAttribute('aria-label', '2019-07-01');
                expect(getPanel('right').querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2019-08-02');
            });
        });

        it('fix #1413 InsetInputControlled：受控 dateTimeRange 的 insetInput 显示已选日期', async () => {
            function Demo() {
                const [date, setDate] = useState<DatePickerProps['value']>();
                return <DatePicker type="dateTimeRange" value={date} defaultPickerValue={['2022-02-07', '2023-02-07']} insetInput motion={false} onChange={setDate} />;
            }
            const { container } = render(<Demo />);
            await userEvent.click(container.querySelector('input'));
            await userEvent.click(getDay('2022-02-20'));
            await userEvent.click(getDay('2023-02-20'));
            const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper .${BASE_CLASS_PREFIX}-input`);
            expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2022-02-20', '00:00:00', '2023-02-20', '00:00:00']);
        });

        describe('fix #1422 FixMultiplePanelShift：多选时不会跳回第一个已选月份', () => {
            function Controlled() {
                const [date, setDate] = useState<DatePickerProps['value']>();
                return <DatePicker type="date" multiple value={date} defaultPickerValue="2019-07-01" motion={false} onChange={setDate} />;
            }
            it.each([
                ['uncontrolled', () => <DatePicker type="date" multiple defaultPickerValue="2019-07-01" motion={false} />],
                ['controlled', () => <Controlled />],
            ])('%s', async (_name, renderDemo) => {
                const { container } = render(renderDemo());
                await userEvent.click(container.querySelector('input'));
                await userEvent.click(getDay('2019-07-20'));
                await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`));
                await userEvent.click(getDay('2019-08-20'));
                expect(getNavTitle('left')).toBe('2019年 8月');
                expect(getSelectedDays()).toEqual(['2019-08-20']);
            });
        });

        it('fix #1522 FixTimeZone：字符串 timeZone 下，受控 dateTime 值经 onChange 往返一致', async () => {
            const onChange = vi.fn<(date: Date | Date[]) => void>();
            function Demo() {
                const [value, setValue] = useState<DatePickerProps['value']>();
                return (
                    <DatePicker
                        type="dateTime"
                        value={value}
                        defaultPickerValue="2020-02-13"
                        motion={false}
                        timeZone="GMT+00:00"
                        onChange={(date) => {
                            onChange(date);
                            setValue(date);
                        }}
                    />
                );
            }
            const { container } = render(<Demo />);
            const input = container.querySelector('input');
            await userEvent.click(input);
            await userEvent.click(getDay('2020-02-15'));
            expect(onChange).toHaveBeenCalledTimes(1);
            const utcText = (onChange.mock.calls[0][0] as Date).toISOString().slice(0, 19).replace('T', ' ');
            expect(utcText.startsWith('2020-02-15')).toBe(true);
            expect(input).toHaveValue(utcText);
        });

        it('FixNeedConfirmInTabs：离开标签页时，ref close() 隐藏 needConfirm 面板', async () => {
            function Demo() {
                const ref = React.useRef<DatePickerHandle>(null);
                return (
                    <Tabs
                        type="line"
                        onChange={(activeKey) => {
                            if (activeKey === '2') {
                                ref.current.close();
                            }
                        }}
                    >
                        <Tabs.TabPane itemKey="1" tab="doc">
                            <DatePicker ref={ref} type="dateTime" motion={false} needConfirm />
                        </Tabs.TabPane>
                        <Tabs.TabPane itemKey="2" tab="start">
                            <DatePicker type="dateTimeRange" motion={false} needConfirm />
                        </Tabs.TabPane>
                    </Tabs>
                );
            }
            const { container } = render(<Demo />);
            await userEvent.click(container.querySelector('input'));
            expect(getPopup()).not.toBeNull();
            await userEvent.click(screen.getByRole('tab', { name: 'start' }));
            await waitFor(() => expect(getPopup()).toBeNull());
        });

        it('未设置 insetInput 时，面板显示不会把焦点拉回触发输入框', async () => {
            const watch = watchPanelVisible();
            try {
                const { container } = render(<DatePicker type="dateRange" bottomSlot={<button>slot</button>} defaultPickerValue="2023-04-01" motion={false} />);
                await userEvent.click(container.querySelector('input'));
                const slot = screen.getByRole('button', { name: 'slot' });
                await userEvent.click(slot);
                await watch.settled();
                expect(document.activeElement).toBe(slot);
            } finally {
                watch.restore();
            }
        });

        it.each([
            ['GMT+05:00', '2023-05-03 08:29:00'],
            ['GMT-05:00', '2023-05-02 22:29:00'],
            ['GMT+00:00', '2023-05-03 03:29:00'],
            ['GMT+14:00', '2023-05-03 17:29:00'],
        ])('fix #1585 FeatEtcGMT：timeZone %s 显示 %s', (timeZone, expected) => {
            const { container } = render(<DatePicker type="dateTime" defaultValue={1683084540000} timeZone={timeZone} />);
            expect(container.querySelector('input')).toHaveValue(expected);
        });

        it('fix #1592 FixDisabledDate：起始被禁用时，聚焦结束输入框仍可选择范围结束日期', async () => {
            const today = new Date('2023-05-06 00:00:00');
            const disabledDate: DisabledDateType = (date, { rangeInputFocus }) => {
                const days = rangeInputFocus === 'rangeStart' ? 2 : rangeInputFocus === 'rangeEnd' ? 3 : 0;
                return days > 0 && addDays(today, -days) <= date && date <= addDays(today, days);
            };
            const { container } = render(<DatePicker type="dateRange" defaultPickerValue={new Date('2023-05-06')} disabledDate={disabledDate} motion={false} />);
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(startInput);
            await userEvent.click(getDay('2023-05-03'));
            await userEvent.click(getDay('2023-05-10'));
            expect(startInput).toHaveValue('2023-05-03');
            expect(endInput).toHaveValue('2023-05-10');
        });

        it('fix #2024 FixNeedConfirmControlled：受控 dateTimeRange 与 needConfirm 显示待定起始值，并确认完整范围', async () => {
            function Demo() {
                const [value, setValue] = useState<DatePickerProps['value']>([]);
                return <DatePicker type="dateTimeRange" value={value} defaultPickerValue="2024-02-15" motion={false} needConfirm onChange={setValue} />;
            }
            const { container } = render(<Demo />);
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(startInput);
            await userEvent.click(getDay('2024-02-15'));
            expect(startInput).toHaveValue('2024-02-15 00:00:00');
            const confirmBtn = () => getFooterButtons()[1];
            expect(confirmBtn()).toBeDisabled();

            await userEvent.click(getDay('2024-02-20'));
            expect(confirmBtn()).toBeEnabled();
            await userEvent.click(confirmBtn());
            expect(startInput).toHaveValue('2024-02-15 00:00:00');
            expect(endInput).toHaveValue('2024-02-20 00:00:00');
        });

        it('fix #1846 FixedNaN：NaN 值渲染为空输入框，选择后重置', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            function Demo() {
                const [value, setValue] = useState<DatePickerProps['value']>([NaN, NaN]);
                return (
                    <>
                        <button onClick={() => setValue([NaN, NaN])}>set NaN</button>
                        <DatePicker type="dateRange" value={value} defaultPickerValue="2024-01-01" motion={false} presets={[{ text: 'Empty', start: null, end: null }]} onChange={setValue} />
                    </>
                );
            }
            const { container } = render(<Demo />);
            const [startInput, endInput] = container.querySelectorAll('input');
            expect(startInput).toHaveValue('');
            expect(endInput).toHaveValue('');
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('value cannot be parsed'));

            await userEvent.click(startInput);
            await userEvent.click(getDay('2024-01-15'));
            await userEvent.click(getDay('2024-01-15'));
            expect(startInput).toHaveValue('2024-01-15');
            expect(endInput).toHaveValue('2024-01-15');

            await userEvent.click(screen.getByRole('button', { name: 'set NaN' }));
            expect(startInput).toHaveValue('');
            expect(endInput).toHaveValue('');
        });

        it('fix #1652 FixedSelectedStatus：再次点击已选日期时保持选中', async () => {
            const { container } = render(<DatePicker type="dateTime" defaultPickerValue="2022-07-01" motion={false} />);
            await userEvent.click(container.querySelector('input'));
            await userEvent.click(getDay('2022-07-15'));
            expect(getSelectedDays()).toEqual(['2022-07-15']);
            await userEvent.click(getDay('2022-07-15'));
            expect(getSelectedDays()).toEqual(['2022-07-15']);
        });

        it('fix #2387 FixedControlled：受控值未变化时，面板关闭后重置待定范围', async () => {
            const { container } = render(<DatePicker type="dateRange" value={[new Date('2022-08-08'), new Date('2022-08-09')]} defaultPickerValue="2022-08-01" motion={false} />);
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(endInput);
            await userEvent.click(getDay('2022-08-15'));
            expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2022-08-15')).toHaveClass(`${dp}-day-selected-end`);

            await userEvent.click(startInput);
            await userEvent.click(getDay('2022-08-10'));
            await waitFor(() => expect(getPopup()).toBeNull());
            await userEvent.click(startInput);
            expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
        });

        it('fix #2521 FixedControlledValue：重新打开时受控范围显示已选内容', async () => {
            function Demo() {
                const [v, setV] = useState<DatePickerProps['value']>([]);
                return <DatePicker type="dateRange" value={v} defaultPickerValue={['2023-10-01']} motion={false} onChange={setV} />;
            }
            const { container } = render(<Demo />);
            const startInput = container.querySelector('input');
            await userEvent.click(startInput);
            await userEvent.click(getDay('2023-10-15'));
            await userEvent.click(getDay('2023-11-20'));
            await waitFor(() => expect(getPopup()).toBeNull());
            await userEvent.click(startInput);
            expect(getDay('2023-10-15')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2023-11-20')).toHaveClass(`${dp}-day-selected-end`);
        });

        it('fix #422 FixParseISOBug：五位年份的 defaultValue 视为空值', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { container } = render(<DatePicker defaultValue="20221-12-20" defaultOpen motion={false} />);
            expect(container.querySelector('input')).toHaveValue('');
            expect(getPopup()).not.toBeNull();
            expect(getSelectedDays()).toEqual([]);
        });

        it('FixNotifyChange：切换 ConfigProvider timeZone 不通知受控范围，完整选择只通知一次', async () => {
            const onChange = vi.fn<(date: Date | Date[]) => void>();
            function Demo({ tz }) {
                const [value, setValue] = useState<DatePickerProps['value']>();
                return (
                    <ConfigProvider timeZone={tz}>
                        <DatePicker
                            type="dateTimeRange"
                            value={value}
                            defaultPickerValue="2021-08-01"
                            motion={false}
                            onChange={(v) => {
                                onChange(v);
                                setValue(v);
                            }}
                        />
                    </ConfigProvider>
                );
            }
            const { container, rerender } = render(<Demo tz={0} />);
            rerender(<Demo tz={8} />);
            expect(onChange).not.toHaveBeenCalled();

            await userEvent.click(container.querySelector('input'));
            await userEvent.click(getDay('2021-08-10'));
            await userEvent.click(getDay('2021-08-12'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][0]).toHaveLength(2);

            rerender(<Demo tz={0} />);
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('行为基线', () => {
        const liveMousedownListeners = (add, remove) => countLiveListeners(add, remove, 'mousedown');
        const getRoot = () => document.querySelector(`.${dp}`);

        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值，传入的属性优先', () => {
            semiGlobal.config.overrideDefaultProps = { DatePicker: { format: 'yyyy/MM/dd', density: 'compact' } };
            const { container, unmount } = render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} />);
            expect(container.querySelector('input')).toHaveValue('2019/09/08');
            expect(getPopup()).toHaveClass(`${dp}-compact`);
            unmount();
            const { container: second } = render(<DatePicker defaultValue={baseDate} format="yyyy-MM-dd" />);
            expect(second.querySelector('input')).toHaveValue('2019-09-08');
        });

        it('StrictMode 下打开时只添加一个外部点击监听，关闭一次，卸载时移除', async () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
            const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
            const { container, unmount } = render(
                <StrictMode>
                    <DatePicker defaultValue={baseDate} defaultOpen motion={false} onBlur={onBlur} onOpenChange={onOpenChange} />
                </StrictMode>
            );
            expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
            expect(liveMousedownListeners(add, remove)).toBe(1);
            fireEvent.mouseDown(document.body);
            expect(onOpenChange.mock.calls).toEqual([[false]]);
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(liveMousedownListeners(add, remove)).toBe(0);
            await waitFor(() => expect(getPopup()).toBeNull());
            await userEvent.click(container.querySelector('input'));
            expect(getPopup()).not.toBeNull();
            expect(liveMousedownListeners(add, remove)).toBe(1);
            unmount();
            expect(liveMousedownListeners(add, remove)).toBe(0);
        });

        it('StrictMode 下选择日期只报告一次变化并关闭一次', async () => {
            const onChange = vi.fn<ChangeHandler>();
            const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
            render(
                <StrictMode>
                    <DatePicker defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} onOpenChange={onOpenChange} />
                </StrictMode>
            );
            await userEvent.click(getDay('2019-09-12'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2019-09-12');
            expect(onOpenChange.mock.calls).toEqual([[false]]);
        });

        it('受控 open 控制面板显示与隐藏，点击外部时只请求一次关闭', async () => {
            const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
            const onClickOutSide = vi.fn<NonNullable<DatePickerProps['onClickOutSide']>>();
            const { rerender } = render(<DatePicker motion={false} open onClickOutSide={onClickOutSide} onOpenChange={onOpenChange} />);
            expect(getPopup()).not.toBeNull();
            fireEvent.mouseDown(document.body);
            expect(onClickOutSide).toHaveBeenCalledTimes(1);
            expect(onOpenChange.mock.calls).toEqual([[false]]);
            expect(getPopup()).not.toBeNull();
            rerender(<DatePicker motion={false} open={false} onOpenChange={onOpenChange} />);
            await waitFor(() => expect(getPopup()).toBeNull());
        });

        it('受控 value 变化时替换已输入的文本', () => {
            const { container, rerender } = render(<DatePicker value={baseDate} />);
            const input = container.querySelector('input');
            fireEvent.change(input, { target: { value: '2019-09-1' } });
            expect(input).toHaveValue('2019-09-1');
            rerender(<DatePicker value={new Date(2020, 0, 2)} />);
            expect(input).toHaveValue('2020-01-02');
        });

        it('data-* 落在根 div，aria 状态属性落在 combobox 输入框', () => {
            render(<DatePicker data-testid="dp" aria-describedby="help" aria-errormessage="error" aria-invalid aria-labelledby="label" aria-required />);
            expect(getRoot()).toHaveAttribute('data-testid', 'dp');
            for (const name of ['aria-labelledby', 'aria-required', 'aria-invalid', 'aria-describedby', 'aria-errormessage']) {
                expect(getRoot()).not.toHaveAttribute(name);
            }
            const input = screen.getByRole('combobox');
            expect(input).toHaveAttribute('aria-labelledby', 'label');
            expect(input).toHaveAttribute('aria-required', 'true');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-describedby', 'help');
            expect(input).toHaveAttribute('aria-errormessage', 'error');
            expect(input).not.toHaveAttribute('data-testid');
        });

        it('范围类型的两个输入框都带 aria 状态属性，根 div 是 group', () => {
            render(
                <>
                    <span id="label">Period</span>
                    <DatePicker type="dateRange" aria-describedby="help" aria-invalid aria-labelledby="label" aria-required />
                </>
            );
            expect(getRoot()).not.toHaveAttribute('aria-required');
            expect(screen.getByRole('group', { name: 'Period' })).toBe(getRoot());
            for (const input of screen.getAllByRole('combobox')) {
                expect(input).toHaveAttribute('aria-required', 'true');
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input).toHaveAttribute('aria-describedby', 'help');
            }
        });

        it('triggerRender 的按钮触发器承接 aria-describedby 与 aria-invalid，不输出 aria-required', () => {
            render(<DatePicker aria-describedby="help" aria-errormessage="error" aria-invalid aria-required triggerRender={() => <span>pick</span>} />);
            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-invalid', 'true');
            expect(trigger).toHaveAttribute('aria-describedby', 'help');
            expect(trigger).toHaveAttribute('aria-errormessage', 'error');
            expect(trigger).not.toHaveAttribute('aria-required');
            expect(getRoot()).not.toHaveAttribute('aria-invalid');
        });

        it('Form.DatePicker 的范围字段按 Label 取到 group，必填与校验失败标在输入框上', async () => {
            render(
                <Form>
                    <Form.DatePicker type="dateRange" field="period" label="Period" motion={false} rules={[{ required: true, message: 'need period' }]} />
                </Form>
            );
            expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument();
            const [start, end] = screen.getAllByRole('combobox');
            expect(start).toHaveAttribute('aria-required', 'true');
            expect(end).toHaveAttribute('aria-required', 'true');
        });

        it('Form.DatePicker 校验失败后输入框带 aria-invalid', async () => {
            let formApi;
            render(
                <Form getFormApi={(api) => (formApi = api)}>
                    <Form.DatePicker field="day" label="Day" rules={[{ required: true, message: 'need day' }]} />
                </Form>
            );
            await act(async () => {
                await formApi.validate().catch(() => undefined);
            });
            expect(screen.getByRole('combobox', { name: 'Day' })).toHaveAttribute('aria-invalid', 'true');
        });

        it('Form.DatePicker 报告选中日期，formApi.reset 后恢复为空', async () => {
            let formApi;
            const { container } = render(
                <Form getFormApi={(api) => (formApi = api)}>
                    <Form.DatePicker defaultPickerValue="2019-09-01" field="day" motion={false} />
                </Form>
            );
            await userEvent.click(container.querySelector('input'));
            await userEvent.click(getDay('2019-09-12'));
            expect(ymd(formApi.getValue('day'))).toBe('2019-09-12');
            await act(() => formApi.reset());
            expect(formApi.getValue('day')).toBeUndefined();
            expect(container.querySelector('input')).toHaveValue('');
        });

        it('Form.DatePicker 在面板关闭时校验，而非输入框失焦时校验', async () => {
            const { container } = render(
                <Form>
                    <Form.DatePicker field="day" motion={false} rules={[{ required: true, message: 'required' }]} trigger="blur" />
                </Form>
            );
            const input = container.querySelector('input');
            await userEvent.click(input);
            expect(getPopup()).not.toBeNull();
            fireEvent.blur(input);
            await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
            expect(screen.queryByText('required')).toBeNull();
            fireEvent.mouseDown(document.body);
            await waitFor(() => expect(screen.getByText('required')).toBeInTheDocument());
        });

        it('通过 ref 打开的范围选择器在首次点击后聚焦结束输入框，且只报告一次聚焦', async () => {
            const ref = React.createRef<DatePickerHandle>();
            const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
            const onChange = vi.fn<ChangeHandler>();
            const { container } = render(<DatePicker ref={ref} type="dateRange" defaultPickerValue="2021-06-01" motion={false} onChange={onChange} onFocus={onFocus} />);
            act(() => ref.current.open());
            await userEvent.click(getDay('2021-06-10'));
            const [startInput, endInput] = container.querySelectorAll('input');
            expect(endInput).toHaveFocus();
            expect(startInput).toHaveValue('2021-06-10');
            expect(onFocus).toHaveBeenCalledTimes(1);
            await userEvent.click(getDay('2021-06-12'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toEqual(['2021-06-10', '2021-06-12']);
            expect(getPopup()).not.toBeNull();
        });

        it('在触发输入框输入完整日期后，在已打开的面板中选中该日期', async () => {
            const onChange = vi.fn<ChangeHandler>();
            const { container } = render(<DatePicker motion={false} onChange={onChange} />);
            const input = container.querySelector('input');
            await userEvent.click(input);
            fireEvent.change(input, { target: { value: '2021-06-10' } });
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(getSelectedDays()).toEqual(['2021-06-10']);
            expect(getNavTitle('left')).toBe('2021年 6月');
        });

        it('对与当前选中值不同的已输入日期按 Enter 时报告变化', () => {
            const onChange = vi.fn<ChangeHandler>();
            const { container } = render(<DatePicker defaultValue={baseDate} onChange={onChange} />);
            const input = container.querySelector('input');
            // the text reaches the input without a change event, so only Enter parses it
            fireEvent.keyDown(input, { key: 'Enter', target: { value: '2019-09-20' } });
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2019-09-20');
            expect(input).toHaveValue('2019-09-20');
        });
    });

    describe('函数组件', () => {
        it('ref 为包含文档中方法的 DatePickerHandle', () => {
            const ref = React.createRef<DatePickerHandle>();
            render(<DatePicker ref={ref} motion={false} />);
            expect(Object.keys(ref.current).sort()).toEqual(['blur', 'close', 'focus', 'open']);
        });

        it('未声明的属性（如 id、name 与 title）落在根 div，已声明的属性不落在任何地方', () => {
            // name is not a native div attribute, so the spread keeps the call type-checked
            const undeclared = { name: 'day-name' };
            render(<DatePicker id="day" title="tip" {...undeclared} density="compact" timeZone="Asia/Tokyo" />);
            const root = document.querySelector(`.${dp}`);
            expect(root).toHaveAttribute('id', 'day');
            expect(root).toHaveAttribute('name', 'day-name');
            expect(root).toHaveAttribute('title', 'tip');
            for (const attr of ['density', 'timezone']) {
                expect(root).not.toHaveAttribute(attr);
                expect(document.querySelector('input')).not.toHaveAttribute(attr);
            }
        });

        it('triggerRender 收到的 componentProps 不含 ref', () => {
            const triggerRender = vi.fn<(props: TriggerRenderProps) => React.ReactNode>(() => <span>trigger</span>);
            render(<DatePicker ref={React.createRef()} triggerRender={triggerRender} />);
            const { componentProps } = triggerRender.mock.calls[0][0];
            expect(componentProps).not.toHaveProperty('ref');
            expect(componentProps.type).toBe('date');
        });

        it('weekStartsOn 变化时重新排列已打开面板中的星期', () => {
            const { rerender } = render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} />);
            const firstWeekday = () => document.querySelector(`.${dp}-weekday-item`).textContent;
            expect(firstWeekday()).toBe('日');
            rerender(<DatePicker defaultValue={baseDate} defaultOpen motion={false} weekStartsOn={1} />);
            expect(firstWeekday()).toBe('一');
        });

        it('autoSwitchDate 在本地零点将日期切换到年份选择器中选中的年份，且只切换一次', async () => {
            const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
            const onChange = vi.fn<ChangeHandler>();
            render(<DatePicker defaultValue={baseDate} defaultOpen motion={false} onChange={onChange} onPanelChange={onPanelChange} />);
            await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`));
            await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2020' }));
            expect(onPanelChange).toHaveBeenCalledTimes(1);
            expect(onPanelChange.mock.calls[0][1]).toBe('2020-09-08');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2020-09-08');
            expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(0);
        });

        it('受控 open 优先于 ref 方法', async () => {
            const ref = React.createRef<DatePickerHandle>();
            render(<DatePicker ref={ref} motion={false} open={false} />);
            act(() => ref.current.open());
            expect(getPopup()).toBeNull();
        });
    });
});

describe('DatePicker Tab 停靠点', () => {
    it('触发器外层不是 Tab 停靠点，Tab 直接进入输入框', async () => {
        const { container } = render(<DatePicker />);
        await userEvent.tab();
        expect(container.querySelector(`.${dp}-input`)).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement.tagName).toBe('INPUT');
    });

    it('insetInput 下，关闭状态的触发输入框仍是 Tab 停靠点', async () => {
        render(<DatePicker insetInput />);
        await userEvent.tab();
        expect(document.activeElement.tagName).toBe('INPUT');
    });

    it('范围选择器仅在起始与结束输入框停留', async () => {
        const { container } = render(<DatePicker type="dateRange" />);
        const inputs = container.querySelectorAll('input');
        await userEvent.tab();
        expect(inputs[0]).toHaveFocus();
        await userEvent.tab();
        expect(inputs[1]).toHaveFocus();
    });

    it('带有自身焦点目标的自定义触发器是唯一停靠点', async () => {
        render(<DatePicker triggerRender={() => <button type="button">pick</button>} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('没有焦点目标的自定义触发器以外层作为停靠点，即打开面板的按钮', async () => {
        render(<DatePicker motion={false} triggerRender={() => <span>pick</span>} />);
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
    });

    it('自定义触发器加外部 label 时 button 名称为该 label', () => {
        render(
            <>
                <span id="birthday">生日</span>
                <DatePicker aria-labelledby="birthday" triggerRender={() => <span>pick</span>} />
            </>
        );
        const trigger = screen.getByRole('button', { name: '生日' });
        expect(trigger).not.toHaveAttribute('aria-label');
    });
});

describe('DatePicker 触发器语义', () => {
    it('输入框为 combobox，其 aria-controls 指向对话框中的面板', async () => {
        const { container } = render(<DatePicker motion={false} />);
        const input = screen.getByRole('combobox');
        expect(input).toBe(container.querySelector('input'));
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector(`.${dp}-input`)).not.toHaveAttribute('role');
        await userEvent.click(input);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(input).toHaveAttribute('aria-expanded', 'true');
        const panel = document.getElementById(input.getAttribute('aria-controls'));
        expect(panel).toBe(getPopup());
        expect(panel.closest('[role="dialog"]')).toBe(screen.getByRole('dialog', { name: zh_CN.DatePicker.panel.date }));
    });

    it('面板对话框以所选内容命名', async () => {
        for (const type of ['dateRange', 'dateTime', 'dateTimeRange', 'month', 'monthRange', 'year'] as const) {
            const { unmount } = render(<DatePicker type={type} defaultOpen motion={false} />);
            expect(await screen.findByRole('dialog', { name: zh_CN.DatePicker.panel[type] })).toBeInTheDocument();
            unmount();
        }
        render(
            <LocaleProvider locale={en_US}>
                <DatePicker type="dateTimeRange" defaultOpen motion={false} />
            </LocaleProvider>
        );
        expect(await screen.findByRole('dialog', { name: 'Choose date and time range' })).toBeInTheDocument();
    });

    it('两个范围输入框都是同一面板的 combobox', async () => {
        render(<DatePicker type="dateRange" motion={false} />);
        const [start, end] = screen.getAllByRole('combobox');
        expect(start.tagName).toBe('INPUT');
        expect(end.tagName).toBe('INPUT');
        expect(start.getAttribute('aria-controls')).toBe(end.getAttribute('aria-controls'));
        expect(end).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('输入框上按 ArrowDown 打开面板', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        render(<DatePicker motion={false} onOpenChange={onOpenChange} />);
        screen.getByRole('combobox').focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    it('dateTime 面板的日期与时间切换为原生 button', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} disabledTimePicker motion={false} open />);
        const toDate = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const toTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(toDate.tagName).toBe('BUTTON');
        expect(toTime).toBeDisabled();
    });

    it('时间切换可通过键盘打开时间面板', async () => {
        render(<DatePicker type="dateTime" defaultValue={baseDate} motion={false} open />);
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        toTime.focus();
        await userEvent.keyboard('{Enter}');
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
    });

    it('范围清空按钮可通过键盘清空', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" defaultValue={[baseDate, addDays(baseDate, 3)]} onChange={onChange} />);
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear.tagName).toBe('BUTTON');
        clear.focus();
        await userEvent.keyboard('{Enter}');
        const [start, end] = container.querySelectorAll('input');
        expect(start).toHaveValue('');
        expect(end).toHaveValue('');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('年份与月份列表有名称', async () => {
        render(<DatePicker type="month" motion={false} open />);
        expect(await screen.findByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.month })).toBeInTheDocument();
    });
});

describe('DatePicker 日历网格键盘操作', () => {
    it.each([
        ['ArrowLeft', false, false, '2019-09-10'],
        ['ArrowRight', false, false, '2019-09-12'],
        ['ArrowLeft', false, true, '2019-09-12'],
        ['ArrowUp', false, false, '2019-09-04'],
        ['ArrowDown', false, false, '2019-09-18'],
        ['Home', false, false, '2019-09-09'],
        ['End', false, false, '2019-09-15'],
        ['PageUp', false, false, '2019-08-11'],
        ['PageDown', true, false, '2020-09-11'],
        ['a', false, false, null],
    ])('%s（shift：%s，rtl：%s）将活动日期移动到 %s', (key, shiftKey, rtl, expected) => {
        const target = MonthFoundation.getKeyboardTargetDate({ key, shiftKey }, new Date(2019, 8, 11), 1, rtl);
        expect(target && format(target, 'yyyy-MM-dd')).toBe(expected);
    });

    it.each([
        ['Home', new Date(2019, 8, 1), '2019-09-01'],
        ['End', new Date(2019, 8, 30), '2019-09-30'],
        ['PageDown', new Date(2019, 0, 31), '2019-02-28'],
    ])('%s 从 %s 出发时保持在 %s', (key, active, expected) => {
        const target = MonthFoundation.getKeyboardTargetDate({ key, shiftKey: false }, active, 1);
        expect(format(target, 'yyyy-MM-dd')).toBe(expected);
    });

    const activeDay = () => {
        const grid = screen.getByRole('grid');
        return document.getElementById(grid.getAttribute('aria-activedescendant'));
    };

    it('网格为单个 Tab 停靠点，并从已选日期开始', async () => {
        render(<DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open weekStartsOn={1} />);
        const grid = screen.getByRole('grid');
        expect(grid).toHaveAttribute('tabindex', '0');
        expect(
            within(grid)
                .getAllByRole('gridcell')
                .filter((cell) => cell.hasAttribute('tabindex'))
        ).toHaveLength(0);
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-11');
    });

    it('方向键移动活动日期，Enter 选中该日期', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open weekStartsOn={1} onChange={onChange} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-19');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(format(onChange.mock.calls[0][0] as Date, 'yyyy-MM-dd')).toBe('2019-09-19');
    });

    it('移出当月时面板切换到下一个月', async () => {
        render(<DatePicker defaultValue={new Date(2019, 8, 30)} motion={false} open weekStartsOn={1} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-10-01');
        await userEvent.keyboard('{PageUp}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('禁用日期上的 Enter 与 Space 不做任何选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(<DatePicker defaultPickerValue={new Date(2019, 8, 1)} disabledDate={(date) => date.getDate() === 1} motion={false} open onChange={onChange} />);
        screen.getByRole('grid').focus();
        expect(activeDay()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard('{Enter} ');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('用 Enter 选择日期后关闭面板，焦点返回输入框', async () => {
        const { container } = render(<DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        const input = container.querySelector('input');
        expect(input).toHaveValue('2019-09-12');
        expect(input).toHaveFocus();
    });

    it('Esc 关闭面板且不选择，焦点返回输入框', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} onChange={onChange} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{Escape}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        const input = container.querySelector('input');
        expect(input).toHaveValue('2019-09-11');
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('RTL 下 ArrowLeft 移动到下一天', async () => {
        render(
            <ConfigProvider direction="rtl">
                <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open />
            </ConfigProvider>
        );
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-12');
    });

    it('月份选择器的输入框有名称，即使该类型没有 placeholder', () => {
        render(<DatePicker type="month" />);
        expect(screen.getByRole('combobox', { name: zh_CN.DatePicker.chooseDate })).toBeInTheDocument();
    });

    it('输入框由选择器的 aria-labelledby 命名', () => {
        render(
            <>
                <span id="birthday-label">Birthday</span>
                <DatePicker type="month" aria-labelledby="birthday-label" />
            </>
        );
        expect(screen.getByRole('combobox', { name: 'Birthday' })).toBeInTheDocument();
    });

    it('dateRange 已选的起止日期格 aria-selected 为 true，网格声明可多选', () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 10), new Date(2021, 5, 12)]} defaultOpen motion={false} />);
        expect(getDay('2021-06-10')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-12')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-20')).toHaveAttribute('aria-selected', 'false');
        expect(getDay('2021-06-10').closest('[role="grid"]')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('范围类型的两个日期网格由各自的月份标题命名', () => {
        render(<DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 10), new Date(2021, 5, 12)]} defaultOpen motion={false} />);
        expect(screen.getByRole('grid', { name: '2021年 6月' })).toBe(getPanel('left').querySelector('[role="grid"]'));
        expect(screen.getByRole('grid', { name: '2021年 7月' })).toBe(getPanel('right').querySelector('[role="grid"]'));
    });

    it('预设按钮内不含 div', () => {
        render(<DatePicker defaultOpen motion={false} presets={[{ text: 'Today', start: baseDate, end: baseDate }]} />);
        const [button] = getPresetButtons();
        expect(button).toHaveTextContent('Today');
        expect(button.querySelector('div')).toBeNull();
    });

    it('presetPosition 为 left 但没有 presets 时 x-preset-position 为 null', () => {
        render(<DatePicker defaultOpen motion={false} presetPosition="left" />);
        expect(getPopup().querySelector('[x-preset-position]')).toHaveAttribute('x-preset-position', 'null');
    });

    it('insetInput 的 dateTimeRange 四个内嵌输入框名称互不相同', () => {
        render(<DatePicker type="dateTimeRange" defaultOpen insetInput motion={false} />);
        const names = within(getPopup())
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        const [startDate, endDate] = zh_CN.DatePicker.placeholder.dateTimeRange;
        expect(names).toHaveLength(4);
        expect(new Set(names).size).toBe(4);
        expect(names[0]).toBe(startDate);
        expect(names[2]).toBe(endDate);
        expect(names[1]).toContain(startDate);
        expect(names[1]).toContain(zh_CN.DatePicker.selectTime);
        expect(names[3]).toContain(endDate);
    });

    it('insetInput 的 dateTime 内嵌日期框与时间框有名称', () => {
        render(<DatePicker type="dateTime" defaultOpen insetInput motion={false} />);
        const names = within(getPopup())
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        expect(names).toEqual([zh_CN.DatePicker.placeholder.dateTime, zh_CN.DatePicker.selectTime]);
    });

    it('范围输入框以 placeholder 作为名称', () => {
        render(<DatePicker type="dateRange" />);
        expect(screen.getAllByRole('combobox').map((input) => input.getAttribute('aria-label'))).toEqual([null, null]);
    });
});

describe('DatePicker year 类型', () => {
    it('面板只有一个以语言包命名的年份列表', () => {
        render(<DatePicker type="year" defaultOpen motion={false} />);
        const lists = within(getPopup()).getAllByRole('listbox');
        expect(lists).toHaveLength(1);
        expect(lists[0]).toHaveAccessibleName(zh_CN.DatePicker.year);
        expect(getPopup().querySelector(`.${dp}-yearmonth-body`)).toBeNull();
    });

    it('defaultValue 以 yyyy 回显并选中该年', () => {
        const { container } = render(<DatePicker type="year" defaultValue={new Date(2021, 5, 10)} defaultOpen motion={false} />);
        expect(container.querySelector('input')).toHaveValue('2021');
        expect(getYMSelected()).toEqual(['2021年']);
    });

    it('选择年份后 onChange 收到当年 1 月 1 日与 yyyy 字符串，面板保持打开', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="year" defaultValue={new Date(2021, 5, 10)} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
        expect(container.querySelector('input')).toHaveValue('2023');
        expect(getYMSelected()).toEqual(['2023年']);
        expect(getPopup()).not.toBeNull();
    });

    it('输入年份后解析为当年 1 月 1 日', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="year" motion={false} onChange={onChange} />);
        fireEvent.change(container.querySelector('input'), { target: { value: '2020' } });
        expect(onChange.mock.calls).toEqual([[new Date(2020, 0, 1), '2020']]);
    });

    it('空输入框按 Enter 回落到今年 1 月 1 日', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="year" motion={false} onChange={onChange} />);
        await userEvent.type(container.querySelector('input'), '{Enter}');
        const year = new Date().getFullYear();
        expect(onChange.mock.calls).toEqual([[new Date(year, 0, 1), String(year)]]);
    });

    it('presets 的日期取该年 1 月 1 日，以 yyyy 回显', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="year" defaultOpen motion={false} presets={[{ text: '2021', start: new Date(2021, 5, 10) }]} onChange={onChange} />);
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 0, 1), '2021']]);
        expect(container.querySelector('input')).toHaveValue('2021');
    });

    it('disabledDate 按每年的 1 月 1 日判断，列表与输入一致', () => {
        const onChange = vi.fn<ChangeHandler>();
        const disabledDate = (date: Date) => date < new Date(2021, 2, 1);
        const { container } = render(<DatePicker type="year" defaultValue={new Date(2022, 0)} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        const years = within(getYMLists()[0]);
        expect(years.getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'true');
        expect(years.getByRole('option', { name: '2023' })).not.toHaveAttribute('aria-disabled', 'true');
        const input = container.querySelector('input');
        fireEvent.change(input, { target: { value: '2021' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: '2023' } });
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
    });

    it('insetInput 的内嵌输入框以 yyyy 为占位符，与 month 一样以 chooseDate 命名', () => {
        render(<DatePicker type="year" defaultOpen insetInput motion={false} />);
        const inset = within(getPopup()).getByRole('textbox');
        expect(inset).toHaveAttribute('placeholder', 'yyyy');
        expect(inset).toHaveAccessibleName(zh_CN.DatePicker.chooseDate);
    });

    it('YearAndMonth 的 year 类型选择年份不按月份调整，只通知一次', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({
            type: 'year',
            onSelect,
            currentYear: { left: 2021, right: 0 },
            currentMonth: { left: 6, right: 0 },
            disabledDate: (date) => date.getMonth() === 5,
        });
        expect(getYMLists()).toHaveLength(1);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].currentYear.left).toBe(2023);
    });
});

describe('DatePicker month 类型取当月 1 日', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('presets 的起点在月中时取当月 1 日 00:00', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" defaultOpen motion={false} presets={[{ text: '6 月', start: new Date(2021, 5, 18, 10, 30) }]} onChange={onChange} />);
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
        expect(container.querySelector('input')).toHaveValue('2021-06');
    });

    it('空输入框按 Enter 回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="month" motion={false} onChange={onChange} />);
        await userEvent.type(container.querySelector('input'), '{Enter}');
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
    });

    it('monthRange 空输入框按 Enter 两端回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="monthRange" motion={false} onChange={onChange} />);
        await userEvent.type(container.querySelector('input'), '{Enter}');
        expect(onChange.mock.calls).toEqual([
            [
                [new Date(2021, 5, 1), new Date(2021, 5, 1)],
                ['2021-06', '2021-06'],
            ],
        ]);
    });

    it('年份列、月份列与切换年份时以每月 1 日 00:00 调用 disabledDate', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const disabledDate = vi.fn<(date: Date) => boolean>((date) => date < new Date(2021, 5, 10));
        render(<DatePicker type="month" defaultValue={new Date(2022, 5)} defaultOpen disabledDate={disabledDate} motion={false} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(disabledDate.mock.calls.filter(([date]) => date.getTime() !== new Date(date.getFullYear(), date.getMonth()).getTime())).toEqual([]);
        expect(within(getYMLists()[1]).getByRole('option', { name: '6月' })).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('DatePicker 面板的今天', () => {
    it('打开的面板中，today 高亮跨过午夜更新', () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        try {
            render(<DatePicker defaultOpen motion={false} />);
            const todayCell = () => document.querySelector(`.${BASE_CLASS_PREFIX}-datepicker-day-today`).textContent;
            expect(todayCell()).toBe('8');
            act(() => {
                vi.advanceTimersByTime(2 * 60 * 1000);
            });
            expect(todayCell()).toBe('9');
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('DatePicker 属性回落', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('locale、localeCode、dateFnsLocale 不是 DatePicker 的 props', () => {
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withLocale: DatePickerProps = { locale: en_US.DatePicker };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withCode: DatePickerProps = { localeCode: 'en-US' };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withDateFns: DatePickerProps = { dateFnsLocale: enUS };
        expect([withLocale, withCode, withDateFns]).toHaveLength(3);
    });

    it('显式传入 undefined 的 timeZone 回落到 ConfigProvider', () => {
        const { container } = render(
            <ConfigProvider timeZone="Asia/Tokyo">
                <DatePicker type="dateTime" value={new Date(Date.UTC(2021, 0, 1))} timeZone={undefined} />
            </ConfigProvider>
        );
        expect(container.querySelector('input')).toHaveValue('2021-01-01 09:00:00');
    });

    it('ConfigProvider 的 timeZone 优先于全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { timeZone: 'UTC' } };
        const { container } = render(
            <ConfigProvider timeZone="Asia/Tokyo">
                <DatePicker type="dateTime" value={new Date(Date.UTC(2021, 0, 1))} />
            </ConfigProvider>
        );
        expect(container.querySelector('input')).toHaveValue('2021-01-01 09:00:00');
    });

    it('全局默认的 format 与直接传入一样规整 type', () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { format: 'yyyy-MM-dd' } };
        render(<DatePicker type="dateTime" defaultOpen motion={false} />);
        expect(document.querySelector(`.${dp}-switch`)).toBeNull();
    });
});

describe('DatePicker 面板开合', () => {
    it('打开后变为 disabled 时关闭面板并上报 onOpenChange(false)，重新启用不再弹出', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { rerender } = render(<DatePicker defaultOpen motion={false} onOpenChange={onOpenChange} />);
        expect(getPopup()).not.toBeNull();
        rerender(<DatePicker disabled defaultOpen motion={false} onOpenChange={onOpenChange} />);
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        rerender(<DatePicker defaultOpen motion={false} onOpenChange={onOpenChange} />);
        expect(getPopup()).toBeNull();
    });

    it('面板打开后再次点击输入框不重复调用 onOpenChange(true)', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = render(<DatePicker type="dateRange" motion={false} onOpenChange={onOpenChange} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(startInput);
        await userEvent.click(startInput);
        await userEvent.click(endInput);
        expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('needConfirm 时按 Esc 关闭面板调用 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        render(<DatePicker type="dateTime" defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} needConfirm onCancel={onCancel} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('面板关闭时 Tab 经过两个范围输入框，再点开始框打开后，结束日期之后的日期仍可选', async () => {
        const { container } = render(<DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} motion={false} />);
        await userEvent.tab();
        await userEvent.tab();
        await new Promise((resolve) => setTimeout(resolve));
        await userEvent.click(container.querySelector('input'));
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('受控 open 时 Tab 经过两个范围输入框，再点开始框并由外部打开后，结束日期之后的日期仍可选', async () => {
        const range = [new Date(2019, 7, 10), new Date(2019, 7, 20)];
        const { container, rerender } = render(<DatePicker type="dateRange" value={range} motion={false} open={false} />);
        await userEvent.tab();
        await userEvent.tab();
        await new Promise((resolve) => setTimeout(resolve));
        await userEvent.click(container.querySelector('input'));
        rerender(<DatePicker type="dateRange" value={range} motion={false} open />);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('焦点在范围清除按钮上按 ArrowDown 不打开面板', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        render(<DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} motion={false} onOpenChange={onOpenChange} />);
        act(() => screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus());
        await userEvent.keyboard('{ArrowDown}');
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('受控值被外部清空时，持焦的范围清除按钮把焦点交给开始输入框', () => {
        const range = [new Date(2019, 7, 10), new Date(2019, 7, 20)];
        const { container, rerender } = render(<DatePicker type="dateRange" value={range} motion={false} />);
        act(() => screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus());
        rerender(<DatePicker type="dateRange" value={[]} motion={false} />);
        expect(container.querySelector('input')).toHaveFocus();
    });
});

describe('DatePicker 焦点方法', () => {
    it('type="monthRange" 的 ref.focus() 聚焦输入框，blur() 移走焦点', () => {
        const ref = React.createRef<DatePickerHandle>();
        const { container } = render(<DatePicker ref={ref} type="monthRange" motion={false} />);
        act(() => ref.current.focus());
        expect(container.querySelector('input')).toHaveFocus();
        act(() => ref.current.blur());
        expect(container.querySelector('input')).not.toHaveFocus();
    });

    it('triggerRender 时 ref.focus() 聚焦自定义触发器', () => {
        const ref = React.createRef<DatePickerHandle>();
        render(<DatePicker ref={ref} motion={false} triggerRender={() => <span>pick</span>} />);
        act(() => ref.current.focus());
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate })).toHaveFocus();
    });

    it('insetInput 面板打开时 ref.focus()、blur() 作用于面板内的输入框', async () => {
        const ref = React.createRef<DatePickerHandle>();
        const { settled, restore } = watchPanelVisible();
        render(<DatePicker ref={ref} defaultOpen insetInput motion={false} />);
        await settled();
        restore();
        const inset = within(getPopup()).getByRole('textbox');
        act(() => inset.blur());
        act(() => ref.current.focus());
        expect(inset).toHaveFocus();
        act(() => ref.current.blur());
        expect(inset).not.toHaveFocus();
    });

    it('insetInput 范围类型面板关闭后 ref.focus() 聚焦触发框的对应输入框', async () => {
        const ref = React.createRef<DatePickerHandle>();
        const { container } = render(<DatePicker ref={ref} type="dateRange" insetInput motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        act(() => ref.current.open());
        await waitFor(() => expect(startInput).toBeDisabled());
        act(() => ref.current.close());
        await waitFor(() => expect(getPopup()).toBeNull());
        await waitFor(() => expect(startInput).toBeEnabled());
        act(() => ref.current.focus());
        expect(startInput).toHaveFocus();
        act(() => ref.current.focus('rangeEnd'));
        expect(endInput).toHaveFocus();
    });

    it('insetInput 的 monthRange 面板关闭时 ref.focus() 聚焦触发框输入框', () => {
        const ref = React.createRef<DatePickerHandle>();
        const { container } = render(<DatePicker ref={ref} type="monthRange" insetInput motion={false} />);
        act(() => ref.current.focus());
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('单选类型开启 insetInput 时打开面板只调用一次 onFocus，且不带 rangeType', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { settled, restore } = watchPanelVisible();
        const { container } = render(<DatePicker insetInput motion={false} onFocus={onFocus} />);
        await userEvent.click(container.querySelector('input'));
        await settled();
        restore();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBeUndefined();
    });
});

describe('DatePicker 值与输入', () => {
    it('键入无法解析的日期按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker motion={false} onChange={onChange} />);
        await userEvent.type(container.querySelector('input'), '2021-13{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateRange 只填开始框按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(<DatePicker type="dateRange" motion={false} onChange={onChange} />);
        await userEvent.type(container.querySelector('input'), '2021-08-01{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('null 清空预设与范围中的 null 端点不发出无法解析的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<DatePicker type="dateRange" value={[new Date(2019, 7, 10), null]} motion={false} />);
        render(<DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} defaultOpen motion={false} presets={[{ text: 'clear', start: null, end: null }]} />);
        await userEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(warn).not.toHaveBeenCalled();
    });

    it('面板打开时只改 disabledDate，日期格的禁用状态随本次渲染更新', () => {
        const pickerValue = new Date(2019, 8, 1);
        const { rerender } = render(<DatePicker defaultOpen defaultPickerValue={pickerValue} disabledDate={() => false} motion={false} />);
        rerender(<DatePicker defaultOpen defaultPickerValue={pickerValue} disabledDate={() => true} motion={false} />);
        expect(getDay('2019-09-12')).toHaveAttribute('aria-disabled', 'true');
    });

    it('父组件重渲染时传入内容相同的新 defaultPickerValue，面板停在当前月份', async () => {
        function Controlled() {
            const [value, setValue] = useState<Date>();
            return <DatePicker type="dateTime" value={value} defaultOpen defaultPickerValue={new Date(2022, 8, 1)} motion={false} onChange={(date) => setValue(date as Date)} />;
        }
        render(<Controlled />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await userEvent.click(getDay('2022-10-15'));
        expect(getDay('2022-10-15')).not.toBeNull();
    });
});

describe('DatePicker 可访问性', () => {
    it('单输入框的 aria-label 以 group 角色命名根元素', () => {
        render(<DatePicker aria-label="生日" />);
        expect(screen.getByRole('group', { name: '生日' })).toHaveClass(dp);
    });

    it('Form inset 标签下 dateRange 的 group 名称指向渲染出的标签', () => {
        render(
            <Form labelPosition="inset">
                <Form.DatePicker type="dateRange" field="range" label="区间" />
            </Form>
        );
        const group = screen.getByRole('group', { name: '区间' });
        expect(document.getElementById(group.getAttribute('aria-labelledby'))).not.toBeNull();
    });

    it('范围清除按钮与内嵌输入框按 LocaleProvider 的语言命名', () => {
        render(
            <LocaleProvider locale={en_US}>
                <DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} />
                <DatePicker defaultOpen insetInput motion={false} />
            </LocaleProvider>
        );
        expect(screen.getByRole('button', { name: en_US.DatePicker.clearRange })).not.toBeNull();
        expect(within(getPopup()).getByRole('textbox')).toHaveAccessibleName(en_US.DatePicker.placeholder.date as string);
    });

    it('Tooltip 包住的 DatePicker 只在输入框停留，根元素不是 Tab 停靠点', async () => {
        const { container } = render(
            <Tooltip content="tip">
                <DatePicker />
            </Tooltip>
        );
        await userEvent.tab();
        expect(container.querySelector('input')).toHaveFocus();
    });
});
