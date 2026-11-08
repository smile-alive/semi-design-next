import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { findAll, type Chunk, type ComplexSearchWord } from '../foundation';

const highlighted = (chunks, source) => chunks.filter((chunk) => chunk.highlight).map((chunk) => source.slice(chunk.start, chunk.end));

describe('findAll', () => {
    it('默认转义搜索词中的正则语法', () => {
        const source = 'a+b (c) [d] 1.5 ^$ a+b';
        const chunks = findAll({
            sourceString: source,
            searchWords: ['a+b', '(c)', '[d]', '1.5', '^$'],
        });
        expect(highlighted(chunks, source)).toEqual(['a+b', '(c)', '[d]', '1.5', '^$', 'a+b']);
    });

    it('除非设置 caseSensitive，否则忽略大小写匹配', () => {
        const source = 'Semi semi SEMI';
        expect(highlighted(findAll({ sourceString: source, searchWords: ['semi'] }), source)).toEqual(['Semi', 'semi', 'SEMI']);
        expect(highlighted(findAll({ sourceString: source, searchWords: ['semi'], caseSensitive: true }), source)).toEqual(['semi']);
    });

    it('autoEscape 为 false 时把搜索词当作正则模式', () => {
        const source = 'a1 b2 c3';
        const chunks = findAll({
            sourceString: source,
            searchWords: ['[ab]\\d'],
            autoEscape: false,
        });
        expect(highlighted(chunks, source)).toEqual(['a1', 'b2']);
    });

    it('相邻的对象搜索词各自保留 className 与 style，重叠的才合并', () => {
        const words: ComplexSearchWord[] = [
            { text: 'ab', className: 'red', style: { color: 'red' } },
            { text: 'cd', className: 'blue', style: { color: 'blue' } },
        ];
        const adjacent = findAll({ sourceString: 'abcd', searchWords: words }).filter((chunk) => chunk.highlight);
        expect(adjacent).toEqual([
            { start: 0, end: 2, highlight: true, className: 'red', style: { color: 'red' } },
            { start: 2, end: 4, highlight: true, className: 'blue', style: { color: 'blue' } },
        ]);

        const overlapping = findAll({
            sourceString: 'abcd',
            searchWords: [{ text: 'abc', className: 'red' }, 'bcd'],
        }).filter((chunk) => chunk.highlight);
        expect(overlapping).toHaveLength(1);
        expect([overlapping[0].start, overlapping[0].end]).toEqual([0, 4]);
    });

    it('searchWords 可以是单个字符串', () => {
        const source = 'Semi Design';
        expect(highlighted(findAll({ sourceString: source, searchWords: 'Design' }), source)).toEqual(['Design']);
    });

    it('类型与运行时一致：样式值可为数字，非高亮块没有 className 与 style', () => {
        expectTypeOf<{ text: string; style: { fontWeight: number } }>().toExtend<ComplexSearchWord>();
        expectTypeOf<{ start: number; end: number; highlight: boolean }>().toExtend<Chunk>();
    });
});
