import { screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { click, getPopup } from './date-picker-dom-utils';
import { changes, dp, setup, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

async function openTimePanel() {
    await click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
    return (getPopup() as HTMLElement).querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
}

describe('Svelte DatePicker 时间面板的选项', () => {
    it('dateTime 的 disabledTime：被禁用的小时带 aria-disabled', async () => {
        const disabledTime = () => ({ disabledHours: () => [0, 1, 2, 3, 4, 5], disabledMinutes: () => [], disabledSeconds: () => [] });
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', disabledTime } });

        const [hourList] = await openTimePanel();
        const disabledHours = new Set(Array.from(hourList.querySelectorAll('li[aria-disabled="true"]')).map((item) => item.textContent));
        expect([...disabledHours]).toEqual(['00', '01', '02', '03', '04', '05']);
    });

    it('timePickerOpts 的 use12Hours：时间面板多一列上下午', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', timePickerOpts: { use12Hours: true } } });
        expect(await openTimePanel()).toHaveLength(4);
    });

    it('use12Hours 下上午的时间点小时仍保持在上午', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', timePickerOpts: { use12Hours: true } } });

        const [ampmList, hourList] = await openTimePanel();
        expect(within(ampmList).getAllByRole('option')[0]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await click(
            within(hourList)
                .getAllByRole('option')
                .find((item) => item.textContent?.startsWith('09')) as HTMLElement
        );
        expect(changes(store)).toHaveLength(1);
        expect(changes(store)[0]).toMatch(/^change 2019-09-08 09:08:08 /);
    });

    it('use12Hours 下下午的时间点小时仍保持在下午', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 8, 15, 8, 8), open: true, props: { type: 'dateTime', timePickerOpts: { use12Hours: true } } });

        const [ampmList, hourList] = await openTimePanel();
        expect(within(ampmList).getAllByRole('option')[1]).toHaveClass(`${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        await click(
            within(hourList)
                .getAllByRole('option')
                .find((item) => item.textContent?.startsWith('04')) as HTMLElement
        );
        expect(changes(store)).toHaveLength(1);
        expect(changes(store)[0]).toMatch(/^change 2019-09-08 16:08:08 /);
    });
});
