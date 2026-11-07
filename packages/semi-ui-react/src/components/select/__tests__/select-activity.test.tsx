import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Select from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-select`;
const optionList = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
];
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection-text`)?.textContent;

describe('Activity 隐藏再显示 Select', () => {
    it('非受控：选中的非默认项保留，不多发 onChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Select defaultValue="a" motion={false} optionList={optionList} onChange={onChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(screen.getByRole('option', { name: 'B' }));
        expect(getSelectionText()).toBe('B');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(getSelectionText()).toBe('B');
        expect(onChange.mock.calls).toEqual([['b']]);
    });

    it('defaultOpen：用户关闭的下拉不重新打开', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Select defaultOpen motion={false} optionList={optionList} onDropdownVisibleChange={onDropdownVisibleChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('option', { name: 'B' }));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('autoFocus：不从外部元素抢回焦点', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <>
                <button type="button">外部</button>
                <Activity mode={mode}>
                    <Select autoFocus motion={false} optionList={optionList} />
                </Activity>
            </>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('combobox')).toHaveFocus();
        screen.getByRole('button', { name: '外部' }).focus();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('button', { name: '外部' })).toHaveFocus();
    });

    it('StrictMode 下 defaultOpen 只打开并通知一次', () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <StrictMode>
                <Select defaultOpen motion={false} optionList={optionList} onDropdownVisibleChange={onDropdownVisibleChange} />
            </StrictMode>
        );
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });
});
