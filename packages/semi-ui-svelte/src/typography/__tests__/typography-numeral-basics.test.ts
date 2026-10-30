import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TypographyCopyableConfig, TypographyNumeralProps, TypographyTitleProps } from '../index';
import type { TypographyBaseProps } from '../internal';
import Extras from './extras-fixture.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';

type Store = { kind?: 'text' | 'title' | 'paragraph' | 'numeral' | 'typography'; text?: string; props?: Record<string, unknown> };

function setup(store: Store) {
    const state = createStore(store);
    const view = render(Fixture, { props: { store: state } });
    return { state, ...view };
}

const root = (container: Element) => container.querySelector(`.${prefix}`) as HTMLElement;

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config = {};
});

describe('Svelte Typography 基础行为', () => {
    it('自定义 component：Title、Text、Paragraph 都能换标签，类名不变', () => {
        const title = setup({ kind: 'title', text: 'Semi Design', props: { component: 'div', heading: 1 } });
        expect(title.container.querySelectorAll(`div.${prefix}-h1`)).toHaveLength(1);
        const text = setup({ text: 'Semi', props: { component: 'div', id: 'text' } });
        const nodes = text.container.querySelectorAll(`div.${prefix}`);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveAttribute('id', 'text');
        const paragraph = setup({ kind: 'paragraph', text: 'Semi Design', props: { component: 'div' } });
        expect(paragraph.container.querySelectorAll(`div.${prefix}-paragraph`)).toHaveLength(1);
    });

    it('link 用法：href、disabled 与 underline 的切换', () => {
        const { container, state } = setup({ text: '链接文本', props: { link: { href: 'https://semi.design/' } } });
        expect(container.querySelectorAll(`.${prefix}.${prefix}-link`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: '链接文本' })).toHaveAttribute('href', 'https://semi.design/');
        state.props = { disabled: true, link: { href: 'https://semi.design/' } };
        flushSync();
        expect(container.querySelectorAll(`.${prefix}.${prefix}-disabled`)).toHaveLength(1);
        state.props = { disabled: true, link: false, underline: true };
        flushSync();
        expect(container.querySelectorAll(`.${prefix} u`)).toHaveLength(1);
    });

    it('非 link 时的 type、size、spacing 与装饰标签', () => {
        const { container } = setup({ text: 'T', props: { type: 'danger', code: true, delete: true, mark: true, size: 'small', strong: true, underline: true } });
        expect(root(container).tagName).toBe('SPAN');
        expect(root(container)).toHaveClass(`${prefix}-danger`, `${prefix}-small`, `${prefix}-normal`);
        expect(root(container).querySelector(':scope > del > strong > u > code > mark')).toHaveTextContent(/^T$/);

        const paragraph = setup({ kind: 'paragraph', text: 'P', props: { spacing: 'extended' } });
        expect(root(paragraph.container).tagName).toBe('P');
        expect(root(paragraph.container)).toHaveClass(`${prefix}-paragraph`, `${prefix}-primary`, `${prefix}-normal`, `${prefix}-extended`);
        expect(root(paragraph.container).children).toHaveLength(0);
    });

    it('link 包裹所有装饰，target 透传到 a，disabled 后改为 span 并去掉 a', () => {
        const { container, state } = setup({ text: 'L', props: { type: 'danger', code: true, delete: true, link: { href: '#target', target: '_blank' }, mark: true, strong: true, underline: true } });
        const element = root(container);
        expect(element).toHaveClass(`${prefix}-link`);
        expect(element).not.toHaveClass(`${prefix}-danger`);
        const anchor = element.querySelector(':scope > a') as HTMLElement;
        expect(anchor).toHaveAttribute('href', '#target');
        expect(anchor).toHaveAttribute('target', '_blank');
        expect(anchor.querySelector(`:scope > del > strong > code > mark > span.${prefix}-link-text.${prefix}-link-underline`)).toHaveTextContent(/^L$/);
        expect(element.querySelector('u')).toBeNull();

        state.props = { type: 'primary', code: false, delete: false, mark: false, strong: false, underline: false, disabled: true, link: { href: '#target' } };
        flushSync();
        expect(element.querySelector('a')).toBeNull();
        expect(element.querySelector(`:scope > span > span.${prefix}-link-text`)).toHaveTextContent(/^L$/);
    });

    it('disabled 的 link 不触发 link.onclick，也不把 href 与 target 写到 span，link.class 保留', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ text: 'L', props: { disabled: true, link: { href: '#target', target: '_blank', onclick, class: 'extra' } } });
        const span = root(container).querySelector(':scope > span.extra');
        expect(span).toBeInTheDocument();
        expect(span).not.toHaveAttribute('href');
        expect(span).not.toHaveAttribute('target');
        await userEvent.click(screen.getByText('L'));
        expect(onclick).not.toHaveBeenCalled();
    });

    it('Title 映射 heading 与 weight：命名 weight 用类名，数字 weight 用内联样式，使用方的 font-weight 优先', () => {
        const { container, state } = setup({ kind: 'title', text: 'H', props: { heading: 3 } });
        expect(root(container).tagName).toBe('H3');
        expect(root(container)).toHaveClass(`${prefix}-h3`, `${prefix}-primary`);
        state.props = { heading: 7 };
        flushSync();
        expect(root(container).tagName).toBe('H1');
        expect(root(container)).toHaveClass(`${prefix}-h1`);
        state.props = { heading: 2, weight: 'semibold' };
        flushSync();
        expect(root(container)).toHaveClass(`${prefix}-h2-weight-semibold`);
        expect(root(container).style.fontWeight).toBe('');
        state.props = { style: 'color: red', heading: 2, weight: 600 };
        flushSync();
        expect(root(container).className).not.toMatch(/weight/);
        expect(root(container).style.fontWeight).toBe('600');
        expect(root(container).style.color).toBe('red');
        state.props = { style: 'font-weight: 300', heading: 2, weight: 600 };
        flushSync();
        expect(root(container).style.fontWeight).toBe('300');
    });

    it('icon snippet 中只有 Semi 图标得到 size', async () => {
        const { container } = render(Extras, { props: { mode: 'textIcon' } });
        await vi.waitFor(() => expect(container.querySelector('.semi-icon')).toHaveClass('semi-icon-small'));
        expect(container.querySelector('.plain')).not.toHaveAttribute('size');
        expect(container.querySelector(`.${prefix}-icon`)).toHaveAttribute('x-semi-prop', 'icon');
    });

    it('size inherit 取最近一层非 inherit 的值，中间层的 normal 优先于外层 small', () => {
        const { container } = render(Extras, { props: { mode: 'inheritMiddle' } });
        const inner = container.querySelector('.inner');
        expect(inner).toHaveClass(`${prefix}-normal`);
        expect(inner).not.toHaveClass(`${prefix}-small`);
    });

    it('将 data-* 及其他 DOM 属性透传到根元素', () => {
        const onclick = vi.fn<() => void>();
        const views = [
            setup({ text: 'a', props: { id: 't', 'data-x': 'text', onclick } }),
            setup({ kind: 'title', text: 'b', props: { 'data-x': 'title' } }),
            setup({ kind: 'paragraph', text: 'c', props: { 'data-x': 'paragraph' } }),
            setup({ kind: 'numeral', text: '1', props: { 'data-x': 'numeral' } }),
            setup({ kind: 'typography', text: 'd', props: { 'data-x': 'typography' } }),
        ];
        const nodes = views.map((view) => view.container.querySelector<HTMLElement>('[data-x]') as HTMLElement);
        expect(nodes.map((node) => [node.tagName, node.dataset.x])).toEqual([
            ['SPAN', 'text'],
            ['H1', 'title'],
            ['P', 'paragraph'],
            ['SPAN', 'numeral'],
            ['ARTICLE', 'typography'],
        ]);
        nodes.forEach((node) => expect(node).toHaveClass(prefix));
        expect(nodes[0]).toHaveAttribute('id', 't');
        const other = setup({ text: 'x', props: { code: true, copyable: false, delete: true, ellipsis: false, mark: true, strong: true, underline: true } });
        expect(root(other.container).getAttributeNames()).toEqual(['class']);
        const passthrough = setup({ text: 'x', props: { editable: 'yes' } });
        expect(root(passthrough.container)).toHaveAttribute('editable', 'yes');
    });

    it('无 href 的 link 有点击监听时可聚焦、角色为 link，Enter 触发点击；link 自己的 onclick 同样', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const first = setup({ text: 'go', props: { link: true, onclick } });
        const link = screen.getByRole('link', { name: 'go' });
        expect(link).toHaveAttribute('tabindex', '0');
        link.focus();
        await userEvent.keyboard('{Enter}');
        expect(onclick).toHaveBeenCalledTimes(1);
        first.unmount();

        const own = vi.fn<(event: MouseEvent) => void>();
        setup({ text: 'own', props: { link: { onclick: own } } });
        screen.getByRole('link', { name: 'own' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(own).toHaveBeenCalledTimes(1);
    });

    it('link 对象的 onkeydown 与内置的 Enter 激活同时生效', async () => {
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ text: 'x', props: { link: { onkeydown, onclick } } });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onkeydown).toHaveBeenCalledTimes(1);
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('link 对象的 onkeydown 调用 preventDefault 后不再触发内置的 Enter 激活', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ text: 'x', props: { link: { onkeydown: (event: KeyboardEvent) => event.preventDefault(), onclick } } });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onclick).not.toHaveBeenCalled();
    });

    it('裸 Typography 读取全局默认值的 component，Text 保留自己的标签，显式 component 优先', () => {
        semiGlobal.config = { overrideDefaultProps: { Typography: { component: 'section' } } };
        const bare = setup({ kind: 'typography', text: 'bare' });
        const text = setup({ text: 'text' });
        const explicit = setup({ kind: 'typography', text: 'b', props: { component: 'div' } });
        expect(root(bare.container).tagName).toBe('SECTION');
        expect(root(text.container).tagName).toBe('SPAN');
        expect(root(explicit.container).tagName).toBe('DIV');
    });
});

describe('Svelte Typography 类型', () => {
    it('Title 的 heading 只接受 1 到 6，Base 的 headingTag 只接受 h1 到 h6', () => {
        expectTypeOf<TypographyBaseProps['headingTag']>().toEqualTypeOf<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | undefined>();
        expectTypeOf<TypographyTitleProps['heading']>().toEqualTypeOf<1 | 2 | 3 | 4 | 5 | 6 | undefined>();
    });

    it('TypographyCopyableConfig 含可选的 duration、class 与 style', () => {
        expectTypeOf<TypographyCopyableConfig['duration']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<TypographyCopyableConfig['style']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<{ duration: number }>().toExtend<TypographyCopyableConfig>();
    });
});

describe('Svelte Typography Numeral', () => {
    const expectNumeral = (cases: [TypographyNumeralProps, string, string][]) =>
        cases.forEach(([props, input, output]) => {
            const view = setup({ kind: 'numeral', text: input, props: props as Record<string, unknown> });
            expect(root(view.container).tagName).toBe('SPAN');
            expect(root(view.container).textContent).toBe(output);
            view.unmount();
        });

    it('嵌套元素中的文本逐段格式化，parser 替换默认格式化', () => {
        const view = render(Extras, { props: { mode: 'numeralPrice' } });
        // the interpolated and the static text of one text node format as one string
        expect(view.container.querySelector('.price')?.textContent?.replace(/\s/g, '')).toBe('1.56,-1.00,0.56');
        expect(view.container.querySelector('.total')).toHaveTextContent(/^Total revenue: \$ 1\.99e\+3$/);
        view.unmount();
        const parsed = render(Extras, { props: { mode: 'numeralPrice', parser: (oldVal: string) => oldVal.replace(/[^\d.]/g, '') } });
        expect(parsed.container.querySelector('.total')).toHaveTextContent(/^1992\.15$/);
    });

    it('各文本节点分别格式化，{#each} 与嵌套元素同样处理，{#if} 为假的内容不出现', () => {
        const view = render(Extras, { props: { mode: 'numeralNested' } });
        const [nested, mixed] = view.container.querySelectorAll(`.${prefix}`);
        expect(nested).toHaveTextContent(/^1\.02\.0x3\.0$/);
        expect(mixed).toHaveTextContent(/^Stars 1\.0Fork 2\.0$/);
    });

    it('Numeral 保留精度，且 truncate 不写入 DOM', () => {
        const { container } = setup({ kind: 'numeral', text: '1.111', props: { precision: 2, truncate: 'ceil' } });
        expect(root(container)).toHaveTextContent(/^1\.12$/);
        expect(root(container)).not.toHaveAttribute('precision');
        expect(root(container)).not.toHaveAttribute('truncate');
    });

    it('截断不受二进制浮点误差影响', () => {
        // 0.58 * 100 is 57.99999999999999, 0.07 * 100 is 7.000000000000001 and 1.005 * 100 is 100.49999999999999
        expectNumeral([
            [{ rule: 'text', precision: 2, truncate: 'floor' }, '0.58', '0.58'],
            [{ rule: 'text', precision: 2, truncate: 'ceil' }, '0.07', '0.07'],
            [{ rule: 'text', precision: 2, truncate: 'round' }, '1.005', '1.01'],
            [{ rule: 'percentages', truncate: 'floor' }, '0.58', '58%'],
            [{ rule: 'percentages', truncate: 'ceil' }, '0.07', '7%'],
            [{ rule: 'text', precision: 2 }, '1e-7', '0.00'],
            [{ rule: 'text', precision: 1, truncate: 'ceil' }, '1.1e3', '1100.0'],
        ]);
    });

    it('各 rule 的格式化结果', () => {
        expectNumeral([
            [{ rule: 'text', precision: 2 }, 'a 1.234 b -2', 'a 1.23 b -2.00'],
            [{ rule: 'numbers', precision: 1, truncate: 'floor' }, 'x 1.99 y 2', '1.9,2.0'],
            [{ rule: 'bytes-decimal', precision: 1 }, '1500', '1.5 KB'],
            [{ rule: 'bytes-binary' }, '2048 and 1048576', '2 KiB and 1 MiB'],
            [{ rule: 'percentages', precision: 1 }, '0.256', '25.6%'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '12345', '1.3e+4'],
            [{ parser: (value) => `<${value}>` }, 'raw 1.5', '<raw 1.5>'],
        ]);
    });

    it('exponential 只舍入一次，进位后尾数规范化', () => {
        expectNumeral([
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '1.99999', '1.9e+0'],
            [{ rule: 'exponential', precision: 0, truncate: 'floor' }, '19999', '1e+4'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '9.99', '1.0e+1'],
            [{ rule: 'exponential', precision: 0, truncate: 'round' }, '1.4996', '1e+0'],
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '-9.99', '-1.0e+1'],
            [{ rule: 'exponential', precision: 1, truncate: 'round' }, '0.00123', '1.2e-3'],
        ]);
    });

    it('保留不贴着数字的 - 和 . 字符', () => {
        expectNumeral([
            [{ rule: 'text', precision: 0 }, 'Total: 3 items.', 'Total: 3 items.'],
            [{ rule: 'text', precision: 0 }, 'a - b', 'a - b'],
            [{ rule: 'percentages' }, '0.5.', '50%.'],
            [{ rule: 'numbers', precision: 0 }, '1. 2 - 3', '1,2,3'],
        ]);
    });

    it('children 为模板字符串时同样格式化', () => {
        const { container } = setup({ kind: 'numeral', text: `Key: ${1.234}`, props: { precision: 1 } });
        expect(root(container)).toHaveTextContent(/^Key: 1\.2$/);
    });
});
