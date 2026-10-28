import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { KEEP_INTERACTIVE_ATTRIBUTE, openLayer } from '../layer';

const pressEsc = (init = {}) => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...init });
    document.body.dispatchEvent(event);
    return event;
};

function append(parent = document.body) {
    const element = document.createElement('div');
    parent.appendChild(element);
    return element;
}

describe('layer', () => {
    const closers = [];
    const open = (layer) => {
        const close = openLayer(layer);
        closers.push(close);
        return close;
    };

    afterEach(() => {
        for (const close of closers.splice(0)) {
            close();
        }
        document.body.replaceChildren();
    });

    it('Escape 只交给最上层', () => {
        const lower = vi.fn<() => boolean>(() => true);
        const upper = vi.fn<() => boolean>(() => true);
        open({ element: append(), modal: false, onEscape: lower });
        open({ element: append(), modal: false, onEscape: upper });
        const event = pressEsc();
        expect(upper).toHaveBeenCalledTimes(1);
        expect(lower).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(true);
    });

    it('非模态层忽略 Escape 时将其传给下层，但不会传给模态层之下的层', () => {
        const lowest = vi.fn<() => boolean>(() => true);
        open({ element: append(), modal: false, onEscape: lowest });
        open({ element: append(), modal: false, onEscape: () => false });
        pressEsc();
        expect(lowest).toHaveBeenCalledTimes(1);

        open({ element: append(), modal: true, onEscape: () => false });
        const event = pressEsc();
        expect(lowest).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(false);
    });

    it('输入法组合中或已被处理的 Escape 不做处理', () => {
        const onEscape = vi.fn<() => boolean>(() => true);
        open({ element: append(), modal: false, onEscape });
        pressEsc({ isComposing: true });
        const claimed = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        claimed.preventDefault();
        document.body.dispatchEvent(claimed);
        expect(onEscape).not.toHaveBeenCalled();
    });

    it('所有层移除后停止监听，重复移除无副作用', () => {
        const onEscape = vi.fn<() => boolean>(() => true);
        const close = open({ element: append(), modal: false, onEscape });
        close();
        close();
        pressEsc();
        expect(onEscape).not.toHaveBeenCalled();
    });

    it('模态层会使页面其余部分 inert，但后续的层与带标记的元素除外', () => {
        const page = append();
        const before = append();
        open({ element: before, modal: false });
        const dialog = append();
        const closeModal = open({ element: dialog, modal: true });
        const popup = append();
        open({ element: popup, modal: false });
        const toast = append();
        toast.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        open({ element: append(dialog), modal: false });

        expect(page.inert).toBe(true);
        expect(before.inert).toBe(true);
        expect(dialog.inert).toBeFalsy();
        expect(popup.inert).toBeFalsy();
        expect(toast.inert).toBeFalsy();

        closeModal();
        expect(page.inert).toBe(false);
        expect(before.inert).toBe(false);
    });

    it('弹层渲染到对话框内的容器时，对话框内容仍可用', () => {
        const dialog = append();
        const body = append(dialog);
        const container = append(dialog);
        open({ element: dialog, modal: true });
        open({ element: append(container), modal: false });
        expect(body.inert).toBeFalsy();
        expect(container.inert).toBeFalsy();
    });

    it('自定义容器内的模态层会使其祖先链上的兄弟节点 inert', () => {
        const header = append();
        const main = append();
        const aside = append(main);
        const dialog = append(main);
        open({ element: dialog, modal: true });
        expect(header.inert).toBe(true);
        expect(aside.inert).toBe(true);
        expect(main.inert).toBeFalsy();
    });

    it('模态层打开期间，被设为 inert 的元素自身或其内部的 popover 标记为被覆盖，关闭后移除标记', () => {
        const direct = append();
        direct.setAttribute('popover', 'manual');
        const nested = append(append());
        nested.setAttribute('popover', 'manual');
        const closeModal = open({ element: append(), modal: true });
        expect(direct).toHaveAttribute('data-semi-covered');
        expect(nested).toHaveAttribute('data-semi-covered');

        closeModal();
        expect(direct).not.toHaveAttribute('data-semi-covered');
        expect(nested).not.toHaveAttribute('data-semi-covered');
    });

    it('保留其他方设置的 inert', () => {
        const page = append();
        page.inert = true;
        const close = open({ element: append(), modal: true });
        close();
        expect(page.inert).toBe(true);
    });
});
