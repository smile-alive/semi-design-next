import { resolve } from 'node:path';
import { extractApis } from '#scripts/gen-react-api.ts';
import { describe, expect, it } from 'vite-plus/test';

const fixture = resolve('website/src/lib/__tests__/fixtures/react-api/example.react.tsx');

describe('React API 生成', () => {
    it('穿过 Object.assign 与 memo 读取自有属性、useDefaultProps 的默认值与 ref 句柄上的方法', () => {
        const [extracted] = extractApis([fixture]);
        expect(extracted.props).toEqual([
            { name: 'label', type: 'string', optional: true, default: '"名称"' },
            { name: 'max', type: 'number', optional: true, default: 'Infinity' },
            { name: 'onChange', type: '(value: string) => void', optional: true, default: undefined },
            { name: 'ref', type: 'React.Ref<ExampleHandle>', optional: true, default: undefined },
            { name: 'size', type: "'small' | 'large'", optional: true, default: '"small"' },
        ]);
        expect(extracted.methods.map((method) => [method.name, method.type])).toEqual([
            ['focus', '() => void'],
            ['reset', '(value: string) => void'],
        ]);
    });

    it('#导出名读取具名导出，默认值取自解构参数', () => {
        const [extracted] = extractApis([`${fixture}#ExampleItem`]);
        expect(extracted).toEqual({
            props: [
                { name: 'editable', type: 'boolean', optional: true, default: 'true' },
                { name: 'name', type: 'string', optional: true, default: undefined },
            ],
            methods: [],
        });
    });

    it('对象展开复制的常量成员按值显示默认值', () => {
        const [extracted] = extractApis([`${fixture}#ExampleList`]);
        expect(extracted.props).toEqual([{ name: 'sizes', type: 'string[]', optional: true, default: '["small", "large"]' }]);
    });
});
