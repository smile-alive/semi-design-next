import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { AIChatInputProps } from '../interface';
import InputHost, { type InputHostStore } from './input-host.svelte';

const prefix = 'semi-aiChatInput';

function setup(props: AIChatInputProps = {}, slots: InputHostStore['slots'] = {}, target?: HTMLElement) {
    const store = createStore<InputHostStore>({ props, slots });
    const view = render(InputHost, { props: { store, calls: {} }, target });
    return { ...view, store };
}

const find = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
    waitFor(() => {
        const found = root.querySelector<T>(selector);
        expect(found).not.toBeNull();
        return found as T;
    });

describe('AIChatInput', () => {
    it('方向键移到长列表末项时，skill 与建议面板滚动到该项', async () => {
        const items = Array.from({ length: 30 }, (_, index) => ({ label: `skill ${index}`, value: `s${index}` }));
        const { container, store } = setup({ skillHotKey: '/', skills: items });
        const editor = await find('.ProseMirror', container);
        const expectActiveVisible = async (panelSelector: string) => {
            const panel = await find(panelSelector);
            await userEvent.keyboard('{ArrowUp}');
            await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
            expect(panel.scrollTop).toBeGreaterThan(0);
            const panelRect = panel.getBoundingClientRect();
            const itemRect = (panel.lastElementChild as Element).getBoundingClientRect();
            expect(itemRect.top).toBeGreaterThanOrEqual(panelRect.top);
            expect(itemRect.bottom).toBeLessThanOrEqual(panelRect.bottom + 1);
        };

        await userEvent.click(editor);
        await userEvent.keyboard('/');
        await expectActiveVisible(`.${prefix}-skill`);

        await userEvent.keyboard('{Escape}{Backspace}');
        store.props.suggestions = items.map((item) => item.label);
        await expectActiveVisible(`.${prefix}-suggestion`);
    });

    it('建议面板与输入框同宽，打开期间输入框变宽时跟随', async () => {
        const host = document.createElement('div');
        host.style.width = '400px';
        document.body.append(host);
        onTestFinished(() => host.remove());
        const { container, store } = setup({}, {}, host);
        await find('.ProseMirror', container);
        store.props.suggestions = ['first', 'second'];
        const trigger = await find(`.${prefix}`, container);
        const panel = () => document.querySelector(`.${prefix}-suggestion`)?.closest<HTMLElement>('[popover]') ?? null;
        await waitFor(() => expect(panel()).not.toBeNull());
        await waitFor(() => expect(panel()?.getBoundingClientRect().width).toBe(trigger.getBoundingClientRect().width));
        host.style.width = '600px';
        await waitFor(() => expect(trigger.getBoundingClientRect().width).toBe(600));
        await waitFor(() => expect(panel()?.getBoundingClientRect().width).toBe(600));
    });

    const shadowRoot = () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const target = document.createElement('div');
        shadow.append(target);
        return { shadow, target };
    };

    it('面板渲染在 shadow root 内时，方向键仍把末项滚动到可见区域', async () => {
        const { shadow, target } = shadowRoot();
        // document styles do not reach into the shadow root; the panel only needs to scroll
        const style = document.createElement('style');
        style.textContent = `.${prefix}-skill { overflow: auto; }`;
        shadow.prepend(style);
        const items = Array.from({ length: 30 }, (_, index) => ({ label: `skill ${index}`, value: `s${index}` }));
        const { container } = setup({ skillHotKey: '/', skills: items }, {}, target);
        const editor = await find('.ProseMirror', container);
        // focused without a click: the unstyled panel lands under the pointer, and scrolling it would hover an item
        editor.focus();
        await userEvent.keyboard('/');
        const panel = await find(`.${prefix}-skill`, shadow);
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
        expect(panel.scrollTop).toBeGreaterThan(0);
    });

    it('渲染在 shadow root 内时，删除引用项后焦点从删除按钮移到编辑器', async () => {
        const { shadow, target } = shadowRoot();
        const references = [
            { id: 'r1', type: 'text', content: 'first' },
            { id: 'r2', type: 'text', content: 'second' },
        ];
        const { container, store } = setup({ references, onReferenceDelete: () => (store.props.references = references.slice(1)) }, {}, target);
        await find('.ProseMirror', container);
        const remove = await find(`.${prefix}-reference-delete`, container);
        remove.focus();
        expect(shadow.activeElement).toBe(remove);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement).toBe(container.querySelector('.ProseMirror')));
    });

    it('发送按钮显示主题焦点环', async () => {
        const { container } = setup();
        const send = await find(`.${prefix}-footer-action > .${prefix}-footer-action-button`, container);
        await tabTo(send);
        expectThemeFocusRing(send);
    });

    it('传 uploadTipProps 时 Tab 从编辑器直接落到上传按钮，再到发送按钮，上传按钮显示主题焦点环', async () => {
        const { container } = setup({ uploadTipProps: { position: 'top' } }, { uploadTip: true });
        const editor = await find('.ProseMirror', container);
        const upload = await find(`.${prefix}-footer-action-upload`, container);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expectThemeFocusRing(upload);
        await waitFor(() => expect(upload).toHaveAccessibleDescription('tip'));
        await userEvent.keyboard('{Tab}');
        expect(container.querySelector(`.${prefix}-footer-action-send`)).toHaveFocus();
    });

    it('uploadProps.disabled 时默认上传按钮带 aria-disabled，仍可经 Tab 到达', async () => {
        const { container } = setup({ uploadProps: { disabled: true } });
        const editor = await find('.ProseMirror', container);
        const upload = await find(`.${prefix}-footer-action-upload`, container);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expect(upload).toHaveAttribute('aria-disabled', 'true');
    });

    it('键盘激活底部按钮后焦点留在按钮上，鼠标点击空白处仍聚焦编辑器', async () => {
        const { container } = setup({ showTemplateButton: true }, { template: true });
        const button = await find(`.${prefix}-footer-configure-button`, container);
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveFocus();

        await userEvent.click(await find(`.${prefix}-footer`, container));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('鼠标点击 Configure.Select 后焦点留在 Select 上，点击空白处才聚焦编辑器', async () => {
        const { container } = setup({}, { configure: { model: true } });
        const select = await find('.semi-select', container);
        await userEvent.click(select);
        // the refocus runs in a requestAnimationFrame
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        expect(select.contains(document.activeElement)).toBe(true);

        await userEvent.click(await find(`.${prefix}-footer`, container));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板，焦点留在按钮上', async () => {
        const { container } = setup({ showTemplateButton: true }, { template: true });
        const button = await find(`.${prefix}-footer-configure-button`, container);
        await userEvent.click(button);
        await find('.tpl');
        button.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.tpl')).toBeNull());
        expect(button).toHaveFocus();
    });

    it('input-slot 的占位文字落在槽位框内，槽位与周围文字同行', async () => {
        const { container } = setup({ defaultContent: '<p>before <input-slot placeholder="your topic"></input-slot> after</p>' });
        const slot = await find('.node-inputSlot .input-slot', container);
        const placeholder = await find('.input-slot-placeholder', slot);
        await waitFor(() => expect(placeholder).toBeVisible());
        const slotRect = slot.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        expect(placeholderRect.left).toBeGreaterThanOrEqual(slotRect.left);
        await waitFor(() => expect(slot.getBoundingClientRect().right).toBeGreaterThanOrEqual(placeholderRect.right));
        const paragraph = slot.closest('p') as HTMLElement;
        const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
        expect(paragraph.getBoundingClientRect().height).toBeLessThan(slotRect.height + lineHeight);
    });
});
