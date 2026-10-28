import { Activity, StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Cascader from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;
const treeData = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
];
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection`)?.textContent;

describe('Activity 隐藏再显示 Cascader', () => {
    it('非受控：选中的非默认项保留，不多发 onChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Cascader defaultValue={['a']} motion={false} treeData={treeData} onChange={onChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(screen.getByText('B', { selector: `.${prefixCls}-option-label > span` }));
        expect(getSelectionText()).toBe('B');

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(getSelectionText()).toBe('B');
        expect(onChange.mock.calls).toEqual([[['b']]]);
    });

    it('defaultOpen：用户关闭的下拉不重新打开', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Cascader defaultOpen motion={false} treeData={treeData} onDropdownVisibleChange={onDropdownVisibleChange} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByText('B', { selector: `.${prefixCls}-option-label > span` }));
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
                <Cascader defaultOpen motion={false} treeData={treeData} onDropdownVisibleChange={onDropdownVisibleChange} />
            </StrictMode>
        );
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });
});
