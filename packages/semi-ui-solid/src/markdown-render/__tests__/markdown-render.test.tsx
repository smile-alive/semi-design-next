import { createSignal, type JSX } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import semiGlobal from '../../_utils/semi-global';
import CodeHighlight from '../../code-highlight';
import { grammar } from '../../code-highlight/__tests__/grammars';
import Tooltip from '../../tooltip';
import type { ParagraphProps } from '../../typography';
import { h1 as H1, p as P } from '../components';
import MarkdownRender, { type MarkdownRenderProps } from '../index';

// unified calls a plugin's attacher once per compile, so a no-op remark plugin counts compiles
const compileCounter = () => vi.fn<() => undefined>(() => undefined);
const settle = () => sleep(20);

// MarkdownRender compiles the source asynchronously after mount, so wait for the table to show up.
async function renderTable(props: MarkdownRenderProps) {
    const { container } = render(() => <MarkdownRender {...props} />);
    await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).not.toBeNull());
    return container;
}

const bodyRows = (container: HTMLElement) => container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);

type HastNode = { type: string; tagName?: string; value?: string; properties?: { className?: string[] }; children?: HastNode[] };

describe('MarkdownRender', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('md 格式在首次渲染时同步编译', () => {
        render(() => <MarkdownRender format="md" raw={'# Title\n\nbody'} />);
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();
    });

    describe('table', () => {
        it('table 渲染', async () => {
            const container = await renderTable({ raw: '| Name | Brand | Count | Price |\n| - | :- | -: | :-: |\n| Book | Semi | 10 | ￥100 |\n| Pen | Semi Design | 20 | ￥200 |' });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).not.toBeNull();
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
            expect(bodyRows(container)).toHaveLength(2);
        });

        it('只有表头的 table', async () => {
            const container = await renderTable({ raw: '| Title | Name | Count | Price |\n| - | :- | -: | :-: |' });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('TitleNameCountPrice');
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
        });

        it('表头加粗的 table', async () => {
            const container = await renderTable({ raw: '| Name | **Brand** | Count | **Price** |\n| - | :- | -: | :-: |\n| Book | Semi | 10 | ￥100 |\n| Pen | Semi Design | 20 | ￥200 |' });
            const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`) as HTMLElement;
            expect(Array.from(thead.querySelectorAll('strong'), (node) => node.textContent)).toEqual(['Brand', 'Price']);
            expect(bodyRows(container)).toHaveLength(2);
            for (const text of ['Semi Design', 'Semi', '￥100', '￥200']) {
                expect(screen.getByText(text)).toBeInTheDocument();
            }
        });

        it('表头加粗且带组件的 table', async () => {
            const container = await renderTable({ format: 'mdx', raw: '| Name | <h1>Brand</h1> | Count | **Price** |\n| - | :- | -: | :-: |\n| Book | Semi | 10 | ￥100 |\n| Pen | Semi Design | 20 | ￥200 |' });
            const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`) as HTMLElement;
            expect(thead.querySelector('h1')).toHaveTextContent(/^Brand$/);
            expect(thead.querySelector('strong')).toHaveTextContent(/^Price$/);
            expect(bodyRows(container)).toHaveLength(2);
            const cells = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-tbody tr:first-child td`);
            expect(Array.from(cells, (cell) => cell.style.textAlign)).toEqual(['', 'left', 'right', 'center']);
            for (const text of ['Semi Design', 'Semi', '￥100', '￥200']) {
                expect(screen.getByText(text)).toBeInTheDocument();
            }
        });

        it('单列 GFM table 不丢失单元格内容', async () => {
            await renderTable({ raw: '| 标题 |\n| - |\n| 内容 |' });
            expect(screen.getByText('内容')).toBeInTheDocument();
        });

        it('表格保留列对齐，超过 10 行也不分页', async () => {
            const rows = Array.from({ length: 12 }, (_, i) => `| r${i} | ${i} |`).join('\n');
            const container = await renderTable({ format: 'md', raw: `| A | B |\n| :-: | -: |\n${rows}` });
            expect(bodyRows(container)).toHaveLength(12);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-page`)).toBeNull();
            const cells = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-tbody tr:first-child td`);
            expect(cells[0].style.textAlign).toBe('center');
            expect(cells[1].style.textAlign).toBe('right');
        });

        // stands in for rehype-raw, whose parse5 output has a tbody but no thead for a raw HTML table
        const dropThead = () => (tree: HastNode) => {
            const walk = (node: HastNode) => {
                if (node.type === 'element' && node.tagName === 'table') {
                    const rows = (node.children ?? []).flatMap((section) => (section.type === 'element' ? (section.children ?? []) : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
                    node.children = [{ type: 'element', tagName: 'tbody', properties: {}, children: rows }];
                }
                node.children?.forEach(walk);
            };
            walk(tree);
        };

        it('没有 thead 的 HTML 表格以 tbody 第一行作表头，正文从第二行开始', async () => {
            const container = await renderTable({ format: 'md', raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |', rehypePlugins: [dropThead] });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
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
            const container = await renderTable({ format: 'md', raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |', rehypePlugins: [hoistRows] });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd', 'ef']);
        });

        it('多个 tbody 与直接的 tr 按文档顺序都算作正文行', async () => {
            const splitBody = () => (tree: HastNode) => {
                const walk = (node: HastNode) => {
                    if (node.type === 'element' && node.tagName === 'table') {
                        const [thead, tbody] = (node.children ?? []).filter((section) => section.type === 'element');
                        const rows = (tbody.children ?? []).filter((row) => row.type === 'element' && row.tagName === 'tr');
                        const section = (children: HastNode[]): HastNode => ({ type: 'element', tagName: 'tbody', properties: {}, children });
                        node.children = [thead, section([rows[0]]), rows[1], section([rows[2]])];
                    }
                    node.children?.forEach(walk);
                };
                walk(tree);
            };
            const container = await renderTable({ format: 'md', raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |\n| g | h |', rehypePlugins: [splitBody] });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd', 'ef', 'gh']);
        });

        it('覆盖 td、th 后单元格内容与列仍保留', async () => {
            const container = await renderTable({
                format: 'md',
                raw: '| A | B |\n| - | - |\n| c | d |',
                components: {
                    td: (props: { children?: JSX.Element }) => <td data-testid="own-td">{props.children}</td>,
                    th: (props: { children?: JSX.Element }) => <th data-testid="own-th">{props.children}</th>,
                },
            });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('AB');
            expect(Array.from(bodyRows(container), (row) => row.textContent)).toEqual(['cd']);
        });

        it('table 组件的属性排在内置 pagination 之后，传入值优先', async () => {
            const Paged = (props: { children?: JSX.Element }) => <MarkdownRender.defaultComponents.table {...props} pagination />;
            const container = await renderTable({ format: 'md', raw: `| A |\n| - |\n${Array.from({ length: 12 }, (_, i) => `| r${i} |`).join('\n')}`, components: { table: Paged } });
            expect(bodyRows(container)).toHaveLength(10);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-page`)).not.toBeNull();
        });

        it('表格内容变化后更新单元格', async () => {
            const [raw, setRaw] = createSignal('| A |\n| - |\n| x |');
            render(() => <MarkdownRender format="md" raw={raw()} />);
            await screen.findByText('x');
            setRaw('| A |\n| - |\n| y |\n| z |');
            await screen.findByText('z');
            expect(screen.queryByText('x')).toBeNull();
            expect(screen.getByText('y')).toBeInTheDocument();
        });
    });

    it('mdx（默认）下计算表达式，md 下保留为文本', async () => {
        render(() => (
            <div>
                <MarkdownRender raw="mdx {1 + 1} sum" />
                <MarkdownRender format="md" raw="md {1 + 1} sum" />
            </div>
        ));
        expect(await screen.findByText('mdx 2 sum')).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender-component-p`);
        expect(await screen.findByText('md {1 + 1} sum')).toBeInTheDocument();
    });

    it('用 Semi 组件渲染标题、链接与段落', async () => {
        const { container } = render(() => <MarkdownRender raw={'# Title\n\n[Semi](https://semi.design)'} />);
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveClass(`${BASE_CLASS_PREFIX}-typography`, `${BASE_CLASS_PREFIX}-markdownRender-component-header`);
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveAttribute('href', 'https://semi.design');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-typography-link`)).not.toBeNull();
    });

    it('链接的 href 与 title 只落在 a 元素上，外层 Typography 元素不带', async () => {
        const { container } = render(() => <MarkdownRender format="md" raw='[x](https://a.b "t")' />);
        const link = await screen.findByRole('link', { name: 'x' });
        expect(link).toHaveAttribute('href', 'https://a.b');
        expect(link).toHaveAttribute('title', 't');
        expect(container.querySelectorAll('[href]')).toHaveLength(1);
        expect(container.querySelectorAll('[title]')).toHaveLength(1);
    });

    it('标题与段落合并传入的 class 与内置类名', () => {
        render(() => (
            <div>
                <H1 class="x">title</H1>
                <P class="y">body</P>
            </div>
        ));
        expect(screen.getByText('title')).toHaveClass('x', `${BASE_CLASS_PREFIX}-markdownRender-component-header`);
        expect(screen.getByText('body')).toHaveClass('y', `${BASE_CLASS_PREFIX}-markdownRender-component-p`);
    });

    it('允许组件覆盖 Semi 的默认实现', async () => {
        render(() => <MarkdownRender components={{ h1: (props: { children?: JSX.Element }) => <h1 data-testid="own">{props.children}</h1> }} raw={'# Title\n\nbody'} />);
        expect(await screen.findByTestId('own')).toHaveTextContent('Title');
        expect(screen.getByTestId('own')).not.toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
        expect(screen.getByText('body')).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender-component-p`);
    });

    it.each<'md' | 'mdx'>(['md', 'mdx'])('图片块不嵌套在 p 元素中（%s）', async (format) => {
        const { container } = render(() => <MarkdownRender format={format} raw='before ![cat](a.png "cat") after' />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`)).not.toBeNull());
        const image = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`) as HTMLElement;
        expect(image.closest('p')).toBeNull();
        const paragraph = image.closest(`.${BASE_CLASS_PREFIX}-markdownRender-component-p`);
        expect(paragraph).toHaveTextContent('before');
        expect(paragraph).toHaveClass(`${BASE_CLASS_PREFIX}-typography-paragraph`);
    });

    it('纯文本段落保持为 p 元素', async () => {
        render(() => <MarkdownRender raw="plain text" />);
        expect((await screen.findByText('plain text')).tagName).toBe('P');
    });

    it('把 Semi 组件暴露为 MarkdownRender.defaultComponents', () => {
        expect(Object.keys(MarkdownRender.defaultComponents).toSorted()).toEqual(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'p', 'pre', 'table'].toSorted());
        expectTypeOf<Parameters<typeof MarkdownRender.defaultComponents.p>[0]>().toEqualTypeOf<ParagraphProps>();
    });

    it('类型：components 的值是组件，元素键也可以是自身的标签名', () => {
        type Components = NonNullable<MarkdownRenderProps['components']>;
        const Custom = (props: { title?: string }) => <span>{props.title}</span>;
        expectTypeOf({ h1: H1, p: P, Custom }).toExtend<Components>();
        expectTypeOf<{ h1: 'h1' }>().toExtend<Components>();
        expectTypeOf<{ h1: number }>().not.toExtend<Components>();
        expectTypeOf<{ h1: 'h2' }>().not.toExtend<Components>();
        expectTypeOf<{ Custom: number }>().not.toExtend<Components>();
        const custom: Components = {};
        expectTypeOf({ ...MarkdownRender.defaultComponents, ...custom }).toExtend<Components>();
    });

    it('remarkGfm 为 false 时，table 语法保留为文本', async () => {
        const { container } = render(() => <MarkdownRender raw={'| A | B |\n| - | - |\n| 1 | 2 |'} remarkGfm={false} />);
        await screen.findByText(/\| A \| B \|/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).toBeNull();
    });

    it('把插件传给编译器', async () => {
        const remarkPlugin = vi.fn<() => undefined>(() => undefined);
        const rehypePlugin = vi.fn<() => undefined>(() => undefined);
        render(() => <MarkdownRender raw="text" rehypePlugins={[rehypePlugin]} remarkPlugins={[remarkPlugin]} />);
        await screen.findByText('text');
        expect(remarkPlugin).toHaveBeenCalledTimes(1);
        expect(rehypePlugin).toHaveBeenCalledTimes(1);
    });

    it('原始内容变化后渲染新源码', async () => {
        const counter = compileCounter();
        const [raw, setRaw] = createSignal('first');
        render(() => <MarkdownRender raw={raw()} remarkPlugins={[counter]} />);
        await screen.findByText('first');
        setRaw('second');
        await screen.findByText('second');
        expect(screen.queryByText('first')).toBeNull();
        expect(counter).toHaveBeenCalledTimes(2);
    });

    it('新组件与内容相同的新插件数组直接生效，无需再次编译', async () => {
        const counter = compileCounter();
        const options = { a: 1 };
        const withOptions = () => undefined;
        const [props, setProps] = createSignal<Partial<MarkdownRenderProps>>({ rehypePlugins: [[withOptions, options]], remarkPlugins: [counter] });
        render(() => <MarkdownRender raw="same" {...props()} />);
        await screen.findByText('same');
        setProps({ class: 'next', components: { p: (own: { children?: JSX.Element }) => <p data-testid="own">{own.children}</p> }, rehypePlugins: [[withOptions, options]], remarkPlugins: [counter] });
        expect(screen.getByTestId('own')).toHaveTextContent('same');
        await settle();
        expect(counter).toHaveBeenCalledTimes(1);
    });

    it('format 变化时重新编译', async () => {
        const [format, setFormat] = createSignal<'md' | 'mdx'>('md');
        render(() => <MarkdownRender format={format()} raw="sum {1 + 1}" />);
        await screen.findByText('sum {1 + 1}');
        setFormat('mdx');
        expect(await screen.findByText('sum 2')).toBeInTheDocument();
        setFormat('md');
        expect(await screen.findByText('sum {1 + 1}')).toBeInTheDocument();
    });

    it('remarkGfm 变化时重新编译', async () => {
        const [gfm, setGfm] = createSignal(false);
        const { container } = render(() => <MarkdownRender raw={'| A | B |\n| - | - |\n| 1 | 2 |'} remarkGfm={gfm()} />);
        await screen.findByText(/\| A \| B \|/);
        setGfm(true);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).not.toBeNull());
        setGfm(false);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).toBeNull());
    });

    it('插件条目，或 [plugin, options] 条目中的项变化时重新编译', async () => {
        const first = compileCounter();
        const second = compileCounter();
        const [props, setProps] = createSignal<Partial<MarkdownRenderProps>>({ remarkPlugins: [first] });
        render(() => <MarkdownRender raw="text" {...props()} />);
        await screen.findByText('text');
        setProps({ remarkPlugins: [second] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

        // an options literal is a new object every time, so it compiles again
        setProps({ remarkPlugins: [[second, { a: 1 }]] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(2));
        setProps({ remarkPlugins: [[second, { a: 1 }]] });
        await waitFor(() => expect(second).toHaveBeenCalledTimes(3));

        const rehype = compileCounter();
        setProps({ rehypePlugins: [rehype] });
        await waitFor(() => expect(rehype).toHaveBeenCalledTimes(1));
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('md 中把原始 HTML 交给 rehype 插件，并丢弃插件保留为 raw 的内容', async () => {
        // stands in for rehype-raw: turns the block of raw HTML into an element
        const rawToElement = () => (tree: HastNode) => {
            tree.children = tree.children?.map((node) => (node.type === 'raw' && node.value?.includes('keep') ? { type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: 'kept' }] } : node));
        };
        const { container } = render(() => <MarkdownRender format="md" raw={'<section>keep</section>\n\n<section>drop</section>\n\nafter'} rehypePlugins={[rawToElement]} />);
        await screen.findByText('after');
        expect(container.querySelector('mark')).toHaveTextContent('kept');
        expect(container.querySelector('section')).toBeNull();
        expect(container).not.toHaveTextContent('drop');
    });

    it('class、style 与 data-* 放在根节点上', async () => {
        const { container } = render(() => <MarkdownRender class="own" style={{ color: 'red' }} data-testid="root" raw="text" />);
        const root = container.firstChild;
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender`, 'own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-testid', 'root');
        await screen.findByText('text');
    });

    it('从 semiGlobal overrideDefaultProps 读取 format', async () => {
        semiGlobal.config.overrideDefaultProps = { MarkdownRender: { format: 'md' } };
        render(() => (
            <div>
                <MarkdownRender raw="global {1 + 1}" />
                <MarkdownRender format="mdx" raw="explicit {1 + 1}" />
            </div>
        ));
        expect(await screen.findByText('global {1 + 1}')).toBeInTheDocument();
        expect(await screen.findByText('explicit 2')).toBeInTheDocument();
    });

    it.each<[string, Partial<MarkdownRenderProps>, RegExp]>([
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
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const [props, setProps] = createSignal<Partial<MarkdownRenderProps>>({ format: badProps.format, raw: 'good' });
            render(() => <MarkdownRender raw="" {...props()} />);
            await screen.findByText('good');
            setProps(badProps);
            await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
            expect(String(error.mock.calls[0][0])).toMatch(message);
            await settle();
            expect(reasons).toEqual([]);
            expect(screen.getByText('good')).toBeInTheDocument();
        } finally {
            error.mockRestore();
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('生产环境不输出编译错误日志', async () => {
        const env = process.env.NODE_ENV;
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const counter = compileCounter();
        process.env.NODE_ENV = 'production';
        try {
            render(() => <MarkdownRender raw="bad <div" remarkPlugins={[counter]} />);
            await waitFor(() => expect(counter).toHaveBeenCalledTimes(1));
            await settle();
            expect(error).not.toHaveBeenCalled();
        } finally {
            process.env.NODE_ENV = env;
            error.mockRestore();
        }
    });

    it('较早的编译最后完成时，保留较新的源码', async () => {
        let release = () => {};
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const holdOlder = () => async (tree: HastNode) => {
            if (JSON.stringify(tree).includes('older')) {
                await gate;
            }
        };
        const [raw, setRaw] = createSignal('older');
        render(() => <MarkdownRender raw={raw()} remarkPlugins={[holdOlder]} />);
        setRaw('newer');
        await screen.findByText('newer');
        release();
        await settle();
        expect(screen.queryByText('older')).toBeNull();
        expect(screen.getByText('newer')).toBeInTheDocument();
    });

    it('卸载时编译未完成，之后不写回、无报错', async () => {
        const error = vi.spyOn(console, 'error');
        try {
            const { container, unmount } = render(() => <MarkdownRender raw="late" />);
            unmount();
            await settle();
            expect(container).toBeEmptyDOMElement();
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('首次编译前渲染空根节点', async () => {
        const { container } = render(() => <MarkdownRender raw="text" />);
        expect(container.firstChild).toBeEmptyDOMElement();
        await screen.findByText('text');
    });

    it('ref 放在根元素上', async () => {
        let root: HTMLDivElement | undefined;
        const { container } = render(() => <MarkdownRender ref={(node) => (root = node)} raw="text" />);
        expect(root).toBe(container.firstChild);
        await screen.findByText('text');
    });

    it('代码围栏的语言含连字符时按完整语言 id 高亮', async () => {
        CodeHighlight.register({ languages: [grammar('objective-c')] });
        const { container } = render(() => <MarkdownRender format="md" raw={'```objective-c\nint x = 1;\n```'} />);
        await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
    });

    it('链接内的图片使段落渲染为 div，且图片不可预览', async () => {
        const { container } = render(() => <MarkdownRender format="md" raw="[![cat](a.png)](https://x.test)" />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`)).not.toBeNull());
        const image = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`) as HTMLElement;
        expect(image.closest('p')).toBeNull();
        fireEvent.load(image.querySelector('img') as HTMLImageElement);
        const link = container.querySelector('a') as HTMLAnchorElement;
        expect(link.querySelector('[role="button"], [tabindex="0"]')).toBeNull();
    });

    it('使用方显式传 preview 时，链接内的图片可预览', async () => {
        const Previewable = (props: object) => <MarkdownRender.defaultComponents.img {...props} preview />;
        const { container } = render(() => <MarkdownRender components={{ img: Previewable }} format="md" raw="[![cat](a.png)](https://x.test)" />);
        const img = await waitFor(() => {
            const node = container.querySelector('img');
            expect(node).not.toBeNull();
            return node as HTMLImageElement;
        });
        fireEvent.load(img);
        await waitFor(() => expect(container.querySelector('a [role="button"], a [tabindex="0"]')).not.toBeNull());
    });

    it('图片的可见说明对辅助技术隐藏', async () => {
        const { container } = render(() => <MarkdownRender format="md" raw="![cat](a.png)" />);
        const alt = await waitFor(() => {
            const node = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image-alt`);
            expect(node).not.toBeNull();
            return node;
        });
        expect(alt).toHaveAttribute('aria-hidden', 'true');
    });

    it('根元素被命名时为 role="group"，显式 role 不被覆盖', async () => {
        const [props, setProps] = createSignal<Partial<MarkdownRenderProps>>({ 'aria-label': 'msg' });
        render(() => <MarkdownRender raw="x" {...props()} />);
        expect(screen.getByLabelText('msg')).toHaveAttribute('role', 'group');
        setProps({ 'aria-labelledby': 't' });
        expect(document.querySelector('[aria-labelledby="t"]')).toHaveAttribute('role', 'group');
        setProps({ 'aria-label': 'msg', role: 'note' });
        expect(screen.getByLabelText('msg')).toHaveAttribute('role', 'note');
        setProps({});
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender`)).not.toHaveAttribute('role');
        await screen.findByText('x');
    });

    it.each(['md', 'mdx'] as const)('%s 下有语言的代码块不包在 pre 内，无语言的保留 pre，行内代码保留 code 元素', async (format) => {
        const { container } = render(() => <MarkdownRender format={format} raw={'```js\nx\n```\n\n```\nplain\n```\n\nsome `b` text'} />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).not.toBeNull());
        expect((container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`) as HTMLElement).parentElement?.closest('pre')).toBeNull();
        expect(screen.getByText('plain').closest('pre > code')).not.toBeNull();
        expect(screen.getByText('b').tagName).toBe('CODE');
    });

    it('components 里值为 undefined 的键回退为内置组件，不当作元素类型', async () => {
        render(() => <MarkdownRender components={{ h1: undefined }} format="md" raw="# a" />);
        expect(await screen.findByRole('heading', { name: 'a' })).toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
    });

    it('代码块的子节点是元素时不交给高亮，保留 pre 直接渲染 code', async () => {
        // stands in for a highlighter plugin that splits the code text into spans
        const wrapCodeText = () => (tree: HastNode) => {
            const visit = (node: HastNode) => {
                if (node.tagName === 'code' && node.properties?.className?.includes('language-js')) {
                    node.children = [{ type: 'element', tagName: 'span', properties: {}, children: node.children }];
                }
                node.children?.forEach(visit);
            };
            visit(tree);
        };
        const { container } = render(() => <MarkdownRender format="md" raw={'```js\nlet x\n```'} rehypePlugins={[wrapCodeText]} />);
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

    it('替换 code 后有语言的代码块保留 pre；包裹内置 code 的替换高亮时去掉 pre', async () => {
        const Own = (props: { class?: string; children?: JSX.Element }) => (
            <code data-testid="own" class={props.class}>
                {props.children}
            </code>
        );
        const Wrapped = (props: { class?: string; children?: JSX.Element }) => (
            <div data-testid="wrapped">
                <MarkdownRender.defaultComponents.code {...props} />
            </div>
        );
        render(() => (
            <div>
                <MarkdownRender components={{ code: Own }} format="md" raw={'```js\nx\n```'} />
                <MarkdownRender components={{ code: Wrapped }} format="md" raw={'```js\ny\n```'} />
            </div>
        ));
        expect((await screen.findByTestId('own')).parentElement?.tagName).toBe('PRE');
        const wrapped = await screen.findByTestId('wrapped');
        expect(wrapped.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).not.toBeNull();
        expect(wrapped.closest('pre')).toBeNull();
    });

    it.each(['md', 'mdx'] as const)('%s 下 raw 变化时保留未改动的 DOM 节点', async (format) => {
        const [raw, setRaw] = createSignal('# A\n\nx');
        render(() => <MarkdownRender format={format} raw={raw()} />);
        const heading = await screen.findByRole('heading', { name: 'A' });
        setRaw('# A\n\nxy');
        await screen.findByText('xy');
        expect(screen.getByRole('heading', { name: 'A' })).toBe(heading);
    });

    describe('runtime', () => {
        it('MDX 作者在组件上写的 className 并入 class', async () => {
            const Probe = (props: { class?: string; children?: JSX.Element }) => <span class={`probe-root ${props.class}`}>{props.children}</span>;
            render(() => <MarkdownRender components={{ Probe }} raw={'<Probe className="author">probe</Probe>'} />);
            expect(await screen.findByText('probe')).toHaveAttribute('class', 'probe-root author');
        });

        it('MDX 中的监听器按 Solid 命名生效', async () => {
            const hit = vi.fn<(source: string) => void>();
            vi.stubGlobal('mdxHit', hit);
            try {
                render(() => <MarkdownRender raw={'<button onClick={() => mdxHit("native")}>native</button>'} />);
                fireEvent.click(await screen.findByRole('button', { name: 'native' }));
                expect(hit.mock.calls).toEqual([['native']]);
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it('MDX 表达式传入的 Map 内容变化时重建该块，不沿用旧内容', async () => {
            const Probe = (props: { data: Map<number, string> }) => <span data-testid="probe">{[...props.data.values()].join()}</span>;
            const [raw, setRaw] = createSignal('<Probe data={new Map([[1, "a"]])} />');
            render(() => <MarkdownRender components={{ Probe }} raw={raw()} />);
            expect(await screen.findByTestId('probe')).toHaveTextContent('a');
            setRaw('<Probe data={new Map([[1, "b"]])} />');
            await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('b'));
        });

        it('MDX 中作为 Tooltip 子项的元素收到触发器属性', async () => {
            render(() => <MarkdownRender components={{ Tooltip }} raw={'<Tooltip content="tip"><button>trigger</button></Tooltip>'} />);
            const trigger = await screen.findByRole('button', { name: 'trigger' });
            expect(trigger.closest('[data-popupid], [aria-describedby]')).not.toBeNull();
        });
    });
});
