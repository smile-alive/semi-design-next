import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import SwitchFixture from './switch-fixture.svelte';

describe('Svelte Switch 服务端首帧', () => {
    it('首帧带选中状态、文本与分流后的属性', () => {
        const store = createStore({ props: { checked: true, 'aria-label': 'dark mode', id: 'x', 'data-x': '1' }, texts: true });
        const { body } = render(SwitchFixture, { props: { store } });
        expect(body).toContain('semi-switch-checked');
        expect(body).toContain('role="switch"');
        expect(body).toContain('checked');
        expect(body).toContain('x-semi-prop="checkedText"');
        expect(body).toContain('ON');
        expect(body).not.toContain('OFF');
        expect(body).toMatch(/<input[^>]*aria-label="dark mode"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
    });

    it('loading 首帧渲染 Spin 且标记 aria-disabled', () => {
        const store = createStore({ props: { loading: true } });
        const { body } = render(SwitchFixture, { props: { store } });
        expect(body).toContain('semi-switch-loading');
        expect(body).toContain('semi-switch-loading-spin');
        expect(body).toContain('aria-disabled="true"');
        expect(body).not.toContain('semi-switch-knob');
    });
});
