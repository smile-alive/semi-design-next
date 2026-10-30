import { waitFor, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { clickOutside } from '@test/utils/browser';
import { focusClass, getPopupInputWrappers, getPopupInputs } from './date-picker-browser-utils';
import { getPanel, getYMLists, getYMSelected } from './date-picker-dom-utils';
import { dp, getContainer, getDay, getInput, getInputs, getRoot, getSelectedDays, setup } from './test-utils';

/** Click, then type at the caret. userEvent.type focuses through a selector built from ancestor ids, and the popup's id can start with a digit */
async function typeInto(element: Element, text: string) {
    await userEvent.click(element);
    await userEvent.keyboard(text);
}

const insetProps = { insetInput: true, defaultPickerValue: '2021-12-01' };

const waitForPopupInputFocus = () =>
    waitFor(() => {
        const [first] = getPopupInputs();
        expect(first).toHaveFocus();
        return first;
    });

describe('Svelte DatePicker insetInput（浏览器）', () => {
    it('insetInput + date', async () => {
        await setup({ props: insetProps });
        await userEvent.click(getInput());
        const insetInput = await waitForPopupInputFocus();
        expect(getPopupInputWrappers()[0]).toHaveClass(focusClass);
        await typeInto(insetInput, '2021-12-15');
        await waitFor(() => expect(getSelectedDays()).toEqual(['2021-12-15']));
        await userEvent.clear(insetInput);
        await typeInto(insetInput, '2021-12-20');
        await waitFor(() => expect(getSelectedDays()).toEqual(['2021-12-20']));
        await userEvent.click(getDay('2021-12-05'));
        await userEvent.click(getInput());
        await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2021-12-05'));
    });

    it('insetInput + month', async () => {
        await setup({ value: '2021-12', props: { ...insetProps, type: 'month', timePickerOpts: { scrollItemProps: { motion: false } } } });
        expect(getInput()).toHaveValue('2021-12');
        await userEvent.click(getInput());
        const insetInput = await waitForPopupInputFocus();
        expect(insetInput).toHaveValue('2021-12');
        await userEvent.fill(insetInput, '2021-11');
        await waitFor(() => expect(getInput()).toHaveValue('2021-11'));
    });

    it('insetInput + monthRange', async () => {
        await setup({
            value: ['2023-03', '2023-04'],
            props: { type: 'monthRange', insetInput: true, format: 'yyyy年MM月', rangeSeparator: '到', style: 'width: 400px' },
        });
        await userEvent.click(getInputs()[0]);
        const insetInput = await waitForPopupInputFocus();
        expect(insetInput).toHaveValue('2023年03月 到 2023年04月');
        await userEvent.clear(insetInput);
        await userEvent.click(within(getYMLists()[2]).getByRole('option', { name: '2025' }));
        await userEvent.click(within(getYMLists()[3]).getByRole('option', { name: '6月' }));
        await waitFor(() => expect(getInputs()[0]).toHaveValue('2023年03月 到 2025年06月'));
    });

    it('insetInput + year', async () => {
        await setup({ value: '2030', props: { type: 'year', insetInput: true } });
        expect(getInput()).toHaveValue('2030');
        await userEvent.click(getInput());
        const insetInput = await waitForPopupInputFocus();
        expect(insetInput).toHaveValue('2030');
        await waitFor(() => {
            const selected = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
            const viewport = selected?.closest(`.${BASE_CLASS_PREFIX}-scrolllist-item`)?.getBoundingClientRect() as DOMRect;
            expect(selected?.getBoundingClientRect().top).toBeGreaterThanOrEqual(viewport.top);
            expect(selected?.getBoundingClientRect().bottom).toBeLessThanOrEqual(viewport.bottom);
        });
        await userEvent.fill(insetInput, '2025');
        await waitFor(() => expect(getInput()).toHaveValue('2025'));
        expect(getYMSelected()).toEqual(['2025年']);
    });

    it('insetInput + dateTime', async () => {
        await setup({ props: { ...insetProps, type: 'dateTime' } });
        await userEvent.click(getInput());
        await userEvent.click(await waitFor(() => getDay('2021-12-05')));
        const [dateInput, timeInput] = getPopupInputs();
        expect(dateInput).toHaveValue('2021-12-05');
        expect(timeInput).toHaveValue('00:00:00');
        await userEvent.click(timeInput);
        await waitFor(() => expect(document.querySelector(`.${dp}-tpk`)).not.toBeNull());
        await userEvent.click(dateInput);
        await waitFor(() => expect(document.querySelector(`.${dp}-navigation`)).not.toBeNull());
    });

    it('insetInput + dateRange', async () => {
        await setup({ props: { ...insetProps, type: 'dateRange' } });
        const inputs = getInputs();
        await userEvent.click(inputs[0]);
        await waitFor(() => expect(getPopupInputWrappers()[0]).toHaveClass(focusClass));
        await userEvent.click(getDay('2021-12-05'));
        await userEvent.click(getDay('2022-01-10'));
        await userEvent.click(inputs[1]);
        await waitFor(() => expect(getPopupInputWrappers()[1]).toHaveClass(focusClass));
        await userEvent.fill(getPopupInputs()[1], '2022-01-20');
        await waitFor(() => expect(getPanel('right').querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2022-01-20'));
        await userEvent.click(getPopupInputWrappers()[0]);
        await userEvent.click(getDay('2021-12-15'));
        await waitFor(() => expect(inputs[0]).toHaveValue('2021-12-15'));
        expect(inputs[1]).toHaveValue('2022-01-20');
    });

    it('insetInput + dateTimeRange', async () => {
        await setup({ props: { ...insetProps, type: 'dateTimeRange' } });
        const inputs = getInputs();
        await userEvent.click(inputs[0]);
        await waitFor(() => expect(getPopupInputWrappers()[0]).toHaveClass(focusClass));
        await userEvent.click(getDay('2021-12-05'));
        await userEvent.click(getDay('2022-01-10'));
        await clickOutside();
        await waitFor(() => expect(getContainer()).toBeNull());
        await userEvent.click(inputs[1]);
        await waitFor(() => expect(getPopupInputWrappers()[2]).toHaveClass(focusClass));
        await userEvent.fill(getPopupInputs()[2], '2022-01-20');
        await waitFor(() => expect(document.querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2022-01-20'));
        await userEvent.click(getPopupInputWrappers()[0]);
        await userEvent.click(getDay('2021-12-15'));
        await clickOutside();
        await waitFor(() => expect(inputs[0]).toHaveValue('2021-12-15 00:00:00'));
        expect(inputs[1]).toHaveValue('2022-01-20 00:00:00');
    });

    it('insetInput + dateTimeRange + 检查点击范围起点', async () => {
        await setup({ props: { ...insetProps, type: 'dateTimeRange' } });
        await userEvent.click(getInputs()[0]);
        await userEvent.click(await waitFor(() => getDay('2022-01-10')));
        expect(getPopupInputs()[0]).toHaveValue('2022-01-10');
        expect(getPopupInputs()[1]).toHaveValue('00:00:00');
        await clickOutside();
        await waitFor(() => expect(getContainer()).toBeNull());
        expect(getInputs()[0]).toHaveValue('');
        expect(getInputs()[1]).toHaveValue('');
    });

    it('insetInput + dateTimeRange + 检查点击范围终点', async () => {
        await setup({ props: { ...insetProps, type: 'dateTimeRange' } });
        await userEvent.click(getInputs()[1]);
        await userEvent.click(await waitFor(() => getDay('2022-01-10')));
        expect(getPopupInputs()[2]).toHaveValue('2022-01-10');
        expect(getPopupInputs()[3]).toHaveValue('00:00:00');
        await clickOutside();
        await waitFor(() => expect(getContainer()).toBeNull());
        expect(getInputs()[0]).toHaveValue('');
        expect(getInputs()[1]).toHaveValue('');
    });

    it('insetInput + 自定义格式', async () => {
        await setup({ props: { ...insetProps, type: 'dateRange', format: 'Pp' } });
        await userEvent.click(getInputs()[0]);
        await userEvent.click(await waitFor(() => getDay('2021-12-05')));
        await userEvent.click(getDay('2022-01-10'));
        await waitFor(() => expect(getInputs()[0]).toHaveValue('21-12-05 上午 12:00'));
        expect(getInputs()[1]).toHaveValue('22-01-10 上午 12:00');
        await waitFor(() => expect(getContainer()).toBeNull());
        await userEvent.click(getInputs()[0]);
        await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2021-12-05'));
        expect(getPopupInputs()[1]).toHaveValue('2022-01-10');
    });

    it.each(['date', 'dateTime', 'dateRange', 'dateTimeRange', 'month'] as const)('insetInput + 触发输入框禁用（%s）：面板打开时禁用，关闭后恢复', async (type) => {
        const disabledClass = `${BASE_CLASS_PREFIX}-input-wrapper-disabled`;
        await setup({ props: { ...insetProps, type } });
        await userEvent.click(getInputs()[0]);
        await waitFor(() => expect(getRoot().querySelector(`.${disabledClass}`)).not.toBeNull());
        await clickOutside();
        await waitFor(() => expect(getRoot().querySelector(`.${disabledClass}`)).toBeNull());
    });
});

describe('Svelte DatePicker 输入时自动补全时间（浏览器）', () => {
    const autoFillProps = { format: 'yyyy-MM-dd HH:mm', insetInput: true };

    it('自动填充时间 + dateTime', async () => {
        await setup({ props: { ...autoFillProps, type: 'dateTime', defaultPickerValue: '2021-03-15 14:00' } });
        await userEvent.click(getInput());
        await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
        await waitFor(() => expect(getPopupInputs()[1]).toHaveValue('14:00'));
    });

    it('自动填充时间无效 + dateTime', async () => {
        await setup({ props: { ...autoFillProps, type: 'dateTime', defaultPickerValue: '2021-03-15 14:00' } });
        await userEvent.click(getInput());
        await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-');
        expect(getPopupInputs()[1]).toHaveValue('');
    });

    it('自动填充时间 + dateTimeRange', async () => {
        await setup({ props: { ...autoFillProps, type: 'dateTimeRange', defaultPickerValue: ['2021-01-10 00:01', '2021-03-15 23:59'] } });
        await userEvent.click(getInput());
        await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-01-01');
        await waitFor(() => expect(getPopupInputs()[1]).toHaveValue('00:01'));
        await typeInto(getPopupInputs()[2], '2021-03-01');
        await waitFor(() => expect(getPopupInputs()[3]).toHaveValue('23:59'));
    });
});

describe('Svelte DatePicker 整段粘贴拆分到 inset 输入框（浏览器）', () => {
    const splitProps = { format: 'yyyy-MM-dd HH:mm:ss', insetInput: true };

    it('拆分首个 inset 输入框 + dateTime', async () => {
        await setup({ props: { ...splitProps, type: 'dateTime' } });
        await userEvent.click(getInput());
        // the whole pasted string must reach the first inset input in one change
        await userEvent.fill(await waitFor(() => getPopupInputs()[0]), '2023-09-05 17:41:36');
        await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2023-09-05'));
        expect(getPopupInputs()[1]).toHaveValue('17:41:36');
        expect(getSelectedDays()).toEqual(['2023-09-05']);
    });

    it('拆分首个 inset 输入框 + dateTimeRange', async () => {
        await setup({ props: { ...splitProps, type: 'dateTimeRange' } });
        await userEvent.click(getInput());
        await userEvent.fill(await waitFor(() => getPopupInputs()[0]), '2023-10-09 16:14:31 ~ 2023-10-13 16:14:31');
        await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2023-10-09'));
        expect(getPopupInputs().map((input) => input.value)).toEqual(['2023-10-09', '16:14:31', '2023-10-13', '16:14:31']);
        expect(getDay('2023-10-09')).toHaveClass(`${dp}-day-selected-start`);
        expect(getDay('2023-10-13')).toHaveClass(`${dp}-day-selected-end`);
    });
});
