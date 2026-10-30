import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import List from './list.svelte';

describe('Svelte Sortable 服务端渲染', () => {
    it('首帧按 items 顺序输出各项与带名称的手柄按钮', () => {
        const { body } = render(List);
        expect([...body.matchAll(/<span>([abc])<\/span>/g)].map((match) => match[1])).toEqual(['a', 'b', 'c']);
        expect(body.match(new RegExp(`aria-label="${zh_CN.Transfer.dragSort}"`, 'g'))).toHaveLength(3);
        expect(body).toContain('semi-sortable-sortable-item');
    });
});
