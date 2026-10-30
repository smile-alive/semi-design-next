import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import DragFixture from './drag-fixture.svelte';

describe('Svelte dragMove 服务端首帧', () => {
    it('服务端不运行 attachment，元素照常输出且不带定位样式', () => {
        const store = createStore({ options: { positionStrategy: 'relative' as const }, show: true, second: false, variant: 'plain' as const });
        const { body } = render(DragFixture, { props: { store } });
        expect(body).toContain('Drag me');
        expect(body).not.toContain('position');
        expect(body).not.toContain('cursor');
    });
});
