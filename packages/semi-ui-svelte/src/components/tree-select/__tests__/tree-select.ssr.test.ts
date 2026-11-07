import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { TreeSelect } from '..';
import { treeData } from './data';

describe('Svelte TreeSelect 服务端首帧', () => {
    it('单选首帧显示所选项的 label，combobox 带名称与关闭状态', () => {
        const { body } = render(TreeSelect, { props: { 'aria-label': '地区', value: 'Beijing', treeData } });
        expect(body).toMatch(/semi-tree-select-selection-content[^>]*>(<!--[^>]*-->)*北京/);
        expect(body).toMatch(/<div[^>]*role="combobox"/);
        expect(body).toContain('aria-label="地区"');
        expect(body).toContain('aria-expanded="false"');
    });

    it('多选首帧渲染已选标签', () => {
        const { body } = render(TreeSelect, { props: { multiple: true, checkRelation: 'unRelated', value: ['Meiguo', 'Jianada'], treeData } });
        expect(body).toContain('semi-tree-select-multiple');
        expect(body).toMatch(/semi-tag-content[^>]*>(<!--[^>]*-->)*美国/);
        expect(body).toMatch(/semi-tag-content[^>]*>(<!--[^>]*-->)*加拿大/);
    });

    it('defaultOpen 的首帧不渲染弹层', () => {
        const { body } = render(TreeSelect, { props: { defaultOpen: true, treeData } });
        expect(body).not.toContain('semi-tree-select-popover');
    });
});
