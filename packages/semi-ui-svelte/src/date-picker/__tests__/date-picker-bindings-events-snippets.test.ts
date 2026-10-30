import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { DatePickerTriggerRenderProps } from '../interface';
import ContextFixture, { type ContextFixtureStore } from './date-picker-context-fixture.svelte';
import { click, getPopup, getPresetButtons, ymd } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import SnippetsFixture, { type SnippetsFixtureStore } from './date-picker-snippets-fixture.svelte';
import { changes, clickOutside, dp, getDay, getInput, getInputs, getRoot, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

async function renderSnippets(init: Omit<SnippetsFixtureStore, 'props'> & { props?: SnippetsFixtureStore['props'] }, record?: (scope: DatePickerTriggerRenderProps) => void) {
    const store = createStore<SnippetsFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(SnippetsFixture, { props: { store, record } });
    await settle();
    return store;
}

async function renderProvided(init: Omit<ProviderFixtureStore, 'props'> & { props?: ProviderFixtureStore['props'] }) {
    const store = createStore<ProviderFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ProviderFixture, { props: { store } });
    await settle();
    return store;
}

async function renderContext(init: Omit<ContextFixtureStore, 'props'> & { props?: ContextFixtureStore['props'] }) {
    const store = createStore<ContextFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ContextFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker bind 与受控写法', () => {
    it('选择日期后 bind:value 回写，输入框显示新值', async () => {
        const { store } = await setup({ mode: 'bind', props: { defaultPickerValue: '2021-06-01' } });
        await click(getInput());
        await click(getDay('2021-06-10'));
        expect(getInput()).toHaveValue('2021-06-10');
        expect(store.value).toEqual(new Date(2021, 5, 10));
    });

    it('单选清空写回 undefined，范围清空写回空数组', async () => {
        const single = await setup({ mode: 'bind', value: baseDate });
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement, { button: 0 });
        await settle();
        expect(single.store.value).toBeUndefined();
        expect(getInput()).toHaveValue('');
        single.unmount();

        const range = await setup({ mode: 'bind', value: [baseDate, new Date(2019, 8, 11, 8, 8, 8, 8)], props: { type: 'dateRange' } });
        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }), { button: 0 });
        await settle();
        expect(range.store.value).toEqual([]);
    });

    it('value 为 null 时受控为空，选择后父级不接受则保持为空', async () => {
        const { store } = await setup({ mode: 'function', value: null, accept: false, props: { defaultPickerValue: '2021-06-01' } });
        expect(getInput()).toHaveValue('');
        await click(getInput());
        await click(getDay('2021-06-10'));
        expect(store.log.filter((entry) => entry.startsWith('set'))).toEqual(['set 2021-06-10 00:00:00']);
        expect(getPopup()).toBeNull();
        expect(getInput()).toHaveValue('');
    });

    it('受控 open：onOpenChange 与 setter 各报一次，open 不随之改变', async () => {
        const { store } = await setup({ target: 'open', mode: 'function', open: false, accept: false });
        await click(getInput());
        expect(opens(store)).toEqual(['open true']);
        expect(store.log.filter((entry) => entry.startsWith('set open'))).toEqual(['set open true']);
        expect(getPopup()).toBeNull();
    });

    it('同一 tick 内修改 value 与 timeZone，按新时区显示新值', async () => {
        const store = await renderProvided({ timeZone: 'GMT+00:00', props: { type: 'dateTime', value: 1683084540000 - 86400000 } });
        expect(getInput()).toHaveValue('2023-05-02 03:29:00');
        store.props.value = 1683084540000;
        store.timeZone = 'GMT+05:00';
        await settle();
        expect(getInput()).toHaveValue('2023-05-03 08:29:00');
    });
});

describe('Svelte DatePicker 事件', () => {
    it('键入未完成的文本不触发 onChange，原生 change 也不触发；选择日期时载荷为 (date, dateString)', async () => {
        const { store } = await setup({ props: { defaultPickerValue: '2021-06-01' } });
        await click(getInput());
        await typeText('2021-0');
        await fireEvent.change(getInput());
        await settle();
        expect(changes(store)).toEqual([]);
        await click(getDay('2021-06-10'));
        expect(changes(store)).toEqual(['change 2021-06-10 00:00:00 "2021-06-10"']);
    });

    it('onFocus 每次聚焦只触发一次，onBlur 只在面板关闭时触发一次', async () => {
        const { store } = await setup();
        await click(getInput());
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toEqual(['focus focusin']);
        await fireEvent.focusOut(getInput());
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual([]);
        await clickOutside();
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual(['blur mousedown']);
    });

    it('未声明的 onclick 落在根元素，只触发一次', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        await setup({ props: { onclick } });
        await userEvent.click(getRoot());
        expect(onclick).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte DatePicker snippet', () => {
    it('trigger 参数含展示数据、componentProps 与 onChange、onEnterPress、onClear', async () => {
        const onChange = vi.fn<(date: unknown, dateString: unknown) => void>();
        const onClear = vi.fn<(event: MouseEvent) => void>();
        const scopes: DatePickerTriggerRenderProps[] = [];
        await renderSnippets({ inputTrigger: true, props: { value: baseDate, placeholder: 'Pick', onChange, onClear } }, (scope) => scopes.push(scope));
        const scope = scopes[scopes.length - 1];
        expect(scope.value.map(ymd)).toEqual(['2019-09-08']);
        expect(scope.inputValue).toBeNull();
        expect(scope.placeholder).toBe('Pick');
        expect(scope.disabled).toBe(false);
        expect(scope.rangeInputFocus).toBeUndefined();
        expect(scope.componentProps.value).toBe(baseDate);
        expect(scope.componentProps).not.toHaveProperty('trigger');

        const custom = screen.getByRole('textbox', { name: 'custom' }) as HTMLInputElement;
        await typeText('2021-06-10', custom);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('2021-06-10');

        await fireEvent.keyDown(custom, { key: 'Enter', target: { value: '2021-06-12' } });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][1]).toBe('2021-06-12');

        // onClear only reports the click; the custom input clears its text through onChange
        await click(screen.getByRole('button', { name: 'clear' }));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('fullDate 下日期格只保留 -day 与 -day-active 类', async () => {
        await setup({ value: baseDate, open: true, fullDate: true });
        expect(Array.from(getDay('2019-09-08').classList).sort()).toEqual([`${dp}-day`, `${dp}-day-active`]);
        expect(Array.from(getDay('2019-09-09').classList)).toEqual([`${dp}-day`]);
    });

    it('leftSlot 在面板容器最前，rightSlot 在最后', async () => {
        await renderSnippets({ sides: true, props: { open: true } });
        const container = getPopup()?.querySelector(`.${dp}-container`) as HTMLElement;
        expect(container.firstElementChild).toHaveClass(`${dp}-leftSlot`);
        expect(container.firstElementChild).toHaveTextContent('left');
        expect(container.lastElementChild).toHaveClass(`${dp}-rightSlot`);
        expect(container.lastElementChild).toHaveTextContent('right');
    });

    it('rangeSeparatorNode 只改显示，rangeSeparator 仍用于解析键入的范围', async () => {
        const onChange = vi.fn<(date: unknown, dateString: unknown) => void>();
        await renderSnippets({ separatorNode: true, props: { type: 'dateRange', rangeSeparator: '~', onChange } });
        expect(getRoot().querySelector('.custom-separator')).toHaveTextContent('to');
        const [start, end] = getInputs();
        await click(start);
        await typeText('2021-08-06', start);
        await typeText('2021-08-15', end);
        expect(onChange.mock.lastCall?.[1]).toEqual(['2021-08-06', '2021-08-15']);
    });

    it('预设按钮内不含 div', async () => {
        await setup({ open: true, props: { presets: [{ text: 'Today', start: baseDate, end: baseDate }] } });
        const [button] = getPresetButtons();
        expect(button).toHaveTextContent('Today');
        expect(button.querySelector('div')).toBeNull();
    });
});

describe('Svelte DatePicker 默认值与属性', () => {
    it('disabledDate 可经 semiGlobal 设默认值', async () => {
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { disabledDate: (date?: Date) => date?.getDate() === 15 } } };
        await setup({ open: true, props: { defaultPickerValue: '2019-09-01' } });
        expect(getDay('2019-09-15')).toHaveClass(`${dp}-day-disabled`);
        expect(getDay('2019-09-16')).not.toHaveClass(`${dp}-day-disabled`);
    });

    it('不传 disabledDate 时年月面板与日期面板正常渲染', async () => {
        const error = vi.spyOn(console, 'error');
        const warn = vi.spyOn(console, 'warn');
        const month = await setup({ open: true, props: { type: 'month' } });
        expect(screen.getByRole('listbox', { name: zh_CN.DatePicker.year })).toBeInTheDocument();
        month.unmount();
        await setup({ open: true });
        expect(screen.getByRole('grid')).toBeInTheDocument();
        expect(error).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    it('日期面板切换到年月选择器与时间面板不产生 Svelte 开发期警告', async () => {
        const error = vi.spyOn(console, 'error');
        const warn = vi.spyOn(console, 'warn');
        await setup({ value: baseDate, open: true, props: { type: 'dateTimeRange' } });
        await click(document.querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(document.querySelector(`.${dp}-yam`)).not.toBeNull();
        await click(screen.getAllByRole('button', { name: zh_CN.DatePicker.switchToTime })[0]);
        expect(document.querySelector(`.${dp}-tpk`)).not.toBeNull();
        expect(error).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    it('日期时间面板的时间列不带 timepicker 列类名，12 小时制多出 ampm 列', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', timePickerOpts: { use12Hours: true } } });
        await click(await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-body > div`)).toHaveLength(4);
        expect(document.querySelector('[class*="-list-hour"]')).toBeNull();
        expect(document.querySelector('[class*="undefined"]')).toBeNull();
    });

    it('范围类型下 aria 控制键落在两个输入框，id、title 与 data-* 落在根元素', async () => {
        await setup({ props: { type: 'dateRange', id: 'period', title: 'tip', 'data-testid': 'dp', 'aria-describedby': 'help' } });
        expect(getRoot()).toHaveAttribute('id', 'period');
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getRoot()).toHaveAttribute('data-testid', 'dp');
        expect(getRoot()).not.toHaveAttribute('aria-describedby');
        for (const input of screen.getAllByRole('combobox')) {
            expect(input).toHaveAttribute('aria-describedby', 'help');
            expect(input).not.toHaveAttribute('id');
        }
    });

    it('单选传 role="region" 落在根元素', async () => {
        await setup({ props: { role: 'region', 'aria-labelledby': 'lbl' } });
        expect(getRoot()).toHaveAttribute('role', 'region');
    });

    it('范围类型传 role 时落在根元素，不被 group 覆盖', async () => {
        await setup({ props: { type: 'dateRange', 'aria-label': '期间', role: 'toolbar' } });
        expect(getRoot()).toHaveAttribute('role', 'toolbar');
        expect(document.querySelector('[role="group"]')).toBeNull();
    });

    it('自定义触发器加外部 label 时 button 名称为该 label', async () => {
        await renderContext({ label: '生日', textTrigger: true, props: { 'aria-labelledby': 'external-label' } });
        const trigger = screen.getByRole('button', { name: '生日' });
        expect(trigger).not.toHaveAttribute('aria-label');
        expect(getRoot()).not.toHaveAttribute('aria-labelledby');
    });

    it('日期面板每格每次只调一次 disabledDate', async () => {
        const disabledDate = vi.fn<(date: Date) => boolean>(() => false);
        await setup({ open: true, props: { defaultPickerValue: '2019-09-01', disabledDate } });
        expect(getDay('2019-09-15')).toBeInTheDocument();
        expect(disabledDate.mock.calls.filter(([date]) => ymd(date) === '2019-09-15')).toHaveLength(1);
    });

    it('LocaleProvider 的 ja_JP 用于面板名称与预设标题', async () => {
        await renderProvided({ locale: ja_JP, props: { open: true, presetPosition: 'left', presets: [{ text: 'Today', start: baseDate, end: baseDate }] } });
        expect(await screen.findByRole('dialog', { name: ja_JP.DatePicker.panel.date })).toBeInTheDocument();
        expect(screen.getByText(ja_JP.DatePicker.presets)).toBeInTheDocument();
    });
});
