import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import ContextFixture, { type ContextFixtureStore } from './date-picker-context-fixture.svelte';
import { click, getPanel, getPopup } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import { changes, getContainer, getDay, getInput, getInputs, getNavTitle, getRoot, getTrigger, opens, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

type Api = { open: () => void };

async function renderContext(init: Omit<ContextFixtureStore, 'props'> & { props?: ContextFixtureStore['props'] }) {
    const store = createStore<ContextFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ContextFixture, { props: { store } });
    await settle();
    return store;
}

async function renderProvided(init: Omit<ProviderFixtureStore, 'props'> & { props?: ProviderFixtureStore['props'] }) {
    const store = createStore<ProviderFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ProviderFixture, { props: { store } });
    await settle();
    return store;
}

async function focusAndKey(element: HTMLElement, keys: string) {
    element.focus();
    await settle();
    await userEvent.keyboard(keys);
    await settle();
}

describe('Svelte DatePicker 对外方法与受控 open', () => {
    it('受控 open 优先于 bind:this 的方法：open() 只向 setter 请求打开，被拒绝后面板不出现', async () => {
        const { component, store } = await setup({ target: 'open', mode: 'function', open: false, accept: false });
        (component as unknown as { api: () => Api }).api().open();
        await settle();
        await settle();
        expect(store.log).toEqual(['set open true']);
        expect(getContainer()).toBeNull();
    });
});

describe('Svelte DatePicker Tab 停靠点', () => {
    it('触发器外层不是 Tab 停靠点，Tab 直接进入输入框', async () => {
        await setup();
        await userEvent.tab();
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement?.tagName).toBe('INPUT');
        expect(document.activeElement).toBe(getInput());
    });

    it('insetInput 下，关闭状态的触发输入框仍是 Tab 停靠点', async () => {
        await setup({ props: { insetInput: true } });
        await userEvent.tab();
        expect(document.activeElement).toBe(getInput());
    });

    it('范围选择器仅在起始与结束输入框停留', async () => {
        await setup({ props: { type: 'dateRange' } });
        const [start, end] = getInputs();
        await userEvent.tab();
        expect(start).toHaveFocus();
        await userEvent.tab();
        expect(end).toHaveFocus();
    });

    it('带有自身焦点目标的自定义触发器是唯一停靠点', async () => {
        await setup({ trigger: 'button' });
        await userEvent.tab();
        expect(document.activeElement).toBe(getRoot().querySelector('.custom-trigger'));
        await userEvent.tab();
        expect(getRoot()).not.toContainElement(document.activeElement as HTMLElement);
    });

    it('没有焦点目标的自定义触发器以外层作为停靠点，即打开面板的按钮', async () => {
        await setup({ trigger: 'text' });
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(getPopup()).not.toBeNull();
    });
});

describe('Svelte DatePicker 触发器语义', () => {
    it('输入框为 combobox，其 aria-controls 指向对话框中的面板', async () => {
        await setup();
        const input = screen.getByRole('combobox');
        expect(input).toBe(getInput());
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(getTrigger()).not.toHaveAttribute('role');

        await click(input);
        expect(getPopup()).not.toBeNull();
        expect(input).toHaveAttribute('aria-expanded', 'true');
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toBe(getPopup());
        expect(panel?.closest('[role="dialog"]')).toBe(screen.getByRole('dialog', { name: zh_CN.DatePicker.panel.date }));
    });

    it('面板对话框以所选内容命名', async () => {
        for (const type of ['dateRange', 'dateTime', 'dateTimeRange', 'month', 'monthRange'] as const) {
            const { unmount } = await setup({ open: true, props: { type } });
            expect(await screen.findByRole('dialog', { name: zh_CN.DatePicker.panel[type] })).toBeInTheDocument();
            unmount();
        }
    });

    it('LocaleProvider 的语言包决定对话框名称', async () => {
        await renderProvided({ locale: en_US, props: { type: 'dateTimeRange', open: true } });
        expect(await screen.findByRole('dialog', { name: 'Choose date and time range' })).toBeInTheDocument();
    });

    it('两个范围输入框都是同一面板的 combobox', async () => {
        await setup({ props: { type: 'dateRange' } });
        const [start, end] = screen.getAllByRole('combobox');
        expect(start.tagName).toBe('INPUT');
        expect(end.tagName).toBe('INPUT');
        expect(start.getAttribute('aria-controls')).toBe(end.getAttribute('aria-controls'));
        expect(end).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('输入框上按 ArrowDown 打开面板', async () => {
        const { store } = await setup();
        await focusAndKey(screen.getByRole('combobox'), '{ArrowDown}');
        expect(getPopup()).not.toBeNull();
        expect(opens(store)).toContain('open true');
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    it('dateTime 面板的日期与时间切换为原生 button', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', disabledTimePicker: true } });
        const toDate = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const toTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        expect(toDate.tagName).toBe('BUTTON');
        expect(toTime).toBeDisabled();
    });

    it('时间切换可通过键盘打开时间面板', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime' } });
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        await focusAndKey(toTime, '{Enter}');
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
    });

    it('范围清空按钮可通过键盘清空', async () => {
        const { store } = await setup({ value: [baseDate, new Date(2019, 8, 11, 8, 8, 8, 8)], props: { type: 'dateRange' } });
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear.tagName).toBe('BUTTON');
        await focusAndKey(clear, '{Enter}');
        expect(getInputs().map((input) => input.value)).toEqual(['', '']);
        expect(changes(store)).toHaveLength(1);
    });

    it('年份与月份列表有名称', async () => {
        await setup({ open: true, props: { type: 'month' } });
        expect(await screen.findByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.month })).toBeInTheDocument();
    });
});

describe('Svelte DatePicker 日历网格键盘操作', () => {
    const activeDay = () => {
        const grid = screen.getByRole('grid');
        return document.getElementById(grid.getAttribute('aria-activedescendant') as string);
    };
    const focusGrid = async () => {
        screen.getByRole('grid').focus();
        await settle();
    };

    it('网格为单个 Tab 停靠点，并从已选日期开始', async () => {
        await setup({ value: new Date(2019, 8, 11), open: true, props: { weekStartsOn: 1 } });
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
        const { store } = await setup({ value: new Date(2019, 8, 11), open: true, props: { weekStartsOn: 1 } });
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}{ArrowDown}');
        await settle();
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-19');
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(changes(store)).toEqual(['change 2019-09-19 00:00:00 "2019-09-19"']);
    });

    it('移出当月时面板切换到下一个月', async () => {
        await setup({ value: new Date(2019, 8, 30), open: true, props: { weekStartsOn: 1 } });
        await focusGrid();
        await userEvent.keyboard('{ArrowRight}');
        await settle();
        expect(activeDay()).toHaveAttribute('aria-label', '2019-10-01');
        await userEvent.keyboard('{PageUp}');
        await settle();
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-01');
    });

    it('禁用日期上的 Enter 与 Space 不做任何选择', async () => {
        const { store } = await setup({ open: true, props: { defaultPickerValue: new Date(2019, 8, 1), disabledDate: (date) => date.getDate() === 1 } });
        await focusGrid();
        expect(activeDay()).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard('{Enter} ');
        await settle();
        expect(changes(store)).toEqual([]);
    });

    it('RTL 下 ArrowLeft 移动到下一天', async () => {
        await renderContext({ direction: 'rtl', props: { value: new Date(2019, 8, 11), open: true } });
        await focusGrid();
        await userEvent.keyboard('{ArrowLeft}');
        await settle();
        expect(activeDay()).toHaveAttribute('aria-label', '2019-09-12');
    });

    it('月份选择器的输入框有名称，即使该类型没有 placeholder', async () => {
        await setup({ props: { type: 'month' } });
        expect(screen.getByRole('combobox', { name: zh_CN.DatePicker.chooseDate })).toBeInTheDocument();
    });

    it('输入框由选择器的 aria-labelledby 命名', async () => {
        await renderContext({ label: 'Birthday', props: { type: 'month', 'aria-labelledby': 'external-label' } });
        expect(screen.getByRole('combobox', { name: 'Birthday' })).toBeInTheDocument();
    });

    it('dateRange 已选的起止日期格 aria-selected 为 true，网格声明可多选', async () => {
        await setup({ value: [new Date(2021, 5, 10), new Date(2021, 5, 12)], open: true, props: { type: 'dateRange' } });
        expect(getDay('2021-06-10')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-12')).toHaveAttribute('aria-selected', 'true');
        expect(getDay('2021-06-20')).toHaveAttribute('aria-selected', 'false');
        expect(getDay('2021-06-10').closest('[role="grid"]')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('presetPosition 为 left 但没有 presets 时 x-preset-position 为 null', async () => {
        await setup({ open: true, props: { presetPosition: 'left' } });
        expect(getPopup()?.querySelector('[x-preset-position]')).toHaveAttribute('x-preset-position', 'null');
    });

    it('insetInput 的 dateTimeRange 四个内嵌输入框名称互不相同', async () => {
        await setup({ open: true, props: { type: 'dateTimeRange', insetInput: true } });
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

    it('insetInput 的 dateTime 内嵌日期框与时间框有名称', async () => {
        await setup({ open: true, props: { type: 'dateTime', insetInput: true } });
        const names = within(getPopup() as HTMLElement)
            .getAllByRole('textbox')
            .map((input) => input.getAttribute('aria-label'));
        expect(names).toEqual([zh_CN.DatePicker.placeholder.dateTime, zh_CN.DatePicker.selectTime]);
    });

    it('范围输入框的名称来自 placeholder，没有 aria-label', async () => {
        await setup({ props: { type: 'dateRange' } });
        expect(screen.getAllByRole('combobox').map((input) => input.getAttribute('aria-label'))).toEqual([null, null]);
    });

    it('月份网格以各自的月份标题命名，范围的两个网格名称不同', async () => {
        await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        const [left, right] = screen.getAllByRole('grid');
        expect(left).toHaveAccessibleName(getNavTitle('left') as string);
        expect(right).toHaveAccessibleName(getNavTitle('right') as string);
        expect(getNavTitle('left')).not.toBe(getNavTitle('right'));
    });
});
