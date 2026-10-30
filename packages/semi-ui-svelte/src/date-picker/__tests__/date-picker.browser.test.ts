import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './date-picker-fixture.svelte';

const dp = `${BASE_CLASS_PREFIX}-datepicker`;

type SetupInit = Partial<Omit<FixtureStore, 'props'>> & { props?: FixtureStore['props'] };

function setup({ props, ...init }: SetupInit = {}) {
    const store = createStore<FixtureStore>({ target: 'value', mode: init.value === undefined ? 'uncontrolled' : 'one-way', accept: true, log: [], ...init, props: { motion: false, ...props } });
    render(Fixture, { props: { store } });
    flushSync();
    return store;
}

const getPopup = () => document.querySelector<HTMLElement>(`.${dp}-container`);
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getInput = () => document.querySelector<HTMLInputElement>(`.${dp} input`) as HTMLInputElement;
const getTitle = () => document.querySelector<HTMLElement>(`.${dp}-month-grid-left .${dp}-navigation-month button`) as HTMLElement;

describe('Svelte DatePicker 键盘与焦点', () => {
    it('ArrowDown 打开面板，再按 ArrowDown 焦点移入面板，Esc 关闭后焦点回到输入框', async () => {
        setup({ value: new Date(2019, 8, 11) });
        await tabTo(getInput());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).toContainElement(document.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(getInput()).toHaveFocus();
    });

    it('网格获得键盘焦点时，主题焦点环跟随当前日期，Enter 选中后焦点回到输入框', async () => {
        const store = setup({ value: new Date(2019, 8, 11), open: true });
        const grid = await screen.findByRole('grid');
        await tabTo(grid);
        expectThemeFocusRing(getDay('2019-09-11'));
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expectThemeFocusRing(getDay('2019-09-12')));
        expect(grid).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getInput()).toHaveValue('2019-09-12'));
        expect(getInput()).toHaveFocus();
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change 2019-09-12 00:00:00 "2019-09-12"']);
    });

    it('用指针选择日期时焦点不回到输入框', async () => {
        setup({ value: new Date(2019, 8, 11) });
        await userEvent.click(getInput());
        await userEvent.click(await waitFor(() => getDay('2019-09-12')));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(getInput()).toHaveValue('2019-09-12');
        expect(getInput()).not.toHaveFocus();
    });

    it('trigger snippet 内的按钮：Enter 打开，面板内 Esc 关闭后焦点回到按钮', async () => {
        setup({ value: new Date(2019, 8, 11), trigger: 'button' });
        const trigger = document.querySelector<HTMLElement>('.custom-trigger') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('没有焦点目标的 trigger snippet，焦点回到外层 button', async () => {
        setup({ trigger: 'text' });
        const trigger = await screen.findByRole('button', { name: zh_CN.DatePicker.chooseDate });
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('insetInput 下打开后焦点进入面板输入框，Esc 关闭后回到触发框', async () => {
        setup({ value: new Date(2019, 8, 11), props: { insetInput: true } });
        await userEvent.click(getInput());
        await waitFor(() => expect(document.querySelector(`.${dp}-inset-input-wrapper input`)).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        await waitFor(() => expect(getInput()).toHaveFocus());
    });

    it('从月份标题进入年月选择器焦点落在年份列表，返回后焦点回到标题', async () => {
        setup({ value: new Date(2030, 4, 10), open: true });
        await waitFor(() => expect(getTitle()).not.toBeNull());
        const titleId = getTitle().id;
        await tabTo(getTitle());
        await userEvent.keyboard('{Enter}');
        const left = document.querySelector<HTMLElement>(`.${dp}-month-grid-left`) as HTMLElement;
        await waitFor(() => expect(document.activeElement).toBe(left.querySelector('[role="listbox"]')));
        const back = await within(left).findByRole('button', { name: zh_CN.DatePicker.selectDate });
        await tabTo(back);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.activeElement?.id).toBe(titleId));
    });

    it('dateRange 用指针选完两端后关闭并提交', async () => {
        const store = setup({ props: { type: 'dateRange' }, value: [new Date(2019, 8, 1), new Date(2019, 8, 2)] });
        const [start, end] = Array.from(document.querySelectorAll<HTMLInputElement>(`.${dp} input`));
        await userEvent.click(start);
        await userEvent.click(await waitFor(() => getDay('2019-09-05')));
        await waitFor(() => expect(end).toHaveFocus());
        await userEvent.click(getDay('2019-09-09'));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect([start.value, end.value]).toEqual(['2019-09-05', '2019-09-09']);
        expect(store.log.filter((entry) => entry.startsWith('change')).at(-1)).toBe('change 2019-09-05 00:00:00|2019-09-09 00:00:00 ["2019-09-05","2019-09-09"]');
    });
});
