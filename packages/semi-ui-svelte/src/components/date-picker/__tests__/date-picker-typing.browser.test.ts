import { waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { clickOutside } from '@test/utils/browser';
import { getNavTitles } from './date-picker-browser-utils';
import { dp, getInput, getInputs, getRoot, getSelectedDays, setup } from './test-utils';

/** Click, then type at the caret. userEvent.type focuses through a selector built from ancestor ids, and the popup's id can start with a digit */
async function typeInto(element: Element, text: string) {
    await userEvent.click(element);
    await userEvent.keyboard(text);
}

describe('Svelte DatePicker 键入完成（浏览器）', () => {
    it('多选：键入日期，清除后再键入多个日期', async () => {
        await setup({ props: { multiple: true, showClear: true } });
        const input = getInput();
        await typeInto(input, '2022-10-10');
        await userEvent.hover(input);
        await userEvent.click(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(input).toHaveValue('');

        await typeInto(input, '2022-10-10,2022-10-11');
        expect(input).toHaveValue('2022-10-10,2022-10-11');
    });

    it('dateRange：先后键入起止日期，Enter 后两个输入框保持键入值', async () => {
        await setup({ value: [new Date(2022, 7, 8), new Date(2022, 7, 9, 12)], props: { type: 'dateRange', showClear: true } });
        const [startInput, endInput] = getInputs();
        await userEvent.fill(startInput, '2022-07-10');
        await userEvent.fill(endInput, '2022-10-11');
        await userEvent.keyboard('{Enter}');
        expect(startInput).toHaveValue('2022-07-10');
        expect(endInput).toHaveValue('2022-10-11');
    });
});

describe('Svelte DatePicker 输入格式（浏览器）', () => {
    it('输入有效日期 + 修改面板选中日期', async () => {
        await setup();
        await userEvent.click(getInput());
        await typeInto(getInput(), '2021-03-15');
        await waitFor(() => expect(getNavTitles()).toContain('2021年 3月'));
        expect(getSelectedDays()).toEqual(['2021-03-15']);
    });

    it('输入开始日期 + 修改面板选中日期', async () => {
        await setup({ props: { type: 'dateRange' } });
        const [, endInput] = getInputs();
        await userEvent.click(endInput);
        await typeInto(endInput, '2021-03-15');
        await waitFor(() => expect(getNavTitles()).toContain('2021年 3月'));
        expect(document.querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2021-03-15');
    });

    it('date 类型输入无效 + 失焦', async () => {
        await setup();
        await userEvent.click(getInput());
        await typeInto(getInput(), '2021-03-15');
        await typeInto(getInput(), '123');
        await clickOutside();
        await waitFor(() => expect(getInput()).toHaveValue('2021-03-15'));
    });

    it('dateRange 输入无效 + 失焦', async () => {
        await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await userEvent.click(startInput);
        await typeInto(startInput, '2021-03-15');
        await userEvent.click(endInput);
        await typeInto(endInput, '2021-05-15');
        await userEvent.click(startInput);
        await typeInto(startInput, 'abc');
        await userEvent.click(endInput);
        await typeInto(endInput, 'abc');
        await clickOutside();
        await waitFor(() => expect(startInput).toHaveValue('2021-03-15'));
        expect(endInput).toHaveValue('2021-05-15');
    });

    it('dateTime 输入无效 + 失焦', async () => {
        await setup({ props: { type: 'dateTime' } });
        await userEvent.click(getInput());
        await typeInto(getInput(), '2021-03-15 00:00:00');
        await userEvent.click(getInput());
        await typeInto(getInput(), 'abc');
        await clickOutside();
        await waitFor(() => expect(getInput()).toHaveValue('2021-03-15 00:00:00'));
    });

    it('仅 date 类型输入无效 + 失焦', async () => {
        await setup();
        await userEvent.click(getInput());
        await typeInto(getInput(), 'abc');
        await clickOutside();
        await waitFor(() => expect(getInput()).toHaveValue(''));
    });

    it('仅 dateRange 输入无效 + 失焦', async () => {
        await setup({ props: { type: 'dateRange' } });
        const [startInput, endInput] = getInputs();
        await userEvent.click(startInput);
        await typeInto(startInput, 'abc');
        await userEvent.click(endInput);
        await typeInto(endInput, '123');
        await clickOutside();
        await waitFor(() => expect(startInput).toHaveValue(''));
        expect(endInput).toHaveValue('');
    });

    it('仅 dateTime 输入无效 + 失焦', async () => {
        await setup({ props: { type: 'dateTime' } });
        await userEvent.click(getInput());
        await typeInto(getInput(), '123');
        await clickOutside();
        await waitFor(() => expect(getInput()).toHaveValue(''));
    });

    it('输入禁用日期 + 修改面板选中日期', async () => {
        await setup({ props: { disabledDate: (date) => date.getDate() === 15 } });
        await userEvent.click(getInput());
        await typeInto(getInput(), '2021-03-15');
        expect(document.querySelector(`.${dp}-day-selected`)).toBeNull();
    });
});
