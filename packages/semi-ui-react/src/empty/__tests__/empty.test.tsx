import { StrictMode, createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { EmptyProps } from '../index';

describe('Empty', () => {
    it('image 与 darkModeImage 的对象形式只接受 { id }', () => {
        expectTypeOf<{ id: string }>().toExtend<EmptyProps['image']>();
        expectTypeOf<{ url: string }>().not.toExtend<EmptyProps['image']>();
        expectTypeOf<{ viewBox: string }>().not.toExtend<EmptyProps['darkModeImage']>();
    });

    it('className 与 style', () => {
        const { container } = render(<Empty className="test" style={{ color: 'red' }} />);
        const empty = container.querySelector('.semi-empty');
        expect(empty).toHaveClass('test');
        expect(empty).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('description 与 title', () => {
        const { container } = render(<Empty title="empty title" description="semi design" />);
        expect(container.querySelector(`.semi-typography.semi-empty-title`)).toHaveTextContent(/^empty title$/);
        expect(container.querySelector(`.semi-empty .semi-empty-description`)).toHaveTextContent(/^semi design$/);
    });

    it('layout 布局', () => {
        const { container } = render(
            <div>
                <Empty layout="horizontal" />
                <Empty layout="vertical" />
            </div>
        );
        const [horizontal, vertical] = container.querySelectorAll('.semi-empty');
        expect(horizontal).toHaveClass('semi-empty-horizontal');
        expect(vertical).toHaveClass('semi-empty-vertical');
    });

    it('image 与 imageStyle', () => {
        const imgUrl = 'abc';
        const props = {
            image: <div className="test-img">semi design</div>,
            imageStyle: { width: '150px' },
        };
        const { container } = render(
            <div>
                <Empty {...props} />
                <Empty {...props} image={imgUrl} />
                <Empty {...props} darkModeImage={<IllustrationConstructionDark />} image={<IllustrationConstruction />} />
            </div>
        );
        const [nodeImage, urlImage, illustrationImage] = container.querySelectorAll('.semi-empty-image');
        expect(nodeImage.querySelector('.test-img')).not.toBeNull();
        expect(nodeImage).toHaveStyle({ width: '150px' });
        expect(urlImage.querySelector('img')).toHaveAttribute('src', imgUrl);
        expect(illustrationImage.querySelector('svg')).not.toBeNull();
    });

    it('默认垂直布局', () => {
        const { container } = render(<Empty />);
        expect(container.querySelector('.semi-empty')).toHaveClass('semi-empty-vertical');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Empty: { layout: 'horizontal' } };
        try {
            const { container } = render(
                <div>
                    <Empty />
                    <Empty layout="vertical" />
                </div>
            );
            const [fromGlobal, explicit] = container.querySelectorAll('.semi-empty');
            expect(fromGlobal).toHaveClass('semi-empty-horizontal');
            expect(explicit).toHaveClass('semi-empty-vertical');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('标题不带标题语义；有图片时使用 h4 样式，无图片时使用常规字重的 h6 样式', () => {
        const { container } = render(
            <div>
                <Empty title="with image" image={<i />} />
                <Empty title="no image" />
            </div>
        );
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
        const { container, rerender } = render(
            <Empty title="t" description="d">
                <button>action</button>
            </Empty>
        );
        expect(container.querySelector('.semi-empty-image')).toHaveAttribute('x-semi-prop', 'image,darkModeImage');
        expect(container.querySelector('.semi-empty-description')).toHaveAttribute('x-semi-prop', 'description');
        const footer = container.querySelector('.semi-empty-footer');
        expect(footer).toHaveAttribute('x-semi-prop', 'children');
        expect(footer).toContainElement(screen.getByRole('button', { name: 'action' }));

        rerender(<Empty />);
        expect(container.querySelector('.semi-empty-content')).toBeEmptyDOMElement();
        expect(container.querySelector('.semi-empty-image')).toBeEmptyDOMElement();
    });

    it('空字符串的 image 视为没有图片', () => {
        const { container } = render(<Empty title="title" image="" />);

        expect(container.querySelector('.semi-empty-image')).toBeEmptyDOMElement();
        expect(container.querySelector('.semi-empty-title')).toHaveClass('semi-typography-h6');
    });

    it('URL 图片视为装饰性图片，标题与描述承载含义', () => {
        const { container } = render(
            <div>
                <Empty description="nothing here" image="a.png" />
                <Empty description={<span>rich</span>} image="b.png" />
            </div>
        );
        for (const img of container.querySelectorAll('img')) {
            expect(img).toHaveAttribute('alt', '');
        }
    });

    it('{ id } 图片渲染为 SVG sprite 引用', () => {
        const { container } = render(<Empty image={{ id: 'sprite-empty' }} />);
        const svg = container.querySelector('.semi-empty-image > svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg.querySelector('use')).toHaveAttribute('xlink:href', '#sprite-empty');
    });

    it('data-* 属性透传到根元素', () => {
        const { container } = render(<Empty data-testid="empty-root" data-x="1" />);
        expect(container.querySelector('.semi-empty')).toHaveAttribute('data-x', '1');
        expect(screen.getByTestId('empty-root')).toHaveClass('semi-empty');
    });

    describe('深色模式图片', () => {
        afterEach(() => {
            document.body.removeAttribute('theme-mode');
        });

        it('body 处于深色模式时显示 darkModeImage，并跟随 theme-mode 变化', async () => {
            document.body.setAttribute('theme-mode', 'dark');
            render(<Empty darkModeImage={<i data-testid="dark" />} image={<i data-testid="light" />} />);
            expect(screen.getByTestId('dark')).toBeInTheDocument();
            expect(screen.queryByTestId('light')).toBeNull();

            await act(async () => {
                document.body.removeAttribute('theme-mode');
            });
            expect(screen.getByTestId('light')).toBeInTheDocument();
            expect(screen.queryByTestId('dark')).toBeNull();

            await act(async () => {
                document.body.setAttribute('theme-mode', 'dark');
            });
            expect(screen.getByTestId('dark')).toBeInTheDocument();
        });

        it('未传 darkModeImage 时深色模式下保留原图', () => {
            document.body.setAttribute('theme-mode', 'dark');
            render(<Empty image={<i data-testid="light" />} />);
            expect(screen.getByTestId('light')).toBeInTheDocument();
        });

        it('StrictMode 下跟随 theme-mode 变化，卸载后停止', async () => {
            const { unmount } = render(
                <StrictMode>
                    <Empty darkModeImage={<i data-testid="dark" />} image={<i data-testid="light" />} />
                </StrictMode>
            );
            expect(screen.getByTestId('light')).toBeInTheDocument();
            await act(async () => {
                document.body.setAttribute('theme-mode', 'dark');
            });
            expect(screen.getByTestId('dark')).toBeInTheDocument();

            unmount();
            await act(async () => {
                document.body.removeAttribute('theme-mode');
            });
        });

        it('挂载后传入 darkModeImage 时跟随 theme-mode', async () => {
            const { rerender } = render(<Empty image={<i data-testid="light" />} />);
            rerender(<Empty darkModeImage={<i data-testid="dark" />} image={<i data-testid="light" />} />);
            await act(async () => {
                document.body.setAttribute('theme-mode', 'dark');
            });
            // the class version only observed body when darkModeImage was there at mount
            expect(screen.getByTestId('dark')).toBeInTheDocument();
        });
    });

    it('ref 指向根元素，其他属性透传给根元素', () => {
        const ref = createRef<HTMLDivElement>();
        // EmptyProps does not declare the attributes forwarded to the root
        const rootAttrs = { id: 'empty-id', 'aria-label': 'no data' };
        const { container } = render(<Empty ref={ref} {...rootAttrs} />);
        const root = container.querySelector('.semi-empty');
        expect(ref.current).toBe(root);
        expect(root).toHaveAttribute('id', 'empty-id');
        expect(root).toHaveAttribute('aria-label', 'no data');
    });

    it('数字 0 的 title、description、children 照常渲染', () => {
        const { container } = render(
            <Empty title={0} description={0} image={<i />}>
                {0}
            </Empty>
        );
        expect(container.querySelector('.semi-empty-title')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-empty-description')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.semi-empty-footer')).toHaveTextContent(/^0$/);
    });
});
