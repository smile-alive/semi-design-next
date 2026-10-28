import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import Rating from '../index';

describe('Rating autoFocus 只在挂载时聚焦', () => {
    it('Activity 隐藏再显示：不从外部元素抢回焦点', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <>
                <button type="button">外部</button>
                <Activity mode={mode}>
                    <Rating autoFocus />
                </Activity>
            </>
        );
        const { rerender } = render(view('visible'));
        expect(document.activeElement).toHaveAttribute('role', 'radio');
        screen.getByRole('button').focus();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('button')).toHaveFocus();
    });

    it('StrictMode 下挂载后聚焦', () => {
        render(
            <StrictMode>
                <Rating autoFocus />
            </StrictMode>
        );
        expect(document.activeElement).toHaveAttribute('role', 'radio');
    });
});
