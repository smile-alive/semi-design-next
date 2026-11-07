import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Badge from '../badge.svelte';

describe('Svelte Badge 服务端渲染', () => {
    it('首帧带计数文字与类名', () => {
        const { body } = render(Badge, { props: { count: 99, overflowCount: 10 } });
        expect(body).toContain('semi-badge-count');
        expect(body).toContain('10+');
    });
});
