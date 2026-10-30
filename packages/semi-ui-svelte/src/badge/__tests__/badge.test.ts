import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Badge from '../badge.svelte';
import type { BadgeProps } from '../interface';
import BadgeFixture from './badge-fixture.svelte';
import BadgeRtl from './badge-rtl.svelte';

const getRoot = (container: Element) => container.querySelector<HTMLElement>('.semi-badge');
const getCount = (container: Element) => container.querySelector<HTMLElement>('[x-semi-prop="count"]');

function setup(props: BadgeProps = {}, withChild = true) {
    const store = createStore<BadgeProps>(props);
    const view = render(BadgeFixture, { props: { store, withChild } });
    return { store, container: view.container, unmount: view.unmount };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Badge', () => {
    it('class 落在根元素，countStyle 落在计数节点', () => {
        const { container } = setup({ class: 'test', count: 5, countStyle: 'color: red' });
        expect(getRoot(container)).toHaveClass('test');
        expect(container.querySelector('.test .semi-badge-count')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('默认内容渲染在根元素内', () => {
        const view = render(BadgeFixture, { props: { store: {} } });
        expect(getRoot(view.container)).toContainElement(screen.getByText('Semi'));
    });

    it('count 为数字或字符串', () => {
        const { store, container } = setup({ count: 5 });
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        expect(container.querySelector('.semi-badge-dot')).toBeNull();
        store.count = 'semi';
        flushSync();
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^semi$/);
    });

    it('dot 显示圆点而不是计数，且计数文字为空', () => {
        const { container } = setup({ dot: true, count: 5 });
        const dot = container.querySelector('.semi-badge-dot');
        expect(dot).toBeEmptyDOMElement();
        expect(dot).not.toHaveClass('semi-badge-count');
    });

    it('overflowCount 截断超出的数字，0 视为未设置，字符串不截断', () => {
        const { store, container } = setup({ count: 99, overflowCount: 5 });
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5\+$/);
        store.count = 5;
        flushSync();
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        store.count = 6;
        store.overflowCount = 0;
        flushSync();
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^6$/);
        store.count = '99';
        store.overflowCount = 10;
        flushSync();
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^99$/);
    });

    it('type 与 theme 各自产生类名，默认 primary 与 solid', () => {
        const { store, container } = setup({ count: 1 });
        expect(getCount(container)).toHaveClass('semi-badge-primary', 'semi-badge-solid');
        for (const type of ['secondary', 'tertiary', 'warning', 'danger'] as const) {
            store.type = type;
            flushSync();
            expect(getCount(container)).toHaveClass(`semi-badge-${type}`);
        }
        for (const theme of ['light', 'inverted'] as const) {
            store.theme = theme;
            flushSync();
            expect(getCount(container)).toHaveClass(`semi-badge-${theme}`);
        }
    });

    it.each([
        [{ position: 'leftTop' }, 'semi-badge-leftTop'],
        [{ position: 'leftBottom' }, 'semi-badge-leftBottom'],
        [{}, 'semi-badge-rightTop'],
        [{ position: 'rightBottom' }, 'semi-badge-rightBottom'],
    ] satisfies [BadgeProps, string][])('position %j 决定位置类名，默认 rightTop', (props, className) => {
        const { container } = setup({ count: 1, ...props });
        expect(getCount(container)).toHaveClass(className);
    });

    it('RTL 下默认位置为 leftTop，方向切换后跟随', () => {
        const store = createStore<{ direction: 'ltr' | 'rtl' }>({ direction: 'rtl' });
        const { container } = render(BadgeRtl, { props: { store } });
        expect(container.querySelector('.semi-badge-leftTop')).not.toBeNull();
        store.direction = 'ltr';
        flushSync();
        expect(container.querySelector('.semi-badge-leftTop')).toBeNull();
        expect(container.querySelector('.semi-badge-rightTop')).not.toBeNull();
    });

    it('计数节点的 class、x-semi-prop 以及默认 type 与 theme', () => {
        const { container } = setup({ count: 5, countClassName: 'cc' });
        const count = getCount(container);
        expect(count).toHaveClass('cc', 'semi-badge-primary', 'semi-badge-solid', 'semi-badge-count');
        expect(count).not.toHaveClass('semi-badge-block');
        expect(getRoot(container)?.lastElementChild).toBe(count);
    });

    it('style 落在根元素，计数节点只吃 countStyle', () => {
        const { container } = setup({ style: 'color: red', count: 5, countStyle: 'color: blue' });
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getCount(container)).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('没有默认内容时为块级元素，不带位置类名', () => {
        const { container } = setup({ count: 5, position: 'leftTop' }, false);
        const count = getCount(container);
        expect(count).toHaveClass('semi-badge-block');
        expect(count).not.toHaveClass('semi-badge-leftTop');
    });

    it('count 为 snippet 时去掉 type、theme 与 count 类名，并加 custom', () => {
        const view = render(BadgeFixture, { props: { custom: true } });
        const count = getCount(view.container);
        expect(count).toHaveClass('semi-badge-custom');
        expect(count).not.toHaveClass('semi-badge-danger');
        expect(count).not.toHaveClass('semi-badge-light');
        expect(count).not.toHaveClass('semi-badge-count');
        expect(count).toContainElement(screen.getByTestId('icon'));
    });

    it('count 为 0 时显示，null 与 undefined 不显示', () => {
        const { store, container } = setup({ count: 0 });
        expect(getCount(container)).toHaveClass('semi-badge-count');
        expect(getCount(container)).toHaveTextContent(/^0$/);
        store.count = null;
        flushSync();
        expect(getCount(container)).not.toHaveClass('semi-badge-count');
        expect(getCount(container)?.textContent).toBe('');
        store.count = undefined;
        flushSync();
        expect(getCount(container)).not.toHaveClass('semi-badge-count');
        expect(getCount(container)?.textContent).toBe('');
    });

    it('其他属性与原生事件落到根元素', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const onmouseenter = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ 'data-testid': 'badge', id: 'b', count: 5, onclick, onmouseenter });
        const root = getRoot(container) as HTMLElement;
        expect(root).toBe(screen.getByTestId('badge'));
        expect(root).toHaveAttribute('id', 'b');
        await fireEvent.click(root);
        await fireEvent.mouseEnter(root);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onmouseenter).toHaveBeenCalledTimes(1);
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config = { overrideDefaultProps: { Badge: { type: 'danger', dot: true } } };
        const view = render(Badge, { props: { count: 5 } });
        expect(getCount(view.container)).toHaveClass('semi-badge-danger', 'semi-badge-dot');
        view.unmount();
        const explicit = render(Badge, { props: { count: 5, type: 'primary', dot: false } });
        expect(getCount(explicit.container)).toHaveClass('semi-badge-primary', 'semi-badge-count');
        expect(getCount(explicit.container)).toHaveTextContent(/^5$/);
    });
});
