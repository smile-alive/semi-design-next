import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ModalContentFoundation, { type ModalContentAdapter, isModal } from '../modal-content-foundation';

function setup() {
    const notifyClose = vi.fn<ModalContentAdapter['notifyClose']>();
    const adapter = {
        notifyClose,
        openLayer: () => {},
        closeLayer: () => {},
        trapFocus: () => {},
        releaseFocus: () => {},
        restoreFocus: () => {},
    } as unknown as ModalContentAdapter;
    const foundation = new ModalContentFoundation(adapter);
    const mask = document.createElement('div');
    const maskClick = { target: mask, currentTarget: mask };
    return { foundation, notifyClose, maskClick };
}

describe('isModal', () => {
    it('只有覆盖整页的遮罩才算模态', () => {
        expect(isModal({ mask: true, maskFixed: false, inBody: true })).toBe(true);
        expect(isModal({ mask: true, maskFixed: true, inBody: false })).toBe(true);
        expect(isModal({ mask: true, maskFixed: false, inBody: false })).toBe(false);
        expect(isModal({ mask: false, maskFixed: true, inBody: true })).toBe(false);
    });
});

describe('ModalContentFoundation 的遮罩点击', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('在遮罩上按下并点击时关闭', () => {
        const { foundation, notifyClose, maskClick } = setup();
        foundation.handleMaskClick(maskClick);
        expect(notifyClose).toHaveBeenCalledWith(maskClick);
    });

    it('在对话框内按下、在遮罩上松开时不关闭，下一次点击才关闭', () => {
        const { foundation, notifyClose, maskClick } = setup();
        foundation.handleDialogMouseDown();
        foundation.handleMaskMouseUp();
        foundation.handleMaskClick(maskClick);
        expect(notifyClose).not.toHaveBeenCalled();
        vi.runAllTimers();
        foundation.handleMaskClick(maskClick);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('hide 清除按下标记和待执行的计时器', () => {
        const { foundation, notifyClose, maskClick } = setup();
        foundation.handleDialogMouseDown();
        foundation.handleMaskMouseUp();
        foundation.hide();
        expect(vi.getTimerCount()).toBe(0);
        foundation.handleMaskClick(maskClick);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });
});
