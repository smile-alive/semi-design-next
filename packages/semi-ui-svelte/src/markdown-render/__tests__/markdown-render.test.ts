import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import { codeText } from '../index';
import type { MarkdownRenderProps } from '../interface';
import OwnHeading from './own-heading.svelte';
import Probe from './probe.svelte';
import { compileCounter, setup, settle } from './setup';
import Wrapper from './wrapper.svelte';

const prefix = `${BASE_CLASS_PREFIX}-markdownRender`;

describe('Svelte MarkdownRender', () => {
    it('mdx（默认）下计算表达式，md 下保留为文本', async () => {
        setup({ raw: 'mdx {1 + 1} sum' });
        setup({ format: 'md', raw: 'md {1 + 1} sum' });
        expect((await screen.findByText('mdx 2 sum')).tagName).toBe('P');
        expect(await screen.findByText('md {1 + 1} sum')).toBeInTheDocument();
    });

    it('components 里值为 undefined 的键回退为内置元素，不当作元素类型', async () => {
        setup({ components: { h1: undefined }, format: 'md', raw: '# a' });
        expect(await screen.findByRole('heading', { name: 'a' })).toBeInTheDocument();
    });

    it.each(['md', 'mdx'] as const)('允许组件覆盖元素（%s）', async (format) => {
        setup({ components: { h1: OwnHeading }, format, raw: '# Title\n\nbody' });
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveAttribute('data-testid', 'own-svelte');
        expect(screen.getByText('body').tagName).toBe('P');
    });

    it('remarkGfm 为 false 时，table 语法保留为文本', async () => {
        const { container } = setup({ raw: '| A | B |\n| - | - |\n| 1 | 2 |', remarkGfm: false });
        await screen.findByText(/\| A \| B \|/);
        expect(container.querySelector('table')).toBeNull();
    });

    it('默认开启 remarkGfm，table 带列对齐', async () => {
        const { container } = setup({ format: 'md', raw: '| A | B |\n| :-: | -: |\n| 1 | 2 |' });
        const cells = container.querySelectorAll<HTMLElement>('tbody td');
        expect(cells).toHaveLength(2);
        expect(cells[0].style.textAlign).toBe('center');
        expect(cells[1].style.textAlign).toBe('right');
    });

    it('把插件传给编译器', async () => {
        const remarkPlugin = compileCounter();
        const rehypePlugin = compileCounter();
        setup({ raw: 'text', rehypePlugins: [rehypePlugin], remarkPlugins: [remarkPlugin] });
        await screen.findByText('text');
        expect(remarkPlugin).toHaveBeenCalledTimes(1);
        expect(rehypePlugin).toHaveBeenCalledTimes(1);
    });

    it('原始内容变化后渲染新源码', async () => {
        const counter = compileCounter();
        const { update } = setup({ raw: 'first', remarkPlugins: [counter] });
        await screen.findByText('first');
        await update({ raw: 'second' });
        await screen.findByText('second');
        expect(screen.queryByText('first')).toBeNull();
        expect(counter).toHaveBeenCalledTimes(2);
    });

    it('新组件与内容相同的新插件数组直接生效，无需再次编译', async () => {
        const counter = compileCounter();
        // a function, not an object: $state proxies the store's objects, so an options object is never the same reference
        const options = () => undefined;
        const withOptions = () => undefined;
        const { update } = setup({ raw: 'same', rehypePlugins: [[withOptions, options]], remarkPlugins: [counter] });
        await screen.findByText('same');
        await update({ components: { p: OwnHeading }, rehypePlugins: [[withOptions, options]], remarkPlugins: [counter] });
        expect(screen.getByTestId('own-svelte')).toHaveTextContent('same');
        expect(counter).toHaveBeenCalledTimes(1);
    });

    it('format 变化时重新编译', async () => {
        const { update } = setup({ format: 'md', raw: 'sum {1 + 1}' });
        await screen.findByText('sum {1 + 1}');
        await update({ format: 'mdx' });
        expect(await screen.findByText('sum 2')).toBeInTheDocument();
        await update({ format: 'md' });
        expect(await screen.findByText('sum {1 + 1}')).toBeInTheDocument();
    });

    it('remarkGfm 变化时重新编译', async () => {
        const { container, update } = setup({ raw: '| A | B |\n| - | - |\n| 1 | 2 |', remarkGfm: false });
        await screen.findByText(/\| A \| B \|/);
        await update({ remarkGfm: true });
        await waitFor(() => expect(container.querySelector('table')).not.toBeNull());
        await update({ remarkGfm: false });
        await waitFor(() => expect(container.querySelector('table')).toBeNull());
    });

    it('插件条目，或 [plugin, options] 条目中的项变化时重新编译', async () => {
        const first = compileCounter();
        const second = compileCounter();
        const { update } = setup({ raw: 'text', remarkPlugins: [first] });
        await screen.findByText('text');
        await update({ remarkPlugins: [second] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

        // an options literal is a new object each time, so it compiles again
        await update({ remarkPlugins: [[second, { a: 1 }]] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(2));

        const rehype = compileCounter();
        await update({ rehypePlugins: [rehype] });
        await waitFor(() => expect(rehype).toHaveBeenCalledTimes(1));
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('md 中把原始 HTML 交给 rehype 插件，并丢弃插件保留为 raw 的内容', async () => {
        type Node = { type: string; value?: string };
        const rawToElement = () => (tree: { children: Node[] }) => {
            tree.children = tree.children.map((node) => (node.type === 'raw' && node.value?.includes('keep') ? { type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: 'kept' }] } : node));
        };
        const { container } = setup({
            format: 'md',
            raw: '<section>keep</section>\n\n<section>drop</section>\n\nafter',
            rehypePlugins: [rawToElement],
        });
        await screen.findByText('after');
        expect(container.querySelector('mark')).toHaveTextContent('kept');
        expect(container.querySelector('section')).toBeNull();
        expect(container).not.toHaveTextContent('drop');
    });

    it('class、style、id、data-* 与监听器落在根元素上', async () => {
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
        const { container } = setup({ raw: 'text', class: 'own', style: 'color: red', id: 'md', 'data-testid': 'root', onkeydown } as MarkdownRenderProps);
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(prefix, 'own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('id', 'md');
        expect(root).toHaveAttribute('data-testid', 'root');
        expect(root).not.toHaveAttribute('role');
        await fireEvent.keyDown(root, { key: 'a' });
        expect(onkeydown).toHaveBeenCalledTimes(1);
        await screen.findByText('text');
    });

    it('根元素被命名时为 role="group"，显式 role 不被覆盖', () => {
        setup({ raw: 'a', 'aria-label': 'reply' });
        setup({ raw: 'b', 'aria-labelledby': 'title' });
        setup({ raw: 'c', 'aria-label': 'note', role: 'note' });
        expect(screen.getByRole('group', { name: 'reply' })).toHaveClass(prefix);
        expect(document.querySelector(`[aria-labelledby="title"]`)).toHaveAttribute('role', 'group');
        expect(screen.getByRole('note', { name: 'note' })).toHaveClass(prefix);
    });

    it('从 semiGlobal overrideDefaultProps 读取 format', async () => {
        semiGlobal.config.overrideDefaultProps = { MarkdownRender: { format: 'md' } };
        try {
            setup({ raw: 'global {1 + 1}' });
            setup({ format: 'mdx', raw: 'explicit {1 + 1}' });
            expect(await screen.findByText('global {1 + 1}')).toBeInTheDocument();
            expect(await screen.findByText('explicit 2')).toBeInTheDocument();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('从注入的 semiGlobal 读取 format 与 remarkGfm，显式传值优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { MarkdownRender: { format: 'md', remarkGfm: false } };
        const context = new Map<unknown, unknown>([[semiGlobalKey, semi]]);
        const table = '| A |\n| - |\n| 1 |';
        const { container } = setup({ raw: `injected {1 + 1}\n\n${table}` }, context);
        setup({ format: 'mdx', raw: `explicit {1 + 1}\n\n${table}`, remarkGfm: true }, context);
        expect(await screen.findByText('injected {1 + 1}')).toBeInTheDocument();
        expect(await screen.findByText('explicit 2')).toBeInTheDocument();
        const [injected, explicit] = document.querySelectorAll(`.${prefix}`);
        expect(injected.querySelector('table')).toBeNull();
        expect(explicit.querySelector('table')).not.toBeNull();
        expect(container).toBeTruthy();
    });

    it.each<[string, MarkdownRenderProps, RegExp]>([
        ['an mdx syntax error', { raw: 'bad <div' }, /Unexpected end of file/],
        [
            'a throwing plugin under md',
            {
                raw: 'bad',
                format: 'md',
                remarkPlugins: [
                    () => () => {
                        throw new Error('plugin failed');
                    },
                ],
            },
            /plugin failed/,
        ],
    ])('保留上一次的内容，并输出 %s 日志，而不是放任未处理', async (_, badProps, message) => {
        const listeners = process.listeners('unhandledRejection');
        const reasons: string[] = [];
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason) => reasons.push(String(reason)));
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const { update } = setup({ format: badProps.format, raw: 'good' });
            await screen.findByText('good');
            await update(badProps);
            await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
            expect(String(error.mock.calls[0][0])).toMatch(message);
            await settle();
            expect(reasons).toEqual([]);
            expect(screen.getByText('good')).toBeInTheDocument();
        } finally {
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('生产环境不输出编译错误日志', async () => {
        const env = process.env.NODE_ENV;
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const counter = compileCounter();
        process.env.NODE_ENV = 'production';
        try {
            setup({ raw: 'bad <div', remarkPlugins: [counter] });
            await waitFor(() => expect(counter).toHaveBeenCalledTimes(1));
            await settle();
            expect(error).not.toHaveBeenCalled();
        } finally {
            process.env.NODE_ENV = env;
        }
    });

    it('较早的编译最后完成时，保留较新的源码', async () => {
        const { promise: gate, resolve: release } = Promise.withResolvers<void>();
        const holdOlder = () => async (tree: unknown) => {
            if (JSON.stringify(tree).includes('older')) {
                await gate;
            }
        };
        const { update } = setup({ raw: 'older', remarkPlugins: [holdOlder] });
        await update({ raw: 'newer' });
        await screen.findByText('newer');
        release();
        await settle();
        expect(screen.queryByText('older')).toBeNull();
        expect(screen.getByText('newer')).toBeInTheDocument();
    });

    it('卸载时编译未完成，之后不写回、无告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');
        const counter = compileCounter();
        const view = setup({ raw: 'late', remarkPlugins: [counter] });
        view.unmount();
        await waitFor(() => expect(counter).toHaveBeenCalledTimes(1));
        await settle();
        expect(view.container).toBeEmptyDOMElement();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('mdx 首次编译前渲染空根节点', async () => {
        const { container } = setup({ raw: 'text' });
        expect(container.firstElementChild?.children).toHaveLength(0);
        await screen.findByText('text');
    });

    it.each(['md', 'mdx'] as const)('%s 下 raw 变化时保留未改动的 DOM 节点', async (format) => {
        const { update } = setup({ format, raw: '# A\n\nx' });
        const heading = await screen.findByRole('heading', { name: 'A' });
        await update({ raw: '# A\n\nxy' });
        await screen.findByText('xy');
        expect(screen.getByRole('heading', { name: 'A' })).toBe(heading);
    });

    describe('runtime', () => {
        it.each<[string, MarkdownRenderProps]>([
            ['mdx 片段只有一个文本子项', { raw: '<>fragment text</>' }],
            ['md 单段落', { format: 'md', raw: 'fragment text' }],
        ])('%s 时正常渲染', async (_, props) => {
            setup(props);
            expect(await screen.findByText('fragment text')).toBeInTheDocument();
        });

        it('MDX 作者在组件上写的 className 并入 class', async () => {
            setup({ components: { Probe }, raw: '<Probe className="author">probe</Probe>' });
            expect(await screen.findByText('probe')).toHaveAttribute('class', 'probe-root author');
        });

        it('MDX 中的 onClick 按 Svelte 命名绑定，组件的 onClick 只触发一次', async () => {
            const hit = vi.fn<(source: string) => void>();
            vi.stubGlobal('mdxHit', hit);
            setup({
                components: { Probe },
                raw: ['<Probe onClick={() => mdxHit("component")}>component</Probe>', '<button onClick={() => mdxHit("native")}>native</button>'].join('\n\n'),
            });
            await fireEvent.click(await screen.findByRole('button', { name: 'component' }));
            await fireEvent.click(screen.getByRole('button', { name: 'native' }));
            expect(hit.mock.calls).toEqual([['component'], ['native']]);
        });

        it('style 对象转为 style 字符串，void 元素不带子节点', async () => {
            const { container } = setup({ raw: '<span style={{ textAlign: "center", "--x": 1 }}>s</span>\n\n<hr />\n\n<br />' });
            const span = await screen.findByText('s');
            expect(span).toHaveStyle({ textAlign: 'center' });
            expect(span.style.getPropertyValue('--x')).toBe('1');
            expect(container.querySelector('hr')).not.toBeNull();
            expect(container.querySelector('br')).not.toBeNull();
        });

        it('components.wrapper 包住内容，不把 components 写成属性', async () => {
            const { container } = setup({ components: { wrapper: Wrapper }, raw: 'wrapped' });
            expect(await screen.findByText('wrapped')).toBeInTheDocument();
            const wrapper = container.querySelector('section.wrap');
            expect(wrapper).toContainElement(screen.getByText('wrapped'));
            expect(wrapper).not.toHaveAttribute('components');
        });
    });

    describe('codeText', () => {
        it('取出代码元素的原文，保留结尾换行，穿透高亮插件拆出的元素', () => {
            const span = (children: unknown) => ({ type: 'span', props: { children } });
            expect(codeText(['let ', span(['x']), span('\n')] as never)).toBe('let x\n');
            expect(codeText(undefined)).toBe('');
        });
    });
});
