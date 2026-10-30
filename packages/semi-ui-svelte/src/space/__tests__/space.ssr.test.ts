import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import SpaceFixture from './space-fixture.svelte';

describe('Svelte Space 服务端首帧', () => {
    it('首帧带间距类名、gap 与子内容', () => {
        const store = createStore({ props: { spacing: ['loose', 12] as ['loose', number], vertical: true }, count: 2 });
        const { body } = render(SpaceFixture, { props: { store } });
        expect(body).toContain('semi-space-vertical');
        expect(body).toContain('semi-space-loose-horizontal');
        expect(body).toContain('row-gap: 12px');
        expect(body.match(/<span>content<\/span>/g)).toHaveLength(2);
    });
});
