import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import OverflowListFixture from './overflow-list-fixture.svelte';

const items = ['alarm', 'bookmark', 'camera'].map((key) => ({ key }));

describe('Svelte OverflowList 服务端首帧', () => {
    it('collapse 首帧渲染全部 item，测量前整体隐藏', () => {
        const { body } = render(OverflowListFixture, { props: { store: { items } } });
        expect(body).toContain('semi-overflow-list');
        expect(body).toContain('visibility: hidden');
        expect(body.match(/semi-overflow-list-item/g)).toHaveLength(3);
        for (const { key } of items) {
            expect(body).toContain(key);
        }
        expect(body).not.toContain('semi-overflow-list-overflow');
    });

    it('collapseFrom 为 start 时首帧按倒序渲染', () => {
        const { body } = render(OverflowListFixture, { props: { store: { items, collapseFrom: 'start' } } });
        expect(body.indexOf('camera')).toBeLessThan(body.indexOf('alarm'));
    });

    it('scroll 首帧渲染 wrapper、两侧 overflow 与全部 item', () => {
        const { body } = render(OverflowListFixture, { props: { store: { items, renderMode: 'scroll' }, itemKind: 'div', overflowKind: 'sides' } });
        expect(body).toContain('semi-overflow-list-scroll-wrapper');
        expect(body).not.toContain('visibility');
        expect(body).toContain('overflow-0:0');
        expect(body).toContain('overflow-1:0');
        for (const { key } of items) {
            expect(body).toContain(key);
        }
    });
});
