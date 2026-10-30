import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import SpinFixture from './spin-fixture.svelte';

describe('Svelte Spin 服务端首帧', () => {
    it('首帧带 status 名称、tip 与 busy 标记', () => {
        const store = createStore({ props: {}, content: true, tip: 'Fetching' });
        const { body } = render(SpinFixture, { props: { store } });
        expect(body).toContain(`aria-label="${zh_CN.Spin.loading}"`);
        expect(body).toContain('Fetching');
        expect(body).toContain('aria-busy="true"');
        expect(body).toContain('tabindex="-1"');
        expect(body).not.toContain('semi-spin-hidden');
    });

    it('spinning=false 首帧不输出 status', () => {
        const store = createStore({ props: { spinning: false } });
        const { body } = render(SpinFixture, { props: { store } });
        expect(body).toContain('semi-spin-hidden');
        expect(body).not.toContain('<output');
    });
});
