import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { countLiveListeners } from '@test/utils/dom/common';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { click, getPanel, getPopup, getYMLists, setupPinned } from './date-picker-dom-utils';
import ScenarioFixture, { type ScenarioStore } from './date-picker-scenarios-fixture.svelte';
import SlotsFixture, { type SlotsFixtureStore } from './date-picker-slots-fixture.svelte';
import { changes, clickDay, clickOutside, dp, getContainer, getDay, getInput, getInputs, getNavTitle, getRoot, getSelectedDays, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

afterEach(() => {
    vi.restoreAllMocks();
});

type Handle = { blur: () => void; close: () => void; focus: (rangeType?: 'rangeStart' | 'rangeEnd') => void; open: () => void };
const handleOf = (component: unknown) => (component as { api: () => Handle }).api();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

describe('Svelte DatePicker 全局默认值', () => {
    it('从 semiGlobal overrideDefaultProps 读取默认值，传入的属性优先', async () => {
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { format: 'yyyy/MM/dd', density: 'compact', placeholder: '全局占位', size: 'large' } } };
        const first = await setup({ value: baseDate, open: true });
        expect(getInput()).toHaveValue('2019/09/08');
        expect(getInput()).toHaveAttribute('placeholder', '全局占位');
        expect(getInput()).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        expect(getPopup()).toHaveClass(`${dp}-compact`);
        first.unmount();
        await setup({ value: baseDate, props: { format: 'yyyy-MM-dd' } });
        expect(getInput()).toHaveValue('2019-09-08');
    });

    it('全局默认值里的 insetLabelId 不影响 DatePicker', async () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { insetLabelId: 'label-global' } } as object };
        const store = createStore<SlotsFixtureStore>({ props: { motion: false }, insetLabel: true });
        render(SlotsFixture, { props: { store } });
        await settle();
        expect(document.getElementById('label-global')).toBeNull();
    });
});

describe('Svelte DatePicker 外部点击监听', () => {
    it('打开时增加一个 mousedown 监听，关闭时移除，卸载时不残留', async () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const live = () => countLiveListeners(add, remove, 'mousedown');

        const view = await setup({ value: baseDate });
        // Svelte's own delegated listener is registered once per document and belongs to no picker
        const delegated = live();
        await click(getInput());
        expect(live() - delegated).toBe(1);
        await clickOutside();
        expect(getContainer()).toBeNull();
        expect(live() - delegated).toBe(0);
        await click(getInput());
        expect(live() - delegated).toBe(1);
        view.unmount();
        expect(live()).toBe(0);
    });
});

describe('Svelte DatePicker 变化与打开状态的通知次数', () => {
    it('选择日期只报告一次变化并关闭一次', async () => {
        const { store } = await setup({ mode: 'function', value: baseDate, open: true });
        await clickDay('2019-09-12');
        expect(changes(store)).toEqual(['change 2019-09-12 00:00:00 "2019-09-12"']);
        expect(store.log.filter((entry) => entry.startsWith('set '))).toEqual(['set 2019-09-12 00:00:00']);
        expect(store.value).toBeInstanceOf(Date);
        expect(getInput()).toHaveValue('2019-09-12');
        expect(opens(store)).toEqual(['open false']);
    });

    it('受控 open 控制面板显示与隐藏，点击外部时只请求一次关闭', async () => {
        const onClickOutSide = vi.fn<(event: MouseEvent) => void>();
        const { store } = await setupPinned({ props: { onClickOutSide } });
        expect(getContainer()).not.toBeNull();
        await clickOutside();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        expect(opens(store)).toEqual(['open false']);
        expect(store.log.filter((entry) => entry.startsWith('set open'))).toEqual(['set open false']);
        expect(getContainer()).not.toBeNull();
        store.open = false;
        await settle();
        expect(getContainer()).toBeNull();
    });

    it('受控 value 变化时替换已输入的文本', async () => {
        const { store } = await setup({ mode: 'bind', value: baseDate });
        await typeText('2019-09-1');
        expect(getInput()).toHaveValue('2019-09-1');
        store.value = new Date(2020, 0, 2);
        await settle();
        expect(getInput()).toHaveValue('2020-01-02');
    });

    it('在触发输入框输入完整日期后，在已打开的面板中选中该日期', async () => {
        const { store } = await setup();
        await click(getInput());
        await typeText('2021-06-10');
        expect(changes(store)).toHaveLength(1);
        expect(getSelectedDays()).toEqual(['2021-06-10']);
        expect(getNavTitle('left')).toBe('2021年 6月');
    });

    it('对与当前选中值不同的已输入日期按 Enter 时报告变化', async () => {
        const { store } = await setup({ value: baseDate });
        const input = getInput();
        // the text reaches the input without an input event, so only Enter parses it
        await fireEvent.keyDown(input, { key: 'Enter', target: { value: '2019-09-20' } });
        await settle();
        expect(changes(store)).toEqual(['change 2019-09-20 00:00:00 "2019-09-20"']);
        expect(input).toHaveValue('2019-09-20');
    });
});

describe('Svelte DatePicker aria 属性的落点', () => {
    const aria = { 'aria-describedby': 'help', 'aria-errormessage': 'error', 'aria-invalid': true, 'aria-required': true } as const;

    it('class、data-* 落在根 div，aria 状态属性落在 combobox 输入框', async () => {
        await setup({ props: { class: 'my-picker', 'data-testid': 'dp', 'aria-labelledby': 'label', ...aria } });
        expect(getRoot()).toHaveClass('my-picker');
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
        expect(input).not.toHaveAttribute('aria-label');
    });

    it('范围类型的两个输入框都带 aria 状态属性，根 div 是 group', async () => {
        const label = document.body.appendChild(document.createElement('span'));
        label.id = 'label';
        label.textContent = 'Period';
        try {
            await setup({ props: { type: 'dateRange', 'aria-labelledby': 'label', 'aria-describedby': 'help', 'aria-invalid': true, 'aria-required': true } });
            expect(getRoot()).not.toHaveAttribute('aria-required');
            expect(screen.getByRole('group', { name: 'Period' })).toBe(getRoot());
            for (const input of screen.getAllByRole('combobox')) {
                expect(input).toHaveAttribute('aria-required', 'true');
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input).toHaveAttribute('aria-describedby', 'help');
            }
        } finally {
            label.remove();
        }
    });

    it('没有焦点目标的 trigger snippet 承接 aria-describedby 与 aria-invalid，不输出 aria-required', async () => {
        await setup({ trigger: 'text', props: aria });
        const trigger = within(getRoot()).getByRole('button');
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
        expect(trigger).toHaveAttribute('aria-describedby', 'help');
        expect(trigger).toHaveAttribute('aria-errormessage', 'error');
        expect(trigger).not.toHaveAttribute('aria-required');
        expect(getRoot()).not.toHaveAttribute('aria-invalid');
    });
});

describe('Svelte DatePicker 组件实例', () => {
    it('bind:this 的实例带有文档中的方法', async () => {
        const { component } = await setup();
        for (const name of ['blur', 'close', 'focus', 'open'] as const) {
            expect(handleOf(component)[name]).toBeTypeOf('function');
        }
    });

    it('通过实例方法打开的范围选择器在首次点击后聚焦结束输入框，且只报告一次聚焦', async () => {
        const { store, component } = await setup({ props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        handleOf(component).open();
        await settle();
        await settle();
        await click(getDay('2021-06-10'));
        const [startInput, endInput] = getInputs();
        expect(endInput).toHaveFocus();
        expect(startInput).toHaveValue('2021-06-10');
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toHaveLength(1);
        await click(getDay('2021-06-12'));
        expect(changes(store)).toEqual(['change 2021-06-10 00:00:00|2021-06-12 00:00:00 ["2021-06-10","2021-06-12"]']);
        expect(getContainer()).not.toBeNull();
    });

    it('用户点击打开后，实例的 close() 关闭面板', async () => {
        const { component } = await setup();
        await click(getInput());
        expect(getContainer()).not.toBeNull();
        handleOf(component).close();
        await settle();
        expect(getContainer()).toBeNull();
    });

    it('用户点击外部关闭后，实例的 open() 重新打开面板', async () => {
        const { component } = await setup();
        await click(getInput());
        await clickOutside();
        expect(getContainer()).toBeNull();
        handleOf(component).open();
        await settle();
        expect(getContainer()).not.toBeNull();
    });

    it('未声明的属性（如 id、name 与 title）落在根 div，已声明的属性不落在任何地方', async () => {
        await setup({ props: { id: 'day', title: 'tip', name: 'day-name', density: 'compact', timeZone: 'Asia/Tokyo' } as never });
        expect(getRoot()).toHaveAttribute('id', 'day');
        expect(getRoot()).toHaveAttribute('name', 'day-name');
        expect(getRoot()).toHaveAttribute('title', 'tip');
        for (const attr of ['density', 'timezone']) {
            expect(getRoot()).not.toHaveAttribute(attr);
            expect(getInput()).not.toHaveAttribute(attr);
        }
    });

    it('trigger snippet 收到的 componentProps 不含属性透传与插槽', async () => {
        const store = createStore<ScenarioStore>({ scenario: 'trigger-scope', props: { class: 'custom', 'data-testid': 'dp', motion: false } });
        render(ScenarioFixture, { props: { store } });
        await settle();
        const scope = document.querySelector('[data-keys]') as HTMLElement;
        expect(scope).toHaveAttribute('data-type', 'date');
        const keys = (scope.dataset.keys as string).split(',');
        for (const key of ['class', 'data-testid', 'trigger']) {
            expect(keys).not.toContain(key);
        }
    });

    it('weekStartsOn 变化时重新排列已打开面板中的星期', async () => {
        const { store } = await setup({ value: baseDate, open: true });
        const firstWeekday = () => document.querySelector(`.${dp}-weekday-item`)?.textContent;
        expect(firstWeekday()).toBe('日');
        store.props.weekStartsOn = 1;
        await settle();
        expect(firstWeekday()).toBe('一');
    });

    it('autoSwitchDate 在本地零点将日期切换到年份选择器中选中的年份，且只切换一次', async () => {
        const { store } = await setupPinned();
        await click(getDay('2019-08-08'));
        await click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        await click(within(getYMLists()[0]).getByRole('option', { name: '2020' }));
        const panels = store.log.filter((entry) => entry.startsWith('panel'));
        expect(panels).toHaveLength(1);
        expect(panels[0]).toMatch(/"2020-08-08"$/);
        expect(changes(store)).toEqual(['change 2019-08-08 00:00:00 "2019-08-08"', 'change 2020-08-08 00:00:00 "2020-08-08"']);
    });

    it.each(['bind', 'one-way'] as const)('autoSwitchDate 在 %s 的 value 下同样只切换一次，且保留本地零点', async (mode) => {
        const { store } = await setup({ mode, value: baseDate, open: true });
        await click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        await click(within(getYMLists()[0]).getByRole('option', { name: '2020' }));
        expect(store.log.filter((entry) => entry.startsWith('panel'))).toHaveLength(1);
        expect(changes(store)).toEqual(['change 2020-09-08 00:00:00 "2020-09-08"']);
    });
});
