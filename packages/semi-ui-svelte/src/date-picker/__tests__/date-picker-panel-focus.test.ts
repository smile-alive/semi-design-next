import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getPanel, getPopup, ymd } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import SlotsFixture, { type SlotsFixtureStore } from './date-picker-slots-fixture.svelte';
import TriggerFixture, { type TriggerFixtureStore } from './date-picker-trigger-fixture.svelte';
import { changes, clickOutside, dp, getContainer, getInput, getInputs, getNavTitle, getRoot, opens, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

async function focusInput(input: HTMLInputElement) {
    input.focus();
    await settle();
}

type Api = { focus: (rangeType?: string) => void; blur: () => void };

async function setupWithApi(init: Parameters<typeof setup>[0]) {
    const view = await setup(init);
    const api = (view.component as unknown as { api: () => Api }).api();
    return { ...view, api };
}

describe('Svelte DatePicker 面板导航', () => {
    it('点击年月标题显示年月选择器，日期网格被替换', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date' } });
        const grid = getPopup()?.querySelector(`.${dp}-month-grid`);
        expect(grid).toHaveAttribute('x-panel-yearandmonth-open-type', 'none');
        await click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(grid).toHaveAttribute('x-panel-yearandmonth-open-type', 'left');
        expect(getPanel('left')).toHaveClass(`${dp}-yam-showing`);
        expect(getPanel('left').querySelector(`.${dp}-month`)).toBeNull();
    });

    it('dateRange 显示两个相邻月份的面板', async () => {
        await setup({ value: [new Date(2021, 5, 1), new Date(2021, 6, 15)], open: true, props: { type: 'dateRange' } });
        expect(getPopup()?.querySelectorAll(`.${dp}-month`)).toHaveLength(2);
        expect(getNavTitle('left')).toBe('2021年 6月');
        expect(getNavTitle('right')).toBe('2021年 7月');
    });

    it('上一年与下一年按钮', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date' } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.prevYear }));
        expect(getNavTitle('left')).toBe('2018年 9月');
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextYear }));
        expect(getNavTitle('left')).toBe('2020年 9月');
    });

    it('切到下一月时报一次 onPanelChange', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date' } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        const panels = store.log.filter((entry) => entry.startsWith('panel'));
        expect(panels).toHaveLength(1);
        expect(panels[0]).toMatch(/^panel 2019-10-08 .* "2019-10-08"$/);
    });

    it('dateTime：切换时间面板与日期面板，激活的切换按钮带 active class', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime' } });
        const switchDate = screen.getByRole('button', { name: zh_CN.DatePicker.switchToDate });
        const switchTime = screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime });
        await click(switchTime);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(switchTime).toHaveClass(`${dp}-switch-date-active`);
        expect(switchDate).not.toHaveClass(`${dp}-switch-date-active`);
        await click(switchDate);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        expect(switchDate).toHaveClass(`${dp}-switch-date-active`);
    });

    it('disabledTime：时间面板里禁用的小时、分钟、秒带 aria-disabled', async () => {
        const disabledTime = () => ({
            disabledHours: () => [0, 1, 2, 3],
            disabledMinutes: () => [0, 15, 30, 45],
            disabledSeconds: () => [0],
        });
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', disabledTime } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        const disabledTexts = (list: Element) => [...new Set(Array.from(list.querySelectorAll('li[aria-disabled="true"]')).map((li) => li.textContent))];
        const [hours, minutes, seconds] = (getPopup() as HTMLElement).querySelectorAll(`.${dp}-tpk ul[role="listbox"]`);
        expect(disabledTexts(hours)).toEqual(['00', '01', '02', '03']);
        expect(disabledTexts(minutes)).toEqual(['00', '15', '30', '45']);
        expect(disabledTexts(seconds)).toEqual(['00']);
    });
});

describe('Svelte DatePicker 受控值与展开', () => {
    it('父级改 value 后输入框跟随', async () => {
        const { store } = await setup({ value: baseDate });
        expect(screen.getByRole('combobox')).toHaveValue(ymd(baseDate));
        store.value = new Date(2022, 0, 1);
        await settle();
        expect(screen.getByRole('combobox')).toHaveValue('2022-01-01');
    });

    it('bind:open：父级打开与关闭，点击外部写回 false', async () => {
        const { store } = await setup({ target: 'open', mode: 'bind', open: false, value: baseDate });
        store.open = true;
        await settle();
        expect(getPopup()).not.toBeNull();
        store.open = false;
        await settle();
        expect(getContainer()).toBeNull();
        store.open = true;
        await settle();
        expect(getPopup()).not.toBeNull();
        await clickOutside();
        expect(getContainer()).toBeNull();
        expect(store.open).toBe(false);
    });
});

describe('Svelte DatePicker 范围触发器', () => {
    it('点击范围触发器的空白处打开面板，焦点落在开始输入框', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange' } });
        await click(getRoot().querySelector(`.${dp}-range-input`) as HTMLElement);
        expect(opens(store)).toContain('open true');
        expect(getPopup()).not.toBeNull();
        expect(getInputs()[0]).toHaveFocus();
    });

    it('禁用时点击范围触发器不打开', async () => {
        const { store } = await setup({ props: { type: 'dateRange', disabled: true } });
        await fireEvent.click(getRoot().querySelector(`.${dp}-range-input`) as HTMLElement);
        await settle();
        expect(opens(store)).toEqual([]);
        expect(getPopup()).toBeNull();
    });

    it('在两个输入框间移动焦点不算新的 focus', async () => {
        const { store } = await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await focusInput(startInput);
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toEqual(['focus focusin rangeStart']);
        await focusInput(endInput);
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toHaveLength(1);
    });

    it('结束输入框按 Tab 离开范围后，激活态消失', async () => {
        await setup({ props: { type: 'dateRange' } });
        await focusInput(getInputs()[1]);
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await userEvent.tab();
        await settle();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });
});

describe('Svelte DatePicker 实例方法', () => {
    it('focus 与 blur 作用于输入框', async () => {
        const { api } = await setupWithApi({ value: baseDate, props: { type: 'date' } });
        api.focus();
        await settle();
        expect(getInput()).toHaveFocus();
        api.blur();
        await settle();
        expect(getInput()).not.toHaveFocus();
    });

    it('范围类型的 focus 按 rangeStart、rangeEnd 落在对应输入框，blur 清掉激活态', async () => {
        const { api } = await setupWithApi({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        api.focus('rangeStart');
        await settle();
        expect(startInput).toHaveFocus();
        api.blur();
        await settle();
        expect(startInput).not.toHaveFocus();

        api.focus('rangeEnd');
        await settle();
        expect(endInput).toHaveFocus();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        api.blur();
        await settle();
        expect(endInput).not.toHaveFocus();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-active`)).toBeNull();
    });
});

describe('Svelte DatePicker trigger snippet 的 rangeInputFocus', () => {
    const renderTrigger = async (props: TriggerFixtureStore['props']) => {
        const store = createStore<TriggerFixtureStore>({ props: { motion: false, ...props } });
        render(TriggerFixture, { props: { store } });
        await settle();
    };

    it('值为空数组时从 rangeStart 开始', async () => {
        await renderTrigger({ type: 'dateRange', value: [] });
        expect(document.querySelector('.custom-trigger')).toHaveTextContent('rangeStart');
    });

    it('没有值时点击前为 undefined，点击后为 rangeStart', async () => {
        await renderTrigger({ type: 'dateRange' });
        const trigger = document.querySelector('.custom-trigger') as HTMLElement;
        expect(trigger).toHaveTextContent('undefined');
        await click(trigger);
        expect(getPopup()).not.toBeNull();
        expect(trigger).toHaveTextContent('rangeStart');
    });
});

describe('Svelte DatePicker 只读、前缀与语言包', () => {
    it('inputReadOnly：输入框 readonly 并带只读 class', async () => {
        await setup({ value: baseDate, props: { inputReadOnly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(getRoot().querySelector(`.${dp}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const { store } = await setup({ value: baseDate, props: { inputReadOnly: true, showClear: true } });
        expect(getInput()).toHaveAttribute('readonly');
        await userEvent.hover(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`) as HTMLElement);
        await fireEvent.mouseDown(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(changes(store)).toHaveLength(1);
        expect(getInput()).toHaveValue('');
    });

    it('范围选择的 inputReadOnly 锁定两个输入框', async () => {
        await setup({ props: { type: 'dateRange', inputReadOnly: true } });
        expect(getInputs()).toHaveLength(2);
        getInputs().forEach((input) => expect(input).toHaveAttribute('readonly'));
    });

    it('prefix snippet 渲染在输入框前缀里', async () => {
        const store = createStore<SlotsFixtureStore>({ props: { value: baseDate, motion: false }, prefix: true });
        render(SlotsFixture, { props: { store } });
        await settle();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-prefix .custom-prefix`)).toHaveTextContent('前缀');
    });

    it('format 随 LocaleProvider 的语言包解析', async () => {
        const store = createStore<ProviderFixtureStore>({ locale: en_US, props: { value: baseDate, format: 'MM/dd/yyyy', motion: false } });
        render(ProviderFixture, { props: { store } });
        await settle();
        expect(getInput()).toHaveValue('09/08/2019');
    });
});
