import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import AutoComplete from '../index';

describe('Activity 隐藏再显示 AutoComplete', () => {
    it('非受控：输入的文本保留，不多发 onChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <AutoComplete defaultValue="x" data={['x', 'y']} motion={false} onChange={onChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.type(screen.getByRole('combobox'), 'yz');
        expect(screen.getByRole('combobox')).toHaveValue('xyz');
        const calls = onChange.mock.calls.length;

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveValue('xyz');
        expect(onChange).toHaveBeenCalledTimes(calls);
    });

    it('defaultOpen：用户关闭的下拉不重新打开', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <AutoComplete data={['x', 'y']} defaultOpen motion={false} onDropdownVisibleChange={onDropdownVisibleChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('option', { name: 'y' }));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        const focused = document.activeElement;

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(document.activeElement).toBe(focused);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('StrictMode 下 defaultOpen 只打开并通知一次', () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <StrictMode>
                <AutoComplete data={['x', 'y']} defaultOpen motion={false} onDropdownVisibleChange={onDropdownVisibleChange} />
            </StrictMode>
        );
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });
});
