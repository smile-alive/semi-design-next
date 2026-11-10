import { describe, expect, it } from 'vite-plus/test';
import UploadFoundation, { type BaseFileItem } from '../foundation';

const file = (patch: Partial<BaseFileItem>): BaseFileItem => ({ uid: '1', name: 'a.png', size: '1KB', status: 'success', ...patch });

describe('UploadFoundation.getFileCardFlags', () => {
    it('重试只在上传失败且未禁用时出现，文件自己的 showRetry 优先于默认值', () => {
        const failed = file({ status: 'uploadFail' });
        expect(UploadFoundation.getFileCardFlags(failed, { showRetry: true }).showRetry).toBe(true);
        expect(UploadFoundation.getFileCardFlags(failed, { showRetry: true, disabled: true }).showRetry).toBe(false);
        expect(UploadFoundation.getFileCardFlags(failed, {}).showRetry).toBe(false);
        expect(UploadFoundation.getFileCardFlags({ ...failed, showRetry: false }, { showRetry: true }).showRetry).toBe(false);
    });

    it('替换按钮出现时预览层让位', () => {
        const done = file({ status: 'success' });
        expect(UploadFoundation.getFileCardFlags(done, { showReplace: true })).toMatchObject({ showReplace: true, showPreview: false });
        expect(UploadFoundation.getFileCardFlags(done, {})).toMatchObject({ showReplace: false, showPreview: true });
    });

    it('列表进度要求 percent 已定义且不为 100，图片进度只要求不为 100', () => {
        const flags = (percent?: number) => UploadFoundation.getFileCardFlags(file({ status: 'uploading', percent }), {});
        expect(flags(50)).toMatchObject({ showListProgress: true, showPicProgress: true });
        expect(flags(undefined)).toMatchObject({ showListProgress: false, showPicProgress: true });
        expect(flags(100)).toMatchObject({ showListProgress: false, showPicProgress: false });
    });

    it('校验失败与上传失败都算 failed', () => {
        expect(UploadFoundation.getFileCardFlags(file({ status: 'validateFail' }), {}).failed).toBe(true);
        expect(UploadFoundation.getFileCardFlags(file({ status: 'uploadFail' }), {}).failed).toBe(true);
        expect(UploadFoundation.getFileCardFlags(file({ status: 'success' }), {}).failed).toBe(false);
    });
});

describe('UploadFoundation.getFallbackValidateMessage', () => {
    const locale = { fail: 'failed', illegalSize: 'bad size' };

    it('文件自带 validateMessage 时不回退', () => {
        expect(UploadFoundation.getFallbackValidateMessage(file({ status: 'uploadFail', validateMessage: 'mine' }), locale)).toBeUndefined();
    });

    it('体积不合法优先于上传失败', () => {
        expect(UploadFoundation.getFallbackValidateMessage(file({ status: 'uploadFail', _sizeInvalid: true }), locale)).toBe('bad size');
        expect(UploadFoundation.getFallbackValidateMessage(file({ status: 'uploadFail' }), locale)).toBe('failed');
        expect(UploadFoundation.getFallbackValidateMessage(file({ status: 'success' }), locale)).toBeUndefined();
    });
});
