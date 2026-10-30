import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { click, getPopup } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import WrappersFixture, { type WrappersFixtureStore } from './date-picker-wrappers-fixture.svelte';
import { changes, getDay, getInput, getInputs, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

type Api = { focus: () => void; blur: () => void };

const range = () => [new Date(2019, 7, 10), new Date(2019, 7, 20)];
const apiOf = (component: unknown) => (component as { api: () => Api }).api();

async function renderProvided(init: Omit<ProviderFixtureStore, 'props'> & { props?: ProviderFixtureStore['props'] }) {
    const store = createStore<ProviderFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ProviderFixture, { props: { store } });
    await settle();
    return store;
}

async function renderWrapped(wrapper: WrappersFixtureStore['wrapper']) {
    const store = createStore<WrappersFixtureStore>({ wrapper });
    render(WrappersFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker timeZone 默认值', () => {
    it('ConfigProvider 的 timeZone 优先于全局默认值', async () => {
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { timeZone: 'UTC' } } };
        await renderProvided({ timeZone: 'Asia/Tokyo', props: { type: 'dateTime', value: new Date(Date.UTC(2021, 0, 1)) } });
        expect(getInput()).toHaveValue('2021-01-01 09:00:00');
    });

    it('没有 ConfigProvider 时读全局默认的 timeZone', async () => {
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { timeZone: 'Asia/Tokyo' } } };
        await setup({ value: new Date(Date.UTC(2021, 0, 1)), props: { type: 'dateTime' } });
        expect(getInput()).toHaveValue('2021-01-01 09:00:00');
    });
});

describe('Svelte DatePicker 面板开合与焦点', () => {
    it('打开后变为 disabled 时关闭面板并上报 onOpenChange(false)，重新启用不再弹出', async () => {
        const { store } = await setup({ open: true });
        expect(getPopup()).not.toBeNull();
        store.props.disabled = true;
        await settle();
        expect(getPopup()).toBeNull();
        expect(opens(store)).toEqual(['open false']);
        store.props.disabled = false;
        await settle();
        expect(getPopup()).toBeNull();
    });

    it('面板打开后再次点击输入框不重复上报 onOpenChange(true)', async () => {
        const { store } = await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await userEvent.click(startInput);
        await userEvent.click(startInput);
        await userEvent.click(endInput);
        await settle();
        expect(opens(store)).toEqual(['open true']);
    });

    it('needConfirm 时按 Esc 关闭面板触发 onCancel', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 11), open: true, props: { type: 'dateTime', needConfirm: true } });
        screen.getByRole('grid').focus();
        await userEvent.keyboard('{Escape}');
        await settle();
        expect(getPopup()).toBeNull();
        expect(store.log.filter((entry) => entry.startsWith('cancel'))).toHaveLength(1);
    });

    it('面板关闭时 Tab 经过两个范围输入框，再点开始框打开后，结束日期之后的日期仍可选', async () => {
        await setup({ value: range(), props: { type: 'dateRange' } });
        await userEvent.tab();
        await userEvent.tab();
        await settle();
        await click(getInputs()[0]);
        expect(getPopup()).not.toBeNull();
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('受控 open 时 Tab 经过两个范围输入框，再点开始框并由外部打开后，结束日期之后的日期仍可选', async () => {
        const { store } = await setup({ target: 'open', mode: 'function', value: range(), open: false, accept: false, props: { type: 'dateRange' } });
        await userEvent.tab();
        await userEvent.tab();
        await settle();
        await click(getInputs()[0]);
        store.open = true;
        await settle();
        expect(getPopup()).not.toBeNull();
        expect(getDay('2019-08-25')).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('焦点在范围清除按钮上按 ArrowDown 不打开面板', async () => {
        const { store } = await setup({ value: range(), props: { type: 'dateRange' } });
        screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        expect(opens(store)).toEqual([]);
        expect(getPopup()).toBeNull();
    });

    it('type="monthRange" 的 focus() 聚焦输入框，blur() 移走焦点', async () => {
        const { component } = await setup({ props: { type: 'monthRange' } });
        apiOf(component).focus();
        await settle();
        expect(getInputs()[0]).toHaveFocus();
        apiOf(component).blur();
        await settle();
        expect(getInputs()[0]).not.toHaveFocus();
    });

    it('trigger snippet 时 focus() 聚焦自定义触发器', async () => {
        const { component } = await setup({ trigger: 'text' });
        apiOf(component).focus();
        await settle();
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.chooseDate })).toHaveFocus();
    });

    it('insetInput 面板打开时 focus()、blur() 作用于面板内的输入框', async () => {
        const { component } = await setup({ open: true, props: { insetInput: true } });
        const inset = within(getPopup() as HTMLElement).getByRole('textbox');
        inset.blur();
        apiOf(component).focus();
        await settle();
        expect(inset).toHaveFocus();
        apiOf(component).blur();
        await settle();
        expect(inset).not.toHaveFocus();
    });

    it('单选类型开启 insetInput 时打开面板只触发一次 onFocus，且不带 rangeType', async () => {
        const { store } = await setup({ props: { insetInput: true } });
        await click(getInput());
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toEqual(['focus focusin']);
    });
});

describe('Svelte DatePicker 值与输入的边界', () => {
    it('键入无法解析的日期按 Enter 不以今天提交', async () => {
        const { store } = await setup();
        await typeText('2021-13');
        await userEvent.type(getInput(), '{Enter}');
        await settle();
        expect(changes(store)).toEqual([]);
    });

    it('dateRange 只填开始框按 Enter 不以今天提交', async () => {
        const { store } = await setup({ props: { type: 'dateRange' } });
        await typeText('2021-08-01', getInputs()[0]);
        await userEvent.type(getInputs()[0], '{Enter}');
        await settle();
        expect(changes(store)).toEqual([]);
    });

    it('null 清空预设与范围中的 null 端点不发出无法解析的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const first = await setup({ value: [new Date(2019, 7, 10), null as unknown as Date], props: { type: 'dateRange' } });
        first.unmount();
        await setup({ value: range(), open: true, props: { type: 'dateRange', presets: [{ text: 'clear', start: null, end: null }] } });
        await click(screen.getByRole('button', { name: 'clear' }));
        expect(warn.mock.calls.map(([message]) => String(message))).toEqual([]);
    });

    it('父级重新传入内容相同的新 defaultPickerValue，面板停在当前月份', async () => {
        const { store } = await setup({ open: true, props: { defaultPickerValue: new Date(2022, 8, 1) } });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        store.props.defaultPickerValue = new Date(2022, 8, 1);
        await settle();
        expect(getDay('2022-10-15')).not.toBeNull();
    });
});

describe('Svelte DatePicker 与 Form、Tooltip 组合', () => {
    it('Form inset 标签下 dateRange 的 group 名称指向渲染出的标签', async () => {
        await renderWrapped('form');
        const group = screen.getByRole('group', { name: '区间' });
        expect(document.getElementById(group.getAttribute('aria-labelledby') as string)).not.toBeNull();
    });

    it('Tooltip 包住的 DatePicker 只在输入框停留，根元素不是 Tab 停靠点', async () => {
        await renderWrapped('tooltip');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
    });
});
