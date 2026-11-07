import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Tree from '../tree.svelte';
import { treeData } from './data';

describe('Svelte Tree 服务端首帧', () => {
    it('首帧带展开的行、选中状态与 aria-activedescendant', () => {
        const { body } = render(Tree, { props: { treeData, expandedKeys: ['yazhou'], value: 'Riben', 'aria-label': '地区' } });
        expect(body).toContain('role="tree"');
        expect(body).toContain('aria-label="地区"');
        expect(body).toMatch(/data-key="zhongguo"/);
        expect(body).toMatch(/data-key="riben"/);
        expect(body).not.toMatch(/data-key="beijing"/);
        expect(body).toMatch(/<li[^>]*aria-selected="true"[^>]*data-key="riben"/);
        const active = /aria-activedescendant="([^"]+)"/.exec(body)?.[1];
        expect(body).toMatch(new RegExp(`<li[^>]*data-key="riben"[^>]*id="${active}"`));
    });

    it('多选首帧带勾选与半选状态，空数据显示空状态', () => {
        const multiple = render(Tree, { props: { treeData, multiple: true, expandAll: true, value: ['Beijing'] } }).body;
        expect(multiple).toMatch(/<li[^>]*aria-checked="true"[^>]*data-key="beijing"/);
        expect(multiple).toMatch(/<li[^>]*aria-checked="mixed"[^>]*data-key="zhongguo"/);
        const empty = render(Tree, { props: { treeData: [] } }).body;
        expect(empty).toContain('semi-tree-option-empty');
        expect(empty).not.toContain('role="tree"');
    });
});
