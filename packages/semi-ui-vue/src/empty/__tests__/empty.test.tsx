/** @jsxImportSource vue */
import { createSSRApp, createTextVNode, nextTick, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-vue';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Empty from '../index';
import type { EmptyProps } from '../interface';
import DarkToggle from './fixtures/dark-toggle.vue';

const getEmpty = (container: Element) => container.querySelector<HTMLElement>('.semi-empty');

describe('Empty', () => {
    it('image 与 darkModeImage 的对象形式只接受 { id }', () => {
        expectTypeOf<{ id: string }>().toExtend<EmptyProps['image']>();
        expectTypeOf<{ url: string }>().not.toExtend<EmptyProps['image']>();
        expectTypeOf<{ viewBox: string }>().not.toExtend<EmptyProps['darkModeImage']>();
    });

    it('class 与 style 落在根元素', () => {
        const view = render(Empty, { attrs: { class: 'test', style: 'color: red' } });
        const empty = getEmpty(view.container);
        expect(empty).toHaveClass('test');
        expect(empty).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 与 description 插槽', () => {
        const view = render(Empty, {
            slots: { title: () => 'empty title', description: () => 'semi design' },
        });
        expect(view.container.querySelector('.semi-typography.semi-empty-title')).toHaveTextContent(/^empty title$/);
        expect(view.container.querySelector('.semi-empty .semi-empty-description')).toHaveTextContent(/^semi design$/);
    });

    it('title 字符串属性渲染标题，不落成根元素的原生 title', () => {
        const view = render(Empty, { props: { title: 'plain title' } });
        expect(view.container.querySelector('.semi-empty-title')).toHaveTextContent(/^plain title$/);
        expect(getEmpty(view.container)).not.toHaveAttribute('title');
    });

    it('title 插槽优先于 title 属性', () => {
        const view = render(Empty, { props: { title: 'plain' }, slots: { title: () => <b>rich</b> } });
        expect(view.container.querySelector('.semi-empty-title')).toHaveTextContent(/^rich$/);
    });

    it('layout 布局，默认垂直', () => {
        const view = render(() => (
            <div>
                <Empty layout="horizontal" />
                <Empty layout="vertical" />
                <Empty />
            </div>
        ));
        const [horizontal, vertical, fallback] = view.container.querySelectorAll('.semi-empty');
        expect(horizontal).toHaveClass('semi-empty-horizontal');
        expect(vertical).toHaveClass('semi-empty-vertical');
        expect(fallback).toHaveClass('semi-empty-vertical');
    });

    it('image 的插槽、URL、插画与 imageStyle', () => {
        const imageStyle = { width: '150px' };
        const view = render(() => (
            <div>
                <Empty imageStyle={imageStyle}>
                    {{
                        image: () => <div class="test-img">semi design</div>,
                    }}
                </Empty>
                <Empty imageStyle={imageStyle} image="abc" />
                <Empty imageStyle={imageStyle}>
                    {{
                        image: () => <IllustrationConstruction />,
                        darkModeImage: () => <IllustrationConstructionDark />,
                    }}
                </Empty>
            </div>
        ));
        const [nodeImage, urlImage, illustrationImage] = view.container.querySelectorAll('.semi-empty-image');
        expect(nodeImage?.querySelector('.test-img')).not.toBeNull();
        expect(nodeImage).toHaveStyle({ width: '150px' });
        expect(urlImage?.querySelector('img')).toHaveAttribute('src', 'abc');
        expect(illustrationImage?.querySelector('svg')).not.toBeNull();
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Empty: { layout: 'horizontal' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(
            () => (
                <div>
                    <Empty />
                    <Empty layout="vertical" />
                </div>
            ),
            { global }
        );
        const [fromGlobal, explicit] = view.container.querySelectorAll('.semi-empty');
        expect(fromGlobal).toHaveClass('semi-empty-horizontal');
        expect(explicit).toHaveClass('semi-empty-vertical');
    });

    it('标题不带标题语义；有图片时使用 h4 样式，无图片时使用常规字重的 h6 样式', () => {
        const view = render(() => (
            <div>
                <Empty>
                    {{
                        title: () => 'with image',
                        image: () => <i />,
                    }}
                </Empty>
                <Empty>{{ title: () => 'no image' }}</Empty>
            </div>
        ));
        const [withImage, noImage] = view.container.querySelectorAll('.semi-empty-title');
        expect(view.queryByRole('heading')).toBeNull();
        expect(withImage?.tagName).toBe('DIV');
        expect(withImage).toHaveClass('semi-typography-h4');
        expect(withImage).toHaveAttribute('x-semi-prop', 'title');
        expect(noImage?.tagName).toBe('DIV');
        expect(noImage).toHaveClass('semi-typography-h6');
        expect(noImage).toHaveStyle({ fontWeight: '400' });
    });

    it('标记插槽，并省略空插槽', async () => {
        const view = render(Empty, {
            slots: { title: () => 't', description: () => 'd', default: () => <button>action</button> },
        });
        expect(view.container.querySelector('.semi-empty-image')).toHaveAttribute('x-semi-prop', 'image,darkModeImage');
        expect(view.container.querySelector('.semi-empty-description')).toHaveAttribute('x-semi-prop', 'description');
        const footer = view.container.querySelector('.semi-empty-footer');
        expect(footer).toHaveAttribute('x-semi-prop', 'children');
        expect(footer).toContainElement(view.getByRole('button', { name: 'action' }));

        view.unmount();
        const bare = render(Empty);
        expect(bare.container.querySelector('.semi-empty-content')?.children).toHaveLength(0);
        expect(bare.container.querySelector('.semi-empty-image')?.children).toHaveLength(0);
    });

    it('空文本与 v-if 注释的插槽视为没有内容', () => {
        const view = render(Empty, {
            slots: { title: () => createTextVNode(''), description: () => [], default: () => createTextVNode('') },
        });
        expect(view.container.querySelector('.semi-empty-content')?.children).toHaveLength(0);
    });

    it('URL 图片视为装饰性图片，标题与描述承载含义', () => {
        const view = render(() => (
            <div>
                <Empty image="a.png">{{ description: () => 'nothing here' }}</Empty>
                <Empty image="b.png">
                    {{
                        description: () => <span>rich</span>,
                    }}
                </Empty>
            </div>
        ));
        const images = view.container.querySelectorAll('img');
        expect(images).toHaveLength(2);
        for (const img of images) {
            expect(img).toHaveAttribute('alt', '');
        }
    });

    it('空字符串的 image 视为没有图片', () => {
        const view = render(Empty, { props: { image: '', title: 'title' } });
        expect(view.container.querySelector('img')).toBeNull();
        expect(view.container.querySelector('.semi-empty-title')).toHaveClass('semi-typography-h6');
    });

    it('{ id } 图片渲染为 SVG sprite 引用', () => {
        const view = render(Empty, { props: { image: { id: 'sprite-empty' } } });
        const svg = view.container.querySelector('.semi-empty-image > svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg?.querySelector('use')).toHaveAttribute('href', '#sprite-empty');
    });

    it('image 插槽优先于 image 属性', () => {
        const view = render(Empty, {
            props: { image: 'a.png' },
            slots: { image: () => <i data-testid="slot" /> },
        });
        expect(view.getByTestId('slot')).toBeInTheDocument();
        expect(view.container.querySelector('img')).toBeNull();
    });

    it('data-* 属性透传到根元素', () => {
        const view = render(Empty, { attrs: { 'data-testid': 'empty-root', 'data-x': '1' } });
        expect(getEmpty(view.container)).toHaveAttribute('data-x', '1');
        expect(view.getByTestId('empty-root')).toHaveClass('semi-empty');
    });

    it('title 属性以外的原生属性落在根元素，组件 ref 的 $el 是根元素', () => {
        let instance: { $el: Element } | undefined;
        const view = render(() => <Empty id="empty-id" aria-label="no data" ref={(value) => (instance = value as typeof instance)} />);
        const root = getEmpty(view.container);
        expect(instance?.$el).toBe(root);
        expect(root).toHaveAttribute('id', 'empty-id');
        expect(root).toHaveAttribute('aria-label', 'no data');
    });

    it('默认插槽、title 与 description 各只求值一次', () => {
        const slots = {
            title: vi.fn<() => string>(() => 't'),
            description: vi.fn<() => string>(() => 'd'),
            image: vi.fn<() => VNode>(() => <i />),
            default: vi.fn<() => VNode>(() => <button>action</button>),
        };
        render(Empty, { slots });
        for (const slot of Object.values(slots)) {
            expect(slot).toHaveBeenCalledTimes(1);
        }
    });

    describe('深色模式图片', () => {
        afterEach(() => {
            document.body.removeAttribute('theme-mode');
        });

        const waitMode = async () => {
            await vi.waitFor(() => undefined);
            await nextTick();
        };

        it('body 处于深色模式时显示 darkModeImage，并跟随 theme-mode 变化', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const view = render(DarkToggle, { props: { withDark: true } });
            await waitMode();
            expect(view.getByTestId('dark')).toBeInTheDocument();
            expect(view.queryByTestId('light')).toBeNull();

            document.body.removeAttribute('theme-mode');
            await vi.waitFor(() => expect(view.getByTestId('light')).toBeInTheDocument());
            expect(view.queryByTestId('dark')).toBeNull();

            document.body.setAttribute('theme-mode', 'dark');
            await vi.waitFor(() => expect(view.getByTestId('dark')).toBeInTheDocument());
        });

        it('未提供 darkModeImage 时深色模式下保留原图', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const view = render(DarkToggle);
            await waitMode();
            expect(view.getByTestId('light')).toBeInTheDocument();
        });

        it('darkModeImage 字符串属性在深色模式下切换 URL', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const view = render(Empty, { props: { image: 'light.png', darkModeImage: 'dark.png' } });
            await vi.waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute('src', 'dark.png'));
            document.body.removeAttribute('theme-mode');
            await vi.waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute('src', 'light.png'));
        });

        it('深色模式下 #darkModeImage 插槽优先于 darkModeImage 属性', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const view = render(Empty, {
                props: { image: 'light.png', darkModeImage: 'dark.png' },
                slots: { darkModeImage: () => <i data-testid="dark-slot" /> },
            });
            await waitMode();
            expect(view.getByTestId('dark-slot')).toBeInTheDocument();
            expect(view.container.querySelector('img')).toBeNull();
        });

        it('挂载后才提供 darkModeImage 时跟随 theme-mode', async () => {
            const view = render(DarkToggle);
            await view.rerender({ withDark: true });
            document.body.setAttribute('theme-mode', 'dark');
            await vi.waitFor(() => expect(view.getByTestId('dark')).toBeInTheDocument());
        });

        it('卸载后不再响应 theme-mode', async () => {
            const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
            const view = render(DarkToggle, { props: { withDark: true } });
            await waitMode();
            disconnect.mockClear();
            view.unmount();
            expect(disconnect).toHaveBeenCalledTimes(1);
            disconnect.mockRestore();
        });

        it('服务端渲染与水合首帧输出亮色图，水合无告警，随后切到深色', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            const html = await renderToString(createSSRApp(DarkToggle, { withDark: true }));
            expect(html).toContain('data-testid="light"');
            expect(html).not.toContain('data-testid="dark"');

            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const container = document.createElement('div');
            container.innerHTML = html;
            document.body.append(container);
            const app = createSSRApp(DarkToggle, { withDark: true });
            app.mount(container);
            expect(warn).not.toHaveBeenCalled();
            await nextTick();
            expect(container.querySelector('[data-testid="dark"]')).not.toBeNull();
            app.unmount();
            container.remove();
        });
    });
});
