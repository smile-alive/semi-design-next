import { describe, expect, it } from 'vite-plus/test';
import { getColumns, highlightParts } from '../util';

describe('highlightParts', () => {
    it('splits every match and keeps the separator between labels', () => {
        expect(highlightParts(['Zhejiang', 'Hangzhou'], 'ang', ' / ')).toEqual([
            { text: 'Zheji', match: false },
            { text: 'ang', match: true },
            { text: ' / ', match: false },
            { text: 'H', match: false },
            { text: 'ang', match: true },
            { text: 'zhou', match: false },
        ]);
    });

    it('matches case-insensitively and keeps the original case', () => {
        expect(highlightParts(['Hello'], 'LL', '/')).toEqual([
            { text: 'He', match: false },
            { text: 'll', match: true },
            { text: 'o', match: false },
        ]);
    });

    it('passes a non-string label through unmatched', () => {
        const node = { tag: 'b' };
        expect(highlightParts([node, 'ab'], 'a', '/')).toEqual([
            { text: node, match: false },
            { text: '/', match: false },
            { text: 'a', match: true },
            { text: 'b', match: false },
        ]);
    });

    it('matches nothing for an empty keyword', () => {
        expect(highlightParts(['ab', 'cd'], '', '/')).toEqual([
            { text: 'ab', match: false },
            { text: '/', match: false },
            { text: 'cd', match: false },
        ]);
    });
});

describe('getColumns', () => {
    interface Node {
        key: string;
        data: { children?: unknown[] };
        children?: Node[];
    }
    const leaf = (key: string): Node => ({ key, data: {} });
    const branch = (key: string, children: Node[]): Node => ({ key, data: { children }, children });
    const tree = [branch('a', [branch('a-1', [leaf('a-1-1')]), leaf('a-2')]), branch('b', [leaf('b-1')])];

    it('returns the top level when nothing is active', () => {
        expect(getColumns(tree, new Set())).toEqual([{ items: tree, level: 0 }]);
    });

    it('follows the active path one column per level', () => {
        const columns = getColumns(tree, new Set(['a', 'a-1']));
        expect(columns.map((column) => [column.level, column.items.map((item) => item.key)])).toEqual([
            [0, ['a', 'b']],
            [1, ['a-1', 'a-2']],
            [2, ['a-1-1']],
        ]);
    });

    it('stops at an active node without children', () => {
        expect(getColumns(tree, new Set(['a', 'a-2'])).map((column) => column.level)).toEqual([0, 1]);
    });

    it('returns no columns for an empty top level', () => {
        expect(getColumns([], new Set())).toEqual([]);
    });
});
