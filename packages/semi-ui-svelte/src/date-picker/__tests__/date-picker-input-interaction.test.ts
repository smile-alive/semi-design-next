import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import ClearIconFixture, { type ClearIconFixtureStore } from './date-picker-clear-icon-fixture.svelte';
import { click, getPopup, ymd } from './date-picker-dom-utils';
import SlotsFixture, { type SlotsFixtureStore } from './date-picker-slots-fixture.svelte';
import { changes, clickOutside, dp, getContainer, getDay, getInputs, getRoot, getSelectedDays, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const juneRange = [new Date(2021, 5, 1), new Date(2021, 5, 15)];
const dateTimeRange = [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)];

type Api = { open: () => void; close: () => void; focus: (type?: string) => void };
const apiOf = (component: unknown) => (component as { api: () => Api }).api();
const insetInputs = (placeholder: string) => within(getPopup() as HTMLElement).getAllByPlaceholderText<HTMLInputElement>(placeholder);

async function renderSlots(init: SlotsFixtureStore) {
    const store = createStore<SlotsFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    const view = render(SlotsFixture, { props: { store } });
    await settle();
    return view;
}

describe('Svelte DatePicker 输入框文本与状态', () => {
    it('空值显示空字符串：单选与 value 为 null 的范围', async () => {
        const single = await setup({ props: { type: 'date' } });
        expect(single.container.querySelector('input')).toHaveValue('');
        const range = await setup({ value: null, props: { type: 'dateRange' } });
        range.container.querySelectorAll('input').forEach((input) => expect(input).toHaveValue(''));
    });

    it('各类型的输入框数量', async () => {
        const range = await setup({ props: { type: 'dateRange' } });
        expect(range.container.querySelectorAll('input')).toHaveLength(2);
        const monthRange = await setup({ props: { type: 'monthRange' } });
        expect(monthRange.container.querySelectorAll('input')).toHaveLength(1);
        const date = await setup({ props: { type: 'date' } });
        expect(date.container.querySelectorAll('input')).toHaveLength(1);
    });

    it('自定义文本格式', async () => {
        await setup({ value: baseDate, props: { type: 'date', format: 'yyyy年MM月dd日' } });
        expect(getInputs()[0]).toHaveValue('2019年09月08日');
    });

    it('范围分隔符在起止都有值时激活', async () => {
        const filled = await setup({ value: juneRange, props: { type: 'dateRange' } });
        expect(filled.container.querySelector(`.${dp}-range-input-separator`)).toHaveClass(`${dp}-range-input-separator-active`);
        const empty = await setup({ props: { type: 'dateRange' } });
        expect(empty.container.querySelector(`.${dp}-range-input-separator`)).not.toHaveClass(`${dp}-range-input-separator-active`);
    });

    it('size 为 large 的 dateRange 使用范围默认尺寸', async () => {
        await setup({ value: juneRange, props: { type: 'dateRange', size: 'large' } });
        expect(getRoot().querySelector(`.${dp}-range-input`)).toHaveClass(`${dp}-range-input-large`);
        getRoot()
            .querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper`)
            .forEach((wrapper) => expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-default`));
    });

    it('monthRange 的 placeholder 数组按分隔符拼接', async () => {
        await setup({ props: { type: 'monthRange', placeholder: ['Start', 'End'], rangeSeparator: ' - ' } });
        expect(screen.getByPlaceholderText('Start - End')).toBeInTheDocument();
    });

    it('点击日历后缀开始范围选择', async () => {
        const { container } = await setup({ value: juneRange, props: { type: 'dateRange' } });
        await click(container.querySelector(`.${dp}-range-input-suffix`) as HTMLElement);
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        expect(getPopup()).not.toBeNull();
    });

    it('disabled 时不能打开，取消禁用后可以', async () => {
        const { store, container } = await setup({ props: { type: 'date', disabled: true } });
        await fireEvent.click(container.querySelector(`.${dp}-input`) as HTMLElement);
        await settle();
        expect(store.log).toEqual([]);
        expect(getPopup()).toBeNull();

        store.props.disabled = false;
        await settle();
        await click(getInputs()[0]);
        expect(opens(store)).toEqual(['open true']);
        expect(getPopup()).not.toBeNull();
        await clickOutside();
        expect(opens(store)).toEqual(['open true', 'open false']);
        expect(getContainer()).toBeNull();
    });

    it('dateRange 禁用时点击分隔符不触发聚焦', async () => {
        const { store, container } = await setup({ value: juneRange, props: { type: 'dateRange', disabled: true } });
        await fireEvent.click(container.querySelector(`.${dp}-range-input-separator`) as HTMLElement);
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('focus'))).toEqual([]);
        expect(getPopup()).toBeNull();
    });

    it('insetInput 时禁用的范围触发器仍可清除', async () => {
        const { store } = await setup({ value: juneRange, props: { type: 'dateRange', disabled: true, insetInput: true, showClear: true } });
        getInputs().forEach((input) => expect(input).toBeDisabled());
        await fireEvent.mouseDown(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        await settle();
        expect(store.log.filter((entry) => entry === 'clear')).toHaveLength(1);
    });
});

describe('Svelte DatePicker 范围的 snippet', () => {
    it('prefix 渲染范围前缀', async () => {
        const { container } = await renderSlots({ props: { type: 'dateRange', value: juneRange }, prefix: true });
        expect(container.querySelector(`.${dp}-range-input-prefix .custom-prefix`)).toHaveTextContent('前缀');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('insetLabel 渲染范围前缀', async () => {
        const { container } = await renderSlots({ props: { type: 'dateRange', value: juneRange }, insetLabel: true });
        expect(container.querySelector(`.${dp}-range-input-prefix`)).toHaveTextContent('日期');
        expect(container.querySelector(`.${dp}-range-input-wrapper-start`)).toHaveClass(`${dp}-range-input-wrapper-start-with-prefix`);
    });

    it('clearIcon 替换范围的清除图标', async () => {
        const store = createStore<ClearIconFixtureStore>({ props: { type: 'dateRange', value: juneRange, motion: false, showClear: true } });
        render(ClearIconFixture, { props: { store } });
        await settle();
        const clearButton = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clearButton.querySelector('.custom-clear-icon')).toHaveTextContent('X');
    });
});

describe('Svelte DatePicker 键入', () => {
    it('每次修改范围输入框都报告整个范围', async () => {
        const { store } = await setup({ value: juneRange, open: true, props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await typeText('2021-06-02', startInput);
        await typeText('2021-07-15', endInput);
        expect(changes(store)).toEqual(['change 2021-06-02 00:00:00|2021-06-15 00:00:00 ["2021-06-02","2021-06-15"]', 'change 2021-06-02 00:00:00|2021-07-15 00:00:00 ["2021-06-02","2021-07-15"]']);
    });

    it('dateTimeRange 键入后按 Enter：只报告一次，两个输入框保持文本', async () => {
        const { store } = await setup({ value: dateTimeRange, open: true, props: { type: 'dateTimeRange' } });
        const [startInput, endInput] = getInputs();
        await typeText('2021-06-20 18:00:00', endInput);
        await userEvent.type(endInput, '{Enter}');
        await settle();
        expect(changes(store)).toEqual(['change 2021-06-01 10:00:00|2021-06-20 18:00:00 ["2021-06-01 10:00:00","2021-06-20 18:00:00"]']);
        expect(startInput).toHaveValue('2021-06-01 10:00:00');
        expect(endInput).toHaveValue('2021-06-20 18:00:00');
    });

    it('键入禁用日期不通知，清空不查禁用', async () => {
        const { store } = await setup({ props: { type: 'date', disabledDate: (date) => new Date(date).getDate() === 15 } });
        const input = getInputs()[0];
        await typeText('2021-06-15', input);
        expect(changes(store)).toEqual([]);
        await typeText('2021-06-10', input);
        expect(changes(store)).toHaveLength(1);
        await typeText('', input);
        expect(changes(store)).toHaveLength(2);
    });

    it('键入非法文本不高亮也不通知', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'date' } });
        const input = getInputs()[0];
        await typeText('not-a-date', input);
        expect(getSelectedDays()).toEqual([]);
        expect(changes(store)).toEqual([]);
        expect(input).toHaveValue('not-a-date');
    });

    it('关闭面板时丢弃键入的文本', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date' } });
        const input = getInputs()[0];
        await typeText('2021-06-1', input);
        expect(input).toHaveValue('2021-06-1');
        await clickOutside();
        expect(input).toHaveValue(ymd(baseDate));
    });

    it('输入框失焦不发 onBlur，文本与面板保持', async () => {
        const { store } = await setup({ open: true, props: { type: 'date' } });
        const input = getInputs()[0];
        await typeText('2021-06-1', input);
        await fireEvent.focusOut(input);
        await settle();
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual([]);
        expect(input).toHaveValue('2021-06-1');
        expect(getPopup()).not.toBeNull();
    });

    it('范围输入框失焦既不补全也不重置', async () => {
        const { store } = await setup({ value: juneRange, open: true, props: { type: 'dateRange' } });
        const [startInput] = getInputs();
        await typeText('2021-06-0', startInput);
        await fireEvent.focusOut(startInput);
        await settle();
        expect(startInput).toHaveValue('2021-06-0');
        expect(changes(store)).toEqual([]);
        expect(getPopup()).not.toBeNull();
    });
});

describe('Svelte DatePicker 内嵌输入框', () => {
    it('date 类型没有时间输入框与分隔符', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'date', insetInput: true } });
        const wrapper = (getPopup() as HTMLElement).querySelector(`.${dp}-inset-input-wrapper`) as HTMLElement;
        expect(wrapper).toHaveAttribute('x-type', 'date');
        expect(wrapper.querySelectorAll('input')).toHaveLength(1);
        expect(wrapper.querySelector(`.${dp}-inset-input-separator`)).toBeNull();
    });

    it('自定义 placeholder', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', insetInput: { placeholder: { dateStart: 'Date Start', timeStart: 'Time Start' } } } });
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('Date Start')).toHaveValue('2019-09-08');
        expect(within(getPopup() as HTMLElement).getByPlaceholderText('Time Start')).toHaveValue('08:08:08');
    });

    it('dateRange 使用 compact 密度时分隔符为空', async () => {
        await setup({ value: juneRange, open: true, props: { type: 'dateRange', density: 'compact', insetInput: true } });
        const separator = (getPopup() as HTMLElement).querySelector(`.${dp}-inset-input-separator`);
        expect(separator).not.toBeNull();
        expect(separator?.textContent).toBe('');
    });

    it('dateTimeRange 渲染四个内嵌输入框，没有切换栏', async () => {
        await setup({ value: dateTimeRange, open: true, props: { type: 'dateTimeRange', insetInput: true } });
        const popup = getPopup() as HTMLElement;
        expect(popup.querySelector(`.${dp}-month-grid`)).toHaveAttribute('x-insetinput', 'true');
        expect(popup.querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(4);
        expect(popup.querySelector(`.${dp}-switch`)).toBeNull();
    });

    it('dateTime 键入无法解析的日期不改值', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', insetInput: true } });
        await typeText('2021-06-1', insetInputs('yyyy-MM-dd')[0]);
        expect(changes(store)).toEqual([]);
        expect(getInputs()[0]).toHaveValue('2019-09-08 08:08:08');
    });

    it('dateTimeRange 的日期与时间输入框各自报告整个范围', async () => {
        const { store } = await setup({ value: dateTimeRange, open: true, props: { type: 'dateTimeRange', insetInput: true } });
        await typeText('2021-06-10', insetInputs('yyyy-MM-dd')[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-10 10:00:00|2021-06-15 18:00:00 ["2021-06-10 10:00:00","2021-06-15 18:00:00"]');
        await typeText('11:00:00', insetInputs('HH:mm:ss')[0]);
        expect(changes(store).at(-1)).toBe('change 2021-06-10 11:00:00|2021-06-15 18:00:00 ["2021-06-10 11:00:00","2021-06-15 18:00:00"]');
    });
});

describe('Svelte DatePicker 实例方法', () => {
    it('insetInput 面板打开时 focus 聚焦面板里对应的范围输入框', async () => {
        const { component } = await setup({ value: juneRange, props: { type: 'dateRange', insetInput: true } });
        apiOf(component).focus('rangeEnd');
        await settle();
        apiOf(component).open();
        await settle();
        expect(insetInputs('yyyy-MM-dd')[1]).toHaveFocus();
    });

    it('insetInput 的范围面板关闭后 focus() 聚焦触发框的对应输入框', async () => {
        const { component } = await setup({ props: { type: 'dateRange', insetInput: true } });
        const [startInput, endInput] = getInputs();
        apiOf(component).open();
        await settle();
        expect(startInput).toBeDisabled();
        apiOf(component).close();
        await settle();
        expect(startInput).toBeEnabled();
        apiOf(component).focus();
        expect(startInput).toHaveFocus();
        apiOf(component).focus('rangeEnd');
        expect(endInput).toHaveFocus();
    });

    it('insetInput 的 monthRange 面板关闭时 focus() 聚焦触发框输入框', async () => {
        const { component } = await setup({ props: { type: 'monthRange', insetInput: true } });
        apiOf(component).focus();
        expect(getInputs()[0]).toHaveFocus();
    });
});

describe('Svelte DatePicker bind:value 宿主', () => {
    it('选择日期后写回父级并关闭面板', async () => {
        const { store } = await setup({ mode: 'bind', value: baseDate, open: true, props: { type: 'date' } });
        await click(getDay('2019-09-11'));
        expect(store.value).toEqual(new Date(2019, 8, 11));
        expect(getInputs()[0]).toHaveValue('2019-09-11');
        expect(getContainer()).toBeNull();
    });
});
