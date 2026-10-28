import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import TreeSelect from '../index';

const treeData = [
    { label: 'A', value: 'a', key: 'a' },
    { label: 'B', value: 'b', key: 'b' },
];

describe('Activity 隐藏再显示 TreeSelect', () => {
    it('非受控：选中的非默认项保留，不多发 onChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <TreeSelect defaultValue="a" defaultOpen motion={false} treeData={treeData} onChange={onChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('treeitem', { name: 'B' }));
        expect(screen.getByRole('combobox')).toHaveTextContent('B');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveTextContent('B');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('defaultOpen：用户关闭的下拉不重新打开', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <TreeSelect defaultOpen motion={false} treeData={treeData} onVisibleChange={onVisibleChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('treeitem', { name: 'B' }));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('searchAutoFocus：不从外部元素抢回焦点，也不重新打开下拉', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <>
                <button type="button">外部</button>
                <Activity mode={mode}>
                    <TreeSelect filterTreeNode motion={false} searchAutoFocus searchPosition="trigger" treeData={treeData} />
                </Activity>
            </>
        );
        const { rerender } = render(view('visible'));
        expect(screen.getByRole('combobox')).toHaveFocus();
        await userEvent.click(screen.getByRole('treeitem', { name: 'B' }));
        screen.getByRole('button', { name: '外部' }).focus();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByRole('button', { name: '外部' })).toHaveFocus();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('StrictMode 下 defaultOpen 只打开并通知一次', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <StrictMode>
                <TreeSelect defaultOpen motion={false} treeData={treeData} onVisibleChange={onVisibleChange} />
            </StrictMode>
        );
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('StrictMode 下 searchAutoFocus 聚焦并只通知一次 onFocus', () => {
        const onFocus = vi.fn<(e: unknown) => void>();
        render(
            <StrictMode>
                <TreeSelect filterTreeNode motion={false} searchAutoFocus searchPosition="trigger" treeData={treeData} onFocus={onFocus} />
            </StrictMode>
        );
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });
});
