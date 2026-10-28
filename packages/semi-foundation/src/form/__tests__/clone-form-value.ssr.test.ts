import { describe, expect, it } from 'vite-plus/test';
import { cloneFormValue } from '../utils';

describe('cloneFormValue 在 Node 中', () => {
    it('File 与 Blob 按引用保留，二次克隆不崩溃', () => {
        const file = new File(['a'], 'a.txt', { type: 'text/plain' });
        const blob = new Blob(['b']);
        const value = { upload: [{ uid: '1', fileInstance: file }], blob };
        const copy = cloneFormValue(
            cloneFormValue(value, () => false),
            () => false
        );
        expect(copy.upload[0].fileInstance).toBe(file);
        expect(copy.blob).toBe(blob);
        expect(copy.upload).not.toBe(value.upload);
    });
});
