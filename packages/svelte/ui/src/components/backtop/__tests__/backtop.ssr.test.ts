import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import BackTop from '../backtop.svelte';

describe('Svelte BackTop 服务端首帧', () => {
    it('首帧不渲染按钮，也不读取 window', () => {
        const { body } = render(BackTop, { props: { visibilityHeight: -1 } });
        expect(body).not.toContain('semi-backtop');
    });
});
