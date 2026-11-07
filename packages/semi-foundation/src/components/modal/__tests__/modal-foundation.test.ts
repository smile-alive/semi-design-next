import { describe, expect, it, vi } from 'vite-plus/test';
import ModalFoundation, { type ModalAdapter, type ModalProps } from '../modal-foundation';

function createFoundation(props: ModalProps) {
    const notifyClose = vi.fn<() => void>();
    const adapter = {
        getProp: (key: keyof ModalProps) => props[key],
        getProps: () => props,
        getState: () => undefined,
        getStates: () => ModalFoundation.getInitialState(),
        setState: () => {},
        getContext: () => undefined,
        getContexts: () => ({}),
        notifyCancel: () => {},
        notifyOk: () => {},
        notifyClose,
    } as unknown as ModalAdapter;
    return { foundation: new ModalFoundation(adapter), notifyClose };
}

describe('ModalFoundation.handleHidden', () => {
    it('挂载即可见的弹窗在隐藏或卸载时只报一次 afterClose', () => {
        const { foundation, notifyClose } = createFoundation({ visible: true });
        foundation.handleHidden();
        foundation.handleHidden();
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('从未显示的弹窗卸载时不报 afterClose', () => {
        const { foundation, notifyClose } = createFoundation({ visible: false });
        foundation.handleHidden();
        expect(notifyClose).not.toHaveBeenCalled();
    });

    it('每次显示各报一次 afterClose', () => {
        const { foundation, notifyClose } = createFoundation({ visible: false });
        foundation.beforeShow();
        foundation.afterHide();
        foundation.handleHidden();
        foundation.beforeShow();
        foundation.afterHide();
        foundation.handleHidden();
        expect(notifyClose).toHaveBeenCalledTimes(2);
    });
});

describe('ModalFoundation.getInitialFocus', () => {
    it('默认聚焦取消按钮，okButtonProps.autoFocus 时聚焦确定按钮', () => {
        expect(ModalFoundation.getInitialFocus({ customFooter: false, hasCancel: true })).toBe('cancel');
        expect(ModalFoundation.getInitialFocus({ customFooter: false, hasCancel: true, okButtonProps: { autoFocus: true } })).toBe('ok');
    });

    it('没有取消按钮或取消按钮关闭 autoFocus 时不指定', () => {
        expect(ModalFoundation.getInitialFocus({ customFooter: false, hasCancel: false })).toBeUndefined();
        expect(ModalFoundation.getInitialFocus({ customFooter: false, hasCancel: true, cancelButtonProps: { autoFocus: false } })).toBeUndefined();
    });

    it('自定义 footer 时不指定', () => {
        expect(ModalFoundation.getInitialFocus({ customFooter: true, hasCancel: true, okButtonProps: { autoFocus: true } })).toBeUndefined();
    });
});
