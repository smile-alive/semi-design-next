import { Activity } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import DatePicker from '../index';

const dp = `${BASE_CLASS_PREFIX}-datepicker`;
const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`);

describe('Activity 隐藏再显示 DatePicker', () => {
    it('非受控：选中的日期保留，不多发 onChange', async () => {
        const onChange = vi.fn<(date: unknown, dateString: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <DatePicker defaultValue={new Date(2019, 8, 8)} defaultOpen motion={false} onChange={onChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(getDay('2019-09-11'));
        expect(screen.getByRole('combobox')).toHaveValue('2019-09-11');
        const focused = document.activeElement;

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveValue('2019-09-11');
        expect(document.activeElement).toBe(focused);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('defaultOpen：用户关闭的面板不重新打开', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <DatePicker defaultOpen motion={false} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(document.body);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('用户打开的面板保持打开', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <DatePicker motion={false} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('combobox'));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });
});
