import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { addDays, format, set } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/solid';
import DatePicker, { type DatePickerElement, type DatePickerProps, type DisabledDateType } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Tabs from '../../tabs';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${dp}`;

function renderDatePicker(initial: DatePickerProps = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <DatePicker {...props()} />);
    return { ...result, rerender: (next: DatePickerProps) => setProps(next) };
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector);
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const getOption = (list: HTMLElement, name: string) => within(list).getByRole('option', { name });
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const typeIn = (input: Element, value: string) => fireEvent.input(input, { target: { value } });
const firstInput = (container: HTMLElement) => container.querySelector('input') as HTMLInputElement;
const getRoot = () => document.querySelector(`.${dp}`);
// Tooltip reports the panel open (onOpen, where DatePicker moves focus) in a task after the popup mounts;
// await this before asserting so that focus change cannot land afterwards
const waitForPanelOpened = async () => {
    await waitFor(() => expect(getPopup()).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve));
};

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 回归用例', () => {
    const getSwitchTexts = () => Array.from(document.querySelectorAll(`.${dp}-switch-text`)).map((el) => el.textContent);

    it('fix #1982 Fix1982：左月大于右月时，右侧 monthRange 面板保持左侧年份可选', async () => {
        const { container } = renderDatePicker({ type: 'monthRange', defaultValue: ['2021-09', '2022-03'], motion: false });
        await userEvent.click(firstInput(container));
        const rightYears = getYMLists()[2];
        expect(getOption(rightYears, '2020')).toHaveAttribute('aria-disabled', 'true');
        expect(getOption(rightYears, '2021')).toHaveAttribute('aria-disabled', 'false');
    });

    describe('Fix2567：切换年份后 monthRange 修正非法范围', () => {
        const disabledDate = (date?: Date) => {
            const time = (date as Date).getTime();
            return time < new Date('2024/11/1 00:00:00').getTime() || time > new Date('2025/3/1 00:00:00').getTime();
        };
        it.each([
            { defaultValue: ['2024-11', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
            { defaultValue: ['2024-12', '2025-01'], listIndex: 2, year: '2024', expected: '2024-11 ~ 2024-11' },
            { defaultValue: ['2024-11', '2025-01'], listIndex: 0, year: '2025', expected: '2025-01 ~ 2025-01' },
        ])('$defaultValue，在列表 $listIndex 中选择 $year', async ({ defaultValue, listIndex, year, expected }) => {
            const { container } = renderDatePicker({ type: 'monthRange', defaultValue, disabledDate, motion: false });
            const input = firstInput(container);
            await userEvent.click(input);
            await userEvent.click(getOption(getYMLists()[listIndex], year));
            expect(input).toHaveValue(expected);
        });
    });

    describe('FixNeedConfirm：dateTimeRange 与 needConfirm 下恢复或提交输入', () => {
        const defaultValue = ['2021-12-27 10:37:13', '2022-01-28 10:37:13'];
        const renderAndPick = async () => {
            const { container } = renderDatePicker({ type: 'dateTimeRange', defaultValue, motion: false, needConfirm: true });
            const all = inputs(container);
            await userEvent.click(all[0]);
            await userEvent.click(getDay('2021-12-15'));
            await userEvent.click(getDay('2022-01-20'));
            return all;
        };

        it('选择后取消', async () => {
            const [startInput, endInput] = await renderAndPick();
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(startInput).toHaveValue(defaultValue[0]);
            expect(endInput).toHaveValue(defaultValue[1]);
        });

        it('选择后确认', async () => {
            const [startInput, endInput] = await renderAndPick();
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(startInput).toHaveValue('2021-12-15 10:37:13');
            expect(endInput).toHaveValue('2022-01-20 10:37:13');
        });
    });

    it('fix #528 FixInputRangeFocus：受控打开的范围选择器在面板内关闭时，清除输入框焦点状态', async () => {
        const [visible, setVisible] = createSignal(false);
        const { container } = render(() => (
            <DatePicker
                type="dateTimeRange"
                bottomSlot={
                    <button type="button" onClick={() => setVisible(false)}>
                        close
                    </button>
                }
                defaultPickerValue="2022-02-01"
                motion={false}
                open={visible()}
                showClear
                onFocus={() => setVisible(true)}
            />
        ));
        await userEvent.click(firstInput(container));
        await waitForPanelOpened();
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.click(getDay('2022-02-10'));
        await userEvent.click(getDay('2022-02-15'));
        await userEvent.click(screen.getByRole('button', { name: 'close' }));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(container.querySelector(`.${dp}-range-input-wrapper-end`)).not.toHaveClass(`${dp}-range-input-wrapper-active`);
    });

    describe('fix #735 FixDefaultPickerValue：数字形式的 defaultPickerValue 定位面板', () => {
        it('dateTime', async () => {
            const { container } = renderDatePicker({ type: 'dateTime', defaultPickerValue: new Date('2021-03-15 00:00:00').valueOf(), motion: false });
            await userEvent.click(firstInput(container));
            expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00']);
        });

        it('dateTimeRange', async () => {
            const { container } = renderDatePicker({ type: 'dateTimeRange', defaultPickerValue: [new Date('2021-03-15 00:00:00').valueOf(), new Date('2021-05-15 23:59:59').valueOf()], motion: false });
            await userEvent.click(firstInput(container));
            expect(getSwitchTexts()).toEqual(['2021-03-15', '00:00:00', '2021-05-15', '23:59:59']);
        });

        it('1970 年之前', async () => {
            const { container } = renderDatePicker({ type: 'dateTime', defaultPickerValue: new Date('1910-01-01 13:00:00'), motion: false });
            await userEvent.click(firstInput(container));
            expect(getSwitchTexts()).toEqual(['1910-01-01', '13:00:00']);
        });
    });

    it('fix #676 FixedTriggerRender：空的受控 value 将范围选择重置为起始日期', async () => {
        const onChange = vi.fn<(date: Date | Date[]) => void>();
        const [date, setDate] = createSignal<DatePickerProps['value']>([]);
        render(() => (
            <DatePicker
                type="dateTimeRange"
                value={date()}
                defaultPickerValue="2022-07-01"
                motion={false}
                triggerRender={() => (
                    <div>
                        <button type="button">trigger</button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDate(null);
                            }}
                        >
                            clear
                        </button>
                    </div>
                )}
                onChange={(v) => {
                    onChange(v);
                    setDate(v);
                }}
            />
        ));
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(getDay('2022-07-10'));
        await userEvent.click(getDay('2022-07-15'));
        const lastDates = () => (onChange.mock.lastCall as Parameters<typeof onChange>)[0] as Date[];
        expect(lastDates().map(ymd)).toEqual(['2022-07-10', '2022-07-15']);

        await userEvent.click(screen.getByRole('button', { name: 'clear' }));
        await userEvent.click(getDay('2022-07-20'));
        await userEvent.click(getDay('2022-07-25'));
        expect(lastDates().map(ymd)).toEqual(['2022-07-20', '2022-07-25']);
    });

    it('fix #520 FixDisabledMonth：切换到该月份被禁用的年份时，选中最近的可用月份', async () => {
        const disabledDate = (date?: Date) => {
            const d = date as Date;
            return d < set(d, { year: 2021, month: 10 }) || d > set(d, { year: 2022, month: 10 });
        };
        const { container } = renderDatePicker({ type: 'month', defaultValue: new Date('2022-11'), disabledDate, motion: false, yearAndMonthOpts: { motion: false } });
        const input = firstInput(container);
        await userEvent.click(input);

        await userEvent.click(getOption(getYMLists()[1], '10月'));
        await userEvent.click(getOption(getYMLists()[0], '2021'));
        expect(getYMSelected()).toEqual(['2021年', '11月']);
        expect(input).toHaveValue('2021-11');

        await userEvent.click(getOption(getYMLists()[1], '12月'));
        await userEvent.click(getOption(getYMLists()[0], '2022'));
        expect(getYMSelected()).toEqual(['2022年', '1月']);
        expect(input).toHaveValue('2022-01');
    });

    describe('fix #1221 FixRangePanelShift：范围面板不发生偏移', () => {
        it.each(['dateRange', 'dateTimeRange'] as const)('%s：在右侧面板选择时保持两个月份', async (type) => {
            const { container } = renderDatePicker({ type, defaultPickerValue: '2019-07-01', motion: false });
            await userEvent.click(firstInput(container));
            await userEvent.click(getDay('2019-08-20'));
            expect(getNavTitle('left')).toBe('2019年 7月');
            expect(getNavTitle('right')).toBe('2019年 8月');
        });

        it.each(['dateRange', 'dateTimeRange'] as const)('%s：跨月的 defaultValue 打开时定位到起止月份', async (type) => {
            const { container } = renderDatePicker({ type, defaultValue: ['2019-07-01', '2019-08-02'], motion: false });
            await userEvent.click(firstInput(container));
            expect(getNavTitle('left')).toBe('2019年 7月');
            expect(getNavTitle('right')).toBe('2019年 8月');
            expect(getPanel('left').querySelector(`.${dp}-day-selected-start`)).toHaveAttribute('aria-label', '2019-07-01');
            expect(getPanel('right').querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2019-08-02');
        });
    });

    it('fix #1413 InsetInputControlled：受控 dateTimeRange 的 insetInput 显示已选日期', async () => {
        const [date, setDate] = createSignal<DatePickerProps['value']>();
        const { container } = render(() => <DatePicker type="dateTimeRange" value={date()} defaultPickerValue={['2022-02-07', '2023-02-07']} insetInput motion={false} onChange={setDate} />);
        await userEvent.click(firstInput(container));
        await userEvent.click(getDay('2022-02-20'));
        await userEvent.click(getDay('2023-02-20'));
        const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper .${BASE_CLASS_PREFIX}-input`);
        expect(Array.from(insetInputs).map((input) => input.value)).toEqual(['2022-02-20', '00:00:00', '2023-02-20', '00:00:00']);
    });

    describe('fix #1422 FixMultiplePanelShift：多选时不会跳回第一个已选月份', () => {
        function Controlled() {
            const [date, setDate] = createSignal<DatePickerProps['value']>();
            return <DatePicker type="date" multiple value={date()} defaultPickerValue="2019-07-01" motion={false} onChange={setDate} />;
        }
        it.each([
            ['uncontrolled', () => <DatePicker type="date" multiple defaultPickerValue="2019-07-01" motion={false} />],
            ['controlled', () => <Controlled />],
        ])('%s', async (_name, renderDemo) => {
            const { container } = render(renderDemo);
            await userEvent.click(firstInput(container));
            await userEvent.click(getDay('2019-07-20'));
            await userEvent.click(getPanel('left').querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
            await userEvent.click(getDay('2019-08-20'));
            expect(getNavTitle('left')).toBe('2019年 8月');
            expect(getSelectedDays()).toEqual(['2019-08-20']);
        });
    });

    it('fix #1522 FixTimeZone：字符串 timeZone 下，受控 dateTime 值经 onChange 往返一致', async () => {
        const onChange = vi.fn<(date: Date | Date[]) => void>();
        const [value, setValue] = createSignal<DatePickerProps['value']>();
        const { container } = render(() => (
            <DatePicker
                type="dateTime"
                value={value()}
                defaultPickerValue="2020-02-13"
                motion={false}
                timeZone="GMT+00:00"
                onChange={(date) => {
                    onChange(date);
                    setValue(date);
                }}
            />
        ));
        const input = firstInput(container);
        await userEvent.click(input);
        await userEvent.click(getDay('2020-02-15'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const utcText = (onChange.mock.calls[0][0] as Date).toISOString().slice(0, 19).replace('T', ' ');
        expect(utcText.startsWith('2020-02-15')).toBe(true);
        expect(input).toHaveValue(utcText);
    });

    it('FixNeedConfirmInTabs：离开标签页时，ref close() 隐藏 needConfirm 面板', async () => {
        let picker!: DatePickerElement;
        const { container } = render(() => (
            <Tabs
                type="line"
                onChange={(activeKey) => {
                    if (activeKey === '2') {
                        picker.close();
                    }
                }}
            >
                <Tabs.TabPane itemKey="1" tab="doc">
                    <DatePicker ref={(el) => (picker = el)} type="dateTime" motion={false} needConfirm />
                </Tabs.TabPane>
                <Tabs.TabPane itemKey="2" tab="start">
                    <DatePicker type="dateTimeRange" motion={false} needConfirm />
                </Tabs.TabPane>
            </Tabs>
        ));
        await userEvent.click(firstInput(container));
        expect(getPopup()).not.toBeNull();
        await userEvent.click(screen.getByRole('tab', { name: 'start' }));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('未设置 insetInput 时，面板显示不会把焦点拉回触发输入框', async () => {
        const { container } = renderDatePicker({
            type: 'dateRange',
            bottomSlot: <button type="button">slot</button>,
            defaultPickerValue: '2023-04-01',
            motion: false,
        });
        await userEvent.click(firstInput(container));
        const slot = screen.getByRole('button', { name: 'slot' });
        await userEvent.click(slot);
        await waitForPanelOpened();
        expect(document.activeElement).toBe(slot);
    });

    it.each([
        ['GMT+05:00', '2023-05-03 08:29:00'],
        ['GMT-05:00', '2023-05-02 22:29:00'],
        ['GMT+00:00', '2023-05-03 03:29:00'],
        ['GMT+14:00', '2023-05-03 17:29:00'],
    ])('fix #1585 FeatEtcGMT：timeZone %s 显示 %s', (timeZone, expected) => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultValue: 1683084540000, timeZone });
        expect(firstInput(container)).toHaveValue(expected);
    });

    it('fix #1592 FixDisabledDate：起始被禁用时，聚焦结束输入框仍可选择范围结束日期', async () => {
        const today = new Date('2023-05-06 00:00:00');
        const disabledDate: DisabledDateType = (date, options) => {
            const days = options?.rangeInputFocus === 'rangeStart' ? 2 : options?.rangeInputFocus === 'rangeEnd' ? 3 : 0;
            const time = (date as Date).getTime();
            return days > 0 && addDays(today, -days).getTime() <= time && time <= addDays(today, days).getTime();
        };
        const { container } = renderDatePicker({ type: 'dateRange', defaultPickerValue: new Date('2023-05-06'), disabledDate, motion: false });
        const [startInput, endInput] = inputs(container);
        await userEvent.click(startInput);
        await userEvent.click(getDay('2023-05-03'));
        await userEvent.click(getDay('2023-05-10'));
        expect(startInput).toHaveValue('2023-05-03');
        expect(endInput).toHaveValue('2023-05-10');
    });

    it('fix #2024 FixNeedConfirmControlled：受控 dateTimeRange 与 needConfirm 显示待定起始值，并确认完整范围', async () => {
        const [value, setValue] = createSignal<DatePickerProps['value']>([]);
        const { container } = render(() => <DatePicker type="dateTimeRange" value={value()} defaultPickerValue="2024-02-15" motion={false} needConfirm onChange={setValue} />);
        const [startInput, endInput] = inputs(container);
        await userEvent.click(startInput);
        await userEvent.click(getDay('2024-02-15'));
        expect(startInput).toHaveValue('2024-02-15 00:00:00');
        const confirmBtn = () => getFooterButtons()[1];
        expect(confirmBtn()).toBeDisabled();

        await userEvent.click(getDay('2024-02-20'));
        expect(confirmBtn()).toBeEnabled();
        await userEvent.click(confirmBtn());
        expect(startInput).toHaveValue('2024-02-15 00:00:00');
        expect(endInput).toHaveValue('2024-02-20 00:00:00');
    });

    it('fix #1846 FixedNaN：NaN 值渲染为空输入框，选择后重置', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const [value, setValue] = createSignal<DatePickerProps['value']>([Number.NaN, Number.NaN]);
        const { container } = render(() => (
            <>
                <button type="button" onClick={() => setValue([Number.NaN, Number.NaN])}>
                    set NaN
                </button>
                <DatePicker type="dateRange" value={value()} defaultPickerValue="2024-01-01" motion={false} presets={[{ text: 'Empty', start: null, end: null }]} onChange={setValue} />
            </>
        ));
        const [startInput, endInput] = inputs(container);
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('value cannot be parsed'));

        await userEvent.click(startInput);
        await userEvent.click(getDay('2024-01-15'));
        await userEvent.click(getDay('2024-01-15'));
        expect(startInput).toHaveValue('2024-01-15');
        expect(endInput).toHaveValue('2024-01-15');

        await userEvent.click(screen.getByRole('button', { name: 'set NaN' }));
        expect(startInput).toHaveValue('');
        expect(endInput).toHaveValue('');
    });

    it('fix #1652 FixedSelectedStatus：再次点击已选日期时保持选中', async () => {
        const { container } = renderDatePicker({ type: 'dateTime', defaultPickerValue: '2022-07-01', motion: false });
        await userEvent.click(firstInput(container));
        await userEvent.click(getDay('2022-07-15'));
        expect(getSelectedDays()).toEqual(['2022-07-15']);
        await userEvent.click(getDay('2022-07-15'));
        expect(getSelectedDays()).toEqual(['2022-07-15']);
    });

    it('fix #2387 FixedControlled：受控值未变化时，面板关闭后重置待定范围', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', value: [new Date('2022-08-08'), new Date('2022-08-09')], defaultPickerValue: '2022-08-01', motion: false });
        const [startInput, endInput] = inputs(container);
        await userEvent.click(endInput);
        await userEvent.click(getDay('2022-08-15'));
        expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2022-08-15')).toHaveClass(`${dp}-day-selected-end`);

        await userEvent.click(startInput);
        await userEvent.click(getDay('2022-08-10'));
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(startInput);
        expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('fix #2521 FixedControlledValue：重新打开时受控范围显示已选内容', async () => {
        const [v, setV] = createSignal<DatePickerProps['value']>([]);
        const { container } = render(() => <DatePicker type="dateRange" value={v()} defaultPickerValue={['2023-10-01']} motion={false} onChange={setV} />);
        const startInput = firstInput(container);
        await userEvent.click(startInput);
        await userEvent.click(getDay('2023-10-15'));
        await userEvent.click(getDay('2023-11-20'));
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(startInput);
        expect(getDay('2023-10-15')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2023-11-20')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('fix #422 FixParseISOBug：五位年份的 defaultValue 视为空值', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = renderDatePicker({ defaultValue: '20221-12-20', defaultOpen: true, motion: false });
        expect(firstInput(container)).toHaveValue('');
        expect(getPopup()).not.toBeNull();
        expect(getSelectedDays()).toEqual([]);
    });

    it('FixNotifyChange：切换 ConfigProvider timeZone 不通知受控范围，完整选择只通知一次', async () => {
        const onChange = vi.fn<(date: Date | Date[]) => void>();
        const [tz, setTz] = createSignal(0);
        const [value, setValue] = createSignal<DatePickerProps['value']>();
        const { container } = render(() => (
            <ConfigProvider timeZone={tz()}>
                <DatePicker
                    type="dateTimeRange"
                    value={value()}
                    defaultPickerValue="2021-08-01"
                    motion={false}
                    onChange={(v) => {
                        onChange(v);
                        setValue(v);
                    }}
                />
            </ConfigProvider>
        ));
        setTz(8);
        expect(onChange).not.toHaveBeenCalled();

        await userEvent.click(firstInput(container));
        await userEvent.click(getDay('2021-08-10'));
        await userEvent.click(getDay('2021-08-12'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toHaveLength(2);

        setTz(0);
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});

describe('DatePicker 行为基线', () => {
    // the picker's own and its Popover's both listen on window
    const liveMousedownListeners = (add: Parameters<typeof countLiveListeners>[0], remove: Parameters<typeof countLiveListeners>[1]) => countLiveListeners(add, remove, 'mousedown') / 2;

    it('从 semiGlobal overrideDefaultProps 读取默认值，传入的属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { format: 'yyyy/MM/dd', density: 'compact' } };
        const { container, unmount } = renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        expect(firstInput(container)).toHaveValue('2019/09/08');
        expect(getPopup()).toHaveClass(`${dp}-compact`);
        unmount();
        const { container: second } = renderDatePicker({ defaultValue: baseDate, format: 'yyyy-MM-dd' });
        expect(firstInput(second)).toHaveValue('2019-09-08');
    });

    it('打开时只添加一个外部点击监听，关闭一次，卸载时移除', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const onBlur = vi.fn<NonNullable<DatePickerProps['onBlur']>>();
        const { container, unmount } = renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onBlur, onOpenChange });
        expect(firstInput(container)).toHaveValue(ymd(baseDate));
        expect(liveMousedownListeners(add, remove)).toBe(1);
        fireEvent.mouseDown(document.body);
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(liveMousedownListeners(add, remove)).toBe(0);
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(firstInput(container));
        expect(getPopup()).not.toBeNull();
        expect(liveMousedownListeners(add, remove)).toBe(1);
        unmount();
        expect(liveMousedownListeners(add, remove)).toBe(0);
    });

    it('选择日期只报告一次变化并关闭一次', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onChange, onOpenChange });
        await userEvent.click(getDay('2019-09-12'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-09-12');
        expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    it('受控 open 控制面板显示与隐藏，点击外部时只请求一次关闭', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const onClickOutSide = vi.fn<NonNullable<DatePickerProps['onClickOutSide']>>();
        const { rerender } = renderDatePicker({ motion: false, open: true, onClickOutSide, onOpenChange });
        expect(getPopup()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        expect(getPopup()).not.toBeNull();
        rerender({ motion: false, open: false, onOpenChange });
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    it('受控 value 变化时替换已输入的文本', () => {
        const { container, rerender } = renderDatePicker({ value: baseDate });
        const input = firstInput(container);
        typeIn(input, '2019-09-1');
        expect(input).toHaveValue('2019-09-1');
        rerender({ value: new Date(2020, 0, 2) });
        expect(input).toHaveValue('2020-01-02');
    });

    it('data-* 落在根 div，aria 状态属性落在 combobox 输入框', () => {
        renderDatePicker({ 'data-testid': 'dp', 'aria-describedby': 'help', 'aria-errormessage': 'error', 'aria-invalid': true, 'aria-labelledby': 'label', 'aria-required': true } as DatePickerProps);
        expect(getRoot()).toHaveAttribute('data-testid', 'dp');
        for (const name of ['aria-labelledby', 'aria-required', 'aria-invalid', 'aria-describedby', 'aria-errormessage']) {
            expect(getRoot()).not.toHaveAttribute(name);
        }
        const input = screen.getByRole('combobox');
        expect(input).toHaveAttribute('aria-labelledby', 'label');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'help');
        expect(input).toHaveAttribute('aria-errormessage', 'error');
        expect(input).not.toHaveAttribute('data-testid');
    });

    it('范围类型的两个输入框都带 aria 状态属性，根 div 是 group', () => {
        render(() => (
            <>
                <span id="label">Period</span>
                <DatePicker type="dateRange" aria-describedby="help" aria-invalid aria-labelledby="label" aria-required />
            </>
        ));
        expect(getRoot()).not.toHaveAttribute('aria-required');
        expect(screen.getByRole('group', { name: 'Period' })).toBe(getRoot());
        for (const input of screen.getAllByRole('combobox')) {
            expect(input).toHaveAttribute('aria-required', 'true');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-describedby', 'help');
        }
    });

    it('triggerRender 的按钮触发器承接 aria-describedby 与 aria-invalid，不输出 aria-required', () => {
        renderDatePicker({ 'aria-describedby': 'help', 'aria-errormessage': 'error', 'aria-invalid': true, 'aria-required': true, triggerRender: () => <span>pick</span> });
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
        expect(trigger).toHaveAttribute('aria-describedby', 'help');
        expect(trigger).toHaveAttribute('aria-errormessage', 'error');
        expect(trigger).not.toHaveAttribute('aria-required');
        expect(getRoot()).not.toHaveAttribute('aria-invalid');
    });
});
