/** @jsxImportSource vue */
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Skeleton, { SkeletonAvatar, SkeletonButton, SkeletonImage, SkeletonParagraph, SkeletonTitle, type SkeletonAvatarProps, type SkeletonBasicProps, type SkeletonParagraphProps } from '../index';

const { Avatar, Image, Title, Button, Paragraph } = Skeleton;
const prefixCls = `${BASE_CLASS_PREFIX}-skeleton`;
const content = () => <div>content</div>;

describe('Skeleton', () => {
    it('Props 类型只接受有样式的取值，入口导出 SkeletonBasicProps', () => {
        type Size = NonNullable<SkeletonAvatarProps['size']>;
        expectTypeOf<Size>().toEqualTypeOf<'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'>();
        expectTypeOf<'default'>().not.toExtend<Size>();
        expectTypeOf<NonNullable<SkeletonAvatarProps['shape']>>().toEqualTypeOf<'circle' | 'square'>();
        expectTypeOf<SkeletonParagraphProps>().not.toHaveProperty('type');
        expectTypeOf<SkeletonBasicProps>().not.toHaveProperty('size');
    });

    it('显式传入 undefined 的 type 不覆盖骨架自带的类型', () => {
        const view = render(() => (
            <>
                <Avatar type={undefined} />
                <Image type={undefined} />
                <Title type={undefined} />
                <Button type={undefined} />
            </>
        ));
        expect(Array.from(view.container.children, (el) => el.className)).toEqual([expect.stringContaining(`${prefixCls}-avatar`), `${prefixCls}-image`, `${prefixCls}-title`, `${prefixCls}-button`]);
    });

    it('type 属性替换骨架自带的类型', () => {
        const view = render(Title, { props: { type: 'custom' } });
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-custom`);
        expect(view.container.firstElementChild).not.toHaveClass(`${prefixCls}-title`);
    });

    it('基础加载态', async () => {
        const view = render(Skeleton, {
            props: { loading: true },
            slots: { placeholder: () => <Avatar />, default: content },
        });
        expect(view.container.querySelector(`.${prefixCls}`)).not.toBeNull();
        expect(view.queryByText('content')).toBeNull();

        await view.rerender({ loading: false });
        expect(view.container.querySelector(`.${prefixCls}`)).toBeNull();
        expect(view.queryByText('content')).toBeInTheDocument();
        expect(view.container.querySelector(`.${prefixCls}-avatar`)).toBeNull();

        await view.rerender({ loading: true });
        expect(view.queryByText('content')).toBeNull();
        expect(view.container.querySelector(`.${prefixCls}-avatar`)).not.toBeNull();
    });

    it('kits 渲染', () => {
        const kits = [
            [Avatar, 'avatar'],
            [Image, 'image'],
            [Title, 'title'],
            [Button, 'button'],
            [Paragraph, 'paragraph'],
        ] as const;
        for (const [Kit, name] of kits) {
            const view = render(Kit);
            expect(view.container.querySelector(`.${prefixCls}-${name}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('具名导出与静态成员是同一组件', () => {
        expect(SkeletonAvatar).toBe(Avatar);
        expect(SkeletonImage).toBe(Image);
        expect(SkeletonTitle).toBe(Title);
        expect(SkeletonButton).toBe(Button);
        expect(SkeletonParagraph).toBe(Paragraph);
    });

    it('加载容器标记为 busy，并对辅助技术隐藏占位块', async () => {
        const view = render(Skeleton, {
            slots: {
                placeholder: () => (
                    <>
                        <Avatar />
                        <Title />
                        <Paragraph />
                    </>
                ),
                default: content,
            },
        });
        const root = view.container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('aria-busy', 'true');
        expect(root).not.toHaveAttribute('aria-hidden');
        for (const name of ['avatar', 'title', 'paragraph']) {
            expect(root.querySelector(`.${prefixCls}-${name}`)).toHaveAttribute('aria-hidden', 'true');
        }
        await view.rerender({ loading: false });
        expect(view.getByText('content').closest('[aria-busy]')).toBeNull();
    });

    it('使用方传入的 aria-hidden 覆盖占位块的默认值，aria-busy 不能被关掉', () => {
        const view = render(Skeleton, {
            attrs: { 'aria-busy': 'false' },
            slots: { placeholder: () => <Title aria-hidden="false" /> },
        });
        expect(view.container.firstElementChild).toHaveAttribute('aria-busy', 'true');
        expect(view.container.querySelector(`.${prefixCls}-title`)).toHaveAttribute('aria-hidden', 'false');
    });

    it('默认处于加载态，占位在根节点中渲染，并带有 class、style 和元素属性', () => {
        const view = render(Skeleton, {
            attrs: { id: 'sk', 'data-x': '1', class: 'wrap', style: 'width: 10px' },
            props: { active: true },
            slots: { placeholder: () => <Title />, default: content },
        });
        const root = view.container.firstElementChild;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-active`, 'wrap');
        expect(root).toHaveStyle({ width: '10px' });
        expect(root).toHaveAttribute('x-semi-prop', 'placeholder');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root).toHaveAttribute('id', 'sk');
        expect(root?.querySelector(`.${prefixCls}-title`)).not.toBeNull();
        expect(view.queryByText('content')).toBeNull();
    });

    it('加载结束后丢弃 attrs，且没有 Vue 告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const view = render(Skeleton, {
            attrs: { id: 'sk', class: 'wrap', style: 'width: 10px' },
            props: { loading: false },
            slots: { default: content },
        });
        expect(view.container.querySelector('#sk')).toBeNull();
        expect(view.container.querySelector('.wrap')).toBeNull();
        expect(view.getByText('content')).not.toHaveAttribute('style');
        expect(warn).not.toHaveBeenCalled();
    });

    it('placeholder 插槽里可以放自定义元素', () => {
        const view = render(Skeleton, { slots: { placeholder: () => <span data-testid="custom" /> } });
        expect(view.getByTestId('custom')).toBeInTheDocument();
    });

    it('未设置时不激活动画', () => {
        const view = render(Skeleton, { slots: { placeholder: () => <Title /> } });
        expect(view.container.firstElementChild).not.toHaveClass(`${prefixCls}-active`);
    });

    it('avatar 默认为 medium 圆形，并接收 size 和 shape', async () => {
        const view = render(Avatar);
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-avatar`, `${prefixCls}-avatar-medium`, `${prefixCls}-avatar-circle`);
        await view.rerender({ shape: 'square', size: 'large' });
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-avatar-large`, `${prefixCls}-avatar-square`);
        expect(view.container.firstElementChild).not.toHaveClass(`${prefixCls}-avatar-medium`);
    });

    it('type 改写后的 avatar 仍带 size 与 shape 类名', () => {
        const view = render(Avatar, { props: { type: 'AVATAR', size: 'small' } });
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-AVATAR-small`, `${prefixCls}-AVATAR-circle`);
    });

    it('除 avatar 外的 kits 不添加 size 或 shape 类名，并透传 class、style 和元素属性', () => {
        for (const [Kit, name] of [
            [Image, 'image'],
            [Title, 'title'],
            [Button, 'button'],
        ] as const) {
            const view = render(Kit, { attrs: { class: 'kit', style: 'height: 5px', 'data-x': '1' } });
            const root = view.container.firstElementChild;
            expect(root?.tagName).toBe('DIV');
            expect(root).toHaveClass(`${prefixCls}-${name}`, 'kit');
            expect(root?.className).not.toMatch(/large|square|medium|circle/);
            expect(root).toHaveStyle({ height: '5px' });
            expect(root).toHaveAttribute('data-x', '1');
            view.unmount();
        }
    });

    it('paragraph 默认渲染四行，并接收 rows、class 和 style', async () => {
        const view = render(Paragraph);
        const list = view.container.firstElementChild as HTMLElement;
        expect(list.tagName).toBe('UL');
        expect(list.querySelectorAll('li')).toHaveLength(4);
        await view.rerender({ rows: 2 });
        expect(list.querySelectorAll('li')).toHaveLength(2);
        const styled = render(Paragraph, { attrs: { class: 'para', style: 'width: 20px' } });
        expect(styled.container.firstElementChild).toHaveClass(`${prefixCls}-paragraph`, 'para');
        expect(styled.container.firstElementChild).toHaveStyle({ width: '20px' });
    });

    it('paragraph 的 rows 为小数、零、负数、NaN 时不抛错', () => {
        const rows = (value: number) => {
            const view = render(Paragraph, { props: { rows: value } });
            const count = view.container.querySelectorAll('li').length;
            view.unmount();
            return count;
        };
        expect([2.5, 0, -1, Number.NaN].map(rows)).toEqual([2, 0, 0, 0]);
    });

    it('paragraph 把元素属性透传到 ul', () => {
        const view = render(Paragraph, { attrs: { 'data-x': '1', 'aria-label': 'loading' } });
        const list = view.container.firstElementChild;
        expect(list).toHaveAttribute('data-x', '1');
        expect(list).toHaveAttribute('aria-label', 'loading');
    });

    it('组件 ref 的 $el 在加载时是占位根节点', () => {
        let instance: { $el: Element } | undefined;
        const view = render(() => (
            <Skeleton ref={(value) => (instance = value as typeof instance)}>
                {{
                    placeholder: () => <Title />,
                    default: content,
                }}
            </Skeleton>
        ));
        expect(instance?.$el).toBe(view.container.firstElementChild);
    });

    it('kit 的 $el 指向其根 div，paragraph 的 $el 指向其 ul', () => {
        for (const Kit of [Avatar, Image, Title, Button, Paragraph]) {
            let instance: { $el: Element } | undefined;
            const view = render(() => <Kit ref={(value) => (instance = value as typeof instance)} />);
            expect(instance?.$el).toBe(view.container.firstElementChild);
            view.unmount();
        }
    });

    it('读取 app 的全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Skeleton: { loading: false, active: true } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Skeleton, {
            global,
            slots: { placeholder: () => <Title />, default: content },
        });
        expect(view.getByText('content')).toBeInTheDocument();
        await view.rerender({ loading: true });
        expect(view.container.firstElementChild).toHaveClass(`${prefixCls}-active`);
    });
});
