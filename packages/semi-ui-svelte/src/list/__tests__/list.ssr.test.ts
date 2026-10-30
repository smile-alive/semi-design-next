import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { List } from '../index';

describe('List 服务端渲染', () => {
    it('首帧输出全部项与默认类名', () => {
        const item = createRawSnippet<[{ item: unknown; index: number }]>((args) => ({ render: () => `<li class="semi-list-item">${String(args().item)}</li>` }));
        const { body } = render(List, { props: { dataSource: ['甲', '乙'], item } });
        expect(body).toContain('semi-list-default');
        expect(body).toContain('semi-list-split');
        expect(body).toContain('甲');
        expect(body).toContain('乙');
    });

    it('空数据时首帧输出语言包的空状态文案', () => {
        const { body } = render(List, { props: { dataSource: [] } });
        expect(body).toContain('semi-list-empty');
        expect(body).toContain('暂无数据');
    });
});
