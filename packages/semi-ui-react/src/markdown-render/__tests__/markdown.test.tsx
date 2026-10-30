import React, { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import CodeHighlight from '@fibrae/semi-ui-react/code-highlight';
import type { ParagraphProps } from '@fibrae/semi-ui-react/typography';
import { sleep } from '@test/utils/react';
import { h1 as H1, p as P } from '../components';
import MarkdownRender, { type MarkdownRenderProps } from '../index';

// unified calls a plugin's attacher once per compile, so a no-op remark plugin counts compiles
const compileCounter = () => vi.fn<() => undefined>(() => undefined);
const settle = () => sleep(20);

// MarkdownRender compiles the source asynchronously after mount, so wait for the table to show up.
async function renderTable(props) {
    const { container } = render(<MarkdownRender {...props} />);
    await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).not.toBeNull());
    return container;
}

describe(`MarkdownRender`, () => {
    it(`table 渲染`, async () => {
        const content = `
        | Name | Brand | Count | Price |
        | - | :- | -: | :-: |
        | Book | Semi | 10 | ￥100 |
        | Pen | Semi Design | 20 | ￥200 |
        `;

        const container = await renderTable({ raw: content });

        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(2);
    });

    it(`只有表头的 table`, async () => {
        const content = `
        | Title | Name | Count | Price |
        | - | :- | -: | :-: |
        `;

        const container = await renderTable({ raw: content });

        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('TitleNameCountPrice');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
    });

    it(`表头加粗的 table`, async () => {
        const content = `
        | Name | **Brand** | Count | **Price** |
        | - | :- | -: | :-: |
        | Book | Semi | 10 | ￥100 |
        | Pen | Semi Design | 20 | ￥200 |
        `;

        const container = await renderTable({ raw: content });

        const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`);
        expect(thead).not.toBeNull();
        expect(Array.from(thead.querySelectorAll('strong'), (node) => node.textContent)).toEqual(['Brand', 'Price']);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(2);
        for (const text of ['Semi Design', 'Semi', '￥100', '￥200']) {
            expect(screen.getByText(text)).toBeInTheDocument();
        }
    });

    it(`表头加粗且带组件的 table`, async () => {
        const content = `
        | Name | <h1>Brand</h1> | Count | **Price** |
        | - | :- | -: | :-: |
        | Book | Semi | 10 | ￥100 |
        | Pen | Semi Design | 20 | ￥200 |
        `;

        const container = await renderTable({ raw: content, format: 'mdx' });

        const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`);
        expect(thead).not.toBeNull();
        expect(thead.querySelector('h1')).toHaveTextContent(/^Brand$/);
        expect(thead.querySelector('strong')).toHaveTextContent(/^Price$/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(2);
        for (const text of ['Semi Design', 'Semi', '￥100', '￥200']) {
            expect(screen.getByText(text)).toBeInTheDocument();
        }
    });

    it(`单列 GFM table 不丢失单元格内容`, async () => {
        const content = `
        | 标题 |
        | - |
        | 内容 |
        `;

        await renderTable({ raw: content });

        expect(screen.getByText('内容')).toBeInTheDocument();
    });

    it('mdx（默认）下计算表达式，md 下保留为文本', async () => {
        render(
            <div>
                <MarkdownRender raw="mdx {1 + 1} sum" />
                <MarkdownRender format="md" raw="md {1 + 1} sum" />
            </div>
        );
        expect(await screen.findByText('mdx 2 sum')).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender-component-p`);
        expect(await screen.findByText('md {1 + 1} sum')).toBeInTheDocument();
    });

    it('用 Semi 组件渲染标题、链接与段落', async () => {
        const { container } = render(<MarkdownRender raw={'# Title\n\n[Semi](https://semi.design)'} />);
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveClass(`${BASE_CLASS_PREFIX}-typography`, `${BASE_CLASS_PREFIX}-markdownRender-component-header`);
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveAttribute('href', 'https://semi.design');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-typography-link`)).not.toBeNull();
    });

    it('链接的 href 与 title 只落在 a 元素上，外层 Typography 元素不带', async () => {
        const { container } = render(<MarkdownRender format="md" raw='[x](https://a.b "t")' />);
        const link = await screen.findByRole('link', { name: 'x' });
        expect(link).toHaveAttribute('href', 'https://a.b');
        expect(link).toHaveAttribute('title', 't');
        expect(container.querySelectorAll('[href]')).toHaveLength(1);
        expect(container.querySelectorAll('[title]')).toHaveLength(1);
    });

    it('标题与段落合并传入的 className 与内置类名', () => {
        render(
            <div>
                <H1 className="x">title</H1>
                <P className="y">body</P>
            </div>
        );
        expect(screen.getByText('title')).toHaveClass('x', `${BASE_CLASS_PREFIX}-markdownRender-component-header`);
        expect(screen.getByText('body')).toHaveClass('y', `${BASE_CLASS_PREFIX}-markdownRender-component-p`);
    });

    it('允许组件覆盖 Semi 的默认实现', async () => {
        render(<MarkdownRender components={{ h1: ({ children }) => <h1 data-testid="own">{children}</h1> }} raw={'# Title\n\nbody'} />);
        expect(await screen.findByTestId('own')).toHaveTextContent('Title');
        expect(screen.getByTestId('own')).not.toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
        expect(screen.getByText('body')).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender-component-p`);
    });

    it.each<'md' | 'mdx'>(['md', 'mdx'])('图片块不嵌套在 p 元素中（%s）', async (format) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const { container } = render(<MarkdownRender format={format} raw='before ![cat](a.png "cat") after' />);
            await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`)).not.toBeNull());
            const image = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`);
            expect(image.closest('p')).toBeNull();
            const paragraph = image.closest(`.${BASE_CLASS_PREFIX}-markdownRender-component-p`);
            expect(paragraph).toHaveTextContent('before');
            expect(paragraph).toHaveClass(`${BASE_CLASS_PREFIX}-typography-paragraph`);
            expect(error.mock.calls.flat().join('\n')).not.toMatch(/validateDOMNesting|cannot be a descendant/);
        } finally {
            error.mockRestore();
        }
    });

    it('纯文本段落保持为 p 元素', async () => {
        render(<MarkdownRender raw="plain text" />);
        expect((await screen.findByText('plain text')).tagName).toBe('P');
    });

    it('把 Semi 组件暴露为 MarkdownRender.defaultComponents', () => {
        expect(Object.keys(MarkdownRender.defaultComponents).toSorted()).toEqual(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'p', 'pre', 'table'].toSorted());
        expectTypeOf<Parameters<typeof MarkdownRender.defaultComponents.p>[0]>().toEqualTypeOf<React.PropsWithChildren<ParagraphProps>>();
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
        const { container } = render(<MarkdownRender raw={'| A | B |\n| - | - |\n| 1 | 2 |'} remarkGfm={false} />);
        await screen.findByText(/\| A \| B \|/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).toBeNull();
    });

    it('把插件传给编译器', async () => {
        const remarkPlugin = vi.fn<() => undefined>(() => undefined);
        const rehypePlugin = vi.fn<() => undefined>(() => undefined);
        render(<MarkdownRender raw="text" rehypePlugins={[rehypePlugin]} remarkPlugins={[remarkPlugin]} />);
        await screen.findByText('text');
        expect(remarkPlugin).toHaveBeenCalledTimes(1);
        expect(rehypePlugin).toHaveBeenCalledTimes(1);
    });

    it('原始内容变化后渲染新源码', async () => {
        const counter = compileCounter();
        const { rerender } = render(<MarkdownRender raw="first" remarkPlugins={[counter]} />);
        await screen.findByText('first');
        rerender(<MarkdownRender raw="second" remarkPlugins={[counter]} />);
        await screen.findByText('second');
        expect(screen.queryByText('first')).toBeNull();
        expect(counter).toHaveBeenCalledTimes(2);
    });

    it('新组件与内容相同的新插件数组直接生效，无需再次编译', async () => {
        const counter = compileCounter();
        const options = { a: 1 };
        const withOptions = () => undefined;
        const { rerender } = render(<MarkdownRender raw="same" rehypePlugins={[[withOptions, options]]} remarkPlugins={[counter]} />);
        await screen.findByText('same');
        rerender(<MarkdownRender className="next" components={{ p: ({ children }) => <p data-testid="own">{children}</p> }} raw="same" rehypePlugins={[[withOptions, options]]} remarkPlugins={[counter]} />);
        expect(screen.getByTestId('own')).toHaveTextContent('same');
        await settle();
        expect(counter).toHaveBeenCalledTimes(1);
    });

    it('format 变化时重新编译', async () => {
        const { rerender } = render(<MarkdownRender format="md" raw="sum {1 + 1}" />);
        await screen.findByText('sum {1 + 1}');
        rerender(<MarkdownRender format="mdx" raw="sum {1 + 1}" />);
        expect(await screen.findByText('sum 2')).toBeInTheDocument();
        rerender(<MarkdownRender format="md" raw="sum {1 + 1}" />);
        expect(await screen.findByText('sum {1 + 1}')).toBeInTheDocument();
    });

    it('remarkGfm 变化时重新编译', async () => {
        const raw = '| A | B |\n| - | - |\n| 1 | 2 |';
        const { container, rerender } = render(<MarkdownRender raw={raw} remarkGfm={false} />);
        await screen.findByText(/\| A \| B \|/);
        rerender(<MarkdownRender raw={raw} remarkGfm />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).not.toBeNull());
        rerender(<MarkdownRender raw={raw} remarkGfm={false} />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).toBeNull());
    });

    it('插件条目，或 [plugin, options] 条目中的项变化时重新编译', async () => {
        const first = compileCounter();
        const second = compileCounter();
        const { rerender } = render(<MarkdownRender raw="text" remarkPlugins={[first]} />);
        await screen.findByText('text');
        rerender(<MarkdownRender raw="text" remarkPlugins={[second]} />);
        await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

        // an options literal is a new object every render, so it compiles again; useMemo keeps it stable
        rerender(<MarkdownRender raw="text" remarkPlugins={[[second, { a: 1 }]]} />);
        await waitFor(() => expect(second).toHaveBeenCalledTimes(2));
        rerender(<MarkdownRender raw="text" remarkPlugins={[[second, { a: 1 }]]} />);
        await waitFor(() => expect(second).toHaveBeenCalledTimes(3));

        const rehype = compileCounter();
        rerender(<MarkdownRender raw="text" rehypePlugins={[rehype]} />);
        await waitFor(() => expect(rehype).toHaveBeenCalledTimes(1));
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('md 中把原始 HTML 交给 rehype 插件，并丢弃插件保留为 raw 的内容', async () => {
        // stands in for rehype-raw: turns the block of raw HTML into an element
        const rawToElement = () => (tree) => {
            tree.children = tree.children.map((node) => (node.type === 'raw' && node.value.includes('keep') ? { type: 'element', tagName: 'mark', properties: {}, children: [{ type: 'text', value: 'kept' }] } : node));
        };
        const { container } = render(<MarkdownRender format="md" raw={'<section>keep</section>\n\n<section>drop</section>\n\nafter'} rehypePlugins={[rawToElement]} />);
        await screen.findByText('after');
        expect(container.querySelector('mark')).toHaveTextContent('kept');
        expect(container.querySelector('section')).toBeNull();
        expect(container).not.toHaveTextContent('drop');
    });

    it('className、style 与 data-* 放在根节点上', async () => {
        const { container } = render(<MarkdownRender className="own" style={{ color: 'red' }} data-testid="root" raw="text" />);
        const root = container.firstChild;
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-markdownRender`, 'own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-testid', 'root');
        await screen.findByText('text');
    });

    it('从 semiGlobal overrideDefaultProps 读取 format', async () => {
        semiGlobal.config.overrideDefaultProps = { MarkdownRender: { format: 'md' } };
        try {
            render(
                <div>
                    <MarkdownRender raw="global {1 + 1}" />
                    <MarkdownRender format="mdx" raw="explicit {1 + 1}" />
                </div>
            );
            expect(await screen.findByText('global {1 + 1}')).toBeInTheDocument();
            expect(await screen.findByText('explicit 2')).toBeInTheDocument();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
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
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const { rerender } = render(<MarkdownRender format={badProps.format} raw="good" />);
            await screen.findByText('good');
            rerender(<MarkdownRender {...badProps} />);
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
            render(<MarkdownRender raw="bad <div" remarkPlugins={[counter]} />);
            await waitFor(() => expect(counter).toHaveBeenCalledTimes(1));
            await settle();
            expect(error).not.toHaveBeenCalled();
        } finally {
            process.env.NODE_ENV = env;
            error.mockRestore();
        }
    });

    it('StrictMode 下内容只渲染一次', async () => {
        render(
            <StrictMode>
                <MarkdownRender raw="strict" />
            </StrictMode>
        );
        await screen.findByText('strict');
        await settle();
        expect(screen.getAllByText('strict')).toHaveLength(1);
    });

    it('较早的编译最后完成时，保留较新的源码', async () => {
        let release;
        const gate = new Promise((resolve) => {
            release = resolve;
        });
        const holdOlder = () => async (tree) => {
            if (JSON.stringify(tree).includes('older')) {
                await gate;
            }
        };
        const { rerender } = render(<MarkdownRender raw="older" remarkPlugins={[holdOlder]} />);
        rerender(<MarkdownRender raw="newer" remarkPlugins={[holdOlder]} />);
        await screen.findByText('newer');
        release();
        await settle();
        expect(screen.queryByText('older')).toBeNull();
        expect(screen.getByText('newer')).toBeInTheDocument();
    });

    it('首次编译前渲染空根节点，不带有携带 components 属性的占位符', async () => {
        const { container } = render(<MarkdownRender raw="text" />);
        expect(container.firstChild).toBeEmptyDOMElement();
        await screen.findByText('text');
    });

    it('ref 放在根元素上', async () => {
        const ref = React.createRef<HTMLDivElement>();
        const { container } = render(<MarkdownRender ref={ref} raw="text" />);
        expect(ref.current).toBe(container.firstChild);
        await screen.findByText('text');
    });

    it('代码围栏的语言含连字符时按完整语言 id 高亮', async () => {
        CodeHighlight.register({ languages: [() => import('shiki/langs/objective-c.mjs')] });
        const { container } = render(<MarkdownRender format="md" raw={'```objective-c\nint x = 1;\n```'} />);
        await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
    });

    it('表格保留列对齐，超过 10 行也不分页', async () => {
        const rows = Array.from({ length: 12 }, (_, i) => `| r${i} | ${i} |`).join('\n');
        const container = await renderTable({ format: 'md', raw: `| A | B |\n| :-: | -: |\n${rows}` });

        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(12);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-page`)).toBeNull();
        const cells = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-tbody tr:first-child td`);
        expect(cells[0].style.textAlign).toBe('center');
        expect(cells[1].style.textAlign).toBe('right');
    });

    it('没有 thead 的 HTML 表格以 tbody 第一行作表头，正文从第二行开始', async () => {
        // stands in for rehype-raw, whose parse5 output has a tbody but no thead for a raw HTML table
        const dropThead = () => (tree) => {
            const walk = (node) => {
                if (node.type === 'element' && node.tagName === 'table') {
                    const rows = node.children.flatMap((section) => (section.type === 'element' ? section.children : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
                    node.children = [{ type: 'element', tagName: 'tbody', properties: {}, children: rows }];
                }
                node.children?.forEach(walk);
            };
            walk(tree);
        };
        const container = await renderTable({
            format: 'md',
            raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |',
            rehypePlugins: [dropThead],
        });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
        const rows = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);
        expect(Array.from(rows, (row) => row.textContent)).toEqual(['cd', 'ef']);
    });

    it('table 下直接的 tr 算作正文行，第一行作表头', async () => {
        const hoistRows = () => (tree) => {
            const walk = (node) => {
                if (node.type === 'element' && node.tagName === 'table') {
                    node.children = node.children.flatMap((section) => (section.type === 'element' ? section.children : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
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
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
        const rows = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);
        expect(Array.from(rows, (row) => row.textContent)).toEqual(['cd', 'ef']);
    });

    it('多个 tbody 与直接的 tr 按文档顺序都算作正文行', async () => {
        const splitBody = () => (tree) => {
            const walk = (node) => {
                if (node.type === 'element' && node.tagName === 'table') {
                    const [thead, tbody] = node.children.filter((section) => section.type === 'element');
                    const rows = tbody.children.filter((row) => row.type === 'element' && row.tagName === 'tr');
                    const section = (children) => ({ type: 'element', tagName: 'tbody', properties: {}, children });
                    node.children = [thead, section([rows[0]]), rows[1], section([rows[2]])];
                }
                node.children?.forEach(walk);
            };
            walk(tree);
        };
        const container = await renderTable({
            format: 'md',
            raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |\n| g | h |',
            rehypePlugins: [splitBody],
        });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('ab');
        const rows = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);
        expect(Array.from(rows, (row) => row.textContent)).toEqual(['cd', 'ef', 'gh']);
    });

    it('覆盖 td、th 后单元格内容与列仍保留', async () => {
        const container = await renderTable({
            format: 'md',
            raw: '| A | B |\n| - | - |\n| c | d |',
            components: {
                td: ({ children }) => <td data-testid="own-td">{children}</td>,
                th: ({ children }) => <th data-testid="own-th">{children}</th>,
            },
        });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('AB');
        const rows = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);
        expect(Array.from(rows, (row) => row.textContent)).toEqual(['cd']);
    });

    it('链接内的图片使段落渲染为 div，且图片不可预览', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const { container } = render(<MarkdownRender format="md" raw="[![cat](a.png)](https://x.test)" />);
            await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`)).not.toBeNull());
            const image = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image`);
            expect(image.closest('p')).toBeNull();
            expect(error.mock.calls.flat().join('\n')).not.toMatch(/validateDOMNesting|cannot be a descendant/);
            fireEvent.load(image.querySelector('img'));
            const link = container.querySelector('a');
            expect(link.querySelector('[role="button"], [tabindex="0"]')).toBeNull();
        } finally {
            error.mockRestore();
        }
    });

    it('图片的可见说明对辅助技术隐藏', async () => {
        const { container } = render(<MarkdownRender format="md" raw="![cat](a.png)" />);
        const alt = await waitFor(() => {
            const node = container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender-component-image-alt`);
            expect(node).not.toBeNull();
            return node;
        });
        expect(alt).toHaveAttribute('aria-hidden', 'true');
    });

    it('根元素被命名时为 role="group"，显式 role 不被覆盖', async () => {
        const { rerender } = render(<MarkdownRender aria-label="msg" raw="x" />);
        expect(screen.getByLabelText('msg')).toHaveAttribute('role', 'group');
        rerender(<MarkdownRender aria-labelledby="t" raw="x" />);
        expect(document.querySelector('[aria-labelledby="t"]')).toHaveAttribute('role', 'group');
        rerender(<MarkdownRender aria-label="msg" role="note" raw="x" />);
        expect(screen.getByLabelText('msg')).toHaveAttribute('role', 'note');
        rerender(<MarkdownRender raw="x" />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender`)).not.toHaveAttribute('role');
        await screen.findByText('x');
    });

    it('有语言的代码块不包在 pre 内，行内代码保留 code 元素', async () => {
        const { container } = render(<MarkdownRender format="md" raw={'```js\nx\n```\n\nsome `b` text'} />);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).not.toBeNull());
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`).parentElement.closest('pre')).toBeNull();
        expect(screen.getByText('b').tagName).toBe('CODE');
    });

    it('无语言的代码块保留 pre', async () => {
        const { container } = render(<MarkdownRender format="md" raw={'```\nplain\n```'} />);
        await screen.findByText('plain');
        expect(container.querySelector('pre > code')).not.toBeNull();
    });

    it('components 里值为 undefined 的键回退为内置组件，不当作元素类型', async () => {
        render(<MarkdownRender components={{ h1: undefined }} format="md" raw="# a" />);
        expect(await screen.findByRole('heading', { name: 'a' })).toHaveClass(`${BASE_CLASS_PREFIX}-typography`);
    });

    it('代码块的子节点是元素时不交给高亮，直接渲染 code', async () => {
        // stands in for a highlighter plugin that splits the code text into spans
        const wrapCodeText = () => (tree) => {
            const visit = (node) => {
                if (node.tagName === 'code' && node.properties?.className?.includes('language-js')) {
                    node.children = [{ type: 'element', tagName: 'span', properties: {}, children: node.children }];
                }
                node.children?.forEach(visit);
            };
            visit(tree);
        };
        const { container } = render(<MarkdownRender format="md" raw={'```js\nlet x\n```'} rehypePlugins={[wrapCodeText]} />);
        const code = await waitFor(() => {
            const found = container.querySelector('code.language-js');
            expect(found).not.toBeNull();
            return found;
        });
        expect(code).toHaveTextContent('let x');
        expect(code.querySelector('span')).not.toBeNull();
        expect(code.parentElement.tagName).toBe('PRE');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).toBeNull();
    });

    it.each(['md', 'mdx'] as const)('%s 下 raw 变化时保留未改动的 DOM 节点', async (format) => {
        const { rerender } = render(<MarkdownRender format={format} raw={'# A\n\nx'} />);
        const heading = await screen.findByRole('heading', { name: 'A' });
        rerender(<MarkdownRender format={format} raw={'# A\n\nxy'} />);
        await screen.findByText('xy');
        expect(screen.getByRole('heading', { name: 'A' })).toBe(heading);
    });
});
