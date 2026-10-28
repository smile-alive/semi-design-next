import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Space, { type SpaceProps } from '../index';
import Children from './fixtures/children.vue';
import InstanceRef from './fixtures/instance-ref.vue';
import SameKeys from './fixtures/same-keys.vue';
import StatefulSibling from './fixtures/stateful-sibling.vue';

const prefixCls = 'semi-space';

const renderSpace = (spacing: SpaceProps['spacing']) => {
    const view = render(Space, {
        props: { spacing },
        slots: { default: () => Array.from({ length: 5 }, () => 'content') },
    });
    return view;
};

const getSpace = (container: Element) => container.querySelector<HTMLElement>(`.${prefixCls}`);

describe('Space', () => {
    it('间距', () => {
        const classCases: [SpaceProps['spacing'], string, string][] = [
            [undefined, 'semi-space-tight-horizontal', 'semi-space-tight-vertical'],
            ['loose', 'semi-space-loose-horizontal', 'semi-space-loose-vertical'],
            ['medium', 'semi-space-medium-horizontal', 'semi-space-medium-vertical'],
            ['tight', 'semi-space-tight-horizontal', 'semi-space-tight-vertical'],
            [['tight', 'loose'], 'semi-space-tight-horizontal', 'semi-space-loose-vertical'],
        ];
        for (const [spacing, horizontalCls, verticalCls] of classCases) {
            const view = renderSpace(spacing);
            expect(getSpace(view.container)).toHaveClass(horizontalCls, verticalCls);
            view.unmount();
        }

        const styleCases: [SpaceProps['spacing'], string, string][] = [
            [20, '20px', '20px'],
            [[10, 20], '10px', '20px'],
        ];
        for (const [spacing, columnGap, rowGap] of styleCases) {
            const view = renderSpace(spacing);
            expect(getSpace(view.container)).toHaveStyle({ columnGap, rowGap });
            view.unmount();
        }
    });

    it('渲染子元素：v-if、v-for 与 template 不产生额外 DOM', () => {
        const view = render(Children);
        expect(getSpace(view.container)?.children).toHaveLength(6);
    });

    it('条件兄弟切换时，后面有状态的子组件不重新挂载', async () => {
        const view = render(StatefulSibling, { props: { show: true } });
        await view.rerender({ show: false });
        await view.rerender({ show: true });
        expect(view.emitted().childMounted).toHaveLength(1);
    });

    it('不同 v-for 中的同名 key 不冲突', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(SameKeys);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('默认为水平、居中、不换行的 space，并渲染默认插槽', () => {
        const view = render(Space, { slots: { default: () => 'content' } });
        const space = getSpace(view.container);
        expect(space).toHaveClass(`${prefixCls}-horizontal`, `${prefixCls}-align-center`);
        expect(space).not.toHaveClass(`${prefixCls}-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-wrap`);
        expect(space).toHaveAttribute('x-semi-prop', 'children');
        expect(space).toHaveTextContent('content');
    });

    it('align 和 vertical 设置对应类名', () => {
        for (const align of ['start', 'center', 'end', 'baseline'] as const) {
            const view = render(Space, { props: { align, vertical: true } });
            const space = getSpace(view.container);
            expect(space).toHaveClass(`${prefixCls}-align-${align}`, `${prefixCls}-vertical`);
            expect(space).not.toHaveClass(`${prefixCls}-horizontal`);
            view.unmount();
        }
    });

    it('wrap 仅对水平 space 生效', async () => {
        const view = render(Space, { props: { wrap: true } });
        expect(getSpace(view.container)).toHaveClass(`${prefixCls}-wrap`);
        await view.rerender({ vertical: true, wrap: true });
        expect(getSpace(view.container)).not.toHaveClass(`${prefixCls}-wrap`);
    });

    it('混合间距数组在一个轴上使用类名，另一个轴上使用 gap', async () => {
        const view = render(Space, { props: { spacing: ['loose', 12] } });
        let space = getSpace(view.container);
        expect(space).toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-loose-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-vertical`);
        expect(space).toHaveStyle({ rowGap: '12px' });
        await view.rerender({ spacing: [8, 'medium'] });
        space = getSpace(view.container);
        expect(space).toHaveClass(`${prefixCls}-medium-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-medium-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-horizontal`);
        expect(space).toHaveStyle({ columnGap: '8px' });
    });

    it('class 和 style 与生成的类名和 gap 合并', () => {
        const view = render(Space, { attrs: { class: 'custom', style: 'color: red' }, props: { spacing: 6 } });
        const space = getSpace(view.container);
        expect(space).toHaveClass(prefixCls, 'custom');
        expect(space).toHaveStyle({ color: 'rgb(255, 0, 0)', columnGap: '6px', rowGap: '6px' });
    });

    it('用户 style 的 gap 优先于数字 spacing', () => {
        const view = render(Space, { attrs: { style: { columnGap: '4px' } }, props: { spacing: 20 } });
        expect(getSpace(view.container)).toHaveStyle({ columnGap: '4px', rowGap: '20px' });
    });

    it('spacing 由字符串改为数字后，类名移除、gap 出现', async () => {
        const view = render(Space, { props: { spacing: 'loose' } });
        expect(getSpace(view.container)).toHaveClass(`${prefixCls}-loose-horizontal`);
        await view.rerender({ spacing: 10 });
        const space = getSpace(view.container);
        expect(space).not.toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space).toHaveStyle({ columnGap: '10px', rowGap: '10px' });
    });

    it('没有默认插槽时仍输出根元素', () => {
        const view = render(Space);
        expect(getSpace(view.container)?.children).toHaveLength(0);
    });

    it('data 属性透传到根元素', () => {
        const view = render(Space, { attrs: { 'data-testid': 'space', 'data-x': '1' } });
        expect(getSpace(view.container)).toHaveAttribute('data-x', '1');
        expect(getSpace(view.container)).toHaveAttribute('data-testid', 'space');
    });

    it('其他未声明属性与监听器透传到根元素', () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const view = render(Space, { attrs: { id: 'space', 'aria-label': 'toolbar', onClick } });
        const space = getSpace(view.container);
        expect(space).toHaveAttribute('id', 'space');
        expect(space).toHaveAttribute('aria-label', 'toolbar');
        space?.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('组件实例的 $el 指向根元素', () => {
        const view = render(InstanceRef);
        expect(view.emitted<[Element]>().el[0][0]).toBe(getSpace(view.container));
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Space: { vertical: true, spacing: 'loose' } };
        const view = render(Space, { global: { provide: { [semiGlobalKey]: semi } }, props: { spacing: 'medium' } });
        const space = getSpace(view.container);
        expect(space).toHaveClass(`${prefixCls}-vertical`, `${prefixCls}-medium-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-loose-horizontal`);
    });
});
