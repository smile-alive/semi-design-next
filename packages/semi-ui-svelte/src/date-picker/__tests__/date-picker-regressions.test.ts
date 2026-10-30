import { render, screen, within } from '@testing-library/svelte';
import { addDays, set } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getFooterButtons, getPanel, getYMLists, getYMSelected } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import ScenarioFixture, { type ScenarioStore } from './date-picker-scenarios-fixture.svelte';
import { changes, dp, getContainer, getDay, getInput, getInputs, getNavTitle, getRoot, getSelectedDays, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

afterEach(() => {
    vi.restoreAllMocks();
});

const getSwitchTexts = () => Array.from(document.querySelectorAll(`.${dp}-switch-text`)).map((element) => element.textContent);
const closed = () => vi.waitFor(() => expect(getContainer()).toBeNull());
const rangeStart = () => getRoot().querySelector(`.${dp}-range-input-wrapper-start`);
const rangeEnd = () => getRoot().querySelector(`.${dp}-range-input-wrapper-end`);
const rangeClass = (name: 'start' | 'end') => `${dp}-day-selected-${name}`;

/** The input that opens the panel */
async function openFromInput(index = 0) {
    const input = getInputs()[index];
    await click(input);
    return input;
}

describe('Svelte DatePicker 回归：年月与禁用月份', () => {
    it('fix #1982 Fix1982：左月大于右月时，右侧 monthRange 面板保持左侧年份可选', async () => {
        await setup({ value: ['2021-09', '2022-03'], props: { type: 'monthRange' } });
        await openFromInput();
        const rightYears = getYMLists()[2];
        expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
        expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
    });

    describe('Fix2567：切换年份后 monthRange 修正非法范围', () => {
        const disabledDate = (date: Date) => date.getTime() < new Date('2024/11/1 00:00:00').getTime() || date.getTime() > new Date('2025/3/1 00:00:00').getTime();
        const cases = [
            { value: ['2024-11', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
            { value: ['2024-12', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
            { value: ['2024-11', '2025-01'], listIndex: 0, year: '2025', expected: '2025-01 ~ 2025-01' },
        ];

        it.each(cases)('$value，在列表 $listIndex 中选择 $year', async ({ value, listIndex, year, expected }) => {
            await setup({ value, props: { type: 'monthRange', disabledDate } });
            const input = await openFromInput();
            await click(within(getYMLists()[listIndex]).getByRole('option', { name: year }));
            expect(input).toHaveValue(expected);
        });
    });

    it('fix #520 FixDisabledMonth：切换到该月份被禁用的年份时，选中最近的可用月份', async () => {
        const disabledDate = (date: Date) => date < set(date, { year: 2021, month: 10 }) || date > set(date, { year: 2022, month: 10 });
        await setup({ value: new Date(2022, 10), props: { type: 'month', disabledDate, yearAndMonthOpts: { motion: false } } });
        const input = await openFromInput();

        await click(within(getYMLists()[1]).getByRole('option', { name: '10月' }));
        await click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(getYMSelected()).toEqual(['2021年', '11月']);
        expect(input).toHaveValue('2021-11');

        await click(within(getYMLists()[1]).getByRole('option', { name: '12月' }));
        await click(within(getYMLists()[0]).getByRole('option', { name: '2022' }));
        expect(getYMSelected()).toEqual(['2022年', '1月']);
        expect(input).toHaveValue('2022-01');
    });
});

describe('Svelte DatePicker 回归：needConfirm', () => {
    describe('FixNeedConfirm：dateTimeRange 与 needConfirm 下恢复或提交输入', () => {
        const value = ['2021-12-27 10:37:13', '2022-01-28 10:37:13'];

        const pick = async () => {
            await setup({ value, props: { type: 'dateTimeRange', needConfirm: true } });
            await openFromInput();
            await click(getDay('2021-12-15'));
            await click(getDay('2022-01-20'));
            return getInputs();
        };

        it('选择后取消', async () => {
            const [startInput, endInput] = await pick();
            await click(getFooterButtons()[0]);
            await closed();
            expect(startInput).toHaveValue(value[0]);
            expect(endInput).toHaveValue(value[1]);
        });

        it('选择后确认', async () => {
            const [startInput, endInput] = await pick();
            await click(getFooterButtons()[1]);
            await closed();
            expect(startInput).toHaveValue('2021-12-15 10:37:13');
            expect(endInput).toHaveValue('2022-01-20 10:37:13');
        });
    });

    it('fix #2024 FixNeedConfirmControlled：受控 dateTimeRange 与 needConfirm 显示待定起始值，并确认完整范围', async () => {
        await setup({ mode: 'bind', value: [], props: { type: 'dateTimeRange', defaultPickerValue: '2024-02-15', needConfirm: true } });
        const [startInput, endInput] = getInputs();
        await click(startInput);
        await click(getDay('2024-02-15'));
        expect(startInput).toHaveValue('2024-02-15 00:00:00');
        const confirmButton = () => getFooterButtons()[1];
        expect(confirmButton()).toBeDisabled();

        await click(getDay('2024-02-20'));
        expect(confirmButton()).toBeEnabled();
        await click(confirmButton());
        expect(startInput).toHaveValue('2024-02-15 00:00:00');
        expect(endInput).toHaveValue('2024-02-20 00:00:00');
    });
});

describe('Svelte DatePicker 回归：defaultPickerValue 与面板定位', () => {
    describe('fix #735 FixDefaultPickerValue：数字形式的 defaultPickerValue 定位面板', () => {
        it('dateTime', async () => {
            await setup({ props: { type: 'dateTime', defaultPickerValue: new Date('2021-03-15 00:00:00').valueOf() } });
            await openFromInput();
            expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00']);
        });

        it('dateTimeRange', async () => {
            await setup({ props: { type: 'dateTimeRange', defaultPickerValue: [new Date('2021-03-15 00:00:00').valueOf(), new Date('2021-05-15 23:59:59').valueOf()] } });
            await openFromInput();
            expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00', '2021-05-15', '23:59:59']);
        });

        it('1970 年之前', async () => {
            await setup({ props: { type: 'dateTime', defaultPickerValue: new Date('1910-01-01 13:00:00') } });
            await openFromInput();
            expect(getSwitchTexts()).toEqual(['1910-01-01', '13:00:00']);
        });
    });

    describe('fix #1221 FixRangePanelShift：范围面板不发生偏移', () => {
        it.each(['dateRange', 'dateTimeRange'] as const)('%s：在右侧面板选择时保持两个月份', async (type) => {
            await setup({ props: { type, defaultPickerValue: '2019-07-01' } });
            await openFromInput();
            await click(getDay('2019-08-20'));
            expect(getNavTitle('left')).toBe('2019年 7月');
            expect(getNavTitle('right')).toBe('2019年 8月');
        });

        it.each(['dateRange', 'dateTimeRange'] as const)('%s：跨月的 value 打开时定位到起止月份', async (type) => {
            await setup({ value: ['2019-07-01', '2019-08-02'], props: { type } });
            await openFromInput();
            expect(getNavTitle('left')).toBe('2019年 7月');
            expect(getNavTitle('right')).toBe('2019年 8月');
            expect(getPanel('left').querySelector(`.${dp}-day-selected-start`)).toHaveAttribute('aria-label', '2019-07-01');
            expect(getPanel('right').querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2019-08-02');
        });
    });

    describe('fix #1422 FixMultiplePanelShift：多选时不会跳回第一个已选月份', () => {
        it.each([
            ['不传 value', {}],
            ['bind:value', { mode: 'bind' as const }],
        ])('%s', async (_name, init) => {
            await setup({ ...init, props: { type: 'date', multiple: true, defaultPickerValue: '2019-07-01' } });
            await openFromInput();
            await click(getDay('2019-07-20'));
            await click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
            await click(getDay('2019-08-20'));
            expect(getNavTitle('left')).toBe('2019年 8月');
            expect(getSelectedDays()).toEqual(['2019-08-20']);
        });
    });

    it('fix #1413 InsetInputControlled：受控 dateTimeRange 的 insetInput 显示已选日期', async () => {
        await setup({ mode: 'bind', props: { type: 'dateTimeRange', defaultPickerValue: ['2022-02-07', '2023-02-07'], insetInput: true } });
        await openFromInput();
        await click(getDay('2022-02-20'));
        await click(getDay('2023-02-20'));
        const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2022-02-20', '00:00:00', '2023-02-20', '00:00:00']);
    });

    it('fix #422 FixParseISOBug：五位年份的 value 视为空值', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        await setup({ value: '20221-12-20', open: true });
        expect(getInput()).toHaveValue('');
        expect(getContainer()).not.toBeNull();
        expect(getSelectedDays()).toEqual([]);
    });
});

describe('Svelte DatePicker 回归：选择与受控值', () => {
    it('fix #1522 FixTimeZone：字符串 timeZone 下，受控 dateTime 值经 change 往返一致', async () => {
        const { store } = await setup({ mode: 'bind', props: { type: 'dateTime', defaultPickerValue: '2020-02-13', timeZone: 'GMT+00:00' } });
        const input = await openFromInput();
        await click(getDay('2020-02-15'));
        expect(changes(store)).toHaveLength(1);
        // in GMT+00:00 the shown wall time must equal the UTC time of the emitted date
        const utcText = (store.value as Date).toISOString().slice(0, 19).replace('T', ' ');
        expect(utcText.startsWith('2020-02-15')).toBe(true);
        expect(input).toHaveValue(utcText);
    });

    it.each([
        ['GMT+05:00', '2023-05-03 08:29:00'],
        ['GMT-05:00', '2023-05-02 22:29:00'],
        ['GMT+00:00', '2023-05-03 03:29:00'],
        ['GMT+14:00', '2023-05-03 17:29:00'],
    ])('fix #1585 FeatEtcGMT：timeZone %s 显示 %s', async (timeZone, expected) => {
        await setup({ value: 1683084540000, props: { type: 'dateTime', timeZone } });
        expect(getInput()).toHaveValue(expected);
    });

    it('fix #1592 FixDisabledDate：起始被禁用时，聚焦结束输入框仍可选择范围结束日期', async () => {
        const today = new Date('2023-05-06 00:00:00');
        await setup({
            props: {
                type: 'dateRange',
                defaultPickerValue: new Date('2023-05-06'),
                disabledDate: (date, { rangeInputFocus } = {}) => {
                    const days = rangeInputFocus === 'rangeStart' ? 2 : rangeInputFocus === 'rangeEnd' ? 3 : 0;
                    return days > 0 && addDays(today, -days) <= date && date <= addDays(today, days);
                },
            },
        });
        const [startInput, endInput] = getInputs();
        await click(startInput);
        await click(getDay('2023-05-03'));
        await click(getDay('2023-05-10'));
        expect(startInput).toHaveValue('2023-05-03');
        expect(endInput).toHaveValue('2023-05-10');
    });

    it('fix #1846 FixedNaN：NaN 值渲染为空输入框，选择后重置', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { store } = await setup({ mode: 'bind', value: [Number.NaN, Number.NaN], props: { type: 'dateRange', defaultPickerValue: '2024-01-01', presets: [{ text: 'Empty' }] } });
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('value cannot be parsed'));

        await click(startInput);
        await click(getDay('2024-01-15'));
        await click(getDay('2024-01-15'));
        expect(startInput).toHaveValue('2024-01-15');
        expect(endInput).toHaveValue('2024-01-15');

        store.value = [Number.NaN, Number.NaN];
        await settle();
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('');
    });

    it('fix #1652 FixedSelectedStatus：再次点击已选日期时保持选中', async () => {
        await setup({ props: { type: 'dateTime', defaultPickerValue: '2022-07-01' } });
        await openFromInput();
        await click(getDay('2022-07-15'));
        expect(getSelectedDays()).toEqual(['2022-07-15']);
        await click(getDay('2022-07-15'));
        expect(getSelectedDays()).toEqual(['2022-07-15']);
    });

    it('fix #2387 FixedControlled：受控值未变化时，面板关闭后重置待定范围', async () => {
        await setup({ mode: 'function', accept: false, value: [new Date(2022, 7, 8), new Date(2022, 7, 9)], props: { type: 'dateRange', defaultPickerValue: '2022-08-01' } });
        const [startInput, endInput] = getInputs();
        await click(endInput);
        await click(getDay('2022-08-15'));
        expect(getDay('2022-08-08')).toHaveClass(rangeClass('start'));
        expect(getDay('2022-08-15')).toHaveClass(rangeClass('end'));

        await click(startInput);
        await click(getDay('2022-08-10'));
        await closed();
        await click(startInput);
        expect(getDay('2022-08-08')).toHaveClass(rangeClass('start'));
        expect(getDay('2022-08-09')).toHaveClass(rangeClass('end'));
    });

    it('fix #2521 FixedControlledValue：重新打开时受控范围显示已选内容', async () => {
        await setup({ mode: 'bind', value: [], props: { type: 'dateRange', defaultPickerValue: ['2023-10-01'] } });
        const startInput = await openFromInput();
        await click(getDay('2023-10-15'));
        await click(getDay('2023-11-20'));
        await closed();
        await click(startInput);
        expect(getDay('2023-10-15')).toHaveClass(rangeClass('start'));
        expect(getDay('2023-11-20')).toHaveClass(rangeClass('end'));
    });

    it('FixNotifyChange：切换 ConfigProvider timeZone 不通知受控范围，完整选择只通知一次', async () => {
        const notified: unknown[] = [];
        const store = createStore<ProviderFixtureStore>({
            timeZone: 0,
            props: {
                type: 'dateTimeRange',
                defaultPickerValue: '2021-08-01',
                motion: false,
                onChange: (value) => {
                    notified.push(value);
                    store.props.value = value;
                },
            },
        });
        render(ProviderFixture, { props: { store } });
        await settle();
        store.timeZone = 8;
        await settle();
        expect(notified).toHaveLength(0);

        await click(getInput());
        await click(getDay('2021-08-10'));
        await click(getDay('2021-08-12'));
        expect(notified).toHaveLength(1);
        expect(notified[0]).toHaveLength(2);

        store.timeZone = 0;
        await settle();
        expect(notified).toHaveLength(1);
    });
});

async function setupScenario(init: ScenarioStore) {
    const store = createStore<ScenarioStore>(init);
    render(ScenarioFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker 回归：自定义内容与外部控制', () => {
    it('fix #528 FixInputRangeFocus：受控打开的范围选择器在面板内关闭时，清除输入框焦点状态', async () => {
        await setupScenario({ scenario: 'focus-open', open: false, props: { type: 'dateTimeRange', defaultPickerValue: '2022-02-01', motion: false } });
        await click(getInputs()[0]);
        await vi.waitFor(() => expect(rangeStart()).toHaveClass(`${dp}-range-input-wrapper-active`));
        await click(getDay('2022-02-10'));
        await click(getDay('2022-02-15'));
        await click(screen.getByRole('button', { name: 'close' }));
        await closed();
        expect(rangeStart()).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(rangeEnd()).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    it('fix #676 FixedTriggerRender：空的受控 value 将范围选择重置为起始日期', async () => {
        const store = await setupScenario({ scenario: 'reset-trigger', value: [], props: { type: 'dateTimeRange', defaultPickerValue: '2022-07-01', motion: false } });
        await click(screen.getByRole('button', { name: 'trigger' }));
        await click(getDay('2022-07-10'));
        await click(getDay('2022-07-15'));
        expect(store.value).toEqual([new Date(2022, 6, 10), new Date(2022, 6, 15)]);

        await click(screen.getByRole('button', { name: 'clear' }));
        await click(getDay('2022-07-20'));
        await click(getDay('2022-07-25'));
        expect(store.value).toEqual([new Date(2022, 6, 20), new Date(2022, 6, 25)]);
    });

    it('FixNeedConfirmInTabs：离开标签页时，bind:this 的 close() 隐藏 needConfirm 面板', async () => {
        await setupScenario({ scenario: 'tabs' });
        await click(document.querySelector('input') as HTMLElement);
        expect(getContainer()).not.toBeNull();
        await click(screen.getByRole('tab', { name: 'start' }));
        await closed();
    });

    it('未设置 insetInput 时，面板显示不会把焦点拉回触发输入框', async () => {
        await setupScenario({ scenario: 'bottom-button', props: { type: 'dateRange', defaultPickerValue: '2023-04-01', motion: false } });
        await click(getInputs()[0]);
        const slot = screen.getByRole('button', { name: 'slot' });
        await click(slot);
        // Tooltip reports the panel open (where DatePicker moves focus) in a task after the popup mounts
        await vi.waitFor(() => expect(getContainer()).not.toBeNull());
        await settle();
        expect(document.activeElement).toBe(slot);
    });
});
