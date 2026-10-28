import { catchError, createSignal, onMount, untrack } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Locale from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconClose } from '@fibrae/semi-icons-solid';
import { countLiveListeners } from '@test/utils/solid';
import TimePicker, { type TimePickerProps, type TimePickerTriggerRenderProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';
import ConfigProvider from '../../config-provider';
import { type FormApi, Form, FormTimePicker } from '../../form';
import Popover from '../../popover';
import Combobox, { type ComboboxHandle } from '../combobox';

// wide enough for the onChange of both type values
type DateFirstOnChange = (value: Date | Date[], str: string | string[]) => void;
type Props = Record<string, unknown>;

const prefixCls = `${BASE_CLASS_PREFIX}-timepicker`;
const scrollListCls = `${BASE_CLASS_PREFIX}-scrolllist`;
const normalList = { scrollItemProps: { cycled: false, mode: 'normal' } };

function renderTimePicker(initial: Props = {}) {
    const [props, setProps] = createSignal(initial);
    // a spread call is a function source, so keys added by a later rerender stay reactive
    const result = render(() => <TimePicker {...(props() as TimePickerProps)} />);
    return { ...result, rerender: (next: Props) => setProps(next) };
}

const getInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`) as HTMLInputElement;
const getRoot = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
const getPanels = () => Array.from(document.querySelectorAll<HTMLElement>(`.${scrollListCls}`));
const getList = (type: string, panel: ParentNode = document) => panel.querySelector<HTMLElement>(`.${prefixCls}-panel-list-${type}`);
const getItems = (type: string, panel?: ParentNode) => Array.from((getList(type, panel) as HTMLElement).querySelectorAll('li'));
const getSelectedText = (type: string, panel?: ParentNode) => (getList(type, panel) as HTMLElement).querySelector(`.${scrollListCls}-item-sel`)?.textContent;
const clickItem = (type: string, index: number, panel?: ParentNode) => fireEvent.click(getItems(type, panel)[index]);
const clickOutside = () => fireEvent.mouseDown(document.body);
const typeText = (value: string) => fireEvent.input(getInput(), { target: { value } });
// jsdom lists no running animations, so a leaving popup unmounts at once
const waitForClosed = () => waitFor(() => expect(getPanels()).toHaveLength(0));
const focusInput = () => getInput().focus();
const blurInput = () => getInput().blur();
const lastCall = <T extends (...args: never[]) => unknown>(spy: { mock: { calls: Parameters<T>[] } }) => spy.mock.calls[spy.mock.calls.length - 1];
const hms = (date: Date) => [date.getHours(), date.getMinutes(), date.getSeconds()];
const isInvalid = () => document.querySelector(`.${prefixCls}-input-invalid`) !== null;

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('TimePicker', () => {
    it('TimePicker 外观', async () => {
        const onFocus = vi.fn<NonNullable<TimePickerProps['onFocus']>>();
        const onChange = vi.fn<DateFirstOnChange>();

        renderTimePicker({
            onChange,
            onFocus,
            panelHeader: <strong>Select Time</strong>,
            defaultOpen: true,
            scrollItemProps: { mode: 'wheel', cycled: false },
            format: 'HH:mm:ss',
            defaultValue: '10:24:18',
            panelFooter: <strong>Select Time</strong>,
        });

        expect(getPanels()).toHaveLength(1);
        expect(document.querySelectorAll(`.${prefixCls}`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${scrollListCls}-header`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${scrollListCls}-footer`)).toHaveLength(1);
        expect(getInput()).toHaveValue('10:24:18');

        // the wheel list selects it after a short debounce
        fireEvent.click((getList('minute') as HTMLElement).querySelector(`.${scrollListCls}-list-outer ul li`) as HTMLElement);
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        const [selectedDate, selectedStr] = onChange.mock.calls[0] as [Date, string];
        expect(hms(selectedDate)).toEqual([10, 0, 18]);
        expect(selectedStr).toBe('10:00:18');
        expect(getInput()).toHaveValue('10:00:18');

        focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);

        typeText('10:18:18');
        expect((lastCall<DateFirstOnChange>(onChange)[0] as Date).getMinutes()).toBe(18);
        expect(lastCall<DateFirstOnChange>(onChange)[1]).toBe('10:18:18');

        fireEvent.mouseDown(getPanels()[0]);
        expect(getPanels()).toHaveLength(1);

        clickOutside();
        await waitForClosed();
    });

    it('stopPropagation 为 false 时，在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        render(() => (
            <TimePicker
                defaultOpen
                motion={false}
                stopPropagation={false}
                panelFooter={
                    <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} stopPropagation={false} trigger="click">
                        {(getTriggerProps) => (
                            <button {...getTriggerProps()} type="button">
                                nested trigger
                            </button>
                        )}
                    </Popover>
                }
            />
        ));
        fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPanels()).toHaveLength(1);
        clickOutside();
        await waitForClosed();
    });

    it('受控 value', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ onChange, defaultOpen: true, scrollItemProps: { cycled: false }, format: 'HH:mm:ss', value: '10:24:18' });

        typeText('10:18:18');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getSelectedText('minute')).toBe('24分');

        fireEvent.focusOut(getInput());
        expect(getInput()).toHaveValue('10:24:18');
    });

    it('受控 value 与 onChange', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        function Controlled() {
            const [value, setValue] = createSignal<TimePickerProps['value']>('10:24:18');
            return (
                <TimePicker
                    value={value()}
                    defaultOpen
                    format="HH:mm:ss"
                    scrollItemProps={{ cycled: false }}
                    onChange={(date, str) => {
                        onChange(date, str);
                        setValue(date);
                    }}
                />
            );
        }
        render(() => <Controlled />);

        typeText('10:18:18');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getSelectedText('minute')).toBe('18分');
        expect(getInput()).toHaveValue('10:18:18');
    });

    it('父组件挂载时就改了 value，输入框显示新时间', () => {
        function Demo() {
            const [value, setValue] = createSignal('10:24:18');
            onMount(() => setValue('11:30:00'));
            return <TimePicker format="HH:mm:ss" value={value()} />;
        }
        render(() => <Demo />);
        expect(getInput()).toHaveValue('11:30:00');
    });

    it('受控 open', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        function Controlled() {
            const [open, setOpen] = createSignal(true);
            return (
                <TimePicker
                    value="10:24:18"
                    format="HH:mm:ss"
                    motion={false}
                    open={open()}
                    panelFooter={<Button icon={<IconClose />} aria-label="close" onClick={() => setOpen(false)} />}
                    scrollItemProps={{ cycled: false }}
                    onOpenChange={(nextOpen) => {
                        onOpenChange(nextOpen);
                        setOpen(nextOpen);
                    }}
                />
            );
        }
        render(() => <Controlled />);
        expect(getPanels()).toHaveLength(1);

        await userEvent.click(screen.getByRole('button', { name: 'close' }));
        expect(getPanels()).toHaveLength(0);
        expect(onOpenChange).not.toHaveBeenCalled();

        focusInput();
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPanels()).toHaveLength(1);

        clickOutside();
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitForClosed();
    });

    it('范围选择器外观', async () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({
            use12Hours: true,
            focusOnOpen: true,
            format: 'a hh:mm',
            type: 'timeRange',
            defaultValue: ['上午 10:12', '上午 11:08'],
            onChange,
            scrollItemProps: { cycled: false, mode: 'normal' },
            defaultOpen: true,
            panelHeader: ['start header', 'end header'],
            panelFooter: ['start footer', 'end footer'],
        });

        const [startItem, endItem] = getPanels();
        expect(getPanels()).toHaveLength(2);
        expect(startItem.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^start header$/);
        expect(startItem.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^start footer$/);
        expect(endItem.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^end header$/);
        expect(endItem.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^end footer$/);
        await waitFor(() => expect(getInput()).toHaveFocus());

        const hourLis = getItems('hour', startItem);
        expect(hourLis).toHaveLength(12);
        fireEvent.click(hourLis[9]);

        const [dates, strs] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
        expect(dates[0].getHours()).toBe(9);
        expect(strs).toEqual(['上午 09:12', '上午 11:08']);
        expect(getInput()).toHaveValue('上午 09:12 ~ 上午 11:08');
    });

    it('点击清空', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ defaultValue: '10:23:15', showClear: true, onChange });

        fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]).toEqual([undefined, '']);
        expect(getInput()).toHaveValue('');
    });

    it('onChange 的值类型按 type 判别：单选是 Date 与 string，范围是数组', () => {
        const single: TimePickerProps = {
            type: 'time',
            onChange: (value, str) => {
                expectTypeOf(value).toEqualTypeOf<Date>();
                expectTypeOf(str).toEqualTypeOf<string>();
            },
        };
        const range: TimePickerProps = {
            type: 'timeRange',
            onChange: (value, str) => {
                expectTypeOf(value).toEqualTypeOf<Date[]>();
                expectTypeOf(str).toEqualTypeOf<string[]>();
            },
        };
        expect([single.type, range.type]).toEqual(['time', 'timeRange']);
    });

    it('triggerRender 收到具名的 TimePickerTriggerRenderProps', () => {
        expectTypeOf<Parameters<NonNullable<TimePickerProps['triggerRender']>>>().toEqualTypeOf<[props: TimePickerTriggerRenderProps]>();
        expectTypeOf<TimePickerTriggerRenderProps['value']>().toEqualTypeOf<Date[]>();
        expectTypeOf<TimePickerTriggerRenderProps['onChange']>().toEqualTypeOf<(inputValue: string) => void>();
    });

    it('triggerRender 内按钮聚焦时 Enter 按下该按钮', async () => {
        const onPress = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
        renderTimePicker({ triggerRender: () => <button type="button" aria-label="清除" onClick={onPress} /> });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getPanels()).toHaveLength(0);
    });

    it('disabled 属性', () => {
        renderTimePicker({ disabled: true, defaultValue: '10:23:15', defaultOpen: true });

        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
        expect(getPanels()).toHaveLength(0);
    });

    it('父组件挂载时就禁用了打开的选择器，解除禁用后面板保持收起', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const [disabled, setDisabled] = createSignal(false);
        function Demo() {
            onMount(() => setDisabled(true));
            return <TimePicker defaultOpen motion={false} disabled={disabled()} onOpenChange={onOpenChange} />;
        }
        render(() => <Demo />);
        setDisabled(false);
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(getPanels()).toHaveLength(0);
    });

    it('placeholder 属性', () => {
        renderTimePicker({ placeholder: '请选择时间' });
        expect(screen.getByPlaceholderText('请选择时间')).toBe(getInput());
    });

    it('format 属性', () => {
        renderTimePicker({ format: 'HH:mm', defaultValue: '10:23' });
        expect(getInput()).toHaveValue('10:23');
    });

    it('hourStep、minuteStep 和 secondStep', () => {
        renderTimePicker({ hourStep: 2, minuteStep: 15, secondStep: 30, defaultOpen: true, scrollItemProps: { cycled: false } });
        expect(getPanels()).toHaveLength(1);
        expect(getItems('hour')).toHaveLength(12);
        expect(getItems('hour')[1]).toHaveTextContent(/^02$/);
        expect(getItems('minute').map((li) => li.textContent)).toEqual(['00分', '15', '30', '45']);
        expect(getItems('second').map((li) => li.textContent)).toEqual(['00秒', '30']);
    });

    it('autofocus 挂载后聚焦输入框并打开面板', async () => {
        const onFocus = vi.fn<NonNullable<TimePickerProps['onFocus']>>();
        renderTimePicker({ autofocus: true, onFocus });

        await waitFor(() => expect(getInput()).toHaveFocus());
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('hourStep、minuteStep、secondStep 不是正整数时渲染面板抛错', () => {
        const errors: unknown[] = [];
        render(() =>
            catchError(
                () => <TimePicker hourStep={0} defaultOpen />,
                (error) => errors.push(error)
            )
        );
        expect(errors[0]).toBeInstanceOf(RangeError);
        expect(String(errors[0])).toContain('hourStep');
    });

    it('validateStatus 属性', () => {
        const error = renderTimePicker({ validateStatus: 'error', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
        error.unmount();

        renderTimePicker({ validateStatus: 'warning', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('prefix 和 insetLabel', () => {
        renderTimePicker({ prefix: <span class="custom-prefix">前缀</span>, insetLabel: '时间' });

        expect(screen.getByText('前缀')).toHaveClass('custom-prefix');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).not.toBeNull();
    });

    it('borderless 属性', () => {
        renderTimePicker({ borderless: true, defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
    });

    it('size 属性', () => {
        const small = renderTimePicker({ size: 'small', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        small.unmount();

        renderTimePicker({ size: 'large', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-large`)).not.toBeNull();
    });

    it('onBlur 回调只在点击外部关闭时触发', async () => {
        const onBlur = vi.fn<NonNullable<TimePickerProps['onBlur']>>();
        renderTimePicker({ onBlur, defaultValue: '10:23:15' });

        focusInput();
        expect(getPanels()).toHaveLength(1);
        blurInput();
        expect(onBlur).not.toHaveBeenCalled();

        clickOutside();
        expect(onBlur).toHaveBeenCalledTimes(1);
        await waitForClosed();
    });

    it('onBlur 收到点击外部的原生 mousedown 事件', async () => {
        const events: MouseEvent[] = [];
        const props: TimePickerProps = {
            defaultOpen: true,
            onBlur: (e) => {
                expectTypeOf(e).toEqualTypeOf<MouseEvent>();
                events.push(e);
            },
        };
        renderTimePicker({ ...props });

        clickOutside();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(MouseEvent);
        expect(events[0].type).toBe('mousedown');
        await waitForClosed();
    });

    it('disabledHours、disabledMinutes 和 disabledSeconds', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({
            disabledHours: () => [0, 1, 2],
            disabledMinutes: () => [0, 15, 30, 45],
            disabledSeconds: () => [0, 30],
            onChange,
            defaultOpen: true,
            scrollItemProps: { cycled: false },
        });

        const disabledIndexes = (type: string) => getItems(type).flatMap((li, index) => (li.getAttribute('aria-disabled') === 'true' ? [index] : []));
        expect(disabledIndexes('hour')).toEqual([0, 1, 2]);
        expect(disabledIndexes('minute')).toEqual([0, 15, 30, 45]);
        expect(disabledIndexes('second')).toEqual([0, 30]);
        expect(getItems('hour')[0]).toHaveClass(`${scrollListCls}-item-disabled`);

        clickItem('hour', 1);
        expect(onChange).not.toHaveBeenCalled();
        clickItem('hour', 3);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('hideDisabledOptions 属性', () => {
        renderTimePicker({ disabledHours: () => [0, 1, 2, 3, 4, 5], hideDisabledOptions: true, defaultOpen: true, scrollItemProps: { cycled: false } });

        expect(getItems('hour')).toHaveLength(18);
        expect(getItems('hour')[0]).toHaveTextContent(/^06$/);
    });

    it('无值时分钟和秒列按 0 点标记禁用项，与选中后得到的时间一致', () => {
        const disabledMinutes = (hour: number) => (hour === 0 ? [5] : []);
        const disabledSeconds = (hour: number, minute: number) => (hour === 0 && minute === 0 ? [7] : []);
        renderTimePicker({ disabledMinutes, disabledSeconds, defaultOpen: true, scrollItemProps: { cycled: false } });

        expect(getItems('minute')[5]).toHaveAttribute('aria-disabled', 'true');
        expect(getItems('second')[7]).toHaveAttribute('aria-disabled', 'true');
    });

    it('不含秒的 format（HH:mm）', () => {
        renderTimePicker({ format: 'HH:mm', defaultValue: '10:23', defaultOpen: true, scrollItemProps: { cycled: false } });

        expect(getPanels()).toHaveLength(1);
        expect(getList('hour')).not.toBeNull();
        expect(getList('minute')).not.toBeNull();
        expect(getList('second')).toBeNull();
    });

    it('只含小时的 format（HH）', () => {
        renderTimePicker({ format: 'HH', defaultValue: '10', defaultOpen: true, scrollItemProps: { cycled: false } });

        expect(getSelectedText('hour')).toBe('10时');
        expect(getList('minute')).toBeNull();
        expect(getList('second')).toBeNull();
    });

    it('不含小时的 format（mm:ss）', () => {
        renderTimePicker({ format: 'mm:ss', defaultValue: '23:15', defaultOpen: true, scrollItemProps: { cycled: false } });

        expect(getList('hour')).toBeNull();
        expect(getSelectedText('minute')).toBe('23分');
        expect(getSelectedText('second')).toBe('15秒');
    });

    it('triggerRender 属性自定义触发器', async () => {
        const triggerRender = (props: TimePickerTriggerRenderProps) => <button class="custom-trigger">{props.placeholder || 'Select Time'}</button>;
        renderTimePicker({ triggerRender, defaultValue: '10:23:15', placeholder: 'Select Time' });

        const customTrigger = screen.getByRole('button', { name: 'Select Time' });
        expect(customTrigger).toHaveClass('custom-trigger');
        expect(getInput()).toBeNull();
        expect(getPanels()).toHaveLength(0);

        await userEvent.click(customTrigger);
        expect(getPanels()).toHaveLength(1);
    });

    it('triggerRender 收到 disabled、value，并通过 onChange 输入时间', () => {
        renderTimePicker({
            disabled: true,
            format: 'HH:mm:ss',
            defaultValue: '10:23:15',
            triggerRender: (props: TimePickerTriggerRenderProps) => (
                <div>
                    <span data-testid="state">{`${props.disabled}|${(props.value as Date[]).length}`}</span>
                    <input aria-label="custom" onInput={(e) => props.onChange(e.currentTarget.value)} />
                    <span data-testid="text">{props.inputValue}</span>
                </div>
            ),
        });
        expect(screen.getByTestId('state')).toHaveTextContent('true|1');
        fireEvent.input(screen.getByRole('textbox', { name: 'custom' }), { target: { value: '11:22:33' } });
        expect(screen.getByTestId('text')).toHaveTextContent('11:22:33');
    });

    it('triggerRender 的参数是活的：值变化后显示新文本', () => {
        renderTimePicker({ defaultOpen: true, ...normalList, triggerRender: (props: TimePickerTriggerRenderProps) => <span data-testid="text">{props.inputValue}</span> });
        clickItem('hour', 7);
        expect(screen.getByTestId('text')).toHaveTextContent(/^07:00:00$/);
    });

    it.each([
        ['AM 切到 PM', '上午 10:23:15', 'ampm', 1, [22, 23, 15], '下午 10:23:15'],
        ['PM 切到 AM', '下午 02:23:15', 'ampm', 0, [2, 23, 15], '上午 02:23:15'],
        ['AM 选小时 12', '上午 10:23:15', 'hour', 0, [0, 23, 15], '上午 12:23:15'],
        ['PM 选小时 5', '下午 02:23:15', 'hour', 5, [17, 23, 15], '下午 05:23:15'],
        ['AM 下 12 点选 1 点', '上午 12:00:00', 'hour', 1, [1, 0, 0], '上午 01:00:00'],
        ['PM 下 12 点选 1 点', '下午 12:00:00', 'hour', 1, [13, 0, 0], '下午 01:00:00'],
        ['小时 >= 12 时切到 AM', '下午 01:00:00', 'ampm', 0, [1, 0, 0], '上午 01:00:00'],
        ['小时 < 12 时切到 PM', '上午 10:00:00', 'ampm', 1, [22, 0, 0], '下午 10:00:00'],
        ['PM 下选小时 5 保持在下午', '下午 03:30:00', 'hour', 5, [17, 30, 0], '下午 05:30:00'],
        ['PM 下选小时 7', '下午 05:30:00', 'hour', 7, [19, 30, 0], '下午 07:30:00'],
    ] as const)('use12Hours：%s', (_, defaultValue, column, index, expected, text) => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ use12Hours: true, format: 'a hh:mm:ss', defaultValue, defaultOpen: true, onChange, ...normalList });

        clickItem(column, index);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(hms(onChange.mock.calls[0][0] as Date)).toEqual(expected);
        expect(getInput()).toHaveValue(text);
    });

    it('use12Hours 列出上下午', () => {
        renderTimePicker({ use12Hours: true, format: 'a hh:mm:ss', defaultValue: '上午 10:23:15', defaultOpen: true, ...normalList });
        expect(getItems('ampm').map((li) => li.textContent)).toEqual(['上午', '下午']);
        expect(getItems('hour')).toHaveLength(12);
    });

    it('秒的选择', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ format: 'HH:mm:ss', defaultValue: '10:23:15', defaultOpen: true, onChange, ...normalList });

        clickItem('second', 0);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('10:23:00');
        expect(getSelectedText('second')).toBe('00秒');
    });

    it('选择分钟后输入框与面板同步', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onChange, ...normalList });

        clickItem('minute', 30);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('10:30:15');
        expect(getSelectedText('minute')).toBe('30分');
    });

    it('timeRange 类型同时显示两个面板', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ type: 'timeRange', defaultValue: ['10:00:00', '12:00:00'], defaultOpen: true, onChange, ...normalList });

        const panels = getPanels();
        expect(panels).toHaveLength(2);
        clickItem('hour', 5, panels[1]);

        expect(onChange).toHaveBeenCalledTimes(1);
        const [dates, strs] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
        expect(dates.map(hms)).toEqual([
            [10, 0, 0],
            [5, 0, 0],
        ]);
        expect(strs).toEqual(['10:00:00', '05:00:00']);
    });

    it('timeRange 第二个面板变化', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ type: 'timeRange', defaultValue: ['10:00:00', '14:00:00'], defaultOpen: true, onChange, ...normalList });

        clickItem('minute', 30, getPanels()[1]);
        expect(onChange.mock.calls[0][1]).toEqual(['10:00:00', '14:30:00']);
        expect(getInput()).toHaveValue('10:00:00 ~ 14:30:00');
    });

    it('value={undefined} 按非受控处理，受控值变回 undefined 时清空', () => {
        const { rerender } = renderTimePicker({ value: undefined, defaultValue: '10:23:15' });
        expect(getInput()).toHaveValue('10:23:15');
        typeText('11:30:00');
        expect(getInput()).toHaveValue('11:30:00');

        rerender({ value: '12:00:00' });
        expect(getInput()).toHaveValue('12:00:00');
        rerender({ value: undefined });
        expect(getInput()).toHaveValue('');
    });

    it('受控 value 变化时恢复光标位置', () => {
        const { rerender } = renderTimePicker({ value: '10:23:15' });

        getInput().setSelectionRange(2, 2);
        focusInput();
        rerender({ value: '11:30:00' });

        expect(getInput()).toHaveValue('11:30:00');
        expect(getInput().selectionStart).toBe(2);
        expect(getSelectedText('hour')).toBe('11时');
    });

    it('输入框 value 变化时恢复光标位置', async () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ defaultValue: '10:23:15', onChange, defaultOpen: true });

        await userEvent.type(getInput(), '30', { initialSelectionStart: 3, initialSelectionEnd: 5 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('10:30:15');
        expect(getInput().selectionStart).toBe(5);
    });

    it('timeZone 变化时重新换算显示值', () => {
        // pin the date so the New York offset (EDT) is fixed
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2019-08-08 12:00:00'));
        const { rerender } = renderTimePicker({ defaultValue: '10:23:15', timeZone: 'Asia/Shanghai' });
        expect(getInput()).toHaveValue('10:23:15');

        rerender({ defaultValue: '10:23:15', timeZone: 'America/New_York' });
        expect(getInput()).toHaveValue('22:23:15');
    });

    it('stopPropagation 属性', () => {
        const onParentClick = vi.fn<() => void>();
        const onParentMouseDown = vi.fn<() => void>();
        const renderInParent = (stopPropagation: boolean) =>
            render(() => (
                <div role="presentation" onClick={onParentClick} onMouseDown={onParentMouseDown}>
                    <TimePicker defaultValue="10:23:15" defaultOpen stopPropagation={stopPropagation} />
                </div>
            ));

        const stopped = renderInParent(true);
        fireEvent.mouseDown(getPanels()[0]);
        fireEvent.click(getPanels()[0]);
        expect(onParentClick).not.toHaveBeenCalled();
        expect(onParentMouseDown).not.toHaveBeenCalled();
        stopped.unmount();

        // without it, events in the popup bubble through the component tree
        renderInParent(false);
        fireEvent.mouseDown(getPanels()[0]);
        fireEvent.click(getPanels()[0]);
        expect(onParentClick).toHaveBeenCalledTimes(1);
        expect(onParentMouseDown).toHaveBeenCalledTimes(1);
    });

    it('position 属性', () => {
        renderTimePicker({ defaultValue: '10:23:15', position: 'top', defaultOpen: true });
        expect(document.querySelector('[x-placement]')).toHaveAttribute('x-placement', 'top');
    });

    it('inputReadOnly 属性', () => {
        renderTimePicker({ defaultValue: '10:23:15', inputReadOnly: true });
        expect(getInput()).toHaveAttribute('readonly');
        expect(document.querySelector(`.${prefixCls}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ defaultValue: '10:23:15', inputReadOnly: true, showClear: true, onChange });

        fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it('panels 属性在范围模式下将每项显示为面板的头部和底部', () => {
        renderTimePicker({
            type: 'timeRange',
            defaultOpen: true,
            panelHeader: ['start header', 'end header'],
            panelFooter: ['start footer', 'end footer'],
            panels: ['start panel', 'end panel'],
        });

        const [start, end] = getPanels();
        for (const [panel, text] of [
            [start, 'start panel'],
            [end, 'end panel'],
        ] as const) {
            expect(panel.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(new RegExp(`^${text}$`));
            expect(panel.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(new RegExp(`^${text}$`));
        }
    });

    it('panels 传节点时渲染为元素，缺项的面板回退到 panelHeader 与 panelFooter', () => {
        render(() => <TimePicker type="timeRange" defaultOpen panelHeader={['start header', 'end header']} panelFooter={['start footer', 'end footer']} panels={[<button type="button">now</button>]} />);

        const [start, end] = getPanels();
        for (const slot of ['header', 'footer']) {
            expect(within(start.querySelector<HTMLElement>(`.${scrollListCls}-${slot}`) as HTMLElement).getByRole('button', { name: 'now' })).toBeInTheDocument();
        }
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^end header$/);
        expect(end.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^end footer$/);
    });

    it('preventScroll 属性', async () => {
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        renderTimePicker({ defaultValue: '10:23:15', preventScroll: true, focusOnOpen: true });

        await waitFor(() => expect(focus).toHaveBeenCalledWith({ preventScroll: true }));
    });

    it('onKeyDown 回调', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => string>((e) => e.key);
        renderTimePicker({ onKeyDown, defaultValue: '10:23:15' });

        fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.results[0].value).toBe('Enter');
    });

    it('受控 open 在外部点击时请求关闭，直到持有方关闭才会收起', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        renderTimePicker({ defaultValue: '10:23:15', onOpenChange, open: true });
        clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        expect(getPanels()).toHaveLength(1);
    });

    it('关闭或卸载后停止监听外部点击', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const { unmount } = renderTimePicker({ defaultValue: '10:23:15', onOpenChange, defaultOpen: true });
        clickOutside();
        await waitForClosed();
        clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);

        focusInput();
        unmount();
        clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false], [true]]);
    });

    it('重新打开后外部点击仍能关闭', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        renderTimePicker({ defaultValue: '10:23:15', onOpenChange });

        focusInput();
        expect(getPanels()).toHaveLength(1);
        clickOutside();
        blurInput();
        await waitForClosed();

        focusInput();
        expect(getPanels()).toHaveLength(1);
        clickOutside();
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    });

    it('motion=false 时点击外部关闭', async () => {
        renderTimePicker({ defaultValue: '10:23:15', motion: false, defaultOpen: true });
        expect(getPanels()).toHaveLength(1);
        clickOutside();
        await waitForClosed();
    });

    it('rangeSeparator 属性', () => {
        renderTimePicker({ type: 'timeRange', defaultValue: ['10:00:00', '12:00:00'], rangeSeparator: ' - ' });
        expect(getInput()).toHaveValue('10:00:00 - 12:00:00');
    });

    it('focusOnOpen 属性', async () => {
        const onFocus = vi.fn<NonNullable<TimePickerProps['onFocus']>>();
        renderTimePicker({ defaultValue: '10:23:15', focusOnOpen: true, onFocus });

        await waitFor(() => expect(getInput()).toHaveFocus());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getPanels()).toHaveLength(1);
    });

    it('class 和 style 落在根元素，inputStyle 落在输入框外层', () => {
        renderTimePicker({ defaultValue: '10:23:15', class: 'custom-timepicker', style: { width: '200px' }, inputStyle: { color: 'red' } });

        expect(getRoot()).toHaveClass('custom-timepicker');
        expect(getRoot()).toHaveStyle({ width: '200px' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('popupStyle 与 popupClassName 属性', () => {
        renderTimePicker({ defaultValue: '10:23:15', popupStyle: { 'background-color': 'white' }, popupClassName: 'my-popup', defaultOpen: true });

        expect(document.querySelector('[x-placement]')).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
        expect(document.querySelector(`.${prefixCls}-panel`)).toHaveClass('my-popup');
    });

    it('快速开关面板', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        renderTimePicker({ defaultValue: '10:23:15', onOpenChange });

        for (let i = 0; i < 5; i++) {
            focusInput();
            clickOutside();
            blurInput();
        }
        expect(onOpenChange).toHaveBeenCalledTimes(10);

        focusInput();
        expect(getPanels()).toHaveLength(1);
        onOpenChange.mockClear();
        clickOutside();
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        await waitForClosed();
    });

    it('未关闭就再次聚焦不重复打开', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const onFocus = vi.fn<NonNullable<TimePickerProps['onFocus']>>();
        renderTimePicker({ defaultValue: '10:23:15', onOpenChange, onFocus });

        focusInput();
        blurInput();
        focusInput();

        expect(getPanels()).toHaveLength(1);
        expect(onFocus).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('defaultOpen 后聚焦输入框不再请求打开', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onOpenChange });

        focusInput();
        expect(getPanels()).toHaveLength(1);
        expect(onOpenChange).not.toHaveBeenCalled();

        clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    it('面板打开时点击 triggerRender 触发器', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const triggerRender = (props: TimePickerTriggerRenderProps) => <button class="custom-trigger">{props.inputValue || props.placeholder}</button>;
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, triggerRender, onOpenChange });
        expect(getPanels()).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: '10:23:15' }));
        expect(getPanels()).toHaveLength(1);
        expect(onOpenChange).not.toHaveBeenCalled();

        clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    describe('受控回归用例', () => {
        function Controlled(props: TimePickerProps & { initValue?: TimePickerProps['value']; feedStrings?: boolean }) {
            const [value, setValue] = createSignal(untrack(() => props.initValue));
            return (
                <TimePicker
                    {...normalList}
                    defaultOpen
                    {...props}
                    value={value()}
                    onChange={(v: Date | Date[], str: string | string[]) => {
                        (props.onChange as DateFirstOnChange | undefined)?.(v, str);
                        setValue(props.feedStrings ? str : v);
                    }}
                />
            );
        }

        beforeEach(() => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
        });

        it('带 timeZone 的受控选择器显示面板中选择的时间', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <Controlled timeZone={0} onChange={onChange} />);
            clickItem('hour', 7);

            expect((lastCall<DateFirstOnChange>(onChange)[0] as Date).getUTCHours()).toBe(7);
            expect(getInput().value.startsWith('07:')).toBe(true);
            expect(getSelectedText('hour')).toBe('07时');
        });

        it('空值的受控范围与非受控一样填充开始时间', () => {
            const uncontrolled = render(() => <TimePicker {...normalList} type="timeRange" defaultOpen />);
            clickItem('hour', 7, getPanels()[0]);
            const expected = getInput().value;
            uncontrolled.unmount();

            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <Controlled type="timeRange" initValue={[]} onChange={onChange} />);
            clickItem('hour', 7, getPanels()[0]);
            expect(getInput()).toHaveValue(expected);
            expect((lastCall<DateFirstOnChange>(onChange)[0] as Date[])[0].getHours()).toBe(7);
        });

        it('timeZone 和 disabledHours 校验显示的小时，而非本地小时', () => {
            // 07:xx at UTC+10 is 05:xx in the Asia/Shanghai test zone, which disabledHours rejects
            render(() => (
                <ConfigProvider timeZone={10}>
                    <Controlled disabledHours={() => [5]} format="HH:mm" initValue={new Date()} />
                </ConfigProvider>
            ));
            clickItem('hour', 7);
            clickItem('minute', 10);
            clickOutside();
            expect(getInput()).toHaveValue('07:10');
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).toBeNull();
        });

        it('字符串值下先选结束时间，开始时间保持为空', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <Controlled type="timeRange" feedStrings onChange={onChange} />);
            clickItem('hour', 7, getPanels()[1]);

            const [, strs] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
            expect(strs[0]).toBe('');
            expect(strs[1].startsWith('07:')).toBe(true);
            expect(getInput()).toHaveValue(` ~ ${strs[1]}`);
            expect(getSelectedText('hour', getPanels()[1])).toBe('07时');
        });

        it('范围只选一侧：两侧对称，空的一侧为 undefined，输入框不标记无效', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            const view = render(() => <TimePicker {...normalList} type="timeRange" defaultOpen onChange={onChange} />);
            clickItem('hour', 7, getPanels()[0]);
            const [start, startStr] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
            expect(start).toHaveLength(2);
            expect(start[1]).toBeUndefined();
            expect(startStr).toEqual(['07:00:00', '']);
            expect(getInput()).toHaveValue('07:00:00 ~ ');
            view.unmount();

            onChange.mockClear();
            render(() => <TimePicker {...normalList} type="timeRange" defaultOpen onChange={onChange} />);
            clickItem('hour', 7, getPanels()[1]);
            clickItem('hour', 8, getPanels()[1]);
            const [end, endStr] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
            expect(end[0]).toBeUndefined();
            expect(endStr).toEqual(['', '08:00:00']);
            expect(getInput()).toHaveValue(' ~ 08:00:00');
            expect(isInvalid()).toBe(false);
        });

        it('受控范围只选开始时间：输入框显示「开始 ~ 」且不标记无效，带 timeZone 时同样上报空的一侧', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            const view = render(() => <Controlled type="timeRange" onChange={onChange} />);
            clickItem('hour', 7, getPanels()[0]);
            expect(getInput()).toHaveValue('07:00:00 ~ ');
            expect(isInvalid()).toBe(false);
            view.unmount();

            onChange.mockClear();
            render(() => <Controlled type="timeRange" timeZone={0} onChange={onChange} />);
            clickItem('hour', 7, getPanels()[0]);
            const [value, str] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
            expect(value[0].getUTCHours()).toBe(7);
            expect(value[1]).toBeUndefined();
            expect(str[1]).toBe('');
            expect(getInput().value).toMatch(/^07:\d\d:\d\d ~ $/);
        });

        // onChange formats the UTC instant in the host zone, so a string fed back as value parses to the same instant
        it('timeZone 下受控字符串值往返后与所选时间一致', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <Controlled feedStrings format="HH:mm" timeZone={0} onChange={onChange} />);
            clickItem('hour', 7);

            const [date, str] = lastCall<DateFirstOnChange>(onChange) as [Date, string];
            expect(date.getUTCHours()).toBe(7);
            // the test zone is Asia/Shanghai (UTC+8)
            expect(str.startsWith('15:')).toBe(true);
            expect(getInput().value.startsWith('07:')).toBe(true);
            expect(getSelectedText('hour')).toBe('07时');
        });
    });

    describe('行为基线', () => {
        // the picker's own and its Popover's both listen on window
        const liveMousedownListeners = (add: Parameters<typeof countLiveListeners>[0], remove: Parameters<typeof countLiveListeners>[1]) => countLiveListeners(add, remove, 'mousedown') / 2;

        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { TimePicker: { format: 'HH:mm', size: 'small' } };
            // '10:23' only parses with the global HH:mm format
            render(() => <TimePicker defaultValue="10:23" />);
            expect(getInput()).toHaveValue('10:23');
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        });

        it('组件传入的属性优先于全局默认值', () => {
            semiGlobal.config.overrideDefaultProps = { TimePicker: { format: 'HH:mm' } };
            render(() => <TimePicker defaultValue="10:23:15" format="HH:mm:ss" />);
            expect(getInput()).toHaveValue('10:23:15');
        });

        it('打开时只有一个外部点击监听，关闭一次，卸载时移除', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
            const onBlur = vi.fn<NonNullable<TimePickerProps['onBlur']>>();
            const { unmount } = render(() => <TimePicker defaultValue="10:23:15" defaultOpen onBlur={onBlur} onOpenChange={onOpenChange} />);
            expect(liveMousedownListeners(add, remove)).toBe(1);

            clickOutside();
            expect(onOpenChange.mock.calls).toEqual([[false]]);
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(liveMousedownListeners(add, remove)).toBe(0);
            await waitForClosed();

            focusInput();
            expect(liveMousedownListeners(add, remove)).toBe(1);
            unmount();
            expect(liveMousedownListeners(add, remove)).toBe(0);
        });

        it('选择小时只上报一次变化', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <TimePicker defaultValue="10:23:15" defaultOpen onChange={onChange} {...normalList} />);
            clickItem('hour', 7);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(hms(onChange.mock.calls[0][0] as Date)).toEqual([7, 23, 15]);
            expect(getInput()).toHaveValue('07:23:15');
        });

        it('受控 open 只在显示时监听外部点击', () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { rerender } = renderTimePicker({ open: true, defaultValue: '10:23:15' });
            expect(getPanels()).toHaveLength(1);
            expect(liveMousedownListeners(add, remove)).toBe(1);
            rerender({ defaultValue: '10:23:15', open: false });
            expect(liveMousedownListeners(add, remove)).toBe(0);
        });

        it('聚焦受控 open 的选择器时不再请求打开', () => {
            const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
            renderTimePicker({ open: true, onOpenChange });
            focusInput();
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('受控 value 变化会显示出来，之后的值覆盖已输入的文本', () => {
            const { rerender } = renderTimePicker({ value: '10:23:15' });
            typeText('11:00:0');
            expect(getInput()).toHaveValue('11:00:0');
            rerender({ value: '12:00:00' });
            expect(getInput()).toHaveValue('12:00:00');
        });

        it('受控 value 超出可用小时时输入框标记为无效', () => {
            const disabledHours = () => [11];
            const { rerender } = renderTimePicker({ value: '10:23:15', disabledHours });
            expect(isInvalid()).toBe(false);
            rerender({ value: '11:00:00', disabledHours });
            expect(isInvalid()).toBe(true);
        });

        it('输入禁用时间会标记输入框无效，blur 时恢复上一个有效时间', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            renderTimePicker({ defaultValue: '10:23:15', disabledHours: () => [11], onChange });
            focusInput();
            typeText('11:00:00');
            expect(isInvalid()).toBe(true);
            expect(onChange).not.toHaveBeenCalled();
            blurInput();
            expect(getInput()).toHaveValue('10:23:15');
            expect(isInvalid()).toBe(false);
        });

        it('format 变化时重新格式化显示值和面板列', () => {
            const { rerender } = renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, ...normalList });
            expect(getList('second')).not.toBeNull();
            rerender({ defaultValue: '10:23:15', defaultOpen: true, format: 'HH:mm', ...normalList });
            expect(getInput()).toHaveValue('10:23');
            expect(getList('second')).toBeNull();
        });

        it('设了 timeZone 时只改 format，显示的时间不被重复换算', () => {
            const { rerender } = renderTimePicker({ defaultValue: '10:23:15', timeZone: 'Asia/Tokyo' });
            const shown = getInput().value;
            rerender({ defaultValue: '10:23:15', format: 'HH:mm', timeZone: 'Asia/Tokyo' });
            expect(getInput()).toHaveValue(shown.slice(0, 5));
        });

        it('data-* 等未声明属性落在输入框上', () => {
            renderTimePicker({ 'data-testid': 'tp', title: 'tip' });
            expect(getInput()).toHaveAttribute('data-testid', 'tp');
            expect(getInput()).toHaveAttribute('title', 'tip');
            expect(getRoot()).not.toHaveAttribute('data-testid');
        });

        it('aria 属性、id 和 Form 的 name 落在输入框上', () => {
            render(() => (
                <Form>
                    <FormTimePicker id="start" name="start-name" aria-label="start time" field="start" />
                </Form>
            ));
            expect(getInput()).toHaveAttribute('aria-label', 'start time');
            expect(getInput()).toHaveAttribute('name', 'start-name');
            expect(getInput()).toHaveAttribute('id', 'start');
            for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
                expect(getRoot()).not.toHaveAttribute(attr);
                expect(getInput()).not.toHaveAttribute(attr);
            }
        });

        it('FormTimePicker 上报所选时间，并在 formApi.reset 后再次清空', () => {
            let formApi: FormApi | undefined;
            render(() => (
                <Form getFormApi={(api) => (formApi = api)}>
                    <FormTimePicker defaultOpen field="start" {...normalList} />
                </Form>
            ));
            clickItem('hour', 7);
            const picked = formApi?.getValue('start');
            expect(picked).toBeInstanceOf(Date);
            expect((picked as Date).getHours()).toBe(7);
            formApi?.reset();
            expect(formApi?.getValue('start')).toBeUndefined();
            expect(getInput()).toHaveValue('');
        });

        it('FormTimePicker 在面板关闭时而非输入框失焦时校验', async () => {
            render(() => (
                <Form>
                    <FormTimePicker field="start" rules={[{ required: true, message: 'required' }]} trigger="blur" />
                </Form>
            ));
            focusInput();
            blurInput();
            expect(screen.queryByText('required')).toBeNull();
            clickOutside();
            await waitFor(() => expect(screen.getByText('required')).toBeInTheDocument());
        });

        it('Combobox 的 ref 交出 reselect，供 DatePicker 使用', () => {
            let handle: ComboboxHandle | undefined;
            render(() => <Combobox ref={(h) => (handle = h)} prefixCls="x" timeStampValue={new Date(2023, 0, 1, 10, 23, 15)} />);
            expect(typeof handle?.reselect).toBe('function');
            expect(() => handle?.reselect()).not.toThrow();
        });

        it('timeRange 显示开始和结束表头，并上报两个日期', () => {
            const onChange = vi.fn<DateFirstOnChange>();
            render(() => <TimePicker type="timeRange" defaultValue={['10:00:00', '12:00:00']} defaultOpen onChange={onChange} {...normalList} />);
            expect(getPanels()).toHaveLength(2);
            expect(getInput()).toHaveValue('10:00:00 ~ 12:00:00');
            const [start, end] = getPanels();
            expect(start).toHaveTextContent('开始时间');
            expect(end).toHaveTextContent('结束时间');
            clickItem('hour', 11, start);
            expect(onChange.mock.calls[0][1]).toEqual(['11:00:00', '12:00:00']);
        });
    });

    describe('ref 与属性落点', () => {
        it('ref 是根元素，其 focus 和 blur 移动输入框焦点', () => {
            let root: HTMLDivElement | undefined;
            const onFocus = vi.fn<NonNullable<TimePickerProps['onFocus']>>();
            render(() => <TimePicker ref={(node) => (root = node)} onFocus={onFocus} />);
            expect(root).toBe(getRoot());
            root?.focus();
            expect(getInput()).toHaveFocus();
            expect(onFocus).toHaveBeenCalledTimes(1);
            root?.blur();
            expect(getInput()).not.toHaveFocus();
        });

        it('ref 的 focus 套用 preventScroll', () => {
            let root: HTMLDivElement | undefined;
            const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
            render(() => <TimePicker ref={(node) => (root = node)} preventScroll />);
            root?.focus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        });

        it('已声明的属性不会进入 DOM', () => {
            renderTimePicker({
                type: 'timeRange',
                position: 'top',
                open: false,
                timeZone: 'Asia/Shanghai',
                disabledTime: () => ({}),
                panels: ['a', 'b'],
            });
            for (const attr of ['position', 'open', 'timezone', 'disabledtime', 'panels']) {
                expect(getInput()).not.toHaveAttribute(attr);
                expect(getRoot()).not.toHaveAttribute(attr);
            }
        });

        it('首次渲染即显示默认值', () => {
            const seen: string[] = [];
            renderTimePicker({
                defaultValue: '10:23:15',
                triggerRender: (props: TimePickerTriggerRenderProps) => {
                    seen.push(untrack(() => props.inputValue));
                    return <span>{props.inputValue}</span>;
                },
            });
            expect(seen[0]).toBe('10:23:15');
        });

        it('范围值只有一侧时挂载显示「 ~ 结束」，不标记无效', () => {
            renderTimePicker({ type: 'timeRange', value: ['', '10:00:00'] });
            expect(getInput()).toHaveValue(' ~ 10:00:00');
            expect(isInvalid()).toBe(false);
        });

        it('受控范围值更新为两侧都空时输入框为空，不标记无效', () => {
            const { rerender } = renderTimePicker({ type: 'timeRange', value: ['09:00:00', '10:00:00'] });
            rerender({ type: 'timeRange', value: ['', ''] });
            expect(getInput()).toHaveValue('');
            expect(isInvalid()).toBe(false);
        });

        it('triggerRender 收到的 componentProps 不含 ref', () => {
            const triggerRender = vi.fn<NonNullable<TimePickerProps['triggerRender']>>(() => <span>trigger</span>);
            render(() => <TimePicker ref={() => undefined} format="HH:mm" triggerRender={triggerRender} />);
            const componentProps = triggerRender.mock.lastCall?.[0].componentProps;
            expect(componentProps).not.toHaveProperty('ref');
            expect(componentProps?.format).toBe('HH:mm');
        });
    });
});

describe('TimePicker combobox 与面板键盘操作', () => {
    it('输入框是 combobox，其 aria-controls 指向包含列表的面板', async () => {
        render(() => <TimePicker motion={false} />);
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        input.focus();
        await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toContainElement(screen.getAllByRole('listbox')[0]);
        expect(screen.getByRole('dialog', { name: Locale.TimePicker.panel.time })).toContainElement(panel);
    });

    it('为范围面板命名对话框', async () => {
        render(() => <TimePicker type="timeRange" defaultOpen motion={false} />);
        expect(await screen.findByRole('dialog', { name: Locale.TimePicker.panel.timeRange })).toBeInTheDocument();
    });

    it('AM/PM、小时、分钟和秒列表都有名称', () => {
        render(() => <TimePicker defaultOpen format="a hh:mm:ss" motion={false} use12Hours />);
        for (const name of ['ampmList', 'hourList', 'minuteList', 'secondList'] as const) {
            expect(screen.getByRole('listbox', { name: Locale.TimePicker[name] })).toBeInTheDocument();
        }
    });

    it('Esc 关闭面板', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        render(() => <TimePicker motion={false} onOpenChange={onOpenChange} />);
        screen.getByRole('combobox').focus();
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPanels()).toHaveLength(0));
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('TimePicker 受控与输入的边界', () => {
    it('受控 value 更新为无法解析的值时不抛错，输入框清空', () => {
        const { rerender } = renderTimePicker({ value: '10:23:15' });
        expect(getInput()).toHaveValue('10:23:15');
        rerender({ value: '10:24' });
        expect(getInput()).toHaveValue('');
        rerender({ value: '11:25:35' });
        expect(getInput()).toHaveValue('11:25:35');
    });

    it('受控时清空输入后失焦，输入框恢复受控值', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ value: '10:23:15', onChange });
        typeText('');
        expect(onChange).toHaveBeenCalledTimes(1);
        fireEvent.focusOut(getInput());
        expect(getInput()).toHaveValue('10:23:15');
    });

    it('受控时键入被 disabledHours 禁止的时间，输入框显示无效态', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ value: '10:23:15', disabledHours: () => [11], onChange });
        typeText('11:00:00');
        expect(isInvalid()).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('时间戳 0 是有效的 value', () => {
        renderTimePicker({ defaultValue: '10:23:15', value: 0 });
        expect(getInput()).toHaveValue(format(new Date(0), 'HH:mm:ss'));
    });

    it('非受控时清空输入后失焦，输入框保持为空', () => {
        renderTimePicker({ defaultValue: '10:23:15' });
        typeText('');
        fireEvent.focusOut(getInput());
        expect(getInput()).toHaveValue('');
    });

    it('disabled 的自定义触发器被点击时不打开面板，也不通知 onOpenChange', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const props = { motion: false, triggerRender: () => <span>custom trigger</span>, onOpenChange };
        const { rerender } = renderTimePicker({ ...props, disabled: true });
        fireEvent.click(screen.getByText('custom trigger'));
        expect(onOpenChange).not.toHaveBeenCalled();
        rerender({ ...props, disabled: false });
        expect(getPanels()).toHaveLength(0);
    });

    it('value 为 null 是受控空值，不回落到 defaultValue', () => {
        renderTimePicker({ defaultValue: '10:20:30', value: null });
        expect(getInput()).toHaveValue('');
    });

    it('owner 传入等值的新 Date，不覆盖输入框里未提交的文本', () => {
        const [tick, setTick] = createSignal(0);
        render(() => <TimePicker value={(tick(), new Date(2020, 1, 1, 10, 20, 30))} />);
        typeText('10:2');
        setTick(1);
        expect(getInput()).toHaveValue('10:2');
    });

    it('value 换成不同时间的新 Date 时仍同步输入框', () => {
        const { rerender } = renderTimePicker({ value: new Date(2020, 1, 1, 10, 20, 30) });
        rerender({ value: new Date(2020, 1, 1, 11, 20, 30) });
        expect(getInput()).toHaveValue('11:20:30');
    });
});

describe('TimePicker use12Hours', () => {
    const props = { use12Hours: true, format: 'a hh:mm:ss', defaultOpen: true, scrollItemProps: { cycled: false } };
    const hourItem = (hour: string) => getItems('hour').find((li) => li.textContent?.startsWith(hour)) as HTMLElement;
    const disabledHourTexts = () =>
        getItems('hour')
            .filter((li) => li.getAttribute('aria-disabled') === 'true')
            .map((li) => li.textContent?.slice(0, 2));

    it('disabledHours 按当前半天映射到 12 小时制的标记', () => {
        renderTimePicker({ ...props, disabledHours: () => [0, 13], defaultValue: '下午 02:23:15' });
        expect(disabledHourTexts()).toEqual(['01']);
    });

    it('下午面板不标记上午的 1 点', () => {
        renderTimePicker({ ...props, disabledHours: () => [1], defaultValue: '下午 02:23:15' });
        expect(disabledHourTexts()).toEqual([]);
    });

    it('上午面板中 0 点标记为 12 点禁用，12 点（中午）不受影响', () => {
        renderTimePicker({ ...props, disabledHours: () => [0, 12], defaultValue: '上午 10:23:15' });
        expect(disabledHourTexts()).toEqual(['12']);
    });

    it('上午面板不标记 12 点（中午）', () => {
        renderTimePicker({ ...props, disabledHours: () => [12], defaultValue: '上午 10:23:15' });
        expect(disabledHourTexts()).toEqual([]);
    });

    it('hideDisabledOptions 在上午面板隐藏被禁用的 12 点', () => {
        renderTimePicker({ ...props, disabledHours: () => [0], hideDisabledOptions: true, defaultValue: '上午 10:23:15' });
        expect(getItems('hour').map((li) => li.textContent?.slice(0, 2))).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
    });

    it('非受控键入下午时间后点小时仍保持在下午', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ ...props, defaultValue: '上午 08:23:15', onChange });
        typeText('下午 10:23:15');
        expect(getSelectedText('ampm')).toBe('下午');
        fireEvent.click(hourItem('09'));
        expect(hms(lastCall<DateFirstOnChange>(onChange)[0] as Date)).toEqual([21, 23, 15]);
    });

    it('受控 value 由外部改为下午后上下午列选中下午，点小时保持在下午', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        const { rerender } = renderTimePicker({ ...props, value: new Date(2021, 5, 1, 9, 0, 0), onChange });
        expect(getSelectedText('ampm')).toBe('上午');
        rerender({ ...props, value: new Date(2021, 5, 1, 21, 0, 0), onChange });
        expect(getSelectedText('ampm')).toBe('下午');
        fireEvent.click(hourItem('10'));
        expect(hms(lastCall<DateFirstOnChange>(onChange)[0] as Date)).toEqual([22, 0, 0]);
    });

    it('timeRange 无值时右面板默认下午，选小时得到下午时间', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ ...props, type: 'timeRange', onChange });
        const [left, right] = getPanels();
        expect(getSelectedText('ampm', left)).toBe('上午');
        expect(getSelectedText('ampm', right)).toBe('下午');
        clickItem('hour', 3, right);
        expect(hms((lastCall<DateFirstOnChange>(onChange)[0] as Date[])[1])).toEqual([15, 0, 0]);
    });
});

describe('TimePicker Tab 停靠点', () => {
    it('表头容器不是 Tab 停靠点，Tab 直接跳到输入框', async () => {
        const { container } = render(() => <TimePicker />);
        await userEvent.tab();
        expect(container.querySelector(`.${prefixCls}-header`)).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement).toBe(container.querySelector('input'));
    });
});

describe('TimePicker 面板与属性边界', () => {
    it('scrollItemProps 只接受 cycled、mode、motion、transform，不能替换面板自己的回调与列名称', () => {
        const onSelect = vi.fn<() => void>();
        const onChange = vi.fn<DateFirstOnChange>();
        // the type rejects these keys; the cast is the point: a JS caller must not be able to break the panel
        const scrollItemProps = { cycled: false, onSelect, 'aria-label': 'x' } as unknown as TimePickerProps['scrollItemProps'];
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onChange, scrollItemProps });

        expect((getList('hour') as HTMLElement).querySelector('ul')).toHaveAttribute('aria-label', Locale.TimePicker.hourList);
        clickItem('hour', 3);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('scrollItemProps 的 transform 仍可改写列文字', () => {
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, scrollItemProps: { cycled: false, transform: (text: string) => `<${text}>` } });
        expect(getSelectedText('second')).toBe('<15>');
    });

    it('locale、localeCode、dateFnsLocale 不是 TimePicker 的 props', () => {
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withLocale: TimePickerProps = { locale: Locale.TimePicker };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withCode: TimePickerProps = { localeCode: 'zh-CN' };
        // @ts-expect-error the locale always comes from the LocaleProvider
        const withDateFns: TimePickerProps = { dateFnsLocale: Locale.dateFnsLocale };
        expect([withLocale, withCode, withDateFns]).toHaveLength(3);
    });

    it('未传 prefixCls 的 Combobox 不生成带 undefined 的列类名', () => {
        const { container } = render(() => <Combobox use12Hours />);
        expect(container.querySelectorAll(`.${scrollListCls}-item`)).toHaveLength(4);
        expect(container.innerHTML).not.toContain('undefined');
    });

    it('弹层 wrapper 保留 Popover 的前缀', () => {
        renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true });
        const wrapper = document.querySelector<HTMLElement>('[x-placement]') as HTMLElement;
        expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.querySelector(`.${prefixCls}-panel`)).not.toBeNull();
    });
});

describe('TimePicker 属性回落与面板开合', () => {
    const utcOne = new Date(Date.UTC(2021, 0, 1, 1, 0, 0));

    it('显式传入 undefined 的 timeZone 与 placeholder 回落到 ConfigProvider 与语言包', () => {
        render(() => (
            <ConfigProvider timeZone="Asia/Tokyo">
                <TimePicker placeholder={undefined} value={utcOne} timeZone={undefined} />
            </ConfigProvider>
        ));
        expect(getInput()).toHaveValue('10:00:00');
        expect(getInput()).toHaveAttribute('placeholder', Locale.TimePicker.placeholder.time);
    });

    it('ConfigProvider 的 timeZone 优先于全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TimePicker: { timeZone: 'UTC' } };
        render(() => (
            <ConfigProvider timeZone="Asia/Tokyo">
                <TimePicker value={utcOne} />
            </ConfigProvider>
        ));
        expect(getInput()).toHaveValue('10:00:00');
    });

    it('disabled 加 defaultOpen 时点击外部不调用 onOpenChange 与 onBlur', () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const onBlur = vi.fn<NonNullable<TimePickerProps['onBlur']>>();
        renderTimePicker({ disabled: true, defaultOpen: true, onOpenChange, onBlur });
        clickOutside();
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('打开后变为 disabled 时关闭面板并上报 onOpenChange(false)，重新启用不再弹出', async () => {
        const onOpenChange = vi.fn<NonNullable<TimePickerProps['onOpenChange']>>();
        const { rerender } = renderTimePicker({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPanels()).toHaveLength(1);
        rerender({ disabled: true, defaultOpen: true, motion: false, onOpenChange });
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        rerender({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPanels()).toHaveLength(0);
    });

    it('triggerRender 返回不可聚焦内容时外层是 Tab 停靠点，Enter 打开面板', async () => {
        render(() => <TimePicker motion={false} triggerRender={() => <span>10:00</span>} />);
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: '10:00' });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('triggerRender 内有可聚焦元素时外层不是按钮也不是 Tab 停靠点', () => {
        render(() => <TimePicker triggerRender={() => <button type="button">pick</button>} />);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'pick' }).parentElement).not.toHaveAttribute('tabindex');
    });
});

describe('TimePicker 值与文本', () => {
    it('timeZone 加 use12Hours 时 onChange 的字符串按语言包格式化，回填后可解析', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        function Controlled() {
            const [value, setValue] = createSignal<string>();
            return (
                <TimePicker
                    value={value()}
                    defaultOpen
                    {...normalList}
                    timeZone="Asia/Shanghai"
                    use12Hours
                    onChange={(v, str) => {
                        onChange(v, str);
                        setValue(str);
                    }}
                />
            );
        }
        render(() => <Controlled />);
        clickItem('hour', 3);
        clickItem('ampm', 1);
        expect(lastCall<DateFirstOnChange>(onChange)[1]).toBe('下午 3:00:00');
        expect(getInput()).toHaveValue('下午 3:00:00');
    });

    it('timeRange + use12Hours 无值时右面板显示下午，先选分钟得到的也是下午', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ type: 'timeRange', use12Hours: true, defaultOpen: true, ...normalList, onChange });
        const rightPanel = getPanels()[1];
        expect(getSelectedText('ampm', rightPanel)).toBe('下午');
        clickItem('minute', 5, rightPanel);
        expect((lastCall<DateFirstOnChange>(onChange)[0] as Date[])[1].getHours()).toBeGreaterThanOrEqual(12);
    });

    it('timeRange 只键入一侧时值与字符串都有两项，失焦后输入框带分隔符', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ type: 'timeRange', onChange });
        focusInput();
        typeText('10:00:00');
        const [value, str] = lastCall<DateFirstOnChange>(onChange) as [Date[], string[]];
        expect(value).toHaveLength(2);
        expect(value[1]).toBeUndefined();
        expect(str).toEqual(['10:00:00', '']);
        blurInput();
        expect(getInput()).toHaveValue('10:00:00 ~ ');
    });

    it('timeRange 键入超过两段时标为无效，不调用 onChange', () => {
        const onChange = vi.fn<DateFirstOnChange>();
        renderTimePicker({ type: 'timeRange', onChange });
        focusInput();
        typeText('10:00:00 ~ 11:00:00 ~ 12:00:00');
        expect(isInvalid()).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('全局 Input 默认值不给 TimePicker 输入框加前缀与标签', () => {
    const globalInput = { prefix: 'mark-prefix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' };

    it('不读取全局 Input 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: globalInput };
        const { container } = render(() => <TimePicker defaultValue="10:00:00" />);
        expect(container.textContent).not.toMatch(/mark-/);
    });

    it('前缀仍读取 TimePicker 自己的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: globalInput, TimePicker: { prefix: 'mark-prefix-host' } };
        const { container } = render(() => <TimePicker defaultValue="10:00:00" />);
        expect(container.textContent).toContain('mark-prefix-host');
        expect(container.textContent).not.toMatch(/mark-(label|before|after)/);
    });
});
