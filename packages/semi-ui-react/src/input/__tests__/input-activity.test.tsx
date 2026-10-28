import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import Input from '../index';
import TextArea from '../textarea';

describe('TextArea autoFocus 只在挂载时聚焦', () => {
    it('Activity 隐藏再显示：不从外部元素抢回焦点', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <>
                <button type="button">外部</button>
                <Activity mode={mode}>
                    <TextArea autoFocus />
                </Activity>
            </>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('textbox')).toHaveFocus();
        screen.getByRole('button').focus();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('button')).toHaveFocus();
    });
});

describe('Input autoFocus 只在挂载时聚焦', () => {
    it('Activity 隐藏再显示：不从外部元素抢回焦点', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <>
                <button type="button">外部</button>
                <Activity mode={mode}>
                    <Input autoFocus />
                </Activity>
            </>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('textbox')).toHaveFocus();
        screen.getByRole('button').focus();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('button')).toHaveFocus();
    });

    it('StrictMode 下挂载后聚焦', () => {
        render(
            <StrictMode>
                <Input autoFocus />
            </StrictMode>
        );
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('卸载再挂载：新的实例重新聚焦', () => {
        const view = (show: boolean) => (
            <>
                <button type="button">外部</button>
                {show && <Input autoFocus />}
            </>
        );
        const { rerender } = render(view(true));
        screen.getByRole('button').focus();

        rerender(view(false));
        rerender(view(true));
        expect(screen.getByRole('textbox')).toHaveFocus();
    });
});
