import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { SpaceProps } from '../interface';
import SpaceFixture from './space-fixture.svelte';

const prefixCls = 'semi-space';

function setup(props: SpaceProps = {}, count = 5) {
    const store = createStore({ props, count });
    const view = render(SpaceFixture, { props: { store } });
    const space = () => view.container.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
    return { store, view, space };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Space', () => {
    it('预设间距输出类名', () => {
        const cases: [SpaceProps['spacing'], string, string][] = [
            [undefined, 'semi-space-tight-horizontal', 'semi-space-tight-vertical'],
            ['loose', 'semi-space-loose-horizontal', 'semi-space-loose-vertical'],
            ['medium', 'semi-space-medium-horizontal', 'semi-space-medium-vertical'],
            [['tight', 'loose'], 'semi-space-tight-horizontal', 'semi-space-loose-vertical'],
        ];
        for (const [spacing, horizontalCls, verticalCls] of cases) {
            const { space, view } = setup({ spacing });
            expect(space()).toHaveClass(horizontalCls, verticalCls);
            view.unmount();
        }
    });

    it('数字间距输出 px 的 gap', () => {
        const single = setup({ spacing: 20 });
        expect(single.space()).toHaveStyle({ columnGap: '20px', rowGap: '20px' });
        single.view.unmount();
        const pair = setup({ spacing: [10, 20] });
        expect(pair.space()).toHaveStyle({ columnGap: '10px', rowGap: '20px' });
    });

    it('直接渲染子节点，不包裹', () => {
        const { space } = setup({}, 6);
        expect(space().children).toHaveLength(6);
    });

    it('默认为水平、居中、不换行的 space', () => {
        const { space } = setup();
        expect(space()).toHaveClass(`${prefixCls}-horizontal`, `${prefixCls}-align-center`);
        expect(space()).not.toHaveClass(`${prefixCls}-vertical`);
        expect(space()).not.toHaveClass(`${prefixCls}-wrap`);
        expect(space()).toHaveAttribute('x-semi-prop', 'children');
        expect(space()).toHaveTextContent('content');
    });

    it('align 和 vertical 设置对应类名', () => {
        for (const align of ['start', 'center', 'end', 'baseline'] as const) {
            const { space, view } = setup({ align, vertical: true });
            expect(space()).toHaveClass(`${prefixCls}-align-${align}`, `${prefixCls}-vertical`);
            expect(space()).not.toHaveClass(`${prefixCls}-horizontal`);
            view.unmount();
        }
    });

    it('wrap 仅对水平 space 生效', () => {
        const { store, space } = setup({ wrap: true });
        expect(space()).toHaveClass(`${prefixCls}-wrap`);
        store.props.vertical = true;
        flushSync();
        expect(space()).not.toHaveClass(`${prefixCls}-wrap`);
    });

    it('混合间距数组在一个轴上使用类名，另一个轴上使用 gap', () => {
        const { store, space } = setup({ spacing: ['loose', 12] });
        expect(space()).toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space()).not.toHaveClass(`${prefixCls}-tight-vertical`);
        expect(space()).toHaveStyle({ rowGap: '12px' });
        store.props.spacing = [8, 'medium'];
        flushSync();
        expect(space()).toHaveClass(`${prefixCls}-medium-vertical`);
        expect(space()).not.toHaveClass(`${prefixCls}-tight-horizontal`);
        expect(space()).toHaveStyle({ columnGap: '8px' });
    });

    it('class 和 style 与生成的类名和 gap 合并，用户 gap 优先于数字 spacing', () => {
        const merged = setup({ class: 'custom', style: 'color: red', spacing: 6 });
        expect(merged.space()).toHaveClass(prefixCls, 'custom');
        expect(merged.space()).toHaveStyle({ color: 'rgb(255, 0, 0)', columnGap: '6px', rowGap: '6px' });
        merged.view.unmount();
        const own = setup({ style: 'column-gap: 4px', spacing: 20 });
        expect(own.space()).toHaveStyle({ columnGap: '4px', rowGap: '20px' });
    });

    it('spacing 由字符串改为数字后，类名移除、gap 出现', () => {
        const { store, space } = setup({ spacing: 'loose' });
        expect(space()).toHaveClass(`${prefixCls}-loose-horizontal`);
        store.props.spacing = 10;
        flushSync();
        expect(space()).not.toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space()).toHaveStyle({ columnGap: '10px', rowGap: '10px' });
    });

    it('没有子内容时仍输出根元素', () => {
        const { space } = setup({}, 0);
        expect(space().children).toHaveLength(0);
    });

    it('未声明属性与监听器透传到根元素', async () => {
        const onclick = vi.fn<(e: MouseEvent) => void>();
        const { space } = setup({ id: 'space', 'aria-label': 'toolbar', 'data-testid': 'space', onclick } as SpaceProps);
        expect(space()).toHaveAttribute('id', 'space');
        expect(space()).toHaveAttribute('aria-label', 'toolbar');
        expect(space()).toHaveAttribute('data-testid', 'space');
        await fireEvent.click(space());
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Space: { vertical: true, spacing: 'loose' } };
        const { space } = setup({ spacing: 'medium' });
        expect(space()).toHaveClass(`${prefixCls}-vertical`, `${prefixCls}-medium-horizontal`);
        expect(space()).not.toHaveClass(`${prefixCls}-loose-horizontal`);
    });
});
