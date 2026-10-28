import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, ConfigProvider, Modal, Radio, RadioGroup, Select, Tag } from '@fibrae/semi-ui-react';
import { keyboardClick, tab } from '@test/utils/browser';

const prefix = `${BASE_CLASS_PREFIX}-modal`;
const query = (selector) => document.querySelector(selector);

function UseModalDemo({ onOpen }) {
    const [modal, contextHolder] = Modal.useModal();
    return (
        <ConfigProvider locale={en_GB}>
            <Button onClick={() => onOpen(modal.confirm({ title: 'old title', content: 'old content' }))}>Confirm Modal</Button>
            {contextHolder}
        </ConfigProvider>
    );
}

function UseModalAfterClose() {
    const [modal, contextHolder] = Modal.useModal();
    const [closed, setClosed] = useState(false);
    const open = () => {
        const currentModal = modal.confirm({
            title: 'old title',
            content: 'old content',
            afterClose: () => setClosed(true),
        });
        setTimeout(() => currentModal.destroy(), 0);
    };
    return (
        <ConfigProvider locale={en_GB}>
            <Button onClick={open}>Confirm Modal</Button>
            <Tag>{`closed: ${closed}`}</Tag>
            {contextHolder}
        </ConfigProvider>
    );
}

function DialogComponent() {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>show dialog</Button>
            <Modal title="对话框标题" visible={visible} onCancel={() => setVisible(false)} onOk={() => setVisible(false)}>
                <input autoFocus />
                <p>basic modal</p>
                <Button onClick={() => setVisible(false)}>hide dialog</Button>
            </Modal>
        </>
    );
}

function OpenModal(props) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open Modal</Button>
            {/* No motion, so the measured height is not a frame of the opening animation */}
            <Modal title="Modal" motion={false} visible={visible} onCancel={() => setVisible(false)} {...props}>
                {props.children ?? (
                    <>
                        <p>This is the content of a basic sidesheet.</p>
                        <p>Here is more content...</p>
                    </>
                )}
            </Modal>
        </>
    );
}

describe('Modal（浏览器）', () => {
    it('useModal', async () => {
        let currentModal;
        render(<UseModalDemo onOpen={(m) => (currentModal = m)} />);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('old title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('old content');

        currentModal.update({ title: 'new title', content: 'new content' });
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('new title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('new content');
        const footerButtons = document.querySelectorAll(`.${prefix}-footer .${BASE_CLASS_PREFIX}-button`);
        expect(footerButtons[footerButtons.length - 1]).toHaveTextContent('Confirm');

        await userEvent.click(query(`.${prefix}-header .${prefix}-close`));
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal destroy', async () => {
        let currentModal;
        render(<UseModalDemo onOpen={(m) => (currentModal = m)} />);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).not.toBeNull());
        currentModal.destroy();
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal afterClose', async () => {
        render(<UseModalAfterClose />);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
        await waitFor(() => expect(query(`.${BASE_CLASS_PREFIX}-tag`)).toHaveTextContent('closed: true'));
    });

    it('useModal FocusTrap', async () => {
        render(<DialogComponent />);
        await userEvent.click(screen.getByRole('button', { name: 'show dialog' }));
        const footerButton = (name) => screen.getByRole('button', { name });
        await waitFor(() => expect(query(`.${prefix} input`)).toHaveFocus());

        await tab();
        expect(screen.getByRole('button', { name: 'hide dialog' })).toHaveFocus();
        footerButton('确定').focus();
        await tab();
        expect(screen.getByRole('button', { name: zh_CN.Modal.close })).toHaveFocus();
    });

    it('打开的 Modal 背后页面无法获得焦点，关闭后焦点回到触发元素', async () => {
        render(<OpenModal />);
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
        render(
            <OpenModal closable={false} footer={null}>
                <Button>start</Button>
                <RadioGroup defaultValue="a">
                    <Radio value="a">A</Radio>
                    <Radio value="b">B</Radio>
                    <Radio value="c">C</Radio>
                </RadioGroup>
            </OpenModal>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'A' }).focus();
        await userEvent.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'start' })).toHaveFocus();
    });

    it('焦点陷阱：开头 RadioGroup 选中最后一项时 Shift+Tab 回绕到最后一个元素', async () => {
        render(
            <OpenModal closable={false} footer={null}>
                <RadioGroup defaultValue="c">
                    <Radio value="a">A</Radio>
                    <Radio value="b">B</Radio>
                    <Radio value="c">C</Radio>
                </RadioGroup>
                <Button>end</Button>
            </OpenModal>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'C' }).focus();
        await userEvent.tab({ shift: true });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'end' })).toHaveFocus();
    });

    it('Modal 内的 Select 可正常使用，按 Escape 先关闭其列表再关闭 Modal', async () => {
        render(
            <OpenModal>
                <Select
                    optionList={[
                        { label: 'Apple', value: 'apple' },
                        { label: 'Pear', value: 'pear' },
                    ]}
                />
            </OpenModal>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await userEvent.click(await screen.findByRole('combobox'));
        await userEvent.click(await screen.findByText('Pear'));
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Pear'));

        await userEvent.click(screen.getByRole('combobox'));
        await screen.findByText('Apple');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByText('Apple')).toBeNull());
        expect(screen.getByRole('dialog', { name: 'Modal' })).toBeInTheDocument();
    });

    it('全屏', async () => {
        render(<OpenModal fullScreen />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const content = await waitFor(() => {
            const el = query(`.${prefix}-content-fullScreen`);
            expect(el).not.toBeNull();
            return el;
        });
        expect(content.getBoundingClientRect().height).toBe(query(`.${prefix}-mask`).getBoundingClientRect().height);
    });

    it('设置高度', async () => {
        render(<OpenModal height={300} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect(query(`.${prefix}-content`).getBoundingClientRect().height).toBe(300);
    });

    it('通过 style 设置高度', async () => {
        render(<OpenModal style={{ height: 300 }} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect(query(`.${prefix}-content`).getBoundingClientRect().height).toBe(300);
    });

    it('mask 为 false 时点击对话框外的页面元素落在该元素上，不触发 onCancel', async () => {
        const onPageClick = vi.fn<() => void>();
        const onCancel = vi.fn<() => void>();
        render(
            <>
                <button onClick={onPageClick}>page</button>
                <Modal title="no mask" mask={false} visible onCancel={onCancel} />
            </>
        );
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'page' }));
        expect(onPageClick).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Modal.close }));
        await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    });

    it('ShadowRoot 内无遮罩的对话框关闭后焦点回到触发元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(<OpenModal getPopupContainer={() => mount} mask={false} />, { container: mount });
        try {
            const page = within(mount);
            const opener = page.getByRole('button', { name: 'Open Modal' });
            await keyboardClick(opener);
            await page.findByRole('dialog');
            expect(shadow.activeElement).not.toBe(opener);
            page.getByRole('button', { name: zh_CN.Modal.close }).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
            expect(shadow.activeElement).toBe(opener);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('默认标题是 2 级标题，字号与 h5 标题一致', async () => {
        render(<OpenModal title="Dialog title" />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const heading = await screen.findByRole('heading', { level: 2, name: 'Dialog title' });
        const reference = document.createElement('h5');
        reference.className = `${BASE_CLASS_PREFIX}-typography ${BASE_CLASS_PREFIX}-typography-h5`;
        document.body.append(reference);
        const expected = getComputedStyle(reference);
        const actual = getComputedStyle(heading);
        expect([actual.fontSize, actual.fontWeight, actual.lineHeight]).toEqual([expected.fontSize, expected.fontWeight, expected.lineHeight]);
        reference.remove();
    });
});
