import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Switch from '..';
import Disabled from './fixtures/disabled.vue';
import Model from './fixtures/model.vue';

type SwitchChange = (checked: boolean, event: Event) => void;

describe('Switch（浏览器）', () => {
    it('Tab 可以到达，Space 切换并报告新状态，轨道显示主题焦点环', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { attrs: { 'aria-label': 'toggle' }, props: { onChange: change } });
        const control = screen.getByRole('switch', { name: 'toggle' });
        await tabTo(control);
        expectThemeFocusRing(control.parentElement as HTMLElement);
        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(change).toHaveBeenLastCalledWith(true, expect.any(Event));
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expect(change).toHaveBeenLastCalledWith(false, expect.any(Event));
    });

    it('鼠标点击后再按键，轨道显示主题焦点环', async () => {
        render(Switch, { attrs: { 'aria-label': 'toggle' } });
        const control = screen.getByRole('switch', { name: 'toggle' });
        await userEvent.click(control);
        expect(control).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expectThemeFocusRing(control.parentElement as HTMLElement);
    });

    it('change 中置 loading 后焦点仍在控件，loading 期间 Space 不切换', async () => {
        const change = vi.fn<SwitchChange>();
        render(Model, { props: { loadOnChange: true, onChange: change } });
        const control = screen.getByRole('switch', { name: 'toggle' });
        await tabTo(control);
        await userEvent.keyboard(' ');
        expect(control).toHaveFocus();
        expect(control).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard(' ');
        expect(change).toHaveBeenCalledTimes(1);
        expect(control).toBeChecked();
    });

    it('禁用的 Switch 被 Tab 跳过且保持关闭', async () => {
        const change = vi.fn<SwitchChange>();
        render(Disabled, { props: { onChange: change } });
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(screen.getByRole('switch', { name: 'off limits' })).not.toBeChecked();
        expect(change).not.toHaveBeenCalled();
    });

    it('单向受控值在原生点击和 Space 后保持不变', async () => {
        const change = vi.fn<SwitchChange>();
        render(Switch, { props: { modelValue: true, onChange: change }, attrs: { 'aria-label': 'controlled' } });
        const control = screen.getByRole('switch', { name: 'controlled' });
        await userEvent.click(control);
        expect(control).toBeChecked();
        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(change).toHaveBeenCalledTimes(2);
        expect(change).toHaveBeenLastCalledWith(false, expect.any(Event));
    });
});
