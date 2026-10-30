import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker from '../date-picker.svelte';
import type { DatePickerProps } from '../interface';
import { click, getFooterButtons, getPanel, getPopup } from './date-picker-dom-utils';
import { changes, dp, getDay, getInputs, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

type OnChange = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const rangeValue = [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)];

const switchTime = () => screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
const switchOf = (side: string, name: string) => getPanel(side).querySelector(`[aria-label="${name}"]`) as HTMLElement;
const timeLists = (root: ParentNode) => root.querySelectorAll<HTMLElement>(`.${dp}-tpk ul[role="listbox"]`);
const hourList = (root: ParentNode = getPopup() as HTMLElement) => timeLists(root)[0];

/** Mounts the picker directly, for the cases that need the exact Date handed to a callback */
async function renderRaw(props: DatePickerProps) {
    const view = render(DatePicker, { props: { motion: false, ...props } });
    await settle();
    return view;
}

describe('Svelte DatePicker 时间面板', () => {
    it('disabledTimePicker 时时间面板不打开', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', disabledTimePicker: true } });
        expect(switchTime()).toHaveClass(`${dp}-switch-time-disabled`);
        await click(switchTime());
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPopup()?.querySelector(`.${dp}-tpk`)).toBeNull();
    });

    it('dateTime 选择小时：onChange 带有值时的毫秒，且只触发一次', async () => {
        const onChange = vi.fn<OnChange>();
        await renderRaw({ type: 'dateTime', value: baseDate, open: true, onChange });
        await click(switchTime());
        await click(within(hourList()).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new Date(2019, 8, 8, 14, 8, 8, 8), '2019-09-08 14:08:08');
    });

    it('dateTime 无值时选择小时：onChange 只触发一次，且不带旧时间', async () => {
        const onChange = vi.fn<OnChange>();
        await renderRaw({ type: 'dateTime', open: true, onChange });
        await click(switchTime());
        await click(within(hourList()).getAllByRole('option', { name: '14' })[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(14);
    });

    it('dateTimeRange 无聚焦输入框时点击日期：替换开始并保留时间', async () => {
        const { store } = await setup({ value: rangeValue, open: true, props: { type: 'dateTimeRange' } });
        await click(getDay('2021-06-10'));
        expect(changes(store)).toContain('change 2021-06-10 10:00:00|2021-06-15 18:00:00 ["2021-06-10 10:00:00","2021-06-15 18:00:00"]');
        expect(getInputs()[0]).toHaveValue('2021-06-10 10:00:00');
    });

    it('dateTimeRange 两侧分别选择小时', async () => {
        const { store } = await setup({ value: rangeValue, open: true, props: { type: 'dateTimeRange' } });
        await click(switchOf('right', zh_CN.DatePicker.switchToTime));
        await click(within(hourList(getPanel('right'))).getAllByRole('option', { name: '20' })[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-01 10:00:00|2021-06-15 20:00:00 ["2021-06-01 10:00:00","2021-06-15 20:00:00"]');

        await click(switchOf('left', zh_CN.DatePicker.switchToTime));
        await click(within(hourList(getPanel('left'))).getAllByRole('option', { name: '08' })[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-01 08:00:00|2021-06-15 20:00:00 ["2021-06-01 08:00:00","2021-06-15 20:00:00"]');
    });

    it('dateTimeRange 通过界面修改分钟', async () => {
        const { store } = await setup({ value: rangeValue, open: true, props: { type: 'dateTimeRange' } });
        await click(switchOf('right', zh_CN.DatePicker.switchToTime));
        const rightMinutes = timeLists(getPanel('right'))[1];
        await click(within(rightMinutes).getAllByRole('option', { name: '30' })[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-01 10:00:00|2021-06-15 18:30:00 ["2021-06-01 10:00:00","2021-06-15 18:30:00"]');
    });

    it('时间切换按钮只显示 format 的时间部分', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', format: 'yyyy-MM-dd HH:mm' } });
        expect(switchTime()).toHaveTextContent('08:08');
        expect(switchTime()).not.toHaveTextContent('08:08:08');
    });

    it('dateTime 的切换按钮显示已选日期与时间', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime' } });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate })).toHaveTextContent('2019-09-08');
        expect(switchTime()).toHaveTextContent('08:08:08');
    });

    it('dateTimeRange 渲染两个面板，各自的切换栏显示起止日期与时间', async () => {
        await setup({ value: rangeValue, open: true, props: { type: 'dateTimeRange' } });
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-navigation`)).toHaveLength(2);
        const switchText = (side: string) => getPanel(side).querySelector(`.${dp}-switch`)?.textContent?.replace(/\s+/g, '');
        expect(switchText('left')).toBe('2021-06-0110:00:00');
        expect(switchText('right')).toBe('2021-06-1518:00:00');
    });

    it('dateTimeRange 的时间面板按侧打开', async () => {
        await setup({ value: rangeValue, open: true, props: { type: 'dateTimeRange' } });
        await click(switchOf('left', zh_CN.DatePicker.switchToTime));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'date');
        await click(switchOf('right', zh_CN.DatePicker.switchToTime));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
        expect((getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk`)).toHaveLength(2);
        await click(switchOf('left', zh_CN.DatePicker.switchToDate));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(getPanel('right')).toHaveAttribute('x-open-type', 'time');
    });

    it('dateTime needConfirm：点击日期只缓存，确定后提交', async () => {
        const onConfirm = vi.fn<NonNullable<DatePickerProps['onConfirm']>>();
        await renderRaw({ type: 'dateTime', value: baseDate, open: true, needConfirm: true, onConfirm });
        await click(getDay('2019-09-11'));
        expect(onConfirm).not.toHaveBeenCalled();
        await click(getFooterButtons()[1]);
        expect(onConfirm).toHaveBeenCalledWith(new Date(2019, 8, 11, 8, 8, 8, 8), '2019-09-11 08:08:08');
        expect(getInputs()[0]).toHaveValue('2019-09-11 08:08:08');
    });

    it('needConfirm 下范围完整才可确定', async () => {
        await setup({ value: [new Date(2021, 5, 10, 10), new Date(2021, 5, 20, 18)], props: { type: 'dateTimeRange', needConfirm: true } });
        const [startInput, endInput] = getInputs();
        await click(endInput);
        expect(getFooterButtons()[1]).toBeEnabled();
        await click(getDay('2021-06-05'));
        expect(startInput).toHaveValue('');
        expect(getFooterButtons()[1]).toBeDisabled();
    });

    it('非范围类型 needConfirm 总可确定', async () => {
        await setup({ open: true, props: { type: 'dateTime', needConfirm: true } });
        expect(getFooterButtons()[1]).toBeEnabled();
    });

    it('dateTimeRange 选择日期后走范围选择流程：确定时报 onConfirm，输入框写回', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateTimeRange', defaultPickerValue: '2021-06-01', needConfirm: true } });
        await click(getDay('2021-06-01'));
        await click(getDay('2021-06-30'));
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-30')).toHaveClass(`${dp}-day-selected-end`);
        expect(getPopup()).not.toBeNull();
        await click(getFooterButtons()[1]);
        const confirms = store.log.filter((entry) => entry.startsWith('confirm'));
        expect(confirms).toHaveLength(1);
        expect(confirms[0]).toMatch(/^confirm 2021-06-01 \d\d:\d\d:\d\d\|2021-06-30 \d\d:\d\d:\d\d$/);
        const [startInput, endInput] = getInputs();
        expect(startInput.value.startsWith('2021-06-01')).toBe(true);
        expect(endInput.value.startsWith('2021-06-30')).toBe(true);
    });
});
