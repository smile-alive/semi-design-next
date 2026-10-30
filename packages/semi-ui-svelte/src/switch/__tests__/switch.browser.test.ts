import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { SwitchProps } from '../interface';
import SwitchFixture from './switch-fixture.svelte';
import SwitchModes from './switch-modes.svelte';

type SwitchChange = (checked: boolean, event: Event) => void;

function setup(props: SwitchProps) {
    const store = createStore<{ props: SwitchProps; texts: boolean }>({ props, texts: false });
    render(SwitchFixture, { props: { store } });
    return { store, control: screen.getByRole('switch') as HTMLInputElement };
}

describe('Svelte Switch（浏览器）', () => {
    it('Tab 可以到达，Space 切换并报告新状态，轨道显示主题焦点环', async () => {
        const change = vi.fn<SwitchChange>();
        const { control } = setup({ 'aria-label': 'toggle', onChange: change } as SwitchProps);
        await tabTo(control);
        expectThemeFocusRing(control.parentElement as HTMLElement);
        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(change).toHaveBeenLastCalledWith(true, expect.any(Event));
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expect(change).toHaveBeenLastCalledWith(false, expect.any(Event));
    });

    it('change 中置 loading 后焦点仍在控件，loading 期间 Space 不切换', async () => {
        const change = vi.fn<SwitchChange>();
        const { control, store } = setup({ 'aria-label': 'toggle' } as SwitchProps);
        store.props.onChange = (value, event) => {
            change(value, event);
            store.props.loading = true;
        };
        await tabTo(control);
        await userEvent.keyboard(' ');
        flushSync();
        expect(control).toHaveFocus();
        expect(control).toHaveAttribute('aria-disabled', 'true');
        await userEvent.keyboard(' ');
        expect(change).toHaveBeenCalledTimes(1);
        expect(control).toBeChecked();
    });

    it('禁用的 Switch 被 Tab 跳过且保持关闭', async () => {
        const change = vi.fn<SwitchChange>();
        const { control } = setup({ 'aria-label': 'off limits', disabled: true, onChange: change } as SwitchProps);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(control).not.toBeChecked();
        expect(change).not.toHaveBeenCalled();
    });

    it('函数绑定拒绝写入时，原生点击和 Space 后保持不变', async () => {
        const store = createStore<{ value: boolean | undefined; accept: boolean; log: string[] }>({ value: true, accept: false, log: [] });
        render(SwitchModes, { props: { mode: 'function', store } });
        const control = screen.getByRole('switch') as HTMLInputElement;
        await userEvent.click(control);
        expect(control).toBeChecked();
        await userEvent.keyboard(' ');
        expect(control).toBeChecked();
        expect(store.log).toEqual(['set false', 'change false', 'set false', 'change false']);
    });
});
