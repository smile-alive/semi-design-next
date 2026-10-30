import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Host from './collapsible-host.svelte';

const heightVar = '--semi-collapsible-height';

describe('Svelte Collapsible 服务端渲染', () => {
    // Server output has no DOM to measure: an open Collapsible must still show its content
    it('服务端以自然高度渲染展开内容', () => {
        const { body } = render(Host, { props: { store: createStore({ isOpen: true }) } });
        expect(body).toContain(`${heightVar}:calc-size(auto, size)`);
        expect(body).toContain('hello');
    });

    it('服务端渲染折叠的关闭内容', () => {
        const { body } = render(Host, { props: { store: createStore({ isOpen: false, keepDOM: true }) } });
        expect(body).toContain(`${heightVar}:0px`);
        expect(body).toContain('inert');
        expect(body).toContain('hello');
    });
});
