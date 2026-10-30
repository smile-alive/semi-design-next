/** @jsxImportSource vue */
import { createApp, defineComponent, KeepAlive, ref, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { add, addDays, addWeeks, endOfWeek, format, parse, set, startOfWeek } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { DatePickerFoundationState } from '@fibrae/semi-foundation/date-picker/foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { toIANA, zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import { countLiveListeners, endLeaveAnimations, render } from '@test/utils/vue';
import DatePicker, { type DatePickerDisabledDateType, type DatePickerEmits, type DatePickerHandle, type DatePickerPresetType, type DatePickerProps, type DatePickerTimePickerOpts, type DatePickerTriggerSlotProps, type DatePickerType } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { Form, FormDatePicker } from '../../form';
import { LocaleProvider } from '../../locale';
import Popover from '../../popover';
import Tabs, { TabPane } from '../../tabs';
import TimePicker from '../../time-picker';
import Tooltip from '../../tooltip';
import type { DatePickerYearAndMonthEmits } from '../internal';
import YearAndMonth from '../year-and-month.vue';
import Model from './fixtures/model.vue';
import OpenModel from './fixtures/open-model.vue';

type ChangeFn = (...args: DatePickerEmits['change']) => void;
type EmitFn<K extends keyof DatePickerEmits> = (...args: DatePickerEmits[K]) => void;
type YearAndMonthEmitFn<K extends keyof DatePickerYearAndMonthEmits> = (...args: DatePickerYearAndMonthEmits[K]) => void;
type Slots = Record<string, (scope: Record<string, unknown>) => unknown>;

const baseYear = 2019;
const baseDay = 8;
const baseMon = 8;
const baseDate = new Date(baseYear, baseMon, baseDay, 8, 8, 8, 8);

const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${BASE_CLASS_PREFIX}-datepicker`;
const dp = `${BASE_CLASS_PREFIX}-datepicker`;

// The popup content mounts a few ticks after the popover opens
const settle = () => new Promise((resolve) => setTimeout(resolve));
async function renderPicker(props: Record<string, unknown> = {}, slots: Slots = {}) {
    const view = render(DatePicker, { props, slots: slots as never });
    await settle();
    return {
        ...view,
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
}
async function renderHost(component: unknown, props: Record<string, unknown> = {}, slots: Slots = {}) {
    const view = render(component as never, { props: props as never, slots: slots as never });
    await settle();
    return view;
}
async function renderNode(node: () => unknown) {
    const view = render(defineComponent({ render: node as () => never }));
    await settle();
    return view;
}
// Testing Library re-inserts the mounted nodes, which drops the focus taken while mounting
async function mountInPlace(node: () => unknown) {
    const container = document.body.appendChild(document.createElement('div'));
    const app = createApp(defineComponent({ render: node as () => never }));
    app.mount(container);
    onTestFinished(() => {
        app.unmount();
        container.remove();
    });
    await settle();
    return container;
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector);
// jsdom runs no CSS animations, and once the popup has been positioned it leaves with motion and waits for
// animationend; end the leave animation the way a browser would
const waitForClosed = () =>
    waitFor(() => {
        endLeaveAnimations();
        expect(getPopup()).toBeNull();
    });
// Tooltip reports the panel open (where DatePicker moves focus) in a task after the popup mounts; await this so
// nothing the open triggers lands after the assertions
const waitForPanelOpened = async () => {
    await waitFor(() => expect(getPopup()).not.toBeNull());
    await settle();
};
const getPopoverWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
// day cells carry their full date (yyyy-MM-dd) as aria-label; blank cells of adjacent months have none
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getPresetButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getWeekDays = (side: string, weekIndex: number) => getPanel(side).querySelectorAll(`.${dp}-week`)[weekIndex].querySelectorAll<HTMLElement>(`.${dp}-day`);
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
// year/month scroll lists in DOM order: [year, month] per panel (left first)
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
async function typeInto(input: HTMLInputElement, text: string) {
    await fireEvent.update(input, text);
    await settle();
}

const yearAndMonthDefaultProps = {
    currentYear: { left: 2021, right: 2022 },
    currentMonth: { left: 6, right: 7 },
    locale: en_US.DatePicker,
    type: 'month' as const,
};
async function renderYearAndMonth(props: Record<string, unknown> = {}, slots: Slots = {}) {
    const view = render(YearAndMonth, { props: { ...yearAndMonthDefaultProps, ...props }, slots: slots as never });
    await settle();
    return view;
}

function getRandomIANATimeZone(): [string, number] {
    const TIME_ZONE = Array.from({ length: 26 }).map((_, index) => index - 11);
    const offset = Math.floor(Math.random() * TIME_ZONE.length);
    const timeZone = toIANA(TIME_ZONE[offset]);
    return [timeZone, offset];
}

afterEach(() => {
    vi.useRealTimers();
});

describe(`DatePicker`, () => {
    it(`外观`, async () => {
        const { container } = await renderPicker({ defaultValue: new Date() });
        expect(container.querySelectorAll(`.${dp}`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-clearable`)).toHaveLength(1);
    });

    it(`defaultOpen 默认展开`, async () => {
        await renderPicker({ defaultValue: new Date(), defaultOpen: true, motion: false });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await fireEvent.mouseDown(document);
        await waitForClosed();
    });

    it(`open 展开状态`, async () => {
        const view = await renderPicker({ defaultValue: new Date(), motion: false, open: true });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await userEvent.click(document.body);
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await view.rerender({ open: false });
        await userEvent.click(document.body);
        await waitForClosed();
    });

    it(`presets 预设`, async () => {
        const dayOffset = 1;
        const presets = [
            { text: 'Today', start: new Date(baseDate), end: new Date(baseDate) },
            {
                text: 'Next Day',
                start: addDays(new Date(baseDate), dayOffset),
                end: addDays(new Date(baseDate), dayOffset),
            },
        ];
        const defaultValue = new Date(addDays(new Date(baseDate), -dayOffset));

        const { container } = await renderPicker({ defaultValue, motion: false, open: true, presets });
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
        const onChange = vi.fn<ChangeFn>();

        const { container } = await renderHost(Model, {
            initValue: currentValue,
            motion: false,
            open: true,
            onChange,
        });
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
        const onConfirm = vi.fn<EmitFn<'confirm'>>();

        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: currentValue,
            motion: false,
            needConfirm: true,
            open: true,
            onConfirm,
        });
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
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const onChange = vi.fn<ChangeFn>();

        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: new Date(baseDate),
            motion: false,
            needConfirm: true,
            onChange,
            onOpenChange,
        });

        await userEvent.click(document.body);
        expect(onOpenChange).not.toHaveBeenCalled();

        const inputWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement;
        await userEvent.click(inputWrapper.parentElement as HTMLElement);
        expect(onOpenChange).toHaveBeenCalledWith(true);

        await typeInto(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`) as HTMLInputElement, '2019-10-02 08:30:02');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-02 08:30:02');
    });

    it(`范围选择器`, async () => {
        const dayOffset = 3;
        const leftPrevClickTimes = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];
        const onChange = vi.fn<ChangeFn>();

        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: currentValue,
            defaultOpen: true,
            motion: false,
            needConfirm: false,
            onChange,
        });

        const startDayDom = document.querySelector(`.${dp}-day-selected-start`) as Element;
        const endDayDom = document.querySelector(`.${dp}-day-selected-end`);

        expect(Array.from({ length: dayOffset }).reduce<Element>((cur) => cur.nextElementSibling as Element, startDayDom)).toBe(endDayDom);

        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);

        for (let i = 0; i < leftPrevClickTimes; i++) {
            await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        }

        const [startInput, endInput] = container.querySelectorAll('input');
        startInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 1)[0]);
        endInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 1)[dayOffset]);

        const value = onChange.mock.calls.at(-1)?.[0] as Date[];
        const startDay = 2;
        expect(value[0].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[0].getDate()).toBe(startDay);
        expect(value[1].getMonth()).toBe(baseMon - leftPrevClickTimes);
        expect(value[1].getDate()).toBe(startDay + dayOffset);
        expect(startInput.value.startsWith('2019-06-02')).toBe(true);
        expect(endInput.value.startsWith('2019-06-05')).toBe(true);
    });

    it(`范围选择器中切换面板`, async () => {
        const dayOffset = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];

        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: currentValue,
            defaultOpen: true,
            motion: false,
            needConfirm: false,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        const startIndex = 0;

        startInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 1)[startIndex]);
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.click(getWeekDays('left', 1)[startIndex + dayOffset]);
        await waitForClosed();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it(`起始值大于结束值时，范围选择器切换面板`, async () => {
        const dayOffset = 3;
        const currentValue = [new Date(baseDate), new Date(baseDate).setDate(baseDay + dayOffset)];

        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: currentValue,
            defaultOpen: true,
            motion: false,
            needConfirm: false,
        });
        const [startInput, endInput] = container.querySelectorAll('input');

        startInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 2)[0]);
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2019-09-15');
        expect(endInput).toHaveValue('');
    });

    it(`年份或月份选择器`, async () => {
        const monOffset = 2;
        const yearOffset = 3;
        const onChange = vi.fn<ChangeFn>();

        const { container } = await renderPicker({
            type: 'month',
            defaultValue: new Date(baseDate),
            defaultOpen: true,
            motion: false,
            onChange,
        });

        const [yearList, monthList] = getYMLists();
        const currentSelectedYear = yearList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element;
        await userEvent.click(Array.from({ length: yearOffset }).reduce<Element>((cur) => cur.nextElementSibling as Element, currentSelectedYear));

        const currentSelectedMon = monthList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element;
        await userEvent.click(Array.from({ length: monOffset }).reduce<Element>((cur) => cur.nextElementSibling as Element, currentSelectedMon));

        const value = onChange.mock.calls.at(-1)?.[0] as Date;
        expect(value.getFullYear()).toBe(baseYear + yearOffset);
        expect(value.getMonth()).toBe(baseMon + monOffset);
        expect(container.querySelector('input')).toHaveValue(format(new Date(baseYear + yearOffset, baseMon + monOffset), 'yyyy-MM'));
    });

    it('周选择', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            endDateOffset: (date: Date) => endOfWeek(date, { weekStartsOn: 1 }),
            startDateOffset: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
            weekStartsOn: 1,
        });

        await userEvent.click(getWeekDays('left', 1)[3]);

        const now = new Date();
        const monthFirstDay = add(new Date(now.getFullYear(), 0, 1, 0, 0, 0), { months: now.getMonth() });
        const clickDay = addDays(startOfWeek(addWeeks(monthFirstDay, 1), { weekStartsOn: 1 }), 3);
        const [startInput, endInput] = container.querySelectorAll('input');

        expect(startInput).toHaveValue(ymd(startOfWeek(clickDay, { weekStartsOn: 1 })));
        expect(endInput).toHaveValue(ymd(endOfWeek(clickDay, { weekStartsOn: 1 })));
    });

    it('周选择在 UTC 以西时区点击周三得到完整的一周', async () => {
        const originalTZ = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            const { container } = await renderPicker({
                type: 'dateRange',
                defaultOpen: true,
                defaultPickerValue: '2021-06-01',
                endDateOffset: (date: Date) => endOfWeek(date, { weekStartsOn: 1 }),
                motion: false,
                startDateOffset: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
                weekStartsOn: 1,
            });
            await userEvent.click(getDay('2021-06-16'));
            const [startInput, endInput] = container.querySelectorAll('input');
            expect(startInput).toHaveValue('2021-06-14');
            expect(endInput).toHaveValue('2021-06-20');
        } finally {
            process.env.TZ = originalTZ;
        }
    });

    it('autofocus 自动聚焦', async () => {
        const container = await mountInPlace(() => <DatePicker autofocus motion={false} />);
        const container2 = await mountInPlace(() => <DatePicker autofocus={false} motion={false} />);

        expect(container.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(1);
        expect(container2.querySelectorAll(`.${dp} .${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(0);
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('自定义 dropdownClassName 与 dropdownStyle', async () => {
        await renderPicker({
            dropdownClassName: 'my-datePicker',
            dropdownStyle: { color: 'red' },
            defaultOpen: true,
            motion: false,
        });
        const dropdown = document.querySelector('.my-datePicker');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('clear 事件', async () => {
        const onClear = vi.fn<EmitFn<'clear'>>();
        const { container } = await renderPicker({
            defaultOpen: true,
            motion: false,
            autofocus: true,
            defaultValue: baseDate,
            showClear: true,
            onClear,
        });
        await fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('输入禁用日期不触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            defaultOpen: true,
            motion: false,
            modelValue: '2021-04-12',
            onChange,
            disabledDate: (date: Date) => new Date(date).getDate() === 15,
        });
        const input = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper input`) as HTMLInputElement;
        await typeInto(input, '2021-04-15');
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(input, '2021-04-13');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-04-13');
    });

    it('点击预设的禁用日期不触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        const defaultValue = '2021-04-12';
        const notDisabledValue = '2021-04-30';
        const defaultDate = new Date(`${defaultValue} 00:00:00`);
        const notDisabledDate = new Date(`${notDisabledValue} 00:00:00`);
        const { container } = await renderPicker({
            open: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (date: Date) => date.getDate() === 15,
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
        const zone = ref(originZone);

        const { container } = await renderNode(() => <ConfigProvider timeZone={zone.value}>{() => <DatePicker type="dateTime" defaultOpen defaultPickerValue={today} motion={false} />}</ConfigProvider>);

        const days = document.querySelectorAll(`.${dp}-day`);
        // index 6 is always a valid date: the first row holds 7 cells, at most one of which belongs to the previous month
        await userEvent.click(days[6]);
        expect(document.querySelectorAll(`.${dp}-day-selected`)).toHaveLength(1);
        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
        const selectedDay = parse(input.value, strings.FORMAT_DATE_TIME, new Date());
        expect(ymd(selectedDay)).toBe(days[6].getAttribute('aria-label'));
        expect(format(selectedDay, 'HH:mm:ss')).toBe('22:00:00');
        zone.value = newZone;
        await settle();
        const newZoneDate = add(selectedDay, { hours: newOffset - originOffset });
        expect(input.value).toEqual(format(newZoneDate, strings.FORMAT_DATE_TIME));
    });

    it('受控模式下切换 timeZone 时 inputValue 正确', async () => {
        const now = new Date();
        const [originZone, originOffset] = getRandomIANATimeZone();
        const [newZone, newOffset] = getRandomIANATimeZone();
        const originZoneDate = zonedTimeToUtc(now, originZone);
        const zone = ref(originZone);

        const { container } = await renderNode(() => <ConfigProvider timeZone={zone.value}>{() => <DatePicker type="dateTime" modelValue={originZoneDate} defaultOpen motion={false} />}</ConfigProvider>);

        const input = container.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
        expect(input.value).toEqual(format(now, strings.FORMAT_DATE_TIME));
        zone.value = newZone;
        await settle();
        const newZoneDate = add(now, { hours: newOffset - originOffset });
        expect(input.value).toEqual(format(newZoneDate, strings.FORMAT_DATE_TIME));
    });

    it(`默认 locale 格式`, async () => {
        const localeFormatten = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');

        const { container } = await renderPicker({ defaultValue, format: localeFormatten });
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(format(defaultValue, localeFormatten, { locale: zhCN }));
    });

    it(`enUS locale 格式`, async () => {
        const localeFormatten = 'yyyy-MM-dd EEEE';
        const defaultValue = new Date('2021-04-30');

        const { container } = await renderNode(() => <LocaleProvider locale={en_US}>{() => <DatePicker defaultValue={defaultValue} format={localeFormatten} />}</LocaleProvider>);
        expect(container.querySelector(`.${dp} .${BASE_CLASS_PREFIX}-input`)).toHaveValue(format(defaultValue, localeFormatten, { locale: enUS }));
    });

    it(`presetClick 事件`, async () => {
        const presets = [
            { text: 'Today', start: new Date(baseDate), end: new Date(baseDate) },
            { text: 'Next Day', start: addDays(new Date(baseDate), 1), end: addDays(new Date(baseDate), 1) },
        ];
        const handlePresetClick = vi.fn<(...args: DatePickerEmits['presetClick']) => string>((_item, event) => event.type);

        await renderPicker({
            defaultValue: addDays(new Date(baseDate), -1),
            motion: false,
            open: true,
            presets,
            onPresetClick: handlePresetClick,
        });

        const btns = getPresetButtons();
        await userEvent.click(btns[0]);
        await userEvent.click(btns[1]);
        expect(handlePresetClick).toHaveBeenCalledTimes(2);
        expect(handlePresetClick.mock.calls[0][0]).toEqual(presets[0]);
        expect(handlePresetClick.mock.calls[1][0]).toEqual(presets[1]);
        expect(handlePresetClick.mock.results.map((r) => r.value)).toEqual(['click', 'click']);
    });

    it(`范围类型点击一个日期时不触发 notifyChange`, async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderHost(Model, {
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-08-13',
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');

        startInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).not.toHaveBeenCalled();
        endInput.focus();
        await settle();
        await userEvent.click(getWeekDays('left', 1)[2]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [rangeStart, rangeEnd] = onChange.mock.calls[0][0] as Date[];
        expect(ymd(rangeStart)).toBe('2021-08-08');
        expect(ymd(rangeEnd)).toBe('2021-08-10');
        expect(startInput).toHaveValue('2021-08-08');
        expect(endInput).toHaveValue('2021-08-10');
    });

    // A range end outside the disabled month stays selectable, e.g. a September day when defaultValue is
    // ['2021-08-06', '2021-08-15'] and August is disabled.
    it('rangeStart 禁用时仍可选择 rangeEnd', async () => {
        const onChange = vi.fn<ChangeFn>();
        const defaultValue = ['2021-08-06', '2021-08-15'];
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            motion: false,
            defaultValue,
            onChange,
            disabledDate: (date: Date) => new Date(date).getMonth() === 7,
            style: { width: '300px' },
        });
        const [startInput, endInput] = container.querySelectorAll('input');

        endInput.focus();
        await settle();
        await userEvent.click(getWeekDays('right', 1)[5]); // 2021-09-10

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
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            multiple: true,
            defaultOpen: true,
            motion: false,
            defaultValue: ['2021-08-06', '2021-08-15'],
            onChange,
            disabledDate: (date: Date) => {
                const day = new Date(date).getDate();
                return day > 20 && day < 25;
            },
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
        const disabledTime = vi.fn<(date: Date | Date[], panelType: string) => { disabledHours: () => number[] }>((_date, panelType) => (panelType === 'left' ? { disabledHours: () => [17, 18] } : { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] }));
        const props = {
            type: 'dateTimeRange',
            defaultValue: ['2021-09-08', '2021-10-03'],
            defaultOpen: true,
            motion: false,
            disabledTime,
            style: { width: '400px' },
            timePickerOpts: { scrollItemProps: { cycled: false } },
        };
        const view = await renderPicker(props);
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`) as HTMLElement);
        const args = disabledTime.mock.lastCall as unknown[];
        expect((args[0] as Date[]).length).toBe(2);
        expect(args[1]).toBe('left');

        await view.rerender({ ...props, type: 'dateTime' });
        await userEvent.click(document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`) as HTMLElement);
        const args2 = disabledTime.mock.lastCall as unknown[];
        expect(Array.isArray(args2[0])).toBe(false);
        expect(args2[1]).toBe('left');
    });

    it('rangeSeparator 分隔符', async () => {
        const rangeSeparator = '-';
        const props = {
            motion: false,
            defaultValue: ['2021-08-06', '2021-08-15'],
            style: { width: '300px' },
            rangeSeparator,
        };
        await renderNode(() => (
            <div>
                <DatePicker {...props} type="dateRange" />
                <DatePicker {...props} type="dateTimeRange" />
            </div>
        ));
        const allSeparators = document.querySelectorAll(`.${dp}-range-input-separator`);
        expect(allSeparators[0].textContent?.trim()).toBe(rangeSeparator);
        expect(allSeparators[1].textContent?.trim()).toBe(rangeSeparator);
    });

    it('输入年份长度超过 4 位', async () => {
        const handleChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            motion: false,
            defaultOpen: true,
            defaultValue: '2021-12-21',
            onChange: handleChange,
        });

        await typeInto(container.querySelector('input') as HTMLInputElement, '20221-12-21');
        expect(handleChange).not.toHaveBeenCalled();
    });

    const navNames: Record<string, string> = {
        'Previous year': zh_CN.DatePicker.prevYear,
        'Next year': zh_CN.DatePicker.nextYear,
        'Previous month': zh_CN.DatePicker.prevMonth,
        'Next month': zh_CN.DatePicker.nextMonth,
    };
    const navButton = (side: string, label: string) => getPanel(side).querySelector(`[aria-label="${navNames[label]}"]`) as HTMLElement;

    it('点击上一年与下一年按钮', async () => {
        await renderPicker({
            type: 'dateRange',
            motion: false,
            style: { width: '300px' },
            defaultPickerValue: new Date('2021-12-01'),
            defaultOpen: true,
        });

        await userEvent.click(navButton('left', 'Previous year'));
        expect(getNavTitle('left')).toBe('2020年 12月');
        await userEvent.click(navButton('left', 'Next year'));
        expect(getNavTitle('left')).toBe('2021年 12月');

        await userEvent.click(navButton('right', 'Next year'));
        expect(getNavTitle('right')).toBe('2023年 1月');
        await userEvent.click(navButton('right', 'Previous year'));
        expect(getNavTitle('right')).toBe('2022年 1月');
    });

    const expectMonthSyncChange = async (type: string) => {
        await renderPicker({
            type,
            motion: false,
            style: { width: '300px' },
            defaultPickerValue: new Date('2021-12-01'),
            defaultOpen: true,
        });

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
        const handleChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
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
        await waitForClosed();
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
    });

    it(`预设值为 null 且 needConfirm`, async () => {
        const handleChange = vi.fn<ChangeFn>();
        const handleConfirm = vi.fn<EmitFn<'confirm'>>();
        await renderPicker({
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
        await waitForClosed();
    });

    it('dateRange 的 #trigger 点击后打开面板，选完两端后关闭', async () => {
        await renderPicker({ type: 'dateRange', motion: false }, { trigger: ({ placeholder }) => <button>{placeholder as string}</button> });
        await userEvent.click(screen.getByRole('button'));
        await settle();
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getWeekDays('right', 1)[0]);

        await waitForClosed();
    });

    it('#trigger 把范围 placeholder 交给 h() 渲染不改写语言包', async () => {
        const before = [...zh_CN.DatePicker.placeholder.dateRange];
        await renderPicker({ type: 'dateRange', motion: false }, { trigger: ({ placeholder }) => <button>{placeholder as string}</button> });
        expect(zh_CN.DatePicker.placeholder.dateRange).toEqual(before);
    });

    it('month 类型', async () => {
        await renderPicker({ type: 'month', defaultOpen: true, motion: false });

        expect(getPopup()).toHaveAttribute('x-type', 'month');
        expect(getYMLists()).toHaveLength(2);
    });

    it('disabled 属性', async () => {
        const { container } = await renderPicker({ disabled: true, defaultValue: baseDate, motion: false });

        expect(container.querySelector('input')).toBeDisabled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
    });

    it('placeholder 属性', async () => {
        await renderPicker({ placeholder: '请选择日期', motion: false });

        expect(screen.getByPlaceholderText('请选择日期')).toBeInTheDocument();
    });

    it('#prefix 与 #insetLabel', async () => {
        const { container } = await renderPicker({ motion: false }, { prefix: () => <span class="custom-prefix">前缀</span>, insetLabel: () => '日期' });

        expect(container.querySelector('.custom-prefix')).toHaveTextContent('前缀');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).not.toBeNull();
    });

    it('borderless 属性', async () => {
        const { container } = await renderPicker({ borderless: true, defaultValue: baseDate, motion: false });

        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
    });

    it('validateStatus', async () => {
        const { container } = await renderPicker({ validateStatus: 'error', defaultValue: baseDate, motion: false });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
    });

    it('size 属性', async () => {
        const { container } = await renderPicker({ size: 'small', defaultValue: baseDate, motion: false });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
    });

    it('多选', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            multiple: true,
            defaultOpen: true,
            motion: false,
            onChange,
            defaultPickerValue: '2021-08-01',
        });

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
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            format: 'yyyy-MM-dd',
            motion: false,
            onChange,
        });
        expect(getPopup()).toHaveAttribute('x-type', 'date');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        await waitForClosed();
    });

    it('format 不含时间标记时，dateTimeRange 降级为 dateRange', async () => {
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(baseDate), addDays(new Date(baseDate), 5)],
            defaultOpen: true,
            format: 'yyyy-MM-dd',
            motion: false,
        });
        expect(getPopup()).toHaveAttribute('x-type', 'dateRange');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue(ymd(baseDate));
        expect(endInput).toHaveValue(ymd(addDays(baseDate, 5)));
    });

    it('format 含时间标记时保留 dateTime 类型', async () => {
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            format: 'yyyy-MM-dd HH:mm',
            motion: false,
        });
        expect(getPopup()).toHaveAttribute('x-type', 'dateTime');
        expect(getPopup()?.querySelector(`.${dp}-switch-time`)).not.toBeNull();
        expect(container.querySelector('input')).toHaveValue(format(baseDate, 'yyyy-MM-dd HH:mm'));
    });

    it('insetInput 设置默认位置', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, insetInput: true, motion: false });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', strings.POSITION_INLINE_INPUT);
    });

    it('position 含 Over 时 insetInput 设置间距', async () => {
        await renderPicker({
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            position: 'leftTopOver',
        });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        // the 1px spacing only shifts the computed popup offset, which jsdom does not lay out
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'leftTopOver');
    });

    it('position 不含 Over 时的 insetInput', async () => {
        await renderPicker({
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            position: 'bottomLeft',
        });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('rangeSeparator 去除首尾空白', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(baseDate), addDays(new Date(baseDate), 5)],
            defaultOpen: true,
            motion: false,
            rangeSeparator: ' - ',
            onChange,
        });
        expect(container.querySelector(`.${dp}-range-input-separator`)?.textContent).toBe(' - ');
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(endInput, ymd(addDays(baseDate, 6)));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(baseDate), ymd(addDays(baseDate, 6))]);
        expect(startInput).toHaveValue(ymd(baseDate));
    });

    it('monthRange 类型', async () => {
        await renderPicker({ type: 'monthRange', defaultOpen: true, motion: false });
        expect(getPopup()).toHaveAttribute('x-type', 'monthRange');
        expect(getYMLists()).toHaveLength(4);
    });

    it('month 类型的默认值与选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'month',
            defaultValue: new Date(2021, 5),
            defaultOpen: true,
            motion: false,
            onChange,
        });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: '3月' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-03');
        expect(getYMSelected()).toEqual(['2021年', '3月']);
        expect(container.querySelector('input')).toHaveValue('2021-03');
    });

    it('dateRange 的 defaultValue', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)],
            defaultOpen: true,
            motion: false,
        });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inrange`);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('dateTimeRange 的 defaultValue', async () => {
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 7, 1, 10, 0, 0), new Date(2021, 7, 15, 18, 0, 0)],
            defaultOpen: true,
            motion: false,
        });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-08-01 10:00:00');
        expect(endInput).toHaveValue('2021-08-15 18:00:00');
    });

    it('切换上一月与下一月', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getNavTitle('left')).toBe('2019年 9月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
    });

    it('点击年月文字打开年月选择器', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        expect(getPopup()?.querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getYMSelected()).toEqual(['2019年', '9月']);
        expect(getPopup()).not.toBeNull();
    });

    it('打开年月选择器与返回日期面板的点击仍传到 document 的 click 监听', async () => {
        const onDocumentClick = vi.fn<(e: MouseEvent) => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            // the Popover stops the propagation of clicks in the panel unless stopPropagation is false
            await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false, stopPropagation: false });
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
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');

        await userEvent.click(getDay(ymd(addDays(baseDate, 1))));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getPopup()).not.toBeNull();

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup()?.querySelector(`.${dp}-tpk`)).not.toBeNull();
    });

    it('disabledDate 属性', async () => {
        const disabledDate = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, disabledDate, motion: false });

        expect(getDay('2019-09-07')).toHaveClass(`${dp}-day-disabled`);
        expect(getDay('2019-09-07')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-09')).not.toHaveClass(`${dp}-day-disabled`);
        expect(getPopup()?.querySelectorAll(`.${dp}-day-disabled`)).toHaveLength(9);
    });

    it('点击外部关闭面板时 blur 收到原生 mousedown 事件', async () => {
        const onBlur = vi.fn<EmitFn<'blur'>>();
        const onClickOutSide = vi.fn<EmitFn<'clickOutSide'>>();
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onBlur, onClickOutSide });
        await fireEvent.mouseDown(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        const [blurEvent] = onBlur.mock.calls[0];
        expect(blurEvent).toBeInstanceOf(MouseEvent);
        expect(blurEvent?.type).toBe('mousedown');
        const [outsideEvent] = onClickOutSide.mock.calls[0];
        expect(outsideEvent).toBeInstanceOf(MouseEvent);
        await waitForClosed();
    });

    it('在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        const nested = () => (
            <Popover ariaLabel="Nested" motion={false} trigger="click">
                {{
                    default: () => <button type="button">nested trigger</button>,
                    content: () => <button type="button">inside nested</button>,
                }}
            </Popover>
        );
        await renderPicker({ defaultOpen: true, motion: false }, { topSlot: nested });
        await fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPopup()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitForClosed();
    });

    it('面板内 TimePicker 设 stopPropagation 为 false 时，在它的面板内按下鼠标不关闭 DatePicker', async () => {
        await renderPicker({ defaultOpen: true, motion: false }, { topSlot: () => <TimePicker {...{ ariaLabel: 'nested time' }} defaultOpen motion={false} stopPropagation={false} /> });
        const timePanel = await waitFor(() => {
            const panel = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-timepicker-panel`);
            expect(panel).not.toBeNull();
            return panel as HTMLElement;
        });
        await fireEvent.mouseDown(timePanel);
        expect(getPopup()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitForClosed();
    });

    it('Esc 或选中日期关闭面板时 blur 没有事件参数', async () => {
        const onBlur = vi.fn<EmitFn<'blur'>>();
        const view = await renderPicker({
            defaultValue: new Date(2019, 8, 11),
            defaultOpen: true,
            motion: false,
            onBlur,
        });
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('grid')).toBeNull();
        });
        expect(onBlur.mock.calls).toEqual([[undefined]]);
        view.unmount();

        onBlur.mockClear();
        await renderPicker({ defaultValue: new Date(2019, 8, 11), defaultOpen: true, motion: false, onBlur });
        await userEvent.click(getDay('2019-09-12'));
        await waitForClosed();
        expect(onBlur.mock.calls).toEqual([[undefined]]);
    });

    it('clear 回调', async () => {
        const onClear = vi.fn<EmitFn<'clear'>>();
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false, onChange, onClear });

        await fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('compact 密度', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, density: 'compact', motion: false });
        expect(getPopup()).toHaveClass(`${dp}-compact`);
    });

    it('needConfirm 的取消按钮', async () => {
        const onCancel = vi.fn<EmitFn<'cancel'>>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onCancel,
        });

        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toEqual(baseDate);
        await waitForClosed();
    });

    it('v-model:open 与 openChange', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const view = await renderPicker({ defaultValue: baseDate, motion: false, open: false, onOpenChange });

        expect(getPopup()).toBeNull();

        await view.rerender({ open: true });
        expect(document.querySelectorAll(popupSelector)).toHaveLength(1);

        await view.rerender({ open: false });
        await waitForClosed();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('#trigger 插槽', async () => {
        const { container } = await renderPicker(
            { motion: false },
            {
                trigger: ({ placeholder }) => <button class="custom-trigger">{(placeholder as string) || 'Select Date'}</button>,
            }
        );

        expect(container.querySelector('.custom-trigger')).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();

        await userEvent.click(container.querySelector('.custom-trigger') as HTMLElement);
        await settle();
        expect(getPopup()).not.toBeNull();
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('#trigger 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderPicker(
            { motion: false },
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <button type="button" aria-label="清除" onClick={onPress} />
                    </div>
                ),
            }
        );

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        await settle();
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopup()).toBeNull();
    });

    it.each(['{Enter}', ' '])('#trigger 自带可聚焦按钮时，Tab 到按钮后按 %j 打开面板', async (key) => {
        await renderPicker({ motion: false }, { trigger: () => <button type="button">pick</button> });

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.keyboard(key);
        await settle();
        expect(getPopup()).not.toBeNull();
    });

    it('dateRange 的 #trigger 替换两个范围输入框', async () => {
        const { container } = await renderPicker(
            { type: 'dateRange', motion: false },
            {
                trigger: ({ placeholder }) => <button class="custom-range-trigger">{String(placeholder || 'Select Range')}</button>,
            }
        );

        expect(container.querySelector('.custom-range-trigger')).not.toBeNull();
        expect(container.querySelector(`.${dp}-range-input`)).toBeNull();
        expect(container.querySelector('input')).toBeNull();
    });

    it('change 的参数为 (date, dateString)', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ defaultOpen: true, defaultPickerValue: '2021-08-01', motion: false, onChange });

        await userEvent.click(getWeekDays('left', 1)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const args = onChange.mock.calls[0];
        expect(args[0]).toBeInstanceOf(Date);
        expect(args[1]).toBe('2021-08-08');
    });

    it('presetPosition 为 left', async () => {
        await renderPicker({
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            presetPosition: 'left',
            presets: [{ text: 'Today', start: new Date(), end: new Date() }],
        });
        expect(getPopup()?.querySelector(`.${dp}-quick-control-left`)).toHaveTextContent('Today');
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', 'left');
    });

    it('presetPosition 为 right', async () => {
        await renderPicker({
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            presetPosition: 'right',
            presets: [{ text: 'Today', start: new Date(), end: new Date() }],
        });
        expect(getPopup()?.querySelector(`.${dp}-quick-control-right`)).toHaveTextContent('Today');
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', 'right');
    });

    it('输入合法日期时 input 值变化', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ motion: false, onChange });

        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-08-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-08-15');
    });

    it('输入非法日期时 input 值变化', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ motion: false, onChange });

        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, 'invalid-date');
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('invalid-date');
    });

    it('dateRange 输入框聚焦', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)],
            defaultOpen: true,
            motion: false,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        const startWrapper = container.querySelector(`.${dp}-range-input-wrapper-start`);
        const endWrapper = container.querySelector(`.${dp}-range-input-wrapper-end`);

        startInput.focus();
        await settle();
        expect(startWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        endInput.focus();
        await settle();
        expect(startWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('monthRange 的 defaultValue', async () => {
        const { container } = await renderPicker({
            type: 'monthRange',
            defaultValue: [new Date(2021, 0), new Date(2021, 6)],
            defaultOpen: true,
            motion: false,
        });
        expect(getYMSelected()).toEqual(['2021年', '1月', '2021年', '7月']);
        expect(container.querySelector('input')).toHaveValue('2021-01 ~ 2021-07');
    });

    it('多选与 max 属性', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            max: 2,
            multiple: true,
            defaultOpen: true,
            defaultPickerValue: '2021-08-01',
            motion: false,
            onChange,
        });

        const days = getWeekDays('left', 1);
        await userEvent.click(days[0]);
        await userEvent.click(days[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        await userEvent.click(days[2]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
    });

    it('dateRange 的 startDateOffset 与 endDateOffset', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-08-01',
            endDateOffset: (date: Date) => endOfWeek(date),
            motion: false,
            startDateOffset: (date: Date) => startOfWeek(date),
            onChange,
        });

        await userEvent.click(getWeekDays('left', 2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2021-08-15', '2021-08-21']);
    });

    it('showClear 属性', async () => {
        const view = await renderPicker({ defaultValue: baseDate, motion: false, showClear: true });
        const inputWrapper = view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement;
        await userEvent.hover(inputWrapper);
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();

        await view.rerender({ showClear: false });
        await userEvent.hover(inputWrapper);
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('autoSwitchDate 为 false', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            defaultValue: baseDate,
            autoSwitchDate: false,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('dateRange 的 syncSwitchMonth', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 7, 1), new Date(2021, 8, 15)],
            defaultOpen: true,
            motion: false,
            syncSwitchMonth: true,
        });
        expect(getNavTitle('left')).toBe('2021年 8月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`)).toHaveStyle({
            visibility: 'hidden',
        });
        expect(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`)).toHaveStyle({
            visibility: 'hidden',
        });

        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('dateRange 的 showClearIgnoreDisabled', async () => {
        // showClearIgnoreDisabled is not a DatePicker prop; the test proves that passing it has no effect
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)],
            disabled: true,
            motion: false,
            showClearIgnoreDisabled: true,
        });

        // showClearIgnoreDisabled is derived from insetInput only, so a disabled range trigger has no clear button
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('切到上一月时 panelChange 收到新面板的日期与原值字符串', async () => {
        const onPanelChange = vi.fn<EmitFn<'panelChange'>>();
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onPanelChange });

        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        const [date, dateStr] = onPanelChange.mock.calls[0] as [Date, string];
        expect(date.getMonth()).toBe(baseMon - 1);
        expect(dateStr).toBe('2019-08-08');
    });

    it('#topSlot 与 #bottomSlot', async () => {
        await renderPicker(
            { defaultValue: baseDate, defaultOpen: true, motion: false },
            {
                topSlot: () => <div class="custom-top-slot">Top</div>,
                bottomSlot: () => <div class="custom-bottom-slot">Bottom</div>,
            }
        );
        expect(getPopup()?.querySelector(`.${dp}-topSlot .custom-top-slot`)).toHaveTextContent('Top');
        expect(getPopup()?.querySelector(`.${dp}-bottomSlot .custom-bottom-slot`)).toHaveTextContent('Bottom');
    });

    it('#date 插槽', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false }, { date: ({ dayNumber }) => <span class="custom-day">{String(dayNumber)}</span> });
        expect(document.querySelectorAll('.custom-day')).toHaveLength(30);
        expect(getDay('2019-09-08').querySelector('.custom-day')).toHaveTextContent('8');
    });

    it('#fullDate 插槽', async () => {
        await renderPicker(
            { defaultValue: baseDate, defaultOpen: true, motion: false },
            {
                fullDate: ({ dayNumber, dayStatus }) => <div class={['custom-full-day', { 'is-selected': (dayStatus as { isSelected: boolean }).isSelected }]}>{String(dayNumber)}</div>,
            }
        );
        expect(document.querySelectorAll('.custom-full-day')).toHaveLength(30);
        expect(getDay('2019-09-08')).not.toHaveClass(`${dp}-day-selected`);
        expect(getDay('2019-09-08').querySelector('.custom-full-day')).toHaveClass('is-selected');
    });

    it('dateRange 悬停效果', async () => {
        await renderPicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-08-01', motion: false });

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
        await renderPicker({ defaultOpen: true, defaultPickerValue: '2020-01-01', motion: false });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getSelectedDays()).toEqual([]);
    });

    it('Date 形式的 defaultPickerValue', async () => {
        const view = await renderPicker({ defaultOpen: true, defaultPickerValue: new Date(2020, 0, 1), motion: false });
        expect(getNavTitle('left')).toBe('2020年 1月');
        await view.rerender({ defaultPickerValue: new Date(2021, 4, 1) });
        expect(getNavTitle('left')).toBe('2021年 5月');
    });

    it('dateRange 的 defaultPickerValue', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: ['2020-01-01', '2020-02-01'],
            motion: false,
        });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getNavTitle('right')).toBe('2020年 2月');
    });

    it('dateTime 的 disabledTime 属性', async () => {
        const disabledTime = () => ({
            disabledHours: () => [0, 1, 2, 3, 4, 5],
            disabledMinutes: () => [],
            disabledSeconds: () => [],
        });
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            disabledTime,
            motion: false,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [hourList] = (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        const disabledHours = new Set(Array.from(hourList.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent));
        expect([...disabledHours]).toEqual(['00', '01', '02', '03', '04', '05']);
    });

    it('weekStartsOn 属性', async () => {
        await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false, weekStartsOn: 1 });
        const weekdays = screen.getAllByRole('columnheader').map((header) => header.textContent);
        expect(weekdays).toEqual(['一', '二', '三', '四', '五', '六', '日']);
        // 2019-09-01 is a Sunday, the last column of the first week
        expect(getWeekDays('left', 0)[6]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('dateTime 与 needConfirm 的 confirm', async () => {
        const onConfirm = vi.fn<EmitFn<'confirm'>>();
        const onCancel = vi.fn<EmitFn<'cancel'>>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onCancel,
            onConfirm,
        });

        const [cancelBtn, confirmBtn] = getFooterButtons();
        expect(cancelBtn).toHaveTextContent('取消');
        expect(confirmBtn).toHaveTextContent('确定');
        await userEvent.click(confirmBtn);
        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0]).toEqual([baseDate, format(baseDate, strings.FORMAT_DATE_TIME)]);
        await waitForClosed();
    });

    it('输入框按 Enter 完成选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ motion: false, onChange });

        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-08-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('2021-08-15');
    });

    it('时间戳形式的 value', async () => {
        const { container } = await renderPicker({ defaultValue: new Date(2021, 7, 15).getTime(), motion: false });

        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('字符串形式的 value', async () => {
        const { container } = await renderPicker({ defaultValue: '2021-08-15', motion: false });

        expect(container.querySelector('input')).toHaveValue('2021-08-15');
    });

    it('范围输入框清空', async () => {
        const onClear = vi.fn<EmitFn<'clear'>>();
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 7, 1), new Date(2021, 7, 15)],
            motion: false,
            onChange,
            onClear,
        });

        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('范围输入框按 Enter', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'dateRange', defaultOpen: true, motion: false, onChange });

        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(startInput, '2021-08-01');
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(endInput, '2021-08-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 7, 1), new Date(2021, 7, 15)], ['2021-08-01', '2021-08-15']);
        await userEvent.type(startInput, '{Enter}');
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('范围输入框按 Tab', async () => {
        const { container } = await renderPicker({ type: 'dateRange', defaultOpen: true, motion: false });

        const [, endInput] = container.querySelectorAll('input');
        endInput.focus();
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await fireEvent.keyDown(endInput, { key: 'Tab' });
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('month 类型 yearAndMonth 与 noBackBtn', async () => {
        await renderPicker({ type: 'month', defaultValue: new Date(2021, 5), defaultOpen: true, motion: false });
        expect(getYMLists()).toHaveLength(2);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
    });

    it('自定义 format 字符串', async () => {
        const { container } = await renderPicker({
            defaultValue: new Date(2021, 7, 15),
            format: 'dd/MM/yyyy',
            motion: false,
        });

        expect(container.querySelector('input')).toHaveValue('15/08/2021');
    });

    it('dateRange 与 presets', async () => {
        const presets = [{ text: 'This Week', start: startOfWeek(new Date(baseDate)), end: endOfWeek(new Date(baseDate)) }];
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            motion: false,
            presets,
            onChange,
        });

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2019-09-08', '2019-09-14']);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2019-09-08');
        expect(endInput).toHaveValue('2019-09-14');
        await waitForClosed();
    });

    it('month 类型与 presets', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'month',
            defaultOpen: true,
            motion: false,
            presets: [{ text: 'Jan', start: new Date(2021, 0) }],
            onChange,
        });

        await userEvent.click(getPresetButtons()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-01');
        expect(container.querySelector('input')).toHaveValue('2021-01');
    });

    it('dateTimeRange 的 needConfirm', async () => {
        const onConfirm = vi.fn<EmitFn<'confirm'>>();
        const onCancel = vi.fn<EmitFn<'cancel'>>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 7, 1, 10, 0), new Date(2021, 7, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onCancel,
            onConfirm,
        });
        const [cancelBtn, confirmBtn] = getFooterButtons();
        expect(cancelBtn).toBeEnabled();
        expect(confirmBtn).toBeEnabled();
        await userEvent.click(confirmBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0][1]).toEqual(['2021-08-01 10:00:00', '2021-08-15 18:00:00']);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('timePickerOpts', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            timePickerOpts: { use12Hours: true },
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPopup()?.querySelectorAll(`.${dp}-tpk ul[role="listbox"]`)).toHaveLength(4);
    });

    it('timePickerOpts.use12Hours 下上午的时间点小时仍保持在上午', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            timePickerOpts: { use12Hours: true },
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [ampmList, hourList] = (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        expect(within(ampmList).getAllByRole('option')[0]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(
            within(hourList)
                .getAllByRole('option')
                .find((li) => li.textContent?.startsWith('09')) as HTMLElement
        );
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(9);
    });

    it('timePickerOpts.use12Hours 下下午的时间点小时仍保持在下午', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: new Date(2019, 8, 8, 15, 8, 8),
            defaultOpen: true,
            motion: false,
            timePickerOpts: { use12Hours: true },
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [ampmList, hourList] = (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        expect(within(ampmList).getAllByRole('option')[1]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await userEvent.click(
            within(hourList)
                .getAllByRole('option')
                .find((li) => li.textContent?.startsWith('04')) as HTMLElement
        );
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(16);
    });

    it('month 类型的 startYear 与 endYear', async () => {
        await renderPicker({ type: 'month', defaultOpen: true, endYear: 2025, motion: false, startYear: 2020 });
        const years = within(getYMLists()[0])
            .getAllByRole('option')
            .map((option) => option.textContent?.replace('年', ''));
        expect(years).toEqual(['2020', '2021', '2022', '2023', '2024', '2025']);
    });

    it('month 类型 yearAndMonth 面板渲染与年月选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'month',
            defaultValue: new Date(2021, 5),
            defaultOpen: true,
            motion: false,
            onChange,
        });
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
        await renderPicker({
            type: 'monthRange',
            defaultValue: [new Date(2021, 2), new Date(2021, 8)],
            defaultOpen: true,
            motion: false,
        });
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-body`)).not.toBeNull();
        expect(getYMLists()).toHaveLength(4);
        expect(getYMSelected()).toEqual(['2021年', '3月', '2021年', '9月']);
    });

    it('YearAndMonth 选择年份', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2023, right: 2022 },
            currentMonth: { left: 6, right: 7 },
        });
    });

    it('YearAndMonth 选择月份', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({ onSelect });
        await userEvent.click(within(getYMLists()[1]).getByRole('option', { name: 'March' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2021, right: 2022 },
            currentMonth: { left: 3, right: 7 },
        });
    });

    it('YearAndMonth selectYear 在 monthRange 中 left 大于 right 时调整 right', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({ onSelect, type: 'monthRange' });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2025' }));
        expect(onSelect).toHaveBeenCalledWith({
            currentYear: { left: 2025, right: 2026 },
            currentMonth: { left: 6, right: 7 },
        });
    });

    it('YearAndMonth selectYear 在 monthRange 中 right 同年时拒绝非法日期', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({
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
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({
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

    it('YearAndMonth 键盘返回主面板', async () => {
        const onBackToMain = vi.fn<YearAndMonthEmitFn<'backToMain'>>();
        await renderYearAndMonth({ onBackToMain });
        screen.getByRole('button', { name: 'Select Date' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 noBackBtn', async () => {
        const { container } = await renderYearAndMonth({ noBackBtn: true });
        expect(container.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('YearAndMonth 的年、月文案来自语言包', async () => {
        await renderYearAndMonth({ locale: zh_CN.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        expect(within(getYMLists()[1]).getByRole('option', { name: '7月' })).toBeInTheDocument();
    });

    it('YearAndMonth 在 ja_JP 下显示语言包的年后缀和月份名', async () => {
        await renderYearAndMonth({ locale: ja_JP.DatePicker });
        expect(getYMSelected()).toEqual(['2021年', ja_JP.DatePicker.fullMonths[6]]);
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022' })).toBeInTheDocument();
    });

    it('YearAndMonth 的 compact 密度', async () => {
        await renderYearAndMonth({ density: 'compact' });
        expect(screen.getByRole('button', { name: 'Select Date' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-size-small`);
    });

    it('YearAndMonth 的 presetPosition 为 left', async () => {
        await renderYearAndMonth(
            { presetPosition: 'left' },
            {
                quickControls: () => <div data-testid="quick">Quick</div>,
                dateInput: () => <div data-testid="date-input">DateInput</div>,
            }
        );
        const quick = screen.getByTestId('quick');
        expect(screen.getByTestId('date-input')).toBeInTheDocument();
        expect(quick.compareDocumentPosition(getYMLists()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('YearAndMonth 的 presetPosition 为 right', async () => {
        await renderYearAndMonth({ presetPosition: 'right' }, { quickControls: () => <div data-testid="quick">Quick</div> });
        const quick = screen.getByTestId('quick');
        expect(quick.compareDocumentPosition(getYMLists()[1]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('YearAndMonth 的 autoSelectMonth 与 disabledDate', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({
            onSelect,
            type: 'monthRange',
            currentMonth: { left: 1, right: 7 },
            disabledDate: (date: Date) => date.getMonth() === 0,
        });
        expect(within(getYMLists()[1]).getByRole('option', { name: 'January' })).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(onSelect).toHaveBeenLastCalledWith({
            currentYear: { left: 2021, right: 2022 },
            currentMonth: { left: 2, right: 7 },
        });
    });

    it('YearAndMonth 随 currentYear 与 currentMonth 更新年月', async () => {
        const view = await renderYearAndMonth();
        expect(getYMSelected()).toEqual(['2021', 'June']);
        await view.rerender({ currentMonth: { left: 3, right: 9 }, currentYear: { left: 2023, right: 2024 } });
        await settle();
        expect(getYMSelected()).toEqual(['2023', 'March']);
    });

    it('YearAndMonth 点击返回主面板按钮', async () => {
        const onBackToMain = vi.fn<YearAndMonthEmitFn<'backToMain'>>();
        await renderYearAndMonth({ onBackToMain, noBackBtn: false });
        await userEvent.click(screen.getByRole('button', { name: 'Select Date' }));
        expect(onBackToMain).toHaveBeenCalledTimes(1);
    });

    it('YearAndMonth 与 disabledDate，右侧面板年份禁用', async () => {
        await renderYearAndMonth({ type: 'monthRange', disabledDate: () => false });
        const rightYears = getYMLists()[2];
        expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
        expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        expect(getYMLists()[3].querySelectorAll('li[aria-disabled="true"]')).toHaveLength(0);
    });

    it('DateInput 键入日期触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false, onChange });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-06-15');
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
    });

    it('DateInput 按 Enter 处理回车', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-1');
        expect(input).toHaveValue('2021-06-1');
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue(ymd(baseDate));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('范围输入框聚焦时发 focus', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onFocus,
        });
        container.querySelectorAll('input')[0].focus();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('范围输入框按 Enter 补全无法解析的输入', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(startInput, '2021-06-0');
        expect(startInput).toHaveValue('2021-06-0');
        await userEvent.type(startInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('结束输入框按 Tab', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        const endInput = container.querySelectorAll('input')[1];
        endInput.focus();
        await settle();
        await fireEvent.keyDown(endInput, { key: 'Tab' });
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
        expect(getPopup()).not.toBeNull();
    });

    it('不同类型下 DateInput 的显示文本', async () => {
        const { container: dateContainer } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            motion: false,
        });
        expect(dateContainer.querySelector('input')).toHaveValue('2019-09-08');

        const { container: dateTimeContainer } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            motion: false,
        });
        expect(dateTimeContainer.querySelector('input')).toHaveValue('2019-09-08 08:08:08');

        const { container: monthContainer } = await renderPicker({
            type: 'month',
            defaultValue: new Date(2021, 3),
            defaultOpen: true,
            motion: false,
        });
        expect(monthContainer.querySelector('input')).toHaveValue('2021-04');
    });

    it('dateTime 类型的 insetInput 渲染日期与时间输入框', async () => {
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const popup = getPopup() as HTMLElement;
        expect(within(popup).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
        expect(within(popup).getByPlaceholderText('HH:mm:ss')).toHaveValue('08:08:08');
        expect(popup.querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(2);
        expect(container.querySelector('input')).toHaveAttribute('readonly');
    });

    it('dateTime 类型的 insetInput 的 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2021-06-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-06-15 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2021-06-15 08:08:08');
    });

    it('12 小时制 format 的 insetInput 改日期后保留下午的时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: new Date(2021, 0, 1, 15, 30),
            defaultOpen: true,
            format: 'yyyy-MM-dd hh:mm a',
            insetInput: true,
            motion: false,
            onChange,
        });
        const [dateInput, timeInput] = (getPopup() as HTMLElement).querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(timeInput).toHaveValue('15:30');
        await typeInto(dateInput, '2021-06-15');
        // the default locale is zh_CN, whose day period is 下午
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 15, 30), '2021-06-15 03:30 下午');
    });

    it('dateTimeRange 类型的 insetInput', async () => {
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const popup = getPopup() as HTMLElement;
        const dateInputs = within(popup).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        const timeInputs = within(popup).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        timeInputs.forEach((input) => expect(input).toBeEnabled());
        const insetInputs = popup.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2021-06-01', '10:00:00', '2021-06-15', '18:00:00']);
    });

    it('dateRange 类型的 insetInput', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const popup = getPopup() as HTMLElement;
        const dateInputs = within(popup).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(within(popup).queryByPlaceholderText('HH:mm:ss')).toBeNull();
        expect(popup.querySelector(`.${dp}-inset-input-separator`)).toHaveTextContent('-');
        container.querySelectorAll('input').forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('点击输入框打开、点击外部关闭', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false, onOpenChange });
        await userEvent.click(container.querySelector('input') as HTMLElement);
        await settle();
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        expect(getPopup()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitForClosed();
    });

    it('键入合法日期后按 Enter', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.clear(input);
        await userEvent.type(input, '2021-06-15{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(input).toHaveValue('2021-06-15');
    });

    it('输入为空时按 Enter 使用当前日期', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.type(input, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue(ymd(new Date()));
    });

    it('范围类型输入为空时按 Enter', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'dateRange', motion: false, onChange });
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.type(startInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual([ymd(new Date()), ymd(new Date())]);
        expect(startInput).toHaveValue(ymd(new Date()));
        expect(endInput).toHaveValue(ymd(new Date()));
    });

    it('dateRange 类型解析键入的结束日期', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onChange,
        });
        await typeInto(container.querySelectorAll('input')[1], '2021-06-20');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 20)], ['2021-06-01', '2021-06-20']);
    });

    it('dateTime 类型解析键入的文本', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'dateTime', defaultValue: baseDate, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-15 10:30:00');
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 10, 30), '2021-06-15 10:30:00');
        await typeInto(input, '2021-06-16');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('month 类型解析键入的文本', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'month',
            defaultValue: new Date(2021, 5),
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-08');
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 7), '2021-08');
        expect(getYMSelected()).toEqual(['2021年', '8月']);
    });

    it('范围只有一端时的显示文本', async () => {
        const full = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
        });
        let [startInput, endInput] = full.container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        full.unmount();

        const startOnly = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        [startInput, endInput] = startOnly.container.querySelectorAll('input');
        startInput.focus();
        await settle();
        await userEvent.click(getDay('2021-06-01'));
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('');
        startOnly.unmount();
        await waitForClosed();

        const endOnly = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        [startInput, endInput] = endOnly.container.querySelectorAll('input');
        endInput.focus();
        await settle();
        await userEvent.click(getDay('2021-06-15'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('多选的显示文本', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            multiple: true,
            motion: false,
        });
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15');
    });

    it('受控范围的清除按钮', async () => {
        const onChange = vi.fn<ChangeFn>();
        const onClear = vi.fn<EmitFn<'clear'>>();
        const { container } = await renderPicker({
            type: 'dateRange',
            modelValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onChange,
            onClear,
        });
        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('date 类型点击预设', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultOpen: true,
            motion: false,
            presets: [{ text: 'Today', start: new Date() }],
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue(ymd(new Date()));
        await waitForClosed();
    });

    it('函数形式的预设值', async () => {
        const onChange = vi.fn<ChangeFn>();
        const start = vi.fn<() => Date>(() => new Date(2021, 5, 1));
        const { container } = await renderPicker({
            type: 'date',
            defaultOpen: true,
            motion: false,
            presets: [{ text: 'Lazy', start }],
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: 'Lazy' }));
        expect(start).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 1), '2021-06-01');
        expect(container.querySelector('input')).toHaveValue('2021-06-01');
    });

    it('needConfirm 的确定按钮提交范围', async () => {
        const onConfirm = vi.fn<EmitFn<'confirm'>>();
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onConfirm,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        startInput.focus();
        await settle();
        await userEvent.click(getDay('2021-06-03'));
        endInput.focus();
        await settle();
        await userEvent.click(getDay('2021-06-10'));
        expect(getFooterButtons()[1]).toBeEnabled();
        expect(onConfirm).not.toHaveBeenCalled();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect((onConfirm.mock.calls[0][1] as string[]).map((v) => v.slice(0, 10))).toEqual(['2021-06-03', '2021-06-10']);
        await waitForClosed();
        expect(startInput.value.startsWith('2021-06-03')).toBe(true);
        expect(endInput.value.startsWith('2021-06-10')).toBe(true);
    });

    it('needConfirm 的取消按钮保留原值', async () => {
        const onCancel = vi.fn<EmitFn<'cancel'>>();
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onCancel,
        });
        await userEvent.click(getDay(ymd(addDays(baseDate, 2))));
        await userEvent.click(getFooterButtons()[0]);
        expect(onCancel).toHaveBeenCalledWith(baseDate, format(baseDate, strings.FORMAT_DATE_TIME));
        expect(container.querySelector('input')).toHaveValue(format(baseDate, strings.FORMAT_DATE_TIME));
        await waitForClosed();
    });

    it('解析各种形式的值', async () => {
        const inputValueOf = async (defaultValue: unknown) => {
            const view = await renderPicker({ defaultValue, motion: false });
            const value = (view.container.querySelector('input') as HTMLInputElement).value;
            view.unmount();
            return value;
        };
        expect(await inputValueOf(new Date(2021, 5, 1))).toBe('2021-06-01');
        expect(await inputValueOf('2021-06-01')).toBe('2021-06-01');
        expect(await inputValueOf(new Date(2021, 5, 1).getTime())).toBe('2021-06-01');
        expect(await inputValueOf(null)).toBe('');
        // a plain object is deliberately not a valid value. An error handler takes the error: rethrown out of
        // setup it would skip Vue's reset of the current instance and break the later mounts.
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const container = document.body.appendChild(document.createElement('div'));
        const app = createApp(DatePicker, { defaultValue: {}, motion: false });
        const onError = vi.fn<(error: unknown) => void>();
        app.config.errorHandler = onError;
        app.mount(container);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(TypeError);
        app.unmount();
        container.remove();
        consoleWarn.mockRestore();
    });

    it('点击范围触发器的空白处打开面板并聚焦开始输入框', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onOpenChange,
        });
        await userEvent.click(container.querySelector(`.${dp}-range-input`) as HTMLElement);
        await settle();
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(container.querySelectorAll('input')[0]).toHaveFocus());
    });

    it('禁用时点击范围触发器不打开', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const { container } = await renderPicker({ type: 'dateRange', disabled: true, motion: false, onOpenChange });
        await fireEvent.click(container.querySelector(`.${dp}-range-input`) as HTMLElement);
        await settle();
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });

    it('monthRange 类型选择年月', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'monthRange',
            defaultValue: [new Date(2021, 2), new Date(2021, 8)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const [, leftMonths, , rightMonths] = getYMLists();
        await userEvent.click(within(rightMonths).getByRole('option', { name: '10月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 2), new Date(2021, 9)], ['2021-03', '2021-10']);
        await userEvent.click(within(leftMonths).getByRole('option', { name: '2月' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 1), new Date(2021, 9)], ['2021-02', '2021-10']);
        expect(container.querySelector('input')).toHaveValue('2021-02 ~ 2021-10');
    });

    it('回调参数按 timeZone 换算', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            motion: false,
            timeZone: 'Asia/Tokyo',
            onChange,
        });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-06-10');
        const [date, dateString] = onChange.mock.calls[0] as [Date, string];
        expect(date).toEqual(zonedTimeToUtc(new Date(2021, 5, 10), 'Asia/Tokyo'));
        expect(dateString).toBe(format(date, 'yyyy-MM-dd'));
    });

    it('多选的回调参数', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultValue: [new Date(2021, 5, 1)],
            multiple: true,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
    });

    it('dateRange 的回调参数', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            onChange,
        });
        await typeInto(container.querySelectorAll('input')[0], '2021-06-02');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 2), new Date(2021, 5, 15)], ['2021-06-02', '2021-06-15']);
    });

    it('needConfirm 下新的 modelValue 同时更新输入框与待选值', async () => {
        const props = { type: 'dateTime', needConfirm: true, motion: false, defaultOpen: true };
        const view = await renderPicker({ ...props, modelValue: baseDate });
        await view.rerender({ ...props, modelValue: new Date(2021, 5, 15, 10, 30) });
        expect(view.container.querySelector('input')).toHaveValue('2021-06-15 10:30:00');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
    });

    it('合法时区下原样显示', async () => {
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            motion: false,
            timeZone: 'Asia/Shanghai',
        });
        // the tests run in Asia/Shanghai, so the value is shown unchanged
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('切换 timeZone 时按上一个时区换算', async () => {
        const props = { type: 'dateTime', defaultValue: baseDate, motion: false };
        const view = await renderPicker({ ...props, timeZone: 'Asia/Shanghai' });
        await view.rerender({ ...props, timeZone: 'Asia/Tokyo' });
        expect(view.container.querySelector('input')).toHaveValue('2019-09-08 09:08:08');
    });

    it('insetInput 打开面板时禁用触发器输入框', async () => {
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            insetInput: true,
            motion: false,
        });
        const triggerInput = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(triggerInput);
        await settle();
        expect(getPopup()).not.toBeNull();
        await waitFor(() => expect(triggerInput).toBeDisabled());
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(triggerInput).toBeEnabled());
    });

    it('#trigger 且值为空时 rangeInputFocus 从 rangeStart 开始', async () => {
        await renderPicker({ type: 'dateRange', defaultValue: [], motion: false }, { trigger: ({ rangeInputFocus }) => <div data-testid="trigger">{String(rangeInputFocus)}</div> });
        expect(screen.getByTestId('trigger')).toHaveTextContent('rangeStart');
    });

    it('范围类型 #trigger 点击后 rangeInputFocus 为 rangeStart', async () => {
        const { container } = await renderPicker({ type: 'dateRange', motion: false }, { trigger: ({ rangeInputFocus }) => <div class="custom-trigger">{String(rangeInputFocus)}</div> });
        const trigger = container.querySelector('.custom-trigger') as HTMLElement;
        expect(trigger).toHaveTextContent('undefined');
        await userEvent.click(trigger);
        await settle();
        expect(getPopup()).not.toBeNull();
        expect(trigger).toHaveTextContent('rangeStart');
    });

    it('键入一半的范围已高亮合法的一端', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        await typeInto(container.querySelectorAll('input')[0], '2021-06-01');
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(document.querySelector(`.${dp}-day-selected-end`)).toBeNull();
    });

    it('date 类型宽松解析键入的文本', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-15');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
        await typeInto(input, 'invalid');
        expect(getSelectedDays()).toEqual([]);
        await typeInto(input, '');
        expect(getSelectedDays()).toEqual([]);
    });

    it('dateRange 类型宽松解析键入的文本', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(startInput, '2021-06-01');
        await typeInto(endInput, '2021-06-15');
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('多选解析键入的文本', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'date', multiple: true, motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-01,2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        await typeInto(input, 'invalid,2021-06-15');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('invalid,2021-06-15');
    });

    it('多选键入超过 max 时不通知', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'date', max: 1, multiple: true, motion: false, onChange });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-06-01,2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选输入按 Enter 时去除重复日期', async () => {
        const { container } = await renderPicker({ type: 'date', multiple: true, motion: false });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-01,2021-06-15,2021-06-01');
        await userEvent.type(input, '{Enter}');
        expect(input).toHaveValue('2021-06-01,2021-06-15');
    });

    it('多选宽松解析键入一半的列表', async () => {
        const { container } = await renderPicker({
            type: 'date',
            multiple: true,
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
        });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2021-06-01,2021-06-1');
        expect(getSelectedDays()).toEqual(['2021-06-01']);
    });

    it('多选的 insetInput 按内嵌格式解析输入', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            multiple: true,
            defaultOpen: true,
            format: 'yyyy-MM-dd EEEE',
            insetInput: true,
            motion: false,
            onChange,
        });
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2021-06-01,2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01 星期二', '2021-06-15 星期二']);
    });

    it('multiple 只对 date 生效，dateTime 忽略 multiple 按单选交出值', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            multiple: true,
            defaultOpen: true,
            defaultPickerValue: new Date(2021, 5, 1, 10, 0, 0),
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 15, 10, 0, 0), '2021-06-15 10:00:00');
    });

    it('范围类型键入时 disabledDate 收到所查的范围', async () => {
        const disabledDate = vi.fn<(date: Date, options?: unknown) => boolean>(() => false);
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            disabledDate,
            motion: false,
            onChange,
        });
        await typeInto(container.querySelectorAll('input')[1], '2021-06-10');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(disabledDate).toHaveBeenCalledWith(new Date(2021, 5, 10), expect.objectContaining({ rangeStart: '2021-06-01', rangeEnd: '2021-06-10' }));
    });

    it('disabledDate 收到 Date 对象', async () => {
        const disabledDate = vi.fn<(date: Date) => boolean>((date) => date.getDate() === 10);
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, disabledDate, motion: false });
        expect(disabledDate.mock.calls.every(([date]) => date instanceof Date)).toBe(true);
        expect(getDay('2019-09-10')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-11')).toHaveAttribute('aria-disabled', 'false');
    });

    it('点击年月标题显示年份选择器', async () => {
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'none');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-panel-yearandmonth-open-type', 'left');
        expect(getPanel('left')).toHaveClass(`${dp}-yam-showing`);
        expect(getPanel('left').querySelector(`.${dp}-month`)).toBeNull();
    });

    it('dateRange 类型显示两个面板', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
        });
        expect(getPopup()?.querySelectorAll(`.${dp}-month`)).toHaveLength(2);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
    });

    it('面板的上一年与下一年按钮', async () => {
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevYear }));
        expect(getNavTitle('left')).toBe('2018年 9月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        expect(getNavTitle('left')).toBe('2020年 9月');
    });

    it('受控 modelValue 更新', async () => {
        const view = await renderPicker({ modelValue: baseDate, motion: false });
        expect(screen.getByRole('combobox')).toHaveValue(ymd(baseDate));
        await view.rerender({ modelValue: new Date(2022, 0, 1) });
        expect(screen.getByRole('combobox')).toHaveValue('2022-01-01');
    });

    it('受控 open', async () => {
        const open = ref(false);
        await renderNode(() => (
            <>
                <DatePicker defaultValue={baseDate} motion={false} open={open.value} onUpdate:open={(next: boolean) => (open.value = next)} />
                <button onClick={() => (open.value = true)}>Open</button>
                <button onClick={() => (open.value = false)}>Close</button>
            </>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await settle();
        expect(getPopup()).not.toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        await waitForClosed();
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await settle();
        expect(getPopup()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitForClosed();
        expect(open.value).toBe(false);
    });

    it('disabledTime', async () => {
        const disabledTime = () => ({
            disabledHours: () => [0, 1, 2, 3],
            disabledMinutes: () => [0, 15, 30, 45],
            disabledSeconds: () => [0],
        });
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            disabledTime,
            motion: false,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const disabledTexts = (list: Element) => [...new Set(Array.from(list.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent))];
        const [hours, minutes, seconds] = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk ul[role="listbox"]`);
        expect(disabledTexts(hours)).toEqual(['00', '01', '02', '03']);
        expect(disabledTexts(minutes)).toEqual(['00', '15', '30', '45']);
        expect(disabledTexts(seconds)).toEqual(['00']);
    });

    it('expose 的 focus 与 blur', async () => {
        const picker = ref<DatePickerHandle>();
        const { container } = await renderNode(() => <DatePicker ref={picker} type="date" defaultValue={baseDate} motion={false} />);
        const input = container.querySelector('input');
        picker.value?.focus();
        await settle();
        expect(input).toHaveFocus();
        picker.value?.blur();
        await settle();
        expect(input).not.toHaveFocus();
    });

    it('范围类型 expose 的 focus 与 blur', async () => {
        const picker = ref<DatePickerHandle>();
        const { container } = await renderNode(() => <DatePicker ref={picker} type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        picker.value?.focus('rangeStart');
        await settle();
        expect(startInput).toHaveFocus();
        picker.value?.blur();
        await settle();
        expect(startInput).not.toHaveFocus();
        picker.value?.focus('rangeEnd');
        await settle();
        expect(endInput).toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        picker.value?.blur();
        await settle();
        expect(endInput).not.toHaveFocus();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('范围类型在两个输入框间移动不是新的 focus', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const { container } = await renderPicker({ type: 'dateRange', motion: false, onFocus });
        const [startInput, endInput] = container.querySelectorAll('input');
        startInput.focus();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBe('rangeStart');
        endInput.focus();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('结束输入框按 Tab 离开范围', async () => {
        const { container } = await renderPicker({ type: 'dateRange', motion: false });
        const endInput = container.querySelectorAll('input')[1];
        endInput.focus();
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.tab();
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('多选达到 max 上限', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            max: 2,
            multiple: true,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-15']);
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1)], ['2021-06-01']);
        await userEvent.click(getDay('2021-06-20'));
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-20']);
    });

    it('format 与 locale', async () => {
        const { container } = await renderNode(() => <LocaleProvider locale={en_US}>{() => <DatePicker defaultValue={baseDate} format="MM/dd/yyyy" motion={false} />}</LocaleProvider>);
        expect(container.querySelector('input')).toHaveValue('09/08/2019');
    });

    it('dateRange 只选一端时不通知也不关闭', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(container.querySelectorAll('input')[0]).toHaveValue('2021-06-01');
    });

    it('insetInput 显示选中的日期', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultPickerValue: '2021-06-01',
            insetInput: true,
            motion: false,
            open: true,
            onChange,
        });
        const insetInput = within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd');
        expect(insetInput).toHaveValue('');
        await userEvent.click(getDay('2021-06-15'));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(insetInput).toHaveValue('2021-06-15');
    });

    it('受控时预设只通知不改值', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            modelValue: baseDate,
            defaultOpen: true,
            motion: false,
            presets: [{ text: 'Preset', start: new Date(2021, 5, 15) }],
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: 'Preset' }));
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15), '2021-06-15');
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('切到下一月时发一次 panelChange', async () => {
        const onPanelChange = vi.fn<EmitFn<'panelChange'>>();
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onPanelChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toBe('2019-10-08');
    });

    it('dateTime 的 insetInput 占位符随 format', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            format: 'yyyy/MM/dd HH:mm',
            insetInput: true,
            motion: false,
        });
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy/MM/dd')).toHaveValue('2019/09/08');
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('HH:mm')).toHaveValue('08:08');
    });

    it('date 的 insetInput 占位符', async () => {
        await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const insetInputs = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM-dd');
    });

    it('dateTime 的 insetInput 合并日期与时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('HH:mm:ss'), '10:30:00');
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 10, 30), '2019-09-08 10:30:00');
    });

    it('insetInput 键入一半的日期不改值', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        const insetInput = within(getPopup() as HTMLElement).getByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        await typeInto(insetInput, '2019-09-1');
        expect(insetInput).toHaveValue('2019-09-1');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('关闭面板后 insetInput 丢弃键入的文本', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2019-09-1');
        await fireEvent.mouseDown(document.body);
        await waitForClosed();
        await userEvent.click(container.querySelector('input') as HTMLElement);
        await settle();
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd')).toHaveValue('2019-09-08');
    });

    it('dateTime 的 insetInput 键入日期后从 defaultPickerValue 补时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultOpen: true,
            defaultPickerValue: new Date(2021, 5, 1, 9, 30, 0),
            insetInput: true,
            motion: false,
            onChange,
        });
        const timeInput = within(getPopup() as HTMLElement).getByPlaceholderText('HH:mm:ss');
        expect(timeInput).toBeDisabled();
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2021-06-15');
        expect(timeInput).toHaveValue('09:30:00');
        expect(timeInput).toBeEnabled();
        expect(onChange).toHaveBeenCalledWith(new Date(2021, 5, 15, 9, 30), '2021-06-15 09:30:00');
    });

    it('dateTimeRange 的 insetInput 两侧各自从 defaultPickerValue 补时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultOpen: true,
            defaultPickerValue: [new Date(2021, 5, 1, 10, 0, 0), new Date(2021, 6, 1, 18, 0, 0)],
            insetInput: true,
            motion: false,
            onChange,
        });
        const [startDate, endDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText('yyyy-MM-dd');
        await typeInto(startDate as HTMLInputElement, '2021-06-01');
        await typeInto(endDate as HTMLInputElement, '2021-06-20');
        const timeInputs = within(getPopup() as HTMLElement).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('dateRange 的 insetInput 两端都键入后通知', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        const [startDate, endDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText('yyyy-MM-dd');
        await typeInto(startDate as HTMLInputElement, '2021-06-01');
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(endDate as HTMLInputElement, '2021-06-15');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 15)], ['2021-06-01', '2021-06-15']);
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('dateTimeRange 的 insetInput 修改结束时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        const [, endTime] = within(getPopup() as HTMLElement).getAllByPlaceholderText('HH:mm:ss');
        await typeInto(endTime as HTMLInputElement, '20:00:00');
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);
    });

    it('monthRange 的 insetInput 占位符', async () => {
        await renderPicker({ type: 'monthRange', defaultOpen: true, insetInput: true, motion: false });
        const insetInputs = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(insetInputs[0]).toHaveAttribute('placeholder', 'yyyy-MM ~ yyyy-MM');
    });

    it('dateRange 按 format 显示', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            format: 'yyyy/MM/dd',
            motion: false,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021/06/01');
        expect(endInput).toHaveValue('2021/06/15');
    });

    it('monthRange 的显示文本', async () => {
        const { container } = await renderPicker({
            type: 'monthRange',
            defaultValue: [new Date(2021, 2), new Date(2021, 8)],
            motion: false,
        });
        expect(container.querySelectorAll('input')).toHaveLength(1);
        expect(container.querySelector('input')).toHaveValue('2021-03 ~ 2021-09');
    });

    it('范围触发器的后缀与分隔符', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            rangeSeparator: ' - ',
        });
        const separator = container.querySelector(`.${dp}-range-input-separator`);
        expect(separator).toHaveTextContent('-');
        expect(separator).toHaveClass(`${dp}-range-input-separator-active`);
        expect(container.querySelector(`.${dp}-range-input-suffix svg`)).not.toBeNull();
    });

    it('DateInput 的 inputReadOnly', async () => {
        const { container } = await renderPicker({ defaultValue: baseDate, inputReadOnly: true, motion: false });
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        expect(container.querySelector(`.${dp}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            defaultValue: baseDate,
            inputReadOnly: true,
            showClear: true,
            motion: false,
            onChange,
        });
        expect(container.querySelector('input')).toHaveAttribute('readonly');
        await userEvent.hover(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement);
        await fireEvent.mouseDown(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('范围选择的 inputReadOnly 锁定两个输入框', async () => {
        const { container } = await renderPicker({ type: 'dateRange', inputReadOnly: true, motion: false });
        const inputs = container.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        inputs.forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('DateInput 的 #prefix', async () => {
        const { container } = await renderPicker({ defaultValue: baseDate, motion: false }, { prefix: () => <span class="test-prefix">Prefix</span> });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix .test-prefix`)).toHaveTextContent('Prefix');
    });

    it('切换时间面板与日期面板', async () => {
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false });
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

    it('disabledTimePicker 时时间面板不打开', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            disabledTimePicker: true,
            motion: false,
        });
        const switchTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(switchTime).toHaveClass(`${dp}-switch-time-disabled`);
        await userEvent.click(switchTime);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPopup()?.querySelector(`.${dp}-tpk`)).toBeNull();
    });

    it('dateTimeRange 无聚焦输入框时点击日期替换开始并保留时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        expect(container.querySelectorAll('input')[0]).toHaveValue('2021-06-10 10:00:00');
    });

    const getHourList = (root: ParentNode = getPopup() as HTMLElement) => root.querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`)[0];

    it('dateTime 选择小时', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        await userEvent.click(within(getHourList()).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 选择小时时 change 只触发一次，带有值时的毫秒', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        await userEvent.click(within(getHourList()).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 无值时选择小时 change 只触发一次，且不带旧时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ type: 'dateTime', defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        await userEvent.click(within(getHourList()).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(14);
    });

    it('dateTimeRange 两侧分别选择小时', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement);
        await userEvent.click(within(getHourList(getPanel('right'))).getAllByRole('option', { name: '20' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 20)], ['2021-06-01 10:00:00', '2021-06-15 20:00:00']);

        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement);
        await userEvent.click(within(getHourList(getPanel('left'))).getAllByRole('option', { name: '08' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 8), new Date(2021, 5, 15, 20)], ['2021-06-01 08:00:00', '2021-06-15 20:00:00']);
    });

    it('选了开始后悬停预览范围', async () => {
        await renderPicker({ type: 'dateRange', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        await userEvent.click(getDay('2021-06-08'));
        const hoverCls = `${dp}-day-hoverday-around-singleselected`;
        await userEvent.hover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).toHaveClass(hoverCls);
        await userEvent.unhover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).not.toHaveClass(hoverCls);
    });

    it('带 offset 时悬停预览整个范围', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            endDateOffset: (d: Date) => addDays(d, 2),
            motion: false,
            startDateOffset: (d: Date) => addDays(d, -2),
        });
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-hoverday`);
        expect(getDay('2021-06-08')).toHaveClass(`${dp}-day-offsetrange-start`);
        expect(getDay('2021-06-12')).toHaveClass(`${dp}-day-offsetrange-end`);
        expect(getDay('2021-06-09')).toHaveClass(`${dp}-day-inoffsetrange`);
        expect(getDay('2021-06-13')).not.toHaveClass(`${dp}-day-inoffsetrange`);
    });

    it('syncSwitchMonth 下两侧一起切换并一次报告', async () => {
        const onPanelChange = vi.fn<EmitFn<'panelChange'>>();
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
            syncSwitchMonth: true,
            onPanelChange,
        });
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-07-01', '2021-08-15']);
    });

    it('范围选择器切换右面板时 panelChange 报告两侧实际面板日期', async () => {
        const onPanelChange = vi.fn<EmitFn<'panelChange'>>();
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
            onPanelChange,
        });
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toEqual(['2021-06-01', '2021-08-15']);
    });

    it('defaultPickerValue 按 format 解析且数组形式的变化会移动面板', async () => {
        const view = await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '01/02/2021',
            format: 'dd/MM/yyyy',
            motion: false,
        });
        expect(getNavTitle('left')).toBe('2021年 2月');
        expect(getNavTitle('right')).toBe('2021年 3月');
        await view.rerender({ defaultPickerValue: [new Date(2022, 4, 1), new Date(2022, 7, 1)] });
        expect(getNavTitle('left')).toBe('2022年 5月');
        expect(getNavTitle('right')).toBe('2022年 8月');
        await view.rerender({ defaultPickerValue: '10.03.2021', format: 'dd.MM.yyyy' });
        expect(getNavTitle('left')).toBe('2021年 3月');
    });

    it('范围两侧的上一年与下一年', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
        });
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevYear}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2020年 6月');
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextYear}"]`) as HTMLElement);
        expect(getNavTitle('right')).toBe('2022年 7月');
    });

    it('带 offset 时点击选中整个范围', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            endDateOffset: (d: Date) => addDays(d, 2),
            motion: false,
            startDateOffset: (d: Date) => addDays(d, -2),
            onChange,
        });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 8), new Date(2021, 5, 12)], ['2021-06-08', '2021-06-12']);
    });

    it('年月面板选择后返回日期面板', async () => {
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(monthList).getByRole('option', { name: '4月' }));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        await userEvent.click((getPopup() as HTMLElement).querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2023年 4月');
    });

    it('范围两端同月或倒序时调整面板月份', async () => {
        const sameMonth = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
        sameMonth.unmount();
        await waitForClosed();

        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 8, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-09-01')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('时间切换按钮只显示 format 的时间部分', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            format: 'yyyy-MM-dd HH:mm',
            motion: false,
        });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).not.toHaveTextContent('08:08:08');
    });

    it('autoSwitchDate 下切换月份时选中日跟随', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            autoSwitchDate: true,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(ymd(onChange.mock.calls[0][0] as Date)).toBe('2019-10-08');
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08');
        expect(container.querySelector('input')).toHaveValue('2019-10-08');
        expect(getPopup()).not.toBeNull();
    });

    it('日期格渲染与选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(30);
        expect(getDay('2019-09-08')).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 11), '2019-09-11');
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
    });

    it('dateRange 同时选择起止日期后触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2021-06-01'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getDay('2021-06-30'));
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1), new Date(2021, 5, 30)], ['2021-06-01', '2021-06-30']);
    });

    it('dateTimeRange 选择日期后走范围选择流程', async () => {
        const onChange = vi.fn<ChangeFn>();
        const onConfirm = vi.fn<EmitFn<'confirm'>>();
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultOpen: true,
            defaultPickerValue: '2021-06-01',
            motion: false,
            needConfirm: true,
            onChange,
            onConfirm,
        });
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

    it('倒序的范围按顺序高亮', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 15), new Date(2021, 5, 1)],
            defaultOpen: true,
            motion: false,
        });
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-inrange`);
    });

    it('范围左侧的年月面板', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 2), new Date(2021, 8)],
            defaultOpen: true,
            motion: false,
        });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(yearList).getByRole('option', { name: '2023' }));
        expect(getNavTitle('left')).toBe('2023年 3月');
        await userEvent.click(within(monthList).getByRole('option', { name: '6月' }));
        expect(getNavTitle('left')).toBe('2023年 6月');
    });

    it('年月面板的打开侧', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
        });
        const monthGrid = (getPopup() as HTMLElement).querySelector(`.${dp}-month-grid`);
        await userEvent.click(getPanel('right').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'right');
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'both');
    });

    it('dateRange 的 rangeEnd 早于 rangeStart 时重置起始值', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 10), new Date(2021, 5, 20)],
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(endInput);
        await settle();
        expect(getPopup()).not.toBeNull();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-05');
        expect(getDay('2021-06-05')).toHaveClass(`${dp}-day-selected-end`);
        expect(onChange).not.toHaveBeenCalled();
        await waitFor(() => expect(startInput).toHaveFocus());
    });

    it('dateTime 的 insetInput 键入无法解析的日期不改值', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        await typeInto(within(getPopup() as HTMLElement).getByPlaceholderText('yyyy-MM-dd'), '2021-06-1');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue('2019-09-08 08:08:08');
    });

    it('#date 插槽保留日期状态类', async () => {
        await renderPicker(
            { type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false },
            {
                date: ({ dayNumber, fullDate }) => (
                    <span class="custom-day" title={fullDate as string}>
                        {String(dayNumber)}
                    </span>
                ),
            }
        );
        const customDay = getDay('2019-09-08').querySelector('.custom-day');
        expect(customDay).toHaveAttribute('title', '2019-09-08');
        expect(customDay).toHaveTextContent('8');
        expect(getDay('2019-09-08')).toHaveClass(`${dp}-day-selected`);
    });

    it('高亮今天', async () => {
        await renderPicker({ type: 'date', defaultOpen: true, motion: false });
        const today = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-day-today`);
        expect(today).toHaveLength(1);
        expect(today[0]).toHaveAttribute('aria-label', ymd(new Date()));
    });

    it('范围输入框失焦既不补全也不重置', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const [startInput] = container.querySelectorAll('input');
        await typeInto(startInput, '2021-06-0');
        await fireEvent.focusOut(startInput);
        await settle();
        expect(startInput).toHaveValue('2021-06-0');
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('输入框失焦不发 blur', async () => {
        const onBlur = vi.fn<EmitFn<'blur'>>();
        const { container } = await renderPicker({ type: 'date', defaultOpen: true, motion: false, onBlur });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-1');
        await fireEvent.focusOut(input);
        await settle();
        expect(onBlur).not.toHaveBeenCalled();
        expect(input).toHaveValue('2021-06-1');
        expect(getPopup()).not.toBeNull();
    });

    it('左侧切到与右侧同月时右侧后移', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
        });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [, monthList] = getYMLists(getPanel('left'));
        await userEvent.click(within(monthList).getByRole('option', { name: '7月' }));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('autoSwitchDate 下 dateTime 保留时间', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            autoSwitchDate: true,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-10-08 08:08:08');
    });

    it('autoSwitchDate 下日期不跟进禁用日', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            autoSwitchDate: true,
            defaultOpen: true,
            disabledDate: () => true,
            motion: false,
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
    });

    it('dateRange 的 #prefix 渲染范围前缀', async () => {
        const { container } = await renderPicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false }, { prefix: () => <span class="dp-prefix">P</span> });
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-prefix`)).toHaveTextContent('P');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('dateRange 的 #insetLabel 渲染范围前缀', async () => {
        const { container } = await renderPicker({ type: 'dateRange', defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)], motion: false }, { insetLabel: () => <span class="dp-inset-label">Label</span> });
        expect(container.querySelector(`.${dp}-range-input-prefix .dp-inset-label`)).toHaveTextContent('Label');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('insetInput 时禁用的范围触发器仍可清除', async () => {
        const onClear = vi.fn<EmitFn<'clear'>>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            disabled: true,
            insetInput: true,
            motion: false,
            showClear: true,
            onClear,
        });
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('空值显示空字符串', async () => {
        const { container } = await renderPicker({ type: 'date', motion: false });
        expect(container.querySelector('input')).toHaveValue('');
        const { container: rangeContainer } = await renderPicker({
            type: 'dateRange',
            modelValue: null,
            motion: false,
        });
        rangeContainer.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
    });

    it('各类型的输入框数量', async () => {
        const { container: rangeContainer } = await renderPicker({ type: 'dateRange', motion: false });
        expect(rangeContainer.querySelectorAll('input')).toHaveLength(2);
        const { container: monthRangeContainer } = await renderPicker({ type: 'monthRange', motion: false });
        expect(monthRangeContainer.querySelectorAll('input')).toHaveLength(1);
        const { container: dateContainer } = await renderPicker({ type: 'date', motion: false });
        expect(dateContainer.querySelectorAll('input')).toHaveLength(1);
    });

    it('自定义文本格式', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            format: 'yyyy年MM月dd日',
            motion: false,
        });
        expect(container.querySelector('input')).toHaveValue('2019年09月08日');
    });

    it('范围分隔符在起止都有值时激活', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
        });
        expect(container.querySelector(`.${dp}-range-input-separator`)).toHaveClass(`${dp}-range-input-separator-active`);
        const { container: empty } = await renderPicker({ type: 'dateRange', motion: false });
        expect(empty.querySelector(`.${dp}-range-input-separator`)).not.toHaveClass(`${dp}-range-input-separator-active`);
    });

    it('dateRange 的 size 为 large 时使用范围默认尺寸', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
            size: 'large',
        });
        expect(container.querySelector(`.${dp}-range-input`)).toHaveClass(`${dp}-range-input-large`);
        container.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper`).forEach((wrapper) => expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-default`));
    });

    it('dateRange 禁用时点击分隔符不触发聚焦', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            disabled: true,
            motion: false,
            onFocus,
        });
        await fireEvent.click(container.querySelector(`.${dp}-range-input-separator`) as HTMLElement);
        await settle();
        expect(onFocus).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();
    });

    it('每次修改范围输入框都报告整个范围', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(startInput, '2021-06-02');
        await typeInto(endInput, '2021-07-15');
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 2), new Date(2021, 6, 15)], ['2021-06-02', '2021-07-15']);
    });

    it('dateRange 的 #clearIcon', async () => {
        await renderPicker(
            {
                type: 'dateRange',
                defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
                motion: false,
                showClear: true,
            },
            { clearIcon: () => <span class="custom-clear-icon">X</span> }
        );
        const clearBtn = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clearBtn.querySelector('.custom-clear-icon')).toHaveTextContent('X');
    });

    it('monthRange placeholder 数组拼接', async () => {
        await renderPicker({ type: 'monthRange', placeholder: ['Start', 'End'], motion: false, rangeSeparator: ' - ' });
        expect(screen.getByPlaceholderText('Start - End')).toBeInTheDocument();
    });

    it('date 类型无时间的 insetInput', async () => {
        await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const wrapper = (getPopup() as HTMLElement).querySelector(`.${dp}-inset-input-wrapper`) as HTMLElement;
        expect(wrapper).toHaveAttribute('x-type', 'date');
        expect(wrapper.querySelectorAll('input')).toHaveLength(1);
        expect(wrapper.querySelector(`.${dp}-inset-input-separator`)).toBeNull();
    });

    it('insetInput 自定义 placeholder', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            insetInput: { placeholder: { dateStart: 'Date Start', timeStart: 'Time Start' } },
            motion: false,
        });
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('Date Start')).toHaveValue('2019-09-08');
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('Time Start')).toHaveValue('08:08:08');
    });

    it('dateRange 的 insetInput 使用 compact 密度', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            density: 'compact',
            insetInput: true,
            motion: false,
        });
        const separator = (getPopup() as HTMLElement).querySelector(`.${dp}-inset-input-separator`);
        expect(separator).not.toBeNull();
        expect(separator).toBeEmptyDOMElement();
    });

    it('日期格悬停', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        await userEvent.hover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).toHaveClass(`${dp}-day-inhover`);
        await userEvent.unhover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('点击禁用日期不选中', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            disabledDate: (date: Date) => date.getDate() === 15,
            motion: false,
            onChange,
        });
        const disabledDay = getDay('2019-09-15');
        expect(disabledDay).toHaveClass(`${dp}-day-disabled`);
        expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(disabledDay);
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopup()).not.toBeNull();
    });

    it('weekStartsOn 为 0（周日）', async () => {
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, weekStartsOn: 0 });
        const weekdays = screen.getAllByRole('columnheader').map((header) => header.textContent);
        expect(weekdays).toEqual(['日', '一', '二', '三', '四', '五', '六']);
        // 2019-09-01 is a Sunday, the first cell of the first week
        expect(getWeekDays('left', 0)[0]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('dateTime needConfirm 点击日期只缓存，确定后提交', async () => {
        const onConfirm = vi.fn<EmitFn<'confirm'>>();
        const { container } = await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            needConfirm: true,
            onConfirm,
        });
        await userEvent.click(getDay('2019-09-11'));
        expect(onConfirm).not.toHaveBeenCalled();
        await userEvent.click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledWith(new Date(2019, 8, 11, 8, 8, 8, 8), '2019-09-11 08:08:08');
        expect(container.querySelector('input')).toHaveValue('2019-09-11 08:08:08');
    });

    it('v-model 宿主下选择日期', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderHost(Model, {
            initValue: baseDate,
            type: 'date',
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getDay('2019-09-11'));
        expect(onChange.mock.calls[0][0]).toEqual(new Date(2019, 8, 11));
        expect(container.querySelector('input')).toHaveValue('2019-09-11');
        await waitForClosed();
    });

    it('needConfirm 下范围完整才可确定', async () => {
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 10, 10), new Date(2021, 5, 20, 18)],
            motion: false,
            needConfirm: true,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(endInput);
        await settle();
        expect(getFooterButtons()[1]).toBeEnabled();
        await userEvent.click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(getFooterButtons()[1]).toBeDisabled();
    });

    it('非范围类型 needConfirm 总可确定', async () => {
        await renderPicker({ type: 'dateTime', defaultOpen: true, motion: false, needConfirm: true });
        expect(getFooterButtons()[1]).toBeEnabled();
    });

    it('disabled 时不能打开，取消禁用后可以', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const view = await renderPicker({ type: 'date', disabled: true, motion: false, onOpenChange });
        await fireEvent.click(view.container.querySelector(`.${dp}-input`) as HTMLElement);
        await settle();
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getPopup()).toBeNull();

        await view.rerender({ disabled: false });
        await userEvent.click(view.container.querySelector('input') as HTMLElement);
        await settle();
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPopup()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitForClosed();
    });

    it('键入禁用日期不通知，清空不查禁用', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            disabledDate: (date: Date) => date.getDate() === 15,
            motion: false,
            onChange,
        });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(input, '2021-06-10');
        expect(onChange).toHaveBeenCalledTimes(1);
        await typeInto(input, '');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('dateTimeRange 键入后按 Enter', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(endInput, '2021-06-20 18:00:00');
        await userEvent.type(endInput, '{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
        expect(startInput).toHaveValue('2021-06-01 10:00:00');
        expect(endInput).toHaveValue('2021-06-20 18:00:00');
    });

    it('dateTimeRange 渲染两个面板', async () => {
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
        });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-navigation`)).toHaveLength(2);
        expect(getPanel('left').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-0110:00:00');
        expect(getPanel('right').querySelector(`.${dp}-switch`)).toHaveTextContent('2021-06-1518:00:00');
    });

    it('dateTimeRange 的 insetInput 渲染内嵌输入框', async () => {
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        const popup = getPopup() as HTMLElement;
        expect(popup.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-insetinput', 'true');
        expect(popup.querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(4);
        expect(popup.querySelector(`.${dp}-switch`)).toBeNull();
    });

    it('dateTimeRange 通过界面修改分钟', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement);
        const [, rightMinutes] = getPanel('right').querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(rightMinutes).getAllByRole('option', { name: '30' })[0]);
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 15, 18, 30)], ['2021-06-01 10:00:00', '2021-06-15 18:30:00']);
    });

    it('切换上一月与下一月时选中日跟随', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 9月');
        expect(onChange.mock.calls.map((args) => args[1])).toEqual(['2019-08-08', '2019-09-08']);
    });

    it('dateRange 范围类型下的 autoSwitchDate', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            autoSwitchDate: true,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(onChange).not.toHaveBeenCalled();
        const [startInput, endInput] = container.querySelectorAll('input');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('键入非法文本不高亮也不通知', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, 'not-a-date');
        expect(getSelectedDays()).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('not-a-date');
    });

    it('关闭面板时丢弃键入的文本', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: baseDate,
            defaultOpen: true,
            motion: false,
        });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-06-1');
        expect(input).toHaveValue('2021-06-1');
        await fireEvent.mouseDown(document.body);
        await settle();
        expect(input).toHaveValue(ymd(baseDate));
    });

    it('多选追加日期后的显示文本', async () => {
        const { container } = await renderPicker({
            type: 'date',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            multiple: true,
            defaultOpen: true,
            motion: false,
        });
        await userEvent.click(getDay('2021-06-20'));
        expect(container.querySelector('input')).toHaveValue('2021-06-01,2021-06-15,2021-06-20');
    });

    it('expose 的 open 与 close', async () => {
        const picker = ref<DatePickerHandle>();
        await renderNode(() => <DatePicker ref={picker} type="date" motion={false} />);
        picker.value?.open();
        await settle();
        expect(getPopup()).not.toBeNull();
        picker.value?.close();
        await waitForClosed();
    });

    it('insetInput 面板打开时聚焦已获焦的范围输入框', async () => {
        const picker = ref<DatePickerHandle>();
        await renderNode(() => <DatePicker ref={picker} type="dateRange" defaultValue={[new Date(2021, 5, 1), new Date(2021, 5, 15)]} insetInput motion={false} />);
        picker.value?.focus('rangeEnd');
        await settle();
        picker.value?.open();
        await settle();
        const [, endDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText('yyyy-MM-dd');
        await waitFor(() => expect(endDate).toHaveFocus());
    });

    it('insetInput 范围类型面板关闭后 focus() 聚焦触发框的对应输入框', async () => {
        const picker = ref<DatePickerHandle>();
        const { container } = await renderNode(() => <DatePicker ref={picker} type="dateRange" insetInput motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        picker.value?.open();
        await waitFor(() => expect(startInput).toBeDisabled());
        picker.value?.close();
        await waitForClosed();
        await waitFor(() => expect(startInput).toBeEnabled());
        picker.value?.focus();
        expect(startInput).toHaveFocus();
        picker.value?.focus('rangeEnd');
        expect(endInput).toHaveFocus();
    });

    it('insetInput 的 monthRange 面板关闭时 focus() 聚焦触发框输入框', async () => {
        const picker = ref<DatePickerHandle>();
        const { container } = await renderNode(() => <DatePicker ref={picker} type="monthRange" insetInput motion={false} />);
        picker.value?.focus();
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('范围左侧显示年份选择器', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 6, 15)],
            defaultOpen: true,
            motion: false,
        });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left').querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getPanel('right').querySelector(`.${dp}-yam`)).toBeNull();
        expect(getYMSelected(getPanel('left'))).toEqual(['2021年', '6月']);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
    });

    it('dateTime 的切换按钮显示已选日期与时间', async () => {
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate })).toHaveTextContent('2019-09-08');
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');
    });

    it('dateTimeRange 的时间面板按侧打开', async () => {
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
        });
        const switchOf = (side: string, name: string) => getPanel(side).querySelector(`[aria-label="${name}"]`) as HTMLElement;
        await userEvent.click(switchOf('left', zh_CN.DatePicker.switchToTime));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
        await userEvent.click(switchOf('right', zh_CN.DatePicker.switchToTime));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        await userEvent.click(switchOf('left', zh_CN.DatePicker.switchToDate));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
    });

    it('点击日历后缀开始范围选择', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            motion: false,
        });
        await userEvent.click(container.querySelector(`.${dp}-range-input-suffix`) as HTMLElement);
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('weekStartsOn 影响日期格位置', async () => {
        // January 2021 starts on Friday
        await renderPicker({
            type: 'date',
            defaultValue: new Date(2021, 0, 1),
            defaultOpen: true,
            motion: false,
            weekStartsOn: 1,
        });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(31);
        // with Monday first, Friday is the fifth column
        expect(getWeekDays('left', 0)[4]).toHaveAttribute('aria-label', '2021-01-01');
    });

    it('insetInput 的日期与时间输入框 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        const [startDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText<HTMLInputElement>('yyyy-MM-dd');
        const [startTime] = within(getPopup() as HTMLElement).getAllByPlaceholderText<HTMLInputElement>('HH:mm:ss');
        await typeInto(startDate, '2021-06-10');
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 10), new Date(2021, 5, 15, 18)], ['2021-06-10 10:00:00', '2021-06-15 18:00:00']);
        await typeInto(startTime, '11:00:00');
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 10, 11), new Date(2021, 5, 15, 18)], ['2021-06-10 11:00:00', '2021-06-15 18:00:00']);
    });

    it('范围类型下周行数随月份变化', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 1, 1), new Date(2021, 2, 15)],
            defaultOpen: true,
            motion: false,
        });
        const weekRows = (side: string) => getPanel(side).querySelectorAll(`.${dp}-week`);
        expect(getNavTitle('right')).toBe('2021年 3月');
        expect(weekRows('right')).toHaveLength(5);
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        // May 2021 needs six week rows
        const nextMonth = () => getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement;
        await userEvent.click(nextMonth());
        await userEvent.click(nextMonth());
        expect(getNavTitle('right')).toBe('2021年 5月');
        expect(weekRows('right')).toHaveLength(6);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
    });

    it('年月面板的返回按钮回到日期面板', async () => {
        await renderPicker({ type: 'date', defaultValue: new Date(2021, 5, 1), defaultOpen: true, motion: false });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left').querySelector(`.${dp}-navigation`)).toBeNull();
        await userEvent.click((getPopup() as HTMLElement).querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('输入框聚焦发 focus，失焦不发 blur', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const onBlur = vi.fn<EmitFn<'blur'>>();
        const { container } = await renderPicker({ type: 'date', motion: false, onBlur, onFocus });
        const input = container.querySelector('input') as HTMLInputElement;
        input.focus();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        input.blur();
        await settle();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('范围输入框的后缀图标', async () => {
        const { container } = await renderPicker({ type: 'dateRange', defaultOpen: true, motion: false });
        expect(container.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar`)).not.toBeNull();
        const { container: dateTime } = await renderPicker({ type: 'dateTimeRange', motion: false });
        expect(dateTime.querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar_clock`)).not.toBeNull();
    });

    it('点击开始输入框外层聚焦开始', async () => {
        const { container } = await renderPicker({ type: 'dateRange', motion: false });
        await fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-start`) as HTMLElement);
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('点击结束输入框外层聚焦结束', async () => {
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        await fireEvent.click(container.querySelector(`.${dp}-range-input-wrapper-end`) as HTMLElement);
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('结束输入框按 Enter 补全无法解析的输入', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
            onChange,
        });
        const [startInput, endInput] = container.querySelectorAll('input');
        await typeInto(endInput, '2021-06-1');
        await userEvent.type(endInput, '{Enter}');
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateTimeRange 的 insetInput 聚焦结束日期后点击选结束', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
            onChange,
        });
        const [, endDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText('yyyy-MM-dd');
        endDate.focus();
        await settle();
        await userEvent.click(getDay('2021-06-20'));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2021, 5, 1, 10), new Date(2021, 5, 20, 18)], ['2021-06-01 10:00:00', '2021-06-20 18:00:00']);
    });

    it('monthRange 选择年份时跳过禁用的月份', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'monthRange',
            defaultValue: ['2021-06', '2021-08'],
            defaultOpen: true,
            disabledDate: (date?: Date) => Boolean(date) && (date as Date).getMonth() === 5,
            motion: false,
            onChange,
        });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 6), new Date(2023, 7)], ['2022-07', '2023-08']);
    });

    it('dateTimeRange 起止同一天时两侧的时间面板', async () => {
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 15, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            motion: false,
        });
        const timeSwitch = (side: string) => getPanel(side).querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement;
        await userEvent.click(timeSwitch('left'));
        await userEvent.click(timeSwitch('right'));
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        expect(timeSwitch('left')).toHaveTextContent('10:00:00');
        expect(timeSwitch('right')).toHaveTextContent('18:00:00');
    });

    it('dateRange 点击 #prefix 从开始输入框开始', async () => {
        const { container } = await renderPicker({ type: 'dateRange', motion: false }, { prefix: () => 'Date:' });
        await userEvent.click(container.querySelector(`.${dp}-range-input-prefix`) as HTMLElement);
        await settle();
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('聚焦 insetInput 的时间与日期输入框切换两侧面板', async () => {
        // the panel focuses its start date input once it is visible, which would land after the focus below
        await renderPicker({
            type: 'dateTimeRange',
            defaultValue: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            defaultOpen: true,
            insetInput: true,
            motion: false,
        });
        await waitForPanelOpened();
        await settle();
        const [startDate] = within(getPopup() as HTMLElement).getAllByPlaceholderText('yyyy-MM-dd');
        const [startTime] = within(getPopup() as HTMLElement).getAllByPlaceholderText('HH:mm:ss');
        startTime.focus();
        await settle();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        startDate.focus();
        await settle();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
    });

    it('两侧按月份渲染周行数', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            defaultOpen: true,
            motion: false,
        });
        // June and July 2021 both need five week rows
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        expect(getPanel('right').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
    });

    it('悬停已选的 offset 范围', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateRange',
            defaultPickerValue: '2021-06-01',
            endDateOffset: (date: Date) => addDays(date, 1),
            motion: false,
            open: true,
            startDateOffset: (date: Date) => addDays(date, -1),
            onChange,
        });
        await userEvent.click(getDay('2021-06-10'));
        expect(onChange.mock.calls[0][1]).toEqual(['2021-06-09', '2021-06-11']);
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-selectedrange-hover`);
        await userEvent.unhover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).not.toHaveClass(`${dp}-day-selectedrange-hover`);
    });

    it('时间面板选择分钟', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'dateTime',
            defaultValue: new Date(2021, 5, 1, 10, 30),
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [, minuteList] = (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await userEvent.click(within(minuteList).getAllByRole('option', { name: '45' })[0]);
        expect(onChange).toHaveBeenLastCalledWith(new Date(2021, 5, 1, 10, 45), '2021-06-01 10:45:00');
    });

    it('年月面板只移动面板，不改值', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'date',
            defaultValue: new Date(2021, 5, 1),
            autoSwitchDate: false,
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        const [yearList, monthList] = getYMLists();
        await userEvent.click(within(yearList).getByRole('option', { name: '2022' }));
        await userEvent.click(within(monthList).getByRole('option', { name: '3月' }));
        await userEvent.click((getPopup() as HTMLElement).querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2022年 3月');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('单选下悬停日期不改类名', async () => {
        await renderPicker({ type: 'date', defaultOpen: true, defaultPickerValue: '2021-06-01', motion: false });
        const day = getDay('2021-06-10');
        const className = day.className;
        await fireEvent.mouseEnter(day);
        expect(day.className).toBe(className);
        await fireEvent.mouseLeave(day);
        expect(day.className).toBe(className);
    });

    it('切换月份时周行数随之变化', async () => {
        await renderPicker({ type: 'date', defaultValue: baseDate, defaultOpen: true, motion: false });
        // September 2019 needs five week rows, June 2019 needs six
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(5);
        for (let i = 0; i < 3; i++) {
            await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        }
        expect(getNavTitle('left')).toBe('2019年 6月');
        expect(getPanel('left').querySelectorAll(`.${dp}-week`)).toHaveLength(6);
    });

    it('monthRange 一年中只有一个月可用', async () => {
        const disabledDate = (date?: Date) => Boolean(date && date.getFullYear() === 2022 && date.getMonth() > 0);
        await renderPicker({
            type: 'monthRange',
            defaultValue: ['2022-06', '2022-08'],
            defaultOpen: true,
            disabledDate,
            motion: false,
        });
        const leftMonths = within(getYMLists()[1]).getAllByRole('option');
        const enabledMonths = leftMonths.filter((option) => option.getAttribute('aria-disabled') === 'false');
        expect(enabledMonths).toHaveLength(1);
        expect(enabledMonths[0]).toHaveTextContent('1');
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022年' })).toHaveAttribute('aria-disabled', 'false');
    });

    it('monthRange 两侧月份都禁用时找到可用月份', async () => {
        const disabledDate = (date?: Date) => Boolean(date && date.getFullYear() === 2022 && (date.getMonth() === 5 || date.getMonth() === 7));
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'monthRange',
            defaultValue: ['2022-06', '2022-08'],
            defaultOpen: true,
            disabledDate,
            motion: false,
            onChange,
        });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 6), new Date(2022, 6)], ['2022-07', '2022-07']);
    });

    it('monthRange 仅对侧月份禁用', async () => {
        const disabledDate = (date?: Date) => Boolean(date && date.getFullYear() === 2022 && date.getMonth() === 7);
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'monthRange',
            defaultValue: ['2022-06', '2022-08'],
            defaultOpen: true,
            disabledDate,
            motion: false,
            onChange,
        });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2022年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2022, 5), new Date(2022, 5)], ['2022-06', '2022-06']);
    });

    it('monthRange 在当前月份之前查找可用月份', async () => {
        const disabledDate = (date?: Date) => Boolean(date && date.getFullYear() === 2023 && date.getMonth() >= 5);
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            type: 'monthRange',
            defaultValue: ['2023-06', '2023-08'],
            defaultOpen: true,
            disabledDate,
            motion: false,
            onChange,
        });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023年' }));
        expect(onChange).toHaveBeenLastCalledWith([new Date(2023, 0), new Date(2023, 0)], ['2023-01', '2023-01']);
    });

    // One test per previously fixed bug, named after the issue it reproduces
    describe('story 回归用例', () => {
        const getSwitchTexts = () => Array.from(document.querySelectorAll(`.${dp}-switch-text`)).map((el) => el.textContent);

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('fix #1982 Fix1982：左月大于右月时，右侧 monthRange 面板保持左侧年份可选', async () => {
            const { container } = await renderPicker({
                type: 'monthRange',
                defaultValue: ['2021-09', '2022-03'],
                motion: false,
            });
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            const rightYears = getYMLists()[2];
            expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
            expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        });

        describe('Fix2567：切换年份后 monthRange 修正非法范围', () => {
            const disabledDate = (date: Date) => {
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
                const { container } = await renderPicker({
                    type: 'monthRange',
                    defaultValue,
                    disabledDate,
                    motion: false,
                });
                const input = container.querySelector('input') as HTMLInputElement;
                await userEvent.click(input);
                await settle();
                await userEvent.click(within(getYMLists()[listIndex]).getByRole('option', { name: year }));
                expect(input).toHaveValue(expected);
            });
        });

        describe('FixNeedConfirm：dateTimeRange 与 needConfirm 下恢复或提交输入', () => {
            const defaultValue = ['2021-12-27 10:37:13', '2022-01-28 10:37:13'];
            const renderAndPick = async () => {
                const view = await renderPicker({
                    type: 'dateTimeRange',
                    defaultValue,
                    motion: false,
                    needConfirm: true,
                });
                const inputs = view.container.querySelectorAll('input');
                await userEvent.click(inputs[0]);
                await settle();
                await userEvent.click(getDay('2021-12-15'));
                await userEvent.click(getDay('2022-01-20'));
                return inputs;
            };

            it('选择后取消', async () => {
                const [startInput, endInput] = await renderAndPick();
                await userEvent.click(getFooterButtons()[0]);
                await waitForClosed();
                expect(startInput).toHaveValue(defaultValue[0]);
                expect(endInput).toHaveValue(defaultValue[1]);
            });

            it('选择后确认', async () => {
                const [startInput, endInput] = await renderAndPick();
                await userEvent.click(getFooterButtons()[1]);
                await waitForClosed();
                expect(startInput).toHaveValue('2021-12-15 10:37:13');
                expect(endInput).toHaveValue('2022-01-20 10:37:13');
            });
        });

        it('fix #528 FixInputRangeFocus：受控打开的范围选择器在面板内关闭时，清除输入框焦点状态', async () => {
            const visible = ref(false);
            const { container } = await renderNode(() => (
                <DatePicker type="dateTimeRange" defaultPickerValue="2022-02-01" motion={false} open={visible.value} showClear onFocus={() => (visible.value = true)}>
                    {{
                        bottomSlot: () => <button onClick={() => (visible.value = false)}>close</button>,
                    }}
                </DatePicker>
            ));
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await waitForPanelOpened();
            expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
            await userEvent.click(getDay('2022-02-10'));
            await userEvent.click(getDay('2022-02-15'));
            await userEvent.click(screen.getByRole('button', { name: 'close' }));
            await waitForClosed();
            expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
            expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        });

        describe('fix #735 FixDefaultPickerValue：数字形式的 defaultPickerValue 定位面板', () => {
            const openFromInput = async (props: Record<string, unknown>) => {
                const { container } = await renderPicker(props);
                await userEvent.click(container.querySelector('input') as HTMLElement);
                await settle();
            };

            it('dateTime', async () => {
                await openFromInput({
                    type: 'dateTime',
                    defaultPickerValue: new Date('2021-03-15 00:00:00').valueOf(),
                    motion: false,
                });
                expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00']);
            });

            it('dateTimeRange', async () => {
                await openFromInput({
                    type: 'dateTimeRange',
                    defaultPickerValue: [new Date('2021-03-15 00:00:00').valueOf(), new Date('2021-05-15 23:59:59').valueOf()],
                    motion: false,
                });
                expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00', '2021-05-15', '23:59:59']);
            });

            it('1970 年之前', async () => {
                await openFromInput({
                    type: 'dateTime',
                    defaultPickerValue: new Date('1910-01-01 13:00:00'),
                    motion: false,
                });
                expect(getSwitchTexts()).toEqual(['1910-01-01', '13:00:00']);
            });
        });

        it('fix #676 FixedTriggerRender：空的受控 value 将范围选择重置为起始日期', async () => {
            const onChange = vi.fn<(date: unknown) => void>();
            const date = ref<DatePickerProps['modelValue']>([]);
            await renderNode(() => (
                <DatePicker
                    type="dateTimeRange"
                    modelValue={date.value}
                    defaultPickerValue="2022-07-01"
                    motion={false}
                    onUpdate:modelValue={(v: DatePickerProps['modelValue']) => {
                        onChange(v);
                        date.value = v;
                    }}
                >
                    {{
                        trigger: () => (
                            <div>
                                <button>trigger</button>
                                <button
                                    onClick={(e: MouseEvent) => {
                                        e.stopPropagation();
                                        date.value = null;
                                    }}
                                >
                                    clear
                                </button>
                            </div>
                        ),
                    }}
                </DatePicker>
            ));
            await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
            await settle();
            await userEvent.click(getDay('2022-07-10'));
            await userEvent.click(getDay('2022-07-15'));
            expect(onChange.mock.lastCall?.[0]).toEqual([new Date(2022, 6, 10), new Date(2022, 6, 15)]);

            await userEvent.click(screen.getByRole('button', { name: 'clear' }));
            await settle();
            await userEvent.click(getDay('2022-07-20'));
            await userEvent.click(getDay('2022-07-25'));
            expect(onChange.mock.lastCall?.[0]).toEqual([new Date(2022, 6, 20), new Date(2022, 6, 25)]);
        });

        it('fix #520 FixDisabledMonth：切换到该月份被禁用的年份时，选中最近的可用月份', async () => {
            const disabledDate = (date: Date) => {
                const isBefore = date < set(date, { year: 2021, month: 10 });
                const isAfter = date > set(date, { year: 2022, month: 10 });
                return isBefore || isAfter;
            };
            const { container } = await renderPicker({
                type: 'month',
                defaultValue: new Date('2022-11'),
                disabledDate,
                motion: false,
                yearAndMonthOpts: { motion: false },
            });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();

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
                const { container } = await renderPicker({ type, defaultPickerValue: '2019-07-01', motion: false });
                await userEvent.click(container.querySelector('input') as HTMLElement);
                await settle();
                await userEvent.click(getDay('2019-08-20'));
                expect(getNavTitle('left')).toBe('2019年 7月');
                expect(getNavTitle('right')).toBe('2019年 8月');
            });

            it.each(['dateRange', 'dateTimeRange'] as const)('%s：跨月的 defaultValue 打开时定位到起止月份', async (type) => {
                const { container } = await renderPicker({
                    type,
                    defaultValue: ['2019-07-01', '2019-08-02'],
                    motion: false,
                });
                await userEvent.click(container.querySelector('input') as HTMLElement);
                await settle();
                expect(getNavTitle('left')).toBe('2019年 7月');
                expect(getNavTitle('right')).toBe('2019年 8月');
                expect(getPanel('left').querySelector(`.${dp}-day-selected-start`)).toHaveAttribute('aria-label', '2019-07-01');
                expect(getPanel('right').querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2019-08-02');
            });
        });

        it('fix #1413 InsetInputControlled：受控 dateTimeRange 的 insetInput 显示已选日期', async () => {
            const { container } = await renderHost(Model, {
                type: 'dateTimeRange',
                defaultPickerValue: ['2022-02-07', '2023-02-07'],
                insetInput: true,
                motion: false,
            });
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            await userEvent.click(getDay('2022-02-20'));
            await userEvent.click(getDay('2023-02-20'));
            const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper .${BASE_CLASS_PREFIX}-input`);
            expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2022-02-20', '00:00:00', '2023-02-20', '00:00:00']);
        });

        describe('fix #1422 FixMultiplePanelShift：多选时不会跳回第一个已选月份', () => {
            const props = { type: 'date', multiple: true, defaultPickerValue: '2019-07-01', motion: false };
            it.each([
                ['uncontrolled', () => renderPicker(props)],
                ['controlled', () => renderHost(Model, props)],
            ])('%s', async (_name, renderDemo) => {
                const { container } = await renderDemo();
                await userEvent.click(container.querySelector('input') as HTMLElement);
                await settle();
                await userEvent.click(getDay('2019-07-20'));
                await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
                await userEvent.click(getDay('2019-08-20'));
                expect(getNavTitle('left')).toBe('2019年 8月');
                expect(getSelectedDays()).toEqual(['2019-08-20']);
            });
        });

        it('fix #1522 FixTimeZone：字符串 timeZone 下，受控 dateTime 值经 change 往返一致', async () => {
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderHost(Model, {
                type: 'dateTime',
                defaultPickerValue: '2020-02-13',
                motion: false,
                timeZone: 'GMT+00:00',
                onChange,
            });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            await userEvent.click(getDay('2020-02-15'));
            expect(onChange).toHaveBeenCalledTimes(1);
            // in GMT+00:00 the shown wall time must equal the UTC time of the emitted date
            const utcText = (onChange.mock.calls[0][0] as Date).toISOString().slice(0, 19).replace('T', ' ');
            expect(utcText.startsWith('2020-02-15')).toBe(true);
            expect(input).toHaveValue(utcText);
        });

        it('FixNeedConfirmInTabs：离开标签页时，expose 的 close() 隐藏 needConfirm 面板', async () => {
            const picker = ref<DatePickerHandle>();
            const pane = (itemKey: string, tab: string, content: () => unknown) => <TabPane itemKey={itemKey}>{{ default: content, tab: () => tab }}</TabPane>;
            await renderNode(() => (
                <Tabs
                    type="line"
                    onChange={(activeKey: string) => {
                        if (activeKey === '2') {
                            picker.value?.close();
                        }
                    }}
                >
                    {() => [pane('1', 'doc', () => <DatePicker ref={picker} type="dateTime" motion={false} needConfirm />), pane('2', 'start', () => <DatePicker type="dateTimeRange" motion={false} needConfirm />)]}
                </Tabs>
            ));
            await userEvent.click(document.querySelector('input') as HTMLElement);
            await settle();
            expect(getPopup()).not.toBeNull();
            await userEvent.click(screen.getByRole('tab', { name: 'start' }));
            await waitForClosed();
        });

        it('未设置 insetInput 时，面板显示不会把焦点拉回触发输入框', async () => {
            const { container } = await renderPicker({ type: 'dateRange', defaultPickerValue: '2023-04-01', motion: false }, { bottomSlot: () => <button>slot</button> });
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            const slot = screen.getByRole('button', { name: 'slot' });
            await userEvent.click(slot);
            await waitForPanelOpened();
            expect(document.activeElement).toBe(slot);
        });

        it.each([
            ['GMT+05:00', '2023-05-03 08:29:00'],
            ['GMT-05:00', '2023-05-02 22:29:00'],
            ['GMT+00:00', '2023-05-03 03:29:00'],
            ['GMT+14:00', '2023-05-03 17:29:00'],
        ])('fix #1585 FeatEtcGMT：timeZone %s 显示 %s', async (timeZone, expected) => {
            const { container } = await renderPicker({ type: 'dateTime', defaultValue: 1683084540000, timeZone });
            expect(container.querySelector('input')).toHaveValue(expected);
        });

        it('fix #1592 FixDisabledDate：起始被禁用时，聚焦结束输入框仍可选择范围结束日期', async () => {
            const today = new Date('2023-05-06 00:00:00');
            const disabledDate = (date: Date, { rangeInputFocus }: { rangeInputFocus?: string | boolean } = {}) => {
                const days = rangeInputFocus === 'rangeStart' ? 2 : rangeInputFocus === 'rangeEnd' ? 3 : 0;
                return days > 0 && addDays(today, -days) <= date && date <= addDays(today, days);
            };
            const { container } = await renderPicker({
                type: 'dateRange',
                defaultPickerValue: new Date('2023-05-06'),
                disabledDate,
                motion: false,
            });
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(startInput);
            await settle();
            await userEvent.click(getDay('2023-05-03'));
            await userEvent.click(getDay('2023-05-10'));
            expect(startInput).toHaveValue('2023-05-03');
            expect(endInput).toHaveValue('2023-05-10');
        });

        it('fix #2024 FixNeedConfirmControlled：受控 dateTimeRange 与 needConfirm 显示待定起始值，并确认完整范围', async () => {
            const { container } = await renderHost(Model, {
                initValue: [],
                type: 'dateTimeRange',
                defaultPickerValue: '2024-02-15',
                motion: false,
                needConfirm: true,
            });
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(startInput);
            await settle();
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
            const value = ref<Date | Date[] | number[] | undefined>([NaN, NaN]);
            const { container } = await renderNode(() => (
                <>
                    <button onClick={() => (value.value = [NaN, NaN])}>set NaN</button>
                    <DatePicker type="dateRange" modelValue={value.value} defaultPickerValue="2024-01-01" motion={false} presets={[{ text: 'Empty' }]} onUpdate:modelValue={(v?: Date | Date[]) => (value.value = v)} />
                </>
            ));
            const [startInput, endInput] = container.querySelectorAll('input');
            expect(startInput).toHaveValue('');
            expect(endInput).toHaveValue('');
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('value cannot be parsed'));

            await userEvent.click(startInput);
            await settle();
            await userEvent.click(getDay('2024-01-15'));
            await userEvent.click(getDay('2024-01-15'));
            expect(startInput).toHaveValue('2024-01-15');
            expect(endInput).toHaveValue('2024-01-15');

            await userEvent.click(screen.getByRole('button', { name: 'set NaN' }));
            await settle();
            expect(startInput).toHaveValue('');
            expect(endInput).toHaveValue('');
        });

        it('fix #1652 FixedSelectedStatus：再次点击已选日期时保持选中', async () => {
            const { container } = await renderPicker({
                type: 'dateTime',
                defaultPickerValue: '2022-07-01',
                motion: false,
            });
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            await userEvent.click(getDay('2022-07-15'));
            expect(getSelectedDays()).toEqual(['2022-07-15']);
            await userEvent.click(getDay('2022-07-15'));
            expect(getSelectedDays()).toEqual(['2022-07-15']);
        });

        it('fix #2387 FixedControlled：受控值未变化时，面板关闭后重置待定范围', async () => {
            const { container } = await renderPicker({
                type: 'dateRange',
                modelValue: [new Date('2022-08-08'), new Date('2022-08-09')],
                defaultPickerValue: '2022-08-01',
                motion: false,
            });
            const [startInput, endInput] = container.querySelectorAll('input');
            await userEvent.click(endInput);
            await settle();
            await userEvent.click(getDay('2022-08-15'));
            expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2022-08-15')).toHaveClass(`${dp}-day-selected-end`);

            await userEvent.click(startInput);
            await userEvent.click(getDay('2022-08-10'));
            await waitForClosed();
            await userEvent.click(startInput);
            await settle();
            expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
        });

        it('fix #2521 FixedControlledValue：重新打开时受控范围显示已选内容', async () => {
            const { container } = await renderHost(Model, {
                initValue: [],
                type: 'dateRange',
                defaultPickerValue: ['2023-10-01'],
                motion: false,
            });
            const startInput = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(startInput);
            await settle();
            await userEvent.click(getDay('2023-10-15'));
            await userEvent.click(getDay('2023-11-20'));
            await waitForClosed();
            await userEvent.click(startInput);
            await settle();
            expect(getDay('2023-10-15')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2023-11-20')).toHaveClass(`${dp}-day-selected-end`);
        });

        it('fix #422 FixParseISOBug：五位年份的 defaultValue 视为空值', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { container } = await renderPicker({ defaultValue: '20221-12-20', defaultOpen: true, motion: false });
            await settle();
            expect(container.querySelector('input')).toHaveValue('');
            expect(getPopup()).not.toBeNull();
            expect(getSelectedDays()).toEqual([]);
        });

        it('FixNotifyChange：切换 ConfigProvider timeZone 不通知受控范围，完整选择只通知一次', async () => {
            const onChange = vi.fn<ChangeFn>();
            const tz = ref(0);
            const value = ref<DatePickerProps['modelValue']>();
            await renderNode(() => <ConfigProvider timeZone={tz.value}>{() => <DatePicker type="dateTimeRange" modelValue={value.value} defaultPickerValue="2021-08-01" motion={false} onChange={onChange} onUpdate:modelValue={(v: DatePickerProps['modelValue']) => (value.value = v)} />}</ConfigProvider>);
            tz.value = 8;
            await settle();
            expect(onChange).not.toHaveBeenCalled();

            await userEvent.click(document.querySelector('input') as HTMLElement);
            await settle();
            await userEvent.click(getDay('2021-08-10'));
            await userEvent.click(getDay('2021-08-12'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][0]).toHaveLength(2);

            tz.value = 0;
            await settle();
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('行为基线', () => {
        const getRoot = () => document.querySelector(`.${dp}`);

        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值，传入的属性优先', async () => {
            semiGlobal.config.overrideDefaultProps = { DatePicker: { format: 'yyyy/MM/dd', density: 'compact' } };
            const first = await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
            await settle();
            expect(first.container.querySelector('input')).toHaveValue('2019/09/08');
            expect(getPopup()).toHaveClass(`${dp}-compact`);
            first.unmount();
            const { container: second } = await renderPicker({ defaultValue: baseDate, format: 'yyyy-MM-dd' });
            expect(second.querySelector('input')).toHaveValue('2019-09-08');
        });

        it('全局默认值里的 insetLabelId 不影响 DatePicker', async () => {
            // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
            semiGlobal.config.overrideDefaultProps = { DatePicker: { insetLabelId: 'label-global' } } as object;
            await renderPicker({}, { insetLabel: () => '日期' });
            expect(document.getElementById('label-global')).toBeNull();
        });

        it('打开时只有一个外部点击监听，关闭一次，卸载时移除', async () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const onOpenChange = vi.fn<(open: boolean) => void>();
            const onBlur = vi.fn<EmitFn<'blur'>>();
            const view = await renderPicker({
                defaultValue: baseDate,
                defaultOpen: true,
                motion: false,
                onBlur,
                onOpenChange,
            });
            const { container } = view;
            await settle();
            const mousedown = () => countLiveListeners(add, remove, 'mousedown');
            expect(container.querySelector('input')).toHaveValue(ymd(baseDate));
            const opened = mousedown();
            expect(opened).toBeGreaterThanOrEqual(1);
            await fireEvent.mouseDown(document.body);
            expect(onOpenChange.mock.calls).toEqual([[false]]);
            expect(onBlur).toHaveBeenCalledTimes(1);
            await waitForClosed();
            expect(mousedown()).toBe(opened - 1);
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            expect(getPopup()).not.toBeNull();
            expect(mousedown()).toBe(opened);
            view.unmount();
            expect(mousedown()).toBe(0);
        });

        it('选择日期只报告一次变化并关闭一次', async () => {
            const onChange = vi.fn<ChangeFn>();
            const onUpdate = vi.fn<EmitFn<'update:modelValue'>>();
            const onOpenChange = vi.fn<(open: boolean) => void>();
            await renderPicker({
                defaultValue: baseDate,
                defaultOpen: true,
                motion: false,
                onChange,
                'onUpdate:modelValue': onUpdate,
                onOpenChange,
            });
            await settle();
            await userEvent.click(getDay('2019-09-12'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2019-09-12');
            expect(onUpdate).toHaveBeenCalledTimes(1);
            expect(onUpdate.mock.calls[0][0]).toBe(onChange.mock.calls[0][0]);
            expect(onOpenChange.mock.calls).toEqual([[false]]);
        });

        it('受控 open 控制面板显示与隐藏，点击外部时只请求一次关闭', async () => {
            const onOpenChange = vi.fn<(open: boolean) => void>();
            const onClickOutSide = vi.fn<EmitFn<'clickOutSide'>>();
            const { rerender } = await renderPicker({ motion: false, open: true, onClickOutSide, onOpenChange });
            await settle();
            expect(getPopup()).not.toBeNull();
            await fireEvent.mouseDown(document.body);
            expect(onClickOutSide).toHaveBeenCalledTimes(1);
            expect(onOpenChange.mock.calls).toEqual([[false]]);
            expect(getPopup()).not.toBeNull();
            await rerender({ open: false });
            await waitForClosed();
        });

        it('v-model:open 宿主随 openChange 回写，点击外部后关闭', async () => {
            const { container } = await renderHost(OpenModel, { motion: false });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            expect(getPopup()).not.toBeNull();
            expect(input).toHaveAttribute('aria-expanded', 'true');
            await fireEvent.mouseDown(document.body);
            await waitForClosed();
            expect(input).toHaveAttribute('aria-expanded', 'false');
        });

        it('受控 modelValue 变化时替换已输入的文本', async () => {
            const { container, rerender } = await renderPicker({ modelValue: baseDate });
            const input = container.querySelector('input') as HTMLInputElement;
            await typeInto(input, '2019-09-1');
            expect(input).toHaveValue('2019-09-1');
            await rerender({ modelValue: new Date(2020, 0, 2) });
            expect(input).toHaveValue('2020-01-02');
        });

        it('data-* 落在根 div，aria 状态属性落在 combobox 输入框', async () => {
            await renderPicker({
                'data-testid': 'dp',
                'aria-describedby': 'help',
                'aria-errormessage': 'error',
                'aria-invalid': true,
                'aria-labelledby': 'label',
                'aria-required': true,
            });
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

        it('范围类型的两个输入框都带 aria 状态属性，根 div 是 group', async () => {
            await renderNode(() => (
                <>
                    <span id="label">Period</span>
                    <DatePicker type="dateRange" aria-describedby="help" aria-invalid aria-labelledby="label" aria-required />
                </>
            ));
            expect(getRoot()).not.toHaveAttribute('aria-required');
            expect(screen.getByRole('group', { name: 'Period' })).toBe(getRoot());
            for (const input of screen.getAllByRole('combobox')) {
                expect(input).toHaveAttribute('aria-required', 'true');
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input).toHaveAttribute('aria-describedby', 'help');
            }
        });

        it('#trigger 的按钮触发器承接 aria-describedby 与 aria-invalid，不输出 aria-required', async () => {
            await renderPicker(
                {
                    'aria-describedby': 'help',
                    'aria-errormessage': 'error',
                    'aria-invalid': true,
                    'aria-required': true,
                },
                { trigger: () => <span>pick</span> }
            );
            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-invalid', 'true');
            expect(trigger).toHaveAttribute('aria-describedby', 'help');
            expect(trigger).toHaveAttribute('aria-errormessage', 'error');
            expect(trigger).not.toHaveAttribute('aria-required');
            expect(getRoot()).not.toHaveAttribute('aria-invalid');
        });

        it('通过 expose 打开的范围选择器在首次点击后聚焦结束输入框，且只报告一次聚焦', async () => {
            const picker = ref<DatePickerHandle>();
            const onFocus = vi.fn<EmitFn<'focus'>>();
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderNode(() => <DatePicker ref={picker} type="dateRange" defaultPickerValue="2021-06-01" motion={false} onChange={onChange} onFocus={onFocus} />);
            picker.value?.open();
            await settle();
            await settle();
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
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderPicker({ motion: false, onChange });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            await typeInto(input, '2021-06-10');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(getSelectedDays()).toEqual(['2021-06-10']);
            expect(getNavTitle('left')).toBe('2021年 6月');
        });

        it('对与当前选中值不同的已输入日期按 Enter 时报告变化', async () => {
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderPicker({ defaultValue: baseDate, onChange });
            const input = container.querySelector('input') as HTMLInputElement;
            // the text reaches the input without an input event, so only Enter parses it
            await fireEvent.keyDown(input, { key: 'Enter', target: { value: '2019-09-20' } });
            await settle();
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2019-09-20');
            expect(input).toHaveValue('2019-09-20');
        });
    });

    describe('组件实例', () => {
        it('expose 为包含文档中方法的 DatePickerHandle', async () => {
            const picker = ref<DatePickerHandle>();
            await renderNode(() => <DatePicker ref={picker} motion={false} />);
            for (const name of ['blur', 'close', 'focus', 'open'] as const) {
                expect(picker.value?.[name]).toBeTypeOf('function');
            }
        });

        it('未声明的属性（如 id、name 与 title）落在根 div，已声明的属性不落在任何地方', async () => {
            await renderPicker({
                id: 'day',
                title: 'tip',
                name: 'day-name',
                density: 'compact',
                timeZone: 'Asia/Tokyo',
            });
            const root = document.querySelector(`.${dp}`);
            expect(root).toHaveAttribute('id', 'day');
            expect(root).toHaveAttribute('name', 'day-name');
            expect(root).toHaveAttribute('title', 'tip');
            for (const attr of ['density', 'timezone']) {
                expect(root).not.toHaveAttribute(attr);
                expect(document.querySelector('input')).not.toHaveAttribute(attr);
            }
        });

        it('#trigger 收到的 componentProps 不含属性透传与插槽', async () => {
            const trigger = vi.fn<(scope: DatePickerTriggerSlotProps) => VNode>(() => <span>trigger</span>);
            await renderPicker({ class: 'custom', 'data-testid': 'dp' }, { trigger: trigger as never });
            const { componentProps } = trigger.mock.calls[0][0];
            expect(componentProps.type).toBe('date');
            for (const key of ['class', 'data-testid', 'trigger']) {
                expect(componentProps).not.toHaveProperty(key);
            }
        });

        it('weekStartsOn 变化时重新排列已打开面板中的星期', async () => {
            const { rerender } = await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
            await settle();
            const firstWeekday = () => document.querySelector(`.${dp}-weekday-item`)?.textContent;
            expect(firstWeekday()).toBe('日');
            await rerender({ weekStartsOn: 1 });
            expect(firstWeekday()).toBe('一');
        });

        it('autoSwitchDate 在本地零点将日期切换到年份选择器中选中的年份，且只切换一次', async () => {
            const onPanelChange = vi.fn<EmitFn<'panelChange'>>();
            const onChange = vi.fn<ChangeFn>();
            await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onChange, onPanelChange });
            await settle();
            await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
            await settle();
            await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2020' }));
            expect(onPanelChange).toHaveBeenCalledTimes(1);
            expect(onPanelChange.mock.calls[0][1]).toBe('2020-09-08');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2020-09-08');
            expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(0);
        });

        it('受控 open 优先于 expose 的方法', async () => {
            const picker = ref<DatePickerHandle>();
            await renderNode(() => <DatePicker ref={picker} motion={false} open={false} />);
            picker.value?.open();
            await settle();
            await settle();
            expect(getPopup()).toBeNull();
        });
    });
});

describe('DatePicker Tab 停靠点', () => {
    it('触发器外层不是 Tab 停靠点，Tab 直接进入输入框', async () => {
        const { container } = await renderPicker();
        await userEvent.tab();
        expect(container.querySelector(`.${dp}-input`)).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement?.tagName).toBe('INPUT');
    });

    it('insetInput 下，关闭状态的触发输入框仍是 Tab 停靠点', async () => {
        await renderPicker({ insetInput: true });
        await userEvent.tab();
        expect(document.activeElement?.tagName).toBe('INPUT');
    });

    it('范围选择器仅在起始与结束输入框停留', async () => {
        const { container } = await renderPicker({ type: 'dateRange' });
        const inputs = container.querySelectorAll('input');
        await userEvent.tab();
        expect(inputs[0]).toHaveFocus();
        await userEvent.tab();
        expect(inputs[1]).toHaveFocus();
    });

    it('带有自身焦点目标的自定义触发器是唯一停靠点', async () => {
        await renderPicker({}, { trigger: () => <button type="button">pick</button> });
        await settle();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('没有焦点目标的自定义触发器以外层作为停靠点，即打开面板的按钮', async () => {
        await renderPicker({ motion: false }, { trigger: () => <span>pick</span> });
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
    });
});

describe('DatePicker 触发器语义', () => {
    it('输入框为 combobox，其 aria-controls 指向对话框中的面板', async () => {
        const { container } = await renderPicker({ motion: false });
        const input = screen.getByRole('combobox');
        expect(input).toBe(container.querySelector('input'));
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector(`.${dp}-input`)).not.toHaveAttribute('role');
        await userEvent.click(input);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(input).toHaveAttribute('aria-expanded', 'true');
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toBe(getPopup());
        expect(panel?.closest('[role="dialog"]')).toBe(screen.getByRole('dialog', { name: zh_CN.DatePicker.panel.date }));
    });

    it('面板对话框以所选内容命名', async () => {
        for (const type of ['dateRange', 'dateTime', 'dateTimeRange', 'month', 'monthRange'] as const) {
            const view = await renderPicker({ type, defaultOpen: true, motion: false });
            expect(await screen.findByRole('dialog', { name: zh_CN.DatePicker.panel[type] })).toBeInTheDocument();
            view.unmount();
        }
        await renderNode(() => <LocaleProvider locale={en_US}>{() => <DatePicker type="dateTimeRange" defaultOpen motion={false} />}</LocaleProvider>);
        expect(await screen.findByRole('dialog', { name: 'Choose date and time range' })).toBeInTheDocument();
    });

    it('两个范围输入框都是同一面板的 combobox', async () => {
        await renderPicker({ type: 'dateRange', motion: false });
        const [start, end] = screen.getAllByRole('combobox');
        expect(start.tagName).toBe('INPUT');
        expect(end.tagName).toBe('INPUT');
        expect(start.getAttribute('aria-controls')).toBe(end.getAttribute('aria-controls'));
        expect(end).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('输入框上按 ArrowDown 打开面板', async () => {
        const onOpenChange = vi.fn<(open: boolean) => void>();
        await renderPicker({ motion: false, onOpenChange });
        screen.getByRole('combobox').focus();
        await settle();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    it('dateTime 面板的日期与时间切换为原生 button', async () => {
        await renderPicker({
            type: 'dateTime',
            defaultValue: baseDate,
            disabledTimePicker: true,
            motion: false,
            open: true,
        });
        const toDate = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const toTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(toDate.tagName).toBe('BUTTON');
        expect(toTime).toBeDisabled();
    });

    it('时间切换可通过键盘打开时间面板', async () => {
        await renderPicker({ type: 'dateTime', defaultValue: baseDate, motion: false, open: true });
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        toTime.focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
    });

    it('范围清空按钮可通过键盘清空', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'dateRange',
            defaultValue: [baseDate, addDays(baseDate, 3)],
            onChange,
        });
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear.tagName).toBe('BUTTON');
        clear.focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        const [start, end] = container.querySelectorAll('input');
        expect(start).toHaveValue('');
        expect(end).toHaveValue('');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('年份与月份列表有名称', async () => {
        await renderPicker({ type: 'month', motion: false, open: true });
        expect(await screen.findByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.month })).toBeInTheDocument();
    });
});

describe('DatePicker 日历网格键盘操作', () => {
    const activeDay = () => {
        const grid = screen.getByRole('grid');
        return document.getElementById(grid.getAttribute('aria-activedescendant') as string);
    };
    const focusGrid = async () => {
        screen.getByRole('grid').focus();
        await settle();
    };

    it('网格为单个 Tab 停靠点，并从已选日期开始', async () => {
        await renderPicker({ defaultValue: new Date(2019, 8, 11), motion: false, open: true, weekStartsOn: 1 });
        await settle();
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
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            defaultValue: new Date(2019, 8, 11),
            motion: false,
            open: true,
            weekStartsOn: 1,
            onChange,
        });
        await settle();
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-19');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(ymd(onChange.mock.calls[0][0] as Date)).toBe('2019-09-19');
    });

    it('移出当月时面板切换到下一个月', async () => {
        await renderPicker({ defaultValue: new Date(2019, 8, 30), motion: false, open: true, weekStartsOn: 1 });
        await settle();
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-10-01');
        await userEvent.keyboard('{PageUp}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('禁用日期上的 Enter 与 Space 不做任何选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderPicker({
            defaultPickerValue: new Date(2019, 8, 1),
            disabledDate: (date: Date) => date.getDate() === 1,
            motion: false,
            open: true,
            onChange,
        });
        await settle();
        await focusGrid();
        expect(activeDay()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard('{Enter} ');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('用 Enter 选择日期后关闭面板，焦点返回输入框', async () => {
        const { container } = await renderPicker({
            defaultValue: new Date(2019, 8, 11),
            defaultOpen: true,
            motion: false,
        });
        await settle();
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('grid')).toBeNull();
        });
        const input = container.querySelector('input');
        expect(input).toHaveValue('2019-09-12');
        expect(input).toHaveFocus();
    });

    it('Esc 关闭面板且不选择，焦点返回输入框', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            defaultValue: new Date(2019, 8, 11),
            defaultOpen: true,
            motion: false,
            onChange,
        });
        await settle();
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}{Escape}');
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('grid')).toBeNull();
        });
        const input = container.querySelector('input');
        expect(input).toHaveValue('2019-09-11');
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('RTL 下 ArrowLeft 移动到下一天', async () => {
        await renderNode(() => <ConfigProvider direction="rtl">{() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open />}</ConfigProvider>);
        await settle();
        await focusGrid();
        await userEvent.keyboard('{ArrowLeft}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-12');
    });

    it('月份选择器的输入框有名称，即使该类型没有 placeholder', async () => {
        await renderPicker({ type: 'month' });
        expect(screen.getByRole('combobox', { name: zh_CN.DatePicker.chooseDate })).toBeInTheDocument();
    });

    it('输入框由选择器的 aria-labelledby 命名', async () => {
        await renderNode(() => (
            <>
                <span id="birthday-label">Birthday</span>
                <DatePicker type="month" aria-labelledby="birthday-label" />
            </>
        ));
        expect(screen.getByRole('combobox', { name: 'Birthday' })).toBeInTheDocument();
    });

    it('dateRange 已选的起止日期格 aria-selected 为 true，网格声明可多选', async () => {
        await renderPicker({
            type: 'dateRange',
            defaultValue: [new Date(2021, 5, 10), new Date(2021, 5, 12)],
            defaultOpen: true,
            motion: false,
        });
        await settle();
        expect(getDay('2021-06-10')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-12')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-20')).toHaveAttribute('aria-selected', 'false');
        expect(getDay('2021-06-10').closest('[role="grid"]')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('presetPosition 为 left 但没有 presets 时 x-preset-position 为 null', async () => {
        await renderPicker({ defaultOpen: true, motion: false, presetPosition: 'left' });
        await settle();
        expect(getPopup()?.querySelector('[x-preset-position]')).toHaveAttribute('x-preset-position', 'null');
    });

    it('insetInput 的 dateTimeRange 四个内嵌输入框名称互不相同', async () => {
        await renderPicker({ type: 'dateTimeRange', defaultOpen: true, insetInput: true, motion: false });
        await settle();
        const names = within(getPopup() as HTMLElement)
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

    it('insetInput 的 dateTime 内嵌日期框与时间框有名称', async () => {
        await renderPicker({ type: 'dateTime', defaultOpen: true, insetInput: true, motion: false });
        await settle();
        const names = within(getPopup() as HTMLElement)
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        expect(names).toEqual([zh_CN.DatePicker.placeholder.dateTime, zh_CN.DatePicker.selectTime]);
    });

    it('范围输入框以 placeholder 作为名称', async () => {
        await renderPicker({ type: 'dateRange' });
        expect(screen.getAllByRole('combobox').map((input) => input.getAttribute('aria-label'))).toEqual([null, null]);
    });
});

describe('DatePicker year 类型', () => {
    it('面板只有一个以语言包命名的年份列表', async () => {
        await renderPicker({ type: 'year', defaultOpen: true, motion: false });
        const lists = within(getPopup() as HTMLElement).getAllByRole('listbox');
        expect(lists).toHaveLength(1);
        expect(lists[0]).toHaveAccessibleName(zh_CN.DatePicker.year);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-body`)).toBeNull();
    });

    it('defaultValue 以 yyyy 回显并选中该年', async () => {
        const { container } = await renderPicker({
            type: 'year',
            defaultValue: new Date(2021, 5, 10),
            defaultOpen: true,
            motion: false,
        });
        expect(container.querySelector('input')).toHaveValue('2021');
        expect(getYMSelected()).toEqual(['2021年']);
    });

    it('选择年份后 change 与 update:modelValue 收到当年 1 月 1 日，面板保持打开', async () => {
        const onChange = vi.fn<ChangeFn>();
        const onUpdate = vi.fn<EmitFn<'update:modelValue'>>();
        const { container } = await renderPicker({
            type: 'year',
            defaultValue: new Date(2021, 5, 10),
            defaultOpen: true,
            motion: false,
            onChange,
            'onUpdate:modelValue': onUpdate,
        });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
        expect(onUpdate.mock.calls).toEqual([[new Date(2023, 0, 1)]]);
        expect(container.querySelector('input')).toHaveValue('2023');
        expect(getYMSelected()).toEqual(['2023年']);
        expect(getPopup()).not.toBeNull();
    });

    it('输入年份后解析为当年 1 月 1 日', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'year', motion: false, onChange });
        await typeInto(container.querySelector('input') as HTMLInputElement, '2020');
        expect(onChange.mock.calls).toEqual([[new Date(2020, 0, 1), '2020']]);
    });

    it('空输入框按 Enter 回落到今年 1 月 1 日', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'year', motion: false, onChange });
        await userEvent.type(container.querySelector('input') as HTMLInputElement, '{Enter}');
        const year = new Date().getFullYear();
        expect(onChange.mock.calls).toEqual([[new Date(year, 0, 1), String(year)]]);
    });

    it('presets 的日期取该年 1 月 1 日，以 yyyy 回显', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'year',
            defaultOpen: true,
            motion: false,
            presets: [{ text: '2021', start: new Date(2021, 5, 10) }],
            onChange,
        });
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 0, 1), '2021']]);
        expect(container.querySelector('input')).toHaveValue('2021');
    });

    it('disabledDate 按每年的 1 月 1 日判断，列表与输入一致', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'year',
            defaultValue: new Date(2022, 0),
            defaultOpen: true,
            motion: false,
            disabledDate: (date: Date) => date < new Date(2021, 2, 1),
            onChange,
        });
        const years = within(getYMLists()[0]);
        expect(years.getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'true');
        expect(years.getByRole('option', { name: '2023' })).not.toHaveAttribute('aria-disabled', 'true');
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021');
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(input, '2023');
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
    });

    it('insetInput 的内嵌输入框以 yyyy 为占位符，与 month 一样以 chooseDate 命名', async () => {
        await renderPicker({ type: 'year', defaultOpen: true, insetInput: true, motion: false });
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        expect(inset).toHaveAttribute('placeholder', 'yyyy');
        expect(inset).toHaveAccessibleName(zh_CN.DatePicker.chooseDate);
    });

    it('YearAndMonth 的 year 类型选择年份不按月份调整，只通知一次', async () => {
        const onSelect = vi.fn<YearAndMonthEmitFn<'select'>>();
        await renderYearAndMonth({
            type: 'year',
            onSelect,
            currentYear: { left: 2021, right: 0 },
            currentMonth: { left: 6, right: 0 },
            disabledDate: (date: Date) => date.getMonth() === 5,
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
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({
            type: 'month',
            defaultOpen: true,
            motion: false,
            presets: [{ text: '6 月', start: new Date(2021, 5, 18, 10, 30) }],
            onChange,
        });
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
        expect(container.querySelector('input')).toHaveValue('2021-06');
    });

    it('空输入框按 Enter 回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'month', motion: false, onChange });
        await userEvent.type(container.querySelector('input') as HTMLInputElement, '{Enter}');
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
    });

    it('monthRange 空输入框按 Enter 两端回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'monthRange', motion: false, onChange });
        await userEvent.type(container.querySelector('input') as HTMLInputElement, '{Enter}');
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
        await renderPicker({ type: 'month', defaultValue: new Date(2022, 5), defaultOpen: true, disabledDate, motion: false });
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(disabledDate.mock.calls.filter(([date]) => date.getTime() !== new Date(date.getFullYear(), date.getMonth()).getTime())).toEqual([]);
        expect(within(getYMLists()[1]).getByRole('option', { name: '6月' })).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('DatePicker Vue 写法', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    describe('v-model 与 v-model:open', () => {
        it('选择日期后 v-model 回写，输入框显示新值', async () => {
            const { container } = await renderHost(Model, { defaultPickerValue: '2021-06-01', motion: false });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            await userEvent.click(getDay('2021-06-10'));
            await settle();
            expect(input).toHaveValue('2021-06-10');
        });

        it('单选清空发 undefined，范围清空发空数组', async () => {
            const onSingle = vi.fn<EmitFn<'update:modelValue'>>();
            const single = await renderPicker({ modelValue: baseDate, 'onUpdate:modelValue': onSingle });
            await fireEvent.mouseDown(single.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
            expect(onSingle.mock.calls).toEqual([[undefined]]);
            single.unmount();

            const onRange = vi.fn<EmitFn<'update:modelValue'>>();
            await renderPicker({
                type: 'dateRange',
                modelValue: [baseDate, addDays(baseDate, 3)],
                'onUpdate:modelValue': onRange,
            });
            await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
            expect(onRange.mock.calls).toEqual([[[]]]);
        });

        it('modelValue 为 null 时受控为空，选择后父组件不回写则保持为空', async () => {
            const onUpdate = vi.fn<EmitFn<'update:modelValue'>>();
            const { container } = await renderPicker({
                modelValue: null,
                defaultPickerValue: '2021-06-01',
                motion: false,
                'onUpdate:modelValue': onUpdate,
            });
            const input = container.querySelector('input') as HTMLInputElement;
            expect(input).toHaveValue('');
            await userEvent.click(input);
            await settle();
            await userEvent.click(getDay('2021-06-10'));
            await waitForClosed();
            expect(onUpdate).toHaveBeenCalledTimes(1);
            expect(input).toHaveValue('');
        });

        it('update:open 与 openChange 同时发出，受控 open 不随之改变', async () => {
            const onOpenChange = vi.fn<(open: boolean) => void>();
            const onUpdateOpen = vi.fn<(open: boolean) => void>();
            const { container } = await renderPicker({
                open: false,
                motion: false,
                onOpenChange,
                'onUpdate:open': onUpdateOpen,
            });
            await userEvent.click(container.querySelector('input') as HTMLElement);
            await settle();
            expect(onOpenChange.mock.calls).toEqual([[true]]);
            expect(onUpdateOpen.mock.calls).toEqual([[true]]);
            expect(getPopup()).toBeNull();
        });

        it('同一 tick 内修改 modelValue 与 timeZone，按新时区显示新值', async () => {
            const value = ref<DatePickerProps['modelValue']>(1683084540000 - 86400000);
            const timeZone = ref('GMT+00:00');
            const { container } = await renderNode(() => <DatePicker type="dateTime" modelValue={value.value} timeZone={timeZone.value} />);
            const input = container.querySelector('input') as HTMLInputElement;
            expect(input).toHaveValue('2023-05-02 03:29:00');
            value.value = 1683084540000;
            timeZone.value = 'GMT+05:00';
            await settle();
            expect(input).toHaveValue('2023-05-03 08:29:00');
        });
    });

    describe('事件', () => {
        it('键入未完成的文本不触发 @change，原生 change 也被遮住；选择日期时载荷为 (date, dateString)', async () => {
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderPicker({ defaultPickerValue: '2021-06-01', motion: false, onChange });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            await typeInto(input, '2021-0');
            await fireEvent.change(input);
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(getDay('2021-06-10'));
            expect(onChange).toHaveBeenCalledTimes(1);
            const [date, dateString] = onChange.mock.calls[0];
            expect(ymd(date as Date)).toBe('2021-06-10');
            expect(dateString).toBe('2021-06-10');
        });

        it('@focus 每次聚焦只触发一次，@blur 只在面板关闭时触发一次', async () => {
            const onFocus = vi.fn<EmitFn<'focus'>>();
            const onBlur = vi.fn<EmitFn<'blur'>>();
            const { container } = await renderPicker({ motion: false, onFocus, onBlur });
            const input = container.querySelector('input') as HTMLInputElement;
            await userEvent.click(input);
            await settle();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect((onFocus.mock.calls[0][0] as Event).type).toBe('focusin');
            await fireEvent.focusOut(input);
            expect(onBlur).not.toHaveBeenCalled();
            await fireEvent.mouseDown(document.body);
            await waitForClosed();
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('未声明的 @click 经 attrs 落在根 div，只触发一次', async () => {
            const onClick = vi.fn<(event: MouseEvent) => void>();
            await renderPicker({ motion: false, onClick });
            await userEvent.click(document.querySelector(`.${dp}`) as HTMLElement);
            expect(onClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('插槽', () => {
        it('#trigger 参数含展示数据、componentProps 与 onChange、onEnterPress、onClear', async () => {
            const onChange = vi.fn<ChangeFn>();
            const onClear = vi.fn<EmitFn<'clear'>>();
            const scopes: DatePickerTriggerSlotProps[] = [];
            await renderPicker(
                { modelValue: baseDate, placeholder: 'Pick', onChange, onClear },
                {
                    trigger: (scope) => {
                        const props = scope as unknown as DatePickerTriggerSlotProps;
                        scopes.push(props);
                        return (
                            <div>
                                <input aria-label="custom" value={props.inputValue ?? ''} onInput={(e: Event) => props.onChange((e.target as HTMLInputElement).value)} onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && props.onEnterPress((e.target as HTMLInputElement).value)} />
                                <button onClick={(e: MouseEvent) => props.onClear(e)}>clear</button>
                            </div>
                        );
                    },
                }
            );
            const scope = scopes[scopes.length - 1];
            expect(scope.value.map(ymd)).toEqual(['2019-09-08']);
            expect(scope.inputValue).toBeNull();
            expect(scope.placeholder).toBe('Pick');
            expect(scope.disabled).toBe(false);
            expect(scope.rangeInputFocus).toBeUndefined();
            expect(scope.componentProps.modelValue).toBe(baseDate);
            expect(scope.componentProps).not.toHaveProperty('trigger');

            const custom = screen.getByRole('textbox', { name: 'custom' }) as HTMLInputElement;
            await typeInto(custom, '2021-06-10');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][1]).toBe('2021-06-10');
            expect(scopes[scopes.length - 1].inputValue).toBe('2021-06-10');

            await fireEvent.keyDown(custom, { key: 'Enter', target: { value: '2021-06-12' } });
            await settle();
            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange.mock.calls[1][1]).toBe('2021-06-12');

            // onClear only reports the click; the custom input clears its text through onChange
            await userEvent.click(screen.getByRole('button', { name: 'clear' }));
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it('#fullDate 下日期格只保留 -day 与 -day-active 类', async () => {
            await renderPicker({ defaultValue: baseDate, defaultOpen: true, motion: false }, { fullDate: ({ dayNumber }) => <span>{String(dayNumber)}</span> });
            await settle();
            expect(Array.from(getDay('2019-09-08').classList).sort()).toEqual([`${dp}-day`, `${dp}-day-active`]);
            expect(Array.from(getDay('2019-09-09').classList)).toEqual([`${dp}-day`]);
        });

        it('#leftSlot 在面板容器最前，#rightSlot 在最后', async () => {
            await renderPicker({ defaultOpen: true, motion: false }, { leftSlot: () => <span>left</span>, rightSlot: () => <span>right</span> });
            await settle();
            const container = getPopup()?.querySelector(`.${dp}-container`) as HTMLElement;
            expect(container.firstElementChild).toHaveClass(`${dp}-leftSlot`);
            expect(container.firstElementChild).toHaveTextContent('left');
            expect(container.lastElementChild).toHaveClass(`${dp}-rightSlot`);
            expect(container.lastElementChild).toHaveTextContent('right');
        });

        it('#rangeSeparator 只改显示，rangeSeparator 仍用于解析键入的范围', async () => {
            const onChange = vi.fn<ChangeFn>();
            const { container } = await renderPicker({ type: 'dateRange', rangeSeparator: '~', motion: false, onChange }, { rangeSeparator: () => <span class="custom-separator">to</span> });
            expect(container.querySelector('.custom-separator')).toHaveTextContent('to');
            const [start, end] = container.querySelectorAll('input');
            await userEvent.click(start);
            await settle();
            await typeInto(start, '2021-08-06');
            await typeInto(end, '2021-08-15');
            expect(onChange.mock.lastCall?.[1]).toEqual(['2021-08-06', '2021-08-15']);
        });
    });

    describe('默认值与属性', () => {
        it('disabledDate 可经 semiGlobal 设默认值', async () => {
            semiGlobal.config.overrideDefaultProps = {
                DatePicker: { disabledDate: (date?: Date) => date?.getDate() === 15 },
            };
            await renderPicker({ defaultPickerValue: '2019-09-01', defaultOpen: true, motion: false });
            await settle();
            expect(getDay('2019-09-15')).toHaveClass(`${dp}-day-disabled`);
            expect(getDay('2019-09-16')).not.toHaveClass(`${dp}-day-disabled`);
        });

        it('不传 disabledDate 时年月面板与日期面板正常渲染', async () => {
            const error = vi.spyOn(console, 'error');
            const warn = vi.spyOn(console, 'warn');
            const month = await renderPicker({ type: 'month', defaultOpen: true, motion: false });
            await settle();
            expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
            month.unmount();
            await renderPicker({ defaultOpen: true, motion: false });
            await settle();
            expect(screen.getByRole('grid')).toBeInTheDocument();
            expect(error).not.toHaveBeenCalled();
            expect(warn).not.toHaveBeenCalled();
        });

        it('日期时间面板的时间列不带 timepicker 列类名，12 小时制多出 ampm 列', async () => {
            await renderPicker({
                type: 'dateTime',
                defaultValue: baseDate,
                motion: false,
                open: true,
                timePickerOpts: { use12Hours: true },
            });
            const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
            await userEvent.click(toTime);
            await settle();
            expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-body > div`)).toHaveLength(4);
            expect(document.querySelector('[class*="-list-hour"]')).toBeNull();
            expect(document.querySelector('[class*="undefined"]')).toBeNull();
        });

        it('月份网格以各自的月份标题命名，范围的两个网格名称不同', async () => {
            await renderPicker({
                type: 'dateRange',
                defaultPickerValue: '2021-06-01',
                defaultOpen: true,
                motion: false,
            });
            await settle();
            const [left, right] = screen.getAllByRole('grid');
            expect(left).toHaveAccessibleName(getNavTitle('left') as string);
            expect(right).toHaveAccessibleName(getNavTitle('right') as string);
            expect(getNavTitle('left')).not.toBe(getNavTitle('right'));
        });

        it('预设按钮内不含 div', async () => {
            await renderPicker({
                defaultOpen: true,
                motion: false,
                presets: [{ text: 'Today', start: baseDate, end: baseDate }],
            });
            await settle();
            const [button] = getPresetButtons();
            expect(button).toHaveTextContent('Today');
            expect(button.querySelector('div')).toBeNull();
        });

        it('范围类型下 aria 控制键落在两个输入框，id、title 与 data-* 落在根 div', async () => {
            await renderPicker({
                type: 'dateRange',
                id: 'period',
                title: 'tip',
                'data-testid': 'dp',
                'aria-describedby': 'help',
            });
            const root = document.querySelector(`.${dp}`);
            expect(root).toHaveAttribute('id', 'period');
            expect(root).toHaveAttribute('title', 'tip');
            expect(root).toHaveAttribute('data-testid', 'dp');
            expect(root).not.toHaveAttribute('aria-describedby');
            for (const input of screen.getAllByRole('combobox')) {
                expect(input).toHaveAttribute('aria-describedby', 'help');
                expect(input).not.toHaveAttribute('id');
            }
        });

        it('单选传 role="region" 落在根 div', async () => {
            await renderPicker({ role: 'region', 'aria-labelledby': 'lbl' });
            expect(document.querySelector(`.${dp}`)).toHaveAttribute('role', 'region');
        });

        it('自定义触发器加外部 label 时 button 名称为该 label', async () => {
            await renderNode(() => (
                <>
                    <span id="birthday">生日</span>
                    <DatePicker aria-labelledby="birthday">
                        {{
                            trigger: () => <span>pick</span>,
                        }}
                    </DatePicker>
                </>
            ));
            await settle();
            const trigger = screen.getByRole('button', { name: '生日' });
            expect(trigger).not.toHaveAttribute('aria-label');
            expect(document.querySelector(`.${dp}`)).not.toHaveAttribute('aria-labelledby');
        });

        it('日期面板每格每次只调一次 disabledDate', async () => {
            const disabledDate = vi.fn<(date: Date) => boolean>(() => false);
            await renderPicker({ defaultPickerValue: '2019-09-01', defaultOpen: true, motion: false, disabledDate });
            await settle();
            expect(getDay('2019-09-15')).toBeInTheDocument();
            expect(disabledDate.mock.calls.filter(([date]) => ymd(date) === '2019-09-15')).toHaveLength(1);
        });

        it('年月面板每个月份每次只调一次 disabledDate', async () => {
            const disabledDate = vi.fn<(date: Date) => boolean>(() => false);
            await renderYearAndMonth({ disabledDate });
            const june = disabledDate.mock.calls.filter(([date]) => date.getFullYear() === 2021 && date.getMonth() === 5);
            expect(june).toHaveLength(1);
        });

        it('LocaleProvider 的 ja_JP 用于面板名称与预设标题', async () => {
            await renderNode(() => <LocaleProvider locale={ja_JP}>{() => <DatePicker defaultOpen motion={false} presetPosition="left" presets={[{ text: 'Today', start: baseDate, end: baseDate }]} />}</LocaleProvider>);
            expect(await screen.findByRole('dialog', { name: ja_JP.DatePicker.panel.date })).toBeInTheDocument();
            expect(screen.getByText(ja_JP.DatePicker.presets)).toBeInTheDocument();
        });
    });

    it('KeepAlive 切走再切回后面板关闭，aria-expanded 为 false，不发 blur', async () => {
        const show = ref(true);
        const onOpenChange = vi.fn<(open: boolean) => void>();
        const onBlur = vi.fn<EmitFn<'blur'>>();
        const Other = defineComponent({ render: () => <div>other</div> });
        await renderNode(() => (
            <KeepAlive>
                {{
                    default: () => [show.value ? <DatePicker key="picker" motion={false} onOpenChange={onOpenChange} onBlur={onBlur} /> : <Other key="other" />],
                }}
            </KeepAlive>
        ));
        await userEvent.click(screen.getByRole('combobox'));
        await settle();
        expect(getPopup()).not.toBeNull();

        show.value = false;
        await settle();
        show.value = true;
        await settle();
        await waitForClosed();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('类型：change 载荷、type 与 timePickerOpts 的取值范围', () => {
        expectTypeOf<DatePickerEmits['change']>().toEqualTypeOf<[date: Date | Date[] | undefined, dateString: string | string[]]>();
        expectTypeOf<Extract<DatePickerType, 'year'>>().toEqualTypeOf<'year'>();
        expectTypeOf<DatePickerTimePickerOpts>().not.toHaveProperty('format');
        expectTypeOf<DatePickerTimePickerOpts>().not.toHaveProperty('timeStampValue');
        expectTypeOf<DatePickerEmits['blur']>().toEqualTypeOf<[event?: MouseEvent]>();
        expectTypeOf<DatePickerEmits['clickOutSide']>().toEqualTypeOf<[event: MouseEvent]>();
        expectTypeOf<DatePickerEmits['focus'][0]>().toEqualTypeOf<FocusEvent | MouseEvent | KeyboardEvent>();
        expectTypeOf<DatePickerTriggerSlotProps['rangeInputFocus']>().toEqualTypeOf<'rangeStart' | 'rangeEnd' | false | undefined>();
        expectTypeOf<DatePickerTriggerSlotProps['inputValue']>().toEqualTypeOf<string | null>();
        expectTypeOf<NonNullable<DatePickerProps['yearAndMonthOpts']>>().not.toHaveProperty('list');
        expectTypeOf<NonNullable<DatePickerProps['yearAndMonthOpts']>>().not.toHaveProperty('selectedIndex');
    });

    it('范围类型传 role 时落在根元素，不被 group 覆盖', async () => {
        const { container } = await renderPicker({ type: 'dateRange', 'aria-label': '期间', role: 'toolbar' });
        expect(container.firstElementChild).toHaveAttribute('role', 'toolbar');
        expect(container.querySelector('[role="group"]')).toBeNull();
    });

    it('类型：foundation 状态、disabledDate 与预设按运行时声明', () => {
        expectTypeOf<DatePickerFoundationState['inputValue']>().toEqualTypeOf<string | null>();
        expectTypeOf<DatePickerFoundationState['rangeInputFocus']>().toEqualTypeOf<'rangeStart' | 'rangeEnd' | false | undefined>();
        expectTypeOf<Parameters<DatePickerDisabledDateType>[0]>().toEqualTypeOf<Date>();
        expectTypeOf<{ text: string; start: null; end: null }>().toExtend<DatePickerPresetType>();
    });
});

describe('DatePicker 面板开合与焦点', () => {
    const range = () => [new Date(2019, 7, 10), new Date(2019, 7, 20)];

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('ConfigProvider 的 timeZone 优先于全局默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { timeZone: 'UTC' } };
        const { container } = await renderNode(() => <ConfigProvider timeZone="Asia/Tokyo">{() => <DatePicker type="dateTime" modelValue={new Date(Date.UTC(2021, 0, 1))} />}</ConfigProvider>);
        expect(container.querySelector('input')).toHaveValue('2021-01-01 09:00:00');
    });

    it('没有 ConfigProvider 时读全局默认的 timeZone', async () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { timeZone: 'Asia/Tokyo' } };
        const { container } = await renderPicker({ type: 'dateTime', modelValue: new Date(Date.UTC(2021, 0, 1)) });
        expect(container.querySelector('input')).toHaveValue('2021-01-01 09:00:00');
    });

    it('打开后变为 disabled 时关闭面板并上报 openChange(false)，重新启用不再弹出', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const view = await renderPicker({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPopup()).not.toBeNull();
        await view.rerender({ defaultOpen: true, disabled: true, motion: false, onOpenChange });
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        await view.rerender({ defaultOpen: true, disabled: false, motion: false, onOpenChange });
        expect(getPopup()).toBeNull();
    });

    it('面板打开后再次点击输入框不重复上报 openChange(true)', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        const { container } = await renderPicker({ type: 'dateRange', motion: false, onOpenChange });
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(startInput);
        await userEvent.click(startInput);
        await userEvent.click(endInput);
        expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('needConfirm 时按 Esc 关闭面板触发 cancel', async () => {
        const onCancel = vi.fn<EmitFn<'cancel'>>();
        await renderPicker({ type: 'dateTime', needConfirm: true, defaultValue: new Date(2019, 8, 11), defaultOpen: true, motion: false, onCancel });
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitForClosed();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('面板关闭时 Tab 经过两个范围输入框，再点开始框打开后，结束日期之后的日期仍可选', async () => {
        const { container } = await renderPicker({ type: 'dateRange', defaultValue: range(), motion: false });
        await userEvent.tab();
        await userEvent.tab();
        await settle();
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('受控 open 时 Tab 经过两个范围输入框，再点开始框并由外部打开后，结束日期之后的日期仍可选', async () => {
        const view = await renderPicker({ type: 'dateRange', modelValue: range(), open: false, motion: false });
        await userEvent.tab();
        await userEvent.tab();
        await settle();
        await userEvent.click(view.container.querySelector('input') as HTMLInputElement);
        await view.rerender({ open: true });
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('焦点在范围清除按钮上按 ArrowDown 不打开面板', async () => {
        const onOpenChange = vi.fn<EmitFn<'openChange'>>();
        await renderPicker({ type: 'dateRange', defaultValue: range(), motion: false, onOpenChange });
        screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('受控值被外部清空时，持焦的范围清除按钮把焦点交给开始输入框', async () => {
        const view = await renderPicker({ type: 'dateRange', modelValue: range(), motion: false });
        screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus();
        await view.rerender({ type: 'dateRange', modelValue: [], motion: false });
        expect(view.container.querySelector('input')).toHaveFocus();
    });

    it('type="monthRange" 的 expose focus 聚焦输入框，blur 移走焦点', async () => {
        const picker = ref<DatePickerHandle>();
        const { container } = await renderNode(() => <DatePicker ref={picker} type="monthRange" motion={false} />);
        picker.value?.focus();
        await settle();
        expect(container.querySelector('input')).toHaveFocus();
        picker.value?.blur();
        await settle();
        expect(container.querySelector('input')).not.toHaveFocus();
    });

    it('#trigger 时 expose focus 聚焦自定义触发器', async () => {
        const picker = ref<DatePickerHandle>();
        await renderNode(() => (
            <DatePicker ref={picker} motion={false}>
                {{
                    trigger: () => <span>pick</span>,
                }}
            </DatePicker>
        ));
        picker.value?.focus();
        await settle();
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate })).toHaveFocus();
    });

    it('insetInput 面板打开时 expose focus、blur 作用于面板内的输入框', async () => {
        const picker = ref<DatePickerHandle>();
        await renderNode(() => <DatePicker ref={picker} insetInput defaultOpen motion={false} />);
        await waitForPanelOpened();
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        inset.blur();
        picker.value?.focus();
        await settle();
        expect(inset).toHaveFocus();
        picker.value?.blur();
        await settle();
        expect(inset).not.toHaveFocus();
    });

    it('单选类型开启 insetInput 时打开面板只触发一次 focus，且不带 rangeType', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const { container } = await renderPicker({ insetInput: true, motion: false, onFocus });
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        await waitForPanelOpened();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBeUndefined();
    });
});

describe('DatePicker 值与输入的边界', () => {
    it('键入无法解析的日期按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ motion: false, onChange });
        const input = container.querySelector('input') as HTMLInputElement;
        await typeInto(input, '2021-13');
        await userEvent.type(input, '{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateRange 只填开始框按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeFn>();
        const { container } = await renderPicker({ type: 'dateRange', motion: false, onChange });
        const startInput = container.querySelector('input') as HTMLInputElement;
        await typeInto(startInput, '2021-08-01');
        await userEvent.type(startInput, '{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('null 清空预设与范围中的 null 端点不发出无法解析的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await renderPicker({ type: 'dateRange', modelValue: [new Date(2019, 7, 10), null], motion: false });
        await renderPicker({ type: 'dateRange', defaultValue: [new Date(2019, 7, 10), new Date(2019, 7, 20)], defaultOpen: true, motion: false, presets: [{ text: 'clear', start: null, end: null }] });
        await userEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(warn.mock.calls.map(([message]) => String(message))).toEqual([]);
    });

    it('父组件重渲染时传入内容相同的新 defaultPickerValue，面板停在当前月份', async () => {
        const tick = ref(0);
        await renderNode(() => <DatePicker data-tick={tick.value} defaultPickerValue={new Date(2022, 8, 1)} defaultOpen motion={false} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        tick.value += 1;
        await settle();
        expect(getDay('2022-10-15')).not.toBeNull();
    });

    it('Form inset 标签下 dateRange 的 group 名称指向渲染出的标签', async () => {
        await renderNode(() => <Form labelPosition="inset">{() => <FormDatePicker field="range" label="区间" type="dateRange" />}</Form>);
        const group = screen.getByRole('group', { name: '区间' });
        expect(document.getElementById(group.getAttribute('aria-labelledby') as string)).not.toBeNull();
    });

    it('Tooltip 包住的 DatePicker 只在输入框停留，根元素不是 Tab 停靠点', async () => {
        const { container } = await renderNode(() => <Tooltip>{{ content: () => 'tip', default: () => <DatePicker /> }}</Tooltip>);
        await userEvent.tab();
        expect(container.querySelector('input')).toHaveFocus();
    });
});
