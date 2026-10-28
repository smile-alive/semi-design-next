/** @jsxImportSource vue */
import { h } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import * as icons from '@fibrae/semi-icons-vue';
import * as lab from '@fibrae/semi-icons-vue/lab';
import * as illustrations from '@fibrae/semi-illustrations-vue';
import { expectCleanHydration, hydrate } from '@test/utils/vue.ssr';
import { ssrCases } from './ssr-cases';

// Representatives per risk class (value-bearing, measuring, composite, id-referencing), plus every default-open row.
// JsonViewer stays out: it needs a Worker, which jsdom lacks.
const sampled = new Set([
    'input/受控值',
    'select/基本',
    'select/changeWithObject 简写',
    'checkbox/基本',
    'tabs/基本',
    'tabs/collapsible',
    'table/基本',
    'table/virtualized',
    'tree/基本',
    'form/字段',
    'form/ArrayField',
    'calendar/基本',
    'calendar/week',
    'date-picker/基本',
    'time-picker/基本',
    'upload/基本',
    'resizable/基本',
    'navigation/基本',
    'steps/基本',
    'markdown-render/md',
]);
const pick = (name: string) => sampled.has(name) || name.endsWith('/默认打开');

// The server HTML is produced in jsdom from client-compiled components, so defects that only the ssrRender compile has
// (an attribute merged away in a single-root template) are not visible here; vue-ssr covers them
describe('服务端 HTML 注水无不匹配', () => {
    for (const item of ssrCases.filter((entry) => pick(entry.name))) {
        it(`${item.name}`, () => expectCleanHydration(item));
    }
});

// Gradient and clip ids come from useId, so server and client must resolve the same prefixed id
describe('带 {uid} 的图标与插画注水后 id 一致', () => {
    it.each([
        ['图标', icons.IconLoading],
        ['插画', illustrations.IllustrationNoContentDark],
        ['lab 图标', lab.IconForm],
    ])('%s', async (_label, Component) => {
        const { html, warnings } = await hydrate(() => h(Component as never));
        expect(html).toMatch(/id="ssr-/);
        expect(warnings.filter((message) => message.includes('Hydration'))).toEqual([]);
    });
});
