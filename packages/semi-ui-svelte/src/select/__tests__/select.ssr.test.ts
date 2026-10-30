import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Select } from '..';

const optionList = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
];

describe('Svelte Select 服务端首帧', () => {
    it('单选首帧显示所选项的 label，combobox 带名称与关闭状态', () => {
        const { body } = render(Select, { props: { 'aria-label': '水果', value: 'b', optionList } });
        expect(body).toMatch(/semi-select-selection-text[^>]*>(<!--[^>]*-->)*Banana/);
        expect(body).toMatch(/<div[^>]*role="combobox"/);
        expect(body).toContain('aria-label="水果"');
        expect(body).toContain('aria-expanded="false"');
    });

    it('多选首帧渲染已选标签', () => {
        const { body } = render(Select, { props: { multiple: true, value: ['a', 'b'], optionList } });
        expect(body).toContain('semi-select-multiple');
        expect(body).toMatch(/semi-tag-content[^>]*>(<!--[^>]*-->)*Apple/);
        expect(body).toMatch(/semi-tag-content[^>]*>(<!--[^>]*-->)*Banana/);
    });
});
