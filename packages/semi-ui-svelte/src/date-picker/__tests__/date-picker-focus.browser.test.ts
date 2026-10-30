import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { addDays } from 'date-fns';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { DatePickerDisabledDateType, DatePickerProps } from '../interface';
import { focusClass } from './date-picker-browser-utils';
import { getPanel, getPopup } from './date-picker-dom-utils';
import Fixture, { type FixtureStore } from './date-picker-fixture.svelte';
import FocusOpenFixture, { type FocusOpenFixtureStore } from './date-picker-focus-open-fixture.svelte';
import { dp, getDay, getInput, getInputs, getRoot, settle, setup } from './test-utils';

const getInsetInputs = () => document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
const expectPopupClosed = () => waitFor(() => expect(getPopup()).toBeNull());
const focusEvents = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('focus'));

describe('Svelte DatePicker 实例方法 focus 与 blur（浏览器）', () => {
    it('focus + blur + date 类型', async () => {
        const { component } = await setup({ props: { type: 'dateTime' } });
        const input = getInput();
        component.api()?.focus();
        await waitFor(() => expect(getRoot().querySelector(`.${focusClass}`)).not.toBeNull());
        expect(input).toHaveFocus();
        component.api()?.blur();
        await waitFor(() => expect(getRoot().querySelector(`.${focusClass}`)).toBeNull());
        expect(input).not.toHaveFocus();
    });

    it('focus + blur + dateRange 类型', async () => {
        const { component } = await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        const wrapper = (side: string) => getRoot().querySelector(`.${dp}-range-input-wrapper-${side}`) as Element;
        component.api()?.focus();
        await waitFor(() => expect(wrapper('start').querySelector(`.${focusClass}`)).not.toBeNull());
        expect(startInput).toHaveFocus();
        component.api()?.focus('rangeEnd');
        await waitFor(() => expect(wrapper('end').querySelector(`.${focusClass}`)).not.toBeNull());
        expect(endInput).toHaveFocus();
        component.api()?.blur();
        await waitFor(() => expect(getRoot().querySelector(`.${focusClass}`)).toBeNull());
        expect(startInput).not.toHaveFocus();
        expect(endInput).not.toHaveFocus();
    });

    it('focus + blur + inset 类型', async () => {
        const { component } = await setup({ props: { type: 'dateRange', insetInput: true } });
        component.api()?.focus();
        component.api()?.open();
        await waitFor(() => expect(getInsetInputs()[0]).toHaveFocus());
        component.api()?.focus('rangeEnd');
        component.api()?.open();
        await waitFor(() => expect(getInsetInputs()[1]).toHaveFocus());
        component.api()?.blur();
        component.api()?.close();
        const [startInput, endInput] = getInputs();
        await waitFor(() => expect(startInput).not.toHaveFocus());
        expect(endInput).not.toHaveFocus();
    });
});

describe('Svelte DatePicker 日历网格与焦点（浏览器）', () => {
    it('用键盘清空单个输入框后焦点回到输入框，且不打开面板', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 11) });
        const input = getInput();
        await tabTo(input);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: zh_CN.Input.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(input).toHaveValue(''));
        expect(store.log.filter((entry) => entry.startsWith('change'))).toHaveLength(1);
        expect(input).toHaveFocus();
        expect(getPopup()).toBeNull();
    });

    it('网格获得键盘焦点时，主题焦点环跟随当前日期，且其他日期没有轮廓', async () => {
        await setup({ value: new Date(2019, 8, 11), open: true });
        const grid = await screen.findByRole('grid');
        await tabTo(grid);
        expectThemeFocusRing(getDay('2019-09-11'));
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expectThemeFocusRing(getDay('2019-09-12')));
        expect(getComputedStyle(getDay('2019-09-11')).outlineStyle).toBe('none');
        expect(grid).toHaveFocus();
    });

    it('用指针选择日期时焦点留在点击处，并只通知一次 onFocus', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 11) });
        const input = getInput();
        await userEvent.click(input);
        await userEvent.click(await waitFor(() => getDay('2019-09-12')));
        await expectPopupClosed();
        expect(input).toHaveValue('2019-09-12');
        expect(input).not.toHaveFocus();
        expect(focusEvents(store)).toHaveLength(1);
    });

    it('点击预设会关闭由 onFocus 控制打开状态的面板（FixOnFocus）', async () => {
        const store = createStore<FocusOpenFixtureStore>({ open: false, log: [] });
        render(FocusOpenFixture, { props: { store } });
        flushSync();
        const input = getInput();
        await userEvent.click(input);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'Preset' }));
        await expectPopupClosed();
        expect(input).toHaveValue('2022-03-03');
        expect(store.log).toEqual(['focus']);
    });

    it('重新选择时 disabledDate 接收当前的 rangeStart 与 rangeEnd（修复 #777）', async () => {
        const disabledDate: DatePickerDisabledDateType = (date, options = {}) => {
            const { rangeInputFocus } = options;
            if (date === undefined) {
                return false;
            } else if (rangeInputFocus === 'rangeStart') {
                return date <= addDays(new Date(options.rangeEnd as string), -20);
            } else if (rangeInputFocus === 'rangeEnd') {
                return date >= addDays(new Date(options.rangeStart as string), 20);
            }
            return false;
        };
        await setup({ props: { type: 'dateRange', defaultPickerValue: new Date('2023-04-01'), disabledDate } });
        const [startInput, endInput] = getInputs();
        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2023-04-05')));
        await userEvent.click(getDay('2023-04-10'));
        await expectPopupClosed();

        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2023-05-06')));
        await userEvent.click(getDay('2023-05-11'));
        expect(startInput).toHaveValue('2023-05-06');
        expect(endInput).toHaveValue('2023-05-11');
        await expectPopupClosed();

        await userEvent.click(startInput);
        await waitFor(() => expect(getDay('2023-05-06')).toHaveClass(`${dp}-day-selected-start`));
        expect(getDay('2023-05-11')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('从结束框打开、键盘 Esc 关闭后，从开始框重开并选开始日期，面板保持打开', async () => {
        await setup({ value: [new Date(2019, 8, 1), new Date(2019, 8, 5)], props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await tabTo(endInput);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).toContainElement(document.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await expectPopupClosed();
        expect(endInput).toHaveFocus();

        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2019-09-02')));
        await waitFor(() => expect(endInput).toHaveFocus());
        expect(getPopup()).not.toBeNull();
    });
});

describe('Svelte DatePicker 触发器键盘访问（浏览器）', () => {
    it('Tab 在结束输入框之后到达范围清除按钮，并显示主题焦点环', async () => {
        await setup({ value: [new Date(2019, 8, 1), new Date(2019, 8, 5)], props: { type: 'dateRange' } });
        const [, endInput] = getInputs();
        await tabTo(endInput);
        await userEvent.keyboard('{Tab}');
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear).toHaveFocus();
        expectThemeFocusRing(clear);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(endInput).toHaveValue(''));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('主题焦点环标记 dateTime 面板的日期与时间切换按钮', async () => {
        await setup({ value: new Date(2019, 8, 11), open: true, props: { type: 'dateTime' } });
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        await tabTo(toTime);
        expectThemeFocusRing(toTime);
    });

    it('没有焦点目标的 trigger snippet：外层 button 显示主题焦点环，面板关闭后焦点回到它', async () => {
        await setup({ trigger: 'text' });
        const trigger = await screen.findByRole('button', { name: zh_CN.DatePicker.chooseDate });
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        await userEvent.keyboard('{Enter}');
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{Escape}');
        await expectPopupClosed();
        expect(trigger).toHaveFocus();
    });
});

describe('Svelte DatePicker 清除范围值后的焦点（浏览器）', () => {
    const rangeValue = [new Date(2019, 8, 1), new Date(2019, 8, 5)];
    const clearButton = () => screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
    // the clear button shows on hover or focus only
    const tabToClear = async () => {
        await tabTo(getInputs()[1]);
        await userEvent.keyboard('{Tab}');
        expect(clearButton()).toHaveFocus();
    };

    it('键盘清除：焦点交给起始输入框', async () => {
        await setup({ value: rangeValue, props: { type: 'dateRange' } });
        await tabToClear();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('指针点击清除按钮：焦点交给起始输入框', async () => {
        await setup({ value: rangeValue, props: { type: 'dateRange' } });
        await userEvent.hover(getRoot());
        await userEvent.click(clearButton());
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('清除按钮有焦点时父级把值清空：焦点交给起始输入框', async () => {
        const { store } = await setup({ mode: 'bind', value: rangeValue, props: { type: 'dateRange' } });
        await tabToClear();
        store.value = [];
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('受控 setter 拒绝指针清除后，清除按钮不再被记为持有焦点', async () => {
        const { store } = await setup({ mode: 'function', accept: false, value: rangeValue, props: { type: 'dateRange' } });
        await userEvent.hover(getRoot());
        await userEvent.click(clearButton());
        expect(store.log).toContain('set ');
        expect(getInputs()[0]).not.toHaveValue('');
        store.accept = true;
        store.value = [];
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(getInputs()[0]).not.toHaveFocus();
    });

    it('焦点在组件外时父级清空值：不抢焦点', async () => {
        const { store } = await setup({ mode: 'bind', value: rangeValue, props: { type: 'dateRange' } });
        const outside = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => outside.remove());
        outside.focus();
        store.value = [];
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(outside).toHaveFocus();
    });
});

describe('Svelte DatePicker 清除单值后的焦点（浏览器）', () => {
    const types = ['date', 'dateTime', 'month'] as const;
    const clearButton = () => screen.getByRole('button', { name: zh_CN.Input.clear });

    it.each(types)('%s 键盘清除：焦点留在输入框', async (type) => {
        await setup({ value: new Date(2019, 8, 11), props: { type } });
        await tabTo(getInput());
        await userEvent.keyboard('{Tab}');
        expect(clearButton()).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getInput()).toHaveValue(''));
        expect(getInput()).toHaveFocus();
    });

    it.each(types)('%s 指针点击清除按钮：焦点落在输入框', async (type) => {
        await setup({ value: new Date(2019, 8, 11), props: { type } });
        await userEvent.hover(getRoot());
        await userEvent.click(clearButton());
        await waitFor(() => expect(getInput()).toHaveValue(''));
        expect(getInput()).toHaveFocus();
    });
});

describe('Svelte DatePicker 年月选择器的焦点（浏览器）', () => {
    const cases: { type: 'date' | 'dateRange'; value: DatePickerProps['value'] }[] = [
        { type: 'date', value: new Date(2030, 4, 10) },
        { type: 'dateRange', value: [new Date(2030, 4, 10), new Date(2030, 7, 12)] },
    ];
    const getTitle = () => getPanel('left').querySelector<HTMLElement>(`.${dp}-navigation-month button`) as HTMLElement;

    it.each(cases)('$type 用键盘从月份标题进入年月选择器，焦点落在年份列表', async ({ type, value }) => {
        await setup({ value, open: true, props: { type } });
        await waitFor(() => expect(getTitle()).not.toBeNull());
        await tabTo(getTitle());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.activeElement).toBe(getPanel('left').querySelector('[role="listbox"]')));
    });

    it.each(cases)('$type 用键盘从年月选择器返回，焦点回到月份标题', async ({ type, value }) => {
        await setup({ value, open: true, props: { type } });
        await waitFor(() => expect(getTitle()).not.toBeNull());
        const titleId = getTitle().id;
        await userEvent.click(getTitle());
        const back = await within(getPanel('left')).findByRole('button', { name: zh_CN.DatePicker.selectDate });
        await tabTo(back);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.activeElement?.id).toBe(titleId));
    });
});

describe('Svelte DatePicker ShadowRoot 内的焦点（浏览器）', () => {
    const setupInShadow = async (init: Partial<FixtureStore> = {}) => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const target = document.createElement('div');
        shadow.append(target);
        const store = createStore<FixtureStore>({ target: 'value', mode: init.value === undefined ? 'uncontrolled' : 'one-way', accept: true, log: [], props: { motion: false }, ...init });
        const view = render(Fixture, { props: { store }, target });
        onTestFinished(() => {
            view.unmount();
            host.remove();
        });
        await settle();
        return { shadow, component: view.component };
    };

    it('键盘焦点在面板内时 Esc 关闭面板，焦点回到输入框', async () => {
        const { shadow } = await setupInShadow({ value: new Date(2019, 8, 11) });
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).toContainElement(shadow.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).toBeNull());
        expect(shadow.activeElement).toBe(input);
    });

    it('用键盘从年月选择器返回，焦点回到月份标题', async () => {
        const { shadow } = await setupInShadow({ value: new Date(2030, 4, 10), open: true });
        const title = await waitFor(() => {
            const button = shadow.querySelector<HTMLElement>(`.${dp}-navigation-month button`);
            expect(button).not.toBeNull();
            return button as HTMLElement;
        });
        title.click();
        const left = shadow.querySelector(`.${dp}-month-grid-left`) as HTMLElement;
        const back = await within(left).findByRole('button', { name: zh_CN.DatePicker.selectDate });
        // the year list takes focus once rendered, which would pull it off the back button
        await waitFor(() => expect(shadow.activeElement).toBe(left.querySelector('[role="listbox"]')));
        back.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement?.id).toBe(title.id));
    });

    it('实例方法 blur() 让输入框失焦', async () => {
        const { shadow, component } = await setupInShadow();
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        expect(shadow.activeElement).toBe(input);
        component.api()?.blur();
        expect(shadow.activeElement).toBeNull();
    });
});
