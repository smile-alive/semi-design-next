import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import CardGroup from '../card-group.svelte';
import Card from '../card.svelte';
import type { CardProps } from '../interface';
import CardFixture from './card-fixture.svelte';
import type { Parts } from './fixture-parts';

const prefixCls = 'semi-card';

function setup(props: CardProps = {}, parts: Parts = { body: true }) {
    const store = createStore({ props, parts });
    const view = render(CardFixture, { props: { store } });
    const root = () => view.container.firstElementChild as HTMLElement;
    const find = (selector: string) => view.container.querySelector<HTMLElement>(selector);
    return { store, view, root, find };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Card', () => {
    it('被命名时根元素为 group，使用方的 role 优先，未命名时没有 role', () => {
        const named = setup({ 'aria-label': 'profile' });
        expect(named.root()).toHaveAttribute('role', 'group');
        named.view.unmount();

        const own = setup({ 'aria-label': 'profile', role: 'region' });
        expect(own.root()).toHaveAttribute('role', 'region');
        own.view.unmount();

        const bare = setup();
        expect(bare.root()).not.toHaveAttribute('role');
    });

    it('默认带边框，bordered 与 shadows 输出对应类名，class 与其他属性落在根元素', () => {
        const { root, store } = setup({ class: 'mine', 'data-testid': 'card' } as CardProps);
        expect(root()).toHaveClass(prefixCls, 'mine', `${prefixCls}-bordered`);
        expect(root()).toHaveAttribute('data-testid', 'card');
        expect(root()).not.toHaveClass(`${prefixCls}-shadows`);

        store.props.bordered = false;
        store.props.shadows = 'hover';
        flushSync();
        expect(root()).not.toHaveClass(`${prefixCls}-bordered`);
        expect(root()).toHaveClass(`${prefixCls}-shadows`, `${prefixCls}-shadows-hover`);
    });

    it('字符串 title 渲染为 div 形式的 6 号标题，没有 title 与额外内容时不渲染头部', () => {
        const { find, store } = setup({ title: 'Card title' });
        const title = find('.semi-typography-h6') as HTMLElement;
        expect(title.tagName).toBe('DIV');
        expect(title).toHaveTextContent('Card title');
        expect(find(`.${prefixCls}-header`)).toHaveClass(`${prefixCls}-header-bordered`);

        store.props.title = '';
        flushSync();
        expect(find(`.${prefixCls}-header`)).toBeNull();
    });

    it('title 为 snippet 时原样渲染，不套标题', () => {
        const { find } = setup({}, { body: true, titleSnippet: true });
        expect(find(`.${prefixCls}-header-wrapper-title em`)).toHaveTextContent('node title');
        expect(find('.semi-typography-h6')).toBeNull();
    });

    it('headerExtraContent 单独出现时渲染头部，与 title 同在时标题带间距类', () => {
        const { find, store } = setup({}, { body: true, extra: true });
        expect(find(`.${prefixCls}-header-wrapper-extra`)).toHaveTextContent('more');
        expect(find(`.${prefixCls}-header-wrapper-title`)).toBeNull();

        store.props.title = 'Card title';
        flushSync();
        expect(find(`.${prefixCls}-header-wrapper-title`)).toHaveClass(`${prefixCls}-header-wrapper-spacing`);
    });

    it('header snippet 替换 title 与 headerExtraContent', () => {
        const { find } = setup({ title: 'Card title' }, { body: true, header: true, extra: true });
        expect(find(`.${prefixCls}-header h3`)).toHaveTextContent('custom header');
        expect(find(`.${prefixCls}-header-wrapper`)).toBeNull();
    });

    it('headerLine、footerLine 控制分隔线类名，headerStyle、bodyStyle、footerStyle 落在各自容器', () => {
        const { find } = setup({ headerLine: false, footerLine: true, title: 'T', headerStyle: 'color: red', bodyStyle: 'padding: 3px', footerStyle: 'color: blue' }, { body: true, footer: true });
        expect(find(`.${prefixCls}-header`)).not.toHaveClass(`${prefixCls}-header-bordered`);
        expect(find(`.${prefixCls}-footer`)).toHaveClass(`${prefixCls}-footer-bordered`);
        expect(find(`.${prefixCls}-header`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(find(`.${prefixCls}-body`)).toHaveStyle({ padding: '3px' });
        expect(find(`.${prefixCls}-footer`)).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('cover 与 footer 只在提供时渲染', () => {
        const { find } = setup({}, { body: true, cover: true, footer: true });
        expect(find(`.${prefixCls}-cover img`)).toBeInTheDocument();
        expect(find(`.${prefixCls}-footer`)).toHaveTextContent('foot');

        const bare = setup();
        expect(bare.find(`.${prefixCls}-cover`)).toBeNull();
        expect(bare.find(`.${prefixCls}-footer`)).toBeNull();
    });

    it('actions 每个 snippet 渲染为一项，按下标标记 x-semi-prop', () => {
        const { find } = setup({}, { body: true, actions: 2 });
        const items = [...document.querySelectorAll(`.${prefixCls}-body-actions-item`)];
        expect(items.map((item) => item.textContent)).toEqual(['action 0', 'action 1']);
        expect(items.map((item) => item.getAttribute('x-semi-prop'))).toEqual(['actions.0', 'actions.1']);
        expect(find(`.${prefixCls}-body-actions`)).toBeInTheDocument();
    });

    it('loading 时正文换成骨架屏并标记 aria-busy，结束后显示正文', () => {
        const { root, find, store } = setup({ loading: true });
        expect(root()).toHaveAttribute('aria-busy', 'true');
        expect(find('.semi-skeleton')).toBeInTheDocument();
        expect(screen.queryByText('body')).toBeNull();

        store.props.loading = false;
        flushSync();
        expect(root()).toHaveAttribute('aria-busy', 'false');
        expect(find('.semi-skeleton')).toBeNull();
        expect(screen.getByText('body')).toBeInTheDocument();
    });

    it('没有 children 时 loading 不显示骨架屏', () => {
        const view = render(Card, { props: { loading: true } });
        expect(view.container.querySelector('.semi-skeleton')).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，传入的 prop 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Card: { bordered: false, headerLine: false, shadows: 'always' } };
        const global = setup({ title: 'T' });
        expect(global.root()).not.toHaveClass(`${prefixCls}-bordered`);
        expect(global.root()).toHaveClass(`${prefixCls}-shadows-always`);
        expect(global.find(`.${prefixCls}-header`)).not.toHaveClass(`${prefixCls}-header-bordered`);
        global.view.unmount();

        const own = setup({ bordered: true, shadows: 'hover' });
        expect(own.root()).toHaveClass(`${prefixCls}-bordered`, `${prefixCls}-shadows-hover`);
    });
});

describe('Svelte CardMeta', () => {
    it('渲染 title 与 description，缺失的部分不输出容器', () => {
        const { find } = setup({}, { meta: true });
        expect(find(`.${prefixCls}-meta-wrapper-title`)).toHaveTextContent('meta title');
        expect(find(`.${prefixCls}-meta-wrapper-description`)).toHaveTextContent('description');
        expect(find(`.${prefixCls}-meta-avatar`)).toBeNull();
    });
});

describe('Svelte CardGroup', () => {
    it('默认间距 16px 且换行，grid 类型无间距', () => {
        const normal = render(CardGroup);
        const group = normal.container.firstElementChild as HTMLElement;
        expect(group).toHaveClass(`${prefixCls}-group`, 'semi-space-wrap');
        expect(group.style.columnGap).toBe('16px');
        normal.unmount();

        const grid = render(CardGroup, { props: { type: 'grid', spacing: 20 } });
        const gridGroup = grid.container.firstElementChild as HTMLElement;
        expect(gridGroup).toHaveClass(`${prefixCls}-group-grid`);
        expect(gridGroup.style.columnGap).toBe('0px');
    });
});
