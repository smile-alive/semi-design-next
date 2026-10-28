import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Switch, { type SwitchProps } from '..';

type SwitchChange = NonNullable<SwitchProps['onChange']>;

describe('Switch（浏览器）', () => {
    it('Tab 可以到达，Space 切换并报告新状态，轨道显示主题焦点环', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch aria-label="toggle" onChange={onChange} />);
        const control = screen.getByRole('switch', { name: 'toggle' });
        await tabTo(control);
        expectThemeFocusRing(control.parentElement as HTMLElement);

        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expect(onChange).toHaveBeenLastCalledWith(false, expect.anything());
    });

    it('鼠标点击后再按键，轨道显示主题焦点环', async () => {
        render(() => <Switch aria-label="toggle" />);
        const control = screen.getByRole('switch', { name: 'toggle' });
        await userEvent.click(control);
        expect(control).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expectThemeFocusRing(control.parentElement as HTMLElement);
    });

    it('onChange 中置 loading 后焦点仍在 switch 上，loading 期间 Space 不切换', async () => {
        const onChange = vi.fn<SwitchChange>();
        const [loading, setLoading] = createSignal(false);
        render(() => (
            <Switch
                aria-label="toggle"
                loading={loading()}
                onChange={(checked, event) => {
                    onChange(checked, event);
                    setLoading(true);
                }}
            />
        ));
        const control = screen.getByRole('switch', { name: 'toggle' });
        await tabTo(control);
        await userEvent.keyboard(' ');
        expect(control).toHaveFocus();
        expect(control).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('禁用的 switch 会被 Tab 跳过且保持关闭', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => (
            <>
                <Switch aria-label="off limits" disabled onChange={onChange} />
                <button type="button">next</button>
            </>
        ));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(screen.getByRole('switch', { name: 'off limits' })).not.toBeChecked();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('单向受控值在原生点击和 Space 后保持不变', async () => {
        const onChange = vi.fn<SwitchChange>();
        render(() => <Switch aria-label="controlled" checked onChange={onChange} />);
        const control = screen.getByRole('switch', { name: 'controlled' });
        await userEvent.click(control);
        expect(control).toBeChecked();
        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith(false, expect.anything());
    });
});
