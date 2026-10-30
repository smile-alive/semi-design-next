/** @jsxImportSource vue */
import { createApp, createSSRApp, defineComponent, KeepAlive, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { format } from 'date-fns';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners, endLeaveAnimations, render } from '@test/utils/vue';
import TimePicker, { type TimePickerEmits, type TimePickerHandle, type TimePickerProps, type TimePickerSlots, type TimePickerTriggerSlotProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import Popover from '../../popover';
import Combobox from '../combobox.vue';
import type { ComboboxHandle, TimePickerScrollItemProps } from '../interface';
import ControlledOpen from './fixtures/controlled-open.vue';
import Model from './fixtures/model.vue';

type ChangeFn = (...args: TimePickerEmits['change']) => void;
type OpenChangeFn = (...args: TimePickerEmits['openChange']) => void;
type FocusFn = (...args: TimePickerEmits['focus']) => void;
type BlurFn = (...args: TimePickerEmits['blur']) => void;
type Slots = Record<string, (scope: Record<string, unknown>) => unknown>;

const prefixCls = `${BASE_CLASS_PREFIX}-timepicker`;
const scrollListCls = `${BASE_CLASS_PREFIX}-scrolllist`;
const normalList = { scrollItemProps: { cycled: false, mode: 'normal' as const } };

const settle = () => new Promise((resolve) => setTimeout(resolve));
async function renderTimePicker(props: Record<string, unknown> = {}, slots: Slots = {}) {
    const view = render(TimePicker, { props, slots: slots as never });
    await settle();
    return {
        ...view,
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
}
async function renderNode(node: () => unknown) {
    const view = render(defineComponent({ render: node as () => never }));
    await settle();
    return view;
}
// Testing Library re-inserts the mounted nodes, which drops the focus taken while mounting
async function mountInPlace(node: () => unknown) {
    const container = document.body.appendChild(document.createElement('div'));
    const app = createApp(defineComponent({ render: node as () => never }));
    app.mount(container);
    onTestFinished(() => {
        app.unmount();
        container.remove();
    });
    await settle();
}

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`) as HTMLInputElement;
const getPanels = () => Array.from(document.querySelectorAll<HTMLElement>(`.${scrollListCls}`));
const getList = (type: string, panel: ParentNode = document) => panel.querySelector<HTMLElement>(`.${prefixCls}-panel-list-${type}`) as HTMLElement;
const getItems = (type: string, panel?: ParentNode) => Array.from(getList(type, panel).querySelectorAll('li'));
const getSelectedText = (type: string, panel?: ParentNode) => getList(type, panel).querySelector(`.${scrollListCls}-item-sel`)?.textContent;
async function clickItem(type: string, index: number, panel?: ParentNode) {
    await fireEvent.click(getItems(type, panel)[index]);
    await settle();
}
async function clickOutside() {
    await fireEvent.mouseDown(document.body);
    await settle();
}
// jsdom runs no CSS animations, so end the leave animation the way a browser would
const waitForClosed = () =>
    waitFor(() => {
        endLeaveAnimations();
        expect(getPanels()).toHaveLength(0);
    });
async function focusInput() {
    getInput().focus();
    await settle();
}
async function blurInput() {
    getInput().blur();
    await settle();
}
async function typeText(value: string) {
    await fireEvent.update(getInput(), value);
    await settle();
}
const lastCall = <T extends (...args: never[]) => unknown>(spy: { mock: { calls: Parameters<T>[] } }) => spy.mock.calls[spy.mock.calls.length - 1];
function hms(date: unknown) {
    const d = date as Date;
    return [d.getHours(), d.getMinutes(), d.getSeconds()];
}
const dates = (value: unknown) => value as Date[];

describe('TimePicker', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('TimePicker 外观', async () => {
        const onFocus = vi.fn<FocusFn>();
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker(
            {
                onChange,
                onFocus,
                defaultOpen: true,
                scrollItemProps: { mode: 'wheel', cycled: false },
                format: 'HH:mm:ss',
                defaultValue: '10:24:18',
            },
            { panelHeader: () => <strong>Select Time</strong>, panelFooter: () => <strong>Select Time</strong> }
        );

        expect(getPanels()).toHaveLength(1);
        expect(document.querySelectorAll(`.${prefixCls}`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${scrollListCls}-header`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${scrollListCls}-footer`)).toHaveLength(1);
        expect(getInput()).toHaveValue('10:24:18');

        await fireEvent.click(getList('minute').querySelector(`.${scrollListCls}-list-outer ul li`) as HTMLElement);
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        const [selectedDate, selectedStr] = onChange.mock.calls[0];
        expect(hms(selectedDate)).toEqual([10, 0, 18]);
        expect(selectedStr).toBe('10:00:18');
        await waitFor(() => expect(getInput()).toHaveValue('10:00:18'));

        await focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);

        await typeText('10:18:18');
        expect((lastCall<ChangeFn>(onChange)[0] as Date).getMinutes()).toBe(18);
        expect(lastCall<ChangeFn>(onChange)[1]).toBe('10:18:18');

        await fireEvent.mouseDown(document.querySelector(`.${scrollListCls}`) as HTMLElement);
        expect(getPanels()).toHaveLength(1);

        await clickOutside();
        await waitForClosed();
        expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
        expect(typeof onChange.mock.calls[0][1]).toBe('string');
    });

    it('在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        const nested = () => (
            <Popover ariaLabel="Nested" motion={false} trigger="click">
                {{
                    default: () => <button type="button">nested trigger</button>,
                    content: () => <button type="button">inside nested</button>,
                }}
            </Popover>
        );
        await renderTimePicker({ defaultOpen: true, motion: false }, { panelFooter: nested });
        await fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        await waitForClosed();
    });

    it('受控 modelValue', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({
            onChange,
            defaultOpen: true,
            scrollItemProps: { cycled: false },
            format: 'HH:mm:ss',
            modelValue: '10:24:18',
        });

        await typeText('10:18:18');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getSelectedText('minute')).toBe('24分');

        await focusInput();
        await blurInput();
        expect(getInput()).toHaveValue('10:24:18');
    });

    it('v-model 与 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderNode(() => <Model initValue="10:24:18" defaultOpen format="HH:mm:ss" scrollItemProps={{ cycled: false }} onChange={onChange} />);

        await typeText('10:18:18');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getSelectedText('minute')).toBe('18分');
        expect(getInput()).toHaveValue('10:18:18');
    });

    it('受控 open', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderNode(() => <ControlledOpen modelValue="10:24:18" format="HH:mm:ss" motion={false} scrollItemProps={{ cycled: false }} onOpenChange={onOpenChange} />);
        expect(getPanels()).toHaveLength(1);

        await userEvent.click(screen.getByRole('button', { name: 'close' }));
        await settle();
        expect(getPanels()).toHaveLength(0);
        expect(onOpenChange).not.toHaveBeenCalled();

        await fireEvent.focusIn(getInput());
        await settle();
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(getPanels()).toHaveLength(1);

        await clickOutside();
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        await waitForClosed();
    });

    it('范围选择器外观', async () => {
        const onChange = vi.fn<ChangeFn>();
        await mountInPlace(() => (
            <TimePicker use12Hours focusOnOpen format="a hh:mm" type="timeRange" defaultValue={['上午 10:12', '上午 11:08']} onChange={onChange} scrollItemProps={{ cycled: false, mode: 'normal' }} defaultOpen>
                {{
                    panelHeader: ({ index }: { index: number }) => (index === 0 ? 'start header' : 'end header'),
                    panelFooter: ({ index }: { index: number }) => (index === 0 ? 'start footer' : 'end footer'),
                }}
            </TimePicker>
        ));

        const [start, end] = getPanels();
        expect(getPanels()).toHaveLength(2);
        expect(start.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^start header$/);
        expect(start.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^start footer$/);
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^end header$/);
        expect(end.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^end footer$/);
        await waitFor(() => expect(getInput()).toHaveFocus());

        const hourLis = getItems('hour', start);
        expect(hourLis).toHaveLength(12);
        await fireEvent.click(hourLis[9]);

        const [value, str] = lastCall<ChangeFn>(onChange);
        expect(dates(value)[0].getHours()).toBe(9);
        expect(str).toEqual(['上午 09:12', '上午 11:08']);
        await waitFor(() => expect(getInput()).toHaveValue('上午 09:12 ~ 上午 11:08'));
    });

    it('点击清空', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', showClear: true, onChange });

        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]).toEqual([undefined, '']);
        expect(getInput()).toHaveValue('');
    });

    it('#trigger 内按钮聚焦时 Enter 按下该按钮', async () => {
        const onPress = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderTimePicker({}, { trigger: () => <button type="button" aria-label="清除" onClick={onPress} /> });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getPanels()).toHaveLength(0);
    });

    it('disabled 属性', async () => {
        await renderTimePicker({ disabled: true, defaultValue: '10:23:15', defaultOpen: true });

        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
        expect(getPanels()).toHaveLength(0);
    });

    it('placeholder 属性', async () => {
        await renderTimePicker({ placeholder: '请选择时间' });
        expect(screen.getByPlaceholderText('请选择时间')).toBe(getInput());
    });

    it('format 属性', async () => {
        await renderTimePicker({ format: 'HH:mm', defaultValue: '10:23' });
        expect(getInput()).toHaveValue('10:23');
    });

    it('hourStep、minuteStep 和 secondStep', async () => {
        await renderTimePicker({
            hourStep: 2,
            minuteStep: 15,
            secondStep: 30,
            defaultOpen: true,
            scrollItemProps: { cycled: false },
        });

        expect(getPanels()).toHaveLength(1);
        expect(getItems('hour')).toHaveLength(12);
        expect(getItems('hour')[1]).toHaveTextContent(/^02$/);
        expect(getItems('minute').map((li) => li.textContent?.trim())).toEqual(['00分', '15', '30', '45']);
        expect(getItems('second').map((li) => li.textContent?.trim())).toEqual(['00秒', '30']);
    });

    it('autofocus 挂载后聚焦输入框并打开面板', async () => {
        const onFocus = vi.fn<FocusFn>();
        await mountInPlace(() => <TimePicker autofocus onFocus={onFocus} />);

        await waitFor(() => expect(getInput()).toHaveFocus());
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('hourStep、minuteStep、secondStep 不是正整数时渲染面板抛错', async () => {
        const errorHandler = vi.fn<(error: unknown) => void>();
        render(TimePicker, { global: { config: { errorHandler } }, props: { hourStep: 0, defaultOpen: true } });
        await settle();
        const error = errorHandler.mock.calls[0]?.[0];
        expect(error).toBeInstanceOf(RangeError);
        expect(String(error)).toContain('hourStep');
    });

    it('validateStatus 属性', async () => {
        const error = await renderTimePicker({ validateStatus: 'error', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
        error.unmount();

        await renderTimePicker({ validateStatus: 'warning', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('#prefix 和 #insetLabel', async () => {
        await renderTimePicker({}, { prefix: () => <span class="custom-prefix">前缀</span>, insetLabel: () => '时间' });

        expect(screen.getByText('前缀')).toHaveClass('custom-prefix');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-inset-label`)).not.toBeNull();
    });

    it('borderless 属性', async () => {
        await renderTimePicker({ borderless: true, defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
        expect(getRoot()).not.toHaveClass(`${BASE_CLASS_PREFIX}-input-borderless`);
    });

    it('size 属性', async () => {
        const small = await renderTimePicker({ size: 'small', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        small.unmount();

        await renderTimePicker({ size: 'large', defaultValue: '10:23:15' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-large`)).not.toBeNull();
    });

    it('blur 事件', async () => {
        const onBlur = vi.fn<BlurFn>();
        await renderTimePicker({ onBlur, defaultValue: '10:23:15' });

        await focusInput();
        expect(getPanels()).toHaveLength(1);
        await blurInput();
        expect(onBlur).not.toHaveBeenCalled();

        await clickOutside();
        expect(onBlur).toHaveBeenCalledTimes(1);
        await waitForClosed();
    });

    it('blur 收到点击外部的原生 mousedown 事件', async () => {
        const onBlur = vi.fn<BlurFn>();
        await renderTimePicker({ defaultOpen: true, onBlur });

        await clickOutside();
        expect(onBlur).toHaveBeenCalledTimes(1);
        const [event] = onBlur.mock.calls[0];
        expectTypeOf(event).toEqualTypeOf<MouseEvent>();
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event.type).toBe('mousedown');
        await waitForClosed();
    });

    it('disabledHours、disabledMinutes 和 disabledSeconds', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({
            disabledHours: () => [0, 1, 2],
            disabledMinutes: () => [0, 15, 30, 45],
            disabledSeconds: () => [0, 30],
            onChange,
            defaultOpen: true,
            scrollItemProps: { cycled: false },
        });

        const disabledIndexes = (type: string) =>
            getItems(type)
                .map((li, index) => (li.getAttribute('aria-disabled') === 'true' ? index : null))
                .filter((index) => index !== null);
        expect(disabledIndexes('hour')).toEqual([0, 1, 2]);
        expect(disabledIndexes('minute')).toEqual([0, 15, 30, 45]);
        expect(disabledIndexes('second')).toEqual([0, 30]);
        expect(getItems('hour')[0]).toHaveClass(`${scrollListCls}-item-disabled`);

        await clickItem('hour', 1);
        expect(onChange).not.toHaveBeenCalled();
        await clickItem('hour', 3);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('hideDisabledOptions 属性', async () => {
        await renderTimePicker({
            disabledHours: () => [0, 1, 2, 3, 4, 5],
            hideDisabledOptions: true,
            defaultOpen: true,
            scrollItemProps: { cycled: false },
        });

        expect(getItems('hour')).toHaveLength(18);
        expect(getItems('hour')[0]).toHaveTextContent(/^06$/);
    });

    it('无值时分钟和秒列按 0 点标记禁用项，与选中后得到的时间一致', async () => {
        await renderTimePicker({
            disabledMinutes: (hour: number) => (hour === 0 ? [5] : []),
            disabledSeconds: (hour: number, minute: number) => (hour === 0 && minute === 0 ? [7] : []),
            defaultOpen: true,
            scrollItemProps: { cycled: false },
        });

        expect(getItems('minute')[5]).toHaveAttribute('aria-disabled', 'true');
        expect(getItems('second')[7]).toHaveAttribute('aria-disabled', 'true');
    });

    it('不含秒的 format（HH:mm）', async () => {
        await renderTimePicker({ format: 'HH:mm', defaultValue: '10:23', defaultOpen: true, ...normalList });
        expect(getPanels()).toHaveLength(1);
        expect(getList('hour')).not.toBeNull();
        expect(getList('minute')).not.toBeNull();
        expect(getList('second')).toBeNull();
    });

    it('只含小时的 format（HH）', async () => {
        await renderTimePicker({ format: 'HH', defaultValue: '10', defaultOpen: true, ...normalList });
        expect(getPanels()).toHaveLength(1);
        expect(getSelectedText('hour')).toBe('10时');
        expect(getList('minute')).toBeNull();
        expect(getList('second')).toBeNull();
    });

    it('#trigger 自定义触发器', async () => {
        await renderTimePicker(
            { defaultValue: '10:23:15', placeholder: 'Select Time' },
            {
                trigger: ({ placeholder }) => (
                    <button class="custom-trigger" type="button">
                        {String(placeholder)}
                    </button>
                ),
            }
        );

        const customTrigger = screen.getByRole('button', { name: 'Select Time' });
        expect(customTrigger).toHaveClass('custom-trigger');
        expect(getInput()).toBeNull();
        expect(getPanels()).toHaveLength(0);

        await userEvent.click(customTrigger);
        await settle();
        expect(getPanels()).toHaveLength(1);
    });

    describe('use12Hours', () => {
        const props = { use12Hours: true, format: 'a hh:mm:ss', defaultOpen: true, ...normalList };

        it('AM/PM 选择', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '上午 10:23:15', onChange });
            expect(getItems('ampm').map((li) => li.textContent?.trim())).toEqual(['上午', '下午']);

            await clickItem('ampm', 1);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([22, 23, 15]);
            expect(onChange.mock.calls[0][1]).toBe('下午 10:23:15');
        });

        it('从 PM 切换到 AM', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 02:23:15', onChange });
            await clickItem('ampm', 0);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([2, 23, 15]);
            expect(getInput()).toHaveValue('上午 02:23:15');
        });

        it('小时选择：12 AM 是 0 点', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '上午 10:23:15', onChange });
            await clickItem('hour', 0);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([0, 23, 15]);
            expect(getInput()).toHaveValue('上午 12:23:15');
        });

        it('PM 的小时选择', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 02:23:15', onChange });
            expect(getItems('hour')).toHaveLength(12);
            await clickItem('hour', 5);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([17, 23, 15]);
        });

        it('AM 时选择 12 点后的 1 点', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '上午 12:00:00', onChange });
            expect(getSelectedText('hour')).toBe('12时');
            await clickItem('hour', 1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([1, 0, 0]);
        });

        it('PM 模式选择 12 点后的 1 点', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 12:00:00', onChange });
            expect(getSelectedText('hour')).toBe('12时');
            await clickItem('hour', 1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([13, 0, 0]);
        });

        it('小时 >= 12 时从 PM 切换到 AM', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 01:00:00', onChange });
            await clickItem('ampm', 0);
            expect(hms(onChange.mock.calls[0][0])).toEqual([1, 0, 0]);
        });

        it('小时 < 12 时切换到 PM', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '上午 10:00:00', onChange });
            await clickItem('ampm', 1);
            expect(hms(onChange.mock.calls[0][0])).toEqual([22, 0, 0]);
        });

        it('PM 模式下小时变化时计算正确的小时', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 03:30:00', onChange });
            await clickItem('hour', 5);
            expect(hms(onChange.mock.calls[0][0])).toEqual([17, 30, 0]);
            expect(onChange.mock.calls[0][1]).toBe('下午 05:30:00');
        });

        it('PM 模式下选择值为 7 的小时', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '下午 05:30:00', onChange });
            await clickItem('hour', 7);
            expect(hms(onChange.mock.calls[0][0])).toEqual([19, 30, 0]);
        });

        const disabledHourTexts = () =>
            getItems('hour')
                .filter((li) => li.getAttribute('aria-disabled') === 'true')
                .map((li) => li.textContent?.trim().slice(0, 2));
        const hourItem = (hour: string) => getItems('hour').find((li) => li.textContent?.trim().startsWith(hour)) as HTMLElement;

        it('disabledHours 按当前半天映射到 12 小时制的标记', async () => {
            await renderTimePicker({ ...props, disabledHours: () => [0, 13], defaultValue: '下午 02:23:15' });
            expect(disabledHourTexts()).toEqual(['01']);
        });

        it('下午面板不标记上午的 1 点', async () => {
            await renderTimePicker({ ...props, disabledHours: () => [1], defaultValue: '下午 02:23:15' });
            expect(disabledHourTexts()).toEqual([]);
        });

        it('上午面板中 0 点标记为 12 点禁用，12 点（中午）不受影响', async () => {
            await renderTimePicker({ ...props, disabledHours: () => [0, 12], defaultValue: '上午 10:23:15' });
            expect(disabledHourTexts()).toEqual(['12']);
        });

        it('上午面板不标记 12 点（中午）', async () => {
            await renderTimePicker({ ...props, disabledHours: () => [12], defaultValue: '上午 10:23:15' });
            expect(disabledHourTexts()).toEqual([]);
        });

        it('hideDisabledOptions 在上午面板隐藏被禁用的 12 点', async () => {
            await renderTimePicker({
                ...props,
                disabledHours: () => [0],
                hideDisabledOptions: true,
                defaultValue: '上午 10:23:15',
            });
            expect(getItems('hour').map((li) => li.textContent?.trim().slice(0, 2))).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
        });

        it('非受控键入下午时间后点小时仍保持在下午', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, defaultValue: '上午 08:23:15', onChange });
            await typeText('下午 10:23:15');
            expect(getSelectedText('ampm')).toBe('下午');
            await fireEvent.click(hourItem('09'));
            expect(hms(lastCall<ChangeFn>(onChange)[0])).toEqual([21, 23, 15]);
        });

        it('受控 modelValue 由外部改为下午后上下午列选中下午，点小时保持在下午', async () => {
            const onChange = vi.fn<ChangeFn>();
            const view = await renderTimePicker({ ...props, modelValue: new Date(2021, 5, 1, 9, 0, 0), onChange });
            expect(getSelectedText('ampm')).toBe('上午');
            await view.rerender({ modelValue: new Date(2021, 5, 1, 21, 0, 0) });
            expect(getSelectedText('ampm')).toBe('下午');
            await fireEvent.click(hourItem('10'));
            expect(hms(lastCall<ChangeFn>(onChange)[0])).toEqual([22, 0, 0]);
        });

        it('timeRange 无值时右面板默认下午，选小时得到下午时间', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ ...props, type: 'timeRange', onChange });
            const [left, right] = getPanels();
            expect(getSelectedText('ampm', left)).toBe('上午');
            expect(getSelectedText('ampm', right)).toBe('下午');
            await clickItem('hour', 3, right);
            expect(hms(dates(lastCall<ChangeFn>(onChange)[0])[1])).toEqual([15, 0, 0]);
        });
    });

    it('秒的选择', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({
            format: 'HH:mm:ss',
            defaultValue: '10:23:15',
            defaultOpen: true,
            onChange,
            ...normalList,
        });
        await clickItem('second', 0);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('10:23:00');
        expect(getSelectedText('second')).toBe('00秒');
    });

    it('timeRange 类型同时显示两个面板', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({
            type: 'timeRange',
            defaultValue: ['10:00:00', '12:00:00'],
            defaultOpen: true,
            onChange,
            ...normalList,
        });

        const panels = getPanels();
        expect(panels).toHaveLength(2);
        await clickItem('hour', 5, panels[1]);

        expect(onChange).toHaveBeenCalledTimes(1);
        const [value, str] = lastCall<ChangeFn>(onChange);
        expect(dates(value).map(hms)).toEqual([
            [10, 0, 0],
            [5, 0, 0],
        ]);
        expect(str).toEqual(['10:00:00', '05:00:00']);
    });

    it('timeRange 第二个面板变化', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({
            type: 'timeRange',
            defaultValue: ['10:00:00', '14:00:00'],
            defaultOpen: true,
            onChange,
            ...normalList,
        });
        await clickItem('minute', 30, getPanels()[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toEqual(['10:00:00', '14:30:00']);
        expect(getInput()).toHaveValue('10:00:00 ~ 14:30:00');
    });

    it('modelValue 为 undefined 按非受控处理，受控值变回 undefined 时清空', async () => {
        const view = await renderTimePicker({ modelValue: undefined, defaultValue: '10:23:15' });
        expect(getInput()).toHaveValue('10:23:15');
        await typeText('11:30:00');
        expect(getInput()).toHaveValue('11:30:00');

        await view.rerender({ modelValue: '12:00:00' });
        expect(getInput()).toHaveValue('12:00:00');
        await view.rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('');
    });

    it('受控 modelValue 变化时光标留在原处', async () => {
        const view = await renderTimePicker({ modelValue: '10:23:15', ...normalList, defaultOpen: true });

        getInput().setSelectionRange(2, 2);
        await focusInput();
        await view.rerender({ modelValue: '11:30:00' });

        expect(getInput()).toHaveValue('11:30:00');
        expect(getInput().selectionStart).toBe(2);
        expect(getSelectedText('hour')).toBe('11时');
    });

    it('timeZone 变化时按新时区显示同一时刻', async () => {
        const view = await renderTimePicker({ defaultValue: '10:23:15', timeZone: 'Asia/Shanghai' });
        expect(getInput()).toHaveValue('10:23:15');
        await view.rerender({ timeZone: 'America/New_York' });
        expect(getInput()).toHaveValue('22:23:15');
    });

    it('stopPropagation 属性', async () => {
        // Vue has no component-tree bubbling through Teleport, so check the popup's events at the document
        const onClick = vi.fn<(event: Event) => void>();
        const onMouseDown = vi.fn<(event: Event) => void>();
        document.addEventListener('click', onClick);
        document.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => {
            document.removeEventListener('click', onClick);
            document.removeEventListener('mousedown', onMouseDown);
        });
        const view = await renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, stopPropagation: true });
        await fireEvent.mouseDown(getPanels()[0]);
        await fireEvent.click(getPanels()[0]);
        expect(onClick).not.toHaveBeenCalled();
        expect(onMouseDown).not.toHaveBeenCalled();

        await view.rerender({ stopPropagation: false });
        await fireEvent.mouseDown(getPanels()[0]);
        await fireEvent.click(getPanels()[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(getPanels()).toHaveLength(1);
    });

    it('position 属性', async () => {
        await renderTimePicker({ defaultValue: '10:23:15', position: 'top', defaultOpen: true });
        expect(document.querySelector('[x-placement]')).toHaveAttribute('x-placement', 'top');
    });

    it('ConfigProvider 的 rtl 方向下默认位置为 bottomRight', async () => {
        await renderNode(() => <ConfigProvider direction="rtl">{() => <TimePicker defaultOpen motion={false} />}</ConfigProvider>);
        expect(document.querySelector('[x-placement]')).toHaveAttribute('x-placement', 'bottomRight');
    });

    it('inputReadOnly 属性', async () => {
        await renderTimePicker({ defaultValue: '10:23:15', inputReadOnly: true });
        expect(getInput()).toHaveAttribute('readonly');
        expect(document.querySelector(`.${prefixCls}-input-readonly`)).not.toBeNull();
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', inputReadOnly: true, showClear: true, onChange });

        expect(getInput()).toHaveAttribute('readonly');
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it('#panel 在范围模式下将每项显示为面板的头部和底部', async () => {
        await renderTimePicker(
            { type: 'timeRange', defaultOpen: true },
            {
                panelHeader: ({ index }) => (index === 0 ? 'start header' : 'end header'),
                panelFooter: ({ index }) => (index === 0 ? 'start footer' : 'end footer'),
                panel: ({ index }) => (index === 0 ? 'start panel' : 'end panel'),
            }
        );

        const [start, end] = getPanels();
        for (const [panel, text] of [
            [start, 'start panel'],
            [end, 'end panel'],
        ] as const) {
            expect(panel.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(new RegExp(`^${text}$`));
            expect(panel.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(new RegExp(`^${text}$`));
        }
    });

    it('#panel 渲染元素，无内容的下标回退到 #panelHeader 与 #panelFooter', async () => {
        await renderTimePicker(
            { type: 'timeRange', defaultOpen: true },
            {
                panelHeader: ({ index }) => (index === 0 ? 'start header' : 'end header'),
                panelFooter: ({ index }) => (index === 0 ? 'start footer' : 'end footer'),
                panel: ({ index }) => (index === 0 ? <button type="button">now</button> : null),
            }
        );

        const [start, end] = getPanels();
        for (const slot of ['header', 'footer']) {
            const area = start.querySelector<HTMLElement>(`.${scrollListCls}-${slot}`) as HTMLElement;
            expect(within(area).getByRole('button', { name: 'now' })).toBeInTheDocument();
        }
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^end header$/);
        expect(end.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^end footer$/);
    });

    it('#panel 在单选模式下忽略', async () => {
        await renderTimePicker({ defaultOpen: true }, { panelHeader: () => 'header', panel: () => <button type="button">now</button> });
        expect(getPanels()[0].querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^header$/);
        expect(screen.queryByRole('button', { name: 'now' })).toBeNull();
        expect(getPanels()[0].querySelector(`.${scrollListCls}-footer`)).toBeNull();
    });

    it('#panelHeader、#panelFooter 带 index；范围模式没给头部时回落语言包的开始与结束', async () => {
        const single = await renderTimePicker(
            { defaultOpen: true },
            {
                panelHeader: ({ index }) => `header ${String(index)}`,
                panelFooter: ({ index }) => `footer ${String(index)}`,
            }
        );
        expect(getPanels()[0].querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^header 0$/);
        expect(getPanels()[0].querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^footer 0$/);
        single.unmount();

        await renderNode(() => (
            <ConfigProvider locale={en_US}>
                {() => (
                    <TimePicker type="timeRange" defaultOpen>
                        {{ panelFooter: () => [] }}
                    </TimePicker>
                )}
            </ConfigProvider>
        ));
        const [start, end] = getPanels();
        expect(start.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(en_US.TimePicker.begin);
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(en_US.TimePicker.end);
        expect(start.querySelector(`.${scrollListCls}-footer`)).toBeNull();
    });

    it('preventScroll 属性', async () => {
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        await renderTimePicker({ defaultValue: '10:23:15', preventScroll: true, focusOnOpen: true });
        await waitFor(() => expect(focus).toHaveBeenCalledWith({ preventScroll: true }));
    });

    it('@keydown 经 attrs 到达输入框', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderTimePicker({ onKeydown, defaultValue: '10:23:15' });
        await fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('Enter');
    });

    it('在 LocaleProvider 内使用其语言包', async () => {
        await renderNode(() => <LocaleProvider locale={en_US}>{() => <TimePicker defaultValue="10:23:15" defaultOpen {...normalList} />}</LocaleProvider>);
        expect(getRoot()).not.toBeNull();
        expect(getInput()).toHaveValue('10:23:15');
        expect(getSelectedText('hour')).toBe(`10${en_US.TimePicker.hour}`);
        expect(getInput()).toHaveAttribute('placeholder', en_US.TimePicker.placeholder.time);
    });

    it('受控 open 在外部点击时请求关闭，直到持有方关闭才会收起', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onOpenChange, open: true });
        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        expect(getPanels()).toHaveLength(1);
    });

    it('关闭或卸载后停止监听外部点击', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const view = await renderTimePicker({ defaultValue: '10:23:15', onOpenChange, defaultOpen: true });
        await clickOutside();
        await waitForClosed();
        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);

        await focusInput();
        view.unmount();
        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false], [true]]);
    });

    it('重新打开后外部点击仍能关闭', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onOpenChange });

        await focusInput();
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        await blurInput();
        await waitForClosed();

        await focusInput();
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    });

    it('不含小时的 format（mm:ss）', async () => {
        await renderTimePicker({ format: 'mm:ss', defaultValue: '23:15', defaultOpen: true, ...normalList });
        expect(getList('hour')).toBeNull();
        expect(getSelectedText('minute')).toBe('23分');
        expect(getSelectedText('second')).toBe('15秒');
    });

    it('面板选择后输入框与面板同步', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onChange, ...normalList });
        await clickItem('minute', 30);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('10:30:15');
        expect(getSelectedText('minute')).toBe('30分');
    });

    it('键入时光标留在键入结束处', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onChange, defaultOpen: true });
        await userEvent.type(getInput(), '30', { initialSelectionStart: 3, initialSelectionEnd: 5 });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('10:30:15');
        expect(getInput().selectionStart).toBe(5);
    });

    it('motion 为 false 时立即移除面板', async () => {
        await renderTimePicker({ defaultValue: '10:23:15', motion: false, defaultOpen: true });
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        expect(getPanels()).toHaveLength(0);
    });

    it('rangeSeparator 属性', async () => {
        await renderTimePicker({ type: 'timeRange', defaultValue: ['10:00:00', '12:00:00'], rangeSeparator: ' - ' });
        expect(getInput()).toHaveValue('10:00:00 - 12:00:00');
    });

    it('focusOnOpen 属性', async () => {
        const onFocus = vi.fn<FocusFn>();
        await mountInPlace(() => <TimePicker defaultValue="10:23:15" focusOnOpen onFocus={onFocus} />);
        await waitFor(() => expect(getInput()).toHaveFocus());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPanels()).toHaveLength(1));
    });

    it('class 和 style 落在根元素', async () => {
        await renderTimePicker({ defaultValue: '10:23:15', class: 'custom-timepicker', style: { width: '200px' } });
        expect(getRoot()).toHaveClass('custom-timepicker');
        expect(getRoot()).toHaveStyle({ width: '200px' });
        expect(getInput()).not.toHaveClass('custom-timepicker');
    });

    it('popupStyle 落在弹层上', async () => {
        await renderTimePicker({
            defaultValue: '10:23:15',
            popupStyle: { backgroundColor: 'white' },
            defaultOpen: true,
        });
        expect(document.querySelector('[x-placement]')).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    it('快速开关面板', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onOpenChange });

        for (let i = 0; i < 5; i++) {
            await focusInput();
            await clickOutside();
            await blurInput();
        }
        expect(onOpenChange).toHaveBeenCalledTimes(10);

        await focusInput();
        expect(getPanels()).toHaveLength(1);
        onOpenChange.mockClear();
        await clickOutside();
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        await waitForClosed();
    });

    it('未关闭就再次聚焦只打开一次', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const onFocus = vi.fn<FocusFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onOpenChange, onFocus });

        await fireEvent.focusIn(getInput());
        await fireEvent.focusIn(getInput());
        await settle();

        expect(getPanels()).toHaveLength(1);
        expect(onFocus).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('defaultOpen 后聚焦不再请求打开', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onOpenChange });
        expect(getPanels()).toHaveLength(1);

        await focusInput();
        expect(getPanels()).toHaveLength(1);
        expect(onOpenChange).not.toHaveBeenCalled();

        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    it('面板打开时点击 #trigger 触发器', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderTimePicker(
            { defaultValue: '10:23:15', defaultOpen: true, onOpenChange },
            {
                trigger: ({ inputValue, placeholder }) => (
                    <button class="custom-trigger" type="button">
                        {String(inputValue || placeholder)}
                    </button>
                ),
            }
        );
        expect(getPanels()).toHaveLength(1);

        await fireEvent.click(screen.getByRole('button', { name: '10:23:15' }));
        await settle();
        expect(getPanels()).toHaveLength(1);
        expect(onOpenChange).not.toHaveBeenCalled();

        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    describe('v-model 回归用例', () => {
        const renderModel = (props: Record<string, unknown>, wrap?: (node: () => unknown) => () => unknown) => {
            const node = () => <Model {...normalList} defaultOpen {...props} />;
            return renderNode(wrap ? wrap(node) : node);
        };

        it('Fix1604（#1617）：带 timeZone 的受控选择器显示面板中选择的时间', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const onChange = vi.fn<ChangeFn>();
            await renderModel({ timeZone: 0, onChange });
            await clickItem('hour', 7);

            expect((lastCall<ChangeFn>(onChange)[0] as Date).getUTCHours()).toBe(7);
            expect(getInput().value.startsWith('07:')).toBe(true);
            expect(getSelectedText('hour')).toBe('07时');
        });

        it('Fix1716（#1717）：空值的受控范围与非受控一样填充开始时间', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const uncontrolled = await renderTimePicker({ ...normalList, type: 'timeRange', defaultOpen: true });
            await clickItem('hour', 7, getPanels()[0]);
            const expected = getInput().value;
            uncontrolled.unmount();

            const onChange = vi.fn<ChangeFn>();
            await renderModel({ type: 'timeRange', initValue: [], onChange });
            await clickItem('hour', 7, getPanels()[0]);
            expect(getInput()).toHaveValue(expected);
            expect(dates(lastCall<ChangeFn>(onChange)[0])[0].getHours()).toBe(7);
        });

        it('Fix2082（#2083）：timeZone 和 disabledHours 校验显示的小时，而非本地小时', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            // 07:xx at UTC+10 is 05:xx in the Asia/Shanghai test zone, which disabledHours rejects
            await renderModel({ disabledHours: () => [5], format: 'HH:mm', initValue: new Date() }, (node) => () => <ConfigProvider timeZone={10}>{node}</ConfigProvider>);
            await clickItem('hour', 7);
            await clickItem('minute', 10);
            await clickOutside();
            expect(getInput()).toHaveValue('07:10');
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).toBeNull();
        });

        it('Fix2375（#2376）：先选结束时间，开始时间保持为空', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const onChange = vi.fn<ChangeFn>();
            await renderModel({ type: 'timeRange', onChange });
            await clickItem('hour', 7, getPanels()[1]);

            const [, str] = lastCall<ChangeFn>(onChange);
            const strs = str as string[];
            expect(strs[0]).toBe('');
            expect(strs[1].startsWith('07:')).toBe(true);
            expect(getInput()).toHaveValue(` ~ ${strs[1]}`);
            expect(getSelectedText('hour', getPanels()[1])).toBe('07时');
        });

        it('范围只选一侧：两侧对称，空的一侧为 undefined，输入框不标记无效', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const onChange = vi.fn<ChangeFn>();
            const view = await renderTimePicker({ ...normalList, type: 'timeRange', defaultOpen: true, onChange });
            await clickItem('hour', 7, getPanels()[0]);
            const [start, startStr] = lastCall<ChangeFn>(onChange);
            expect(dates(start)).toHaveLength(2);
            expect(dates(start)[1]).toBeUndefined();
            expect(startStr).toEqual(['07:00:00', '']);
            expect(getInput()).toHaveValue('07:00:00 ~ ');
            view.unmount();

            onChange.mockClear();
            await renderTimePicker({ ...normalList, type: 'timeRange', defaultOpen: true, onChange });
            await clickItem('hour', 7, getPanels()[1]);
            await clickItem('hour', 8, getPanels()[1]);
            const [end, endStr] = lastCall<ChangeFn>(onChange);
            expect(dates(end)[0]).toBeUndefined();
            expect(endStr).toEqual(['', '08:00:00']);
            expect(getInput()).toHaveValue(' ~ 08:00:00');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
        });

        it('受控范围只选开始时间：输入框显示「开始 ~ 」且不标记无效，带 timeZone 时同样上报空的一侧', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const onChange = vi.fn<ChangeFn>();
            const view = await renderModel({ type: 'timeRange', onChange });
            await clickItem('hour', 7, getPanels()[0]);
            expect(getInput()).toHaveValue('07:00:00 ~ ');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
            view.unmount();

            onChange.mockClear();
            await renderModel({ type: 'timeRange', timeZone: 0, onChange });
            await clickItem('hour', 7, getPanels()[0]);
            const [value, str] = lastCall<ChangeFn>(onChange);
            expect(dates(value)[0].getUTCHours()).toBe(7);
            expect(dates(value)[1]).toBeUndefined();
            expect((str as string[])[1]).toBe('');
            expect(getInput().value).toMatch(/^07:\d\d:\d\d ~ $/);
        });

        it('timeZone 下受控字符串值往返后与所选时间一致', async () => {
            vi.setSystemTime(new Date('2023-05-22 12:30:45'));
            const onChange = vi.fn<ChangeFn>();
            const strings: string[] = [];
            await renderModel({ format: 'HH:mm', timeZone: 0, onChange });
            await clickItem('hour', 7);
            const [value, str] = lastCall<ChangeFn>(onChange);
            strings.push(str as string);
            expect((value as Date).getUTCHours()).toBe(7);
            expect(strings[0].startsWith('15:')).toBe(true);
            expect(getInput().value.startsWith('07:')).toBe(true);
            expect(getSelectedText('hour')).toBe('07时');
        });
    });

    describe('行为基线', () => {
        it('读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { TimePicker: { format: 'HH:mm', size: 'small' } };
            await renderTimePicker({ defaultValue: '10:23' });
            expect(getInput()).toHaveValue('10:23');
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        });

        it('组件传入的属性优先于全局默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { TimePicker: { format: 'HH:mm' } };
            await renderTimePicker({ defaultValue: '10:23:15', format: 'HH:mm:ss' });
            expect(getInput()).toHaveValue('10:23:15');
        });

        it('全局默认值里的 insetLabelId 不影响 TimePicker', async () => {
            // the global type omits per-instance ids; cast for an untyped app that sets one
            semiGlobal.config.overrideDefaultProps = { TimePicker: { insetLabelId: 'label-global' } } as object;
            await renderTimePicker({}, { insetLabel: () => '时间' });
            expect(document.getElementById('label-global')).toBeNull();
        });

        it('全局默认值覆盖 showClear、use12Hours、rangeSeparator，函数属性每次读取', async () => {
            const disabledHours = vi.fn<() => number[]>(() => [3]);
            semiGlobal.config.overrideDefaultProps = {
                TimePicker: { showClear: false, use12Hours: true, rangeSeparator: ' / ', disabledHours },
            };
            const view = await renderTimePicker({ type: 'timeRange', defaultOpen: true, ...normalList });
            expect(getInput().placeholder).toBe(zh_CN.TimePicker.placeholder.timeRange);
            expect(getList('ampm')).not.toBeNull();
            await clickItem('hour', 2, getPanels()[0]);
            await clickItem('hour', 5, getPanels()[1]);
            expect(getInput().value).toContain(' / ');
            expect(disabledHours).toHaveBeenCalled();
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();

            semiGlobal.config.overrideDefaultProps = { TimePicker: { disabledHours: () => [4] } };
            await view.rerender({ hideDisabledOptions: true });
            expect(getItems('hour', getPanels()[0]).some((li) => li.textContent?.trim().startsWith('04'))).toBe(false);
        });

        it('传入 undefined 视为未设置，读取全局默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { TimePicker: { size: 'large' } };
            await renderTimePicker({ size: undefined });
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-large`)).not.toBeNull();
        });

        it('选择小时只上报一次变化', async () => {
            const onChange = vi.fn<ChangeFn>();
            const onUpdate = vi.fn<(value: unknown) => void>();
            await renderTimePicker({
                defaultValue: '10:23:15',
                defaultOpen: true,
                onChange,
                'onUpdate:modelValue': onUpdate,
                ...normalList,
            });
            await clickItem('hour', 7);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onUpdate).toHaveBeenCalledTimes(1);
            expect(onUpdate.mock.calls[0][0]).toBe(onChange.mock.calls[0][0]);
            expect(hms(onChange.mock.calls[0][0])).toEqual([7, 23, 15]);
            expect(getInput()).toHaveValue('07:23:15');
        });

        it('打开时只有一个外部点击监听，关闭时与卸载时移除', async () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const onBlur = vi.fn<BlurFn>();
            const view = await renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, onBlur });
            const mousedown = () => countLiveListeners(add, remove, 'mousedown');
            const opened = mousedown();
            expect(opened).toBeGreaterThanOrEqual(1);

            await clickOutside();
            expect(onBlur).toHaveBeenCalledTimes(1);
            await waitForClosed();
            expect(mousedown()).toBe(opened - 1);

            await focusInput();
            expect(mousedown()).toBe(opened);
            view.unmount();
            expect(mousedown()).toBe(0);
        });

        it('受控 open 只在显示时监听外部点击', async () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const onOpenChange = vi.fn<OpenChangeFn>();
            const view = await renderTimePicker({ open: true, defaultValue: '10:23:15', onOpenChange });
            expect(getPanels()).toHaveLength(1);
            const opened = countLiveListeners(add, remove, 'mousedown');
            await view.rerender({ open: false });
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(opened - 1);
            await clickOutside();
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('聚焦受控 open 的选择器时不再请求打开', async () => {
            const onOpenChange = vi.fn<OpenChangeFn>();
            await renderTimePicker({ open: true, onOpenChange });
            await fireEvent.focusIn(getInput());
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('受控 modelValue 变化会显示出来，之后的值覆盖已输入的文本', async () => {
            const view = await renderTimePicker({ modelValue: '10:23:15' });
            await typeText('11:00:0');
            expect(getInput()).toHaveValue('11:00:0');
            await view.rerender({ modelValue: '12:00:00' });
            expect(getInput()).toHaveValue('12:00:00');
        });

        it('受控 modelValue 超出可用小时时输入框标记为无效', async () => {
            const disabledHours = () => [11];
            const view = await renderTimePicker({ modelValue: '10:23:15', disabledHours });
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
            await view.rerender({ modelValue: '11:00:00' });
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).not.toBeNull();
        });

        it('输入禁用时间会标记输入框无效，blur 时恢复上一个有效时间', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderTimePicker({ defaultValue: '10:23:15', disabledHours: () => [11], onChange });
            await focusInput();
            await typeText('11:00:00');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).not.toBeNull();
            expect(onChange).not.toHaveBeenCalled();
            await blurInput();
            expect(getInput()).toHaveValue('10:23:15');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
        });

        it('format 变化时重新格式化显示值和面板列', async () => {
            const view = await renderTimePicker({ defaultValue: '10:23:15', defaultOpen: true, ...normalList });
            expect(getList('second')).not.toBeNull();
            await view.rerender({ format: 'HH:mm' });
            expect(getInput()).toHaveValue('10:23');
            expect(getList('second')).toBeNull();
        });

        it('设了 timeZone 时只改 format，显示的时间不被重复换算', async () => {
            const view = await renderTimePicker({ defaultValue: '10:23:15', timeZone: 'Asia/Tokyo' });
            const shown = getInput().value;
            await view.rerender({ format: 'HH:mm' });
            expect(getInput()).toHaveValue(shown.slice(0, 5));
        });

        it('data-* 与 title 等未声明属性落在输入框上', async () => {
            await renderTimePicker({ 'data-testid': 'tp', title: 'tip' });
            expect(getInput()).toHaveAttribute('data-testid', 'tp');
            expect(getInput()).toHaveAttribute('title', 'tip');
            expect(getRoot()).not.toHaveAttribute('data-testid');
            expect(getRoot()).not.toHaveAttribute('title');
        });

        it('aria 属性、id 和 name 落在输入框上', async () => {
            await renderTimePicker({
                id: 'start',
                name: 'start-name',
                'aria-label': 'start time',
                'aria-describedby': 'hint',
                insetLabelId: 'label-id',
                validateStatus: 'error',
            });
            expect(getInput()).toHaveAttribute('aria-label', 'start time');
            expect(getInput()).toHaveAttribute('aria-describedby', 'hint');
            expect(getInput()).toHaveAttribute('name', 'start-name');
            expect(getInput()).toHaveAttribute('id', 'start');
            for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
                expect(getRoot()).not.toHaveAttribute(attr);
                expect(getInput()).not.toHaveAttribute(attr);
            }
        });

        it('Combobox 的 ref 暴露 reselect，供 DatePicker 使用', async () => {
            let handle: ComboboxHandle | undefined;
            await renderNode(() => (
                <Combobox
                    prefixCls="x"
                    timeStampValue={new Date(2023, 0, 1, 10, 23, 15)}
                    ref={(value: unknown) => {
                        handle = value as ComboboxHandle;
                    }}
                />
            ));
            expect(typeof handle?.reselect).toBe('function');
            expect(() => handle?.reselect()).not.toThrow();
        });

        it('timeRange 显示开始和结束表头，并上报两个日期', async () => {
            const onChange = vi.fn<ChangeFn>();
            await renderNode(() => <ConfigProvider locale={en_US}>{() => <TimePicker type="timeRange" defaultValue={['10:00:00', '12:00:00']} defaultOpen onChange={onChange} {...normalList} />}</ConfigProvider>);
            expect(getPanels()).toHaveLength(2);
            expect(getInput()).toHaveValue('10:00:00 ~ 12:00:00');
            const [start, end] = getPanels();
            expect(start).toHaveTextContent(en_US.TimePicker.begin);
            expect(end).toHaveTextContent(en_US.TimePicker.end);
            await clickItem('hour', 11, start);
            expect(onChange.mock.calls[0][1]).toEqual(['11:00:00', '12:00:00']);
        });
    });

    describe('组件实例', () => {
        it('ref 的 focus 和 blur 移动输入框焦点', async () => {
            let handle: TimePickerHandle | undefined;
            const onFocus = vi.fn<FocusFn>();
            await renderNode(() => (
                <TimePicker
                    onFocus={onFocus}
                    ref={(value: unknown) => {
                        handle = value as TimePickerHandle;
                    }}
                />
            ));
            expect(Object.keys(handle ?? {}).toSorted()).toEqual(['blur', 'focus']);
            handle?.focus();
            await settle();
            expect(getInput()).toHaveFocus();
            expect(onFocus).toHaveBeenCalledTimes(1);
            handle?.blur();
            expect(getInput()).not.toHaveFocus();
        });

        it('自定义触发器下 ref 的 focus 和 blur 不做任何事', async () => {
            let handle: TimePickerHandle | undefined;
            await renderNode(() => (
                <TimePicker
                    ref={(value: unknown) => {
                        handle = value as TimePickerHandle;
                    }}
                >
                    {{
                        trigger: () => <span>trigger</span>,
                    }}
                </TimePicker>
            ));
            expect(() => handle?.focus()).not.toThrow();
            expect(() => handle?.blur()).not.toThrow();
            expect(getPanels()).toHaveLength(0);
        });

        it('已声明的属性不会进入 DOM', async () => {
            await renderTimePicker(
                {
                    type: 'timeRange',
                    position: 'top',
                    open: false,
                    timeZone: 'Asia/Shanghai',
                    disabledTime: () => ({}),
                    popupStyle: { color: 'red' },
                    scrollItemProps: { cycled: false },
                },
                { panel: () => <span>a</span> }
            );
            for (const attr of ['position', 'open', 'timezone', 'disabledtime', 'popupstyle', 'scrollitemprops']) {
                expect(getInput()).not.toHaveAttribute(attr);
                expect(getRoot()).not.toHaveAttribute(attr);
            }
        });

        it('首次渲染即显示默认值', async () => {
            const seen: string[] = [];
            await renderTimePicker(
                { defaultValue: '10:23:15' },
                {
                    trigger: ({ inputValue }) => {
                        seen.push(String(inputValue));
                        return <span>{String(inputValue)}</span>;
                    },
                }
            );
            expect(seen[0]).toBe('10:23:15');
        });

        it('服务端渲染输出默认值的输入框文本，不含面板', async () => {
            const app = createSSRApp({
                render: () => <TimePicker modelValue={new Date(2021, 5, 1, 10, 23, 15)} defaultOpen />,
            });
            const container = document.createElement('div');
            container.innerHTML = await renderToString(app);
            expect(container.querySelector('input')).toHaveAttribute('value', '10:23:15');
            expect(container.querySelector(`.${scrollListCls}`)).toBeNull();
        });

        it('范围值只有一侧时挂载显示「 ~ 结束」，不标记无效', async () => {
            await renderTimePicker({ type: 'timeRange', modelValue: ['', '10:00:00'] });
            expect(getInput()).toHaveValue(' ~ 10:00:00');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
        });

        it('受控范围值更新为两侧都空时输入框为空，不标记无效', async () => {
            const view = await renderTimePicker({ type: 'timeRange', modelValue: ['09:00:00', '10:00:00'] });
            await view.rerender({ modelValue: ['', ''] });
            expect(getInput()).toHaveValue('');
            expect(document.querySelector(`.${prefixCls}-input-invalid`)).toBeNull();
        });

        it('#trigger 的 componentProps 是 props 的浅拷贝，不含插槽与 attrs', async () => {
            const scopes: TimePickerTriggerSlotProps[] = [];
            await renderTimePicker(
                { modelValue: '10:23:15', type: 'time', 'data-testid': 'tp' },
                {
                    trigger: (scope) => {
                        scopes.push(scope as unknown as TimePickerTriggerSlotProps);
                        return <span>trigger</span>;
                    },
                }
            );
            const { componentProps } = scopes[scopes.length - 1];
            expect(componentProps.modelValue).toBe('10:23:15');
            expect(componentProps.type).toBe('time');
            expect(componentProps).not.toHaveProperty('ref');
            expect(componentProps).not.toHaveProperty('data-testid');
            expect(componentProps).not.toHaveProperty('trigger');
        });
    });
});

describe('TimePicker combobox 与面板键盘操作', () => {
    const renderEnglish = (props: Record<string, unknown>) => renderNode(() => <ConfigProvider locale={en_US}>{() => <TimePicker motion={false} {...props} />}</ConfigProvider>);

    it('输入框是 combobox，其 aria-controls 指向包含列表的面板', async () => {
        await renderEnglish({});
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        input.focus();
        await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toContainElement(screen.getAllByRole('listbox')[0]);
        expect(screen.getByRole('dialog', { name: en_US.TimePicker.panel.time })).toContainElement(panel);
    });

    it('为范围面板命名对话框', async () => {
        await renderEnglish({ type: 'timeRange', defaultOpen: true });
        expect(await screen.findByRole('dialog', { name: en_US.TimePicker.panel.timeRange })).toBeInTheDocument();
    });

    it('AM/PM、小时、分钟和秒列表都有名称', async () => {
        await renderEnglish({ defaultOpen: true, format: 'a hh:mm:ss', use12Hours: true });
        for (const name of ['ampmList', 'hourList', 'minuteList', 'secondList'] as const) {
            expect(screen.getByRole('listbox', { name: en_US.TimePicker[name] })).toBeInTheDocument();
        }
    });

    it('Esc 关闭面板', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        await renderEnglish({ onOpenChange });
        screen.getByRole('combobox').focus();
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPanels()).toHaveLength(0));
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('表头容器不是 Tab 停靠点，Tab 直接跳到输入框', async () => {
        await renderEnglish({});
        await userEvent.tab();
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement).toBe(getInput());
    });
});

describe('TimePicker 受控与输入的边界', () => {
    it('受控 modelValue 更新为无法解析的值时不抛错，输入框清空', async () => {
        const view = await renderTimePicker({ modelValue: '10:23:15' });
        expect(getInput()).toHaveValue('10:23:15');
        await view.rerender({ modelValue: '10:24' });
        expect(getInput()).toHaveValue('');
        await view.rerender({ modelValue: '11:25:35' });
        expect(getInput()).toHaveValue('11:25:35');
    });

    it('受控时清空输入后失焦，输入框恢复受控值', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ modelValue: '10:23:15', onChange });
        await focusInput();
        await typeText('');
        expect(onChange).toHaveBeenCalledTimes(1);
        await blurInput();
        expect(getInput()).toHaveValue('10:23:15');
    });

    it('受控时键入被 disabledHours 禁止的时间，输入框显示无效态', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ modelValue: '10:23:15', disabledHours: () => [11], onChange });
        await typeText('11:00:00');
        expect(document.querySelector(`.${prefixCls}-input-invalid`)).not.toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('时间戳 0 是有效的 modelValue', async () => {
        await renderTimePicker({ defaultValue: '10:23:15', modelValue: 0 });
        expect(getInput()).toHaveValue(format(new Date(0), 'HH:mm:ss'));
    });

    it('modelValue 为 null 是受控空值，不回落到 defaultValue', async () => {
        await renderTimePicker({ modelValue: null, defaultValue: '10:20:30' });
        expect(getInput()).toHaveValue('');
    });

    it('非受控时清空输入后失焦，输入框保持为空', async () => {
        await renderTimePicker({ defaultValue: '10:23:15' });
        await focusInput();
        await typeText('');
        await blurInput();
        expect(getInput()).toHaveValue('');
    });

    it('disabled 的自定义触发器被点击时不打开面板，也不通知 openChange', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const view = await renderTimePicker({ motion: false, onOpenChange, disabled: true }, { trigger: () => <span>custom trigger</span> });
        await fireEvent.click(screen.getByText('custom trigger'));
        expect(onOpenChange).not.toHaveBeenCalled();
        await view.rerender({ disabled: false });
        expect(getPanels()).toHaveLength(0);
    });
});

describe('TimePicker 属性回落与面板开合', () => {
    const utcOne = new Date(Date.UTC(2021, 0, 1, 1, 0, 0));

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('ConfigProvider 的 timeZone 优先于全局默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { TimePicker: { timeZone: 'UTC' } };
        await renderNode(() => <ConfigProvider timeZone="Asia/Tokyo">{() => <TimePicker modelValue={utcOne} />}</ConfigProvider>);
        expect(getInput()).toHaveValue('10:00:00');
    });

    it('没有 ConfigProvider 时读全局默认的 timeZone', async () => {
        semiGlobal.config.overrideDefaultProps = { TimePicker: { timeZone: 'Asia/Tokyo' } };
        await renderNode(() => <TimePicker modelValue={utcOne} />);
        expect(getInput()).toHaveValue('10:00:00');
    });

    it('disabled 加 defaultOpen 时点击外部不触发 openChange 与 blur', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const onBlur = vi.fn<BlurFn>();
        await renderTimePicker({ disabled: true, defaultOpen: true, onOpenChange, onBlur });
        await clickOutside();
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('打开后变为 disabled 时关闭面板并上报 openChange(false)，重新启用不再弹出', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const view = await renderTimePicker({ defaultOpen: true, motion: false, onOpenChange });
        expect(getPanels()).toHaveLength(1);
        await view.rerender({ disabled: true });
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        await view.rerender({ disabled: false });
        expect(getPanels()).toHaveLength(0);
    });

    it('#trigger 插槽只有不可聚焦内容时外层是 Tab 停靠点，Enter 打开面板', async () => {
        await renderTimePicker({ motion: false }, { trigger: () => <span>10:00</span> });
        await userEvent.tab();
        const trigger = screen.getByRole('button', { name: '10:00' });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPanels()).toHaveLength(1));
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('TimePicker 值与文本', () => {
    it('timeZone 加 use12Hours 时 change 的字符串按语言包格式化，回填后可解析', async () => {
        const onChange = vi.fn<ChangeFn>();
        let host: { value: unknown } | undefined;
        await renderNode(() => (
            <Model
                use12Hours
                timeZone="Asia/Shanghai"
                defaultOpen
                {...normalList}
                onChange={onChange}
                ref={(value: unknown) => {
                    host = value as { value: unknown };
                }}
            />
        ));
        await clickItem('hour', 3);
        await clickItem('ampm', 1);
        const [, str] = lastCall<ChangeFn>(onChange);
        expect(str).toBe('下午 3:00:00');
        if (!host) throw new Error('Model is not mounted');
        host.value = str;
        await settle();
        expect(getInput()).toHaveValue('下午 3:00:00');
    });

    it('timeRange + use12Hours 无值时右面板显示下午，先选分钟得到的也是下午', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ type: 'timeRange', use12Hours: true, defaultOpen: true, ...normalList, onChange });
        const rightPanel = getPanels()[1];
        expect(getSelectedText('ampm', rightPanel)).toBe('下午');
        await clickItem('minute', 5, rightPanel);
        const [value] = lastCall<ChangeFn>(onChange);
        expect(dates(value)[1].getHours()).toBeGreaterThanOrEqual(12);
    });

    it('timeRange 只键入一侧时值与字符串都有两项，失焦后输入框带分隔符', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ type: 'timeRange', onChange });
        await focusInput();
        await typeText('10:00:00');
        const [value, str] = lastCall<ChangeFn>(onChange);
        expect(value).toHaveLength(2);
        expect(dates(value)[1]).toBeUndefined();
        expect(str).toEqual(['10:00:00', '']);
        await blurInput();
        expect(getInput()).toHaveValue('10:00:00 ~ ');
    });

    it('timeRange 键入超过两段时标为无效，不触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ type: 'timeRange', onChange });
        await focusInput();
        await typeText('10:00:00 ~ 11:00:00 ~ 12:00:00');
        expect(document.querySelector(`.${prefixCls}-input-invalid`)).not.toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('TimePicker Vue 写法', () => {
    it('v-model 双向：键入、面板选择、清空后宿主值更新', async () => {
        let host: { value: unknown } | undefined;
        await renderNode(() => (
            <Model
                initValue="10:23:15"
                defaultOpen
                {...normalList}
                ref={(value: unknown) => {
                    host = value as { value: unknown };
                }}
            />
        ));
        await typeText('11:30:00');
        expect(hms(host?.value)).toEqual([11, 30, 0]);
        await clickItem('minute', 10);
        expect(hms(host?.value)).toEqual([11, 10, 0]);
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(host?.value).toBeUndefined();
        expect(getInput()).toHaveValue('');
    });

    it('v-model:open 双向：打开、Esc、点击外部后宿主 open 更新', async () => {
        const open = ref<boolean | undefined>(false);
        await renderNode(() => (
            <TimePicker
                motion={false}
                open={open.value}
                onUpdate:open={(value: boolean) => {
                    open.value = value;
                }}
            />
        ));
        await focusInput();
        expect(open.value).toBe(true);
        expect(getPanels()).toHaveLength(1);
        await userEvent.keyboard('{Escape}');
        await settle();
        expect(open.value).toBe(false);
        expect(getPanels()).toHaveLength(0);

        open.value = true;
        await settle();
        await clickOutside();
        expect(open.value).toBe(false);
        expect(getPanels()).toHaveLength(0);
    });

    it('单向绑定 modelValue 不自翻转', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ modelValue: '10:23:15', defaultOpen: true, onChange, ...normalList });
        await clickItem('hour', 7);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('10:23:15');
        expect(getSelectedText('hour')).toBe('10时');

        await focusInput();
        await typeText('11:30:00');
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(getSelectedText('hour')).toBe('10时');
        await blurInput();
        expect(getInput()).toHaveValue('10:23:15');
    });

    it('modelValue 为 null 时显示为空且受控', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ modelValue: null, defaultOpen: true, onChange, ...normalList });
        expect(getInput()).toHaveValue('');
        await clickItem('hour', 7);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it('change 的参数顺序固定为 (value, str)，与 update:modelValue 同源；清空时单选为 undefined、范围为 []', async () => {
        const onChange = vi.fn<ChangeFn>();
        const single = await renderTimePicker({ defaultValue: '10:23:15', onChange });
        await typeText('11:00:00');
        const [value, str] = onChange.mock.calls[0];
        expect(value).toBeInstanceOf(Date);
        expect(str).toBe('11:00:00');
        single.unmount();

        const onRangeChange = vi.fn<ChangeFn>();
        const onUpdate = vi.fn<(value: unknown) => void>();
        await renderTimePicker({
            type: 'timeRange',
            defaultValue: ['10:00:00', '12:00:00'],
            onChange: onRangeChange,
            'onUpdate:modelValue': onUpdate,
        });
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(onRangeChange.mock.calls).toEqual([[[], ['']]]);
        expect(onUpdate.mock.calls).toEqual([[[]]]);
    });

    it('openChange 与 update:open 成对，focus 的载荷是 focusin', async () => {
        const onOpenChange = vi.fn<OpenChangeFn>();
        const onUpdateOpen = vi.fn<(open: boolean) => void>();
        const onFocus = vi.fn<FocusFn>();
        await renderTimePicker({ onOpenChange, 'onUpdate:open': onUpdateOpen, onFocus });
        await focusInput();
        await clickOutside();
        expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
        expect(onUpdateOpen.mock.calls).toEqual([[true], [false]]);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('@focus 与 @blur 是组件事件：焦点在输入框与清除按钮之间移动、离开输入框都不重复触发', async () => {
        const onFocus = vi.fn<FocusFn>();
        const onBlur = vi.fn<BlurFn>();
        await renderTimePicker({ defaultValue: '10:23:15', onFocus, onBlur });
        await focusInput();
        (document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement).focus();
        await settle();
        await focusInput();
        await blurInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('自定义触发器模式下未声明属性落在根元素，@click 与打开动作都执行', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        await renderTimePicker({ 'data-testid': 'tp', title: 'tip', class: 'custom', onClick }, { trigger: () => <span>custom trigger</span> });
        expect(getRoot()).toHaveAttribute('data-testid', 'tp');
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getRoot()).toHaveClass('custom');
        await fireEvent.click(screen.getByText('custom trigger'));
        await settle();
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getPanels()).toHaveLength(1);
    });

    it('#trigger 的 onChange 设置输入文本并触发 change', async () => {
        const onChange = vi.fn<ChangeFn>();
        const scopes: TimePickerTriggerSlotProps[] = [];
        await renderTimePicker(
            { onChange, placeholder: 'pick' },
            {
                trigger: (scope) => {
                    scopes.push(scope as unknown as TimePickerTriggerSlotProps);
                    return <span>trigger</span>;
                },
            }
        );
        const first = scopes[scopes.length - 1];
        expect(Object.keys(first).toSorted()).toEqual(['componentProps', 'disabled', 'inputValue', 'onChange', 'placeholder', 'value']);
        expect(first.placeholder).toBe('pick');
        first.onChange('10:20:30');
        await settle();
        expect(onChange.mock.calls[0][1]).toBe('10:20:30');
        const last = scopes[scopes.length - 1];
        expect(last.inputValue).toBe('10:20:30');
        expect(hms(last.value[0])).toEqual([10, 20, 30]);
    });

    it('scrollItemProps 生效，类型只含 cycled、mode、motion、transform', async () => {
        expectTypeOf<keyof TimePickerScrollItemProps>().toEqualTypeOf<'cycled' | 'mode' | 'motion' | 'transform'>();
        await renderTimePicker({ defaultOpen: true, scrollItemProps: { mode: 'wheel', cycled: true } });
        expect(getList('hour')).toHaveClass(`${scrollListCls}-item-wheel`);
        expect(getList('hour').querySelector(`.${scrollListCls}-list-outer-nocycle`)).toBeNull();
    });

    it('#trigger 且使用方传了 aria-label 时根元素为 role=group，否则没有 role', async () => {
        await renderTimePicker({ 'aria-label': '开始时间' }, { trigger: () => <span>trigger</span> });
        expect(getRoot()).toHaveAttribute('role', 'group');
    });

    it('#trigger 且没有 aria-label 时根元素没有 role', async () => {
        await renderTimePicker({}, { trigger: () => <span>trigger</span> });
        expect(getRoot()).not.toHaveAttribute('role');
    });

    it('不像时间格式的文本不触发 change，补全后才触发', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ format: 'HH:mm:ss', onChange });
        await typeText('10:24:0');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('10:24:0');
        await typeText('10:24:00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('10:24:00');
    });

    it('分隔符含正则特殊字符的 format 可以键入', async () => {
        const onChange = vi.fn<ChangeFn>();
        await renderTimePicker({ format: 'HH.mm', onChange });
        await typeText('12.00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][1]).toBe('12.00');
    });

    it('同一时间值的新 Date 重渲染时不覆盖正在键入的文本', async () => {
        const view = await renderTimePicker({ modelValue: new Date(2021, 5, 1, 10, 23, 15) });
        await typeText('11:2');
        await view.rerender({ modelValue: new Date(2021, 5, 1, 10, 23, 15) });
        expect(getInput()).toHaveValue('11:2');
        await view.rerender({ modelValue: [new Date(2021, 5, 1, 10, 23, 15)] });
        expect(getInput()).toHaveValue('10:23:15');
    });

    it('modelValue 依次换成字符串、时间戳与 undefined，输入框与面板同步', async () => {
        const view = await renderTimePicker({
            modelValue: new Date(2021, 5, 1, 10, 23, 15),
            defaultOpen: true,
            ...normalList,
        });
        expect(getSelectedText('hour')).toBe('10时');
        await view.rerender({ modelValue: '11:00:00' });
        expect(getInput()).toHaveValue('11:00:00');
        expect(getSelectedText('hour')).toBe('11时');
        await view.rerender({ modelValue: new Date(2021, 5, 1, 12, 0, 0).getTime() });
        expect(getInput()).toHaveValue('12:00:00');
        expect(getSelectedText('hour')).toBe('12时');
        await view.rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('');
    });

    it('同一 tick 内同时修改 modelValue 与 timeZone 时按新时区解析新值', async () => {
        const value = ref<Date>(new Date('2021-06-01T02:00:00Z'));
        const timeZone = ref<number>(8);
        await renderNode(() => <TimePicker modelValue={value.value} timeZone={timeZone.value} />);
        expect(getInput()).toHaveValue('10:00:00');
        value.value = new Date('2021-06-01T03:00:00Z');
        timeZone.value = 0;
        await settle();
        expect(getInput()).toHaveValue('03:00:00');
    });

    it('ConfigProvider 的 timeZone 变化时重新换算显示值', async () => {
        const timeZone = ref<number>(8);
        await renderNode(() => <ConfigProvider timeZone={timeZone.value}>{() => <TimePicker defaultValue={new Date('2021-06-01T02:00:00Z')} />}</ConfigProvider>);
        expect(getInput()).toHaveValue('10:00:00');
        timeZone.value = 0;
        await settle();
        expect(getInput()).toHaveValue('02:00:00');
    });

    it('KeepAlive 切走再切回后 aria-expanded 为 false，弹层不在页面上，不发 blur', async () => {
        const shown = ref(true);
        const onOpenChange = vi.fn<OpenChangeFn>();
        const onBlur = vi.fn<BlurFn>();
        const Other = defineComponent({ render: () => <div>other</div> });
        await renderNode(() => (
            <KeepAlive>
                {{
                    default: () => (shown.value ? <TimePicker defaultOpen motion={false} onOpenChange={onOpenChange} onBlur={onBlur} /> : <Other />),
                }}
            </KeepAlive>
        ));
        expect(getPanels()).toHaveLength(1);
        shown.value = false;
        await settle();
        await waitForClosed();
        expect(onOpenChange.mock.calls).toEqual([[false]]);
        shown.value = true;
        await settle();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(getPanels()).toHaveLength(0);
        expect(onBlur).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(getInput());
    });

    it('Combobox 未传 prefixCls 时列不带类名，传入时类名不含 undefined', async () => {
        const plain = await renderNode(() => <Combobox format="HH:mm" />);
        const columns = Array.from(document.querySelectorAll(`.${scrollListCls}-body > div`));
        expect(columns).toHaveLength(2);
        expect(document.querySelector('[class*="undefined"]')).toBeNull();
        expect(document.querySelector('[class*="-list-hour"]')).toBeNull();
        plain.unmount();

        await renderNode(() => <Combobox prefixCls={`${prefixCls}-panel`} />);
        expect(getList('hour')).not.toBeNull();
        expect(getList('ampm')).toBeNull();
    });

    it('Combobox 单独使用：defaultIsAM 为 false 时无值显示下午，选择后发出 timeStampValue', async () => {
        const onChange = vi.fn<(value: { timeStampValue: number }) => void>();
        await renderNode(() => <Combobox prefixCls={`${prefixCls}-panel`} use12Hours defaultIsAM={false} format="a hh:mm" scrollItemProps={{ cycled: false, mode: 'normal' }} onChange={onChange} />);
        expect(getSelectedText('ampm')).toBe('下午');
        await clickItem('hour', 3);
        const { timeStampValue } = onChange.mock.calls[0][0];
        expect(typeof timeStampValue).toBe('number');
        expect(new Date(timeStampValue).getHours()).toBe(15);
    });

    it('Combobox 的 #panelHeader 与 #panelFooter 转发给 ScrollList，空插槽不渲染头尾', async () => {
        await renderNode(() => <Combobox>{{ panelHeader: () => 'select time', panelFooter: () => [] }}</Combobox>);
        expect(document.querySelector(`.${scrollListCls}-header`)).toHaveTextContent('select time');
        expect(document.querySelector(`.${scrollListCls}-footer`)).toBeNull();
    });

    it('模板写法的布尔简写与字符串属性', async () => {
        // a bare template attribute arrives as '', which Vue casts to true for Boolean props
        await renderTimePicker({
            defaultValue: [new Date(2021, 5, 1, 10, 0, 0), new Date(2021, 5, 1, 14, 0, 0)],
            disabled: '',
            type: 'timeRange',
            'use12-hours': '',
        });
        expect(getInput()).toBeDisabled();
        expect(getInput()).toHaveValue('上午 10:00:00 ~ 下午 2:00:00');
    });

    it('类型：事件、插槽参数与实例方法', () => {
        expectTypeOf<TimePickerEmits['change']>().toEqualTypeOf<[value: Date | (Date | undefined)[] | undefined, str: string | string[]]>();
        expectTypeOf<TimePickerEmits['update:modelValue']>().toEqualTypeOf<[value: Date | (Date | undefined)[] | undefined]>();
        expectTypeOf<Parameters<NonNullable<TimePickerProps['disabledTime']>>[0]>().toEqualTypeOf<(Date | undefined)[]>();
        expectTypeOf<TimePickerTriggerSlotProps['value']>().toEqualTypeOf<(Date | undefined)[]>();
        expectTypeOf<Parameters<NonNullable<TimePickerSlots['trigger']>>[0]>().toEqualTypeOf<TimePickerTriggerSlotProps>();
        expectTypeOf<TimePickerTriggerSlotProps['onChange']>().toEqualTypeOf<(inputValue: string) => void>();
        expectTypeOf<TimePickerHandle>().toEqualTypeOf<{ focus(): void; blur(): void }>();
        expectTypeOf<TimePickerProps['modelValue']>().toEqualTypeOf<string | number | Date | (string | number | Date | undefined)[] | null | undefined>();
        expectTypeOf<TimePickerEmits['update:modelValue'][0]>().toExtend<TimePickerProps['modelValue']>();
        expectTypeOf<TimePickerEmits['update:modelValue'][0]>().toExtend<TimePickerProps['defaultValue']>();
    });

    it('面板未打开时受控值变化，光标也留在原处', async () => {
        const view = await renderTimePicker({ modelValue: '10:23:15' });
        getInput().setSelectionRange(2, 2);
        await focusInput();
        await view.rerender({ modelValue: '11:30:00' });
        expect(getInput()).toHaveValue('11:30:00');
        expect(getInput().selectionStart).toBe(2);
    });

    it('nextTick 前不访问面板：未打开时不渲染列', async () => {
        await renderTimePicker({});
        await nextTick();
        expect(getPanels()).toHaveLength(0);
        expect(getInput()).toHaveAttribute('aria-expanded', 'false');
    });
});
