import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Modal from '..';
import Button from '../../button';
import Popover from '../../popover';
import Tooltip from '../../tooltip';

const shown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);

afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Modal 与 Tooltip 的集成', () => {
    it('Escape 关闭 Modal 内打开的浮层，下一次 Escape 才关闭 Modal', async () => {
        const onCancel = vi.fn<() => void>();
        render(() => (
            <Modal title="Dialog" motion={false} visible onCancel={onCancel}>
                <Tooltip closeOnEsc content="Content" motion={false} trigger="click">
                    {(t) => <Button {...t()}>open</Button>}
                </Tooltip>
            </Modal>
        ));
        const trigger = screen.getByRole('button', { name: 'open' });
        fireEvent.click(trigger);
        await waitFor(() => expect(shown()).not.toBeNull());
        fireEvent.keyDown(trigger, { key: 'Escape' });
        await waitFor(() => expect(shown()).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('默认在 Modal 内按 Escape 关闭聚焦打开的提示，Modal 保持打开', async () => {
        const onCancel = vi.fn<() => void>();
        render(() => (
            <Modal title="Dialog" motion={false} visible onCancel={onCancel}>
                <Tooltip content="Content" motion={false}>
                    {(t) => <Button {...t()}>hint</Button>}
                </Tooltip>
            </Modal>
        ));
        const trigger = screen.getByRole('button', { name: 'hint' });
        trigger.focus();
        await waitFor(() => expect(shown()).not.toBeNull());
        fireEvent.keyDown(trigger, { key: 'Escape' });
        await waitFor(() => expect(shown()).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
    });

    // the Modal renders outside the Popover's DOM, so it registers itself as part of the popup
    it('在弹层内容打开的 Modal 中点击，弹层不当作点击外部而关闭', async () => {
        const onClickOutSide = vi.fn<() => void>();
        function Demo() {
            const [open, setOpen] = createSignal(false);
            return (
                <Popover
                    content={
                        <>
                            <Button onClick={() => setOpen(true)}>open modal</Button>
                            <Modal
                                title="Dialog"
                                motion={false}
                                visible={open()}
                                onCancel={() => {
                                    setOpen(false);
                                }}
                            >
                                <Button>inside</Button>
                            </Modal>
                        </>
                    }
                    motion={false}
                    trigger="click"
                    onClickOutSide={onClickOutSide}
                >
                    {(t) => <Button {...t()}>anchor</Button>}
                </Popover>
            );
        }
        render(() => <Demo />);
        fireEvent.click(screen.getByRole('button', { name: 'anchor' }));
        fireEvent.click(await screen.findByRole('button', { name: 'open modal' }));
        const inside = screen.getByRole('button', { name: 'inside' });
        fireEvent.mouseDown(inside);
        fireEvent.mouseUp(inside);
        fireEvent.click(inside);
        expect(onClickOutSide).not.toHaveBeenCalled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).not.toBeNull();
    });
});
