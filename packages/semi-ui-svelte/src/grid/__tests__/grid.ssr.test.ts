import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import GridFixture from './grid-fixture.svelte';

describe('Svelte Grid 服务端首帧', () => {
    it('首帧带类名、gutter 变量与子内容', () => {
        const store = createStore({ row: { gutter: 16 }, col: { span: 6 } });
        const { body } = render(GridFixture, { props: { store } });
        expect(body).toContain('class="semi-row"');
        expect(body).toContain('--semi-row-gutter-x-md: 16px');
        expect(body).toContain('semi-col semi-col-6');
        expect(body).toContain('child');
    });
});
