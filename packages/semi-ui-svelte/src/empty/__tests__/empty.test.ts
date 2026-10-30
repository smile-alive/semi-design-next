import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal } from '../../_utils/semi-global';
import type { EmptyProps } from '../interface';
import EmptyFixture from './empty-fixture.svelte';
import EmptyGlobal from './empty-global.svelte';

type Store = Parameters<typeof createStore<{ props: EmptyProps; titleSnippet?: boolean; description?: boolean; footer?: boolean; image?: boolean; darkImage?: boolean }>>[0];

function setup(store: Store = { props: {} }) {
    const state = createStore(store);
    const view = render(EmptyFixture, { props: { store: state } });
    return { store: state, view, root: () => view.container.querySelector<HTMLElement>('.semi-empty') as HTMLElement };
}

describe('Svelte Empty', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.removeAttribute('theme-mode');
    });

    it('image 与 darkModeImage 的对象形式只接受 { id }', () => {
        expectTypeOf<{ id: string }>().toExtend<NonNullable<EmptyProps['image']>>();
        expectTypeOf<{ url: string }>().not.toExtend<NonNullable<EmptyProps['image']>>();
        expectTypeOf<{ viewBox: string }>().not.toExtend<NonNullable<EmptyProps['darkModeImage']>>();
    });

    it('class 与 style 落在根元素', () => {
        const { root } = setup({ props: { class: 'test', style: 'color: red' } });
        expect(root()).toHaveClass('test');
        expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 与 description', () => {
        const { view } = setup({ props: { title: 'empty title' }, description: true });
        expect(view.container.querySelector('.semi-typography.semi-empty-title')).toHaveTextContent(/^empty title$/);
        expect(view.container.querySelector('.semi-empty .semi-empty-description')).toHaveTextContent(/^semi design$/);
    });

    it('title 字符串渲染标题，不落成根元素的原生 title', () => {
        const { view, root } = setup({ props: { title: 'plain title' } });
        expect(view.container.querySelector('.semi-empty-title')).toHaveTextContent(/^plain title$/);
        expect(root()).not.toHaveAttribute('title');
    });

    it('title 可以是 snippet', () => {
        const { view } = setup({ props: {}, titleSnippet: true });
        expect(view.container.querySelector('.semi-empty-title')).toHaveTextContent(/^rich$/);
        expect(view.container.querySelector('.semi-empty-title b')).not.toBeNull();
    });

    it('layout 布局，默认垂直', () => {
        const { store, root } = setup({ props: {} });
        expect(root()).toHaveClass('semi-empty-vertical');
        store.props.layout = 'horizontal';
        flushSync();
        expect(root()).toHaveClass('semi-empty-horizontal');
        expect(root()).not.toHaveClass('semi-empty-vertical');
    });

    it('image 的 snippet、URL 与 imageStyle', () => {
        const node = setup({ props: { imageStyle: 'width: 150px' }, image: true });
        const nodeImage = node.view.container.querySelector('.semi-empty-image');
        expect(nodeImage?.querySelector('[data-testid="light"]')).not.toBeNull();
        expect(nodeImage).toHaveStyle({ width: '150px' });
        node.view.unmount();

        const url = setup({ props: { imageStyle: 'width: 150px', image: 'abc' } });
        expect(url.view.container.querySelector('.semi-empty-image img')).toHaveAttribute('src', 'abc');
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Empty: { layout: 'horizontal' } };
        const view = render(EmptyGlobal, { props: { semi } });
        const [fromGlobal, explicit] = view.container.querySelectorAll('.semi-empty');
        expect(fromGlobal).toHaveClass('semi-empty-horizontal');
        expect(explicit).toHaveClass('semi-empty-vertical');
    });

    it('模块单例的全局默认值也生效', () => {
        semiGlobal.config.overrideDefaultProps = { Empty: { title: 'nothing' } };
        const { view } = setup();
        expect(view.container.querySelector('.semi-empty-title')).toHaveTextContent(/^nothing$/);
    });

    it('标题不带标题语义；有图片时使用 h4 样式，无图片时使用常规字重的 h6 样式', () => {
        const withImage = setup({ props: { title: 'with image' }, image: true });
        const title = withImage.view.container.querySelector('.semi-empty-title');
        expect(screen.queryByRole('heading')).toBeNull();
        expect(title?.tagName).toBe('DIV');
        expect(title).toHaveClass('semi-typography-h4');
        expect(title).toHaveAttribute('x-semi-prop', 'title');
        withImage.view.unmount();

        const noImage = setup({ props: { title: 'no image' } });
        const plain = noImage.view.container.querySelector('.semi-empty-title');
        expect(plain?.tagName).toBe('DIV');
        expect(plain).toHaveClass('semi-typography-h6');
        expect(plain).toHaveStyle({ fontWeight: '400' });
    });

    it('标记 snippet 区域，并省略未提供的区域', () => {
        const full = setup({ props: { title: 't' }, description: true, footer: true });
        expect(full.view.container.querySelector('.semi-empty-image')).toHaveAttribute('x-semi-prop', 'image,darkModeImage');
        expect(full.view.container.querySelector('.semi-empty-description')).toHaveAttribute('x-semi-prop', 'description');
        const footer = full.view.container.querySelector('.semi-empty-footer');
        expect(footer).toHaveAttribute('x-semi-prop', 'children');
        expect(footer).toContainElement(screen.getByRole('button', { name: 'action' }));
        full.view.unmount();

        const bare = setup();
        expect(bare.view.container.querySelector('.semi-empty-content')?.children).toHaveLength(0);
        expect(bare.view.container.querySelector('.semi-empty-image')?.children).toHaveLength(0);
    });

    it('空字符串的 title 不渲染标题', () => {
        const { view } = setup({ props: { title: '' } });
        expect(view.container.querySelector('.semi-empty-title')).toBeNull();
    });

    it('URL 图片视为装饰性图片', () => {
        const { view } = setup({ props: { image: 'a.png' }, description: true });
        expect(view.container.querySelector('img')).toHaveAttribute('alt', '');
    });

    it('空字符串的 image 视为没有图片', () => {
        const { view } = setup({ props: { image: '', title: 'title' } });
        expect(view.container.querySelector('img')).toBeNull();
        expect(view.container.querySelector('.semi-empty-title')).toHaveClass('semi-typography-h6');
    });

    it('{ id } 图片渲染为 SVG sprite 引用', () => {
        const { view } = setup({ props: { image: { id: 'sprite-empty' } } });
        const svg = view.container.querySelector('.semi-empty-image > svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg?.querySelector('use')).toHaveAttribute('href', '#sprite-empty');
    });

    it('data-* 与其他原生属性落在根元素', () => {
        const { root } = setup({ props: { id: 'empty-id', 'aria-label': 'no data', 'data-x': '1' } as EmptyProps });
        expect(root()).toHaveAttribute('id', 'empty-id');
        expect(root()).toHaveAttribute('aria-label', 'no data');
        expect(root()).toHaveAttribute('data-x', '1');
    });

    describe('深色模式图片', () => {
        it('body 处于深色模式时显示 darkModeImage，并跟随 theme-mode 变化', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const { view } = setup({ props: {}, image: true, darkImage: true });
            await waitFor(() => expect(screen.getByTestId('dark')).toBeInTheDocument());
            expect(screen.queryByTestId('light')).toBeNull();

            document.body.removeAttribute('theme-mode');
            await waitFor(() => expect(screen.getByTestId('light')).toBeInTheDocument());
            expect(screen.queryByTestId('dark')).toBeNull();

            document.body.setAttribute('theme-mode', 'dark');
            await waitFor(() => expect(screen.getByTestId('dark')).toBeInTheDocument());
            view.unmount();
        });

        it('未提供 darkModeImage 时深色模式下保留原图，也不观察 body', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const observe = vi.spyOn(MutationObserver.prototype, 'observe');
            setup({ props: {}, image: true });
            await Promise.resolve();
            expect(screen.getByTestId('light')).toBeInTheDocument();
            expect(observe).not.toHaveBeenCalled();
            observe.mockRestore();
        });

        it('darkModeImage 字符串在深色模式下切换 URL', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const { view } = setup({ props: { image: 'light.png', darkModeImage: 'dark.png' } });
            await waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute('src', 'dark.png'));
            document.body.removeAttribute('theme-mode');
            await waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute('src', 'light.png'));
        });

        it('深色模式下 darkModeImage snippet 优先于 image 字符串', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const { view } = setup({ props: { image: 'light.png' }, darkImage: true });
            await waitFor(() => expect(screen.getByTestId('dark')).toBeInTheDocument());
            expect(view.container.querySelector('img')).toBeNull();
        });

        it('挂载后才提供 darkModeImage 时跟随 theme-mode', async () => {
            const { store } = setup({ props: {}, image: true });
            store.darkImage = true;
            document.body.setAttribute('theme-mode', 'dark');
            await waitFor(() => expect(screen.getByTestId('dark')).toBeInTheDocument());
        });

        it('卸载后不再响应 theme-mode', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
            const { view } = setup({ props: {}, image: true, darkImage: true });
            await waitFor(() => expect(screen.getByTestId('dark')).toBeInTheDocument());
            disconnect.mockClear();
            view.unmount();
            expect(disconnect).toHaveBeenCalledTimes(1);
            disconnect.mockRestore();
        });
    });
});
