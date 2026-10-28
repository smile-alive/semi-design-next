/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { keyboardClick, tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Button from '../../button';
import Dropdown from '../../dropdown';
import Radio, { RadioGroup } from '../../radio';
import type { ModalHookRef } from '../interface';
import Modal from '../modal.vue';
import DialogComponent from './fixtures/dialog-component.vue';
import OpenModal from './fixtures/open-modal.vue';
import UseModalDemo from './fixtures/use-modal-demo.vue';

const prefix = 'semi-modal';
const query = (selector: string) => document.querySelector<HTMLElement>(selector);
const radios = (checked: string) => () => <RadioGroup defaultValue={checked}>{() => ['a', 'b', 'c'].map((v) => <Radio value={v}>{() => v.toUpperCase()}</Radio>)}</RadioGroup>;

describe('Modal（浏览器）', () => {
    it('ShadowRoot 内无遮罩的对话框关闭后焦点回到触发元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(OpenModal, { container: mount, props: { getPopupContainer: () => mount, mask: false } });
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

    it('useModal', async () => {
        let current: ModalHookRef | undefined;
        render(UseModalDemo, { props: { onOpen: (handle: ModalHookRef) => (current = handle) } });
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('old title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('old content');

        current?.update({ title: 'new title', content: 'new content' });
        await waitFor(() => expect(query(`.${prefix}-confirm-title-text`)).toHaveTextContent('new title'));
        expect(query(`.${prefix}-confirm-content`)).toHaveTextContent('new content');
        const footerButtons = document.querySelectorAll(`.${prefix}-footer .semi-button`);
        expect(footerButtons[footerButtons.length - 1]).toHaveTextContent('Confirm');

        await userEvent.click(query(`.${prefix}-header .${prefix}-close`) as HTMLElement);
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal destroy', async () => {
        let current: ModalHookRef | undefined;
        render(UseModalDemo, { props: { onOpen: (handle: ModalHookRef) => (current = handle) } });
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).not.toBeNull());
        current?.destroy();
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
    });

    it('useModal afterClose', async () => {
        render(UseModalDemo, { props: { destroySoon: true } });
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Modal' }));
        await waitFor(() => expect(query(`.${prefix}`)).toBeNull());
        await waitFor(() => expect(screen.getByRole('status', { name: 'closed' })).toHaveTextContent('closed: true'));
    });

    it('焦点陷阱：正文中的 autofocus 输入框先获得焦点，Tab 在对话框内回绕', async () => {
        render(DialogComponent);
        await userEvent.click(screen.getByRole('button', { name: 'show dialog' }));
        const footerButton = (name: string) => screen.getByRole('button', { name });
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'name' })).toHaveFocus());

        await tab();
        expect(screen.getByRole('button', { name: 'hide dialog' })).toHaveFocus();
        footerButton('确定').focus();
        await tab();
        expect(screen.getByRole('button', { name: zh_CN.Modal.close })).toHaveFocus();
    });

    it('正文没有 autofocus 元素时，打开后取消按钮获得焦点', async () => {
        render(OpenModal);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(screen.getByRole('button', { name: '取消' })).toHaveFocus());
    });

    it('打开的 Modal 背后页面无法获得焦点，关闭后焦点回到触发元素', async () => {
        render(OpenModal);
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
        render(OpenModal, {
            props: { closable: false, noFooter: true },
            slots: {
                default: () => (
                    <>
                        <Button>{() => 'start'}</Button>
                        {radios('a')()}
                    </>
                ),
            },
        });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'A' }).focus();
        await userEvent.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'start' })).toHaveFocus();
    });

    it('焦点陷阱：开头 RadioGroup 选中最后一项时 Shift+Tab 回绕到最后一个元素', async () => {
        render(OpenModal, {
            props: { closable: false, noFooter: true },
            slots: { default: () => [radios('c')(), <Button>{() => 'end'}</Button>] },
        });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        screen.getByRole('radio', { name: 'C' }).focus();
        await userEvent.tab({ shift: true });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(screen.getByRole('button', { name: 'end' })).toHaveFocus();
    });

    it('mask 为 false 时 Tab 可以离开对话框', async () => {
        render({
            render: () => (
                <>
                    <OpenModal mask={false} />
                    <button type="button">after page</button>
                </>
            ),
        });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const dialog = await screen.findByRole('dialog', { name: 'Modal' });
        // backwards from the first control: past the document's end Firefox keeps the focus where it is
        screen.getByRole('button', { name: zh_CN.Modal.close }).focus();
        await tab({ shift: true });
        expect(dialog).not.toContainElement(document.activeElement as HTMLElement);
    });

    it('Modal 内的 Dropdown，按 Escape 先关闭其菜单再关闭 Modal', async () => {
        render(OpenModal, {
            slots: {
                default: () => (
                    <Dropdown
                        trigger="click"
                        menu={[
                            { node: 'item', name: 'Apple' },
                            { node: 'item', name: 'Pear' },
                        ]}
                    >
                        {() => <Button>{() => 'Fruit'}</Button>}
                    </Dropdown>
                ),
            },
        });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Fruit' }));
        await screen.findByText('Apple');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByText('Apple')).toBeNull());
        expect(screen.getByRole('dialog', { name: 'Modal' })).toBeInTheDocument();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('keepDOM 有动画时关闭再重开，焦点回到对话框内', async () => {
        const view = render(Modal, { props: { visible: true, keepDOM: true, motion: true, title: 'Kept' } });
        await screen.findByRole('dialog', { name: 'Kept' });
        await view.rerender({ visible: false, keepDOM: true, motion: true, title: 'Kept' });
        await waitFor(() => expect(query('.semi-portal')?.firstElementChild).toHaveClass(`${prefix}-displayNone`));
        await view.rerender({ visible: true, keepDOM: true, motion: true, title: 'Kept' });
        await waitFor(() => expect(query(`.${prefix}-content`)).toContainElement(document.activeElement as HTMLElement));
    });

    it('全屏', async () => {
        render(OpenModal, { props: { fullScreen: true } });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content-fullScreen`)).not.toBeNull());
        const content = query(`.${prefix}-content-fullScreen`) as HTMLElement;
        expect(content.getBoundingClientRect().height).toBe((query(`.${prefix}-mask`) as HTMLElement).getBoundingClientRect().height);
    });

    it('设置高度', async () => {
        render(OpenModal, { props: { height: 300 } });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect((query(`.${prefix}-content`) as HTMLElement).getBoundingClientRect().height).toBe(300);
    });

    it('通过 style 设置高度', async () => {
        render(OpenModal, { attrs: { style: { height: '300px' } } });
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        await waitFor(() => expect(query(`.${prefix}-content`)).not.toBeNull());
        expect((query(`.${prefix}-content`) as HTMLElement).getBoundingClientRect().height).toBe(300);
    });

    it('mask 为 false 时点击对话框外的页面元素落在该元素上，不触发 onCancel', async () => {
        const onPageClick = vi.fn<() => void>();
        const onCancel = vi.fn<() => void>();
        const Page = defineComponent({
            render: () => (
                <>
                    <button onClick={onPageClick}>page</button>
                    <Modal visible mask={false} title="no mask" onCancel={onCancel} />
                </>
            ),
        });
        render(Page);
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'page' }));
        expect(onPageClick).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Modal.close }));
        await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    });

    it('默认标题是 2 级标题，字号与 h5 标题一致', async () => {
        render(OpenModal);
        await userEvent.click(screen.getByRole('button', { name: 'Open Modal' }));
        const heading = await screen.findByRole('heading', { level: 2, name: 'Modal' });
        const reference = document.createElement('h5');
        reference.className = 'semi-typography semi-typography-h5';
        document.body.append(reference);
        const expected = getComputedStyle(reference);
        const actual = getComputedStyle(heading);
        expect([actual.fontSize, actual.fontWeight, actual.lineHeight]).toEqual([expected.fontSize, expected.fontWeight, expected.lineHeight]);
        reference.remove();
    });
});
