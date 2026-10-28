/** @jsxImportSource vue */
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import TimePicker, { type TimePickerEmits } from '..';
import Button from '../../button';
import CustomTrigger from './fixtures/custom-trigger.vue';
import TimeZone from './fixtures/time-zone.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-timepicker`;
const scrollItemProps = { cycled: false };

const getPanel = () => document.querySelector(`.${prefixCls}-panel`);
const getList = (unit: string, index = 0) => document.querySelectorAll<HTMLElement>(`.${prefixCls}-panel-list-${unit}`)[index];
const clickItem = async (unit: string, text: string, index = 0) => {
    await waitFor(() => expect(getList(unit, index)).toBeDefined());
    await userEvent.click(within(getList(unit, index)).getByText(text));
};
const selectedText = (unit: string) => getList(unit).querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)?.textContent;

describe('TimePicker（浏览器）阴影', () => {
    it('暗色模式下范围面板的阴影跟随 --semi-shadow-elevated', async () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        render(() => <TimePicker type="timeRange" defaultOpen scrollItemProps={scrollItemProps} />);
        const lists = await waitFor(() => {
            const el = document.querySelector(`.${prefixCls}-range-panel .${prefixCls}-lists`);
            expect(el).not.toBeNull();
            return el as HTMLElement;
        });
        expect(getComputedStyle(lists).boxShadow).toContain('inset');
    });
});

describe('TimePicker（浏览器）', () => {
    it('选择', async () => {
        const first = render(() => <TimePicker type="timeRange" scrollItemProps={scrollItemProps} />);
        const rangeInput = screen.getByRole<HTMLInputElement>('combobox');
        await userEvent.click(rangeInput);
        await clickItem('hour', '23');
        await clickItem('minute', '59');
        await clickItem('second', '59');
        await waitFor(() => expect(within(getList('hour')).getByText('23时')).toBeInTheDocument());
        expect(within(getList('minute')).getByText('59分')).toBeInTheDocument();
        expect(within(getList('second')).getByText('59秒')).toBeInTheDocument();
        expect(rangeInput.value).toMatch(/^23:59:59/);
        first.unmount();

        render(() => <TimePicker type="timeRange" defaultValue={['上午 10:12', '上午 11:08']} disabledHours={() => [1, 2, 4, 8, 16]} format="a hh:mm" scrollItemProps={{ ...scrollItemProps, mode: 'normal' }} use12Hours />);
        await userEvent.click(screen.getByRole('combobox'));
        for (const [ampm, hour, minute] of [
            ['下午', '09', '09'],
            ['上午', '10', '10'],
        ]) {
            await clickItem('ampm', ampm);
            await clickItem('hour', hour);
            await clickItem('minute', minute);
            await waitFor(() => expect(selectedText('ampm')).toBe(ampm));
            expect(selectedText('hour')).toBe(`${hour}时`);
            expect(selectedText('minute')).toBe(`${minute}分`);
        }
    });

    it('清空', async () => {
        render(() => <TimePicker type="timeRange" defaultValue={['10:11:12', '12:11:23']} scrollItemProps={scrollItemProps} />);
        const input = screen.getByRole('combobox');
        expect(input).not.toHaveValue('');
        await userEvent.click(input);
        await userEvent.hover(input);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        expect(input).toHaveValue('');
    });

    it('自定义触发器', async () => {
        render(CustomTrigger);
        // the wrapper drops its button role once the mounted trigger is measured as focusable
        await userEvent.click(await screen.findByRole('button', { name: 'time' }));
        await waitFor(() => expect(getPanel()).not.toBeNull());
        getList('hour').scrollTop = 0;
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(getPanel()).toBeNull());
    });

    it('blur', async () => {
        render(() => (
            <>
                <TimePicker defaultValue="10:24:18" defaultOpen format="HH:mm:ss" scrollItemProps={scrollItemProps} />
                <Button>{() => 'outside'}</Button>
            </>
        ));
        const input = screen.getByRole('combobox');
        const outside = screen.getByRole('button', { name: 'outside' });
        await userEvent.click(input);
        await userEvent.click(outside);
        expect(input).toHaveValue('10:24:18');

        await userEvent.type(input, '10:24:181');
        expect(input).not.toHaveValue('10:24:18');
        await userEvent.click(outside);
        await waitFor(() => expect(input).toHaveValue('10:24:18'));
    });

    it('timezone 与 disabledHours', async () => {
        render(TimeZone);
        const input = screen.getByRole('combobox');
        expect(input).toHaveValue('10:00');
        await userEvent.click(input);
        await clickItem('hour', '07');
        await clickItem('minute', '10');
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(input).toHaveValue('07:10'));
    });

    it('ArrowDown 将焦点从输入框移到小时列表，Esc 关闭面板并回到输入框', async () => {
        const onBlur = vi.fn<(...args: TimePickerEmits['blur']) => void>();
        render(() => <TimePicker motion={false} onBlur={onBlur} />);
        const input = screen.getByRole('combobox');
        await userEvent.click(input);
        await waitFor(() => expect(getPanel()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('listbox', { name: '小时' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPanel()).toBeNull());
        // fixed wait: covers the focus handler and Tooltip's 100ms positioning fallback
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(getPanel()).toBeNull();
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('ShadowRoot 内键盘焦点在面板内时 Esc 关闭面板，焦点回到输入框', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(TimePicker, { container: mount, props: { motion: false } });
        onTestFinished(() => {
            view.unmount();
            host.remove();
        });
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        await waitFor(() => expect(shadow.querySelector(`.${prefixCls}-panel`)).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.activeElement).toHaveAttribute('role', 'listbox'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(shadow.querySelector(`.${prefixCls}-panel`)).toBeNull());
        expect(shadow.activeElement).toBe(input);
    });
});
