import { fireEvent, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getFooterButtons, getPopups, getPresetButtons, setupPinned, ymd } from './date-picker-dom-utils';
import SlotsFixture, { type SlotsFixtureStore } from './date-picker-slots-fixture.svelte';
import { changes, clickOutside, dp, getContainer, getDay, getInput, getRoot, getSelectedDays, getTrigger, opens, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

describe('Svelte DatePicker 基础外观与展开', () => {
    it('外观：只有一个根元素，带可清除的输入框', async () => {
        await setup({ value: new Date() });
        expect(document.querySelectorAll(`.${dp}`)).toHaveLength(1);
        expect(getRoot().querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper-clearable`)).toHaveLength(1);
    });

    it('open 为 true 的首帧展开，点击外部后关闭', async () => {
        const { store } = await setup({ value: new Date(), open: true });
        expect(getPopups()).toHaveLength(1);
        await clickOutside();
        expect(getContainer()).toBeNull();
        expect(store.open).toBe(true);
    });

    it('受控 open：点击外部不关闭，父级把 open 改为 false 才关闭', async () => {
        const { store } = await setupPinned({ value: new Date() });
        expect(getPopups()).toHaveLength(1);

        await userEvent.click(document.body);
        await settle();
        expect(getPopups()).toHaveLength(1);
        expect(store.log).toContain('set open false');

        store.open = false;
        await settle();
        expect(getContainer()).toBeNull();
    });

    it('事件：点击外部不触发 onOpenChange，点击触发器报 true，键入合法日期触发一次 onChange', async () => {
        const { store } = await setup({ value: new Date(baseDate), props: { type: 'dateTime', needConfirm: true } });

        await userEvent.click(document.body);
        await settle();
        expect(opens(store)).toEqual([]);

        await click(getTrigger());
        expect(opens(store)).toEqual(['open true']);

        await typeText('2019-10-02 08:30:02');
        expect(changes(store)).toEqual(['change 2019-10-02 08:30:02 "2019-10-02 08:30:02"']);
    });
});

describe('Svelte DatePicker 预设', () => {
    const presets = [
        { text: 'Today', start: new Date(baseDate), end: new Date(baseDate) },
        { text: 'Next Day', start: addDays(new Date(baseDate), 1), end: addDays(new Date(baseDate), 1) },
    ];

    it('presets：点击预设写入输入框并选中对应日期', async () => {
        const defaultValue = addDays(new Date(baseDate), -1);
        await setupPinned({ value: defaultValue, props: { presets } });
        const buttons = getPresetButtons();

        await click(buttons[1]);
        expect(getInput()).toHaveValue(ymd(addDays(defaultValue, 2)));
        expect(getSelectedDays()).toEqual([ymd(addDays(defaultValue, 2))]);

        await click(buttons[0]);
        expect(getInput()).toHaveValue(ymd(baseDate));
        expect(getSelectedDays()).toEqual([ymd(baseDate)]);
    });

    it('presetClick：每点击一个预设回调一次，参数是对应的预设项', async () => {
        const { store } = await setupPinned({ value: addDays(new Date(baseDate), -1), props: { presets } });

        const buttons = getPresetButtons();
        await click(buttons[0]);
        await click(buttons[1]);
        expect(store.log.filter((entry) => entry.startsWith('preset'))).toEqual(['preset Today', 'preset Next Day']);
    });
});

describe('Svelte DatePicker 值与确认', () => {
    it('value：选中日期后 onChange 一次，面板选中态与输入框一致', async () => {
        const currentValue = new Date(baseDate);
        const { store } = await setupPinned({ value: currentValue });
        expect(getSelectedDays()).toEqual([ymd(currentValue)]);

        await click(getDay(ymd(addDays(currentValue, 3))));
        expect(changes(store)).toEqual(['change 2019-09-11 00:00:00 "2019-09-11"']);
        expect(getSelectedDays()).toEqual([ymd(addDays(currentValue, 3))]);
        expect(getInput()).toHaveValue(ymd(addDays(currentValue, 3)));
    });

    it('needConfirm：选日期不提交，取消恢复，确认才触发 onConfirm', async () => {
        const currentValue = new Date(baseDate);
        const nextDay = addDays(currentValue, 3);
        const valueFormat = strings.FORMAT_DATE_TIME;
        const { store } = await setupPinned({ value: currentValue, props: { type: 'dateTime', needConfirm: true } });
        const buttons = getFooterButtons();
        expect(buttons).toHaveLength(2);

        await click(getDay(ymd(nextDay)));
        expect(getSelectedDays()).toEqual([ymd(nextDay)]);
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual([]);

        await click(buttons[0]);
        expect(getInput()).toHaveValue(format(currentValue, valueFormat));
        expect(getSelectedDays()).toEqual([ymd(currentValue)]);

        await click(buttons[1]);
        expect(getInput()).toHaveValue(format(currentValue, valueFormat));
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual([`confirm ${format(currentValue, 'yyyy-MM-dd HH:mm:ss')}`]);

        await click(getDay(ymd(nextDay)));
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toHaveLength(1);

        await click(buttons[1]);
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual([`confirm ${format(currentValue, 'yyyy-MM-dd HH:mm:ss')}`, `confirm ${format(nextDay, 'yyyy-MM-dd HH:mm:ss')}`]);
        expect(getInput()).toHaveValue(format(nextDay, valueFormat));
    });
});

describe('Svelte DatePicker 外观属性', () => {
    it('clear：点击清除按钮触发一次 onClear', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { autofocus: true, showClear: true } });
        const clearButton = getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement;
        await fireEvent.mouseDown(clearButton, { button: 0 });
        await settle();
        expect(store.log.filter((entry) => entry === 'clear')).toHaveLength(1);
    });

    it('disabled：输入框禁用并带 disabled 样式', async () => {
        await setup({ value: baseDate, props: { disabled: true } });
        expect(getInput()).toBeDisabled();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
    });

    it('placeholder', async () => {
        await setup({ props: { placeholder: '请选择日期' } });
        expect(getInput()).toHaveAttribute('placeholder', '请选择日期');
    });

    it('borderless、validateStatus、size 落在输入框外壳的 class 上', async () => {
        await setup({ value: baseDate, props: { borderless: true, validateStatus: 'error', size: 'small' } });
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
    });

    it('prefix 与 insetLabel snippet', async () => {
        const store = createStore<SlotsFixtureStore>({ props: { motion: false }, prefix: true });
        render(SlotsFixture, { props: { store } });
        await settle();
        expect(getRoot().querySelector('.custom-prefix')).toHaveTextContent('前缀');
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).toBeNull();

        store.prefix = false;
        store.insetLabel = true;
        await settle();
        expect(getRoot().querySelector('.custom-prefix')).toBeNull();
        expect(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).toHaveTextContent('日期');
    });

    it('dropdownClassName 与 dropdownStyle 落在面板上', async () => {
        await setup({ open: true, props: { dropdownClassName: 'my-datePicker', dropdownStyle: 'color: red' } });
        const dropdown = document.querySelector('.my-datePicker');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('trigger snippet 的范围 placeholder 取自语言包且不改写它', async () => {
        const before = [...zh_CN.DatePicker.placeholder.dateRange];
        await setup({ trigger: 'button', props: { type: 'dateRange' } });
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(before.join(','));
        expect(zh_CN.DatePicker.placeholder.dateRange).toEqual(before);
    });
});
