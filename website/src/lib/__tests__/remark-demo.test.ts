import path from 'node:path';
import remarkDemo, { filterFrameworks } from '#plugins/remark-demo.ts';
import type { Heading, Root } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vite-plus/test';

function demo(id: string): MdxJsxFlowElement {
    return {
        type: 'mdxJsxFlowElement',
        name: 'Demo',
        attributes: [{ type: 'mdxJsxAttribute', name: 'id', value: id }],
        children: [],
    };
}

describe('文档框架编译', () => {
    it.each(['react', 'vue', 'solid', 'svelte'] as const)('只保留 %s 条件块的标题，顺序与公共标题一致', (target) => {
        const heading = (value: string): Heading => ({
            type: 'heading',
            depth: 2,
            children: [{ type: 'text', value }],
        });
        const block = (only: string): MdxJsxFlowElement => ({
            type: 'mdxJsxFlowElement',
            name: 'Framework',
            attributes: [{ type: 'mdxJsxAttribute', name: 'only', value: only }],
            children: [heading(only)],
        });
        const tree: Root = { type: 'root', children: [heading('公共'), block('react'), block('vue'), block('solid'), block('svelte'), heading('结尾')] };
        filterFrameworks(tree, target, 'page');
        expect(tree.children).toEqual([heading('公共'), heading(target), heading('结尾')]);
    });

    it.each([
        ['react', 'basic/icon', 'basic', 'basic.react.tsx', 'react'],
        ['vue', 'basic/icon', 'basic', 'basic.vue', 'vue'],
        ['solid', 'basic/button', 'types', 'types.solid.tsx', 'solid-js'],
        ['svelte', 'input/switch', 'basic', 'basic.svelte', 'svelte'],
    ] as const)('%s 只静态导入当前框架 demo，并交给对应渲染器', (framework, page, id, demoFile, renderer) => {
        const tree: Root = { type: 'root', children: [demo(id)] };
        const file = path.resolve(import.meta.dirname, `../../../content/${page}/index.zh-CN.mdx`) + (framework === 'react' ? '' : `.${framework}.mdx`);
        // Only client:only names the renderer; the configured hydration modes are covered below
        const only = { mode: 'only' as const, except: [] };
        remarkDemo({ hydration: { react: only, vue: only, solid: only, svelte: only } })(tree, new VFile({ path: file }));
        expect(tree.children[0]).toMatchObject({
            type: 'mdxjsEsm',
            value: `import Demo0 from './demos/${demoFile}';\nimport Demo0Source from './demos/${demoFile}?raw';`,
        });
        expect(tree.children[1]).toMatchObject({ children: [{ attributes: [{ name: 'client:only', value: renderer }] }] });
    });

    it.each([
        ['vue', 'missing-infra-demo.vue'],
        ['solid', 'missing-infra-demo.solid.tsx'],
        ['svelte', 'missing-infra-demo.svelte'],
    ])('缺失 %s demo 在编译阶段失败', (framework, expected) => {
        const tree: Root = { type: 'root', children: [demo('missing-infra-demo')] };
        const file = path.resolve(import.meta.dirname, `../../../content/basic/icon/index.zh-CN.mdx.${framework}.mdx`);
        expect(() => remarkDemo()(tree, new VFile({ path: file }))).toThrow(expected);
    });

    describe('demo 注水方式', () => {
        const hydrationOf = (mode: 'only' | 'visible', except: string[], page: string) => {
            const tree: Root = { type: 'root', children: [demo(page === 'basic/icon' ? 'basic' : 'block')] };
            const file = path.resolve(import.meta.dirname, `../../../content/${page}/index.zh-CN.mdx.vue.mdx`);
            const config = { mode, except };
            remarkDemo({ hydration: { react: config, vue: config, solid: config, svelte: config } })(tree, new VFile({ path: file }));
            return (tree.children[1] as MdxJsxFlowElement).children[0] as MdxJsxFlowElement;
        };

        it('默认 only 时输出 client:only', () => {
            expect(hydrationOf('only', [], 'basic/icon').attributes).toEqual([{ type: 'mdxJsxAttribute', name: 'client:only', value: 'vue' }]);
        });

        it('visible 时输出无值的 client:visible', () => {
            expect(hydrationOf('visible', [], 'basic/icon').attributes).toEqual([{ type: 'mdxJsxAttribute', name: 'client:visible', value: null }]);
        });

        it('例外页取相反方式', () => {
            expect(hydrationOf('only', ['basic/icon'], 'basic/icon').attributes).toMatchObject([{ name: 'client:visible' }]);
            expect(hydrationOf('visible', ['basic/icon'], 'basic/icon').attributes).toMatchObject([{ name: 'client:only' }]);
            expect(hydrationOf('only', ['basic/icon'], 'basic/button').attributes).toMatchObject([{ name: 'client:only' }]);
        });

        it('例外页不存在时在创建插件时失败', () => {
            const none = { mode: 'only' as const, except: [] };
            expect(() => remarkDemo({ hydration: { react: none, vue: { mode: 'only', except: ['basic/missing'] }, solid: none, svelte: none } })).toThrow('demoHydration.vue.except: page "basic/missing"');
        });
    });

    it('无效 Framework 指令直接失败', () => {
        const tree: Root = {
            type: 'root',
            children: [{ type: 'mdxJsxFlowElement', name: 'Framework', attributes: [], children: [] }],
        };
        expect(() => filterFrameworks(tree, 'vue', 'page')).toThrow('only="react" or only="vue" or only="solid" or only="svelte"');
    });
});
