import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { addDays } from 'date-fns';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getFooterButtons, getPanel, getPopup, getPopups, getWeekDays, getYMSelected, setupPinned, ymd } from './date-picker-dom-utils';
import NestedFixture, { type NestedFixtureStore } from './date-picker-nested-fixture.svelte';
import { changes, clickOutside, dp, getContainer, getDay, getGrid, getInput, getInputs, getNavTitle, getRoot, opens, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

const logged = (store: { log: string[] }, prefix: string) => store.log.filter((entry) => entry.startsWith(prefix));

describe('Svelte DatePicker 范围的初始值与面板导航', () => {
    it('dateTimeRange 的初始值：起点终点高亮，输入框带时间', async () => {
        await setup({ value: [new Date(2021, 7, 1, 10, 0, 0), new Date(2021, 7, 15, 18, 0, 0)], open: true, props: { type: 'dateTimeRange' } });
        expect(getDay('2021-08-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2021-08-15')).toHaveClass(`${dp}-day-selected-end`);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021-08-01 10:00:00');
        expect(endInput).toHaveValue('2021-08-15 18:00:00');
    });

    it('切换上一月与下一月', async () => {
        await setup({ value: baseDate, open: true });
        expect(getNavTitle('left')).toBe('2019年 9月');

        await click(screen.getByRole('button', { name: zh_CN.DatePicker.prevMonth }));
        expect(getNavTitle('left')).toBe('2019年 8月');

        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.nextMonth }));
        expect(getNavTitle('left')).toBe('2019年 10月');
    });

    it('点击年月文字打开年月选择器', async () => {
        await setup({ value: baseDate, open: true });
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        await click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'year');
        expect(getPopup()?.querySelector(`.${dp}-yam`)).not.toBeNull();
        expect(getYMSelected()).toEqual(['2019年', '9月']);
        expect(getPopup()).not.toBeNull();
    });

    it('stopPropagation 为 false 时，打开年月选择器与返回日期面板的点击仍传到 document 的 click 监听', async () => {
        const onDocumentClick = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('click', onDocumentClick);
        try {
            await setup({ value: baseDate, open: true, props: { stopPropagation: false } });
            await click(getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement);
            expect(onDocumentClick).toHaveBeenCalledTimes(1);
            await click(screen.getByRole('button', { name: zh_CN.DatePicker.selectDate }));
            expect(onDocumentClick).toHaveBeenCalledTimes(2);
            expect(getPanel('left')).toHaveAttribute('x-open-type', 'date');
        } finally {
            document.removeEventListener('click', onDocumentClick);
        }
    });

    it('dateTime 类型显示时间选择器，点选日期不关闭面板', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime' } });
        expect(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime })).toHaveTextContent('08:08:08');

        await click(getDay(ymd(addDays(baseDate, 1))));
        expect(changes(store)).toHaveLength(1);
        expect(getPopup()).not.toBeNull();

        await click(screen.getByRole('button', { name: zh_CN.DatePicker.switchToTime }));
        expect(getPanel('left')).toHaveAttribute('x-open-type', 'time');
        expect(getPopup()?.querySelector(`.${dp}-tpk`)).not.toBeNull();
    });

    it('disabledDate：周末带 disabled 的 class 与 aria-disabled', async () => {
        await setup({ value: baseDate, open: true, props: { disabledDate: (date) => date.getDay() === 0 || date.getDay() === 6 } });

        expect(getDay('2019-09-07')).toHaveClass(`${dp}-day-disabled`);
        expect(getDay('2019-09-07')).toHaveAttribute('aria-disabled', 'true');
        expect(getDay('2019-09-09')).not.toHaveClass(`${dp}-day-disabled`);
        expect(getPopup()?.querySelectorAll(`.${dp}-day-disabled`)).toHaveLength(9);
    });
});

describe('Svelte DatePicker 面板的关闭与回调', () => {
    it('点击外部关闭面板时，onBlur 与 onClickOutSide 收到原生 mousedown 事件', async () => {
        const onClickOutSide = vi.fn<(event: MouseEvent) => void>();
        const { store } = await setup({ value: baseDate, open: true, props: { onClickOutSide } });
        await clickOutside();

        expect(logged(store, 'blur')).toEqual(['blur mousedown']);
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        const [outsideEvent] = onClickOutSide.mock.calls[0];
        expect(outsideEvent).toBeInstanceOf(MouseEvent);
        expect(outsideEvent.type).toBe('mousedown');
        expect(getContainer()).toBeNull();
    });

    it('在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        const store = createStore<NestedFixtureStore>({ nested: 'popover', open: true });
        render(NestedFixture, { props: { store } });
        await settle();

        await fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        await settle();
        await fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        await settle();
        expect(getPopup()).not.toBeNull();
        await clickOutside();
        expect(getContainer()).toBeNull();
    });

    it('面板内 TimePicker 设 stopPropagation 为 false 时，在它的面板内按下鼠标不关闭 DatePicker', async () => {
        const store = createStore<NestedFixtureStore>({ nested: 'time-picker', open: true });
        render(NestedFixture, { props: { store } });
        await settle();

        const timePanel = document.querySelector(`.${BASE_CLASS_PREFIX}-timepicker-panel`) as HTMLElement;
        expect(timePanel).not.toBeNull();
        await fireEvent.mouseDown(timePanel);
        await settle();
        expect(getPopup()).not.toBeNull();
        await clickOutside();
        expect(getContainer()).toBeNull();
    });

    it('Esc 关闭面板时 onBlur 没有事件参数', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 11), open: true });
        getGrid().focus();
        await userEvent.keyboard('{Escape}');
        await settle();

        expect(getContainer()).toBeNull();
        expect(logged(store, 'blur')).toEqual(['blur none']);
    });

    it('选中日期关闭面板时 onBlur 没有事件参数', async () => {
        const { store } = await setup({ value: new Date(2019, 8, 11), open: true });
        await click(getDay('2019-09-12'));

        expect(getContainer()).toBeNull();
        expect(logged(store, 'blur')).toEqual(['blur none']);
    });

    it('点击清除按钮：onClear 与 onChange 各一次，输入框清空', async () => {
        const { store } = await setup({ value: baseDate });

        await fireEvent.mouseDown(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(logged(store, 'clear')).toHaveLength(1);
        expect(changes(store)).toEqual(['change undefined undefined']);
        expect(getInput()).toHaveValue('');
    });

    it('density 为 compact 时面板带 compact 的 class', async () => {
        await setup({ value: baseDate, open: true, props: { density: 'compact' } });
        expect(getPopup()).toHaveClass(`${dp}-compact`);
    });

    it('needConfirm 的取消按钮：onCancel 带回原值，面板关闭', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', needConfirm: true } });

        await click(getFooterButtons()[0]);
        expect(logged(store, 'cancel')).toEqual(['cancel 2019-09-08 08:08:08']);
        expect(getContainer()).toBeNull();
    });

    it('needConfirm 的确认按钮：onConfirm 带当前值，不触发 onCancel', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', needConfirm: true } });

        const [cancelButton, confirmButton] = getFooterButtons();
        expect(cancelButton).toHaveTextContent('取消');
        expect(confirmButton).toHaveTextContent('确定');
        await click(confirmButton);
        expect(logged(store, 'cancel')).toEqual([]);
        expect(logged(store, 'confirm')).toEqual(['confirm 2019-09-08 08:08:08']);
        expect(getContainer()).toBeNull();
    });

    it('dateTimeRange 的 needConfirm：两个按钮可用，确认报两端的字符串', async () => {
        const { store } = await setup({
            value: [new Date(2021, 7, 1, 10, 0), new Date(2021, 7, 15, 18, 0)],
            open: true,
            props: { type: 'dateTimeRange', needConfirm: true },
        });
        const [cancelButton, confirmButton] = getFooterButtons();
        expect(cancelButton).toBeEnabled();
        expect(confirmButton).toBeEnabled();
        await click(confirmButton);
        expect(logged(store, 'confirm')).toEqual(['confirm 2021-08-01 10:00:00|2021-08-15 18:00:00']);
        expect(logged(store, 'cancel')).toEqual([]);
    });

    it('父级把 open 改为 true 时展开，改回 false 时关闭，且不触发 onOpenChange', async () => {
        const { store } = await setup({ value: baseDate, open: false });
        expect(getPopup()).toBeNull();

        store.open = true;
        await settle();
        expect(getPopups()).toHaveLength(1);

        store.open = false;
        await settle();
        expect(getContainer()).toBeNull();
        expect(opens(store)).toEqual([]);
    });

    it('onChange 的参数为 (date, dateString)', async () => {
        const { store } = await setupPinned({ props: { defaultPickerValue: '2021-08-01' } });

        await click(getWeekDays('left', 1)[0]);
        expect(changes(store)).toEqual(['change 2021-08-08 00:00:00 "2021-08-08"']);
    });
});

describe('Svelte DatePicker trigger snippet', () => {
    it('trigger 替换输入框，点击后展开面板', async () => {
        await setup({ trigger: 'button' });
        expect(getRoot().querySelector('.custom-trigger')).not.toBeNull();
        expect(getRoot().querySelector('input')).toBeNull();

        await click(getRoot().querySelector('.custom-trigger') as HTMLElement);
        expect(getPopup()).not.toBeNull();
    });

    it('dateRange 的 trigger 替换两个范围输入框', async () => {
        await setup({ trigger: 'button', props: { type: 'dateRange' } });
        expect(getRoot().querySelector('.custom-trigger')).not.toBeNull();
        expect(getRoot().querySelector(`.${dp}-range-input`)).toBeNull();
        expect(getRoot().querySelector('input')).toBeNull();
    });
});
