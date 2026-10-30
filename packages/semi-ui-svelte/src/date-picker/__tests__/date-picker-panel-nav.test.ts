import { screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { addDays } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { click, getPanel, getPopup, getWeekDays, getYMLists, getYMSelected, ymd } from './date-picker-dom-utils';
import { changes, dp, getDay, getInputs, getNavTitle, getSelectedDays, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const juneToJuly = [new Date(2021, 5, 1), new Date(2021, 6, 15)];

const navButton = (side: string, name: string) => getPanel(side).querySelector(`[aria-label="${name}"]`) as HTMLElement;
const titleButton = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month button`) as HTMLElement;
const panels = (store: { log: string[] }) => store.log.filter((entry) => entry.startsWith('panel'));

describe('Svelte DatePicker 面板导航', () => {
    it('syncSwitchMonth 下两侧一起切换并只报告一次 onPanelChange', async () => {
        const { store } = await setup({ value: juneToJuly, open: true, props: { type: 'dateRange', syncSwitchMonth: true } });
        await click(navButton('left', zh_CN.DatePicker.nextMonth));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(panels(store)).toEqual(['panel 2021-07-01 00:00:00|2021-08-15 00:00:00 ["2021-07-01","2021-08-15"]']);
    });

    it('范围选择器切换右面板时 onPanelChange 报告两侧实际面板日期', async () => {
        const { store } = await setup({ value: juneToJuly, open: true, props: { type: 'dateRange' } });
        await click(navButton('right', zh_CN.DatePicker.nextMonth));
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 8月');
        expect(panels(store)).toEqual(['panel 2021-06-01 00:00:00|2021-08-15 00:00:00 ["2021-06-01","2021-08-15"]']);
    });

    it('defaultPickerValue 按 format 解析，数组形式的变化会移动面板', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '01/02/2021', format: 'dd/MM/yyyy' } });
        expect(getNavTitle('left')).toBe('2021年 2月');
        expect(getNavTitle('right')).toBe('2021年 3月');

        store.props.defaultPickerValue = [new Date(2022, 4, 1), new Date(2022, 7, 1)];
        await settle();
        expect(getNavTitle('left')).toBe('2022年 5月');
        expect(getNavTitle('right')).toBe('2022年 8月');

        store.props.defaultPickerValue = '10.03.2021';
        store.props.format = 'dd.MM.yyyy';
        await settle();
        expect(getNavTitle('left')).toBe('2021年 3月');
    });

    it('范围两侧的上一年与下一年', async () => {
        await setup({ value: juneToJuly, open: true, props: { type: 'dateRange' } });
        await click(navButton('left', zh_CN.DatePicker.prevYear));
        expect(getNavTitle('left')).toBe('2020年 6月');
        await click(navButton('right', zh_CN.DatePicker.nextYear));
        expect(getNavTitle('right')).toBe('2022年 7月');
    });

    it('范围两端同月时右侧显示下一个月', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
    });

    it('范围倒序时按起止顺序调整面板月份', async () => {
        await setup({ value: [new Date(2021, 8, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-09-01')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('倒序的范围按顺序高亮', async () => {
        await setup({ value: [new Date(2021, 5, 15), new Date(2021, 5, 1)], open: true, props: { type: 'dateRange' } });
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-inrange`);
    });

    it('切换上一月与下一月时选中日跟随', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date' } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 9月');
        expect(changes(store).map((entry) => entry.split(' ').at(-1))).toEqual(['"2019-08-08"', '"2019-09-08"']);
    });

    it('范围类型下周行数随月份变化', async () => {
        await setup({ value: [new Date(2021, 1, 1), new Date(2021, 2, 15)], open: true, props: { type: 'dateRange' } });
        const weekRows = (side: string) => getPanel(side).querySelectorAll(`.${dp}-week`);
        expect(getNavTitle('right')).toBe('2021年 3月');
        expect(weekRows('right')).toHaveLength(5);
        await click(titleButton('left'));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        // May 2021 needs six week rows
        await click(navButton('right', zh_CN.DatePicker.nextMonth));
        await click(navButton('right', zh_CN.DatePicker.nextMonth));
        expect(getNavTitle('right')).toBe('2021年 5月');
        expect(weekRows('right')).toHaveLength(6);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
    });
});

describe('Svelte DatePicker 年月面板', () => {
    it('年月面板选择后返回日期面板', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date' } });
        await click(titleButton('left'));
        const [yearList, monthList] = getYMLists();
        await click(within(monthList).getByRole('option', { name: '4月' }));
        await click(within(yearList).getByRole('option', { name: '2023' }));
        await click((getPopup() as HTMLElement).querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2023年 4月');
    });

    it('范围左侧的年月面板：选年与选月各自生效', async () => {
        await setup({ value: [new Date(2021, 2), new Date(2021, 8)], open: true, props: { type: 'dateRange' } });
        await click(titleButton('left'));
        const [yearList, monthList] = getYMLists(getPanel('left'));
        await click(within(yearList).getByRole('option', { name: '2023' }));
        expect(getNavTitle('left')).toBe('2023年 3月');
        await click(within(monthList).getByRole('option', { name: '6月' }));
        expect(getNavTitle('left')).toBe('2023年 6月');
    });

    it('年月面板的打开侧', async () => {
        await setup({ value: juneToJuly, open: true, props: { type: 'dateRange' } });
        const monthGrid = (getPopup() as HTMLElement).querySelector(`.${dp}-month-grid`);
        await click(titleButton('right'));
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'right');
        await click(titleButton('left'));
        expect(monthGrid).toHaveAttribute('x-panel-yearandmonth-open-type', 'both');
    });

    it('左侧切到与右侧同月时右侧后移', async () => {
        await setup({ value: juneToJuly, open: true, props: { type: 'dateRange' } });
        await click(titleButton('left'));
        const [, monthList] = getYMLists(getPanel('left'));
        await click(within(monthList).getByRole('option', { name: '7月' }));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('范围左侧显示年份选择器，右侧不显示', async () => {
        await setup({ value: juneToJuly, open: true, props: { type: 'dateRange' } });
        await click(titleButton('left'));
        expect(getPanel('left').querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getPanel('right').querySelector(`.${dp}-yam`)).toBeNull();
        expect(getYMSelected(getPanel('left'))).toEqual(['2021年', '6月']);
        await click(getPanel('left').querySelector(`.${dp}-yearmonth-header button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
    });
});

describe('Svelte DatePicker autoSwitchDate', () => {
    it('date 切换月份时选中日跟随，面板保持打开', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date', autoSwitchDate: true } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(changes(store)).toEqual(['change 2019-10-08 00:00:00 "2019-10-08"']);
        expect(getInputs()[0]).toHaveValue('2019-10-08');
        expect(getPopup()).not.toBeNull();
    });

    it('dateTime 保留时间', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', autoSwitchDate: true } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(changes(store)).toEqual(['change 2019-10-08 08:08:08 "2019-10-08 08:08:08"']);
    });

    it('日期不跟进禁用日', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date', autoSwitchDate: true, disabledDate: () => true } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(changes(store)).toEqual([]);
        expect(getInputs()[0]).toHaveValue(ymd(baseDate));
    });

    it('dateRange 切换月份不改值也不报 onChange', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange', autoSwitchDate: true } });
        await click(navButton('left', zh_CN.DatePicker.nextMonth));
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(changes(store)).toEqual([]);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });
});

describe('Svelte DatePicker 日期格', () => {
    it('悬停：选了开始后预览范围', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        await click(getDay('2021-06-08'));
        const hoverCls = `${dp}-day-hoverday-around-singleselected`;
        await userEvent.hover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).toHaveClass(hoverCls);
        await userEvent.unhover(getDay('2021-06-12'));
        expect(getDay('2021-06-12')).not.toHaveClass(hoverCls);
    });

    it('悬停：带 offset 时预览整个范围', async () => {
        await setup({
            open: true,
            props: { type: 'dateRange', defaultPickerValue: '2021-06-01', endDateOffset: (date) => addDays(date, 2), startDateOffset: (date) => addDays(date, -2) },
        });
        await userEvent.hover(getDay('2021-06-10'));
        expect(getDay('2021-06-10')).toHaveClass(`${dp}-day-hoverday`);
        expect(getDay('2021-06-08')).toHaveClass(`${dp}-day-offsetrange-start`);
        expect(getDay('2021-06-12')).toHaveClass(`${dp}-day-offsetrange-end`);
        expect(getDay('2021-06-09')).toHaveClass(`${dp}-day-inoffsetrange`);
        expect(getDay('2021-06-13')).not.toHaveClass(`${dp}-day-inoffsetrange`);
    });

    it('悬停：已有范围时悬停的格子带 inhover', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange' } });
        await userEvent.hover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).toHaveClass(`${dp}-day-inhover`);
        await userEvent.unhover(getDay('2021-06-20'));
        expect(getDay('2021-06-20')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('带 offset 时点击选中整个范围', async () => {
        const { store } = await setup({
            open: true,
            props: { type: 'dateRange', defaultPickerValue: '2021-06-01', endDateOffset: (date) => addDays(date, 2), startDateOffset: (date) => addDays(date, -2) },
        });
        await click(getDay('2021-06-10'));
        expect(changes(store)).toContain('change 2021-06-08 00:00:00|2021-06-12 00:00:00 ["2021-06-08","2021-06-12"]');
    });

    it('日期格渲染与选择', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date' } });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(30);
        expect(getDay('2019-09-08')).toHaveAttribute('aria-selected', 'true');
        await click(getDay('2019-09-11'));
        expect(changes(store)).toEqual(['change 2019-09-11 00:00:00 "2019-09-11"']);
        expect(getInputs()[0]).toHaveValue('2019-09-11');
    });

    it('dateRange 选完起止日期才触发 onChange', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        await click(getDay('2021-06-01'));
        expect(changes(store)).toEqual([]);
        await click(getDay('2021-06-30'));
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-30 00:00:00 ["2021-06-01","2021-06-30"]']);
    });

    it('dateRange 的 rangeEnd 早于 rangeStart 时重置起始值并聚焦起始输入框', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 10), new Date(2021, 5, 20)], props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await click(endInput);
        expect(getPopup()).not.toBeNull();
        await click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-05');
        expect(getDay('2021-06-05')).toHaveClass(`${dp}-day-selected-end`);
        expect(changes(store)).toEqual([]);
        expect(startInput).toHaveFocus();
    });

    it('高亮今天', async () => {
        await setup({ open: true, props: { type: 'date' } });
        const today = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-day-today`);
        expect(today).toHaveLength(1);
        expect(today[0]).toHaveAttribute('aria-label', ymd(new Date()));
    });

    it('点击禁用日期不选中，面板保持打开', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date', disabledDate: (date) => new Date(date).getDate() === 15 } });
        const disabledDay = getDay('2019-09-15');
        expect(disabledDay).toHaveClass(`${dp}-day-disabled`);
        expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
        await click(disabledDay);
        expect(changes(store)).toEqual([]);
        expect(getSelectedDays()).toEqual(['2019-09-08']);
        expect(getPopup()).not.toBeNull();
    });

    it('多选追加日期后的显示文本', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'date', multiple: true } });
        await click(getDay('2021-06-20'));
        expect(getInputs()[0]).toHaveValue('2021-06-01,2021-06-15,2021-06-20');
    });

    it('weekStartsOn 为 0（周日）：表头与首格', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date', weekStartsOn: 0 } });
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual(['日', '一', '二', '三', '四', '五', '六']);
        // 2019-09-01 is a Sunday, the first cell of the first week
        expect(getWeekDays('left', 0)[0]).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('weekStartsOn 为 1 时日期格位置随之移动', async () => {
        // January 2021 starts on Friday
        await setup({ value: new Date(2021, 0, 1), open: true, props: { type: 'date', weekStartsOn: 1 } });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-day[aria-label]`)).toHaveLength(31);
        expect(getWeekDays('left', 0)[4]).toHaveAttribute('aria-label', '2021-01-01');
    });

    it('date snippet 保留日期状态类', async () => {
        await setup({ value: baseDate, open: true, date: true, props: { type: 'date' } });
        const customDay = getDay('2019-09-08').querySelector('.custom-date');
        expect(customDay).toHaveAttribute('data-full', '2019-09-08');
        expect(customDay).toHaveTextContent('d8');
        expect(getDay('2019-09-08')).toHaveClass(`${dp}-day-selected`);
    });
});
