import { describe, expect, it } from 'vite-plus/test';
import ModalFoundation from '../modal-foundation';

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
