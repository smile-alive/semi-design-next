import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import SkeletonDemo from './skeleton-demo.svelte';

describe('Skeleton 服务端渲染', () => {
    it('首帧输出占位根节点与占位块', () => {
        const { body } = render(SkeletonDemo, { props: { store: { active: true } } });
        expect(body).toContain('semi-skeleton semi-skeleton-active');
        expect(body).toContain('aria-busy="true"');
        expect(body).toContain('semi-skeleton-avatar');
        expect(body).not.toContain('content');
    });

    it('加载结束时只输出内容', () => {
        const { body } = render(SkeletonDemo, { props: { store: { loading: false } } });
        expect(body).toContain('content');
        expect(body).not.toContain('semi-skeleton');
    });
});
