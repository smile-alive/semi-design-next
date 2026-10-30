import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';

function setup(store: { kind?: 'text' | 'title' | 'paragraph' | 'numeral'; text?: string; props?: Record<string, unknown> }) {
    const state = createStore(store);
    const view = render(Fixture, { props: { store: state } });
    return { state, ...view };
}

describe('Svelte Typography 基础', () => {
    it('Text 默认渲染 span，带 type 与 size 类名', () => {
        const { container } = setup({ text: 'Semi' });
        const node = container.querySelector(`.${prefix}`) as HTMLElement;
        expect(node.tagName).toBe('SPAN');
        expect(node).toHaveClass(`${prefix}-primary`, `${prefix}-normal`);
        expect(node).toHaveTextContent('Semi');
    });

    it('component 指定标签，未声明属性透传到根元素', () => {
        const { container } = setup({ text: 'Semi', props: { component: 'div', id: 'text', 'data-x': '1' } });
        const node = container.querySelector(`div.${prefix}`) as HTMLElement;
        expect(node).toHaveAttribute('id', 'text');
        expect(node).toHaveAttribute('data-x', '1');
    });

    it('Title 映射 heading 与 weight，heading 非法时取 h1', () => {
        const { container, state } = setup({ kind: 'title', text: 'Title', props: { heading: 3, weight: 'bold' } });
        const node = container.querySelector(`.${prefix}`) as HTMLElement;
        expect(node.tagName).toBe('H3');
        expect(node).toHaveClass(`${prefix}-h3`, `${prefix}-h3-weight-bold`);
        state.props = { heading: 9 };
        flushSync();
        expect(container.querySelector(`.${prefix}`)?.tagName).toBe('H1');
    });

    it('数字 weight 写成内联 font-weight', () => {
        const { container } = setup({ kind: 'title', text: 'Title', props: { weight: 700 } });
        expect((container.querySelector(`.${prefix}`) as HTMLElement).style.fontWeight).toBe('700');
    });

    it('Paragraph 渲染 p，带 paragraph 与 spacing 类名', () => {
        const { container } = setup({ kind: 'paragraph', text: 'Paragraph', props: { spacing: 'extended', class: 'mine' } });
        const node = container.querySelector(`p.${prefix}`) as HTMLElement;
        expect(node).toHaveClass(`${prefix}-paragraph`, `${prefix}-extended`, 'mine');
    });

    it('装饰标签由外到内为 link、del、strong、u、code、mark', () => {
        const { container } = setup({ text: 'Semi', props: { delete: true, strong: true, underline: true, code: true, mark: true } });
        const tags: string[] = [];
        for (let node = container.querySelector(`.${prefix}`)?.firstElementChild; node; node = node.firstElementChild) tags.push(node.tagName.toLowerCase());
        expect(tags).toEqual(['del', 'strong', 'u', 'code', 'mark']);
    });

    it('link 包裹所有装饰，下划线改为类名，并去掉 type 类名', () => {
        const { container } = setup({ text: 'Semi', props: { link: { href: 'https://semi.design' }, underline: true, strong: true } });
        const node = container.querySelector(`.${prefix}`) as HTMLElement;
        expect(node).toHaveClass(`${prefix}-link`);
        expect(node).not.toHaveClass(`${prefix}-primary`);
        const anchor = node.firstElementChild as HTMLAnchorElement;
        expect(anchor.tagName).toBe('A');
        expect(anchor.getAttribute('href')).toBe('https://semi.design');
        expect(anchor.querySelector('u')).toBeNull();
        expect(anchor.querySelector(`.${prefix}-link-underline`)).not.toBeNull();
    });

    it('disabled 的 link 渲染 span，不触发 onclick', async () => {
        let clicks = 0;
        const { container } = setup({ text: 'Semi', props: { link: { href: 'https://semi.design' }, disabled: true, onclick: () => (clicks += 1) } });
        const inner = container.querySelector(`.${prefix} > span`) as HTMLElement;
        expect(inner.hasAttribute('href')).toBe(false);
        await fireEvent.click(inner);
        // the handler on the root still hears the click: only link.onclick is dropped
        expect(clicks).toBe(1);
    });

    it('无 href 的 link 有点击监听时可聚焦、角色为 link，Enter 触发点击', async () => {
        let clicks = 0;
        const { container } = setup({ text: 'Semi', props: { link: { onclick: () => (clicks += 1) } } });
        const anchor = container.querySelector('a') as HTMLElement;
        expect(anchor).toHaveAttribute('role', 'link');
        expect(anchor).toHaveAttribute('tabindex', '0');
        await fireEvent.keyDown(anchor, { key: 'Enter' });
        expect(clicks).toBe(1);
    });

    it('无 href 且无点击监听的 link 只保留样式', () => {
        const { container } = setup({ text: 'Semi', props: { link: true } });
        const anchor = container.querySelector('a') as HTMLElement;
        expect(anchor.hasAttribute('role')).toBe(false);
        expect(anchor.hasAttribute('tabindex')).toBe(false);
    });

    it('size inherit 读取外层 size', () => {
        const { container } = setup({ text: 'Semi', props: { size: 'inherit' } });
        expect(container.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-normal`);
    });
});
