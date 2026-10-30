import { fireEvent, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { endOfWeek, startOfWeek } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { click, getPanel, getPopup, getPresetButtons, getWeekDays, getYMSelected, ymd } from './date-picker-dom-utils';
import { changes, dp, getContainer, getDay, getInput, getInputs, getNavTitle, getRoot, getSelectedDays, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const logged = (store: { log: string[] }, prefix: string) => store.log.filter((entry) => entry.startsWith(prefix));

async function focusInput(input: HTMLInputElement) {
    input.focus();
    await settle();
}

describe('Svelte DatePicker 值的形式与显示文本', () => {
    it('monthRange 的初始值：两组年月高亮，输入框显示区间', async () => {
        await setup({ value: [new Date(2021, 0), new Date(2021, 6)], open: true, props: { type: 'monthRange' } });
        expect(getYMSelected()).toEqual(['2021年', '1月', '2021年', '7月']);
        expect(getInput()).toHaveValue('2021-01 ~ 2021-07');
    });

    it('时间戳形式的 value', async () => {
        await setup({ value: new Date(2021, 7, 15).getTime() });
        expect(getInput()).toHaveValue('2021-08-15');
    });

    it('字符串形式的 value', async () => {
        await setup({ value: '2021-08-15' });
        expect(getInput()).toHaveValue('2021-08-15');
    });

    it('自定义 format 字符串', async () => {
        await setup({ value: new Date(2021, 7, 15), props: { format: 'dd/MM/yyyy' } });
        expect(getInput()).toHaveValue('15/08/2021');
    });

    it.each([
        ['date', baseDate, '2019-09-08'],
        ['dateTime', baseDate, '2019-09-08 08:08:08'],
        ['month', new Date(2021, 3), '2021-04'],
    ] as const)('%s 类型下输入框的显示文本', async (type, value, text) => {
        await setup({ value, props: { type } });
        expect(getInput()).toHaveValue(text);
    });
});

describe('Svelte DatePicker 面板属性', () => {
    it('多选与 max：达到上限后继续点选无效', async () => {
        const { store } = await setup({ open: true, props: { type: 'date', max: 2, multiple: true, defaultPickerValue: '2021-08-01' } });

        const days = getWeekDays('left', 1);
        await click(days[0]);
        await click(days[1]);
        expect(changes(store)).toHaveLength(2);
        await click(days[2]);
        expect(changes(store)).toHaveLength(2);
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
    });

    it('dateRange 的 startDateOffset 与 endDateOffset：点一天得到所在的一周', async () => {
        const { store } = await setup({
            open: true,
            props: {
                type: 'dateRange',
                defaultPickerValue: '2021-08-01',
                endDateOffset: (date) => endOfWeek(date),
                startDateOffset: (date) => startOfWeek(date),
            },
        });

        await click(getWeekDays('left', 2)[0]);
        expect(changes(store)).toHaveLength(1);
        expect(changes(store)[0]).toMatch(/ \["2021-08-15","2021-08-21"\]$/);
    });

    it('showClear：有值时带清除按钮，关掉后没有', async () => {
        const { store } = await setup({ value: baseDate });
        await userEvent.hover(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement);
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();

        store.props.showClear = false;
        await settle();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('autoSwitchDate 为 false：切换面板不改值', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { autoSwitchDate: false } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
        expect(changes(store)).toEqual([]);
        expect(getInput()).toHaveValue(ymd(baseDate));
    });

    it('dateRange 的 syncSwitchMonth：两个面板同步切换，朝向对方的按钮隐藏', async () => {
        await setup({ value: [new Date(2021, 7, 1), new Date(2021, 8, 15)], open: true, props: { type: 'dateRange', syncSwitchMonth: true } });
        expect(getNavTitle('left')).toBe('2021年 8月');
        expect(getNavTitle('right')).toBe('2021年 9月');
        expect(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`)).toHaveStyle({ visibility: 'hidden' });
        expect(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`)).toHaveStyle({ visibility: 'hidden' });

        await click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        expect(getNavTitle('left')).toBe('2021年 7月');
        expect(getNavTitle('right')).toBe('2021年 8月');
    });

    it('disabled 的范围选择：两个输入框禁用，没有清除按钮', async () => {
        await setup({ value: [new Date(2021, 7, 1), new Date(2021, 7, 15)], props: { type: 'dateRange', disabled: true } });
        getInputs().forEach((input) => expect(input).toBeDisabled());
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('切到上一月时 onPanelChange 收到新面板的日期与原值字符串', async () => {
        const { store } = await setup({ value: baseDate, open: true });

        await click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(logged(store, 'panel')).toHaveLength(1);
        expect(logged(store, 'panel')[0]).toMatch(/^panel 2019-08-08 \d\d:\d\d:\d\d "2019-08-08"$/);
    });

    it('topSlot 与 bottomSlot', async () => {
        await setup({ value: baseDate, open: true, slots: true });
        expect(getPopup()?.querySelector(`.${dp}-topSlot .custom-top`)).toHaveTextContent('top');
        expect(getPopup()?.querySelector(`.${dp}-bottomSlot .custom-bottom`)).toHaveTextContent('bottom');
    });

    it('date snippet 替换日期格的内容', async () => {
        await setup({ value: baseDate, open: true, date: true });
        expect(document.querySelectorAll('.custom-date')).toHaveLength(30);
        expect(getDay('2019-09-08').querySelector('.custom-date')).toHaveTextContent('d8');
    });

    it('fullDate snippet 替换整个日期格，选中态由 dayStatus 提供', async () => {
        await setup({ value: baseDate, open: true, fullDate: true });
        expect(document.querySelectorAll('.custom-full')).toHaveLength(30);
        expect(getDay('2019-09-08')).not.toHaveClass(`${dp}-day-selected`);
        expect(getDay('2019-09-08').querySelector('.custom-full')).toHaveClass('custom-selected');
    });

    it('dateRange 的悬停效果：点选起点后悬停的日期与起点之间带 inhover', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-08-01' } });

        const days = getWeekDays('left', 1);
        await click(days[0]);

        await userEvent.hover(days[3]);
        expect(getDay('2021-08-09')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inhover`);
        expect(getDay('2021-08-12')).not.toHaveClass(`${dp}-day-inhover`);

        await userEvent.unhover(days[3]);
        expect(getDay('2021-08-09')).not.toHaveClass(`${dp}-day-inhover`);
    });

    it('字符串形式的 defaultPickerValue', async () => {
        await setup({ open: true, props: { defaultPickerValue: '2020-01-01' } });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getSelectedDays()).toEqual([]);
    });

    it('Date 形式的 defaultPickerValue，随父级改值更新面板', async () => {
        const { store } = await setup({ open: true, props: { defaultPickerValue: new Date(2020, 0, 1) } });
        expect(getNavTitle('left')).toBe('2020年 1月');
        store.props.defaultPickerValue = new Date(2021, 4, 1);
        await settle();
        expect(getNavTitle('left')).toBe('2021年 5月');
    });

    it('dateRange 的 defaultPickerValue', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: ['2020-01-01', '2020-02-01'] } });
        expect(getNavTitle('left')).toBe('2020年 1月');
        expect(getNavTitle('right')).toBe('2020年 2月');
    });

    it('weekStartsOn：星期表头与第一周的列顺序跟着变', async () => {
        await setup({ value: baseDate, open: true, props: { weekStartsOn: 1 } });
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['一', '二', '三', '四', '五', '六', '日']);
        // 2019-09-01 is a Sunday, the last column of the first week
        expect(getWeekDays('left', 0)[6]).toHaveAttribute('aria-label', '2019-09-01');
    });
});

describe('Svelte DatePicker 预设', () => {
    it('dateRange 与 presets：点预设写入两端并关闭面板', async () => {
        const presets = [{ text: 'This Week', start: startOfWeek(new Date(baseDate)), end: endOfWeek(new Date(baseDate)) }];
        const { store } = await setup({ open: true, props: { type: 'dateRange', presets } });

        await click(getPresetButtons()[0]);
        expect(changes(store)).toHaveLength(1);
        expect(changes(store)[0]).toMatch(/ \["2019-09-08","2019-09-14"\]$/);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2019-09-08');
        expect(endInput).toHaveValue('2019-09-14');
        expect(getContainer()).toBeNull();
    });

    it.each(['left', 'right'] as const)('presetPosition 为 %s：预设放在面板的对应一侧', async (presetPosition) => {
        await setup({ value: baseDate, open: true, props: { presetPosition, presets: [{ text: 'Today', start: new Date(), end: new Date() }] } });
        expect(getPopup()?.querySelector(`.${dp}-quick-control-${presetPosition}`)).toHaveTextContent('Today');
        expect(getPopup()?.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-preset-position', presetPosition);
    });

    it('month 类型与 presets：点预设写入年月', async () => {
        const { store } = await setup({ open: true, props: { type: 'month', presets: [{ text: 'Jan', start: new Date(2021, 0) }] } });

        await click(getPresetButtons()[0]);
        expect(changes(store)).toEqual(['change 2021-01-01 00:00:00 "2021-01"']);
        expect(getInput()).toHaveValue('2021-01');
    });
});

describe('Svelte DatePicker 输入框的键入与回车', () => {
    it('键入合法日期时触发一次 onChange，字符串是键入的日期', async () => {
        const { store } = await setup();

        await typeText('2021-08-15');
        expect(changes(store)).toEqual(['change 2021-08-15 00:00:00 "2021-08-15"']);
    });

    it('键入非法日期时不触发 onChange，输入框保留键入的文本', async () => {
        const { store } = await setup();

        await typeText('invalid-date');
        expect(changes(store)).toEqual([]);
        expect(getInput()).toHaveValue('invalid-date');
    });

    it('键入后按 Enter 不再触发 onChange，值保持', async () => {
        const { store } = await setup();

        await typeText('2021-08-15');
        expect(changes(store)).toHaveLength(1);
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(changes(store)).toHaveLength(1);
        expect(getInput()).toHaveValue('2021-08-15');
    });

    it('键入不完整的日期后按 Enter：恢复为当前值，不触发 onChange', async () => {
        const { store } = await setup({ value: baseDate });

        await typeText('2021-06-1');
        expect(getInput()).toHaveValue('2021-06-1');
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(getInput()).toHaveValue(ymd(baseDate));
        expect(changes(store)).toEqual([]);
    });

    it('键入日期触发 onChange，参数是解析出的日期', async () => {
        const { store } = await setup({ value: baseDate });

        await typeText('2021-06-15');
        expect(changes(store)).toEqual(['change 2021-06-15 00:00:00 "2021-06-15"']);
    });
});

describe('Svelte DatePicker 范围输入框', () => {
    const rangeValue = [new Date(2021, 5, 1), new Date(2021, 5, 15)];

    it('聚焦哪个输入框，哪个输入框的外壳带 active', async () => {
        await setup({ value: [new Date(2021, 7, 1), new Date(2021, 7, 15)], open: true, props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        const startWrapper = getRoot().querySelector(`.${dp}-range-input-wrapper-start`);
        const endWrapper = getRoot().querySelector(`.${dp}-range-input-wrapper-end`);

        await focusInput(startInput);
        expect(startWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        await focusInput(endInput);
        expect(startWrapper).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(endWrapper).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('聚焦起点输入框时 onFocus 报 rangeStart，且只报一次', async () => {
        const { store } = await setup({ value: rangeValue, props: { type: 'dateRange' } });
        await focusInput(getInputs()[0]);

        expect(logged(store, 'focus')).toHaveLength(1);
        expect(logged(store, 'focus')[0]).toMatch(/ rangeStart$/);
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('点击清除按钮：onClear 一次，onChange 收到空数组，两个输入框清空，按钮消失', async () => {
        const { store } = await setup({ value: [new Date(2021, 7, 1), new Date(2021, 7, 15)], props: { type: 'dateRange' } });

        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        await settle();
        expect(logged(store, 'clear')).toHaveLength(1);
        expect(changes(store)).toEqual(['change  []']);
        getInputs().forEach((input) => expect(input).toHaveValue(''));
        expect(screen.queryByRole('button', { name: zh_CN.DatePicker.clearRange })).toBeNull();
    });

    it('先后键入两端：补全后才触发一次 onChange，Enter 不再触发', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateRange' } });

        const [startInput, endInput] = getInputs();
        await typeText('2021-08-01', startInput);
        expect(changes(store)).toEqual([]);
        await typeText('2021-08-15', endInput);
        expect(changes(store)).toEqual(['change 2021-08-01 00:00:00|2021-08-15 00:00:00 ["2021-08-01","2021-08-15"]']);
        await userEvent.type(startInput, '{Enter}');
        await userEvent.type(endInput, '{Enter}');
        await settle();
        expect(changes(store)).toHaveLength(1);
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
    });

    it('键入不完整的起点后按 Enter：补全为可解析的日期，不触发 onChange', async () => {
        const { store } = await setup({ value: rangeValue, props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();

        await typeText('2021-06-0', startInput);
        expect(startInput).toHaveValue('2021-06-0');
        await userEvent.type(startInput, '{Enter}');
        await settle();
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
        expect(changes(store)).toEqual([]);
    });

    it('终点输入框按 Tab：高亮取消', async () => {
        await setup({ open: true, props: { type: 'dateRange' } });

        const endInput = getInputs()[1];
        await focusInput(endInput);
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await fireEvent.keyDown(endInput, { key: 'Tab' });
        await settle();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('有值时终点输入框按 Tab：高亮取消，面板仍然展开', async () => {
        await setup({ value: rangeValue, open: true, props: { type: 'dateRange' } });

        const endInput = getInputs()[1];
        await focusInput(endInput);
        await fireEvent.keyDown(endInput, { key: 'Tab' });
        await settle();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
        expect(getPopup()).not.toBeNull();
    });
});
