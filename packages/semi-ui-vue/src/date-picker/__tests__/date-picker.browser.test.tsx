/** @jsxImportSource vue */
import { ref, type VNodeChild } from 'vue';
import { screen, waitFor, within } from '@testing-library/vue';
import { addDays } from 'date-fns';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import scrollListCss from '@fibrae/semi-foundation/scroll-list/scroll-list.scss?inline';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import DatePicker, { type DatePickerDisabledDateType, type DatePickerEmits, type DatePickerHandle, type DatePickerProps } from '..';
import Button from '../../button';

type EmitFn<K extends keyof DatePickerEmits> = (...args: DatePickerEmits[K]) => void;
type Slots = Record<string, (scope: Record<string, unknown>) => unknown>;

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const popover = `.${BASE_CLASS_PREFIX}-popover`;

const getPopup = () => document.querySelector<HTMLElement>(`${popover} .${dp}`);
// day cells carry their full date (yyyy-MM-dd) as aria-label, so `contains('5')` style lookups stay unambiguous
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day-selected`)).map((d) => d.getAttribute('aria-label'));
const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
const getNavTitles = () => Array.from(document.querySelectorAll(`.${dp}-navigation-month`)).map((el) => el.textContent);
const getPopupInputs = () => document.querySelectorAll<HTMLInputElement>(`${popover} .${BASE_CLASS_PREFIX}-input`);
const getPopupInputWrappers = () => document.querySelectorAll(`${popover} .${BASE_CLASS_PREFIX}-input-wrapper`);
// year/month scroll lists in DOM order: [year, month] per panel (left first)
const getYMLists = () => document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
const getYMSelected = () => Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((li) => li.textContent);

// A click target above the picker that the popup never covers, for blurring or closing the picker
const withOutside = (...children: VNodeChild[]) => (
    <div>
        <div style={{ height: '40px' }} data-testid="outside">
            outside
        </div>
        {children}
    </div>
);
const clickOutside = () => userEvent.click(screen.getByTestId('outside'));

// Like cy.type: click, then type at the caret. userEvent.type focuses through a CSS selector built from ancestor ids,
// and the popup's random id can start with a digit, which is not a valid selector
const typeInto = async (element: Element, text: string) => {
    await userEvent.click(element);
    await userEvent.keyboard(text);
};

const renderPicker = (props: Record<string, unknown> = {}, slots: Slots = {}) => {
    const utils = render(() =>
        withOutside(
            <DatePicker motion={false} {...props}>
                {slots as never}
            </DatePicker>
        )
    );
    return { ...utils, inputs: utils.container.querySelectorAll('input') };
};

describe('DatePicker', () => {
    describe('FixNeedConfirm', () => {
        const renderDateTime = () => renderPicker({ type: 'dateTime', needConfirm: true, defaultValue: '2021-12-27 10:37:13' }).inputs[0];

        it('dateTime needConfirm 取消', async () => {
            await userEvent.click(renderDateTime());
            await waitFor(() => expect(getPopup()).not.toBeNull());
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getPopup()).toBeNull());
        });

        it('dateTime needConfirm 确认', async () => {
            const input = renderDateTime();
            await userEvent.click(input);
            await userEvent.click(await waitFor(() => getDay('2021-12-15')));
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(input).toHaveValue('2021-12-15 10:37:13');
        });

        it('dateTime needConfirm 选择 + 取消', async () => {
            const input = renderDateTime();
            await userEvent.click(input);
            await userEvent.click(await waitFor(() => getDay('2021-12-15')));
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(input).toHaveValue('2021-12-27 10:37:13');
        });

        it('dateTimeRange needConfirm 取消', async () => {
            const { inputs } = renderPicker({
                type: 'dateTimeRange',
                needConfirm: true,
                defaultValue: ['2021-12-27 10:37:13', '2022-01-28 10:37:13'],
            });
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getPopup()).not.toBeNull());
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(getPopup()).toBeNull());
        });
    });

    describe('InsetInputE2E', () => {
        const insetProps = { insetInput: true, defaultPickerValue: '2021-12-01' };

        it('insetInput + date', async () => {
            const { inputs } = renderPicker(insetProps);
            await userEvent.click(inputs[0]);
            const insetInput = await waitFor(() => {
                const [first] = getPopupInputs();
                expect(first).toHaveFocus();
                return first;
            });
            expect(getPopupInputWrappers()[0]).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-focus`);
            await typeInto(insetInput, '2021-12-15');
            await waitFor(() => expect(getSelectedDays()).toEqual(['2021-12-15']));
            await userEvent.clear(insetInput);
            await typeInto(insetInput, '2021-12-20');
            await waitFor(() => expect(getSelectedDays()).toEqual(['2021-12-20']));
            await userEvent.click(getDay('2021-12-05'));
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2021-12-05'));
        });

        it('insetInput + month', async () => {
            const { inputs } = renderPicker({
                ...insetProps,
                type: 'month',
                defaultValue: '2021-12',
                timePickerOpts: { scrollItemProps: { motion: false } },
            });
            // The foundation reads defaultValue on mount, which changes the input's accessible name that the click targets
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-12'));
            await userEvent.click(inputs[0]);
            const insetInput = await waitFor(() => {
                const [first] = getPopupInputs();
                expect(first).toHaveFocus();
                return first;
            });
            expect(insetInput).toHaveValue('2021-12');
            await userEvent.fill(insetInput, '2021-11');
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-11'));
        });

        it('insetInput + monthRange', async () => {
            const { inputs } = renderPicker({
                type: 'monthRange',
                insetInput: true,
                format: 'yyyy年MM月',
                rangeSeparator: '到',
                defaultValue: ['2023-03', '2023-04'],
                style: { width: '400px' },
            });
            await userEvent.click(inputs[0]);
            const insetInput = await waitFor(() => {
                const [first] = getPopupInputs();
                expect(first).toHaveFocus();
                return first;
            });
            expect(insetInput).toHaveValue('2023年03月 到 2023年04月');
            await userEvent.clear(insetInput);
            await userEvent.click(within(getYMLists()[2]).getByRole('option', { name: '2025' }));
            await userEvent.click(within(getYMLists()[3]).getByRole('option', { name: '6月' }));
            await waitFor(() => expect(inputs[0]).toHaveValue('2023年03月 到 2025年06月'));
        });

        it('insetInput + year', async () => {
            const { inputs } = renderPicker({ type: 'year', insetInput: true, defaultValue: '2030' });
            // The foundation reads defaultValue on mount, which changes the input's accessible name that the click targets
            await waitFor(() => expect(inputs[0]).toHaveValue('2030'));
            await userEvent.click(inputs[0]);
            const insetInput = await waitFor(() => {
                const [first] = getPopupInputs();
                expect(first).toHaveFocus();
                return first;
            });
            expect(insetInput).toHaveValue('2030');
            await waitFor(() => {
                const selected = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
                const viewport = selected?.closest(`.${BASE_CLASS_PREFIX}-scrolllist-item`)?.getBoundingClientRect() as DOMRect;
                expect(selected?.getBoundingClientRect().top).toBeGreaterThanOrEqual(viewport.top);
                expect(selected?.getBoundingClientRect().bottom).toBeLessThanOrEqual(viewport.bottom);
            });
            await userEvent.fill(insetInput, '2025');
            await waitFor(() => expect(inputs[0]).toHaveValue('2025'));
            expect(getYMSelected()).toEqual(['2025年']);
        });

        it('insetInput + dateTime', async () => {
            const { inputs } = renderPicker({ ...insetProps, type: 'dateTime' });
            await userEvent.click(inputs[0]);
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
            const { inputs } = renderPicker({ ...insetProps, type: 'dateRange' });
            const focusClass = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;
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
            const { inputs } = renderPicker({ ...insetProps, type: 'dateTimeRange' });
            const focusClass = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getPopupInputWrappers()[0]).toHaveClass(focusClass));
            await userEvent.click(getDay('2021-12-05'));
            await userEvent.click(getDay('2022-01-10'));
            await clickOutside();
            await waitFor(() => expect(getPopup()).toBeNull());
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
            const { inputs } = renderPicker({ ...insetProps, type: 'dateTimeRange' });
            await userEvent.click(inputs[0]);
            await userEvent.click(await waitFor(() => getDay('2022-01-10')));
            expect(getPopupInputs()[0]).toHaveValue('2022-01-10');
            expect(getPopupInputs()[1]).toHaveValue('00:00:00');
            await clickOutside();
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(inputs[0]).toHaveValue('');
            expect(inputs[1]).toHaveValue('');
        });

        it('insetInput + dateTimeRange + 检查点击范围终点', async () => {
            const { inputs } = renderPicker({ ...insetProps, type: 'dateTimeRange' });
            await userEvent.click(inputs[1]);
            await userEvent.click(await waitFor(() => getDay('2022-01-10')));
            expect(getPopupInputs()[2]).toHaveValue('2022-01-10');
            expect(getPopupInputs()[3]).toHaveValue('00:00:00');
            await clickOutside();
            await waitFor(() => expect(getPopup()).toBeNull());
            expect(inputs[0]).toHaveValue('');
            expect(inputs[1]).toHaveValue('');
        });

        it('insetInput + 自定义格式', async () => {
            const { inputs } = renderPicker({ ...insetProps, type: 'dateRange', format: 'Pp' });
            await userEvent.click(inputs[0]);
            await userEvent.click(await waitFor(() => getDay('2021-12-05')));
            await userEvent.click(getDay('2022-01-10'));
            await waitFor(() => expect(inputs[0]).toHaveValue('21-12-05 上午 12:00'));
            expect(inputs[1]).toHaveValue('22-01-10 上午 12:00');
            await waitFor(() => expect(getPopup()).toBeNull());
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2021-12-05'));
            expect(getPopupInputs()[1]).toHaveValue('2022-01-10');
        });

        it('insetInput + 触发输入框禁用', async () => {
            const disabledClass = `${BASE_CLASS_PREFIX}-input-wrapper-disabled`;
            for (const type of ['date', 'dateTime', 'dateRange', 'dateTimeRange', 'month']) {
                const view = renderPicker({ ...insetProps, type });
                await userEvent.click(view.inputs[0]);
                await waitFor(() => expect(view.container.querySelector(`.${disabledClass}`)).not.toBeNull());
                await clickOutside();
                await waitFor(() => expect(view.container.querySelector(`.${disabledClass}`)).toBeNull());
                view.unmount();
            }
        });
    });

    it('输入完成', async () => {
        const rangeValue = ref<DatePickerProps['modelValue']>([new Date(2022, 7, 8), new Date(2022, 7, 9, 12)]);
        render(() => (
            <div>
                <div data-testid="dateRange">
                    <DatePicker type="dateRange" modelValue={rangeValue.value} showClear onUpdate:modelValue={(v: DatePickerProps['modelValue']) => (rangeValue.value = v)} />
                </div>
                <div data-testid="date">
                    <DatePicker multiple showClear />
                </div>
            </div>
        ));
        const dateInput = within(screen.getByTestId('date')).getByRole('combobox');
        await typeInto(dateInput, '2022-10-10');
        await userEvent.hover(dateInput);
        await userEvent.click(screen.getByTestId('date').querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(dateInput).toHaveValue('');

        await typeInto(dateInput, '2022-10-10,2022-10-11');
        expect(dateInput).toHaveValue('2022-10-10,2022-10-11');

        const [startInput, endInput] = within(screen.getByTestId('dateRange')).getAllByRole('combobox');
        await userEvent.fill(startInput, '2022-07-10');
        await userEvent.fill(endInput, '2022-10-11');
        await userEvent.keyboard('{Enter}');
        expect(startInput).toHaveValue('2022-07-10');
        expect(endInput).toHaveValue('2022-10-11');
    });

    describe('InputFormat', () => {
        it('输入有效日期 + 修改面板选中日期', async () => {
            const { inputs } = renderPicker();
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], '2021-03-15');
            await waitFor(() => expect(getNavTitles()).toContain('2021年 3月'));
            expect(getSelectedDays()).toEqual(['2021-03-15']);
        });

        it('输入开始日期 + 修改面板选中日期', async () => {
            const { inputs } = renderPicker({ type: 'dateRange' });
            await userEvent.click(inputs[1]);
            await typeInto(inputs[1], '2021-03-15');
            await waitFor(() => expect(getNavTitles()).toContain('2021年 3月'));
            expect(document.querySelector(`.${dp}-day-selected-end`)).toHaveAttribute('aria-label', '2021-03-15');
        });

        it('date 类型输入无效 + 失焦', async () => {
            const { inputs } = renderPicker();
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], '2021-03-15');
            await typeInto(inputs[0], '123');
            await clickOutside();
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15'));
        });

        it('dateRange 输入无效 + 失焦', async () => {
            const { inputs } = renderPicker({ type: 'dateRange' });
            const [startInput, endInput] = inputs;
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
            const { inputs } = renderPicker({ type: 'dateTime' });
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], '2021-03-15 00:00:00');
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], 'abc');
            await clickOutside();
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15 00:00:00'));
        });

        it('仅 date 类型输入无效 + 失焦', async () => {
            const { inputs } = renderPicker();
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], 'abc');
            await clickOutside();
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
        });

        it('仅 dateRange 输入无效 + 失焦', async () => {
            const { inputs } = renderPicker({ type: 'dateRange' });
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], 'abc');
            await userEvent.click(inputs[1]);
            await typeInto(inputs[1], '123');
            await clickOutside();
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
            expect(inputs[1]).toHaveValue('');
        });

        it('仅 dateTime 输入无效 + 失焦', async () => {
            const { inputs } = renderPicker({ type: 'dateTime' });
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], '123');
            await clickOutside();
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
        });

        it('输入禁用日期 + 修改面板选中日期', async () => {
            const { inputs } = renderPicker({ disabledDate: (date: Date) => date.getDate() === 15 });
            await userEvent.click(inputs[0]);
            await typeInto(inputs[0], '2021-03-15');
            expect(document.querySelector(`.${dp}-day-selected`)).toBeNull();
        });
    });

    describe('AutoFillTime', () => {
        const autoFillProps = { format: 'yyyy-MM-dd HH:mm', insetInput: true };

        it('自动填充时间 + dateTime', async () => {
            const { inputs } = renderPicker({
                ...autoFillProps,
                type: 'dateTime',
                defaultPickerValue: '2021-03-15 14:00',
            });
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await waitFor(() => expect(getPopupInputs()[1]).toHaveValue('14:00'));
        });

        it('自动填充时间无效 + dateTime', async () => {
            const { inputs } = renderPicker({
                ...autoFillProps,
                type: 'dateTime',
                defaultPickerValue: '2021-03-15 14:00',
            });
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-');
            expect(getPopupInputs()[1]).toHaveValue('');
        });

        it('自动填充时间 + dateTimeRange', async () => {
            const { inputs } = renderPicker({
                ...autoFillProps,
                type: 'dateTimeRange',
                defaultPickerValue: ['2021-01-10 00:01', '2021-03-15 23:59'],
            });
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-01-01');
            await waitFor(() => expect(getPopupInputs()[1]).toHaveValue('00:01'));
            await typeInto(getPopupInputs()[2], '2021-03-01');
            await waitFor(() => expect(getPopupInputs()[3]).toHaveValue('23:59'));
        });
    });

    describe('InputFormatConfirm', () => {
        const confirmProps = { format: 'yyyy-MM-dd HH:mm', needConfirm: true };
        const renderDateTime = (insetInput: boolean) => renderPicker({ ...confirmProps, insetInput, type: 'dateTime', defaultPickerValue: '2021-03-15 14:00' }).inputs;
        const renderDateTimeRange = (insetInput: boolean) =>
            renderPicker({
                ...confirmProps,
                insetInput,
                type: 'dateTimeRange',
                defaultPickerValue: ['2021-01-10 00:01', '2021-03-15 23:59'],
            }).inputs;
        const typeRange = async ([startInput, endInput]: Iterable<HTMLElement>) => {
            await userEvent.click(startInput);
            await typeInto(startInput, '2021-03-15 14:00');
            await userEvent.click(endInput);
            await typeInto(endInput, '2021-03-20 23:59');
        };

        it('输入日期 + needConfirm + 取消', async () => {
            const [input] = renderDateTime(false);
            await userEvent.click(input);
            await typeInto(input, '2021-03-15 14:00');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(input).toHaveValue(''));
        });

        it('输入日期 + needConfirm + 确认', async () => {
            const [input] = renderDateTime(false);
            await userEvent.click(input);
            await typeInto(input, '2021-03-15 14:00');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(input).toHaveValue('2021-03-15 14:00'));
        });

        it('输入日期范围 + needConfirm + 取消', async () => {
            const inputs = renderDateTimeRange(false);
            await typeRange(inputs);
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
            expect(inputs[1]).toHaveValue('');
        });

        it('输入日期范围 + needConfirm + 确认', async () => {
            const inputs = renderDateTimeRange(false);
            await typeRange(inputs);
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15 14:00'));
            expect(inputs[1]).toHaveValue('2021-03-20 23:59');
        });

        it('输入日期 + needConfirm + 取消（insetInput）', async () => {
            const [input] = renderDateTime(true);
            await userEvent.click(input);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(input).toHaveValue(''));
        });

        it('输入日期 + needConfirm + 确认（insetInput）', async () => {
            const [input] = renderDateTime(true);
            await userEvent.click(input);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(input).toHaveValue('2021-03-15 14:00'));
        });

        it('输入日期范围 + needConfirm + 取消（insetInput）', async () => {
            const inputs = renderDateTimeRange(true);
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await typeInto(getPopupInputs()[2], '2021-03-20');
            await userEvent.click(getFooterButtons()[0]);
            await waitFor(() => expect(inputs[0]).toHaveValue(''));
            expect(inputs[1]).toHaveValue('');
        });

        it('输入日期范围 + needConfirm + 确认（insetInput）', async () => {
            const inputs = renderDateTimeRange(true);
            await userEvent.click(inputs[0]);
            await typeInto(await waitFor(() => getPopupInputs()[0]), '2021-03-15');
            await typeInto(getPopupInputs()[2], '2021-03-20');
            await userEvent.click(getFooterButtons()[1]);
            await waitFor(() => expect(inputs[0]).toHaveValue('2021-03-15 00:01'));
            expect(inputs[1]).toHaveValue('2021-03-20 23:59');
        });
    });

    it('needConfirm 且输入无效时 cashedSelectedValue 回到上次选中值', async () => {
        const { inputs } = renderPicker({
            type: 'dateTimeRange',
            needConfirm: true,
            modelValue: [new Date(2022, 7, 8), new Date(2022, 7, 9, 12)],
        });
        await userEvent.click(inputs[0]);
        await userEvent.fill(inputs[0], '2021-0');
        await userEvent.click(getFooterButtons()[0]);
        await waitFor(() => expect(getPopup()).toBeNull());
        await userEvent.click(inputs[0]);
        await waitFor(() => expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`));
        expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
    });

    describe('CashedSelectedValue', () => {
        const pickers: Record<string, Record<string, unknown>> = {
            date: { type: 'date', defaultValue: new Date(2022, 7, 8) },
            dateTime: { type: 'dateTime', defaultValue: new Date(2022, 7, 8, 19, 11) },
            dateRange: { type: 'dateRange', defaultValue: [new Date(2022, 7, 8), new Date(2022, 7, 9)] },
        };

        it('选择日期后的 cashedSelectedValue', async () => {
            for (const type of ['date', 'dateTime']) {
                const view = renderPicker(pickers[type]);
                await userEvent.click(view.inputs[0]);
                await userEvent.click(await waitFor(() => getDay('2022-08-05')));
                await userEvent.click(view.inputs[0]);
                await waitFor(() => expect(getSelectedDays()).toEqual(['2022-08-05']));
                view.unmount();
            }

            const { inputs } = renderPicker(pickers.dateRange);
            await userEvent.click(inputs[0]);
            await userEvent.click(await waitFor(() => getDay('2022-08-05')));
            await userEvent.click(inputs[1]);
            await userEvent.click(getDay('2022-08-20'));
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getDay('2022-08-05')).toHaveClass(`${dp}-day-selected-start`));
            expect(getDay('2022-08-20')).toHaveClass(`${dp}-day-selected-end`);
        });

        it('点击外部后的 cashedSelectedValue', async () => {
            for (const type of ['date', 'dateTime']) {
                const view = renderPicker(pickers[type]);
                await userEvent.click(view.inputs[0]);
                await clickOutside();
                await waitFor(() => expect(getPopup()).toBeNull());
                await userEvent.click(view.inputs[0]);
                await waitFor(() => expect(getSelectedDays()).toEqual(['2022-08-08']));
                view.unmount();
            }

            const { inputs } = renderPicker(pickers.dateRange);
            await userEvent.click(inputs[0]);
            await clickOutside();
            await waitFor(() => expect(getPopup()).toBeNull());
            await userEvent.click(inputs[0]);
            await waitFor(() => expect(getDay('2022-08-08')).toHaveClass(`${dp}-day-selected-start`));
            expect(getDay('2022-08-09')).toHaveClass(`${dp}-day-selected-end`);
        });
    });

    it('按焦点状态计算 disabledDate', async () => {
        const today = new Date(2021, 9, 20);
        const disabledDate = (date: Date, { rangeInputFocus }: { rangeInputFocus?: string | boolean } = {}) => {
            const days = rangeInputFocus === 'rangeStart' ? 2 : rangeInputFocus === 'rangeEnd' ? 3 : 0;
            const start = new Date(2021, 9, 20 - days);
            const end = new Date(2021, 9, 20 + days);
            return days > 0 && start <= date && date <= end;
        };
        const { inputs } = renderPicker({ type: 'dateRange', disabledDate, defaultPickerValue: today });
        const getDisabledDays = () => Array.from(getPanel('left').querySelectorAll(`.${dp}-day.${dp}-day-disabled`)).map((d) => d.textContent);

        await userEvent.click(inputs[0]);
        await waitFor(() => expect(getDisabledDays()).toEqual(['18', '19', '20', '21', '22']));
        await userEvent.click(inputs[1]);
        await waitFor(() => expect(getDisabledDays()).toEqual(['17', '18', '19', '20', '21', '22', '23']));
    });

    it('clickOutSide', async () => {
        const onClickOutSide = vi.fn<EmitFn<'clickOutSide'>>();
        const { inputs } = renderPicker({ type: 'dateTime', needConfirm: true, onClickOutSide });
        await userEvent.click(inputs[0]);
        await userEvent.click(await waitFor(() => document.querySelector(`.${dp}-footer`) as HTMLElement));
        await clickOutside();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
    });

    it('打开与关闭', async () => {
        const picker = ref<DatePickerHandle>();
        render(() => (
            <>
                <Button onClick={() => picker.value?.open()}>{() => 'open'}</Button>
                <Button onClick={() => picker.value?.close()}>{() => 'close'}</Button>
                <DatePicker ref={picker} type="dateTime" motion={false} needConfirm onClickOutSide={() => {}} />
            </>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'open' }));
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'close' }));
        await waitFor(() => expect(getPopup()).toBeNull());
    });

    describe('FeatRefFocus', () => {
        const focusClass = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

        it('focus + blur + date 类型', async () => {
            const picker = ref<DatePickerHandle>();
            const { container } = render(() => (
                <>
                    <Button onClick={() => picker.value?.focus()}>{() => 'focus'}</Button>
                    <Button onClick={() => picker.value?.blur()}>{() => 'blur'}</Button>
                    <DatePicker ref={picker} type="dateTime" motion={false} />
                </>
            ));
            const input = container.querySelector('input');
            await userEvent.click(screen.getByRole('button', { name: 'focus' }));
            await waitFor(() => expect(container.querySelector(`.${focusClass}`)).not.toBeNull());
            expect(input).toHaveFocus();
            await userEvent.click(screen.getByRole('button', { name: 'blur' }));
            await waitFor(() => expect(container.querySelector(`.${focusClass}`)).toBeNull());
            expect(input).not.toHaveFocus();
        });

        it('focus + blur + dateRange 类型', async () => {
            const picker = ref<DatePickerHandle>();
            const { container } = render(() => (
                <>
                    <Button onClick={() => picker.value?.focus()}>{() => 'focus default'}</Button>
                    <Button onClick={() => picker.value?.focus('rangeEnd')}>{() => 'focus end'}</Button>
                    <Button onClick={() => picker.value?.blur()}>{() => 'blur'}</Button>
                    <DatePicker ref={picker} type="dateRange" motion={false} />
                </>
            ));
            const [startInput, endInput] = container.querySelectorAll('input');
            const wrapper = (side: string) => container.querySelector(`.${dp}-range-input-wrapper-${side}`) as Element;
            await userEvent.click(screen.getByRole('button', { name: 'focus default' }));
            await waitFor(() => expect(wrapper('start').querySelector(`.${focusClass}`)).not.toBeNull());
            expect(startInput).toHaveFocus();
            await userEvent.click(screen.getByRole('button', { name: 'focus end' }));
            await waitFor(() => expect(wrapper('end').querySelector(`.${focusClass}`)).not.toBeNull());
            expect(endInput).toHaveFocus();
            await userEvent.click(screen.getByRole('button', { name: 'blur' }));
            await waitFor(() => expect(container.querySelector(`.${focusClass}`)).toBeNull());
            expect(startInput).not.toHaveFocus();
            expect(endInput).not.toHaveFocus();
        });

        it('focus + blur + inset 类型', async () => {
            const picker = ref<DatePickerHandle>();
            const focusAndOpen = (focusType?: Parameters<DatePickerHandle['focus']>[0]) => {
                picker.value?.focus(focusType);
                picker.value?.open();
            };
            // the buttons sit above the picker: the insetInput popup is placed over the trigger row
            const { container } = render(() => (
                <>
                    <div>
                        <Button onClick={() => focusAndOpen()}>{() => 'focus start + open'}</Button>
                        <Button onClick={() => focusAndOpen('rangeEnd')}>{() => 'focus end + open'}</Button>
                        <Button
                            onClick={() => {
                                picker.value?.blur();
                                picker.value?.close();
                            }}
                        >
                            {() => 'blur + close'}
                        </Button>
                    </div>
                    <DatePicker ref={picker} type="dateRange" insetInput motion={false} />
                </>
            ));
            const getInsetInputs = () => document.querySelectorAll(`.${dp}-inset-input-wrapper input`);
            await userEvent.click(screen.getByRole('button', { name: 'focus start + open' }));
            await waitFor(() => expect(getInsetInputs()[0]).toHaveFocus());
            await userEvent.click(screen.getByRole('button', { name: 'focus end + open' }));
            await waitFor(() => expect(getInsetInputs()[1]).toHaveFocus());
            await userEvent.click(screen.getByRole('button', { name: 'blur + close' }));
            const [startInput, endInput] = container.querySelectorAll('input');
            await waitFor(() => expect(startInput).not.toHaveFocus());
            expect(endInput).not.toHaveFocus();
        });
    });

    describe('AutoSplitInput', () => {
        const splitProps = { format: 'yyyy-MM-dd HH:mm:ss', insetInput: true };

        it('拆分首个 inset 输入框 + dateTime', async () => {
            const { inputs } = renderPicker({ ...splitProps, type: 'dateTime' });
            await userEvent.click(inputs[0]);
            // the whole pasted string must reach the first inset input in one change
            await userEvent.fill(await waitFor(() => getPopupInputs()[0]), '2023-09-05 17:41:36');
            await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2023-09-05'));
            expect(getPopupInputs()[1]).toHaveValue('17:41:36');
            expect(getSelectedDays()).toEqual(['2023-09-05']);
        });

        it('拆分首个 inset 输入框 + dateTimeRange', async () => {
            const { inputs } = renderPicker({ ...splitProps, type: 'dateTimeRange' });
            await userEvent.click(inputs[0]);
            await userEvent.fill(await waitFor(() => getPopupInputs()[0]), '2023-10-09 16:14:31 ~ 2023-10-13 16:14:31');
            await waitFor(() => expect(getPopupInputs()[0]).toHaveValue('2023-10-09'));
            expect(Array.from(getPopupInputs()).map((input) => input.value)).toEqual(['2023-10-09', '16:14:31', '2023-10-13', '16:14:31']);
            expect(getDay('2023-10-09')).toHaveClass(`${dp}-day-selected-start`);
            expect(getDay('2023-10-13')).toHaveClass(`${dp}-day-selected-end`);
        });
    });

    it('点击清除按钮后 month 类型恢复到初始状态', async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const value = ref<DatePickerProps['modelValue']>('2019-09');
        const rangeValue = ref<DatePickerProps['modelValue']>(['2019-09', '2019-10']);
        render(() =>
            withOutside(
                <div data-testid="month">
                    <DatePicker type="month" modelValue={value.value} motion={false} onUpdate:modelValue={(v: DatePickerProps['modelValue']) => (value.value = v)} />
                </div>,
                <div data-testid="monthRange">
                    <DatePicker type="monthRange" modelValue={rangeValue.value} motion={false} onUpdate:modelValue={(v: DatePickerProps['modelValue']) => (rangeValue.value = v)} />
                </div>
            )
        );
        const clickClear = async (testId: string) => {
            const root = screen.getByTestId(testId);
            const input = root.querySelector('input') as HTMLElement;
            // The value shows after mount and renames the input, which the click targets by name
            await waitFor(() => expect(input).not.toHaveValue(''));
            await userEvent.click(input);
            await userEvent.click(root.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        };

        await clickClear('month');
        await waitFor(() => expect(getYMSelected()).toEqual([`${year}年`, `${month}月`]));

        await clickOutside();
        await waitFor(() => expect(getPopup()).toBeNull());
        await clickClear('monthRange');
        await waitFor(() => expect(getYMSelected()).toEqual([`${year}年`, `${month}月`, `${month + 1 <= 12 ? year : year + 1}年`, `${month + 1 <= 12 ? month + 1 : 1}月`]));
    });

    it('presets 的 start 和 end 支持函数类型', async () => {
        const presets = [{ text: '动态时间', start: () => new Date(2024, 0, 24), end: () => new Date(2024, 1, 26) }];
        const { inputs } = renderPicker({ type: 'dateRange', presets });
        await userEvent.click(inputs[0]);
        await userEvent.click(await screen.findByRole('button', { name: '动态时间' }));
        await waitFor(() => expect(inputs[0]).toHaveValue('2024-01-24'));
        expect(inputs[1]).toHaveValue('2024-02-26');
    });

    const expectSelectedYMVisible = (length?: number) =>
        waitFor(() => {
            const selected = document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
            if (length === undefined) {
                expect(selected.length).toBeGreaterThan(0);
            } else {
                expect(selected).toHaveLength(length);
            }
            for (const item of selected) {
                const itemRect = item.getBoundingClientRect();
                const viewport = (item.closest(`.${BASE_CLASS_PREFIX}-scrolllist-item`) as Element).getBoundingClientRect();
                expect(itemRect.top).toBeGreaterThanOrEqual(viewport.top);
                expect(itemRect.bottom).toBeLessThanOrEqual(viewport.bottom);
            }
        });

    it('范围选择的两侧都切到年月选择器时，选中的年与月滚入可见区', async () => {
        render(() => <DatePicker type="dateRange" defaultValue={[new Date(2030, 4, 10), new Date(2030, 7, 12)]} defaultOpen motion={false} />);
        const toggleYearMonth = async (side: string) => userEvent.click(await waitFor(() => getPanel(side).querySelector(`.${dp}-navigation-month button`) as HTMLElement));

        await toggleYearMonth('left');
        await expectSelectedYMVisible();
        await toggleYearMonth('right');
        expect(getYMLists()).toHaveLength(4);
        await expectSelectedYMVisible();
    });

    // weekStartsOn 0: April and May 2030 have 5 week rows, March and June 6
    it.each([
        {
            ymSide: 'left',
            monthSide: 'right',
            button: zh_CN.DatePicker.nextMonth,
            value: [new Date(2030, 3, 10), new Date(2030, 4, 12)],
        },
        {
            ymSide: 'right',
            monthSide: 'left',
            button: zh_CN.DatePicker.prevMonth,
            value: [new Date(2030, 3, 10), new Date(2030, 7, 12)],
        },
    ])('范围选择一侧显示年月选择器、$monthSide 侧月份的周行数变化后，选中的年与月仍在可见区', async ({ ymSide, monthSide, button, value }) => {
        render(() => <DatePicker type="dateRange" defaultValue={value} defaultOpen motion={false} />);
        await userEvent.click(await waitFor(() => getPanel(ymSide).querySelector(`.${dp}-navigation-month button`) as HTMLElement));
        const weekRows = () => getPanel(monthSide).querySelectorAll(`.${dp}-week`).length;
        expect(weekRows()).toBe(5);
        await userEvent.click(within(getPanel(monthSide)).getByRole('button', { name: button }));
        await waitFor(() => expect(weekRows()).toBe(6));
        await expectSelectedYMVisible(2);
    });

    it('compact 下 wheel 模式的年月列之间没有分隔线，与样式加载顺序无关', async () => {
        render(() => <DatePicker density="compact" defaultValue={new Date(2030, 4, 10)} defaultOpen motion={false} yearAndMonthOpts={{ mode: 'wheel' }} />);
        await userEvent.click(await waitFor(() => getPanel('left').querySelector(`.${dp}-navigation-month button`) as HTMLElement));
        // styles.css orders components alphabetically, putting scroll-list rules after date-picker ones
        const style = document.createElement('style');
        style.textContent = scrollListCss;
        document.head.append(style);
        onTestFinished(() => style.remove());
        const [yearWheel] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-wheel`);
        expect(getComputedStyle(yearWheel).borderInlineEndWidth).toBe('0px');
    });
});

describe('日历网格键盘焦点', () => {
    it('用键盘清空单个输入框后焦点回到输入框，且不打开面板', async () => {
        const onChange = vi.fn<EmitFn<'change'>>();
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} onChange={onChange} />);
        const input = container.querySelector('input') as HTMLInputElement;
        await tabTo(input);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: zh_CN.Input.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(input).toHaveValue(''));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveFocus();
        expect(getPopup()).toBeNull();
    });

    it('网格获得键盘焦点时，主题焦点环跟随当前日期', async () => {
        render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} open />);
        const grid = await screen.findByRole('grid');
        await tabTo(grid);
        expectThemeFocusRing(getDay('2019-09-11'));
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expectThemeFocusRing(getDay('2019-09-12')));
        expect(getComputedStyle(getDay('2019-09-11')).outlineStyle).toBe('none');
        expect(grid).toHaveFocus();
    });

    // Focus modality: jsdom matches :focus-visible on any focus, so these run in the browser
    it('用键盘选择日期后焦点回到输入框', async () => {
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} defaultOpen motion={false} />);
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{ArrowRight}{Enter}');
        const input = container.querySelector('input');
        await waitFor(() => expect(input).toHaveValue('2019-09-12'));
        expect(input).toHaveFocus();
    });

    it('用指针选择日期时焦点留在点击处，并只通知一次 @focus', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} onFocus={onFocus} />);
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(input);
        await userEvent.click(await waitFor(() => getDay('2019-09-12')));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(input).toHaveValue('2019-09-12');
        expect(input).not.toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('点击预设会关闭由 @focus 控制打开状态的面板（FixOnFocus）', async () => {
        const onFocus = vi.fn<EmitFn<'focus'>>();
        const open = ref(false);
        const { container } = render(() => (
            <DatePicker
                type="date"
                motion={false}
                open={open.value}
                presets={[{ text: 'Preset', start: new Date('2022-03-03'), end: new Date('2022-03-03') }]}
                onFocus={(...args: DatePickerEmits['focus']) => {
                    onFocus(...args);
                    open.value = true;
                }}
                onPresetClick={() => (open.value = false)}
            />
        ));
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(input);
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'Preset' }));
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(input).toHaveValue('2022-03-03');
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('重新选择时 disabledDate 接收当前的 rangeStart/rangeEnd（修复 #777）', async () => {
        const disabledDate: DatePickerDisabledDateType = (date, options = {}) => {
            const { rangeInputFocus } = options;
            if (date === undefined) {
                return false;
            } else if (rangeInputFocus === 'rangeStart') {
                return date <= addDays(new Date(options.rangeEnd as string), -20);
            } else if (rangeInputFocus === 'rangeEnd') {
                return date >= addDays(new Date(options.rangeStart as string), 20);
            }
            return false;
        };
        const { container } = render(() => <DatePicker type="dateRange" defaultPickerValue={new Date('2023-04-01')} disabledDate={disabledDate} motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2023-04-05')));
        await userEvent.click(getDay('2023-04-10'));
        await waitFor(() => expect(getPopup()).toBeNull());

        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2023-05-06')));
        await userEvent.click(getDay('2023-05-11'));
        expect(startInput).toHaveValue('2023-05-06');
        expect(endInput).toHaveValue('2023-05-11');
        await waitFor(() => expect(getPopup()).toBeNull());

        await userEvent.click(startInput);
        await waitFor(() => expect(getDay('2023-05-06')).toHaveClass(`${dp}-day-selected-start`));
        expect(getDay('2023-05-11')).toHaveClass(`${dp}-day-selected-end`);
    });

    it('从结束框打开、键盘 Esc 关闭后，从开始框重开并选开始日期，面板保持打开', async () => {
        const { container } = render(() => <DatePicker type="dateRange" defaultValue={[new Date(2019, 8, 1), new Date(2019, 8, 5)]} motion={false} />);
        const [startInput, endInput] = container.querySelectorAll('input');
        await tabTo(endInput);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).toContainElement(document.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(endInput).toHaveFocus();

        await userEvent.click(startInput);
        await userEvent.click(await waitFor(() => getDay('2019-09-02')));
        await waitFor(() => expect(endInput).toHaveFocus());
        expect(getPopup()).not.toBeNull();
    });
});

describe('触发器键盘访问', () => {
    it('Tab 在结束输入框之后到达范围清除按钮，并显示主题焦点环', async () => {
        const { container } = render(() => <DatePicker type="dateRange" defaultValue={[new Date(2019, 8, 1), new Date(2019, 8, 5)]} motion={false} />);
        const [, endInput] = container.querySelectorAll('input');
        await tabTo(endInput);
        await userEvent.keyboard('{Tab}');
        const clear = screen.getByRole('button', { name: zh_CN.DatePicker.clearRange });
        expect(clear).toHaveFocus();
        expectThemeFocusRing(clear);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(endInput).toHaveValue(''));
        expect(container.querySelector('input')).toHaveFocus();
    });

    it('主题焦点环标记 dateTime 面板的日期/时间切换按钮', async () => {
        render(() => <DatePicker type="dateTime" defaultValue={new Date(2019, 8, 11)} motion={false} open />);
        const toTime = await screen.findByRole('button', { name: zh_CN.DatePicker.switchToTime });
        await tabTo(toTime);
        expectThemeFocusRing(toTime);
    });

    it('ArrowDown 打开面板，面板打开后将焦点移入', async () => {
        const { container } = render(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} />);
        const input = container.querySelector('input') as HTMLInputElement;
        await tabTo(input);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopup()).toContainElement(document.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(input).toHaveFocus();
    });

    it('面板关闭时，面板内的键盘焦点回到 #trigger 中的按钮', async () => {
        render(() => (
            <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false}>
                {{
                    trigger: () => <button type="button">pick</button>,
                }}
            </DatePicker>
        ));
        const trigger = screen.getByRole('button', { name: 'pick' });
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        const grid = await screen.findByRole('grid');
        await tabTo(grid);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('没有焦点目标的 #trigger，焦点回到打开面板的按钮', async () => {
        render(() => (
            <DatePicker motion={false}>
                {{
                    trigger: () => <span>pick</span>,
                }}
            </DatePicker>
        ));
        const trigger = await screen.findByRole('button', { name: zh_CN.DatePicker.chooseDate });
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        await userEvent.keyboard('{Enter}');
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('insetInput 下键盘 Esc 关闭面板后焦点回到触发框', async () => {
        const { container } = render(() => <DatePicker insetInput defaultValue={new Date(2019, 8, 11)} motion={false} />);
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(input);
        await waitFor(() => expect(getPopupInputs()[0]).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopup()).toBeNull());
        await waitFor(() => expect(input).toHaveFocus());
    });
});

describe('年月选择器的焦点', () => {
    const cases: Pick<DatePickerProps, 'type' | 'defaultValue'>[] = [
        { type: 'date', defaultValue: new Date(2030, 4, 10) },
        { type: 'dateRange', defaultValue: [new Date(2030, 4, 10), new Date(2030, 7, 12)] },
    ];
    const getTitle = () => getPanel('left').querySelector<HTMLElement>(`.${dp}-navigation-month button`) as HTMLElement;

    it.each(cases)('$type 用键盘从月份标题进入年月选择器，焦点落在年份列表', async ({ type, defaultValue }) => {
        render(() => <DatePicker type={type} defaultValue={defaultValue} defaultOpen motion={false} />);
        await waitFor(() => expect(getTitle()).not.toBeNull());
        await tabTo(getTitle());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.activeElement).toBe(getPanel('left').querySelector('[role="listbox"]')));
    });

    it.each(cases)('$type 用键盘从年月选择器返回，焦点回到月份标题', async ({ type, defaultValue }) => {
        render(() => <DatePicker type={type} defaultValue={defaultValue} defaultOpen motion={false} />);
        await waitFor(() => expect(getTitle()).not.toBeNull());
        const titleId = getTitle().id;
        await userEvent.click(getTitle());
        const back = await within(getPanel('left')).findByRole('button', { name: zh_CN.DatePicker.selectDate });
        await tabTo(back);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.activeElement?.id).toBe(titleId));
    });
});

describe('ShadowRoot 内的焦点', () => {
    const renderInShadow = (ui: () => unknown) => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(ui, { container: mount });
        onTestFinished(() => {
            view.unmount();
            host.remove();
        });
        return shadow;
    };

    it('键盘焦点在面板内时 Esc 关闭面板，焦点回到输入框', async () => {
        const shadow = renderInShadow(() => <DatePicker defaultValue={new Date(2019, 8, 11)} motion={false} />);
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).toContainElement(shadow.activeElement as HTMLElement));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(shadow.querySelector(`.${dp}-month-grid`)).toBeNull());
        expect(shadow.activeElement).toBe(input);
    });

    it('用键盘从年月选择器返回，焦点回到月份标题', async () => {
        const shadow = renderInShadow(() => <DatePicker defaultValue={new Date(2030, 4, 10)} defaultOpen motion={false} />);
        const title = await waitFor(() => {
            const button = shadow.querySelector<HTMLElement>(`.${dp}-navigation-month button`);
            expect(button).not.toBeNull();
            return button as HTMLElement;
        });
        title.click();
        const back = await within(shadow.querySelector(`.${dp}-month-grid-left`) as HTMLElement).findByRole('button', { name: zh_CN.DatePicker.selectDate });
        back.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement?.id).toBe(title.id));
    });

    it('handle 的 blur() 让输入框失焦', async () => {
        const picker = ref<DatePickerHandle>();
        const shadow = renderInShadow(() => <DatePicker ref={picker} motion={false} />);
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        expect(shadow.activeElement).toBe(input);
        picker.value?.blur();
        expect(shadow.activeElement).toBeNull();
    });
});
