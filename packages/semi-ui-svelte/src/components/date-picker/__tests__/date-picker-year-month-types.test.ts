import { render, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { YearAndMonthProps } from '../internal';
import YearAndMonth from '../year-and-month.svelte';
import { click, getPopup, getPresetButtons, getYMLists, getYMSelected } from './date-picker-dom-utils';
import { changes, dp, getInput, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

describe('Svelte DatePicker year 类型', () => {
    it('面板只有一个以语言包命名的年份列表', async () => {
        await setup({ open: true, props: { type: 'year' } });
        const lists = within(getPopup() as HTMLElement).getAllByRole('listbox');
        expect(lists).toHaveLength(1);
        expect(lists[0]).toHaveAccessibleName(zh_CN.DatePicker.year);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-body`)).toBeNull();
    });

    it('value 以 yyyy 回显并选中该年', async () => {
        await setup({ value: new Date(2021, 5, 10), open: true, props: { type: 'year' } });
        expect(getInput()).toHaveValue('2021');
        expect(getYMSelected()).toEqual(['2021年']);
    });

    it('选择年份后 onChange 与 bind:value 收到当年 1 月 1 日，面板保持打开', async () => {
        const { store } = await setup({ mode: 'bind', value: new Date(2021, 5, 10), open: true, props: { type: 'year' } });
        await click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(changes(store)).toEqual(['change 2023-01-01 00:00:00 "2023"']);
        expect(store.value).toEqual(new Date(2023, 0, 1));
        expect(getInput()).toHaveValue('2023');
        expect(getYMSelected()).toEqual(['2023年']);
        expect(getPopup()).not.toBeNull();
    });

    it('输入年份后解析为当年 1 月 1 日', async () => {
        const { store } = await setup({ props: { type: 'year' } });
        await typeText('2020');
        expect(changes(store)).toEqual(['change 2020-01-01 00:00:00 "2020"']);
    });

    it('空输入框按 Enter 回落到今年 1 月 1 日', async () => {
        const { store } = await setup({ props: { type: 'year' } });
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        const year = new Date().getFullYear();
        expect(changes(store)).toEqual([`change ${year}-01-01 00:00:00 "${year}"`]);
    });

    it('presets 的日期取该年 1 月 1 日，以 yyyy 回显', async () => {
        const { store } = await setup({ open: true, props: { type: 'year', presets: [{ text: '2021', start: new Date(2021, 5, 10) }] } });
        await click(getPresetButtons()[0]);
        expect(changes(store)).toEqual(['change 2021-01-01 00:00:00 "2021"']);
        expect(getInput()).toHaveValue('2021');
    });

    it('disabledDate 按每年的 1 月 1 日判断，列表与输入一致', async () => {
        const { store } = await setup({ value: new Date(2022, 0), open: true, props: { type: 'year', disabledDate: (date) => date < new Date(2021, 2, 1) } });
        const years = within(getYMLists()[0]);
        expect(years.getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'true');
        expect(years.getByRole('option', { name: '2023' })).not.toHaveAttribute('aria-disabled', 'true');
        await typeText('2021');
        expect(changes(store)).toEqual([]);
        await typeText('2023');
        expect(changes(store)).toEqual(['change 2023-01-01 00:00:00 "2023"']);
    });

    it('insetInput 的内嵌输入框以 yyyy 为占位符，与 month 一样以 chooseDate 命名', async () => {
        await setup({ open: true, props: { type: 'year', insetInput: true } });
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        expect(inset).toHaveAttribute('placeholder', 'yyyy');
        expect(inset).toHaveAccessibleName(zh_CN.DatePicker.chooseDate);
    });
});

describe('Svelte DatePicker YearAndMonth 面板', () => {
    const baseProps = {
        currentYear: { left: 2021, right: 2022 },
        currentMonth: { left: 6, right: 7 },
        locale: en_US.DatePicker,
        type: 'month',
    } satisfies Partial<YearAndMonthProps>;

    const renderYearAndMonth = async (props: Partial<YearAndMonthProps> = {}) => {
        const result = render(YearAndMonth, { props: { ...baseProps, onSelect: () => undefined, ...props } });
        await settle();
        return result;
    };

    it('year 类型选择年份不按月份调整，只通知一次', async () => {
        const onSelect = vi.fn<YearAndMonthProps['onSelect']>();
        await renderYearAndMonth({
            type: 'year',
            onSelect,
            currentYear: { left: 2021, right: 0 },
            currentMonth: { left: 6, right: 0 },
            disabledDate: (date) => date.getMonth() === 5,
        });
        expect(getYMLists()).toHaveLength(1);
        await click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].currentYear.left).toBe(2023);
    });

    it('每个月份每次只调一次 disabledDate', async () => {
        const disabledDate = vi.fn<(date: Date) => boolean>(() => false);
        await renderYearAndMonth({ disabledDate });
        const june = disabledDate.mock.calls.filter(([date]) => date.getFullYear() === 2021 && date.getMonth() === 5);
        expect(june).toHaveLength(1);
    });
});

describe('Svelte DatePicker month 类型取当月 1 日', () => {
    it('presets 的起点在月中时取当月 1 日 00:00', async () => {
        const { store } = await setup({ open: true, props: { type: 'month', presets: [{ text: '6 月', start: new Date(2021, 5, 18, 10, 30) }] } });
        await click(getPresetButtons()[0]);
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00 "2021-06"']);
        expect(getInput()).toHaveValue('2021-06');
    });

    it('空输入框按 Enter 回落到本月 1 日 00:00', async () => {
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const { store } = await setup({ props: { type: 'month' } });
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00 "2021-06"']);
    });

    it('monthRange 空输入框按 Enter 两端回落到本月 1 日 00:00', async () => {
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const { store } = await setup({ props: { type: 'monthRange' } });
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-01 00:00:00 ["2021-06","2021-06"]']);
    });

    it('年份列、月份列与切换年份时以每月 1 日 00:00 调用 disabledDate', async () => {
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const disabledDate = vi.fn<(date: Date) => boolean>((date) => date < new Date(2021, 5, 10));
        await setup({ value: new Date(2022, 5), open: true, props: { type: 'month', disabledDate } });
        await click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(disabledDate.mock.calls.filter(([date]) => date.getTime() !== new Date(date.getFullYear(), date.getMonth()).getTime())).toEqual([]);
        expect(within(getYMLists()[1]).getByRole('option', { name: '6月' })).toHaveAttribute('aria-disabled', 'true');
    });
});
