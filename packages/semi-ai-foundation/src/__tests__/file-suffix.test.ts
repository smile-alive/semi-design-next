import { describe, expect, it } from 'vite-plus/test';
import { getFileSuffix, getFileType, isImageFile } from '../file-suffix';

describe('getFileSuffix', () => {
    it.each([
        ['a.PNG', 'png'],
        ['a.tar.gz', 'gz'],
        ['README', undefined],
        ['.env', undefined],
        ['a.', undefined],
        [undefined, undefined],
    ])('%s 的后缀为 %s', (name, suffix) => {
        expect(getFileSuffix(name)).toBe(suffix);
    });
});

describe('getFileType', () => {
    it.each([
        ['a.PDF', 'application/json', 'pdf'],
        ['README', 'text/plain', 'plain'],
        ['README', undefined, undefined],
        [undefined, 'image/png', 'png'],
        ['README', '', ''],
    ])('%s 与 MIME %s 的类型为 %s', (name, mime, type) => {
        expect(getFileType(name, mime)).toBe(type);
    });
});

describe('isImageFile', () => {
    it('按 MIME 或不区分大小写的图片后缀判断图片', () => {
        expect(isImageFile('IMG_0001.JPG')).toBe(true);
        expect(isImageFile('photo', 'image/heic')).toBe(true);
        expect(isImageFile('png')).toBe(false);
        expect(isImageFile('a.pdf', 'application/pdf')).toBe(false);
        expect(isImageFile()).toBe(false);
    });
});
