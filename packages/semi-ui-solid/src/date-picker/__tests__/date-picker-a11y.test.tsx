import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import DatePickerFoundation from '@fibrae/semi-foundation/date-picker/foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import DatePicker, { type DatePickerElement, type DatePickerProps, type TriggerRenderProps, type YearAndMonthProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import LocaleProvider from '../../locale/locale-provider';
import Tooltip from '../../tooltip';
import YearAndMonth from '../year-and-month';

type ChangeHandler = NonNullable<DatePickerProps['onChange']>;

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popupSelector = `.${BASE_CLASS_PREFIX}-popover .${dp}`;

function renderDatePicker(initial: DatePickerProps = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <DatePicker {...props()} />);
    return { ...result, rerender: (next: DatePickerProps) => setProps(next) };
}

function renderYearAndMonth(props: Partial<YearAndMonthProps>) {
    return render(() => <YearAndMonth currentYear={{ left: 2021, right: 2022 }} currentMonth={{ left: 6, right: 7 }} locale={zh_CN.DatePicker} type="month" {...props} />);
}

const getPopup = () => document.querySelector<HTMLElement>(popupSelector);
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getPresetButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getNavTitle = (side: string) => getPanel(side).querySelector(`.${dp}-navigation-month`)?.textContent;
const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);
const inputs = (container: HTMLElement) => Array.from(container.querySelectorAll('input'));
const firstInput = (container: HTMLElement) => container.querySelector('input') as HTMLInputElement;
const typeIn = (input: Element, value: string) => fireEvent.input(input, { target: { value } });
// jsdom has no layout: Tooltip reports the panel visible only after a 100ms fallback timer.
// call watchPanelVisible before opening, then await settled() so focus changes land before asserting
const watchPanelVisible = () => {
    const spy = vi.spyOn(DatePickerFoundation.prototype, 'handlePanelVisibleChange');
    return {
        settled: () => waitFor(() => expect(spy).toHaveBeenCalledWith(true)),
        restore: () => spy.mockRestore(),
    };
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('DatePicker 行为基线（ref 与输入）', () => {
    it('通过 ref 打开的范围选择器在首次点击后聚焦结束输入框，且只报告一次聚焦', async () => {
        let picker!: DatePickerElement;
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="dateRange" defaultPickerValue="2021-06-01" motion={false} onChange={onChange} onFocus={onFocus} />);
        picker.open();
        await userEvent.click(getDay('2021-06-10'));
        const [startInput, endInput] = inputs(container);
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2021-06-10');
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(getDay('2021-06-12'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['2021-06-10', '2021-06-12']);
        expect(getPopup()).not.toBeNull();
    });

    it('在触发输入框输入完整日期后，在已打开的面板中选中该日期', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ motion: false, onChange });
        const input = firstInput(container);
        await userEvent.click(input);
        typeIn(input, '2021-06-10');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getSelectedDays()).toEqual(['2021-06-10']);
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('对与当前选中值不同的已输入日期按 Enter 时报告变化', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = renderDatePicker({ defaultValue: baseDate, onChange });
        const input = firstInput(container);
        // the text reaches the input without an input event, so only Enter parses it
        input.value = '2019-09-20';
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2019-09-20');
        expect(input).toHaveValue('2019-09-20');
    });
});

describe('DatePicker 根元素与 ref', () => {
    it('ref 为带有文档中方法的根元素', () => {
        let picker!: DatePickerElement;
        renderDatePicker({ ref: (el: DatePickerElement) => (picker = el), motion: false });
        expect(picker).toBe(document.querySelector(`.${dp}`));
        for (const method of ['open', 'close', 'focus', 'blur'] as const) {
            expect(picker[method]).toBeTypeOf('function');
        }
    });

    it('未声明的属性（如 id、name 与 title）落在根 div，已声明的属性不落在任何地方', () => {
        // name is not a native div attribute, so the spread keeps the call type-checked
        const undeclared = { name: 'day-name' };
        render(() => <DatePicker id="day" title="tip" {...undeclared} density="compact" timeZone="Asia/Tokyo" />);
        const root = document.querySelector(`.${dp}`);
        expect(root).toHaveAttribute('id', 'day');
        expect(root).toHaveAttribute('name', 'day-name');
        expect(root).toHaveAttribute('title', 'tip');
        for (const attr of ['density', 'timezone']) {
            expect(root).not.toHaveAttribute(attr);
            expect(document.querySelector('input')).not.toHaveAttribute(attr);
        }
    });

    it('triggerRender 收到的 componentProps 不含 ref', () => {
        const triggerRender = vi.fn<(props: TriggerRenderProps) => Element>(() => (<span>trigger</span>) as Element);
        render(() => <DatePicker ref={() => {}} triggerRender={triggerRender} />);
        const { componentProps } = triggerRender.mock.calls[0][0];
        expect(componentProps).not.toHaveProperty('ref');
        expect(componentProps.type).toBe('date');
    });

    it('weekStartsOn 变化时重新排列已打开面板中的星期', () => {
        const { rerender } = renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false });
        const firstWeekday = () => document.querySelector(`.${dp}-weekday-item`)?.textContent;
        expect(firstWeekday()).toBe('日');
        rerender({ defaultValue: baseDate, defaultOpen: true, motion: false, weekStartsOn: 1 });
        expect(firstWeekday()).toBe('一');
    });

    it('autoSwitchDate 在本地零点将日期切换到年份选择器中选中的年份，且只切换一次', async () => {
        const onPanelChange = vi.fn<NonNullable<DatePickerProps['onPanelChange']>>();
        const onChange = vi.fn<ChangeHandler>();
        renderDatePicker({ defaultValue: baseDate, defaultOpen: true, motion: false, onChange, onPanelChange });
        await userEvent.click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2020' }));
        expect(onPanelChange).toHaveBeenCalledTimes(1);
        expect(onPanelChange.mock.calls[0][1]).toBe('2020-09-08');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2020-09-08');
        expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(0);
    });

    it('受控 open 优先于 ref 方法', () => {
        let picker!: DatePickerElement;
        render(() => <DatePicker ref={(el) => (picker = el)} motion={false} open={false} />);
        picker.open();
        expect(getPopup()).toBeNull();
    });
});

describe('DatePicker Tab 停靠点', () => {
    it('触发器外层不是 Tab 停靠点，Tab 直接进入输入框', async () => {
        const { container } = render(() => <DatePicker />);
        await userEvent.tab();
        expect(container.querySelector(`.${dp}-input`)).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement?.tagName).toBe('INPUT');
    });

    it('insetInput 下，关闭状态的触发输入框仍是 Tab 停靠点', async () => {
        render(() => <DatePicker insetInput />);
        await userEvent.tab();
        expect(document.activeElement?.tagName).toBe('INPUT');
    });

    it('范围选择器仅在起始与结束输入框停留', async () => {
        const { container } = render(() => <DatePicker type="dateRange" />);
        const [start, end] = inputs(container);
        await userEvent.tab();
        expect(start).toHaveFocus();
        await userEvent.tab();
        expect(end).toHaveFocus();
    });

    it('带有自身焦点目标的自定义触发器是唯一停靠点', async () => {
        render(() => <DatePicker triggerRender={() => <button type="button">pick</button>} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('没有焦点目标的自定义触发器以外层作为停靠点，即打开面板的按钮', async () => {
        render(() => <DatePicker motion={false} triggerRender={() => <span>pick</span>} />);
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
    });

    it('自定义触发器加外部 label 时 button 名称为该 label', () => {
        render(() => (
            <>
                <span id="birthday">生日</span>
                <DatePicker aria-labelledby="birthday" triggerRender={() => <span>pick</span>} />
            </>
        ));
        const trigger = screen.getByRole('button', { name: '生日' });
        expect(trigger).not.toHaveAttribute('aria-label');
    });
});

describe('DatePicker 触发器语义', () => {
    it('输入框为 combobox，其 aria-controls 指向对话框中的面板', async () => {
        const { container } = render(() => <DatePicker motion={false} />);
        const input = screen.getByRole('combobox');
        expect(input).toBe(container.querySelector('input'));
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector(`.${dp}-input`)).not.toHaveAttribute('role');
        await userEvent.click(input);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(input).toHaveAttribute('aria-expanded', 'true');
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toBe(getPopup());
        expect(panel?.closest('[role="dialog"]')).toBe(screen.getByRole('dialog', { name: zh_CN.DatePicker.panel.date }));
    });

    it('面板对话框以所选内容命名', async () => {
        for (const type of ['dateRange', 'dateTime', 'dateTimeRange', 'month', 'monthRange', 'year'] as const) {
            const { unmount } = render(() => <DatePicker type={type} defaultOpen motion={false} />);
            expect(await screen.findByRole('dialog', { name: zh_CN.DatePicker.panel[type] })).toBeInTheDocument();
            unmount();
        }
        render(() => (
            <LocaleProvider locale={en_US}>
                <DatePicker type="dateTimeRange" defaultOpen motion={false} />
            </LocaleProvider>
        ));
        expect(await screen.findByRole('dialog', { name: 'Choose date and time range' })).toBeInTheDocument();
    });

    it('两个范围输入框都是同一面板的 combobox', () => {
        render(() => <DatePicker type="dateRange" motion={false} />);
        const [start, end] = screen.getAllByRole('combobox');
        expect(start.tagName).toBe('INPUT');
        expect(end.tagName).toBe('INPUT');
        expect(start.getAttribute('aria-controls')).toBe(end.getAttribute('aria-controls'));
        expect(end).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('输入框上按 ArrowDown 打开面板', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        render(() => <DatePicker motion={false} onOpenChange={onOpenChange} />);
        screen.getByRole('combobox').focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    it('dateTime 面板的日期与时间切换为原生 button', async () => {
        render(() => <DatePicker type="dateTime" defaultValue={baseDate} disabledTimePicker motion={false} open />);
        const toDate = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const toTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(toDate.tagName).toBe('BUTTON');
        expect(toTime).toBeDisabled();
    });

    it('时间切换可通过键盘打开时间面板', async () => {
        render(() => <DatePicker type="dateTime" defaultValue={baseDate} motion={false} open />);
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        toTime.focus();
        await userEvent.keyboard('{Enter}');
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
    });

    it('范围清空按钮可通过键盘清空', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="dateRange" defaultValue={[baseDate, addDays(baseDate, 3)]} onChange={onChange} />);
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear.tagName).toBe('BUTTON');
        clear.focus();
        await userEvent.keyboard('{Enter}');
        const [start, end] = inputs(container);
        expect(start).toHaveValue('');
        expect(end).toHaveValue('');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('年份与月份列表有名称', async () => {
        render(() => <DatePicker type="month" motion={false} open />);
        expect(await screen.findByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.month })).toBeInTheDocument();
    });
});

describe('DatePicker 日历网格键盘操作', () => {
    const activeDay = () => {
        const grid = screen.getByRole('grid');
        return document.getElementById(grid.getAttribute('aria-activedescendant') as string);
    };

    it('网格为单个 Tab 停靠点，并从已选日期开始', () => {
        render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open weekStartsOn={1} />);
        const grid = screen.getByRole('grid');
        expect(grid).toHaveAttribute('tabindex', '0');
        expect(
            within(grid)
                .getAllByRole('gridcell')
                .filter((cell) => cell.hasAttribute('tabindex'))
        ).toHaveLength(0);
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-11');
    });

    it('方向键移动活动日期，Enter 选中该日期', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open weekStartsOn={1} onChange={onChange} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-19');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(format(onChange.mock.calls[0][0] as Date, 'yyyy-MM-dd')).toBe('2019-09-19');
    });

    it('移出当月时面板切换到下一个月', async () => {
        render(() => <DatePicker defaultValue={new Date(2019, 8, 30)} motion={false} open weekStartsOn={1} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-10-01');
        await userEvent.keyboard('{PageUp}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('禁用日期上的 Enter 与 Space 不做任何选择', async () => {
        const onChange = vi.fn<ChangeHandler>();
        render(() => <DatePicker defaultPickerValue={new Date(2019, 8, 1)} disabledDate={(date) => (date as Date).getDate() === 1} motion={false} open onChange={onChange} />);
        screen.getByRole('grid').focus();
        expect(activeDay()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard('{Enter} ');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('用 Enter 选择日期后关闭面板，焦点返回输入框', async () => {
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        const input = firstInput(container);
        expect(input).toHaveValue('2019-09-12');
        expect(input).toHaveFocus();
    });

    it('Esc 关闭面板且不选择，焦点返回输入框', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} onChange={onChange} />);
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowRight}{Escape}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        const input = firstInput(container);
        expect(input).toHaveValue('2019-09-11');
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('RTL 下 ArrowLeft 移动到下一天', async () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open />
            </ConfigProvider>
        ));
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-12');
    });

    it('月份选择器的输入框有名称，即使该类型没有 placeholder', () => {
        render(() => <DatePicker type="month" />);
        expect(screen.getByRole('combobox', { name: zh_CN.DatePicker.chooseDate })).toBeInTheDocument();
    });

    it('输入框由选择器的 aria-labelledby 命名', () => {
        render(() => (
            <>
                <span id="birthday-label">Birthday</span>
                <DatePicker type="month" aria-labelledby="birthday-label" />
            </>
        ));
        expect(screen.getByRole('combobox', { name: 'Birthday' })).toBeInTheDocument();
    });

    it('dateRange 已选的起止日期格 aria-selected 为 true，网格声明可多选', () => {
        render(() => <DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 10), new Date(2021, 5, 12)]} defaultOpen motion={false} />);
        expect(getDay('2021-06-10')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-12')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-20')).toHaveAttribute('aria-selected', 'false');
        expect(getDay('2021-06-10').closest('[role="grid"]')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('范围类型的两个日期网格由各自的月份标题命名', () => {
        render(() => <DatePicker type="dateRange" defaultValue={[new Date(2021, 5, 10), new Date(2021, 5, 12)]} defaultOpen motion={false} />);
        expect(screen.getByRole('grid', { name: '2021年 6月' })).toBe(getPanel('left').querySelector('[role="grid"]'));
        expect(screen.getByRole('grid', { name: '2021年 7月' })).toBe(getPanel('right').querySelector('[role="grid"]'));
    });

    it('预设按钮内不含 div', () => {
        render(() => <DatePicker defaultOpen motion={false} presets={[{ text: 'Today', start: baseDate, end: baseDate }]} />);
        const [button] = getPresetButtons();
        expect(button).toHaveTextContent('Today');
        expect(button.querySelector('div')).toBeNull();
    });

    it('presetPosition 为 left 但没有 presets 时 x-preset-position 为 null', () => {
        render(() => <DatePicker defaultOpen motion={false} presetPosition="left" />);
        expect(getPopup()?.querySelector('[x-preset-position]')).toHaveAttribute('x-preset-position', 'null');
    });

    it('insetInput 的 dateTimeRange 四个内嵌输入框名称互不相同', () => {
        render(() => <DatePicker type="dateTimeRange" defaultOpen insetInput motion={false} />);
        const names = within(getPopup() as HTMLElement)
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        const [startDate, endDate] = zh_CN.DatePicker.placeholder.dateTimeRange;
        expect(names).toHaveLength(4);
        expect(new Set(names).size).toBe(4);
        expect(names[0]).toBe(startDate);
        expect(names[2]).toBe(endDate);
        expect(names[1]).toContain(startDate);
        expect(names[1]).toContain(zh_CN.DatePicker.selectTime);
        expect(names[3]).toContain(endDate);
    });

    it('insetInput 的 dateTime 内嵌日期框与时间框有名称', () => {
        render(() => <DatePicker type="dateTime" defaultOpen insetInput motion={false} />);
        const names = within(getPopup() as HTMLElement)
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        expect(names).toEqual([zh_CN.DatePicker.placeholder.dateTime, zh_CN.DatePicker.selectTime]);
    });

    it('范围输入框以 placeholder 作为名称', () => {
        render(() => <DatePicker type="dateRange" />);
        expect(screen.getAllByRole('combobox').map((input) => input.getAttribute('aria-label'))).toEqual([null, null]);
    });
});

describe('DatePicker year 类型', () => {
    it('面板只有一个以语言包命名的年份列表', () => {
        render(() => <DatePicker type="year" defaultOpen motion={false} />);
        const lists = within(getPopup() as HTMLElement).getAllByRole('listbox');
        expect(lists).toHaveLength(1);
        expect(lists[0]).toHaveAccessibleName(zh_CN.DatePicker.year);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-body`)).toBeNull();
    });

    it('defaultValue 以 yyyy 回显并选中该年', () => {
        const { container } = render(() => <DatePicker type="year" defaultValue={new Date(2021, 5, 10)} defaultOpen motion={false} />);
        expect(firstInput(container)).toHaveValue('2021');
        expect(getYMSelected()).toEqual(['2021年']);
    });

    it('选择年份后 onChange 收到当年 1 月 1 日与 yyyy 字符串，面板保持打开', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="year" defaultValue={new Date(2021, 5, 10)} defaultOpen motion={false} onChange={onChange} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
        expect(firstInput(container)).toHaveValue('2023');
        expect(getYMSelected()).toEqual(['2023年']);
        expect(getPopup()).not.toBeNull();
    });

    it('输入年份后解析为当年 1 月 1 日', () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="year" motion={false} onChange={onChange} />);
        typeIn(firstInput(container), '2020');
        expect(onChange.mock.calls).toEqual([[new Date(2020, 0, 1), '2020']]);
    });

    it('空输入框按 Enter 回落到今年 1 月 1 日', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="year" motion={false} onChange={onChange} />);
        await userEvent.type(firstInput(container), '{Enter}');
        const year = new Date().getFullYear();
        expect(onChange.mock.calls).toEqual([[new Date(year, 0, 1), String(year)]]);
    });

    it('presets 的日期取该年 1 月 1 日，以 yyyy 回显', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="year" defaultOpen motion={false} presets={[{ text: '2021', start: new Date(2021, 5, 10) }]} onChange={onChange} />);
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 0, 1), '2021']]);
        expect(firstInput(container)).toHaveValue('2021');
    });

    it('disabledDate 按每年的 1 月 1 日判断，列表与输入一致', () => {
        const onChange = vi.fn<ChangeHandler>();
        const disabledDate = (date?: Date) => (date as Date).getTime() < new Date(2021, 2, 1).getTime();
        const { container } = render(() => <DatePicker type="year" defaultValue={new Date(2022, 0)} defaultOpen disabledDate={disabledDate} motion={false} onChange={onChange} />);
        const years = within(getYMLists()[0]);
        expect(years.getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'true');
        expect(years.getByRole('option', { name: '2023' })).not.toHaveAttribute('aria-disabled', 'true');
        const input = firstInput(container);
        typeIn(input, '2021');
        expect(onChange).not.toHaveBeenCalled();
        typeIn(input, '2023');
        expect(onChange.mock.calls).toEqual([[new Date(2023, 0, 1), '2023']]);
    });

    it('insetInput 的内嵌输入框以 yyyy 为占位符，与 month 一样以 chooseDate 命名', () => {
        render(() => <DatePicker type="year" defaultOpen insetInput motion={false} />);
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        expect(inset).toHaveAttribute('placeholder', 'yyyy');
        expect(inset).toHaveAccessibleName(zh_CN.DatePicker.chooseDate);
    });

    it('YearAndMonth 的 year 类型选择年份不按月份调整，只通知一次', async () => {
        const onSelect = vi.fn<NonNullable<YearAndMonthProps['onSelect']>>();
        renderYearAndMonth({
            type: 'year',
            onSelect,
            currentYear: { left: 2021, right: 0 },
            currentMonth: { left: 6, right: 0 },
            disabledDate: (date) => (date as Date).getMonth() === 5,
        });
        expect(getYMLists()).toHaveLength(1);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].currentYear.left).toBe(2023);
    });
});

describe('DatePicker month 类型取当月 1 日', () => {
    it('presets 的起点在月中时取当月 1 日 00:00', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="month" defaultOpen motion={false} presets={[{ text: '6 月', start: new Date(2021, 5, 18, 10, 30) }]} onChange={onChange} />);
        await userEvent.click(getPresetButtons()[0]);
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
        expect(firstInput(container)).toHaveValue('2021-06');
    });

    it('空输入框按 Enter 回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="month" motion={false} onChange={onChange} />);
        await userEvent.type(firstInput(container), '{Enter}');
        expect(onChange.mock.calls).toEqual([[new Date(2021, 5, 1), '2021-06']]);
    });

    it('monthRange 空输入框按 Enter 两端回落到本月 1 日 00:00', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="monthRange" motion={false} onChange={onChange} />);
        await userEvent.type(firstInput(container), '{Enter}');
        expect(onChange.mock.calls).toEqual([
            [
                [new Date(2021, 5, 1), new Date(2021, 5, 1)],
                ['2021-06', '2021-06'],
            ],
        ]);
    });

    it('年份列、月份列与切换年份时以每月 1 日 00:00 调用 disabledDate', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2021, 5, 18, 10, 30));
        const disabledDate = vi.fn<(date?: Date) => boolean>((date) => (date as Date).getTime() < new Date(2021, 5, 10).getTime());
        render(() => <DatePicker type="month" defaultValue={new Date(2022, 5)} defaultOpen disabledDate={disabledDate} motion={false} />);
        await userEvent.click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        const dates = disabledDate.mock.calls.map(([date]) => date as Date);
        expect(dates.filter((date) => date.getTime() !== new Date(date.getFullYear(), date.getMonth()).getTime())).toEqual([]);
        expect(within(getYMLists()[1]).getByRole('option', { name: '6月' })).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('DatePicker 属性回落', () => {
    it('locale、localeCode、dateFnsLocale 不是 DatePicker 的 props', () => {
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withLocale: DatePickerProps = { locale: en_US.DatePicker };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withCode: DatePickerProps = { localeCode: 'en-US' };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withDateFns: DatePickerProps = { dateFnsLocale: enUS };
        expect([withLocale, withCode, withDateFns]).toHaveLength(3);
    });

    it('显式传入 undefined 的 timeZone 回落到 ConfigProvider', () => {
        const { container } = render(() => (
            <ConfigProvider timeZone="Asia/Tokyo">
                <DatePicker type="dateTime" value={new Date(Date.UTC(2021, 0, 1))} timeZone={undefined} />
            </ConfigProvider>
        ));
        expect(firstInput(container)).toHaveValue('2021-01-01 09:00:00');
    });

    it('ConfigProvider 的 timeZone 优先于全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { timeZone: 'UTC' } };
        const { container } = render(() => (
            <ConfigProvider timeZone="Asia/Tokyo">
                <DatePicker type="dateTime" value={new Date(Date.UTC(2021, 0, 1))} />
            </ConfigProvider>
        ));
        expect(firstInput(container)).toHaveValue('2021-01-01 09:00:00');
    });

    it('全局默认的 format 与直接传入一样规整 type', () => {
        semiGlobal.config.overrideDefaultProps = { DatePicker: { format: 'yyyy-MM-dd' } };
        render(() => <DatePicker type="dateTime" defaultOpen motion={false} />);
        expect(document.querySelector(`.${dp}-switch`)).toBeNull();
    });
});

describe('DatePicker 面板开合', () => {
    it('打开后变为 disabled 时关闭面板并上报 onOpenChange(false)，重新启用不再弹出', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { rerender } = renderDatePicker({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPopup()).not.toBeNull();
        rerender({ disabled: true, defaultOpen: true, motion: false, onOpenChange });
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        rerender({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPopup()).toBeNull();
    });

    it('面板打开后再次点击输入框不重复调用 onOpenChange(true)', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        const { container } = renderDatePicker({ type: 'dateRange', motion: false, onOpenChange });
        const [startInput, endInput] = inputs(container);
        await userEvent.click(startInput);
        await userEvent.click(startInput);
        await userEvent.click(endInput);
        expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('needConfirm 时按 Esc 关闭面板调用 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<DatePickerProps['onCancel']>>();
        renderDatePicker({ type: 'dateTime', defaultValue: new Date(2019, 8, 11), defaultOpen: true, motion: false, needConfirm: true, onCancel });
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('面板关闭时 Tab 经过两个范围输入框，再点开始框打开后，结束日期之后的日期仍可选', async () => {
        const { container } = renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2019, 7, 10), new Date(2019, 7, 20)], motion: false });
        await userEvent.tab();
        await userEvent.tab();
        await new Promise((resolve) => setTimeout(resolve));
        await userEvent.click(firstInput(container));
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('受控 open 时 Tab 经过两个范围输入框，再点开始框并由外部打开后，结束日期之后的日期仍可选', async () => {
        const range = [new Date(2019, 7, 10), new Date(2019, 7, 20)];
        const { container, rerender } = renderDatePicker({ type: 'dateRange', value: range, motion: false, open: false });
        await userEvent.tab();
        await userEvent.tab();
        await new Promise((resolve) => setTimeout(resolve));
        await userEvent.click(firstInput(container));
        rerender({ type: 'dateRange', value: range, motion: false, open: true });
        await waitFor(() => expect(getPopup()).not.toBeNull());
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('焦点在范围清除按钮上按 ArrowDown 不打开面板', async () => {
        const onOpenChange = vi.fn<NonNullable<DatePickerProps['onOpenChange']>>();
        renderDatePicker({ type: 'dateRange', defaultValue: [new Date(2019, 7, 10), new Date(2019, 7, 20)], motion: false, onOpenChange });
        screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('受控值被外部清空时，持焦的范围清除按钮把焦点交给开始输入框', async () => {
        const range = [new Date(2019, 7, 10), new Date(2019, 7, 20)];
        const { container, rerender } = renderDatePicker({ type: 'dateRange', value: range, motion: false });
        screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus();
        rerender({ type: 'dateRange', value: [], motion: false });
        // the handover runs in a microtask, after the update that removes the button
        await Promise.resolve();
        expect(firstInput(container)).toHaveFocus();
    });
});

describe('DatePicker 焦点方法', () => {
    it('type="monthRange" 的 ref.focus() 聚焦输入框，blur() 移走焦点', () => {
        let picker!: DatePickerElement;
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="monthRange" motion={false} />);
        picker.focus();
        expect(firstInput(container)).toHaveFocus();
        picker.blur();
        expect(firstInput(container)).not.toHaveFocus();
    });

    it('triggerRender 时 ref.focus() 聚焦自定义触发器', () => {
        let picker!: DatePickerElement;
        render(() => <DatePicker ref={(el) => (picker = el)} motion={false} triggerRender={() => <span>pick</span>} />);
        picker.focus();
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate })).toHaveFocus();
    });

    it('insetInput 面板打开时 ref.focus()、blur() 作用于面板内的输入框', async () => {
        let picker!: DatePickerElement;
        const { settled, restore } = watchPanelVisible();
        render(() => <DatePicker ref={(el) => (picker = el)} defaultOpen insetInput motion={false} />);
        await settled();
        restore();
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        inset.blur();
        picker.focus();
        expect(inset).toHaveFocus();
        picker.blur();
        expect(inset).not.toHaveFocus();
    });

    it('insetInput 范围类型面板关闭后 ref.focus() 聚焦触发框的对应输入框', async () => {
        let picker!: DatePickerElement;
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="dateRange" insetInput motion={false} />);
        const [startInput, endInput] = inputs(container);
        picker.open();
        await waitFor(() => expect(startInput).toBeDisabled());
        picker.close();
        await waitFor(() => expect(getPopup()).toBeNull());
        await waitFor(() => expect(startInput).toBeEnabled());
        picker.focus();
        expect(startInput).toHaveFocus();
        picker.focus('rangeEnd');
        expect(endInput).toHaveFocus();
    });

    it('insetInput 的 monthRange 面板关闭时 ref.focus() 聚焦触发框输入框', () => {
        let picker!: DatePickerElement;
        const { container } = render(() => <DatePicker ref={(el) => (picker = el)} type="monthRange" insetInput motion={false} />);
        picker.focus();
        expect(firstInput(container)).toHaveFocus();
    });

    it('单选类型开启 insetInput 时打开面板只调用一次 onFocus，且不带 rangeType', async () => {
        const onFocus = vi.fn<NonNullable<DatePickerProps['onFocus']>>();
        const { settled, restore } = watchPanelVisible();
        const { container } = render(() => <DatePicker insetInput motion={false} onFocus={onFocus} />);
        await userEvent.click(firstInput(container));
        await settled();
        restore();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][1]).toBeUndefined();
    });
});

describe('DatePicker 值与输入', () => {
    it('键入无法解析的日期按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker motion={false} onChange={onChange} />);
        await userEvent.type(firstInput(container), '2021-13{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('dateRange 只填开始框按 Enter 不以今天提交', async () => {
        const onChange = vi.fn<ChangeHandler>();
        const { container } = render(() => <DatePicker type="dateRange" motion={false} onChange={onChange} />);
        await userEvent.type(firstInput(container), '2021-08-01{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('null 清空预设与范围中的 null 端点不发出无法解析的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // a controlled range may come back with an empty end from the consumer's own state
        const halfRange = [new Date(2019, 7, 10), null] as unknown as DatePickerProps['value'];
        render(() => <DatePicker type="dateRange" value={halfRange} motion={false} />);
        render(() => <DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} defaultOpen motion={false} presets={[{ text: 'clear', start: null, end: null }]} />);
        await userEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(warn).not.toHaveBeenCalled();
    });

    it('面板打开时只改 disabledDate，日期格的禁用状态随本次渲染更新', () => {
        const pickerValue = new Date(2019, 8, 1);
        const { rerender } = renderDatePicker({ defaultOpen: true, defaultPickerValue: pickerValue, disabledDate: () => false, motion: false });
        rerender({ defaultOpen: true, defaultPickerValue: pickerValue, disabledDate: () => true, motion: false });
        expect(getDay('2019-09-12')).toHaveAttribute('aria-disabled', 'true');
    });

    it('父组件重渲染时传入内容相同的新 defaultPickerValue，面板停在当前月份', async () => {
        function Controlled() {
            const [value, setValue] = createSignal<Date>();
            return <DatePicker type="dateTime" value={value()} defaultOpen defaultPickerValue={new Date(2022, 8, 1)} motion={false} onChange={(date) => setValue(date as Date)} />;
        }
        render(() => <Controlled />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await userEvent.click(getDay('2022-10-15'));
        expect(getDay('2022-10-15')).not.toBeNull();
    });
});

describe('DatePicker 可访问性', () => {
    it('单输入框的 aria-label 以 group 角色命名根元素', () => {
        render(() => <DatePicker aria-label="生日" />);
        expect(screen.getByRole('group', { name: '生日' })).toHaveClass(dp);
    });

    it('范围清除按钮与内嵌输入框按 LocaleProvider 的语言命名', () => {
        render(() => (
            <LocaleProvider locale={en_US}>
                <DatePicker type="dateRange" defaultValue={[new Date(2019, 7, 10), new Date(2019, 7, 20)]} />
                <DatePicker defaultOpen insetInput motion={false} />
            </LocaleProvider>
        ));
        expect(screen.getByRole('button', { name: en_US.DatePicker.clearRange })).not.toBeNull();
        expect(within(getPopup() as HTMLElement).getByRole('textbox')).toHaveAccessibleName(en_US.DatePicker.placeholder.date as string);
    });

    it('Tooltip 包住的 DatePicker 只在输入框停留，根元素不是 Tab 停靠点', async () => {
        const { container } = render(() => (
            <Tooltip content="tip">
                <DatePicker />
            </Tooltip>
        ));
        await userEvent.tab();
        expect(firstInput(container)).toHaveFocus();
    });

    it('禁用的 DatePicker 是 Tooltip 的特殊触发器：外包 span 接收点击，DatePicker 不接收指针', () => {
        const { container } = render(() => (
            <Tooltip wrapperClassName="probe" content="tip" trigger="click">
                {(t) => <DatePicker disabled {...t()} />}
            </Tooltip>
        ));
        const span = container.querySelector('.probe') as HTMLElement;
        const root = container.querySelector(`.${dp}`) as HTMLElement;
        expect(span).toContainElement(root);
        expect(root.style.pointerEvents).toBe('none');
    });
});
