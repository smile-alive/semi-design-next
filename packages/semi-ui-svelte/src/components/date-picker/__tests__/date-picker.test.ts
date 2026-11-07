import { fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { changes, clickDay, clickOutside, clickTrigger, dp, getContainer, getDay, getInput, getRoot, getSelectedDays, getTrigger, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

describe('Svelte DatePicker 受控 value（四种写法）', () => {
    it('不传：点选日期在本地生效，onChange 收到 (date, dateString)', async () => {
        const { store } = await setup({ open: true });
        await clickDay('2019-08-10');
        expect(getInput()).toHaveValue('2019-08-10');
        expect(getContainer()).toBeNull();
        await clickTrigger();
        expect(getSelectedDays()).toEqual(['2019-08-10']);
        await clickDay('2019-08-12');
        expect(getInput()).toHaveValue('2019-08-12');
        expect(changes(store)).toEqual(['change 2019-08-10 00:00:00 "2019-08-10"', 'change 2019-08-12 00:00:00 "2019-08-12"']);
    });

    it('bind:value：选择写回父级，父级改值同步到输入框，重置为 undefined 后清空', async () => {
        const { store } = await setup({ mode: 'bind', value: '2019-08-10', open: true });
        expect(getSelectedDays()).toEqual(['2019-08-10']);
        await clickDay('2019-08-12');
        expect(store.value).toBeInstanceOf(Date);
        expect(getInput()).toHaveValue('2019-08-12');
        store.value = new Date(2019, 7, 20);
        await settle();
        expect(getInput()).toHaveValue('2019-08-20');
        await clickTrigger();
        expect(getSelectedDays()).toEqual(['2019-08-20']);
        store.value = undefined;
        await settle();
        expect(getInput()).toHaveValue('');
        expect(getSelectedDays()).toEqual([]);
    });

    it('函数绑定：setter 拒绝时输入框与面板保持原值', async () => {
        const { store } = await setup({ mode: 'function', value: '2019-08-10', open: true, accept: false });
        await clickDay('2019-08-12');
        expect(store.log).toContain('set 2019-08-12 00:00:00');
        expect(changes(store)).toEqual(['change 2019-08-12 00:00:00 "2019-08-12"']);
        expect(getInput()).toHaveValue('2019-08-10');
        expect(store.value).toBe('2019-08-10');
    });

    it('单向传值：作初值，交互在本地覆盖，父级再推新值时以父级为准', async () => {
        const { store } = await setup({ value: '2019-08-10', open: true });
        expect(getInput()).toHaveValue('2019-08-10');
        await clickDay('2019-08-12');
        expect(getInput()).toHaveValue('2019-08-12');
        expect(store.value).toBe('2019-08-10');
        store.value = '2019-08-01';
        await settle();
        expect(getInput()).toHaveValue('2019-08-01');
    });

    it('value 为 null 是受控空值，时间戳是有效值', async () => {
        const { store } = await setup({ value: null });
        expect(getInput()).toHaveValue('');
        store.value = new Date(2021, 5, 1).getTime();
        await settle();
        expect(getInput()).toHaveValue('2021-06-01');
    });
});

describe('Svelte DatePicker 受控 open', () => {
    it('bind:open：打开与关闭都写回父级', async () => {
        const { store } = await setup({ target: 'open', mode: 'bind' });
        await clickTrigger();
        expect(store.open).toBe(true);
        expect(getContainer()).not.toBeNull();
        await clickOutside();
        expect(store.open).toBe(false);
        expect(getContainer()).toBeNull();
        store.open = true;
        await settle();
        expect(getContainer()).not.toBeNull();
    });
});

describe('Svelte DatePicker 范围', () => {
    it('dateRange 的 aria-label 落在 group 根元素', async () => {
        await setup({ props: { type: 'dateRange', 'aria-label': '出行日期' } });
        expect(getRoot()).toHaveAttribute('role', 'group');
        expect(getRoot()).toHaveAttribute('aria-label', '出行日期');
    });
});

describe('Svelte DatePicker dateTime 与 needConfirm', () => {
    it('bind:value 只在确认时写回父级，取消不写回', async () => {
        const { store } = await setup({ mode: 'bind', value: new Date(2019, 7, 10, 8, 0, 0), open: true, props: { type: 'dateTime', needConfirm: true } });
        const footerButtons = () => Array.from(document.querySelectorAll<HTMLElement>(`.${dp}-footer button`));
        await clickDay('2019-08-12');
        expect(changes(store)).toHaveLength(1);
        expect(store.value).toEqual(new Date(2019, 7, 10, 8, 0, 0));
        await fireEvent.click(footerButtons()[1]);
        await settle();
        expect(store.value).toEqual(new Date(2019, 7, 12, 8, 0, 0));
        expect(getInput()).toHaveValue('2019-08-12 08:00:00');
    });

    it('切换到时间面板显示时间列', async () => {
        await setup({ value: new Date(2019, 7, 10, 8, 30, 0), open: true, props: { type: 'dateTime' } });
        await fireEvent.click(document.querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement);
        await settle();
        expect(document.querySelector(`.${dp}-tpk`)).not.toBeNull();
        expect(document.querySelectorAll(`.${dp}-tpk .${BASE_CLASS_PREFIX}-scrolllist-item`)).toHaveLength(3);
    });
});

describe('Svelte DatePicker insetInput', () => {
    it('面板内显示日期输入框，键入后提交值', async () => {
        const { store } = await setup({ open: true, props: { insetInput: true } });
        const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(getInput()).toHaveAttribute('readonly');
        await typeText('2019-08-21', insetInputs[0]);
        expect(changes(store)).toEqual(['change 2019-08-21 00:00:00 "2019-08-21"']);
        expect(getSelectedDays()).toEqual(['2019-08-21']);
    });
});

describe('Svelte DatePicker snippet 与透传', () => {
    it('date、fullDate、topSlot、bottomSlot snippet', async () => {
        await setup({ open: true, date: true, slots: true });
        expect(getDay('2019-08-10').querySelector('.custom-date')).toHaveTextContent('d10');
        expect(document.querySelector('[x-semi-prop="topSlot"] .custom-top')).not.toBeNull();
        expect(document.querySelector('[x-semi-prop="bottomSlot"] .custom-bottom')).not.toBeNull();
    });

    it('trigger snippet 的按钮是焦点目标，点击打开面板，选择后显示新值', async () => {
        const { store } = await setup({ trigger: 'button', props: { type: 'date' } });
        const button = getRoot().querySelector('.custom-trigger') as HTMLElement;
        expect(button).toHaveAttribute('data-type', 'date');
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
        await fireEvent.click(button);
        await settle();
        expect(getContainer()).not.toBeNull();
        await clickDay('2019-08-10');
        expect(button).toHaveTextContent('2019-08-10');
        expect(changes(store)).toHaveLength(1);
    });

    it('输入框的可访问名称与 placeholder 来自语言包', async () => {
        await setup();
        expect(getInput()).toHaveAttribute('aria-label', zh_CN.DatePicker.chooseDate);
        expect(getInput()).toHaveAttribute('placeholder', zh_CN.DatePicker.placeholder.date as string);
        expect(getInput()).toHaveAttribute('aria-haspopup', 'dialog');
    });
});
