import { describe, expect, it } from 'vite-plus/test';
import { getColumns, highlightParts } from '../util';

describe('highlightParts', () => {
    it('每处匹配都被切分，标签之间保留分隔符', () => {
        expect(highlightParts(['Zhejiang', 'Hangzhou'], 'ang', ' / ')).toEqual([
            { text: 'Zheji', match: false },
            { text: 'ang', match: true },
            { text: ' / ', match: false },
            { text: 'H', match: false },
            { text: 'ang', match: true },
            { text: 'zhou', match: false },
        ]);
    });

    it('匹配不区分大小写，并保留原文的大小写', () => {
        expect(highlightParts(['Hello'], 'LL', '/')).toEqual([
            { text: 'He', match: false },
            { text: 'll', match: true },
            { text: 'o', match: false },
        ]);
    });

    it('非字符串标签原样返回且不参与匹配', () => {
        const node = { tag: 'b' };
        expect(highlightParts([node, 'ab'], 'a', '/')).toEqual([
            { text: node, match: false },
            { text: '/', match: false },
            { text: 'a', match: true },
            { text: 'b', match: false },
        ]);
    });

    it('关键字为空时没有任何匹配', () => {
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

    it('没有激活项时只返回顶层一列', () => {
        expect(getColumns(tree, new Set())).toEqual([{ items: tree, level: 0 }]);
    });

    it('沿激活路径逐级展开，每级一列', () => {
        const columns = getColumns(tree, new Set(['a', 'a-1']));
        expect(columns.map((column) => [column.level, column.items.map((item) => item.key)])).toEqual([
            [0, ['a', 'b']],
            [1, ['a-1', 'a-2']],
            [2, ['a-1-1']],
        ]);
    });

    it('激活项没有子节点时到此为止', () => {
        expect(getColumns(tree, new Set(['a', 'a-2'])).map((column) => column.level)).toEqual([0, 1]);
    });

    it('顶层为空时没有列', () => {
        expect(getColumns([], new Set())).toEqual([]);
    });
});
