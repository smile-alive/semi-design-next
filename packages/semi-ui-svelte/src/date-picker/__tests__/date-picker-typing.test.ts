import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { click, getYMSelected, ymd } from './date-picker-dom-utils';
import { changes, clickOutside, dp, getContainer, getDay, getInput, getInputs, getRoot, getSelectedDays, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

describe('Svelte DatePicker 键入与 Enter', () => {
    it('点击输入框打开，点击外部关闭', async () => {
        const { store } = await setup({ value: baseDate });
        await click(getInput());
        expect(opens(store)).toEqual(['open true']);
        expect(getContainer()).not.toBeNull();
        await clickOutside();
        expect(opens(store)).toEqual(['open true', 'open false']);
        expect(getContainer()).toBeNull();
    });

    it('键入合法日期后按 Enter：报 onChange，输入框保留该日期', async () => {
        const { store } = await setup({ value: baseDate });
        const input = getInput();
        await userEvent.clear(input);
        await userEvent.type(input, '2021-06-15{Enter}');
        await settle();
        expect(changes(store).at(-1)).toBe('change 2021-06-15 00:00:00 "2021-06-15"');
        expect(input).toHaveValue('2021-06-15');
    });

    it('输入为空时按 Enter 使用当前日期', async () => {
        const { store } = await setup();
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(changes(store)).toHaveLength(1);
        expect(getInput()).toHaveValue(ymd(new Date()));
    });

    it('范围类型输入为空时按 Enter：两端都取当前日期', async () => {
        const { store } = await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await userEvent.type(startInput, '{Enter}');
        await settle();
        const today = ymd(new Date());
        expect(changes(store)).toEqual([`change ${today} 10:00:00|${today} 10:00:00 ["${today}","${today}"]`]);
        expect(startInput).toHaveValue(today);
        expect(endInput).toHaveValue(today);
    });

    it('多选按 Enter 时去除重复日期', async () => {
        await setup({ props: { type: 'date', multiple: true } });
        const input = getInput();
        await typeText('2021-06-01,2021-06-15,2021-06-01');
        await userEvent.type(input, '{Enter}');
        await settle();
        expect(input).toHaveValue('2021-06-01,2021-06-15');
    });
});

describe('Svelte DatePicker 解析键入的文本', () => {
    it('dateRange：键入结束日期后，起点保留，终点更新', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange' } });
        await typeText('2021-06-20', getInputs()[1]);
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-20 00:00:00 ["2021-06-01","2021-06-20"]']);
    });

    it('dateRange：键入起点后，终点保留，起点更新', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange' } });
        await typeText('2021-06-02', getInputs()[0]);
        expect(changes(store)).toEqual(['change 2021-06-02 00:00:00|2021-06-15 00:00:00 ["2021-06-02","2021-06-15"]']);
    });

    it('dateTime：完整的日期时间才生效，只有日期不生效', async () => {
        const { store } = await setup({ value: baseDate, props: { type: 'dateTime' } });
        await typeText('2021-06-15 10:30:00');
        expect(changes(store)).toEqual(['change 2021-06-15 10:30:00 "2021-06-15 10:30:00"']);
        await typeText('2021-06-16');
        expect(changes(store)).toHaveLength(1);
    });

    it('month：键入年月后面板选中对应年月', async () => {
        const { store } = await setup({ value: new Date(2021, 5), open: true, props: { type: 'month' } });
        await typeText('2021-08');
        expect(changes(store)).toEqual(['change 2021-08-01 00:00:00 "2021-08"']);
        expect(getYMSelected()).toEqual(['2021年', '8月']);
    });

    it('多选：键入逗号分隔的列表，有非法项则不通知', async () => {
        const { store } = await setup({ props: { type: 'date', multiple: true } });
        await typeText('2021-06-01,2021-06-15');
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-15 00:00:00 ["2021-06-01","2021-06-15"]']);
        await typeText('invalid,2021-06-15');
        expect(changes(store)).toHaveLength(1);
        expect(getInput()).toHaveValue('invalid,2021-06-15');
    });

    it('多选：键入的个数超过 max 时不通知', async () => {
        const { store } = await setup({ props: { type: 'date', max: 1, multiple: true } });
        await typeText('2021-06-01,2021-06-15');
        expect(changes(store)).toEqual([]);
    });

    it('范围类型键入时，disabledDate 收到所查的范围', async () => {
        const disabledDate = vi.fn<(date: Date, options?: unknown) => boolean>(() => false);
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange', disabledDate } });
        await typeText('2021-06-10', getInputs()[1]);
        expect(changes(store)).toHaveLength(1);
        expect(disabledDate).toHaveBeenCalledWith(new Date(2021, 5, 10), expect.objectContaining({ rangeStart: '2021-06-01', rangeEnd: '2021-06-10' }));
    });

    it('disabledDate 收到 Date 对象，被禁用的日期 aria-disabled 为 true', async () => {
        const disabledDate = vi.fn<(date: Date) => boolean>((date) => date.getDate() === 10);
        await setup({ value: baseDate, open: true, props: { type: 'date', disabledDate } });
        expect(disabledDate.mock.calls.every(([date]) => date instanceof Date)).toBe(true);
        expect(getDay('2019-09-10')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-11')).toHaveAttribute('aria-disabled', 'false');
    });
});

describe('Svelte DatePicker 键入时面板的高亮', () => {
    it('date：合法日期高亮，非法或空文本取消高亮', async () => {
        await setup({ open: true, props: { type: 'date', defaultPickerValue: '2021-06-01' } });
        await typeText('2021-06-15');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
        await typeText('invalid');
        expect(getSelectedDays()).toEqual([]);
        await typeText('');
        expect(getSelectedDays()).toEqual([]);
    });

    it('dateRange：键入一半的范围已高亮合法的一端', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        await typeText('2021-06-01', getInputs()[0]);
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(document.querySelector(`.${dp}-day-selected-end`)).toBeNull();
    });

    it('dateRange：两端都键入后起点与终点各自高亮', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        const [startInput, endInput] = getInputs();
        await typeText('2021-06-01', startInput);
        await typeText('2021-06-15', endInput);
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-06-15')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('多选：键入一半的列表已高亮合法的项', async () => {
        await setup({ open: true, props: { type: 'date', multiple: true, defaultPickerValue: '2021-06-01' } });
        await typeText('2021-06-01,2021-06-1');
        expect(getSelectedDays()).toEqual(['2021-06-01']);
    });
});

describe('Svelte DatePicker 值的各种形式与显示文本', () => {
    it.each([
        ['Date', new Date(2021, 5, 1), '2021-06-01'],
        ['字符串', '2021-06-01', '2021-06-01'],
        ['时间戳', new Date(2021, 5, 1).getTime(), '2021-06-01'],
        ['null', null, ''],
    ])('value 为%s时输入框显示 %s', async (_name, value, text) => {
        await setup({ value });
        expect(getInput()).toHaveValue(text);
    });

    it('value 为普通对象不是合法的值，挂载时抛 TypeError', async () => {
        await expect(setup({ value: {} as never })).rejects.toBeInstanceOf(TypeError);
    });

    it('多选的显示文本用逗号连接', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'date', multiple: true } });
        expect(getInput()).toHaveValue('2021-06-01,2021-06-15');
    });

    it('dateRange 按 format 显示两端', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange', format: 'yyyy/MM/dd' } });
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021/06/01');
        expect(endInput).toHaveValue('2021/06/15');
    });

    it('monthRange 只有一个输入框，显示 起 ~ 止', async () => {
        await setup({ value: [new Date(2021, 2), new Date(2021, 8)], props: { type: 'monthRange' } });
        expect(getInputs()).toHaveLength(1);
        expect(getInput()).toHaveValue('2021-03 ~ 2021-09');
    });

    it('范围只有起点：终点输入框为空', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        const [startInput, endInput] = getInputs();
        startInput.focus();
        await settle();
        await click(getDay('2021-06-01'));
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('');
    });

    it('范围只有终点：起点输入框为空', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        const [startInput, endInput] = getInputs();
        endInput.focus();
        await settle();
        await click(getDay('2021-06-15'));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('范围触发器：分隔符带激活 class，后缀有图标', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange', rangeSeparator: ' - ' } });
        const separator = getRoot().querySelector(`.${dp}-range-input-separator`);
        expect(separator).toHaveTextContent('-');
        expect(separator).toHaveClass(`${dp}-range-input-separator-active`);
        expect(getRoot().querySelector(`.${dp}-range-input-suffix svg`)).not.toBeNull();
    });
});
