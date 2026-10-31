import { within } from '@testing-library/svelte';
import { addDays, format } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import { click, getPopup, getPresetButtons, getYMLists, getYMSelected, nextSibling, setupPinned, ymd } from './date-picker-dom-utils';
import { changes, dp, getContainer, getDay, getInput, getInputs, getRoot, getSelectedDays, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);

describe('Svelte DatePicker 输入与禁用日期', () => {
    it('输入被 disabledDate 禁用的日期不触发 onChange，输入可用日期才触发', async () => {
        const { store } = await setup({ value: '2021-04-12', open: true, props: { disabledDate: (date) => new Date(date).getDate() === 15 } });
        await typeText('2021-04-15');
        expect(changes(store)).toEqual([]);
        await typeText('2021-04-13');
        expect(changes(store)).toEqual(['change 2021-04-13 00:00:00 "2021-04-13"']);
    });

    it('点击预设里被禁用的日期不改变值，可用日期才触发 onChange', async () => {
        const defaultValue = '2021-04-12';
        const { store } = await setupPinned({
            value: defaultValue,
            props: {
                disabledDate: (date) => date.getDate() === 15,
                presets: [
                    { text: 'disabled date', start: new Date('2021-04-15 00:00:00') },
                    { text: 'valid date', start: '2021-04-30' },
                ],
            },
        });
        const buttons = getPresetButtons();

        await click(buttons[0]);
        expect(getInput()).toHaveValue(defaultValue);
        expect(getSelectedDays()).toEqual([defaultValue]);
        expect(changes(store)).toEqual([]);

        await click(buttons[1]);
        expect(getInput()).toHaveValue('2021-04-30');
        expect(changes(store)).toEqual(['change 2021-04-30 00:00:00 "2021-04-30"']);
    });

    it('输入年份超过 4 位不触发 onChange', async () => {
        const { store } = await setup({ value: '2021-12-21', open: true });
        await typeText('20221-12-21');
        expect(changes(store)).toEqual([]);
    });
});

describe('Svelte DatePicker format 与 type 的降级', () => {
    it('format 不含时间标记时，dateTime 降级为 date', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', format: 'yyyy-MM-dd' } });
        expect(getPopup()).toHaveAttribute('x-type', 'date');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        expect(getInput()).toHaveValue(ymd(baseDate));
        await click(getDay(ymd(addDays(baseDate, 1))));
        expect(changes(store)).toHaveLength(1);
        expect(getContainer()).toBeNull();
    });

    it('format 不含时间标记时，dateTimeRange 降级为 dateRange', async () => {
        await setup({ value: [new Date(baseDate), addDays(new Date(baseDate), 5)], open: true, props: { type: 'dateTimeRange', format: 'yyyy-MM-dd' } });
        expect(getPopup()).toHaveAttribute('x-type', 'dateRange');
        expect(getPopup()?.querySelector(`.${dp}-switch`)).toBeNull();
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue(ymd(baseDate));
        expect(endInput).toHaveValue(ymd(addDays(baseDate, 5)));
    });

    it('format 含时间标记时保留 dateTime 类型', async () => {
        await setup({ value: baseDate, open: true, props: { type: 'dateTime', format: 'yyyy-MM-dd HH:mm' } });
        expect(getPopup()).toHaveAttribute('x-type', 'dateTime');
        expect(getPopup()?.querySelector(`.${dp}-switch-time`)).not.toBeNull();
        expect(getInput()).toHaveValue(format(baseDate, 'yyyy-MM-dd HH:mm'));
    });
});

describe('Svelte DatePicker 年月类型', () => {
    it('month：面板是年、月两列', async () => {
        await setup({ open: true, props: { type: 'month' } });
        expect(getPopup()).toHaveAttribute('x-type', 'month');
        expect(getYMLists()).toHaveLength(2);
    });

    it('monthRange：面板是两组年、月列', async () => {
        await setup({ open: true, props: { type: 'monthRange' } });
        expect(getPopup()).toHaveAttribute('x-type', 'monthRange');
        expect(getYMLists()).toHaveLength(4);
    });

    it('选年份再选月份：onChange 报最后一次选择，输入框显示年月', async () => {
        const monOffset = 2;
        const yearOffset = 3;
        const { store } = await setup({ value: new Date(baseDate), open: true, props: { type: 'month' } });

        const yearList = getYMLists()[0];
        await click(nextSibling(yearList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element, yearOffset));
        const monthList = getYMLists()[1];
        await click(nextSibling(monthList.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`) as Element, monOffset));

        expect(changes(store).at(-1)).toBe('change 2022-11-01 00:00:00 "2022-11"');
        expect(getInput()).toHaveValue(format(new Date(2019 + yearOffset, 8 + monOffset), 'yyyy-MM'));
    });

    it('month 的初始值高亮对应年月，点击月份后提交', async () => {
        const { store } = await setup({ value: new Date(2021, 5), open: true, props: { type: 'month' } });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        await click(within(getYMLists()[1]).getByRole('option', { name: '3月' }));
        expect(changes(store)).toEqual(['change 2021-03-01 00:00:00 "2021-03"']);
        expect(getYMSelected()).toEqual(['2021年', '3月']);
        expect(getInput()).toHaveValue('2021-03');
    });
});

describe('Svelte DatePicker insetInput 与位置', () => {
    const placementOf = () => getContainer()?.closest('[x-placement]');

    it('insetInput 默认把面板放在触发器上方的内联位置', async () => {
        await setup({ value: baseDate, open: true, props: { insetInput: true } });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        expect(placementOf()).toHaveAttribute('x-placement', strings.POSITION_INLINE_INPUT);
    });

    it.each(['leftTopOver', 'bottomLeft'] as const)('position 为 %s 时 insetInput 仍在面板内，位置按传入值', async (position) => {
        await setup({ value: baseDate, open: true, props: { insetInput: true, position } });
        expect(getPopup()?.querySelector(`.${dp}-inset-input-wrapper`)).not.toBeNull();
        // the 1px spacing of an Over position only shifts the computed offset, which jsdom does not lay out
        expect(placementOf()).toHaveAttribute('x-placement', position);
    });
});

describe('Svelte DatePicker autofocus', () => {
    it('autofocus 为 true 时输入框获焦', async () => {
        await setup({ props: { autofocus: true } });
        expect(getRoot().querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(1);
        expect(getInput()).toHaveFocus();
    });

    it('autofocus 为 false 时输入框不获焦', async () => {
        await setup({ props: { autofocus: false } });
        expect(getRoot().querySelectorAll(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).toHaveLength(0);
        expect(getInput()).not.toHaveFocus();
    });
});
