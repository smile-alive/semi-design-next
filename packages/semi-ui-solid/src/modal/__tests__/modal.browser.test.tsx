import { type JSX, createSignal } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { keyboardClick, tab } from '@test/utils/browser';
import Modal, { type ModalHookRef, type ModalProps } from '..';
import Button from '../../button';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Radio, { RadioGroup } from '../../radio';
import Tag from '../../tag';

const prefix = `${BASE_CLASS_PREFIX}-modal`;
const query = (selector: string) => document.querySelector<HTMLElement>(selector) as HTMLElement;

function UseModalDemo(props: { onOpen: (handle: ModalHookRef) => void }) {
    const [modal, contextHolder] = Modal.useModal();
    return (
        <>
            <Button onClick={() => props.onOpen(modal.confirm({ title: 'old title', content: 'old content' }))}>Confirm Modal</Button>
            {contextHolder}
        </>
    );
}

function UseModalAfterClose() {
    const [modal, contextHolder] = Modal.useModal();
    const [closed, setClosed] = createSignal(false);
    const open = () => {
        const currentModal = modal.confirm({ title: 'old title', content: 'old content', afterClose: () => setClosed(true) });
        setTimeout(() => currentModal.destroy(), 0);
    };
    return (
        <>
            <Button onClick={open}>Confirm Modal</Button>
            <Tag>{`closed: ${closed()}`}</Tag>
            {contextHolder}
        </>
    );
}

function DialogComponent() {
    const [visible, setVisible] = createSignal(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>show dialog</Button>
            <Modal
                title="对话框标题"
                visible={visible()}
                onCancel={() => {
                    setVisible(false);
                }}
                onOk={() => {
                    setVisible(false);
                }}
            >
                <input aria-label="field" autofocus />
                <p>basic modal</p>
                <Button onClick={() => setVisible(false)}>hide dialog</Button>
            </Modal>
        </>
    );
}

function OpenModal(props: ModalProps & { children?: JSX.Element }) {
    const [visible, setVisible] = createSignal(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open Modal</Button>
            {/* No motion, so the measured height is not a frame of the opening animation */}
            <Modal
                title="Modal"
                motion={false}
                visible={visible()}
                onCancel={() => {
                    setVisible(false);
                }}
                {...props}
            >
                {props.children ?? (
                    <>
                        <p>This is the content of a basic modal.</p>
                        <p>Here is more content...</p>
                    </>
                )}
            </Modal>
        </>
    );
}

describe('Modal（浏览器）', () => {
    it('useModal', async () => {
        let currentModal: ModalHookRef | undefined;
        render(() => (
            <ConfigProvider locale={en_GB}>
                <UseModalDemo onOpen={(m) => (currentModal = m)} />
            </ConfigProvider>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('old title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('old content');

        currentModal?.update({ title: 'new title', content: 'new content' });
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('new title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('new content');
        const footerButtons = document.querySelectorAll(`.${prefix}-footer .${BASE_CLASS_PREFIX}-button`);
        expect(footerButtons[footerButtons.length - 1]).toHaveTextContent('Confirm');

        await userEvent.click(query(`.${prefix}-header .${prefix}-close`));
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal destroy', async () => {
        let currentModal: ModalHookRef | undefined;
        render(() => <UseModalDemo onOpen={(m) => (currentModal = m)} />);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).not.toBeNull());
        currentModal?.destroy();
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal afterClose', async () => {
        render(() => <UseModalAfterClose />);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
        await waitFor(() => expect(query(`.${BASE_CLASS_PREFIX}-tag`)).toHaveTextContent('closed: true'));
    });

    it('焦点陷阱：打开时聚焦 autofocus 元素，Tab 在对话框内循环', async () => {
        render(() => <DialogComponent />);
        await userEvent.click(screen.getByRole('button', { name: 'show dialog' }));
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'field' })).toHaveFocus());
        // WebKit runs the field's native autofocus at the next rendering update and would pull the focus back to it later in the test
        await new Promise((resolve) => requestAnimationFrame(resolve));

        await tab();
        expect(screen.getByRole('button', { name: 'hide dialog' })).toHaveFocus();
        screen.getByRole('button', { name: '确定' }).focus();
        await tab();
        expect(screen.getByRole('button', { name: zh_CN.Modal.close })).toHaveFocus();
    });

    it('打开的 Modal 背后页面无法获得焦点，关闭后焦点回到触发元素', async () => {
        render(() => <OpenModal />);
        const opener = screen.getByRole('button', { name: 'Open Modal' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        const focused = document.activeElement as HTMLElement;
        expect(dialog).toContainElement(focused);
        opener.focus();
        expect(focused).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    // A radio group is one Tab stop: from the checked radio the browser leaves the whole group
    it('焦点陷阱：末尾 RadioGroup 选中第一项时 Tab 回绕到第一个元素', async () => {
        render(() => (
            <OpenModal closable={false} footer={null}>
                <Button>start</Button>
                <RadioGroup defaultValue="a">
                    <Radio value="a">A</Radio>
                    <Radio value="b">B</Radio>
                    <Radio value="c">C</Radio>
                </RadioGroup>
            </OpenModal>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'A' }).focus();
        await userEvent.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'start' })).toHaveFocus();
    });

    it('焦点陷阱：开头 RadioGroup 选中最后一项时 Shift+Tab 回绕到最后一个元素', async () => {
        render(() => (
            <OpenModal closable={false} footer={null}>
                <RadioGroup defaultValue="c">
                    <Radio value="a">A</Radio>
                    <Radio value="b">B</Radio>
                    <Radio value="c">C</Radio>
                </RadioGroup>
                <Button>end</Button>
            </OpenModal>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'C' }).focus();
        await userEvent.tab({ shift: true });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'end' })).toHaveFocus();
    });

    it('全屏', async () => {
        render(() => <OpenModal fullScreen />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content-fullScreen`)).not.toBeNull());
        expect(query(`.${prefix}-content-fullScreen`).getBoundingClientRect().height).toBe(query(`.${prefix}-mask`).getBoundingClientRect().height);
    });

    it('设置高度', async () => {
        render(() => <OpenModal height={300} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect(query(`.${prefix}-content`).getBoundingClientRect().height).toBe(300);
    });

    it('通过 style 设置高度', async () => {
        render(() => <OpenModal style={{ height: '300px' }} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect(query(`.${prefix}-content`).getBoundingClientRect().height).toBe(300);
    });

    it('mask 为 false 时点击对话框外的页面元素落在该元素上，不触发 onCancel', async () => {
        const onPageClick = vi.fn<() => void>();
        const onCancel = vi.fn<() => void>();
        render(() => (
            <>
                <button type="button" onClick={onPageClick}>
                    page
                </button>
                <Modal title="no mask" mask={false} visible onCancel={onCancel} />
            </>
        ));
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'page' }));
        expect(onPageClick).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Modal.close }));
        await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    });

    it('ShadowRoot 内无遮罩的对话框关闭后焦点回到触发元素', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = shadow.appendChild(document.createElement('div'));
        const view = render(() => <OpenModal getPopupContainer={() => mount} mask={false} />, { container: mount });
        try {
            const pageView = within(mount);
            const opener = pageView.getByRole('button', { name: 'Open Modal' });
            await keyboardClick(opener);
            await pageView.findByRole('dialog');
            expect(shadow.activeElement).not.toBe(opener);
            pageView.getByRole('button', { name: zh_CN.Modal.close }).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(pageView.queryByRole('dialog')).toBeNull());
            expect(shadow.activeElement).toBe(opener);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('默认标题是 2 级标题，字号与 h5 标题一致', async () => {
        render(() => <OpenModal title="Dialog title" />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const heading = await screen.findByRole('heading', { level: 2, name: 'Dialog title' });
        const reference = document.body.appendChild(document.createElement('h5'));
        reference.className = `${BASE_CLASS_PREFIX}-typography ${BASE_CLASS_PREFIX}-typography-h5`;
        const expected = getComputedStyle(reference);
        const actual = getComputedStyle(heading);
        expect([actual.fontSize, actual.fontWeight, actual.lineHeight]).toEqual([expected.fontSize, expected.fontWeight, expected.lineHeight]);
        reference.remove();
    });

    it('模态覆盖层打开期间，之前打开的弹层不显示在它上面', async () => {
        function Demo() {
            const [open, setOpen] = createSignal(false);
            return (
                <>
                    <Popover content={<Button onClick={() => setOpen(true)}>open modal</Button>} motion={false} trigger="custom" visible>
                        {(t) => <Button {...t()}>anchor</Button>}
                    </Popover>
                    <Modal
                        title="Dialog"
                        motion={false}
                        visible={open()}
                        onCancel={() => {
                            setOpen(false);
                        }}
                    >
                        modal body
                    </Modal>
                </>
            );
        }
        render(() => <Demo />);
        const opener = await screen.findByRole('button', { name: 'open modal' });
        await keyboardClick(opener);
        await screen.findByRole('dialog', { name: 'Dialog' });
        await waitFor(() => expect(opener).not.toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Dialog' })).toBeNull());
        await waitFor(() => expect(opener).toBeVisible());
    });
});
