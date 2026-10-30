/** @jsxImportSource vue */
import { type ComponentPublicInstance, type FunctionalComponent, createSSRApp, defineComponent, h, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render, sleep } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import CodeHighlight from '../../code-highlight';
import { grammar } from '../../code-highlight/__tests__/grammars';
import { code as Code, h1 as H1, h2 as H2, p as P } from '../components';
import MarkdownRender, { type MarkdownRenderProps } from '../index';
import runtime from '../runtime';
import EmitButton from './fixtures/emit-button.vue';
import LiteralPlugins from './fixtures/literal-plugins.vue';
import MdxWrapper from './fixtures/mdx-wrapper.vue';
import OwnHeading from './fixtures/own-heading.vue';
import TemplateDefaults from './fixtures/template-defaults.vue';

// unified calls a plugin's attacher once per compile, so a no-op remark plugin counts compiles
const compileCounter = () => vi.fn<() => undefined>(() => undefined);
const settle = () => sleep(20);
const prefix = `${BASE_CLASS_PREFIX}-markdownRender`;
const renderMarkdown = (props: MarkdownRenderProps, attrs: Record<string, unknown> = {}) => render(MarkdownRender, { props, attrs });
function own(tag: string, testId: string) {
    const Own: FunctionalComponent = (_, { slots }) => h(tag, { 'data-testid': testId }, slots.default?.());
    return Own;
}

describe('MarkdownRender', () => {
    it('mdx（默认）下计算表达式，md 下保留为文本', async () => {
        render(() => (
            <div>
                <MarkdownRender raw="mdx {1 + 1} sum" />
                <MarkdownRender format="md" raw="md {1 + 1} sum" />
            </div>
        ));
        expect(await screen.findByText('mdx 2 sum')).toHaveClass(`${prefix}-component-p`);
        expect(await screen.findByText('md {1 + 1} sum')).toBeInTheDocument();
    });

    it('components 里值为 undefined 的键回退为内置组件，不当作元素类型', async () => {
        renderMarkdown({ components: { h1: undefined }, format: 'md', raw: '# a' });
        expect(await screen.findByRole('heading', { name: 'a' })).toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
    });

    it('代码块的子节点是元素时不交给高亮，直接渲染 code', async () => {
        type Node = { type?: string; tagName?: string; properties?: { className?: string[] }; children?: Node[] };
        // stands in for a highlighter plugin that splits the code text into spans
        const wrapCodeText = () => (tree: Node) => {
            const visit = (node: Node) => {
                if (node.tagName === 'code' && node.properties?.className?.includes('language-js')) {
                    node.children = [{ type: 'element', tagName: 'span', properties: {}, children: node.children }];
                }
                node.children?.forEach(visit);
            };
            visit(tree);
        };
        const { container } = renderMarkdown({ format: 'md', raw: '```js\nlet x\n```', rehypePlugins: [wrapCodeText] });
        const code = await waitFor(() => {
            const found = container.querySelector('code.language-js');
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        expect(code).toHaveTextContent('let x');
        expect(code.querySelector('span')).not.toBeNull();
        expect(code.parentElement?.tagName).toBe('PRE');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).toBeNull();
    });

    it('用 Semi 组件渲染标题、链接与段落', async () => {
        const { container } = renderMarkdown({ raw: '# Title\n\n[Semi](https://semi.design)' });
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveClass(`${BASE_CLASS_PREFIX}-typography`, `${prefix}-component-header`);
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveAttribute('href', 'https://semi.design');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-typography-link`)).not.toBeNull();
    });

    it('链接的 href 与 title 只落在 a 元素上，外层 Typography 元素不带', async () => {
        const { container } = renderMarkdown({ format: 'md', raw: '[x](https://a.b "t")' });
        const link = await screen.findByRole('link', { name: 'x' });
        expect(link).toHaveAttribute('href', 'https://a.b');
        expect(link).toHaveAttribute('title', 't');
        expect(container.querySelectorAll('[href]')).toHaveLength(1);
        expect(container.querySelectorAll('[title]')).toHaveLength(1);
    });

    it('内置组件直接使用时合并传入的 class 与内置类名，标题级别不变', () => {
        render(() => (
            <div>
                <H1 class="x">{() => 'title'}</H1>
                <H2 class="z">{() => 'second'}</H2>
                <P class="y">{() => 'body'}</P>
            </div>
        ));
        expect(screen.getByText('title')).toHaveClass('x', `${prefix}-component-header`);
        expect(screen.getByRole('heading', { level: 2, name: 'second' })).toHaveClass('z', `${prefix}-component-header`);
        expect(screen.getByText('body')).toHaveClass('y', `${prefix}-component-p`);
    });

    it('模板中直接使用内置组件（编译出的插槽对象）：合并类名，含图片的段落渲染为 div，无告警', () => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(TemplateDefaults);
        expect(screen.getByRole('heading', { level: 2, name: 't' })).toHaveClass('x', `${prefix}-component-header`);
        const paragraph = container.querySelector(`.${prefix}-component-p`) as HTMLElement;
        expect(paragraph).toHaveClass('y');
        expect(paragraph.tagName).toBe('DIV');
        expect(paragraph.querySelector(`.${prefix}-component-image`)).not.toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it.each([
        ['函数式组件', own('h1', 'own')],
        ['模板 SFC', OwnHeading],
    ])('允许组件覆盖 Semi 的默认实现（%s）', async (_, Heading) => {
        renderMarkdown({ components: { h1: Heading }, raw: '# Title\n\nbody' });
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveAttribute('data-testid');
        expect(heading).not.toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
        expect(screen.getByText('body')).toHaveClass(`${prefix}-component-p`);
    });

    it.each<'md' | 'mdx'>(['md', 'mdx'])('图片块不嵌套在 p 元素中（%s）', async (format) => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = renderMarkdown({ format, raw: 'before ![cat](a.png "cat") after' });
        await waitFor(() => expect(container.querySelector(`.${prefix}-component-image`)).not.toBeNull());
        const image = container.querySelector(`.${prefix}-component-image`) as HTMLElement;
        expect(image.closest('p')).toBeNull();
        const paragraph = image.closest(`.${prefix}-component-p`);
        expect(paragraph).toHaveTextContent('before');
        expect(paragraph).toHaveClass(`${BASE_CLASS_PREFIX}-typography-paragraph`);
        expect(warn).not.toHaveBeenCalled();
    });

    it('链接内的图片使段落渲染为 div，且不可预览', async () => {
        const { container } = renderMarkdown({ format: 'md', raw: '[![cat](a.png)](#target)\n\n![dog](b.png)' });
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-component-image`)).toHaveLength(2));
        const [linked, plain] = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-image`);
        for (const image of [linked, plain]) {
            await fireEvent.load(image.querySelector('img') as HTMLImageElement);
        }
        expect(linked.closest('p')).toBeNull();
        expect(linked.closest(`.${prefix}-component-p`)?.tagName).toBe('DIV');
        expect(linked.closest('a')).toHaveAttribute('href', '#target');
        expect(linked).not.toHaveAttribute('role');
        expect(linked).not.toHaveAttribute('tabindex');
        expect(plain).toHaveAttribute('role', 'button');
        await fireEvent.click(linked);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('段落内含带作用域默认插槽的组件时渲染不抛错', () => {
        const Scoped = defineComponent({
            setup:
                (_, { slots }) =>
                () => <span>{slots.default?.({ item: 'scoped' })}</span>,
        });
        render(() => <P>{() => ['before ', <Scoped>{{ default: ({ item }: { item: string }) => item }}</Scoped>]}</P>);
        expect(screen.getByText('scoped')).toBeInTheDocument();
    });

    it('使用方显式传 preview 时，链接内的图片可预览', async () => {
        const WithPreview: FunctionalComponent = (_, { attrs }) => <MarkdownRender.defaultComponents.img {...attrs} preview />;
        const { container } = renderMarkdown({
            format: 'md',
            raw: '[![a](s.png)](#t)',
            components: { img: WithPreview },
        });
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-image`)).not.toBeNull());
        const image = container.querySelector(`.${BASE_CLASS_PREFIX}-image`) as HTMLElement;
        await fireEvent.load(image.querySelector('img') as HTMLImageElement);
        expect(image.closest('a')).not.toBeNull();
        expect(image).toHaveAttribute('role', 'button');
    });

    it('图片说明文字对读屏隐藏，图片名称来自 alt', async () => {
        const { container } = renderMarkdown({ format: 'md', raw: '![cat](a.png)' });
        await waitFor(() => expect(container.querySelector(`.${prefix}-component-image-alt`)).not.toBeNull());
        const caption = container.querySelector(`.${prefix}-component-image-alt`);
        expect(caption).toHaveTextContent('cat');
        expect(caption).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getAllByRole('img', { name: 'cat' })).toHaveLength(1);
    });

    it('纯文本段落保持为 p 元素', async () => {
        renderMarkdown({ raw: 'plain text' });
        expect((await screen.findByText('plain text')).tagName).toBe('P');
    });

    it.each(['md', 'mdx'] as const)('%s 下有语言的代码块外层没有 pre，无语言的保留 pre，行内代码是 code 元素', async (format) => {
        const { container } = renderMarkdown({
            format,
            raw: '```js\nlet a = 1;\n```\n\n```\nplain\n```\n\ninline `x` code',
        });
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).not.toBeNull());
        const highlight = container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`) as HTMLElement;
        expect(highlight.parentElement?.closest('pre')).toBeNull();
        expect(highlight).toHaveTextContent('let a = 1;');
        const simple = container.querySelectorAll(`code.${prefix}-simple-code`);
        expect(Array.from(simple, (node) => [node.parentElement?.tagName, node.textContent])).toEqual([
            ['PRE', 'plain\n'],
            ['P', 'x'],
        ]);
    });

    it('code 组件的 class 为数组时仍取到语言，没有语言时渲染 code 元素', () => {
        const { container } = render(() => (
            <div>
                <Code class={['x', 'language-js']}>{() => 'let a = 1;\n'}</Code>
                <Code>{() => 'inline'}</Code>
            </div>
        ));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).toHaveTextContent('let a = 1;');
        expect(container.querySelector(`code.${prefix}-simple-code`)).toHaveTextContent('inline');
    });

    it('把 Semi 组件暴露为 MarkdownRender.defaultComponents', () => {
        expect(Object.keys(MarkdownRender.defaultComponents).toSorted()).toEqual(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'p', 'pre', 'table'].toSorted());
    });

    it('类型：components 的值是组件，元素键也可以是自身的标签名', () => {
        type Components = NonNullable<MarkdownRenderProps['components']>;
        const Custom = defineComponent({ props: { title: String }, setup: (props) => () => <span>{props.title}</span> });
        expectTypeOf({ h1: H1, p: P, Custom, Own: own('b', 'b') }).toExtend<Components>();
        expectTypeOf<{ h1: 'h1' }>().toExtend<Components>();
        expectTypeOf<{ h1: number }>().not.toExtend<Components>();
        expectTypeOf<{ h1: 'h2' }>().not.toExtend<Components>();
        expectTypeOf<{ Custom: number }>().not.toExtend<Components>();
        const custom: Components = {};
        expectTypeOf({ ...MarkdownRender.defaultComponents, ...custom }).toExtend<Components>();
    });

    it('remarkGfm 为 false 时，table 语法保留为文本', async () => {
        const { container } = renderMarkdown({ raw: '| A | B |\n| - | - |\n| 1 | 2 |', remarkGfm: false });
        await screen.findByText(/\| A \| B \|/);
        expect(container.querySelector('table')).toBeNull();
    });

    it('把插件传给编译器', async () => {
        const remarkPlugin = compileCounter();
        const rehypePlugin = compileCounter();
        renderMarkdown({ raw: 'text', rehypePlugins: [rehypePlugin], remarkPlugins: [remarkPlugin] });
        await screen.findByText('text');
        expect(remarkPlugin).toHaveBeenCalledTimes(1);
        expect(rehypePlugin).toHaveBeenCalledTimes(1);
    });

    it('原始内容变化后渲染新源码', async () => {
        const counter = compileCounter();
        const view = renderMarkdown({ raw: 'first', remarkPlugins: [counter] });
        await screen.findByText('first');
        await view.rerender({ raw: 'second', remarkPlugins: [counter] });
        await screen.findByText('second');
        expect(screen.queryByText('first')).toBeNull();
        expect(counter).toHaveBeenCalledTimes(2);
    });

    it('新组件与内容相同的新插件数组直接生效，无需再次编译', async () => {
        const counter = compileCounter();
        const options = { a: 1 };
        const withOptions = () => undefined;
        const view = renderMarkdown({
            raw: 'same',
            rehypePlugins: [[withOptions, options]],
            remarkPlugins: [counter],
        });
        await screen.findByText('same');
        await view.rerender({
            components: { p: own('p', 'own') },
            raw: 'same',
            rehypePlugins: [[withOptions, options]],
            remarkPlugins: [counter],
        });
        expect(screen.getByTestId('own')).toHaveTextContent('same');
        await settle();
        expect(counter).toHaveBeenCalledTimes(1);
    });

    it('模板父组件以插件数组字面量重渲染时不重新编译，components 变化只重渲染', async () => {
        const plugin = compileCounter();
        const view = render(LiteralPlugins, { props: { plugin, tick: 0 } });
        await screen.findByText('same');
        await view.rerender({ plugin, tick: 1 });
        await view.rerender({ components: { p: own('p', 'own') }, plugin, tick: 2 });
        expect(screen.getByTestId('own')).toHaveTextContent('same');
        await settle();
        expect(plugin).toHaveBeenCalledTimes(1);
    });

    it('format 变化时重新编译', async () => {
        const view = renderMarkdown({ format: 'md', raw: 'sum {1 + 1}' });
        await screen.findByText('sum {1 + 1}');
        await view.rerender({ format: 'mdx', raw: 'sum {1 + 1}' });
        expect(await screen.findByText('sum 2')).toBeInTheDocument();
        await view.rerender({ format: 'md', raw: 'sum {1 + 1}' });
        expect(await screen.findByText('sum {1 + 1}')).toBeInTheDocument();
    });

    it('remarkGfm 变化时重新编译', async () => {
        const raw = '| A | B |\n| - | - |\n| 1 | 2 |';
        const view = renderMarkdown({ raw, remarkGfm: false });
        await screen.findByText(/\| A \| B \|/);
        await view.rerender({ raw, remarkGfm: true });
        await waitFor(() => expect(view.container.querySelector('table')).not.toBeNull());
        await view.rerender({ raw, remarkGfm: false });
        await waitFor(() => expect(view.container.querySelector('table')).toBeNull());
    });

    it('插件条目，或 [plugin, options] 条目中的项变化时重新编译', async () => {
        const first = compileCounter();
        const second = compileCounter();
        const view = renderMarkdown({ raw: 'text', remarkPlugins: [first] });
        await screen.findByText('text');
        await view.rerender({ raw: 'text', remarkPlugins: [second] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

        // an options literal is a new object each time, so it compiles again; one defined once in setup stays stable
        await view.rerender({ raw: 'text', remarkPlugins: [[second, { a: 1 }]] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(2));
        await view.rerender({ raw: 'text', remarkPlugins: [[second, { a: 1 }]] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(3));

        const rehype = compileCounter();
        await view.rerender({ raw: 'text', rehypePlugins: [rehype] });
        await waitFor(() => expect(rehype).toHaveBeenCalledTimes(1));
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('md 中把原始 HTML 交给 rehype 插件，并丢弃插件保留为 raw 的内容', async () => {
        type Node = { type: string; value?: string };
        const rawToElement = () => (tree: { children: Node[] }) => {
            tree.children = tree.children.map((node) => (node.type === 'raw' && node.value?.includes('keep') ? { type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: 'kept' }] } : node));
        };
        const { container } = renderMarkdown({
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
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        const { container } = renderMarkdown({ raw: 'text' }, { class: 'own', style: { color: 'red' }, id: 'md', 'data-testid': 'root', onKeydown });
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(prefix, 'own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('id', 'md');
        expect(root).toHaveAttribute('data-testid', 'root');
        expect(root).not.toHaveAttribute('role');
        await fireEvent.keyDown(root, { key: 'a' });
        expect(onKeydown).toHaveBeenCalledTimes(1);
        await screen.findByText('text');
    });

    it('根元素被命名时为 role="group"，显式 role 不被覆盖', () => {
        render(() => (
            <div>
                <MarkdownRender raw="a" aria-label="reply" />
                <MarkdownRender raw="b" aria-labelledby="title" />
                <MarkdownRender raw="c" aria-label="note" role="note" />
            </div>
        ));
        expect(screen.getByRole('group', { name: 'reply' })).toHaveClass(prefix);
        expect(document.querySelector(`[aria-labelledby="title"]`)).toHaveAttribute('role', 'group');
        expect(screen.getByRole('note', { name: 'note' })).toHaveClass(prefix);
    });

    it('从 semiGlobal overrideDefaultProps 读取 format', async () => {
        semiGlobal.config.overrideDefaultProps = { MarkdownRender: { format: 'md' } };
        try {
            render(() => (
                <div>
                    <MarkdownRender raw="global {1 + 1}" />
                    <MarkdownRender format="mdx" raw="explicit {1 + 1}" />
                </div>
            ));
            expect(await screen.findByText('global {1 + 1}')).toBeInTheDocument();
            expect(await screen.findByText('explicit 2')).toBeInTheDocument();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('从注入的 semiGlobal 读取 format 与 remarkGfm，显式传值优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { MarkdownRender: { format: 'md', remarkGfm: false } };
        const table = '| A |\n| - |\n| 1 |';
        const { container } = render(
            () => (
                <div>
                    <MarkdownRender raw={`injected {1 + 1}\n\n${table}`} />
                    <MarkdownRender format="mdx" raw={`explicit {1 + 1}\n\n${table}`} remarkGfm />
                </div>
            ),
            { global: { provide: { [semiGlobalKey]: semi } } }
        );
        expect(await screen.findByText('injected {1 + 1}')).toBeInTheDocument();
        expect(await screen.findByText('explicit 2')).toBeInTheDocument();
        const [injected, explicit] = container.querySelectorAll(`.${prefix}`);
        expect(injected.querySelector('table')).toBeNull();
        expect(explicit.querySelector('table')).not.toBeNull();
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
            const view = renderMarkdown({ format: badProps.format, raw: 'good' });
            await screen.findByText('good');
            await view.rerender(badProps);
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
            renderMarkdown({ raw: 'bad <div', remarkPlugins: [counter] });
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
        const view = renderMarkdown({ raw: 'older', remarkPlugins: [holdOlder] });
        await view.rerender({ raw: 'newer', remarkPlugins: [holdOlder] });
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
        const view = renderMarkdown({ raw: 'late', remarkPlugins: [counter] });
        view.unmount();
        await waitFor(() => expect(counter).toHaveBeenCalledTimes(1));
        await settle();
        expect(view.container).toBeEmptyDOMElement();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('首次编译前渲染空根节点，不带有携带 components 属性的占位符', async () => {
        const { container } = renderMarkdown({ raw: 'text' });
        expect(container.firstElementChild).toBeEmptyDOMElement();
        expect(container.querySelector('[components]')).toBeNull();
        await screen.findByText('text');
    });

    it('服务端渲染输出空根，水合后编译出内容且无水合告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');
        const html = await renderToString(createSSRApp(MarkdownRender, { raw: '# Hydrated' }));
        const host = document.createElement('div');
        host.innerHTML = html;
        expect(host.querySelector(`.${prefix}`)).toBeEmptyDOMElement();
        document.body.append(host);
        const app = createSSRApp(MarkdownRender, { raw: '# Hydrated' });
        try {
            app.mount(host);
            expect(await screen.findByRole('heading', { level: 1, name: 'Hydrated' })).toBeInTheDocument();
            expect(warn).not.toHaveBeenCalled();
            expect(error).not.toHaveBeenCalled();
        } finally {
            app.unmount();
            host.remove();
        }
    });

    it('组件 ref 的 $el 是根元素', async () => {
        const instance = shallowRef<ComponentPublicInstance | null>(null);
        const { container } = render(defineComponent({ setup: () => () => <MarkdownRender ref={instance} raw="text" /> }));
        expect(instance.value?.$el).toBe(container.firstElementChild);
        await screen.findByText('text');
    });

    it('代码围栏的语言含连字符时按完整语言 id 高亮', async () => {
        CodeHighlight.register({ languages: [grammar('objective-c')] });
        const { container } = renderMarkdown({ format: 'md', raw: '```objective-c\nint x = 1;\n```' });
        await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
    });

    it.each(['md', 'mdx'] as const)('%s 下 raw 变化时保留未改动的 DOM 节点', async (format) => {
        const view = renderMarkdown({ format, raw: '# A\n\nx' });
        const heading = await screen.findByRole('heading', { name: 'A' });
        await view.rerender({ format, raw: '# A\n\nxy' });
        await screen.findByText('xy');
        expect(screen.getByRole('heading', { name: 'A' })).toBe(heading);
    });

    describe('table', () => {
        const tablePrefix = BASE_CLASS_PREFIX;
        const renderTable = async (props: MarkdownRenderProps, attrs: Record<string, unknown> = {}) => {
            const { container } = renderMarkdown(props, attrs);
            await waitFor(() => expect(container.querySelector(`.${tablePrefix}-table-container`)).not.toBeNull());
            return container;
        };
        const bodyRows = (container: Element) => container.querySelectorAll(`.${tablePrefix}-table-tbody .${tablePrefix}-table-row`);

        it('table 渲染', async () => {
            const container = await renderTable({
                raw: '| Name | Brand | Count | Price |\n| - | :- | -: | :-: |\n| Book | Semi | 10 | ￥100 |\n| Pen | Semi Design | 20 | ￥200 |',
            });
            expect(container.querySelector(`.${tablePrefix}-table-thead`)).toHaveTextContent('NameBrandCountPrice');
            expect(bodyRows(container)).toHaveLength(2);
        });

        it('只有表头的 table', async () => {
            const container = await renderTable({ raw: '| Title | Name | Count |\n| - | :- | -: |' });
            expect(container.querySelector(`.${tablePrefix}-table-thead`)).toHaveTextContent('TitleNameCount');
            expect(bodyRows(container)).toHaveLength(0);
        });

        it('表头加粗的 table', async () => {
            const container = await renderTable({
                raw: '| Name | **Brand** | **Price** |\n| - | :- | -: |\n| Book | Semi | ￥100 |',
            });
            const thead = container.querySelector(`.${tablePrefix}-table-thead`) as HTMLElement;
            expect(Array.from(thead.querySelectorAll('strong'), (node) => node.textContent)).toEqual(['Brand', 'Price']);
            expect(thead).toHaveTextContent('NameBrandPrice');
            expect(bodyRows(container)).toHaveLength(1);
        });

        it('表头加粗且带组件的 table', async () => {
            const container = await renderTable({
                format: 'mdx',
                raw: '| Name | <h1>Brand</h1> | **Price** |\n| - | :- | :-: |\n| Book | Semi | ￥100 |',
            });
            const thead = container.querySelector(`.${tablePrefix}-table-thead`) as HTMLElement;
            expect(thead.querySelector('h1')).toHaveTextContent(/^Brand$/);
            expect(thead.querySelector('strong')).toHaveTextContent(/^Price$/);
            expect(bodyRows(container)).toHaveLength(1);
        });

        it('表头含行内代码与链接时，th 的 title 取纯文本', async () => {
            const container = await renderTable({ raw: '| `id` | [x](https://a.test) |\n| - | - |\n| 1 | 2 |' });
            const titles = Array.from(container.querySelectorAll(`.${tablePrefix}-table-thead th`), (th) => th.getAttribute('title'));
            expect(titles).toEqual(['id', 'x']);
        });

        it('单列 GFM table 不丢失单元格内容', async () => {
            await renderTable({ raw: '| 标题 |\n| - |\n| 内容 |' });
            expect(screen.getByText('内容')).toBeInTheDocument();
        });

        it('表格保留列对齐，超过 10 行也不分页', async () => {
            const rows = Array.from({ length: 12 }, (_, i) => `| r${i} | ${i} |`).join('\n');
            const container = await renderTable({ format: 'md', raw: `| A | B |\n| :-: | -: |\n${rows}` });
            expect(bodyRows(container)).toHaveLength(12);
            expect(container.querySelector(`.${tablePrefix}-page`)).toBeNull();
            const cells = container.querySelectorAll<HTMLElement>(`.${tablePrefix}-table-tbody tr:first-child td`);
            expect(cells[0].style.textAlign).toBe('center');
            expect(cells[1].style.textAlign).toBe('right');
        });

        // stands in for rehype-raw, whose parse5 output has a tbody but no thead for a raw HTML table
        type HastNode = { type: string; tagName?: string; children?: HastNode[] };
        const dropThead = () => (tree: HastNode) => {
            const walk = (node: HastNode) => {
                if (node.type === 'element' && node.tagName === 'table') {
                    const rows = (node.children ?? []).flatMap((section) => (section.type === 'element' ? (section.children ?? []) : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
                    node.children = [{ type: 'element', tagName: 'tbody', children: rows }];
                }
                node.children?.forEach(walk);
            };
            walk(tree);
        };

        it('没有 thead 的 HTML 表格以 tbody 第一行作表头，正文从第二行开始', async () => {
            const container = await renderTable({
                format: 'md',
                raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |',
                rehypePlugins: [dropThead],
            });
            expect(container.querySelector(`.${tablePrefix}-table-thead`)).toHaveTextContent('ab');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd', 'ef']);
        });

        it('table 下直接的 tr 算作正文行，第一行作表头', async () => {
            const hoistRows = () => (tree: HastNode) => {
                const walk = (node: HastNode) => {
                    if (node.type === 'element' && node.tagName === 'table') {
                        node.children = (node.children ?? []).flatMap((section) => (section.type === 'element' ? (section.children ?? []) : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
                    }
                    node.children?.forEach(walk);
                };
                walk(tree);
            };
            const container = await renderTable({
                format: 'md',
                raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |',
                rehypePlugins: [hoistRows],
            });
            expect(container.querySelector(`.${tablePrefix}-table-thead`)).toHaveTextContent('ab');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd', 'ef']);
        });

        it('覆盖 td、th 后单元格内容与列仍保留', async () => {
            const container = await renderTable({
                format: 'md',
                raw: '| A | B |\n| - | - |\n| c | d |',
                components: { td: own('td', 'own-td'), th: own('th', 'own-th') },
            });
            expect(container.querySelector(`.${tablePrefix}-table-thead`)).toHaveTextContent('AB');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd']);
        });

        it('table 组件的 attrs 排在内置 pagination 之后，传入值优先', async () => {
            const container = await renderTable({
                format: 'md',
                raw: `| A |\n| - |\n${Array.from({ length: 12 }, (_, i) => `| r${i} |`).join('\n')}`,
                components: {
                    table: (_, { attrs, slots }) => (
                        <MarkdownRender.defaultComponents.table {...attrs} {...{ pagination: true }}>
                            {slots}
                        </MarkdownRender.defaultComponents.table>
                    ),
                },
            });
            expect(bodyRows(container)).toHaveLength(10);
            expect(container.querySelector(`.${tablePrefix}-page`)).not.toBeNull();
        });

        it('表格内容变化后更新单元格', async () => {
            const view = renderMarkdown({ format: 'md', raw: '| A |\n| - |\n| x |' });
            await screen.findByText('x');
            await view.rerender({ format: 'md', raw: '| A |\n| - |\n| y |\n| z |' });
            await screen.findByText('z');
            expect(screen.queryByText('x')).toBeNull();
            expect(screen.getByText('y')).toBeInTheDocument();
        });
    });

    describe('runtime', () => {
        it.each<[string, MarkdownRenderProps]>([
            ['mdx 片段只有一个文本子项', { raw: '<>fragment text</>' }],
            ['md 单段落', { format: 'md', raw: 'fragment text' }],
        ])('%s 时正常渲染，组件内容不触发非函数插槽告警', async (_, props) => {
            const warn = vi.spyOn(console, 'warn');
            renderMarkdown(props);
            expect(await screen.findByText('fragment text')).toBeInTheDocument();
            expect(warn).not.toHaveBeenCalled();
        });

        it('MDX 作者在组件上写的 className 并入 class，客户端与服务端都只有一个 class 属性', async () => {
            const Probe = defineComponent({
                setup:
                    (_, { slots }) =>
                    () => <span class="probe-root">{slots}</span>,
            });
            renderMarkdown({ components: { Probe }, raw: '<Probe className="author">probe</Probe>' });
            expect(await screen.findByText('probe')).toHaveAttribute('class', 'probe-root author');

            const html = await renderToString(createSSRApp({ render: () => runtime.jsx(Probe, { className: 'author', children: 'probe' }) }));
            expect(html).toBe('<span class="probe-root author">probe</span>');
        });

        it('MDX 中的监听器按 Vue 命名生效，组件事件只触发一次', async () => {
            const hit = vi.fn<(source: string) => void>();
            vi.stubGlobal('mdxHit', hit);
            renderMarkdown({
                components: { EmitButton },
                raw: ['<EmitButton onClick={() => mdxHit("component")}>component</EmitButton>', '<button onClick={() => mdxHit("native")}>native</button>', '<span onMouseenter={() => mdxHit("enter")} onMouseEnter={() => mdxHit("react name")}>hover</span>'].join('\n\n'),
            });
            await fireEvent.click(await screen.findByRole('button', { name: 'component' }));
            await fireEvent.click(screen.getByRole('button', { name: 'native' }));
            await fireEvent.mouseEnter(screen.getByText('hover'));
            expect(hit.mock.calls).toEqual([['component'], ['native'], ['enter']]);
        });

        it('components.wrapper 声明 components prop 时根元素不带 components 属性', async () => {
            const { container } = renderMarkdown({ components: { wrapper: MdxWrapper }, raw: 'wrapped' });
            expect(await screen.findByText('wrapped')).toBeInTheDocument();
            const wrapper = container.querySelector('section.wrap');
            expect(wrapper).toContainElement(screen.getByText('wrapped'));
            expect(wrapper).not.toHaveAttribute('components');
        });
    });
});
