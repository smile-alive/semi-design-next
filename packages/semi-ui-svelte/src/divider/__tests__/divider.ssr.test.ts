import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import DividerFixture from './divider-fixture.svelte';

describe('Svelte Divider 服务端首帧', () => {
    it('带文字的首帧有 with-text 类与 inner-text，且不带 role', () => {
        const store = createStore({ props: { align: 'left' as const }, content: 'text' as const });
        const { body } = render(DividerFixture, { props: { store } });
        expect(body).toContain('semi-divider-with-text-left');
        expect(body).toContain('semi-divider_inner-text');
        expect(body).not.toContain('role=');
    });

    it('无文字的首帧是 separator', () => {
        const { body } = render(DividerFixture, { props: { store: createStore({ props: {} }) } });
        expect(body).toContain('role="separator"');
    });
});
