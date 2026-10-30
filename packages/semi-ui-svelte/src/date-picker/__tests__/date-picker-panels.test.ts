import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { addDays } from 'date-fns';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getPanel, getPopup, getYMLists, setupPinned } from './date-picker-dom-utils';
import SlotsFixture, { type SlotsFixtureStore } from './date-picker-slots-fixture.svelte';
import { changes, dp, getDay, getInputs, getNavTitle, getRoot, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const weekRows = (side: string) => getPanel(side).querySelectorAll(`.${dp}-week`);
const rangeWrapper = (side: 'start' | 'end') => getRoot().querySelector(`.${dp}-range-input-wrapper-${side}`) as HTMLElement;
const navButton = (side: string, label: string) => getPanel(side).querySelector(`[aria-label="${label}"]`) as HTMLElement;
const titleButton = () => getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement;
const backButton = () => getPopup().querySelector(`.${dp}-yearmonth-header button`) as HTMLElement;
const timeSwitch = (side: string) => navButton(side, zh_CN.DatePicker.switchToTime);

/** The panel focuses its start date input once Popover reports it visible, which would land after a focus set by the test */
async function untilPanelFocused() {
    await vi.waitFor(() => expect(getPopup()).toContainElement(document.activeElement as HTMLElement));
    await settle();
}

describe('Svelte DatePicker 年月面板与周行数', () => {
    it('年月面板的返回按钮回到日期面板', async () => {
        await setup({ value: new Date(2021, 5, 1), open: true, props: { type: 'date' } });
        await click(titleButton());
        expect(getPanel('left').querySelector(`.${dp}-navigation`)).toBeNull();
        await click(backButton());
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('年月面板只移动面板，不改值', async () => {
        const { store } = await setup({ value: new Date(2021, 5, 1), open: true, props: { type: 'date', autoSwitchDate: false } });
        await click(titleButton());
        const [yearList, monthList] = getYMLists();
        await click(within(yearList).getByRole('option', { name: '2022' }));
        await click(within(monthList).getByRole('option', { name: '3月' }));
        await click(backButton());
        expect(getNavTitle('left')).toBe('2022年 3月');
        expect(changes(store)).toEqual([]);
    });

    it('两侧按月份渲染周行数', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        // June and July 2021 both need five week rows
        expect(weekRows('left')).toHaveLength(5);
        expect(weekRows('right')).toHaveLength(5);
    });

    it('切换月份时周行数随之变化', async () => {
        await setup({ value: new Date(2019, 8, 8), open: true, props: { type: 'date' } });
        // September 2019 needs five week rows, June 2019 needs six
        expect(weekRows('left')).toHaveLength(5);
        for (let i = 0; i < 3; i++) {
            await click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        }
        expect(getNavTitle('left')).toBe('2019年 6月');
        expect(weekRows('left')).toHaveLength(6);
    });

    it('单选下悬停日期不改类名', async () => {
        await setup({ open: true, props: { type: 'date', defaultPickerValue: '2021-06-01' } });
        const day = getDay('2021-06-10');
        const className = day.className;
        await fireEvent.mouseEnter(day);
        expect(day.className).toBe(className);
        await fireEvent.mouseLeave(day);
        expect(day.className).toBe(className);
    });

    it('悬停已选的 offset 范围', async () => {
        const { store } = await setupPinned({
            props: { type: 'dateRange', defaultPickerValue: '2021-06-01', endDateOffset: (date) => addDays(date, 1), startDateOffset: (date) => addDays(date, -1) },
        });
        await click(getDay('2021-06-10'));
        expect(changes(store)).toEqual(['change 2021-06-09 00:00:00|2021-06-11 00:00:00 ["2021-06-09","2021-06-11"]']);
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-selectedrange-hover`);
        await userEvent.unhover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).not.toHaveClass(`${dp}-day-selectedrange-hover`);
    });
});

describe('Svelte DatePicker 时间面板', () => {
    it('时间面板选择分钟', async () => {
        const { store } = await setup({ value: new Date(2021, 5, 1, 10, 30), open: true, props: { type: 'dateTime' } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const [, minuteList] = getPopup().querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
        await click(within(minuteList).getAllByRole('option', { name: '45' })[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-01 10:45:00 "2021-06-01 10:45:00"');
    });

    it('dateTimeRange 起止同一天时两侧的时间面板', async () => {
        await setup({ value: [new Date(2021, 5, 15, 10, 0), new Date(2021, 5, 15, 18, 0)], open: true, props: { type: 'dateTimeRange' } });
        await click(timeSwitch('left'));
        await click(timeSwitch('right'));
        expect(getPopup().querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        expect(timeSwitch('left')).toHaveTextContent('10:00:00');
        expect(timeSwitch('right')).toHaveTextContent('18:00:00');
    });
});

describe('Svelte DatePicker 输入框焦点通知', () => {
    it('输入框聚焦发 focus，失焦不发 blur', async () => {
        const { store } = await setup({ props: { type: 'date' } });
        const input = getInputs()[0];
        input.focus();
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toHaveLength(1);
        input.blur();
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual([]);
    });
});

describe('Svelte DatePicker 范围输入框的点击与聚焦', () => {
    it('范围输入框的后缀图标', async () => {
        await setup({ open: true, props: { type: 'dateRange' } });
        expect(getRoot().querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar`)).not.toBeNull();
    });

    it('dateTimeRange 的后缀图标是日历时钟', async () => {
        await setup({ props: { type: 'dateTimeRange' } });
        expect(getRoot().querySelector(`.${dp}-range-input-suffix .${BASE_CLASS_PREFIX}-icon-calendar_clock`)).not.toBeNull();
    });

    it('点击开始输入框外层聚焦开始并打开面板', async () => {
        await setup({ props: { type: 'dateRange' } });
        await click(rangeWrapper('start'));
        expect(rangeWrapper('start')).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('点击结束输入框外层聚焦结束', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        await click(rangeWrapper('end'));
        expect(rangeWrapper('end')).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(rangeWrapper('start')).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('dateRange 点击 prefix snippet 从开始输入框开始', async () => {
        const store = createStore<SlotsFixtureStore>({ props: { type: 'dateRange', motion: false }, prefix: true });
        render(SlotsFixture, { props: { store } });
        await settle();
        await click(getRoot().querySelector(`.${dp}-range-input-prefix`) as HTMLElement);
        expect(rangeWrapper('start')).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('结束输入框按 Enter 补全无法解析的输入', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await fireEvent.input(endInput, { target: { value: '2021-06-1' } });
        await settle();
        await fireEvent.keyDown(endInput, { key: 'Enter' });
        await settle();
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(changes(store)).toEqual([]);
    });
});

describe('Svelte DatePicker insetInput 的范围聚焦', () => {
    const value = [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)];
    const insetInputs = (placeholder: string) => Array.from(getPopup().querySelectorAll<HTMLInputElement>(`input[placeholder="${placeholder}"]`));

    it('dateTimeRange 聚焦结束日期输入框后点击日期选结束', async () => {
        const { store } = await setup({ value, open: true, props: { type: 'dateTimeRange', insetInput: true } });
        const [, endDate] = insetInputs('yyyy-MM-dd');
        await untilPanelFocused();
        endDate.focus();
        await settle();
        await click(getDay('2021-06-20'));
        expect(changes(store).at(-1)).toBe('change 2021-06-01 10:00:00|2021-06-20 18:00:00 ["2021-06-01 10:00:00","2021-06-20 18:00:00"]');
    });

    it('聚焦时间与日期输入框切换两侧面板', async () => {
        await setup({ value, open: true, props: { type: 'dateTimeRange', insetInput: true } });
        await untilPanelFocused();
        const [startDate] = insetInputs('yyyy-MM-dd');
        const [startTime] = insetInputs('HH:mm:ss');
        startTime.focus();
        await settle();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        startDate.focus();
        await settle();
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
    });
});

describe('Svelte DatePicker monthRange 的禁用月份', () => {
    const range = ['2022-06', '2022-08'];
    const pickYear = (year: string) => click(within(getYMLists()[0]).getByRole('option', { name: year }));

    it('选择年份时跳过禁用的月份', async () => {
        const { store } = await setup({ value: ['2021-06', '2021-08'], open: true, props: { type: 'monthRange', disabledDate: (date) => date.getMonth() === 5 } });
        await pickYear('2022');
        expect(changes(store).at(-1)).toBe('change 2022-07-01 00:00:00|2023-08-01 00:00:00 ["2022-07","2023-08"]');
    });

    it('一年中只有一个月可用', async () => {
        await setup({ value: range, open: true, props: { type: 'monthRange', disabledDate: (date) => date.getFullYear() === 2022 && date.getMonth() > 0 } });
        const enabledMonths = within(getYMLists()[1])
            .getAllByRole('option')
            .filter((option) => option.getAttribute('aria-disabled') === 'false');
        expect(enabledMonths).toHaveLength(1);
        expect(enabledMonths[0]).toHaveTextContent('1');
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022年' })).toHaveAttribute('aria-disabled', 'false');
    });

    it('两侧月份都禁用时找到可用月份', async () => {
        const { store } = await setup({ value: range, open: true, props: { type: 'monthRange', disabledDate: (date) => date.getFullYear() === 2022 && (date.getMonth() === 5 || date.getMonth() === 7) } });
        await pickYear('2022年');
        expect(changes(store).at(-1)).toBe('change 2022-07-01 00:00:00|2022-07-01 00:00:00 ["2022-07","2022-07"]');
    });

    it('仅对侧月份禁用', async () => {
        const { store } = await setup({ value: range, open: true, props: { type: 'monthRange', disabledDate: (date) => date.getFullYear() === 2022 && date.getMonth() === 7 } });
        await pickYear('2022年');
        expect(changes(store).at(-1)).toBe('change 2022-06-01 00:00:00|2022-06-01 00:00:00 ["2022-06","2022-06"]');
    });

    it('在当前月份之前查找可用月份', async () => {
        const { store } = await setup({ value: ['2023-06', '2023-08'], open: true, props: { type: 'monthRange', disabledDate: (date) => date.getFullYear() === 2023 && date.getMonth() >= 5 } });
        await pickYear('2023年');
        expect(changes(store).at(-1)).toBe('change 2023-01-01 00:00:00|2023-01-01 00:00:00 ["2023-01","2023-01"]');
    });
});
