import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { registerCodeHighlight } from '../../code-highlight';
import { grammar } from '../../code-highlight/__tests__/grammars';
import { MarkdownRender } from '../index';
import type { MarkdownRenderProps } from '../interface';
import DirectUse from './direct-use.svelte';
import ForwardTable from './forward-table.svelte';
import OwnCode from './own-code.svelte';
import OwnHeading from './own-heading.svelte';
import OwnTd from './own-td.svelte';
import OwnTh from './own-th.svelte';
import PreviewableImg from './previewable-img.svelte';
import { setup } from './setup';

const prefix = `${BASE_CLASS_PREFIX}-markdownRender`;
const typography = `${BASE_CLASS_PREFIX}-typography`;

describe('Svelte MarkdownRender 默认组件', () => {
    it('mdx 与 md 的段落都用 Semi 的段落组件', async () => {
        setup({ raw: 'mdx {1 + 1} sum' });
        setup({ format: 'md', raw: 'md sum' });
        expect(await screen.findByText('mdx 2 sum')).toHaveClass(`${prefix}-component-p`);
        expect(await screen.findByText('md sum')).toHaveClass(`${prefix}-component-p`);
    });

    it('components 里值为 undefined 的键回退为内置组件', async () => {
        setup({ components: { h1: undefined }, format: 'md', raw: '# a' });
        expect(await screen.findByRole('heading', { name: 'a' })).toHaveClass(typography);
    });

    it('用 Semi 组件渲染标题、链接与段落', async () => {
        const { container } = setup({ raw: '# Title\n\n[Semi](https://semi.design)' });
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveClass(typography, `${prefix}-component-header`);
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveAttribute('href', 'https://semi.design');
        expect(container.querySelector(`.${typography}-link`)).not.toBeNull();
    });

    it('六级标题各取自己的级别，且不把 node 写成属性', async () => {
        const { container } = setup({ format: 'md', raw: '# a\n\n## b\n\n### c\n\n#### d\n\n##### e\n\n###### f' });
        await screen.findByRole('heading', { level: 6, name: 'f' });
        expect(Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'), (heading) => heading.tagName)).toEqual(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
        expect(container.querySelector('[node]')).toBeNull();
    });

    it('链接的 href 与 title 只落在 a 元素上，外层 Typography 元素不带', async () => {
        const { container } = setup({ format: 'md', raw: '[x](https://a.b "t")' });
        const link = await screen.findByRole('link', { name: 'x' });
        expect(link).toHaveAttribute('href', 'https://a.b');
        expect(link).toHaveAttribute('title', 't');
        expect(container.querySelectorAll('[href]')).toHaveLength(1);
        expect(container.querySelectorAll('[title]')).toHaveLength(1);
    });

    it('内置组件直接使用时合并传入的 class 与内置类名，标题级别不变', () => {
        render(DirectUse);
        expect(screen.getByText('title')).toHaveClass('x', `${prefix}-component-header`);
        expect(screen.getByRole('heading', { level: 2, name: 'second' })).toHaveClass('z', `${prefix}-component-header`);
        expect(screen.getByText('body')).toHaveClass('y', `${prefix}-component-p`);
    });

    it('直接使用 code 组件：有 node 且有语言时高亮，没有语言时是行内 code', () => {
        const { container } = render(DirectUse);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-codeHighlight`)).toHaveTextContent('let a = 1;');
        expect(container.querySelector(`code.${prefix}-simple-code`)).toHaveTextContent('inline');
    });

    it('允许组件覆盖 Semi 的默认实现', async () => {
        setup({ components: { h1: OwnHeading }, raw: '# Title\n\nbody' });
        const heading = await screen.findByRole('heading', { level: 1, name: 'Title' });
        expect(heading).toHaveAttribute('data-testid');
        expect(heading).not.toHaveClass(typography);
        expect(screen.getByText('body')).toHaveClass(`${prefix}-component-p`);
    });

    it.each<'md' | 'mdx'>(['md', 'mdx'])('图片块不嵌套在 p 元素中（%s）', async (format) => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = setup({ format, raw: 'before ![cat](a.png "cat") after' });
        await waitFor(() => expect(container.querySelector(`.${prefix}-component-image`)).not.toBeNull());
        const image = container.querySelector(`.${prefix}-component-image`) as HTMLElement;
        expect(image.closest('p')).toBeNull();
        const paragraph = image.closest(`.${prefix}-component-p`);
        expect(paragraph).toHaveTextContent('before');
        expect(paragraph).toHaveClass(`${typography}-paragraph`);
        expect(warn).not.toHaveBeenCalled();
    });

    it('链接内的图片使段落渲染为 div，且不可预览', async () => {
        const { container } = setup({ format: 'md', raw: '[![cat](a.png)](#target)\n\n![dog](b.png)' });
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

    it('使用方显式传 preview 时，链接内的图片可预览', async () => {
        const { container } = setup({ components: { img: PreviewableImg }, format: 'md', raw: '[![a](s.png)](#t)' });
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-image`)).not.toBeNull());
        const image = container.querySelector(`.${BASE_CLASS_PREFIX}-image`) as HTMLElement;
        await fireEvent.load(image.querySelector('img') as HTMLImageElement);
        expect(image.closest('a')).not.toBeNull();
        expect(image).toHaveAttribute('role', 'button');
    });

    it('图片说明文字对读屏隐藏，图片名称来自 alt', async () => {
        const { container } = setup({ format: 'md', raw: '![cat](a.png)' });
        await waitFor(() => expect(container.querySelector(`.${prefix}-component-image-alt`)).not.toBeNull());
        const caption = container.querySelector(`.${prefix}-component-image-alt`);
        expect(caption).toHaveTextContent('cat');
        expect(caption).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getAllByRole('img', { name: 'cat' })).toHaveLength(1);
    });

    it('纯文本段落保持为 p 元素', async () => {
        setup({ raw: 'plain text' });
        expect((await screen.findByText('plain text')).tagName).toBe('P');
    });

    it.each(['md', 'mdx'] as const)('%s 下有语言的代码块外层没有 pre，无语言的保留 pre，行内代码是 code 元素', async (format) => {
        const { container } = setup({ format, raw: '```js\nlet a = 1;\n```\n\n```\nplain\n```\n\ninline `x` code' });
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
        const { container } = setup({ format: 'md', raw: '```js\nlet x\n```', rehypePlugins: [wrapCodeText] });
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

    it('代码围栏的语言含连字符时按完整语言 id 高亮', async () => {
        registerCodeHighlight({ languages: [grammar('objective-c')] });
        const { container } = setup({ format: 'md', raw: '```objective-c\nint x = 1;\n```' });
        await waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
    });

    it('自定义 code 组件从 node 取到代码源码，保留结尾换行', async () => {
        setup({ components: { code: OwnCode }, format: 'md', raw: '```js\nlet a = 1;\nlet b = 2;\n```\n\ninline `x`' });
        await waitFor(() => expect(screen.getAllByTestId('own-code')).toHaveLength(2));
        const [block, inline] = screen.getAllByTestId('own-code');
        expect(block).toHaveAttribute('data-source', 'let a = 1;\nlet b = 2;\n');
        expect(block).toHaveClass('language-js');
        expect(inline).toHaveAttribute('data-source', 'x');
    });

    it('自定义 code 组件的源码穿透 rehype 插件拆出的元素', async () => {
        type Node = { type?: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };
        const splitLines = () => (tree: Node) => {
            const visit = (node: Node) => {
                if (node.tagName === 'code') {
                    node.children = [
                        { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: 'let ' }] },
                        { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: 'x\n' }] },
                    ];
                }
                node.children?.forEach(visit);
            };
            visit(tree);
        };
        setup({ components: { code: OwnCode }, format: 'md', raw: '```js\nlet x\n```', rehypePlugins: [splitLines] });
        expect(await screen.findByTestId('own-code')).toHaveAttribute('data-source', 'let x\n');
    });

    it('把 Semi 组件暴露为 MarkdownRender.defaultComponents', () => {
        expect(Object.keys(MarkdownRender.defaultComponents).toSorted()).toEqual(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'p', 'pre', 'table'].toSorted());
    });

    it('类型：components 的值是组件，元素键也可以是自身的标签名', () => {
        type Components = NonNullable<MarkdownRenderProps['components']>;
        expectTypeOf({ h1: OwnHeading, code: OwnCode, p: MarkdownRender.defaultComponents.p }).toExtend<Components>();
        expectTypeOf<{ h1: 'h1' }>().toExtend<Components>();
        expectTypeOf<{ h1: number }>().not.toExtend<Components>();
        expectTypeOf<{ h1: 'h2' }>().not.toExtend<Components>();
        const custom: Components = {};
        expectTypeOf({ ...MarkdownRender.defaultComponents, ...custom }).toExtend<Components>();
    });

    describe('table', () => {
        const renderTable = async (props: MarkdownRenderProps) => {
            const { container } = setup(props);
            await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-container`)).not.toBeNull());
            return container;
        };
        const bodyRows = (container: Element) => container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);

        it('table 渲染', async () => {
            const container = await renderTable({ raw: '| Name | Brand | Count | Price |\n| - | :- | -: | :-: |\n| Book | Semi | 10 | ￥100 |\n| Pen | Semi Design | 20 | ￥200 |' });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('Name Brand Count Price');
            expect(bodyRows(container)).toHaveLength(2);
        });

        it('只有表头的 table', async () => {
            const container = await renderTable({ raw: '| Title | Name | Count |\n| - | :- | -: |' });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('Title Name Count');
            expect(bodyRows(container)).toHaveLength(0);
        });

        it('表头加粗的 table', async () => {
            const container = await renderTable({ raw: '| Name | **Brand** | **Price** |\n| - | :- | -: |\n| Book | Semi | ￥100 |' });
            const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`) as HTMLElement;
            expect(Array.from(thead.querySelectorAll('strong'), (node) => node.textContent)).toEqual(['Brand', 'Price']);
            expect(thead).toHaveTextContent('Name Brand Price');
            expect(bodyRows(container)).toHaveLength(1);
        });

        it('表头加粗且带组件的 table', async () => {
            const container = await renderTable({ format: 'mdx', raw: '| Name | <h1>Brand</h1> | **Price** |\n| - | :- | :-: |\n| Book | Semi | ￥100 |' });
            const thead = container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`) as HTMLElement;
            expect(thead.querySelector('h1')).toHaveTextContent(/^Brand$/);
            expect(thead.querySelector('strong')).toHaveTextContent(/^Price$/);
            expect(bodyRows(container)).toHaveLength(1);
        });

        it('表头含行内代码与链接时，th 的 title 取纯文本', async () => {
            const container = await renderTable({ raw: '| `id` | [x](https://a.test) |\n| - | - |\n| 1 | 2 |' });
            const titles = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-thead th`), (th) => th.getAttribute('title'));
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
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-page`)).toBeNull();
            const cells = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-tbody tr:first-child td`);
            expect(cells[0].style.textAlign).toBe('center');
            expect(cells[1].style.textAlign).toBe('right');
        });

        // stands in for rehype-raw, whose parse5 output has a tbody but no thead for a raw HTML table
        type HastNode = { type: string; tagName?: string; children?: HastNode[] };
        const rowsOf = (node: HastNode) => (node.children ?? []).flatMap((section) => (section.type === 'element' ? (section.children ?? []) : [])).filter((row) => row.type === 'element' && row.tagName === 'tr');
        const rewriteTable = (rewrite: (table: HastNode) => void) => () => (tree: HastNode) => {
            const walk = (node: HastNode) => {
                if (node.type === 'element' && node.tagName === 'table') rewrite(node);
                node.children?.forEach(walk);
            };
            walk(tree);
        };
        const dropThead = rewriteTable((table) => {
            table.children = [{ type: 'element', tagName: 'tbody', children: rowsOf(table) }];
        });
        const hoistRows = rewriteTable((table) => {
            table.children = rowsOf(table);
        });

        it.each([
            ['没有 thead 的 HTML 表格以 tbody 第一行作表头，正文从第二行开始', dropThead],
            ['table 下直接的 tr 算作正文行，第一行作表头', hoistRows],
        ])('%s', async (_, plugin) => {
            const container = await renderTable({ format: 'md', raw: '| a | b |\n| - | - |\n| c | d |\n| e | f |', rehypePlugins: [plugin] });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('a b');
            expect(Array.from(bodyRows(container), (row) => row.textContent?.replace(/\s+/g, ''))).toEqual(['cd', 'ef']);
        });

        it('覆盖 td、th 后单元格内容与列仍保留', async () => {
            const container = await renderTable({ format: 'md', raw: '| A | B |\n| - | - |\n| c | d |', components: { td: OwnTd, th: OwnTh } });
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-table-thead`)).toHaveTextContent('A B');
            expect(Array.from(bodyRows(container), (row) => row.textContent?.replace(/\s+/g, ''))).toEqual(['cd']);
        });

        it('table 组件的属性排在内置 pagination 之后，传入值优先', async () => {
            const container = await renderTable({
                format: 'md',
                raw: `| A |\n| - |\n${Array.from({ length: 12 }, (_, i) => `| r${i} |`).join('\n')}`,
                components: { table: ForwardTable },
            });
            expect(bodyRows(container)).toHaveLength(10);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-page`)).not.toBeNull();
        });

        it('表格内容变化后更新单元格', async () => {
            const { update } = setup({ format: 'md', raw: '| A |\n| - |\n| x |' });
            await screen.findByText('x');
            await update({ raw: '| A |\n| - |\n| y |\n| z |' });
            await screen.findByText('z');
            expect(screen.queryByText('x')).toBeNull();
            expect(screen.getByText('y')).toBeInTheDocument();
        });
    });
});
