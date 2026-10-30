import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import Empty from '..';
import semiGlobal from '../../_utils/semi-global';
import type { EmptyProps } from '../empty';

afterEach(() => {
    document.body.removeAttribute('theme-mode');
    semiGlobal.config.overrideDefaultProps = {};
});

const query = (container: HTMLElement, selector: string) => container.querySelector(selector) as HTMLElement;

// Solid leaves empty text nodes for empty inserts, which toBeEmptyDOMElement counts
function expectEmpty(element: HTMLElement) {
    expect(element.children).toHaveLength(0);
    expect(element.textContent).toBe('');
}

// the same shape as an illustration component: an svg element
const illustration = () => <svg data-testid="illustration" />;

describe('Empty', () => {
    it('image 与 darkModeImage 的对象形式只接受 { id }', () => {
        expectTypeOf<{ id: string }>().toExtend<EmptyProps['image']>();
        expectTypeOf<{ url: string }>().not.toExtend<EmptyProps['image']>();
        expectTypeOf<{ viewBox: string }>().not.toExtend<EmptyProps['darkModeImage']>();
    });

    it('class 与 style', () => {
        const { container } = render(() => <Empty class="test" style={{ color: 'red' }} />);
        const empty = query(container, '.semi-empty');
        expect(empty).toHaveClass('test');
        expect(empty).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('description 与 title', () => {
        const { container } = render(() => <Empty title="empty title" description="semi design" />);
        expect(query(container, '.semi-typography.semi-empty-title')).toHaveTextContent(/^empty title$/);
        expect(query(container, '.semi-empty .semi-empty-description')).toHaveTextContent(/^semi design$/);
    });

    it('layout 布局', () => {
        const { container } = render(() => (
            <div>
                <Empty layout="horizontal" />
                <Empty layout="vertical" />
            </div>
        ));
        const [horizontal, vertical] = container.querySelectorAll('.semi-empty');
        expect(horizontal).toHaveClass('semi-empty-horizontal');
        expect(vertical).toHaveClass('semi-empty-vertical');
    });

    it('image 与 imageStyle', () => {
        const imgUrl = 'abc';
        const { container } = render(() => (
            <div>
                <Empty image={<div class="test-img">semi design</div>} imageStyle={{ width: '150px' }} />
                <Empty image={imgUrl} imageStyle={{ width: '150px' }} />
                <Empty darkModeImage={illustration()} image={illustration()} />
            </div>
        ));
        const [nodeImage, urlImage, illustrationImage] = container.querySelectorAll('.semi-empty-image');
        expect(nodeImage.querySelector('.test-img')).not.toBeNull();
        expect(nodeImage).toHaveStyle({ width: '150px' });
        expect(urlImage.querySelector('img')).toHaveAttribute('src', imgUrl);
        expect(illustrationImage.querySelector('svg')).not.toBeNull();
    });

    it('默认垂直布局', () => {
        const { container } = render(() => <Empty />);
        expect(query(container, '.semi-empty')).toHaveClass('semi-empty-vertical');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Empty: { layout: 'horizontal' } };
        const { container } = render(() => (
            <div>
                <Empty />
                <Empty layout="vertical" />
            </div>
        ));
        const [fromGlobal, explicit] = container.querySelectorAll('.semi-empty');
        expect(fromGlobal).toHaveClass('semi-empty-horizontal');
        expect(explicit).toHaveClass('semi-empty-vertical');
    });

    it('标题不带标题语义；有图片时使用 h4 样式，无图片时使用常规字重的 h6 样式', () => {
        const { container } = render(() => (
            <div>
                <Empty title="with image" image={<i />} />
                <Empty title="no image" />
            </div>
        ));
        const [withImage, noImage] = container.querySelectorAll('.semi-empty-title');
        expect(screen.queryByRole('heading')).toBeNull();
        expect(withImage.tagName).toBe('DIV');
        expect(withImage).toHaveClass('semi-typography-h4');
        expect(withImage).toHaveAttribute('x-semi-prop', 'title');
        expect(noImage.tagName).toBe('DIV');
        expect(noImage).toHaveClass('semi-typography-h6');
        expect(noImage).toHaveStyle({ fontWeight: '400' });
    });

    it('标记插槽，并省略空插槽', () => {
        const [filled, setFilled] = createSignal(true);
        const { container } = render(() => (
            <Empty title={filled() ? 't' : undefined} description={filled() ? 'd' : undefined}>
                {filled() ? <button>action</button> : undefined}
            </Empty>
        ));
        expect(query(container, '.semi-empty-image')).toHaveAttribute('x-semi-prop', 'image,darkModeImage');
        expect(query(container, '.semi-empty-description')).toHaveAttribute('x-semi-prop', 'description');
        const footer = query(container, '.semi-empty-footer');
        expect(footer).toHaveAttribute('x-semi-prop', 'children');
        expect(footer).toContainElement(screen.getByRole('button', { name: 'action' }));

        setFilled(false);
        expectEmpty(query(container, '.semi-empty-content'));
        expectEmpty(query(container, '.semi-empty-image'));
    });

    it('空字符串的 image 视为没有图片', () => {
        const { container } = render(() => <Empty title="title" image="" />);

        expectEmpty(query(container, '.semi-empty-image'));
        expect(query(container, '.semi-empty-title')).toHaveClass('semi-typography-h6');
    });

    it('URL 图片视为装饰性图片，标题与描述承载含义', () => {
        const { container } = render(() => (
            <div>
                <Empty description="nothing here" image="a.png" />
                <Empty description={<span>rich</span>} image="b.png" />
            </div>
        ));
        for (const img of container.querySelectorAll('img')) {
            expect(img).toHaveAttribute('alt', '');
        }
    });

    it('{ id } 图片渲染为 SVG sprite 引用', () => {
        const { container } = render(() => <Empty image={{ id: 'sprite-empty' }} />);
        const svg = query(container, '.semi-empty-image > svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg.querySelector('use')?.getAttribute('href')).toBe('#sprite-empty');
    });

    it('带 id 属性的 DOM 节点不会被当成 sprite 引用', () => {
        const { container } = render(() => <Empty image={<i id="own" data-testid="node" />} />);
        expect(screen.getByTestId('node')).toHaveAttribute('id', 'own');
        expect(container.querySelector('use')).toBeNull();
    });

    it('data-* 属性透传到根元素', () => {
        const { container } = render(() => <Empty data-testid="empty-root" data-x="1" />);
        expect(query(container, '.semi-empty')).toHaveAttribute('data-x', '1');
        expect(screen.getByTestId('empty-root')).toHaveClass('semi-empty');
    });

    describe('深色模式图片', () => {
        const dark = () => <i data-testid="dark" />;
        const light = () => <i data-testid="light" />;

        const flush = () => new Promise((resolve) => setTimeout(resolve));

        it('body 处于深色模式时显示 darkModeImage，并跟随 theme-mode 变化', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            render(() => <Empty darkModeImage={dark()} image={light()} />);
            expect(screen.getByTestId('dark')).toBeInTheDocument();
            expect(screen.queryByTestId('light')).toBeNull();

            document.body.removeAttribute('theme-mode');
            await flush();
            expect(screen.getByTestId('light')).toBeInTheDocument();
            expect(screen.queryByTestId('dark')).toBeNull();

            document.body.setAttribute('theme-mode', 'dark');
            await flush();
            expect(screen.getByTestId('dark')).toBeInTheDocument();
        });

        it('未传 darkModeImage 时深色模式下保留原图', () => {
            document.body.setAttribute('theme-mode', 'dark');
            render(() => <Empty image={light()} />);
            expect(screen.getByTestId('light')).toBeInTheDocument();
        });

        it('卸载后停止观察 theme-mode', async () => {
            const { unmount } = render(() => <Empty darkModeImage={dark()} image={light()} />);
            expect(screen.getByTestId('light')).toBeInTheDocument();
            document.body.setAttribute('theme-mode', 'dark');
            await flush();
            expect(screen.getByTestId('dark')).toBeInTheDocument();

            unmount();
            document.body.removeAttribute('theme-mode');
            await flush();
            expect(screen.queryByTestId('light')).toBeNull();
        });

        it('挂载后传入 darkModeImage 时跟随 theme-mode', async () => {
            const [withDark, setWithDark] = createSignal(false);
            render(() => <Empty darkModeImage={withDark() ? dark() : undefined} image={light()} />);
            setWithDark(true);
            document.body.setAttribute('theme-mode', 'dark');
            await flush();
            expect(screen.getByTestId('dark')).toBeInTheDocument();
        });
    });

    it('ref 指向根元素，其他属性透传给根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <Empty ref={(node) => (ref = node)} id="empty-id" aria-label="no data" />);
        const root = query(container, '.semi-empty');
        expect(ref).toBe(root);
        expect(root).toHaveAttribute('id', 'empty-id');
        expect(root).toHaveAttribute('aria-label', 'no data');
    });

    it('数字 0 的 title、description、children 照常渲染', () => {
        const { container } = render(() => (
            <Empty title={0} description={0} image={<i />}>
                {0}
            </Empty>
        ));
        expect(query(container, '.semi-empty-title')).toHaveTextContent(/^0$/);
        expect(query(container, '.semi-empty-description')).toHaveTextContent(/^0$/);
        expect(query(container, '.semi-empty-footer')).toHaveTextContent(/^0$/);
    });

    it('展开信号对象时，无关属性变化不重建图片', () => {
        const [props, setProps] = createSignal<EmptyProps>({ image: <i data-testid="img" />, title: 'a' });
        render(() => <Empty {...props()} />);
        const before = screen.getByTestId('img');
        setProps((prev) => ({ ...prev, class: 'x' }));
        expect(screen.getByTestId('img')).toBe(before);
    });
});
