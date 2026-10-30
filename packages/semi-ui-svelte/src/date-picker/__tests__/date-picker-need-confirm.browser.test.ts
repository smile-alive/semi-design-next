import { waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import { getPopupInputs } from './date-picker-browser-utils';
import { getFooterButtons, getPopup } from './date-picker-dom-utils';
import { dp, getDay, getInput, getInputs, getSelectedDays, setup } from './test-utils';

/** Click, then type at the caret. userEvent.type focuses through a selector built from ancestor ids, and the popup's id can start with a digit */
async function typeInto(element: Element, text: string) {
    await userEvent.click(element);
    await userEvent.keyboard(text);
}

const expectPopupClosed = () => waitFor(() => expect(getPopup()).toBeNull());

describe('Svelte DatePicker needConfirm（浏览器）', () => {
    describe('dateTime 与 dateTimeRange 的确认与取消', () => {
        const setupDateTime = () => setup({ value: '2021-12-27 10:37:13', props: { type: 'dateTime', needConfirm: true } });

        it('dateTime needConfirm 取消', async () => {
            await setupDateTime();
            await userEvent.click(getInput());
            await waitFor(() => expect(getPopup()).not.toBeNull());
            await userEvent.click(getFooterButtons()[0]);
            await expectPopupClosed();
        });

        it('dateTime needConfirm 确认', async () => {
            await setupDateTime();
            await userEvent.click(getInput());
            await userEvent.click(await waitFor(() => getDay('2021-12-15')));
            await userEvent.click(getFooterButtons()[1]);
            await expectPopupClosed();
            expect(getInput()).toHaveValue('2021-12-15 10:37:13');
        });

        it('dateTime needConfirm 选择 + 取消', async () => {
            await setupDateTime();
            await userEvent.click(getInput());
            await userEvent.click(await waitFor(() => getDay('2021-12-15')));
            await userEvent.click(getFooterButtons()[0]);
            await expectPopupClosed();
            expect(getInput()).toHaveValue('2021-12-27 10:37:13');
        });

        it('dateTimeRange needConfirm 取消', async () => {
            await setup({ value: ['2021-12-27 10:37:13', '2022-01-28 10:37:13'], props: { type: 'dateTimeRange', needConfirm: true } });
            await userEvent.click(getInputs()[0]);
            await waitFor(() => expect(getPopup()).not.toBeNull());
            await userEvent.click(getFooterButtons()[0]);
            await expectPopupClosed();
        });
    });

    describe('输入后确认与取消', () => {
        const confirmProps = { format: 'yyyy-MM-dd HH:mm', needConfirm: true };
        const setupDateTime = (insetInput: boolean) => setup({ props: { ...confirmProps, insetInput, type: 'dateTime', defaultPickerValue: '2021-03-15 14:00' } });
        const setupDateTimeRange = (insetInput: boolean) => setup({ props: { ...confirmProps, insetInput, type: 'dateTimeRange', defaultPickerValue: ['2021-01-10 00:01', '2021-03-15 23:59'] } });
        const typeRange = async ([startInput, endInput]: HTMLElement[]) => {
            await userEvent.click(startInput);
            await typeInto(startInput, '2021-03-15 14:00');
            await userEvent.click(endInput);
            await typeInto(endInput, '2021-03-20 23:59');
        };

        it('输入日期 + needConfirm + 取消', async () => {
            await setupDateTime(false);
            await userEvent.click(getInput());
            await typeInto(getInput(), '2021-03-15 14:00');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getInput()).toHaveValue(''));
        });

        it('输入日期 + needConfirm + 确认', async () => {
            await setupDateTime(false);
            await userEvent.click(getInput());
            await typeInto(getInput(), '2021-03-15 14:00');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(getInput()).toHaveValue('2021-03-15 14:00'));
        });

        it('输入日期范围 + needConfirm + 取消', async () => {
            await setupDateTimeRange(false);
            const inputs = getInputs();
            await typeRange(inputs);
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
            expect(inputs[1]).toHaveValue('');
        });

        it('输入日期范围 + needConfirm + 确认', async () => {
            await setupDateTimeRange(false);
            const inputs = getInputs();
            await typeRange(inputs);
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15 14:00'));
            expect(inputs[1]).toHaveValue('2021-03-20 23:59');
        });

        it('输入日期 + needConfirm + 取消（insetInput）', async () => {
            await setupDateTime(true);
            await userEvent.click(getInput());
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getInput()).toHaveValue(''));
        });

        it('输入日期 + needConfirm + 确认（insetInput）', async () => {
            await setupDateTime(true);
            await userEvent.click(getInput());
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(getInput()).toHaveValue('2021-03-15 14:00'));
        });

        it('输入日期范围 + needConfirm + 取消（insetInput）', async () => {
            await setupDateTimeRange(true);
            const inputs = getInputs();
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await typeInto(getPopupInputs()[2], '2021-03-20');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
            expect(inputs[1]).toHaveValue('');
        });

        it('输入日期范围 + needConfirm + 确认（insetInput）', async () => {
            await setupDateTimeRange(true);
            const inputs = getInputs();
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await typeInto(getPopupInputs()[2], '2021-03-20');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15 00:01'));
            expect(inputs[1]).toHaveValue('2021-03-20 23:59');
        });
    });

    it('needConfirm 且输入无效时，取消后重开面板回到上次选中值', async () => {
        await setup({ value: [new Date(2022, 7, 8), new Date(2022, 7, 9, 12)], props: { type: 'dateTimeRange', needConfirm: true } });
        const inputs = getInputs();
        await userEvent.click(inputs[0]);
        await userEvent.fill(inputs[0], '2021-0');
        await userEvent.click(getFooterButtons()[0]);
        await expectPopupClosed();
        await userEvent.click(inputs[0]);
        await waitFor(() => expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`));
        expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
    });

    describe('cachedSelectedValue 在重开面板时的取值', () => {
        const pickers: Record<'date' | 'dateTime' | 'dateRange', Parameters<typeof setup>[0]> = {
            date: { value: new Date(2022, 7, 8), props: { type: 'date' } },
            dateTime: { value: new Date(2022, 7, 8, 19, 11), props: { type: 'dateTime' } },
            dateRange: { value: [new Date(2022, 7, 8), new Date(2022, 7, 9)], props: { type: 'dateRange' } },
        };

        it.each(['date', 'dateTime'] as const)('%s：选择日期后重开面板，选中的是新日期', async (type) => {
            await setup(pickers[type]);
            await userEvent.click(getInput());
            await userEvent.click(await waitFor(() => getDay('2022-08-05')));
            await userEvent.click(getInput());
            await waitFor(() => expect(getSelectedDays()).toEqual(['2022-08-05']));
        });

        it('dateRange：选择两端后重开面板，选中的是新区间', async () => {
            await setup(pickers.dateRange);
            const inputs = getInputs();
            await userEvent.click(inputs[0]);
            await userEvent.click(await waitFor(() => getDay('2022-08-05')));
            await userEvent.click(inputs[1]);
            await userEvent.click(getDay('2022-08-20'));
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getDay('2022-08-05')).toHaveClass(`${dp}-day-selected-start`));
            expect(getDay('2022-08-20')).toHaveClass(`${dp}-day-selected-end`);
        });

        it.each(['date', 'dateTime'] as const)('%s：点击外部关闭后重开面板，选中的仍是原日期', async (type) => {
            await setup(pickers[type]);
            await userEvent.click(getInput());
            await clickOutside();
            await expectPopupClosed();
            await userEvent.click(getInput());
            await waitFor(() => expect(getSelectedDays()).toEqual(['2022-08-08']));
        });

        it('dateRange：点击外部关闭后重开面板，选中的仍是原区间', async () => {
            await setup(pickers.dateRange);
            await userEvent.click(getInputs()[0]);
            await clickOutside();
            await expectPopupClosed();
            await userEvent.click(getInputs()[0]);
            await waitFor(() => expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`));
            expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
        });
    });
});
