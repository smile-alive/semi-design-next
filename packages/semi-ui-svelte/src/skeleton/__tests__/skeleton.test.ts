import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { SkeletonAvatar, SkeletonButton, SkeletonImage, SkeletonParagraph, SkeletonTitle } from '../index';
import KitsDemo from './kits-demo.svelte';
import SkeletonDemo from './skeleton-demo.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-skeleton`;

function setup(initial: { loading?: boolean; active?: boolean } = {}, attrs: Record<string, unknown> = {}) {
    const store = createStore(initial);
    const view = render(SkeletonDemo, { props: { store, ...attrs } });
    return { store, ...view };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = undefined;
});

describe('Skeleton', () => {
    it('显式传入 undefined 的 type 不覆盖骨架自带的类型', () => {
        const { container } = render(KitsDemo);
        const classes = Array.from(container.firstElementChild?.children ?? [], (el) => el.className);
        expect(classes.slice(0, 4)).toEqual([expect.stringContaining(`${prefixCls}-avatar`), `${prefixCls}-image`, `${prefixCls}-title`, `${prefixCls}-button`]);
    });

    it('type 属性替换骨架自带的类型', () => {
        const { container } = render(SkeletonTitle, { props: { type: 'custom' } });
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-custom`);
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-title`);
    });

    it('基础加载态', () => {
        const { store, container, queryByText } = setup({ loading: true });
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
        expect(queryByText('content')).toBeNull();

        store.loading = false;
        flushSync();
        expect(container.querySelector(`.${prefixCls}`)).toBeNull();
        expect(queryByText('content')).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-avatar`)).toBeNull();

        store.loading = true;
        flushSync();
        expect(queryByText('content')).toBeNull();
        expect(container.querySelector(`.${prefixCls}-avatar`)).not.toBeNull();
    });

    it('kits 渲染', () => {
        const kits = [
            [SkeletonAvatar, 'avatar'],
            [SkeletonImage, 'image'],
            [SkeletonTitle, 'title'],
            [SkeletonButton, 'button'],
            [SkeletonParagraph, 'paragraph'],
        ] as const;
        for (const [Kit, name] of kits) {
            const view = render(Kit as typeof SkeletonAvatar);
            expect(view.container.querySelector(`.${prefixCls}-${name}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('加载容器标记为 busy，并对辅助技术隐藏占位块', () => {
        const { store, container, getByText } = setup();
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('aria-busy', 'true');
        expect(root).not.toHaveAttribute('aria-hidden');
        for (const name of ['avatar', 'title', 'paragraph']) {
            expect(root.querySelector(`.${prefixCls}-${name}`)).toHaveAttribute('aria-hidden', 'true');
        }
        store.loading = false;
        flushSync();
        expect(getByText('content').closest('[aria-busy]')).toBeNull();
    });

    it('使用方传入的 aria-hidden 覆盖占位块的默认值，aria-busy 不能被关掉', () => {
        const { container } = setup({}, { 'aria-busy': 'false' });
        expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
        const view = render(KitsDemo);
        expect(view.container.querySelectorAll(`.${prefixCls}-title`)[1]).toHaveAttribute('aria-hidden', 'false');
    });

    it('默认处于加载态，占位在根节点中渲染，并带有 class、style 和元素属性', () => {
        const { container, queryByText } = setup({ active: true }, { id: 'sk', 'data-x': '1', class: 'wrap', style: 'width: 10px' });
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-active`, 'wrap');
        expect(root).toHaveStyle({ width: '10px' });
        expect(root).toHaveAttribute('x-semi-prop', 'placeholder');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root).toHaveAttribute('id', 'sk');
        expect(root?.querySelector(`.${prefixCls}-title`)).not.toBeNull();
        expect(queryByText('content')).toBeNull();
    });

    it('加载结束后丢弃 attrs', () => {
        const { container, getByText } = setup({ loading: false }, { id: 'sk', class: 'wrap', style: 'width: 10px' });
        expect(container.querySelector('#sk')).toBeNull();
        expect(container.querySelector('.wrap')).toBeNull();
        expect(getByText('content')).not.toHaveAttribute('style');
    });

    it('未设置时不激活动画', () => {
        const { container } = setup();
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-active`);
    });

    it('avatar 默认为 medium 圆形，并接收 size 和 shape', () => {
        const { container, unmount } = render(SkeletonAvatar);
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-avatar`, `${prefixCls}-avatar-medium`, `${prefixCls}-avatar-circle`);
        unmount();
        const view = render(SkeletonAvatar, { props: { shape: 'square', size: 'large' } });
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-avatar-large`, `${prefixCls}-avatar-square`);
        expect(view.container.firstElementChild).not.toHaveClass(`${prefixCls}-avatar-medium`);
    });

    it('type 改写后的 avatar 仍带 size 与 shape 类名', () => {
        const { container } = render(SkeletonAvatar, { props: { type: 'AVATAR', size: 'small' } });
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-AVATAR-small`, `${prefixCls}-AVATAR-circle`);
    });

    it('除 avatar 外的 kits 不添加 size 或 shape 类名，并透传 class、style 和元素属性', () => {
        for (const [Kit, name] of [
            [SkeletonImage, 'image'],
            [SkeletonTitle, 'title'],
            [SkeletonButton, 'button'],
        ] as const) {
            const view = render(Kit, { props: { class: 'kit', style: 'height: 5px', 'data-x': '1' } });
            const root = view.container.firstElementChild;
            expect(root?.tagName).toBe('DIV');
            expect(root).toHaveClass(`${prefixCls}-${name}`, 'kit');
            expect(root?.className).not.toMatch(/large|square|medium|circle/);
            expect(root).toHaveStyle({ height: '5px' });
            expect(root).toHaveAttribute('data-x', '1');
            view.unmount();
        }
    });

    it('paragraph 默认渲染四行，并接收 rows、class 和 style', () => {
        const view = render(SkeletonParagraph);
        const list = view.container.firstElementChild as HTMLElement;
        expect(list.tagName).toBe('UL');
        expect(list.querySelectorAll('li')).toHaveLength(4);
        const styled = render(SkeletonParagraph, { props: { rows: 2, class: 'para', style: 'width: 20px' } });
        expect(styled.container.firstElementChild?.querySelectorAll('li')).toHaveLength(2);
        expect(styled.container.firstElementChild).toHaveClass(`${prefixCls}-paragraph`, 'para');
        expect(styled.container.firstElementChild).toHaveStyle({ width: '20px' });
    });

    it('paragraph 的 rows 为小数、零、负数、NaN 时不抛错', () => {
        const rows = (value: number) => {
            const view = render(SkeletonParagraph, { props: { rows: value } });
            const count = view.container.querySelectorAll('li').length;
            view.unmount();
            return count;
        };
        expect([2.5, 0, -1, Number.NaN].map(rows)).toEqual([2, 0, 0, 0]);
    });

    it('paragraph 把元素属性透传到 ul', () => {
        const { container } = render(SkeletonParagraph, { props: { 'data-x': '1', 'aria-label': 'loading' } });
        expect(container.firstElementChild).toHaveAttribute('data-x', '1');
        expect(container.firstElementChild).toHaveAttribute('aria-label', 'loading');
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Skeleton: { loading: false, active: true } };
        const { container, queryByText } = render(SkeletonDemo, { props: { store: {} } });
        expect(queryByText('content')).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}`)).toBeNull();
        const loading = render(SkeletonDemo, { props: { store: { loading: true } } });
        expect(loading.container.firstElementChild).toHaveClass(`${prefixCls}-active`);
    });
});
