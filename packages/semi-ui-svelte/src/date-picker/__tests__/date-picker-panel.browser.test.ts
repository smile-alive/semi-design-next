import { screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import scrollListCss from '@fibrae/semi-foundation/scroll-list/scroll-list.scss?inline';
import { clickOutside } from '@test/utils/browser';
import type { DatePickerProps } from '../interface';
import { getPanel, getPopup, getYMLists, getYMSelected } from './date-picker-dom-utils';
import { dp, getInput, getInputs, getRoot, setup } from './test-utils';

const getTitle = (side: string) => getPanel(side).querySelector<HTMLElement>(`.${dp}-navigation-month button`) as HTMLElement;
const toggleYearMonth = async (side: string) => userEvent.click(await waitFor(() => getTitle(side)));

const expectSelectedYMVisible = (length?: number) =>
    waitFor(() => {
        const selected = document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        if (length === undefined) {
            expect(selected.length).toBeGreaterThan(0);
        } else {
            expect(selected).toHaveLength(length);
        }
        for (const item of selected) {
            const itemRect = item.getBoundingClientRect();
            const viewport = (item.closest(`.${BASE_CLASS_PREFIX}-scrolllist-item`) as Element).getBoundingClientRect();
            expect(itemRect.top).toBeGreaterThanOrEqual(viewport.top);
            expect(itemRect.bottom).toBeLessThanOrEqual(viewport.bottom);
        }
    });

describe('Svelte DatePicker 面板与回调（浏览器）', () => {
    it('按焦点状态计算 disabledDate', async () => {
        const today = new Date(2021, 9, 20);
        const disabledDate: NonNullable<DatePickerProps['disabledDate']> = (date, { rangeInputFocus } = {}) => {
            const days = rangeInputFocus === 'rangeStart' ? 2 : rangeInputFocus === 'rangeEnd' ? 3 : 0;
            const start = new Date(2021, 9, 20 - days);
            const end = new Date(2021, 9, 20 + days);
            return days > 0 && start <= date && date <= end;
        };
        await setup({ props: { type: 'dateRange', disabledDate, defaultPickerValue: today } });
        const getDisabledDays = () => Array.from(getPanel('left').querySelectorAll(`.${dp}-day.${dp}-day-disabled`)).map((day) => day.textContent?.trim());

        await userEvent.click(getInputs()[0]);
        await waitFor(() => expect(getDisabledDays()).toEqual(['18', '19', '20', '21', '22']));
        await userEvent.click(getInputs()[1]);
        await waitFor(() => expect(getDisabledDays()).toEqual(['17', '18', '19', '20', '21', '22', '23']));
    });

    it('clickOutSide', async () => {
        const onClickOutSide = vi.fn<NonNullable<DatePickerProps['onClickOutSide']>>();
        await setup({ props: { type: 'dateTime', needConfirm: true, onClickOutSide } });
        await userEvent.click(getInput());
        await userEvent.click(await waitFor(() => document.querySelector(`.${dp}-footer`) as HTMLElement));
        await clickOutside();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
    });

    it('实例方法 open 与 close', async () => {
        const { component } = await setup({ props: { type: 'dateTime', needConfirm: true } });
        component.api()?.open();
        await waitFor(() => expect(getPopup()).not.toBeNull());
        component.api()?.close();
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    const monthCases: { type: 'month' | 'monthRange'; value: DatePickerProps['value'] }[] = [
        { type: 'month', value: '2019-09' },
        { type: 'monthRange', value: ['2019-09', '2019-10'] },
    ];

    it.each(monthCases)('点击清除按钮后 $type 的年月选择器回到当前年月', async ({ type, value }) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        await setup({ mode: 'bind', value, props: { type } });
        await waitFor(() => expect(getInput()).not.toHaveValue(''));
        await userEvent.click(getInput());
        await userEvent.click(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        const nextMonth = month + 1 <= 12 ? { year, month: month + 1 } : { year: year + 1, month: 1 };
        await waitFor(() => expect(getYMSelected()).toEqual(type === 'month' ? [`${year}年`, `${month}月`] : [`${year}年`, `${month}月`, `${nextMonth.year}年`, `${nextMonth.month}月`]));
    });

    it('presets 的 start 和 end 支持函数类型', async () => {
        const presets = [{ text: '动态时间', start: () => new Date(2024, 0, 24), end: () => new Date(2024, 1, 26) }];
        await setup({ props: { type: 'dateRange', presets } });
        await userEvent.click(getInputs()[0]);
        await userEvent.click(await screen.findByRole('button', { name: '动态时间' }));
        await waitFor(() => expect(getInputs()[0]).toHaveValue('2024-01-24'));
        expect(getInputs()[1]).toHaveValue('2024-02-26');
    });
});

describe('Svelte DatePicker 年月选择器的滚动与样式（浏览器）', () => {
    it('范围选择的两侧都切到年月选择器时，选中的年与月滚入可见区', async () => {
        await setup({ value: [new Date(2030, 4, 10), new Date(2030, 7, 12)], open: true, props: { type: 'dateRange' } });

        await toggleYearMonth('left');
        await expectSelectedYMVisible();
        await toggleYearMonth('right');
        expect(getYMLists()).toHaveLength(4);
        await expectSelectedYMVisible();
    });

    // weekStartsOn 0: April and May 2030 have 5 week rows, March and June 6
    it.each([
        {
            ymSide: 'left',
            monthSide: 'right',
            button: zh_CN.DatePicker.nextMonth,
            value: [new Date(2030, 3, 10), new Date(2030, 4, 12)],
        },
        {
            ymSide: 'right',
            monthSide: 'left',
            button: zh_CN.DatePicker.prevMonth,
            value: [new Date(2030, 3, 10), new Date(2030, 7, 12)],
        },
    ])('范围选择一侧显示年月选择器、$monthSide 侧月份的周行数变化后，选中的年与月仍在可见区', async ({ ymSide, monthSide, button, value }) => {
        await setup({ value, open: true, props: { type: 'dateRange' } });
        await userEvent.click(await waitFor(() => getTitle(ymSide)));
        const weekRows = () => getPanel(monthSide).querySelectorAll(`.${dp}-week`).length;
        expect(weekRows()).toBe(5);
        await userEvent.click(within(getPanel(monthSide)).getByRole('button', { name: button }));
        await waitFor(() => expect(weekRows()).toBe(6));
        await expectSelectedYMVisible(2);
    });

    it('compact 下 wheel 模式的年月列之间没有分隔线，与样式加载顺序无关', async () => {
        await setup({ value: new Date(2030, 4, 10), open: true, props: { density: 'compact', yearAndMonthOpts: { mode: 'wheel' } } });
        await userEvent.click(await waitFor(() => getTitle('left')));
        // styles.css orders components alphabetically, putting scroll-list rules after date-picker ones
        const style = document.createElement('style');
        style.textContent = scrollListCss;
        document.head.append(style);
        onTestFinished(() => style.remove());
        const [yearWheel] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-wheel`);
        expect(getComputedStyle(yearWheel).borderInlineEndWidth).toBe('0px');
    });
});
