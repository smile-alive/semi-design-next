import { Activity } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import InputNumber from '../index';

describe('Activity 隐藏再显示 InputNumber', () => {
    it('非受控：输入的数值保留，不多发 onChange、onNumberChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const onNumberChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <InputNumber defaultValue={1} onChange={onChange} onNumberChange={onNumberChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.type(screen.getByRole('spinbutton'), '5');
        await userEvent.tab();
        expect(screen.getByRole('spinbutton')).toHaveValue('15');
        const changes = onChange.mock.calls.length;
        const numberChanges = onNumberChange.mock.calls.length;
        const focused = document.activeElement;

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('spinbutton')).toHaveValue('15');
        expect(onChange).toHaveBeenCalledTimes(changes);
        expect(onNumberChange).toHaveBeenCalledTimes(numberChanges);
        expect(document.activeElement).toBe(focused);
    });

    it('受控越界值：挂载与每次重新显示都显示原值，不通知', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const onNumberChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <InputNumber max={10} value={50} onChange={onChange} onNumberChange={onNumberChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('spinbutton')).toHaveValue('50');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('spinbutton')).toHaveValue('50');
        expect(onChange).not.toHaveBeenCalled();
        expect(onNumberChange).not.toHaveBeenCalled();
    });
});
