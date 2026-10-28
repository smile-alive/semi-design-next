import { resolve } from 'node:path';
import { extractApis, renderApi, type ApiDescription, type SolidApi } from '#scripts/gen-solid-api.ts';
import { describe, expect, it } from 'vite-plus/test';

const text = { 'zh-CN': '说明', 'en-US': 'Description' };
const api: SolidApi = {
    props: [{ name: 'value', type: 'string | undefined', optional: true, default: '"a"' }],
    methods: [{ name: 'focus', type: '() => void', optional: false }],
};
const description: ApiDescription = { source: 'example.tsx', props: { value: text }, methods: { focus: text } };

describe('Solid API 生成', () => {
    it('只提取自有属性、defaultProps 的默认值与 ref 元素上的方法', () => {
        const [extracted] = extractApis([resolve('website/src/lib/__tests__/fixtures/solid-api/example.solid.ts')]);
        expect(extracted.props).toEqual([
            { name: 'label', type: 'string', optional: true, default: '"名称"' },
            { name: 'onChange', type: '(value: string) => void', optional: false, default: undefined },
            { name: 'ref', type: 'Ref<HTMLDivElement & ExampleHandle>', optional: true, default: undefined },
            { name: 'size', type: "'small' | 'large'", optional: true, default: '"small"' },
        ]);
        expect(extracted.methods.map((method) => [method.name, method.type])).toEqual([
            ['focus', '() => void'],
            ['reset', '(value: string) => void'],
        ]);
    });

    it('#导出名读取具名导出，默认值取自它传给 mergeProps 的对象', () => {
        const [extracted] = extractApis([`${resolve('website/src/lib/__tests__/fixtures/solid-api/example.solid.ts')}#ExampleItem`]);
        expect(extracted).toEqual({
            props: [
                { name: 'editable', type: 'boolean', optional: true, default: 'true' },
                { name: 'name', type: 'string', optional: true, default: undefined },
            ],
            methods: [],
        });
    });

    it('联合形状列出各模式的自有成员，类型按作者写法打印，默认值求值为字面量', () => {
        const [extracted] = extractApis([`${resolve('website/src/lib/__tests__/fixtures/solid-api/modes.solid.ts')}#Modes`]);
        expect(extracted.props.map((prop) => [prop.name, prop.type, prop.optional, prop.default])).toEqual([
            ['alignBy', "'end' | 'start'", true, undefined],
            ['children', 'JSX.Element', true, undefined],
            ['columns', 'number', true, undefined],
            ['mode', "'list' | 'grid'", true, undefined],
            ['onPick', '((value: string) => void) | ((value: string[]) => void)', true, undefined],
            ['prefixCls', 'string', true, '"semi-modes"'],
            ['size', "'small' | 'large'", true, '"small"'],
            ['sizes', 'string[]', true, '["small", "large", "huge"]'],
            ['style', 'JSX.CSSProperties | string', true, undefined],
            ['width', 'Width', true, undefined],
        ]);
    });

    it('输出双语 Props 与 Methods 表格', () => {
        const chinese = renderApi(api, description, 'zh-CN');
        expect(chinese).toContain('| value | 说明 | `string` | `"a"` |');
        expect(chinese).toContain('| focus | 说明 | <ApiType detail={"() => void"}>Type</ApiType> |');
        expect(renderApi(api, description, 'en-US')).toContain('| Method | Description | Type |');
    });

    it('没有方法时省略 Methods，有方法时要求说明', () => {
        expect(renderApi({ ...api, methods: [] }, { ...description, methods: undefined }, 'zh-CN')).not.toContain('**Methods**');
        expect(() => renderApi(api, { ...description, methods: undefined }, 'zh-CN')).toThrow('缺少 methods 说明');
        expect(() => renderApi({ ...api, methods: [] }, description, 'zh-CN')).toThrow('多余说明：methods.focus');
    });

    it('拒绝不存在的组件源文件', () => {
        expect(() => extractApis(['/不存在的组件.tsx'])).toThrow('组件源文件不存在');
    });
});
