import { describe, expect, it, vi } from 'vite-plus/test';
import MarkdownRenderFoundation, { type MarkdownRenderAdapter } from '../foundation';

// stands in for a CSP without `unsafe-eval`; the AsyncFunction constructor cannot be stubbed globally
vi.mock('@mdx-js/mdx', () => {
    throw new EvalError('Evaluating a string as JavaScript violates the Content Security Policy');
});

const runtime = {
    Fragment: 'fragment',
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
};

async function evaluate(props: Record<string, unknown>, raw: string, adapterRuntime: object = runtime) {
    const setState = vi.fn<MarkdownRenderAdapter['setState']>();
    const notifyCompileError = vi.fn<MarkdownRenderAdapter['notifyCompileError']>();
    const foundation = new MarkdownRenderFoundation({
        getProp: (key: string) => ({ ...props, raw })[key],
        getRuntime: () => adapterRuntime,
        notifyCompileError,
        setState,
    } as unknown as MarkdownRenderAdapter);
    await foundation.updateContent();
    const renderContent = setState.mock.calls[0]?.[0].renderContent;
    if (!renderContent) {
        throw new Error('updateContent did not store renderContent');
    }
    return renderContent;
}

const treeRuntime = {
    Fragment: Symbol('Fragment'),
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
};

const appendRemarkNode = () => (tree: { children: unknown[] }) => {
    tree.children.push({ type: 'paragraph', children: [{ type: 'text', value: 'from remark' }] });
};

const appendRehypeNode = () => (tree: { children: unknown[] }) => {
    tree.children.push({ type: 'element', tagName: 'hr', properties: {}, children: [] });
};

function compileMd(props: Parameters<typeof MarkdownRenderFoundation.compileMdSync>[0]) {
    const content = MarkdownRenderFoundation.compileMdSync(props, treeRuntime);
    if (!content) {
        throw new Error('compileMdSync returned null');
    }
    return content;
}

const gfmRaw = '# Title\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~';

function tags(node) {
    if (!node || typeof node !== 'object') {
        return [];
    }
    const children = [node.props?.children ?? []].flat();
    return [typeof node.type === 'string' ? node.type : node.type.name, ...children.flatMap(tags)];
}

describe('MarkdownRenderFoundation.evaluate', () => {
    it('渲染 md 时不加载 @mdx-js/mdx，也不使用 eval 或 Function 构造器', async () => {
        const stubs = {
            Function: vi.fn<() => never>(() => {
                throw new EvalError('Function');
            }),
            eval: vi.fn<() => never>(() => {
                throw new EvalError('eval');
            }),
        };
        vi.stubGlobal('Function', stubs.Function);
        vi.stubGlobal('eval', stubs.eval);
        try {
            const Content = await evaluate({ format: 'md', remarkGfm: true }, '# Title\n\n| a |\n| - |\n| 1 |\n\n```js\ncode\n```');
            const Own = () => null;
            expect(tags(Content({ components: { h1: Own } }))).toEqual(['fragment', 'Own', 'table', 'thead', 'tr', 'th', 'tbody', 'tr', 'td', 'pre', 'code']);
        } finally {
            vi.unstubAllGlobals();
        }
        expect(stubs.Function).not.toHaveBeenCalled();
        expect(stubs.eval).not.toHaveBeenCalled();
    });

    it('编译失败时报告错误并保留 state', async () => {
        const notifyCompileError = vi.fn<MarkdownRenderAdapter['notifyCompileError']>();
        const setState = vi.fn<MarkdownRenderAdapter['setState']>();
        const foundation = new MarkdownRenderFoundation({
            getProp: (key: string) => ({ format: 'mdx', raw: 'text' })[key],
            getRuntime: () => runtime,
            notifyCompileError,
            setState,
        } as unknown as MarkdownRenderAdapter);
        await foundation.updateContent();
        expect(notifyCompileError).toHaveBeenCalledWith(expect.objectContaining({ cause: expect.any(EvalError) }));
        expect(setState).not.toHaveBeenCalled();
    });
});

describe('MarkdownRenderFoundation.getCodeLanguage', () => {
    it('取完整的 language-* id，含连字符，且忽略其他 class', () => {
        expect(MarkdownRenderFoundation.getCodeLanguage('language-objective-c')).toBe('objective-c');
        expect(MarkdownRenderFoundation.getCodeLanguage('hljs language-js line-numbers')).toBe('js');
        expect(MarkdownRenderFoundation.getCodeLanguage('line-numbers')).toBeUndefined();
        expect(MarkdownRenderFoundation.getCodeLanguage(undefined)).toBeUndefined();
    });
});

describe('MarkdownRenderFoundation.isSamePluginList', () => {
    const a = () => {};
    const b = () => {};
    const options = { x: 1 };

    it('条目引用相同的列表判定为相同', () => {
        expect(MarkdownRenderFoundation.isSamePluginList(undefined, undefined)).toBe(true);
        expect(MarkdownRenderFoundation.isSamePluginList([a, b], [a, b])).toBe(true);
        expect(MarkdownRenderFoundation.isSamePluginList([[a, options], b], [[a, options], b])).toBe(true);
    });

    it('能区分条目变化、顺序、长度、选项对象以及列表缺失', () => {
        expect(MarkdownRenderFoundation.isSamePluginList([a], [b])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList([a, b], [b, a])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList([a], [a, b])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList([[a, options]], [[a, { x: 1 }]])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList([[a, options]], [[a, options, 2]])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList([[a, options]], [a])).toBe(false);
        expect(MarkdownRenderFoundation.isSamePluginList(undefined, [])).toBe(false);
    });
});

describe('MarkdownRenderFoundation.compileMdSync', () => {
    const Own = () => null;
    const cases = [
        { name: '关闭 remarkGfm', props: { remarkGfm: false } },
        { name: '开启 remarkGfm', props: { remarkGfm: true } },
        { name: '同步 remark 与 rehype 插件', props: { remarkPlugins: [appendRemarkNode], rehypePlugins: [appendRehypeNode] } },
    ];

    it.each(cases)('$name 时与异步路径渲染出相同的树', async ({ props }) => {
        const options = { raw: gfmRaw, format: 'md' as const, ...props };
        const content = compileMd(options);
        const asyncContent = await evaluate(options, gfmRaw, treeRuntime);
        expect(content({})).toEqual(asyncContent({}));
        expect(content({ components: { h1: Own, table: Own } })).toEqual(asyncContent({ components: { h1: Own, table: Own } }));
    });

    it('同步插件的产物出现在结果中', () => {
        const content = compileMd({ raw: '# Title', format: 'md', remarkPlugins: [appendRemarkNode], rehypePlugins: [appendRehypeNode] });
        const children = content({}).props.children;
        expect(children.filter((child) => typeof child !== 'string').map((child) => child.type)).toEqual(['h1', 'p', 'hr']);
    });

    it.each([{ format: 'mdx' as const }, {}])('format 为 $format 时返回 null', ({ format }) => {
        expect(MarkdownRenderFoundation.compileMdSync({ raw: '# Title', format }, treeRuntime)).toBeNull();
    });

    it('异步插件使同步编译未完成时返回 null 且不抛出', () => {
        const asyncPlugin = () => async () => {};
        expect(MarkdownRenderFoundation.compileMdSync({ raw: '# Title', format: 'md', remarkPlugins: [asyncPlugin] }, treeRuntime)).toBeNull();
    });
});
