/** @jsxImportSource vue */
import { Comment, createTextVNode, h } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Divider from '../index';
import WithIcon from './fixtures/with-icon.vue';

const getDivider = (container: Element) => container.querySelector<HTMLElement>('.semi-divider');

describe('Divider', () => {
    it('自定义 class 与 style', () => {
        const view = render(Divider, { attrs: { class: 'test', style: 'color: red' } });
        const divider = getDivider(view.container);
        expect(divider).toHaveClass('test');
        expect(divider).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 标题', () => {
        const view = render(Divider, { slots: { default: () => 'divider title' } });
        expect(view.container.firstChild).toHaveTextContent(/^divider title$/);
    });

    it('align 对齐', () => {
        const aligns = [undefined, 'left', 'right'] as const;
        const [center, left, right] = aligns.map((align) => {
            const view = render(Divider, { props: { align }, slots: { default: () => 'title' } });
            return getDivider(view.container);
        });
        expect(center).toHaveClass('semi-divider-with-text-center');
        expect(left).toHaveClass('semi-divider-with-text-left');
        expect(right).toHaveClass('semi-divider-with-text-right');
    });

    it('layout 布局', () => {
        const view = render(() => (
            <>
                <Divider layout="vertical" />
                <Divider layout="vertical" />
            </>
        ));
        expect(view.container.querySelectorAll('.semi-divider-vertical')).toHaveLength(2);
    });

    it('dashed 虚线', () => {
        const view = render(Divider, { props: { dashed: true } });
        expect(getDivider(view.container)).toHaveClass('semi-divider-dashed');
    });

    it('纯文本插槽包进 inner-text，并带 x-semi-prop', () => {
        const view = render(Divider, { slots: { default: () => 'title' } });
        const inner = view.container.querySelector('.semi-divider_inner-text');
        expect(inner).toHaveTextContent('title');
        expect(inner).toHaveAttribute('x-semi-prop', 'children');
    });

    it('文本与插值混排、数字 0 同样包进 inner-text', () => {
        const mixed = render(Divider, {
            slots: { default: () => [createTextVNode('共 '), createTextVNode('3'), createTextVNode(' 项')] },
        });
        expect(mixed.container.querySelector('.semi-divider_inner-text')).toHaveTextContent('共 3 项');
        const zero = render(Divider, { slots: { default: () => createTextVNode('0') } });
        expect(zero.container.querySelector('.semi-divider_inner-text')).toHaveTextContent('0');
    });

    it('元素插槽不包 inner-text，但仍加 with-text 类', () => {
        const view = render(WithIcon);
        const divider = getDivider(view.container);
        expect(divider).toHaveClass('semi-divider-with-text');
        expect(divider?.querySelector('.semi-divider_inner-text')).toBeNull();
        expect(divider?.querySelector('svg')).not.toBeNull();
    });

    it('空插槽、全为假的 v-if 与空字符串都不加 with-text 类', () => {
        for (const slots of [{}, { default: () => [] }, { default: () => h(Comment) }, { default: () => createTextVNode('') }]) {
            const view = render(Divider, { slots });
            expect(getDivider(view.container)).not.toHaveClass('semi-divider-with-text');
            expect(view.container.querySelector('.semi-divider_inner-text')).toBeNull();
            view.unmount();
        }
    });

    it('无内容时是 separator，竖直时带 aria-orientation', () => {
        const horizontal = render(Divider);
        expect(getDivider(horizontal.container)).toHaveAttribute('role', 'separator');
        expect(getDivider(horizontal.container)).not.toHaveAttribute('aria-orientation');
        const vertical = render(Divider, { props: { layout: 'vertical' } });
        expect(getDivider(vertical.container)).toHaveAttribute('role', 'separator');
        expect(getDivider(vertical.container)).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('有文字内容时不加 role，因为 separator 的子节点会被当作装饰', () => {
        const view = render(Divider, { slots: { default: () => 'title' } });
        expect(getDivider(view.container)).not.toHaveAttribute('role');
    });

    it('layout 为 vertical 时丢弃插槽内容，且不加 with-text 类', () => {
        const view = render(Divider, { props: { layout: 'vertical' }, slots: { default: () => 'title' } });
        const divider = getDivider(view.container);
        expect(divider).not.toHaveTextContent('title');
        expect(divider).not.toHaveClass('semi-divider-with-text');
        expect(divider).toHaveAttribute('role', 'separator');
    });

    it('margin 数字补 px，字符串原样；水平为上下，竖直为左右', () => {
        const number = render(Divider, { props: { margin: 12 } });
        expect(getDivider(number.container)).toHaveStyle({ marginTop: '12px', marginBottom: '12px' });
        const text = render(Divider, { props: { margin: '1em' } });
        expect(getDivider(text.container)?.style.marginTop).toBe('1em');
        expect(getDivider(text.container)?.style.marginBottom).toBe('1em');
        const vertical = render(Divider, { props: { margin: 12, layout: 'vertical' } });
        expect(getDivider(vertical.container)).toHaveStyle({ marginLeft: '12px', marginRight: '12px' });
        expect(getDivider(vertical.container)?.style.marginTop).toBe('');
    });

    it('未传 margin 时 style 不含 margin', () => {
        const view = render(Divider);
        expect(getDivider(view.container)?.getAttribute('style')).toBeNull();
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Divider: { layout: 'vertical', dashed: true } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Divider, { global });
        expect(getDivider(view.container)).toHaveClass('semi-divider-vertical', 'semi-divider-dashed');
        const own = render(Divider, { global, props: { layout: 'horizontal', dashed: false } });
        const divider = own.container.querySelector('.semi-divider-horizontal');
        expect(divider).not.toHaveClass('semi-divider-dashed');
    });
});
