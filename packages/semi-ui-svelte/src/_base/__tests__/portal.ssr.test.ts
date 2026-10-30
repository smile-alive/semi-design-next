import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import PortalFixture from './portal-fixture.svelte';

describe('Svelte Portal 服务端渲染', () => {
    it('不访问 document，首帧不输出弹层', () => {
        const { body } = render(PortalFixture, { props: { store: { open: true, content: true, global: true } } });
        expect(body).toContain('before');
        expect(body).not.toContain('semi-portal');
        expect(body).not.toContain('inside');
    });
});
