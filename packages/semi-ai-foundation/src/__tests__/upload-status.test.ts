import { describe, expect, it } from 'vite-plus/test';
import { isUploadProgressVisible } from '../upload-status';

describe('isUploadProgressVisible', () => {
    it.each([
        [50, 'uploading', true],
        [0, 'uploading', true],
        [100, 'uploading', false],
        [undefined, 'uploading', false],
        [50, 'success', false],
        [50, undefined, false],
    ])('percent %s、status %s 时为 %s', (percent, status, visible) => {
        expect(isUploadProgressVisible({ percent, status })).toBe(visible);
    });
});
