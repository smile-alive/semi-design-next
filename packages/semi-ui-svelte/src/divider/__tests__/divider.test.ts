import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { DividerProps } from '../interface';
import DividerFixture from './divider-fixture.svelte';

function setup(props: DividerProps = {}, content?: 'text' | 'element') {
    const store = createStore({ props, content });
    const view = render(DividerFixture, { props: { store } });
    const divider = () => view.container.querySelector<HTMLElement>('.semi-divider') as HTMLElement;
    return { store, view, divider };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Divider', () => {
    it('自定义 class 与 style', () => {
        const { divider } = setup({ class: 'test', style: 'color: red' });
        expect(divider()).toHaveClass('test');
        expect(divider()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 标题', () => {
        const { view } = setup({}, 'text');
        expect(view.container.firstElementChild).toHaveTextContent(/^title$/);
    });

    it('align 对齐', () => {
        const [center, left, right] = [undefined, 'left', 'right'].map((align) => {
            const { divider } = setup({ align: align as DividerProps['align'] }, 'text');
            return divider();
        });
        expect(center).toHaveClass('semi-divider-with-text-center');
        expect(left).toHaveClass('semi-divider-with-text-left');
        expect(right).toHaveClass('semi-divider-with-text-right');
    });

    it('layout 与 dashed', () => {
        const vertical = setup({ layout: 'vertical', dashed: true });
        expect(vertical.divider()).toHaveClass('semi-divider-vertical', 'semi-divider-dashed');
        const horizontal = setup();
        expect(horizontal.divider()).toHaveClass('semi-divider-horizontal');
        expect(horizontal.divider()).not.toHaveClass('semi-divider-dashed');
    });

    it('文本内容包进 inner-text，并带 x-semi-prop', () => {
        const { view } = setup({}, 'text');
        const inner = view.container.querySelector('.semi-divider_inner-text');
        expect(inner).toHaveTextContent('title');
        expect(inner).toHaveAttribute('x-semi-prop', 'children');
    });

    it('有内容时加 with-text 类，元素内容同样渲染', () => {
        const { divider } = setup({}, 'element');
        expect(divider()).toHaveClass('semi-divider-with-text');
        expect(divider().querySelector('svg')).not.toBeNull();
    });

    it('没有内容时不加 with-text 类', () => {
        const { divider, view } = setup();
        expect(divider()).not.toHaveClass('semi-divider-with-text');
        expect(view.container.querySelector('.semi-divider_inner-text')).toBeNull();
    });

    it('无内容时是 separator，竖直时带 aria-orientation', () => {
        const horizontal = setup();
        expect(horizontal.divider()).toHaveAttribute('role', 'separator');
        expect(horizontal.divider()).not.toHaveAttribute('aria-orientation');
        const vertical = setup({ layout: 'vertical' });
        expect(vertical.divider()).toHaveAttribute('role', 'separator');
        expect(vertical.divider()).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('有文字内容时不加 role；显式 role 可覆盖', () => {
        expect(setup({}, 'text').divider()).not.toHaveAttribute('role');
        expect(setup({ role: 'presentation' }).divider()).toHaveAttribute('role', 'presentation');
    });

    it('layout 为 vertical 时丢弃内容，且不加 with-text 类', () => {
        const { divider } = setup({ layout: 'vertical' }, 'text');
        expect(divider()).not.toHaveTextContent('title');
        expect(divider()).not.toHaveClass('semi-divider-with-text');
        expect(divider()).toHaveAttribute('role', 'separator');
    });

    it('margin 数字补 px，字符串原样；水平为上下，竖直为左右；用户 style 优先', () => {
        expect(setup({ margin: 12 }).divider()).toHaveStyle({ marginTop: '12px', marginBottom: '12px' });
        const text = setup({ margin: '1em' }).divider();
        expect(text.style.marginTop).toBe('1em');
        expect(text.style.marginBottom).toBe('1em');
        const vertical = setup({ margin: 12, layout: 'vertical' }).divider();
        expect(vertical).toHaveStyle({ marginLeft: '12px', marginRight: '12px' });
        expect(vertical.style.marginTop).toBe('');
        expect(setup({ margin: 12, style: 'margin-top: 3px' }).divider().style.marginTop).toBe('3px');
    });

    it('未传 margin 时 style 不含 margin', () => {
        expect(setup().divider().getAttribute('style')).toBeNull();
    });

    it('layout 变化后类名响应式更新', () => {
        const { store, divider } = setup();
        store.props.layout = 'vertical';
        flushSync();
        expect(divider()).toHaveClass('semi-divider-vertical');
        expect(divider()).not.toHaveClass('semi-divider-horizontal');
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Divider: { layout: 'vertical', dashed: true } };
        expect(setup().divider()).toHaveClass('semi-divider-vertical', 'semi-divider-dashed');
        const own = setup({ layout: 'horizontal', dashed: false });
        expect(own.divider()).toHaveClass('semi-divider-horizontal');
        expect(own.divider()).not.toHaveClass('semi-divider-dashed');
    });
});
