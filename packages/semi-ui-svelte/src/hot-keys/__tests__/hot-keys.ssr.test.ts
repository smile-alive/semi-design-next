import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import HotKeys from '../hot-keys.svelte';

describe('Svelte HotKeys 服务端渲染', () => {
    it('首帧输出以 "+" 连接的按键提示', () => {
        const { body } = render(HotKeys, { props: { hotKeys: ['Control', 'k'] } });
        expect(body).toContain('class="semi-hotKeys"');
        expect(body).toMatch(/semi-hotKeys-content">Control</);
        expect(body).toMatch(/semi-hotKeys-split">\+</);
        expect(body).toMatch(/semi-hotKeys-content">k</);
    });
});
