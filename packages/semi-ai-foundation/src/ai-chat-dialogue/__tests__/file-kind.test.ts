import { describe, expect, it } from 'vite-plus/test';
import { getFileSuffix } from '../../file-suffix';
import { getDialogueFileKind } from '../constants';

describe('getDialogueFileKind', () => {
    it.each([
        ['docx', 'word'],
        ['png', 'image'],
        ['pdf', 'pdf'],
        ['xlsx', 'excel'],
        ['tsx', 'code'],
        ['mkv', 'video'],
        ['zip', undefined],
        [undefined, undefined],
    ])('%s 归为 %s', (type, kind) => {
        expect(getDialogueFileKind(type)).toBe(kind);
    });

    it('引用列表按文件名后缀归类：没有扩展名或以点开头的名字不归类', () => {
        expect(getDialogueFileKind(getFileSuffix('REPORT.DOCX'))).toBe('word');
        expect(getDialogueFileKind(getFileSuffix('doc'))).toBeUndefined();
        expect(getDialogueFileKind(getFileSuffix('.js'))).toBeUndefined();
    });
});
