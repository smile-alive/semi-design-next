import { StrictMode, createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Skeleton, { type AvatarProps, type BasicProps, type GenericProps, type ParagraphProps } from '../index';

const { Avatar, Image, Title, Button, Paragraph } = Skeleton;
const prefixCls = `${BASE_CLASS_PREFIX}-skeleton`;

describe('Skeleton', () => {
    it('Props 类型只接受有样式的取值，入口导出 BasicProps', () => {
        type Size = NonNullable<AvatarProps['size']>;
        expectTypeOf<Size>().toEqualTypeOf<'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'>();
        expectTypeOf<'default'>().not.toExtend<Size>();
        expectTypeOf<NonNullable<AvatarProps['shape']>>().toEqualTypeOf<'circle' | 'square'>();
        expectTypeOf<GenericProps>().toEqualTypeOf<AvatarProps>();
        expectTypeOf<ParagraphProps>().not.toHaveProperty('type');
        expectTypeOf<Parameters<typeof Title>[0]>().toEqualTypeOf<BasicProps>();
    });

    it('显式传入 undefined 的 type 不覆盖骨架自带的类型', () => {
        const { container } = render(
            <>
                <Avatar type={undefined} />
                <Image type={undefined} />
                <Title type={undefined} />
                <Button type={undefined} />
            </>
        );
        expect(Array.from(container.children, (el) => el.className)).toEqual([expect.stringContaining(`${prefixCls}-avatar`), `${prefixCls}-image`, `${prefixCls}-title`, `${prefixCls}-button`]);
    });

    it('基础加载态', () => {
        const { container, rerender } = render(
            <Skeleton placeholder={<Avatar />} loading>
                <div>content</div>
            </Skeleton>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton`)).not.toBeNull();
        expect(screen.queryByText('content')).toBeNull();

        rerender(
            <Skeleton placeholder={<Avatar />} loading={false}>
                <div>content</div>
            </Skeleton>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton`)).toBeNull();
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('kits 渲染', () => {
        const kits = [
            [Avatar, 'avatar'],
            [Image, 'image'],
            [Title, 'title'],
            [Button, 'button'],
            [Paragraph, 'paragraph'],
        ];
        for (const [Kit, name] of kits) {
            const { container, unmount } = render(<Kit />);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-${name}`)).not.toBeNull();
            unmount();
        }
    });

    it('加载容器标记为 busy，并对辅助技术隐藏占位块', () => {
        const { container, rerender } = render(
            <Skeleton
                placeholder={
                    <>
                        <Avatar />
                        <Title />
                        <Paragraph />
                    </>
                }
            >
                <div>content</div>
            </Skeleton>
        );
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('aria-busy', 'true');
        expect(root).not.toHaveAttribute('aria-hidden');
        for (const name of ['avatar', 'title', 'paragraph']) {
            expect(root.querySelector(`.${prefixCls}-${name}`)).toHaveAttribute('aria-hidden', 'true');
        }
        rerender(
            <Skeleton placeholder={<Avatar />} loading={false}>
                <div>content</div>
            </Skeleton>
        );
        expect(screen.getByText('content').closest('[aria-busy]')).toBeNull();
    });

    it('默认处于加载态，占位在 slot 根节点中渲染，并带有 class、style 和元素属性', () => {
        const rootAttrs = { id: 'sk', 'data-x': '1' };
        const { container } = render(
            <Skeleton {...rootAttrs} className="wrap" style={{ width: 10 }} placeholder={<Title />} active>
                <div>content</div>
            </Skeleton>
        );
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-active`, 'wrap');
        expect(root).toHaveStyle({ width: '10px' });
        expect(root).toHaveAttribute('x-semi-prop', 'placeholder');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root).toHaveAttribute('id', 'sk');
        expect(root.querySelector(`.${prefixCls}-title`)).not.toBeNull();
        expect(screen.queryByText('content')).toBeNull();
    });

    it('未设置时不激活动画', () => {
        const { container } = render(<Skeleton placeholder={<Title />} />);
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-active`);
    });

    it('avatar 默认为 medium 圆形，并接收 size 和 shape', () => {
        const { container, rerender } = render(<Avatar />);
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-avatar`, `${prefixCls}-avatar-medium`, `${prefixCls}-avatar-circle`);
        rerender(<Avatar shape="square" size="large" />);
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-avatar-large`, `${prefixCls}-avatar-square`);
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-avatar-medium`);
    });

    it('除 avatar 外的 kits 不添加 size 或 shape 类名，并透传 class、style 和元素属性', () => {
        for (const [Kit, name] of [
            [Image, 'image'],
            [Title, 'title'],
            [Button, 'button'],
        ]) {
            const kitProps = { 'data-x': '1', shape: 'square', size: 'large' };
            const { container, unmount } = render(<Kit className="kit" style={{ height: 5 }} {...(kitProps as object)} />);
            const root = container.firstElementChild;
            expect(root.tagName).toBe('DIV');
            expect(root).toHaveClass(`${prefixCls}-${name}`, 'kit');
            expect(root.className).not.toMatch(/large|square|medium|circle/);
            expect(root).toHaveStyle({ height: '5px' });
            expect(root).toHaveAttribute('data-x', '1');
            unmount();
        }
    });

    it('paragraph 默认渲染四行，并接收 rows、class 和 style', () => {
        const { container, rerender } = render(<Paragraph />);
        const list = container.firstElementChild;
        expect(list.tagName).toBe('UL');
        expect(list.querySelectorAll('li')).toHaveLength(4);
        rerender(<Paragraph className="para" style={{ width: 20 }} rows={2} />);
        expect(list.querySelectorAll('li')).toHaveLength(2);
        expect(list).toHaveClass(`${prefixCls}-paragraph`, 'para');
        expect(list).toHaveStyle({ width: '20px' });
    });

    it('StrictMode 下渲染', () => {
        const { container } = render(
            <StrictMode>
                <Skeleton
                    placeholder={
                        <>
                            <Avatar />
                            <Paragraph rows={1} />
                        </>
                    }
                    active
                />
            </StrictMode>
        );
        expect(container.querySelector(`.${prefixCls}-avatar`)).not.toBeNull();
        expect(container.querySelectorAll(`.${prefixCls}-paragraph li`)).toHaveLength(1);
    });

    it('加载时 ref 指向占位根节点，子内容显示后清空', () => {
        const ref = createRef<HTMLDivElement>();
        const { container, rerender } = render(
            <Skeleton ref={ref} placeholder={<Title />}>
                <div>content</div>
            </Skeleton>
        );
        expect(ref.current).toBe(container.firstElementChild);
        rerender(
            <Skeleton ref={ref} placeholder={<Title />} loading={false}>
                <div>content</div>
            </Skeleton>
        );
        expect(ref.current).toBeNull();
    });

    it('kit 的 ref 指向其根 div，paragraph 的 ref 指向其 ul', () => {
        for (const Kit of [Avatar, Image, Title, Button, Paragraph]) {
            const ref = createRef<HTMLDivElement & HTMLUListElement>();
            const { container, unmount } = render(<Kit ref={ref} />);
            expect(ref.current).toBe(container.firstElementChild);
            unmount();
        }
    });

    it('paragraph 把元素属性透传到 ul', () => {
        const { container } = render(<Paragraph data-x="1" aria-label="loading" />);
        const list = container.firstElementChild;
        expect(list).toHaveAttribute('data-x', '1');
        expect(list).toHaveAttribute('aria-label', 'loading');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Skeleton: { loading: false, active: true } };
        try {
            const { container, rerender } = render(
                <Skeleton placeholder={<Title />}>
                    <div>content</div>
                </Skeleton>
            );
            expect(screen.getByText('content')).toBeInTheDocument();
            rerender(
                <Skeleton placeholder={<Title />} loading>
                    <div>content</div>
                </Skeleton>
            );
            expect(container.firstElementChild).toHaveClass(`${prefixCls}-active`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
