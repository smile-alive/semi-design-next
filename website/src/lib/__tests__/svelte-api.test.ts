import { resolve } from 'node:path';
import { extractApis, renderApi, type ApiDescription, type SvelteApi } from '#scripts/gen-svelte-api.ts';
import { describe, expect, it } from 'vite-plus/test';

const fixture = resolve('website/src/lib/__tests__/fixtures/svelte-api/example.svelte');
const text = { 'zh-CN': '说明', 'en-US': 'Description' };

describe('Svelte API 生成', () => {
    it('读取 $props() 标注的类型：自有属性、解构的原生属性、fallback 默认值与实例脚本导出的方法', () => {
        const [extracted] = extractApis([fixture]);
        expect(extracted.props).toEqual([
            { name: 'children', type: 'Snippet', optional: true, default: undefined },
            { name: 'item', type: 'Snippet<[{ index: number }]>', optional: true, default: undefined },
            { name: 'label', type: 'string', optional: true, default: undefined },
            { name: 'onChange', type: '(value: string) => void', optional: true, default: undefined },
            { name: 'size', type: "'small' | 'large'", optional: true, default: '"small"' },
            { name: 'value', type: 'string', optional: true, default: undefined },
        ]);
        expect(extracted.methods.map((method) => [method.name, method.type])).toEqual([
            ['focus', '() => void'],
            ['reset', '(next: string) => void'],
        ]);
    });

    it('带参数的 snippet 类型放进 ApiType 详情', () => {
        const api: SvelteApi = { props: [{ name: 'item', type: 'Snippet<[{ index: number }]>', optional: true }], methods: [] };
        const description: ApiDescription = { source: 'example.svelte', props: { item: text } };
        expect(renderApi(api, description, 'zh-CN')).toContain('| item | 说明 | <ApiType detail={"Snippet\\u003c[{ index: number }]>"}>Type</ApiType> | - |');
    });

    it('拒绝不存在的组件源文件', () => {
        expect(() => extractApis(['/不存在的组件.svelte'])).toThrow('组件源文件不存在');
    });
});
