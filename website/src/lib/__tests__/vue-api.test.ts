import { resolve } from 'node:path';
import { apiType } from '#scripts/api-table.ts';
import { extractApi, ownProps, renderApi, type ApiDescription } from '#scripts/gen-vue-api.ts';
import { describe, expect, it } from 'vite-plus/test';
import type { ComponentMeta } from 'vue-component-meta';

const text = { 'zh-CN': '说明', 'en-US': 'Description' };
const description: ApiDescription = {
    source: 'example.vue',
    props: { value: text },
    events: { change: text },
    slots: { default: text },
    exposed: { focus: text },
};
// Only the public metadata consumed by the renderer is needed for this fixture.
const meta = {
    props: [
        { name: 'value', type: 'string | undefined', required: false, global: false, default: 'undefined', getDeclarations: () => [{ file: '/src/example.vue', range: [0, 0] }] },
        { name: 'key', global: true },
    ],
    events: [{ name: 'change', type: '[value: string]' }],
    slots: [{ name: 'default', type: '{ value: string }' }],
    exposed: [{ name: 'focus', type: '() => void' }],
} as unknown as ComponentMeta;

describe('Vue API 生成', () => {
    it('真实 SFC 只提取显式 props，不把 @vue-ignore 的原生属性当组件 API', () => {
        const source = resolve('website/src/lib/__tests__/fixtures/vue-api/attributes.vue');
        const extracted = extractApi(source);
        expect(ownProps(extracted).map((prop) => prop.name)).toEqual(['label', 'id']);
    });

    it('输出双语四组表格、默认值与实际成员', () => {
        const chinese = renderApi(meta, description, 'zh-CN');
        expect(chinese).toContain('| value | 说明 | `string` | `undefined` |');
        expect(chinese).toContain('| change | 说明 | `[value: string]` |');
        expect(chinese).toContain('| default | 说明 | `{ value: string }` |');
        expect(chinese).toContain('| focus | 说明 | <ApiType');
        expect(chinese).not.toContain('| key |');
        expect(chinese.match(/^\*\*/gm)).toHaveLength(4);
        expect(renderApi(meta, description, 'en-US')).toContain('| Property | Description | Type | Default |');
    });

    it('转义联合类型并仅删除顶层可选 undefined', () => {
        expect(apiType('string | number | undefined', true)).toBe('`string \\| number`');
        expect(apiType('undefined | string', true)).toBe('`string`');
        expect(apiType('{ value: string | undefined } | undefined', true)).toBe('`{ value: string \\| undefined }`');
        expect(apiType('string | undefined')).toBe('`string \\| undefined`');
        expect(apiType('Array<string | undefined>')).toContain('\\u003c');
        expect(apiType('Array<string | undefined>')).not.toContain(' | ');
    });

    it('拒绝缺少说明、缺少另一语言或多余说明', () => {
        expect(() => renderApi(meta, { ...description, props: {} }, 'zh-CN')).toThrow('缺少双语说明：props.value');
        expect(() => renderApi(meta, { ...description, props: { value: { ...text, 'en-US': '' } } }, 'zh-CN')).toThrow('缺少双语说明');
        expect(() => renderApi(meta, { ...description, events: { ...description.events, extra: text } }, 'en-US')).toThrow('多余说明：events.extra');
    });

    it('拒绝代码格式外的花括号与尖括号，代码格式内的原样输出', () => {
        const raw = { 'zh-CN': '说明', 'en-US': 'Each item is { label, value }' };
        expect(() => renderApi(meta, { ...description, props: { value: raw } }, 'zh-CN')).toThrow('须写在反引号内：props.value en-US');
        const coded = { 'zh-CN': '元素为 `{ label, value }`', 'en-US': 'Each item is `Array<string>`' };
        expect(renderApi(meta, { ...description, props: { value: coded } }, 'zh-CN')).toContain('| value | 元素为 `{ label, value }` |');
    });

    it('空组保留表格并拒绝不存在的组件源文件', () => {
        const empty = { props: [], events: [], slots: [], exposed: [] } as unknown as ComponentMeta;
        const emptyDescription = { ...description, props: {}, events: {}, slots: {}, exposed: {} };
        expect(renderApi(empty, emptyDescription, 'zh-CN')).toContain('| 无 |  |  |  |');
        expect(() => extractApi('/不存在的组件.vue')).toThrow('组件源文件不存在');
    });
});
