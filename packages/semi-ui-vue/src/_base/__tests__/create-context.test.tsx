/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { createContext } from '../create-context';
import ProbeNode from './fixtures/probe-node.vue';
import ProbeTree from './fixtures/probe-tree.vue';

describe('createContext', () => {
    afterEach(() => vi.restoreAllMocks());

    it('没有 provider 时读到 undefined，且没有 Vue 告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const view = render(ProbeNode, { props: { name: 'alone' } });
        expect(view.container.querySelector('[data-name="alone"]')?.textContent).toBe('none');
        expect(warn).not.toHaveBeenCalled();
    });

    it('嵌套时内层读到外层值并下发自己的值，孙组件读到内层值', () => {
        const view = render(ProbeTree);
        const seen = (name: string) => view.container.querySelector(`[data-name="${name}"]`)?.textContent;
        expect(seen('outer')).toBe('none');
        expect(seen('inner')).toBe('outer');
        expect(seen('leaf')).toBe('inner');
        expect(seen('reset')).toBe('inner');
    });

    it('默认必选：没有 provider 时抛错并带上调用方名，有 provider 时读到值', () => {
        const [provideLabel, useLabel] = createContext<string>('Probe');
        const Child = defineComponent(() => {
            const label = useLabel('Probe.Child');
            return () => <span data-name="child">{label}</span>;
        });
        const Parent = defineComponent(() => {
            provideLabel('from-parent');
            return () => <Child />;
        });
        expect(() => render(Child)).toThrow('Probe.Child must be used inside Probe');
        expect(render(Parent).container.querySelector('[data-name="child"]')?.textContent).toBe('from-parent');
    });

    it('provide(undefined) 把子树重置为 undefined', () => {
        const view = render(ProbeTree, { props: { reset: true } });
        const seen = (name: string) => view.container.querySelector(`[data-name="${name}"]`)?.textContent;
        expect(seen('reset')).toBe('inner');
        expect(seen('after-reset')).toBe('none');
    });
});
