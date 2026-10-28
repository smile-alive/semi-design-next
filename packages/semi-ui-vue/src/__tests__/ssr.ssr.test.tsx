/** @jsxImportSource vue */
import { h } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import * as icons from '@fibrae/semi-icons-vue';
import * as illustrations from '@fibrae/semi-illustrations-vue';
import { expectCleanServerRender, renderOnServer, uncoveredExports } from '@test/utils/vue.ssr';
import * as ui from '..';
import { nonComponentExports, ssrCases } from './ssr-cases';

// First in the file: the server must run without any DOM global
it('服务端没有 document', () => {
    expect(globalThis.document).toBeUndefined();
    expect(process.env.NODE_ENV).not.toBe('production');
});

describe('守卫', () => {
    it('每个导出都有用例或在非组件清单中，清单没有过期的名字', () => {
        expect(uncoveredExports(Object.keys(ui), ssrCases, nonComponentExports)).toEqual({ uncovered: [], stale: [] });
    });
});

for (const item of ssrCases) {
    it(`${item.name}`, () => expectCleanServerRender(item));
}

describe('图标与插画', () => {
    for (const [label, exported] of [
        ['icons', icons],
        ['illustrations', illustrations],
    ] as const) {
        it(`${label} 全部导出可以服务端渲染`, async () => {
            const warn = vi.spyOn(console, 'warn');
            const error = vi.spyOn(console, 'error');
            const empty: string[] = [];
            const warned: string[] = [];
            for (const [name, component] of Object.entries(exported)) {
                const { html, warnings } = await renderOnServer(() => h(component as never));
                if (html === '') {
                    empty.push(name);
                }
                if (warnings.length) {
                    warned.push(name);
                }
            }
            expect({ empty, warned }).toEqual({ empty: [], warned: [] });
            expect(warn).not.toHaveBeenCalled();
            expect(error).not.toHaveBeenCalled();
        });
    }
});
