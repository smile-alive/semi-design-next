import { Activity, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import Button from '@fibrae/semi-ui-react/button';
import Tooltip from '../index';

const shownWrapperSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`;
const clickOutside = () =>
    act(() => {
        document.dispatchEvent(new Event('mousedown', { bubbles: true, cancelable: true }));
    });

describe('Activity 隐藏打开中的 Tooltip', () => {
    it('隐藏时弹层随子树隐藏且不关闭：afterClose 不调用，重新显示后原样打开，afterOpen 不重复，点击外部能关闭，点击触发器能再次打开', async () => {
        const afterClose = vi.fn<() => void>();
        const afterOpen = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Tooltip afterClose={afterClose} afterOpen={afterOpen} clickTriggerToHide content="tip" motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                    <Button>trigger</Button>
                </Tooltip>
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        expect(onVisibleChange.mock.calls).toEqual([[true]]);

        rerender(view('hidden'));
        await act(async () => {});
        expect(document.querySelector(shownWrapperSelector)).not.toBeVisible();
        rerender(view('visible'));
        await act(async () => {});
        expect(document.querySelector(shownWrapperSelector)).toBeVisible();
        expect(afterClose).not.toHaveBeenCalled();
        expect(afterOpen).toHaveBeenCalledTimes(1);
        expect(onVisibleChange.mock.calls).toEqual([[true]]);

        clickOutside();
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);

        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(afterClose).toHaveBeenCalledTimes(2);
    });

    it('受控 visible 保持为 true 时，隐藏与重新显示都不调用 afterClose、afterOpen 和 onVisibleChange，弹层原样保持打开，点击外部能关闭', async () => {
        const afterClose = vi.fn<() => void>();
        const afterOpen = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        function Controlled({ mode }: { mode: 'visible' | 'hidden' }) {
            const [visible, setVisible] = useState(true);
            return (
                <Activity mode={mode}>
                    <Tooltip
                        afterClose={afterClose}
                        afterOpen={afterOpen}
                        content="tip"
                        motion={false}
                        trigger="click"
                        visible={visible}
                        onVisibleChange={(next) => {
                            onVisibleChange(next);
                            setVisible(next);
                        }}
                    >
                        <Button>trigger</Button>
                    </Tooltip>
                </Activity>
            );
        }
        const { rerender } = render(<Controlled mode="visible" />);
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));

        rerender(<Controlled mode="hidden" />);
        await act(async () => {});
        expect(document.querySelector(shownWrapperSelector)).not.toBeVisible();
        rerender(<Controlled mode="visible" />);
        await act(async () => {});
        expect(document.querySelector(shownWrapperSelector)).toBeVisible();
        expect(afterClose).not.toHaveBeenCalled();
        expect(afterOpen).toHaveBeenCalledTimes(1);
        expect(onVisibleChange).not.toHaveBeenCalled();

        clickOutside();
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(onVisibleChange.mock.calls).toEqual([[false]]);
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });

    it('keepDOM 加受控 visible 为 true：隐藏与重新显示都不调用 afterClose 和 afterOpen，之后的关闭照常调用', async () => {
        const afterClose = vi.fn<() => void>();
        const afterOpen = vi.fn<() => void>();
        function Controlled({ mode }: { mode: 'visible' | 'hidden' }) {
            const [visible, setVisible] = useState(true);
            return (
                <Activity mode={mode}>
                    <Tooltip afterClose={afterClose} afterOpen={afterOpen} content="tip" keepDOM motion={false} trigger="click" visible={visible} onVisibleChange={setVisible}>
                        <Button>trigger</Button>
                    </Tooltip>
                </Activity>
            );
        }
        const { rerender } = render(<Controlled mode="visible" />);
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        rerender(<Controlled mode="hidden" />);
        await act(async () => {});
        rerender(<Controlled mode="visible" />);
        await act(async () => {});
        expect(document.querySelector(shownWrapperSelector)).toBeVisible();
        expect(afterClose).not.toHaveBeenCalled();
        expect(afterOpen).toHaveBeenCalledTimes(1);

        clickOutside();
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });
});
