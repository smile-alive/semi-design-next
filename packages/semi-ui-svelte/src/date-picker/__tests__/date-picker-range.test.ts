import { add, addDays, addWeeks, endOfWeek, startOfWeek } from 'date-fns';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { click, getFooterButtons, getPanel, getPopups, getPresetButtons, getWeekDays, setupPinned, ymd } from './date-picker-dom-utils';
import { changes, dp, getContainer, getDay, getInputs, getNavTitle, getRoot, getSelectedDays, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const rangeValue = (dayOffset: number) => [new Date(baseDate), new Date(baseDate).setDate(baseDate.getDate() + dayOffset)];

async function focusInput(input: HTMLInputElement) {
    input.focus();
    await settle();
}

describe('Svelte DatePicker 范围选择', () => {
    it('dateTimeRange：切换面板后先后点选两端，写回两个输入框并报 onChange', async () => {
        const dayOffset = 3;
        const leftPrevClickTimes = 3;
        const { store } = await setupPinned({ value: rangeValue(dayOffset), props: { type: 'dateTimeRange', needConfirm: false } });

        const startDay = document.querySelector(`.${dp}-day-selected-start`) as Element;
        const endDay = document.querySelector(`.${dp}-day-selected-end`);
        expect(Array.from({ length: dayOffset }).reduce<Element>((current) => current.nextElementSibling as Element, startDay)).toBe(endDay);

        await click(getPanel('right').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        for (let i = 0; i < leftPrevClickTimes; i++) {
            await click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.prevMonth}"]`) as HTMLElement);
        }

        const [startInput, endInput] = getInputs();
        await focusInput(startInput);
        await click(getWeekDays('left', 1)[0]);
        await focusInput(endInput);
        await click(getWeekDays('left', 1)[dayOffset]);

        expect(changes(store).at(-1)).toMatch(/^change 2019-06-02 \d\d:\d\d:\d\d\|2019-06-05 \d\d:\d\d:\d\d /);
        expect(startInput.value.startsWith('2019-06-02')).toBe(true);
        expect(endInput.value.startsWith('2019-06-05')).toBe(true);
    });

    it('选完起点后焦点和高亮转到终点输入框，选完终点后面板关闭', async () => {
        await setup({ value: rangeValue(3), open: true, props: { type: 'dateRange', needConfirm: false } });
        const [startInput, endInput] = getInputs();

        await focusInput(startInput);
        await click(getWeekDays('left', 1)[0]);
        expect(endInput).toHaveFocus();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await click(getWeekDays('left', 1)[3]);
        expect(getContainer()).toBeNull();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });

    it('起点晚于旧终点时，终点输入框被清空并获焦', async () => {
        await setup({ value: rangeValue(3), open: true, props: { type: 'dateRange', needConfirm: false } });
        const [startInput, endInput] = getInputs();

        await focusInput(startInput);
        await click(getWeekDays('left', 2)[0]);
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2019-09-15');
        expect(endInput).toHaveValue('');
    });

    it('点击第一个日期时不触发 onChange，选完两端才触发一次', async () => {
        const { store } = await setup({ mode: 'bind', open: true, props: { type: 'dateRange', defaultPickerValue: '2021-08-13' } });
        const [startInput, endInput] = getInputs();

        await focusInput(startInput);
        await click(getWeekDays('left', 1)[0]);
        expect(changes(store)).toEqual([]);
        await focusInput(endInput);
        await click(getWeekDays('left', 1)[2]);
        expect(changes(store)).toEqual(['change 2021-08-08 00:00:00|2021-08-10 00:00:00 ["2021-08-08","2021-08-10"]']);
        expect(startInput).toHaveValue('2021-08-08');
        expect(endInput).toHaveValue('2021-08-10');
    });

    it('起点被禁用时仍可选择终点', async () => {
        const defaultValue = ['2021-08-06', '2021-08-15'];
        const { store } = await setup({ value: defaultValue, open: true, props: { type: 'dateRange', disabledDate: (date) => new Date(date).getMonth() === 7 } });
        const [startInput, endInput] = getInputs();

        await focusInput(endInput);
        await click(getWeekDays('right', 1)[5]);

        expect(changes(store)).toEqual(['change 2021-08-06 00:00:00|2021-09-10 00:00:00 ["2021-08-06","2021-09-10"]']);
        expect(startInput).toHaveValue(defaultValue[0]);
        expect(endInput).toHaveValue('2021-09-10');
    });

    it('周选择：点击一天得到所在的完整一周', async () => {
        await setup({
            open: true,
            props: {
                type: 'dateRange',
                endDateOffset: (date) => endOfWeek(date, { weekStartsOn: 1 }),
                startDateOffset: (date) => startOfWeek(date, { weekStartsOn: 1 }),
                weekStartsOn: 1,
            },
        });

        await click(getWeekDays('left', 1)[3]);

        const now = new Date();
        const monthFirstDay = add(new Date(now.getFullYear(), 0, 1, 0, 0, 0), { months: now.getMonth() });
        const clicked = addDays(startOfWeek(addWeeks(monthFirstDay, 1), { weekStartsOn: 1 }), 3);
        const [startInput, endInput] = getInputs();

        expect(startInput).toHaveValue(ymd(startOfWeek(clicked, { weekStartsOn: 1 })));
        expect(endInput).toHaveValue(ymd(endOfWeek(clicked, { weekStartsOn: 1 })));
    });

    it('周选择在 UTC 以西时区点击周三得到完整的一周', async () => {
        const originalTZ = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            await setup({
                open: true,
                props: {
                    type: 'dateRange',
                    defaultPickerValue: '2021-06-01',
                    endDateOffset: (date) => endOfWeek(date, { weekStartsOn: 1 }),
                    startDateOffset: (date) => startOfWeek(date, { weekStartsOn: 1 }),
                    weekStartsOn: 1,
                },
            });
            await click(getDay('2021-06-16'));
            const [startInput, endInput] = getInputs();
            expect(startInput).toHaveValue('2021-06-14');
            expect(endInput).toHaveValue('2021-06-20');
        } finally {
            process.env.TZ = originalTZ;
        }
    });
});

describe('Svelte DatePicker 范围面板导航', () => {
    const navNames: Record<string, string> = {
        'Previous year': zh_CN.DatePicker.prevYear,
        'Next year': zh_CN.DatePicker.nextYear,
        'Previous month': zh_CN.DatePicker.prevMonth,
        'Next month': zh_CN.DatePicker.nextMonth,
    };
    const navButton = (side: string, label: string) => getPanel(side).querySelector(`[aria-label="${navNames[label]}"]`) as HTMLElement;

    it('点击上一年与下一年按钮', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: new Date('2021-12-01') } });

        await click(navButton('left', 'Previous year'));
        expect(getNavTitle('left')).toBe('2020年 12月');
        await click(navButton('left', 'Next year'));
        expect(getNavTitle('left')).toBe('2021年 12月');

        await click(navButton('right', 'Next year'));
        expect(getNavTitle('right')).toBe('2023年 1月');
        await click(navButton('right', 'Previous year'));
        expect(getNavTitle('right')).toBe('2022年 1月');
    });

    it.each(['dateRange', 'dateTimeRange'] as const)('%s 类型下两个面板的月份同步切换', async (type) => {
        await setup({ open: true, props: { type, defaultPickerValue: new Date('2021-12-01') } });

        await click(navButton('left', 'Next month'));
        expect(getNavTitle('left')).toBe('2022年 1月');
        expect(getNavTitle('right')).toBe('2022年 2月');
        await click(navButton('right', 'Previous month'));
        expect(getNavTitle('left')).toBe('2021年 12月');
        expect(getNavTitle('right')).toBe('2022年 1月');

        await click(navButton('left', 'Previous month'));
        expect(getNavTitle('left')).toBe('2021年 11月');
    });
});

describe('Svelte DatePicker 范围的预设与输入', () => {
    it('预设值为 null：清空两端并关闭', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateRange', presets: [{ text: 'Today', start: null, end: null }] } });

        await click(getPresetButtons()[0]);
        expect(changes(store)).toEqual(['change  []']);
        expect(getContainer()).toBeNull();
        getInputs().forEach((input) => expect(input).toHaveValue(''));
    });

    it('预设值为 null 且 needConfirm：点预设报空 onChange，确认后报空 onConfirm 并关闭', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTimeRange', needConfirm: true, presets: [{ text: 'Today', start: null, end: null }] } });

        await click(getPresetButtons()[0]);
        expect(changes(store)).toEqual(['change  []']);
        expect(getPopups()).toHaveLength(1);
        await click(getFooterButtons()[1]);
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual(['confirm ']);
        expect(getContainer()).toBeNull();
    });

    it('trigger snippet 的 dateRange：点击打开面板，选完两端后关闭', async () => {
        await setup({ trigger: 'button', props: { type: 'dateRange' } });
        await click(document.querySelector('.custom-trigger') as HTMLElement);
        expect(getPopups()).toHaveLength(1);
        await click(getWeekDays('left', 1)[0]);
        expect(getPopups()).toHaveLength(1);
        await click(getWeekDays('right', 1)[0]);
        expect(getContainer()).toBeNull();
    });

    it('rangeSeparator 同时作用于 dateRange 与 dateTimeRange', async () => {
        const props = { value: ['2021-08-06', '2021-08-15'], props: { rangeSeparator: '-' } };
        await setup({ ...props, props: { ...props.props, type: 'dateRange' } });
        await setup({ ...props, props: { ...props.props, type: 'dateTimeRange' } });
        const separators = document.querySelectorAll(`.${dp}-range-input-separator`);
        expect(separators).toHaveLength(2);
        expect(separators[0].textContent?.trim()).toBe('-');
        expect(separators[1].textContent?.trim()).toBe('-');
    });

    it('rangeSeparator 两侧带空格时原样显示，并按去除空白的分隔符解析输入', async () => {
        const { store } = await setup({ value: [new Date(baseDate), addDays(new Date(baseDate), 5)], open: true, props: { type: 'dateRange', rangeSeparator: ' - ' } });
        expect(getRoot().querySelector(`.${dp}-range-input-separator`)?.textContent).toBe(' - ');
        const [startInput, endInput] = getInputs();
        await typeText(ymd(addDays(baseDate, 6)), endInput);
        expect(changes(store)).toEqual([`change 2019-09-08 00:00:00|2019-09-14 00:00:00 ["2019-09-08","2019-09-14"]`]);
        expect(startInput).toHaveValue(ymd(baseDate));
    });

    it('dateRange 的初始值：起点、终点与区间内的日期各带对应 class', async () => {
        await setup({ value: [new Date(2021, 7, 1), new Date(2021, 7, 15)], open: true, props: { type: 'dateRange' } });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        expect(getDay('2021-08-10')).toHaveClass(`${dp}-day-inrange`);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021-08-01');
        expect(endInput).toHaveValue('2021-08-15');
        expect(getSelectedDays()).toContain('2021-08-01');
    });
});

describe('Svelte DatePicker 禁用与多选', () => {
    it('多选：每点一个日期报一次 onChange，面板保持打开', async () => {
        const { store } = await setup({ open: true, props: { type: 'date', multiple: true, defaultPickerValue: '2021-08-01' } });

        await click(getWeekDays('left', 1)[0]);
        expect(changes(store)).toHaveLength(1);

        await click(getWeekDays('left', 1)[1]);
        expect(changes(store)).toHaveLength(2);
        expect(changes(store)[1]).toBe('change 2021-08-08 00:00:00|2021-08-09 00:00:00 ["2021-08-08","2021-08-09"]');
        expect(getSelectedDays()).toEqual(['2021-08-08', '2021-08-09']);
        expect(getInputs()[0]).toHaveValue('2021-08-08,2021-08-09');
        expect(getPopups()).toHaveLength(1);
    });

    it('多选中被 disabledDate 禁用的日期点击无效', async () => {
        const { store } = await setup({
            value: ['2021-08-06', '2021-08-15'],
            open: true,
            props: {
                type: 'date',
                multiple: true,
                disabledDate: (date) => {
                    const day = new Date(date).getDate();
                    return day > 20 && day < 25;
                },
            },
        });
        const input = getInputs()[0];

        await click(getWeekDays('left', 1)[2]);
        expect(getSelectedDays()).toEqual(['2021-08-06', '2021-08-10', '2021-08-15']);
        expect(changes(store)).toHaveLength(1);
        expect(input).toHaveValue('2021-08-06,2021-08-15,2021-08-10');

        await click(getWeekDays('left', 2)[6]);
        expect(getSelectedDays()).toEqual(['2021-08-06', '2021-08-10', '2021-08-15']);
        expect(input).toHaveValue('2021-08-06,2021-08-15,2021-08-10');
        expect(changes(store)).toHaveLength(1);
    });

    it('disabledTime 收到面板日期和面板方位：range 是数组，单选是单个日期', async () => {
        const disabledTime = vi.fn<(date?: Date | Date[], panelType?: string) => { disabledHours: () => number[] }>((_date, panelType) => (panelType === 'left' ? { disabledHours: () => [17, 18] } : { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] }));
        const { store } = await setup({
            value: ['2021-09-08', '2021-10-03'],
            open: true,
            props: { type: 'dateTimeRange', disabledTime, timePickerOpts: { scrollItemProps: { cycled: false } } },
        });
        const switchTime = () => document.querySelector(`.${dp}-month-grid-left .${dp}-switch-time`) as HTMLElement;

        await click(switchTime());
        const args = disabledTime.mock.lastCall as unknown[];
        expect((args[0] as Date[]).length).toBe(2);
        expect(args[1]).toBe('left');

        store.props.type = 'dateTime';
        await settle();
        await click(switchTime());
        const args2 = disabledTime.mock.lastCall as unknown[];
        expect(Array.isArray(args2[0])).toBe(false);
        expect(args2[1]).toBe('left');
    });
});
