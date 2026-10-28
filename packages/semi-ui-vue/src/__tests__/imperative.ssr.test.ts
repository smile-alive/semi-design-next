import { describe, expect, it } from 'vite-plus/test';
import { Modal, Notification, Toast } from '..';

describe('命令式 API 在服务端报出明确错误', () => {
    it('Toast 的错误信息含 API 名与 useToast', () => {
        expect(() => Toast.info('hi')).toThrow(/^Toast mounts into the document.*Toast\.useToast/);
    });

    it('Notification 的错误信息含 API 名与 useNotification', () => {
        expect(() => Notification.info({ title: 'hi' })).toThrow(/^Notification mounts into the document.*Notification\.useNotification/);
    });

    it('Modal.confirm 的错误信息含 API 名与 useModal', () => {
        expect(() => Modal.confirm({ title: 'hi' })).toThrow(/^Modal\.confirm mounts into the document.*Modal\.useModal/);
    });
});
