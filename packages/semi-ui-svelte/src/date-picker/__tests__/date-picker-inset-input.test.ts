import { within } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { click, getPopup } from './date-picker-dom-utils';
import { changes, clickOutside, dp, getDay, getInput, getInputs, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const popup = () => getPopup() as HTMLElement;
const insetInputs = () => popup().querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
const datePlaceholder = 'yyyy-MM-dd';
const timePlaceholder = 'HH:mm:ss';

describe('Svelte DatePicker insetInput 渲染', () => {
    it('dateTime：面板内有日期与时间两个输入框，触发器输入框只读', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', insetInput: true } });
        expect(within(popup()).getByPlaceholderText(datePlaceholder)).toHaveValue('2019-09-08');
        expect(within(popup()).getByPlaceholderText(timePlaceholder)).toHaveValue('08:08:08');
        expect(insetInputs()).toHaveLength(2);
        expect(getInput()).toHaveAttribute('readonly');
    });

    it('dateTimeRange：日期与时间输入框各两个，顺序为起日期、起时间、终日期、终时间', async () => {
        await setup({ value: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], open: true, props: { type: 'dateTimeRange', insetInput: true } });
        const dateInputs = within(popup()).getAllByPlaceholderText<HTMLInputElement>(datePlaceholder);
        const timeInputs = within(popup()).getAllByPlaceholderText<HTMLInputElement>(timePlaceholder);
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        timeInputs.forEach((input) => expect(input).toBeEnabled());
        expect(Array.from(insetInputs()).map((input) => input.value)).toEqual(['2021-06-01', '10:00:00', '2021-06-15', '18:00:00']);
    });

    it('dateRange：只有日期输入框，带分隔符，触发器的两个输入框只读', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'dateRange', insetInput: true } });
        const dateInputs = within(popup()).getAllByPlaceholderText<HTMLInputElement>(datePlaceholder);
        expect(dateInputs.map((input) => input.value)).toEqual(['2021-06-01', '2021-06-15']);
        expect(within(popup()).queryByPlaceholderText(timePlaceholder)).toBeNull();
        expect(popup().querySelector(`.${dp}-inset-input-separator`)).toHaveTextContent('-');
        getInputs().forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('占位符随 format：dateTime 的日期与时间部分各取自己的格式', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', format: 'yyyy/MM/dd HH:mm', insetInput: true } });
        expect(within(popup()).getByPlaceholderText('yyyy/MM/dd')).toHaveValue('2019/09/08');
        expect(within(popup()).getByPlaceholderText('HH:mm')).toHaveValue('08:08');
    });

    it('date 只有一个输入框，占位符取 format', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date', insetInput: true } });
        expect(insetInputs()).toHaveLength(1);
        expect(insetInputs()[0]).toHaveAttribute('placeholder', datePlaceholder);
    });

    it('monthRange 的占位符含起止两端', async () => {
        await setup({ open: true, props: { type: 'monthRange', insetInput: true } });
        expect(insetInputs()).toHaveLength(1);
        expect(insetInputs()[0]).toHaveAttribute('placeholder', 'yyyy-MM ~ yyyy-MM');
    });

    it('点选日期后显示在 insetInput 里并报 onChange', async () => {
        const { store } = await setup({ open: true, props: { type: 'date', defaultPickerValue: '2021-06-01', insetInput: true } });
        const insetInput = within(popup()).getByPlaceholderText(datePlaceholder);
        expect(insetInput).toHaveValue('');
        await click(getDay('2021-06-15'));
        expect(changes(store)).toEqual(['change 2021-06-15 00:00:00 "2021-06-15"']);
        expect(insetInput).toHaveValue('2021-06-15');
    });
});

describe('Svelte DatePicker insetInput 键入', () => {
    it('dateTime：改日期时保留原来的时间部分', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', insetInput: true } });
        await typeText('2021-06-15', within(popup()).getByPlaceholderText<HTMLInputElement>(datePlaceholder));
        expect(changes(store)).toEqual(['change 2021-06-15 08:08:08 "2021-06-15 08:08:08"']);
        expect(getInput()).toHaveValue('2021-06-15 08:08:08');
    });

    it('12 小时制 format：改日期后保留下午的时间', async () => {
        const { store } = await setup({ value: new Date(2021, 0, 1, 15, 30), open: true, props: { type: 'dateTime', format: 'yyyy-MM-dd hh:mm a', insetInput: true } });
        const [dateInput, timeInput] = insetInputs();
        expect(timeInput).toHaveValue('15:30');
        await typeText('2021-06-15', dateInput);
        // the default locale is zh_CN, whose day period is 下午
        expect(changes(store)).toEqual(['change 2021-06-15 15:30:00 "2021-06-15 03:30 下午"']);
    });

    it('dateTime：改时间时与已有的日期合并', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', insetInput: true } });
        await typeText('10:30:00', within(popup()).getByPlaceholderText<HTMLInputElement>(timePlaceholder));
        expect(changes(store)).toEqual(['change 2019-09-08 10:30:00 "2019-09-08 10:30:00"']);
    });

    it('dateTime 没有值时：时间输入框先禁用，键入日期后用 defaultPickerValue 的时间补上', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateTime', defaultPickerValue: new Date(2021, 5, 1, 9, 30, 0), insetInput: true } });
        const timeInput = within(popup()).getByPlaceholderText(timePlaceholder);
        expect(timeInput).toBeDisabled();
        await typeText('2021-06-15', within(popup()).getByPlaceholderText<HTMLInputElement>(datePlaceholder));
        expect(timeInput).toHaveValue('09:30:00');
        expect(timeInput).toBeEnabled();
        expect(changes(store)).toEqual(['change 2021-06-15 09:30:00 "2021-06-15 09:30:00"']);
    });

    it('dateTimeRange 没有值时：两侧各自用 defaultPickerValue 对应一端的时间补上', async () => {
        const { store } = await setup({
            open: true,
            props: { type: 'dateTimeRange', defaultPickerValue: [new Date(2021, 5, 1, 10, 0, 0), new Date(2021, 6, 1, 18, 0, 0)], insetInput: true },
        });
        const [startDate, endDate] = within(popup()).getAllByPlaceholderText<HTMLInputElement>(datePlaceholder);
        await typeText('2021-06-01', startDate);
        await typeText('2021-06-20', endDate);
        const timeInputs = within(popup()).getAllByPlaceholderText<HTMLInputElement>(timePlaceholder);
        expect(timeInputs.map((input) => input.value)).toEqual(['10:00:00', '18:00:00']);
        expect(changes(store).at(-1)).toBe('change 2021-06-01 10:00:00|2021-06-20 18:00:00 ["2021-06-01 10:00:00","2021-06-20 18:00:00"]');
    });

    it('dateTimeRange：修改结束时间只改终点的时间', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)], open: true, props: { type: 'dateTimeRange', insetInput: true } });
        const [, endTime] = within(popup()).getAllByPlaceholderText<HTMLInputElement>(timePlaceholder);
        await typeText('20:00:00', endTime);
        expect(changes(store)).toEqual(['change 2021-06-01 10:00:00|2021-06-15 20:00:00 ["2021-06-01 10:00:00","2021-06-15 20:00:00"]']);
    });

    it('dateRange：两端都键入后才报 onChange，并写回触发器的两个输入框', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateRange', insetInput: true } });
        const [startDate, endDate] = within(popup()).getAllByPlaceholderText<HTMLInputElement>(datePlaceholder);
        await typeText('2021-06-01', startDate);
        expect(changes(store)).toEqual([]);
        await typeText('2021-06-15', endDate);
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-15 00:00:00 ["2021-06-01","2021-06-15"]']);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });

    it('多选：按内嵌输入框里 format 的日期部分解析逗号分隔的列表', async () => {
        const { store } = await setup({ open: true, props: { type: 'date', multiple: true, format: 'yyyy-MM-dd EEEE', insetInput: true } });
        await typeText('2021-06-01,2021-06-15', within(popup()).getByPlaceholderText<HTMLInputElement>(datePlaceholder));
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-15 00:00:00 ["2021-06-01 星期二","2021-06-15 星期二"]']);
    });

    it('键入一半的日期只改输入框，不改值', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date', insetInput: true } });
        const insetInput = within(popup()).getByPlaceholderText<HTMLInputElement>(datePlaceholder);
        await typeText('2019-09-1', insetInput);
        expect(insetInput).toHaveValue('2019-09-1');
        expect(changes(store)).toEqual([]);
    });
});

describe('Svelte DatePicker insetInput 与触发器', () => {
    it('面板打开时触发器输入框禁用，关闭后恢复', async () => {
        await setup({ value: baseDate, props: { type: 'dateTime', insetInput: true } });
        const triggerInput = getInput();
        await click(triggerInput);
        expect(getPopup()).not.toBeNull();
        expect(triggerInput).toBeDisabled();
        await clickOutside();
        expect(triggerInput).toBeEnabled();
    });

    it('关闭面板后丢弃 insetInput 里键入的文本，再打开显示当前值', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date', insetInput: true } });
        await typeText('2019-09-1', within(popup()).getByPlaceholderText<HTMLInputElement>(datePlaceholder));
        await clickOutside();
        expect(getPopup()).toBeNull();
        await click(getInput());
        await settle();
        expect(within(popup()).getByPlaceholderText(datePlaceholder)).toHaveValue('2019-09-08');
    });
});
